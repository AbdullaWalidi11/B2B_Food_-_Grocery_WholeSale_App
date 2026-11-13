// backend/src/modules/order/order.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CompanyService } from '../company/company.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, SnapshotAddress} from 'generated/prisma/enums';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';


@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companyService: CompanyService,
    @InjectQueue('order-processing') private readonly orderQueue: Queue,
  ) {}

  // ==========================================
  // 1. PLACE ORDER (Multi-Step Transaction)
  // ==========================================

  /**
   * Places an order: Validates MOQ & stock, resolves dynamic contract pricing,
   * verifies Cari Hesap credit limit, and commits everything atomically.
   */
  async placeOrder(buyerCompanyId: string, dto: CreateOrderDto) {
    const { vendorId, items } = dto;

    // ----------------------------------------------------
    // GATE 1: Validate Products, Stock & MOQ
    // ----------------------------------------------------
    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        vendorId, // Guarantees all products belong to the specified vendor!
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'One or more products do not belong to the selected vendor or do not exist',
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Check inventory stock and Minimum Order Quantity (MOQ)
    for (const item of items) {
      const product = productMap.get(item.productId)!;

      if (item.quantity < product.moq) {
        throw new BadRequestException(
          `Product "${product.name}" requires a minimum order quantity (MOQ) of ${product.moq} units. You ordered ${item.quantity}.`,
        );
      }

      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${item.quantity}.`,
        );
      }
    }

    // ----------------------------------------------------
    // GATE 2: Resolve Dynamic Contract Pricing
    // ----------------------------------------------------
    // Check if the restaurant has an active Cari relationship and custom price sheet
    const relationship =
      await this.prisma.vendorCustomerRelationship.findUnique({
        where: {
          vendorId_companyId: {
            vendorId,
            companyId: buyerCompanyId,
          },
        },
        include: {
          priceSheet: {
            include: { items: true },
          },
        },
      });

    if (!relationship) {
      throw new BadRequestException(
        'You do not have an approved credit account with this distributor yet.',
      );
    }

    // Build custom contract price lookup map
    const contractedPriceMap = new Map<string, number>();
    if (relationship.priceSheet?.items) {
      for (const sheetItem of relationship.priceSheet.items) {
        contractedPriceMap.set(
          sheetItem.productId,
          Number(sheetItem.contractedPrice),
        );
      }
    }

    // Calculate line items with permanent price snapshots
    let totalAmount = 0;
    const orderItemsData = items.map((item) => {
      const product = productMap.get(item.productId)!;
      const basePrice = Number(product.basePrice);

      // Contract price takes priority; fallback to standard basePrice
      const priceAtPurchase =
        contractedPriceMap.get(product.id) ?? basePrice;

      const lineTotal = priceAtPurchase * item.quantity;
      totalAmount += lineTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase,
      };
    });

    // ----------------------------------------------------
    // GATE 3: Check Cari Hesap Credit Availability
    // ----------------------------------------------------
    await this.companyService.validateCreditAvailability(
      vendorId,
      buyerCompanyId,
      totalAmount,
    );

    // ----------------------------------------------------
    // GATE 4: Atomic Database Commit ($transaction)
    // ----------------------------------------------------
    return this.prisma.$transaction(async (tx) => {
      // 1. Decrement product inventory stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 2. Increase restaurant's outstanding Cari debt (currentBalance)
      await tx.vendorCustomerRelationship.update({
        where: {
          vendorId_companyId: {
            vendorId,
            companyId: buyerCompanyId,
          },
        },
        data: {
          currentBalance: {
            increment: totalAmount,
          },
        },
      });

      // 3. Create the permanent Order & OrderItems records
      const order = await tx.order.create({
        data: {
          companyId: buyerCompanyId,
          vendorId,
          status: OrderStatus.SUBMITTED,
          totalAmount,
          shippingAddress: dto.shippingAddress ?? SnapshotAddress.SHIPPING,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, uom: true },
              },
            },
          },
          company: {
            select: { id: true, name: true, shippingAddress: true },
          },
          vendor: {
            select: { id: true, name: true },
          },
        },
      });

      await this.orderQueue.add(
        'process-new-order',
        {
          orderId: order.id,
          totalAmount: Number(order.totalAmount),
          companyName: order.company.name,
          vendorName: order.vendor.name,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: true,
        }
      )

      return order;
    });
  }

  // ==========================================
  // 2. ORDER INQUIRIES & DASHBOARD VIEWS
  // ==========================================

  /**
   * For Restaurants: View their order history
   */
  async getBuyerOrders(companyId: string) {
    return this.prisma.order.findMany({
      where: { companyId },
      include: {
        vendor: {
          select: { id: true, name: true },
        },
        items: {
          include: {
            product: {
              select: { name: true, sku: true, uom: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * For Distributors: View incoming orders from restaurants
   */
  async getVendorOrders(vendorId: string) {
    return this.prisma.order.findMany({
      where: { vendorId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            taxNumber: true,
            shippingAddress: true,
          },
        },
        items: {
          include: {
            product: {
              select: { name: true, sku: true, uom: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single order by ID (with tenant isolation check)
   */
  async getOrderById(
    orderId: string,
    caller: { vendorId?: string | null; companyId?: string | null },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        company: true,
        vendor: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Tenant Isolation: Only the vendor or the buyer restaurant can view this order!
    const isVendorOwner = caller.vendorId && order.vendorId === caller.vendorId;
    const isBuyerOwner =
      caller.companyId && order.companyId === caller.companyId;

    if (!isVendorOwner && !isBuyerOwner) {
      throw new ForbiddenException(
        'You do not have permission to view this order',
      );
    }

    return order;
  }

  // ==========================================
  // 3. FULFILLMENT STATUS UPDATES (Vendor Only)
  // ==========================================

  /**
   * Advance order lifecycle status: SUBMITTED -> PROCESSING -> SHIPPED -> DELIVERED
   * If CANCELLED: Restores inventory stock and refunds Cari Hesap debt!
   */
  async updateOrderStatus(
    vendorId: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.vendorId !== vendorId) {
      throw new NotFoundException('Order not found in your incoming queue');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cancelled orders cannot be modified');
    }
    // Special Case: Order Cancellation (Rolls back stock and debt!)
    if (dto.status === OrderStatus.CANCELLED) {
      return this.prisma.$transaction(async (tx) => {
        // 1. Restore product inventory
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          });
        }
        // 2. Refund restaurant's Cari debt (decrement currentBalance)
        await tx.vendorCustomerRelationship.update({
          where: {
            vendorId_companyId: {
              vendorId,
              companyId: order.companyId,
            },
          },
          data: {
            currentBalance: {
              decrement: order.totalAmount,
            },
          },
        });
        // 3. Update order status
        return tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.CANCELLED },
        });
      });
    }
    // Standard status progression (PROCESSING, SHIPPED, DELIVERED)
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
    });
  }
}