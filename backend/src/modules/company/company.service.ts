import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateRelationshipDto } from "./dto/create-relationship.dto";
import { UpdateRelationshipDto } from "./dto/update-relationship.dto";
import { RecordPaymentDto } from "./dto/record-payment.dto";

@Injectable()
export class CompanyService {
    constructor(private readonly prisma: PrismaService) {}

    async getAllBuyerCompanies() {
        return this.prisma.buyerCompany.findMany({
            select: {
                id: true,
                name: true,
                taxNumber: true,
                taxOffice: true,
                shippingAddress: true,
                billingAddress: true,
                createdAt: true,
            },
            orderBy: {name: 'asc'}
        });
    }

    async createRelationship(vendorId: string, dto: CreateRelationshipDto) {
        const company = await this.prisma.buyerCompany.findUnique({
            where: {
                id: dto.companyId
            },
        });

        if (!company) {
            throw new NotFoundException('Restaurant / Buyer Company not found');
        }

        const priceSheet = await this.prisma.priceSheet.findUnique({
            where: {
                id: dto.priceSheetId
            },
        });

        if(!priceSheet || priceSheet.vendorId !== vendorId) {
            throw new BadRequestException('The specified price sheet does not exist in your catalog');
        }

        const existing = await this.prisma.vendorCustomerRelationship.findUnique({
            where: {
                vendorId_companyId: {
                    vendorId,
                    companyId: dto.companyId,
                },
            },
        });

        if (existing) {
            throw new ConflictException(
                'This restaurant is already registered in your customer portfolio',
            );
        }

        const relationship = await this.prisma.vendorCustomerRelationship.create({
            data: {
                vendorId,
                companyId: dto.companyId,
                creditLimit: dto.creditLimit,
                currentBalance: 0.0,
                netTermsDays: dto.netTermsDays,
                priceSheetId: dto.priceSheetId,
            },
            include: {
                company: true,
                priceSheet: {
                    select: {
                        id: true,
                        name: true
                    },
                },
            },
        });

        return {
      message: 'Customer relationship established successfully',
      relationship,
    };

 }

 async getVendorCustomers(vendorId: string) {
    const relationship = await this.prisma.vendorCustomerRelationship.findMany({
        where: {
            vendorId
        },
        include: {
            company: {
                select: {
                    id: true,
                    name: true,
                    taxNumber: true,
                    taxOffice: true,
                    shippingAddress: true,
                },
            },
            priceSheet: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        }
    });

    return relationship.map((rel) => {
        const creditLimit = Number(rel.creditLimit);
        const currentBalance = Number(rel.currentBalance);
        const availableCredit = creditLimit - currentBalance;

        return {
            id: rel.id,
            company: rel.company,
            priceSheet: rel.priceSheet,
            creditLimit,
            currentBalance,
            availableCredit,
            netTermsDays: rel.netTermsDays,
            updatedAt: rel.updatedAt, 
        }
    })
 }



 async updateRelationship(
    vendorId: string,
    relationshipId: string,
    dto: UpdateRelationshipDto
 ) {
    const relationship = await this.prisma.vendorCustomerRelationship.findUnique({
        where: {
            id: relationshipId 
        },
    });

    if (!relationship || relationship.vendorId !== vendorId) {
        throw new NotFoundException('Customer relationship not found');
    }

    if (dto.priceSheetId) {
        const sheet = await this.prisma.priceSheet.findUnique({
            where: {
                id: dto.priceSheetId
            },
        });
        if (!sheet || sheet.vendorId !== vendorId) {
        throw new BadRequestException('Invalid price sheet specified');
      }
    }

    return this.prisma.vendorCustomerRelationship.update({
      where: { id: relationshipId },
      data: {
        creditLimit: dto.creditLimit,
        netTermsDays: dto.netTermsDays,
        priceSheetId: dto.priceSheetId,
      },
      include: {
        company: true,
        priceSheet: {
          select: { id: true, name: true },
        },
      },
    });

 }

 async getBuyerVendorAccounts(companyId: string) {
    const relationships = await this.prisma.vendorCustomerRelationship.findMany({
       where: {
        companyId
       },
       include: {
        vendor: {
            select: {
                id: true,
                name: true,
                taxNumber: true,
            },
        },
        priceSheet: {
            select: {
                id: true,
                name: true,
          },
        },
       },
       orderBy: {
        createdAt: 'desc'
       },
    });

    return relationships.map((rel) => {
      const creditLimit = Number(rel.creditLimit);
      const currentBalance = Number(rel.currentBalance);
      const availableCredit = creditLimit - currentBalance;

      return {
        relationshipId: rel.id,
        vendor: rel.vendor,
        priceSheetName: rel.priceSheet.name,
        creditLimit,
        currentBalance, // Outstanding unpaid debt to this vendor
        availableCredit,
        netTermsDays: rel.netTermsDays,
      };
    });
 }


   /**
   * Record a payment / debt settlement from a restaurant customer (Vendor Admin only)
   * Decrements currentBalance and replenishes available credit line.
   */
  async recordPayment(
    vendorId: string,
    relationshipId: string,
    dto: RecordPaymentDto,
  ) {
    const relationship = await this.prisma.vendorCustomerRelationship.findUnique({
      where: { id: relationshipId },
      include: { company: true },
    });

    if (!relationship || relationship.vendorId !== vendorId) {
      throw new NotFoundException('Customer relationship not found');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Tahsilat tutarı sıfırdan büyük olmalıdır');
    }

    const currentBalance = Number(relationship.currentBalance);
    // Debt balance cannot drop below zero
    const newBalance = Math.max(0, currentBalance - dto.amount);

    const updated = await this.prisma.vendorCustomerRelationship.update({
      where: { id: relationshipId },
      data: {
        currentBalance: newBalance,
      },
      include: {
        company: true,
        priceSheet: {
          select: { id: true, name: true },
        },
      },
    });

    const creditLimit = Number(updated.creditLimit);
    const updatedBalance = Number(updated.currentBalance);

    return {
      message: 'Tahsilat başarıyla işlendi ve cari bakiye güncellendi.',
      relationship: {
        id: updated.id,
        company: updated.company,
        priceSheet: updated.priceSheet,
        creditLimit,
        currentBalance: updatedBalance,
        availableCredit: creditLimit - updatedBalance,
        netTermsDays: updated.netTermsDays,
        updatedAt: updated.updatedAt,
      },
    };
  }


async validateCreditAvailability(
    vendorId: string,
    companyId: string,
    orderTotal: number,
) {
    const relationship = await this.prisma.vendorCustomerRelationship.findUnique({
        where: {
            vendorId_companyId: {
                vendorId,
                companyId,
            }
        },

    });

    if(!relationship) {
        throw new BadRequestException('You do not have an approved credit account with this vendor yet. Please contact the vendor.');
    }

    const creditLimit = Number(relationship.creditLimit);
    const currentBalance = Number(relationship.currentBalance);
    const availableCredit = creditLimit - currentBalance;

    if (orderTotal > availableCredit) {
      throw new BadRequestException(
        `Order total (${orderTotal.toFixed(2)} TL) exceeds your available credit line (${availableCredit.toFixed(2)} TL). Outstanding balance: ${currentBalance.toFixed(2)} TL / Limit: ${creditLimit.toFixed(2)} TL.`,
      );
    }

    return relationship;

}
 



}