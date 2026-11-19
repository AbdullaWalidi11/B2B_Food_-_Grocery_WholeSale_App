import { Controller, Post, Get, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CompanyService } from "./company.service";
import { CreateRelationshipDto } from "./dto/create-relationship.dto";
import { UpdateRelationshipDto } from "./dto/update-relationship.dto";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { UserRole } from "generated/prisma/enums";
import { RecordPaymentDto } from "./dto/record-payment.dto";
import { get } from "http";


@ApiTags('Company & Cari Hesap')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company')
export class CompanyController {
    constructor(private readonly companyService: CompanyService) {}

  
 @ApiOperation({
    summary: 'Browse registered restaurants on the platform (Vendors only)',
  })
  @Roles(UserRole.VENDOR_ADMIN, UserRole.VENDOR_STAFF)
  @Get('buyers')
  async getAllBuyers() {
    return this.companyService.getAllBuyerCompanies();
  }

  @ApiOperation({
    summary: 'Establish a new Cari Hesap customer relationship with credit terms (Vendor Admin only)'
  })
  @Roles(UserRole.VENDOR_ADMIN)
  @Post('relationships')
  async createRelationship(
    @CurrentUser('vendorId') vendorId: string,
    @Body() dto: CreateRelationshipDto,
  ) {
    return this.companyService.createRelationship(vendorId, dto);
  }

  @ApiOperation({
    summary: 'Get your restaurant customer portfolio with live available credit (Vendor only)'
  })
  @Roles(UserRole.VENDOR_ADMIN, UserRole.VENDOR_STAFF)
  @Get('my-customers')
  async getMyCustomers(@CurrentUser('vendorId') vendorId: string) {
    return this.companyService.getVendorCustomers(vendorId);
  }

  @ApiOperation({
    summary: 'Update credit limit, net terms or price sheet for a customer (Vendor Admin only)'
  })
  @Roles(UserRole.VENDOR_ADMIN)
  @Patch('relationship/:id')
  async updateRelationshipId(
    @CurrentUser('vendorId') vendorId: string,
    @Param('id') relationshipId: string,
    @Body() dto: UpdateRelationshipDto,
  ) {
    return this.companyService.updateRelationship(vendorId, relationshipId, dto);
  }


    @ApiOperation({
    summary: 'Record a debt settlement / payment receipt from a restaurant (Vendor Admin only)',
  })
  @Roles(UserRole.VENDOR_ADMIN, UserRole.VENDOR_STAFF)
  @Post('relationship/:id/payment')
  async recordPayment(
    @CurrentUser('vendorId') vendorId: string,
    @Param('id') relationshipId: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.companyService.recordPayment(vendorId, relationshipId, dto);
  }

  @ApiOperation({
    summary: 'View your credit accounts and outstanding debts across suppliers (Restaurant only)',
  })
  @Roles(UserRole.BUYER_ADMIN, UserRole.BUYER_STAFF)
  @Get('my-vendor-accounts')
  async getMyVendorAccounts(@CurrentUser('companyId') companyId: string) {
    return this.companyService.getBuyerVendorAccounts(companyId);
  }
}