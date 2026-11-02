// backend/src/modules/catalog/catalog.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreatePriceSheetDto } from './dto/create-price-sheet.dto';
import { SetPriceSheetItemsDto } from './dto/price-sheet-items.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. VENDOR PRODUCT MANAGEMENT (Tenant-Scoped)
  // ==========================================

  /**
   * Add a new product to the vendor's wholesale catalog
   */
  async createProduct(vendorId: string, dto: CreateProductDto) {
    // Check for SKU collision inside this specific vendor's catalog
    const existing = await this.prisma.product.findUnique({
      where: {
        vendorId_sku: {
          vendorId,
          sku: dto.sku,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `A product with SKU "${dto.sku}" already exists in your catalog`,
      );
    }

    return this.prisma.product.create({
      data: {
        vendorId,
        sku: dto.sku,
        name: dto.name,
        category: dto.category,
        uom: dto.uom,
        moq: dto.moq,
        basePrice: dto.basePrice,
        stockQuantity: dto.stockQuantity,
      },
    });
  }

  /**
   * Get all products belonging to the logged-in vendor
   */
  async getVendorProducts(vendorId: string) {
    return this.prisma.product.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single product by ID (ensuring vendor ownership)
   */
  async getVendorProductById(vendorId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.vendorId !== vendorId) {
      throw new NotFoundException('Product not found in your catalog');
    }

    return product;
  }

  /**
   * Update an existing product
   */
  async updateProduct(
    vendorId: string,
    productId: string,
    dto: UpdateProductDto,
  ) {
    // 1. Verify ownership
    await this.getVendorProductById(vendorId, productId);

    // 2. If changing SKU, check for collisions
    if (dto.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: {
          vendorId_sku: {
            vendorId,
            sku: dto.sku,
          },
        },
      });

      if (existingSku && existingSku.id !== productId) {
        throw new ConflictException(
          `Another product with SKU "${dto.sku}" already exists in your catalog`,
        );
      }
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: dto,
    });
  }

  /**
   * Delete a product from the vendor catalog
   */
  async deleteProduct(vendorId: string, productId: string) {
    await this.getVendorProductById(vendorId, productId);

    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  // ==========================================
  // 2. VENDOR PRICE SHEET MANAGEMENT
  // ==========================================

  /**
   * Create a new custom Price Sheet (e.g. "Tier 1 VIP Lokantalar")
   */
  async createPriceSheet(vendorId: string, dto: CreatePriceSheetDto) {
    return this.prisma.priceSheet.create({
      data: {
        vendorId,
        name: dto.name,
      },
    });
  }

  /**
   * Get all price sheets for the logged-in vendor
   */
  async getVendorPriceSheets(vendorId: string) {
    return this.prisma.priceSheet.findMany({
      where: { vendorId },
      include: {
        _count: {
          select: {
            items: true,
            relationships: true, // how many restaurants use this sheet
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single price sheet with all its custom discounted items
   */
  async getPriceSheetById(vendorId: string, priceSheetId: string) {
    const sheet = await this.prisma.priceSheet.findUnique({
      where: { id: priceSheetId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        relationships: {
          include: {
            company: {
              select: { id: true, name: true, taxNumber: true },
            },
          },
        },
      },
    });

    if (!sheet || sheet.vendorId !== vendorId) {
      throw new NotFoundException('Price sheet not found');
    }

    return sheet;
  }

  /**
   * Batch set / overwrite the contracted prices for a price sheet
   */
  async setPriceSheetItems(
    vendorId: string,
    priceSheetId: string,
    dto: SetPriceSheetItemsDto,
  ) {
    // 1. Verify price sheet ownership
    await this.getPriceSheetById(vendorId, priceSheetId);

    // 2. Validate that all products in the batch belong to THIS vendor
    const productIds = dto.items.map((i) => i.productId);
    const vendorProducts = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        vendorId,
      },
      select: { id: true },
    });

    if (vendorProducts.length !== productIds.length) {
      throw new BadRequestException(
        'One or more product IDs do not exist in your catalog',
      );
    }

    // 3. Atomically overwrite the price sheet items
    return this.prisma.$transaction(async (tx) => {
      // Clear existing items in this sheet
      await tx.priceSheetItem.deleteMany({
        where: { priceSheetId },
      });

      // Insert the new batch of contracted prices
      await tx.priceSheetItem.createMany({
        data: dto.items.map((item) => ({
          priceSheetId,
          productId: item.productId,
          contractedPrice: item.contractedPrice,
        })),
      });

      return tx.priceSheet.findUnique({
        where: { id: priceSheetId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
    });
  }

  // ==========================================
  // 3. DYNAMIC PRICING ENGINE (For Buyer Restaurants)
  // ==========================================

  /**
   * Resolves dynamic pricing for a restaurant browsing a vendor's catalog.
   * If the restaurant has an assigned PriceSheet, custom prices are applied.
   * Otherwise, standard basePrice is used.
   */
  async getProductsForBuyer(vendorId: string, buyerCompanyId: string) {
    // 1. Check if the restaurant has an active contract relationship with this vendor
    const relationship = await this.prisma.vendorCustomerRelationship.findUnique({
      where: {
        vendorId_companyId: {
          vendorId,
          companyId: buyerCompanyId,
        },
      },
      include: {
        priceSheet: {
          include: {
            items: true,
          },
        },
      },
    });

    // 2. Fetch all products from this vendor
    const products = await this.prisma.product.findMany({
      where: { vendorId },
      orderBy: { name: 'asc' },
    });

    // 3. Build a fast lookup map of contracted prices (if a price sheet is assigned)
    const contractedPriceMap = new Map<string, number>();
    if (relationship?.priceSheet?.items) {
      for (const item of relationship.priceSheet.items) {
        contractedPriceMap.set(item.productId, Number(item.contractedPrice));
      }
    }

    // 4. Resolve the effective price for every product in the catalog
    return products.map((product) => {
      const basePrice = Number(product.basePrice);
      const contractedPrice = contractedPriceMap.get(product.id) ?? null;

      // The restaurant pays the custom price if negotiated, else standard wholesale basePrice
      const effectivePrice =
        contractedPrice !== null ? contractedPrice : basePrice;

      const hasDiscount = contractedPrice !== null && contractedPrice < basePrice;
      const discountPercentage = hasDiscount
        ? Math.round(((basePrice - contractedPrice) / basePrice) * 100)
        : 0;

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        uom: product.uom,
        moq: product.moq,
        stockQuantity: product.stockQuantity,
        basePrice,
        contractedPrice,
        effectivePrice, // The actual price charged at checkout!
        hasDiscount,
        discountPercentage,
      };
    });
  }

    // ==========================================
  // BUYER / PUBLIC VIEW
  // ==========================================

  /**
   * Allows buyers to browse all products offered by a specific vendor
   */
  async getProductsByVendorId(vendorId: string) {
    return this.prisma.product.findMany({
      where: { vendorId },
      orderBy: { name: 'asc' },
    });
  }
  
}