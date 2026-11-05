// backend/src/modules/order/order.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../../generated/prisma/client';

@ApiTags('Orders & Fulfillment')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ==========================================
  // 1. RESTAURANT (BUYER) ORDER ENDPOINTS
  // ==========================================

  @ApiOperation({
    summary: 'Place a wholesale order via Cari Hesap credit line (Restaurant only)',
  })
  @Roles(UserRole.BUYER_ADMIN, UserRole.BUYER_STAFF)
  @Post()
  async placeOrder(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.placeOrder(companyId, dto);
  }

  @ApiOperation({
    summary: 'Get your restaurant order history (Restaurant only)',
  })
  @Roles(UserRole.BUYER_ADMIN, UserRole.BUYER_STAFF)
  @Get('my-orders')
  async getMyOrders(@CurrentUser('companyId') companyId: string) {
    return this.orderService.getBuyerOrders(companyId);
  }

  // ==========================================
  // 2. VENDOR (DISTRIBUTOR) ORDER ENDPOINTS
  // ==========================================

  @ApiOperation({
    summary: 'View incoming orders from restaurants (Distributor only)',
  })
  @Roles(UserRole.VENDOR_ADMIN, UserRole.VENDOR_STAFF)
  @Get('vendor-orders')
  async getVendorOrders(@CurrentUser('vendorId') vendorId: string) {
    return this.orderService.getVendorOrders(vendorId);
  }

  @ApiOperation({
    summary: 'Advance order fulfillment status or cancel order (Distributor only)',
  })
  @Roles(UserRole.VENDOR_ADMIN, UserRole.VENDOR_STAFF)
  @Patch(':id/status')
  async updateOrderStatus(
    @CurrentUser('vendorId') vendorId: string,
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(vendorId, orderId, dto);
  }

  // ==========================================
  // 3. SHARED ORDER DETAIL (Tenant-Isolated)
  // ==========================================

  @ApiOperation({
    summary: 'Get single order details by ID (Tenant-isolated)',
  })
  @Get(':id')
  async getOrderById(
    @Param('id') orderId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.orderService.getOrderById(orderId, {
      vendorId: user.vendorId,
      companyId: user.companyId,
    });
  }
}