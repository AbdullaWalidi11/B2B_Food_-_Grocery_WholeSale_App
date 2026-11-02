// backend/src/modules/catalog/catalog.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../../generated/prisma/client';

@ApiTags('Catalog & Products')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ==========================================
  // VENDOR PRODUCT ENDPOINTS (Protected)
  // ==========================================

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add a new product to your wholesale catalog (Vendor Admin only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR_ADMIN, UserRole.VENDOR_STAFF)
  @Post('products')
  async createProduct(
    @CurrentUser('vendorId') vendorId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.catalogService.createProduct(vendorId, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all products in your own catalog (Vendor only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR_ADMIN, UserRole.VENDOR_STAFF)
  @Get('my-products')
  async getMyProducts(@CurrentUser('vendorId') vendorId: string) {
    return this.catalogService.getVendorProducts(vendorId);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a single product by ID (Vendor only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR_ADMIN, UserRole.VENDOR_STAFF)
  @Get('products/:id')
  async getProductById(
    @CurrentUser('vendorId') vendorId: string,
    @Param('id') productId: string,
  ) {
    return this.catalogService.getVendorProductById(vendorId, productId);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a product (Vendor only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR_ADMIN, UserRole.VENDOR_STAFF)
  @Patch('products/:id')
  async updateProduct(
    @CurrentUser('vendorId') vendorId: string,
    @Param('id') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalogService.updateProduct(vendorId, productId, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a product from catalog (Vendor only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR_ADMIN)
  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProduct(
    @CurrentUser('vendorId') vendorId: string,
    @Param('id') productId: string,
  ) {
    return this.catalogService.deleteProduct(vendorId, productId);
  }

  // ==========================================
  // BUYER / RESTAURANT BROWSE ENDPOINT
  // ==========================================

  @ApiOperation({ summary: 'Browse all products from a specific vendor (Public / Buyer)' })
  @Get('vendor/:vendorId/products')
  async getVendorCatalog(@Param('vendorId') vendorId: string) {
    return this.catalogService.getProductsByVendorId(vendorId);
  }
}