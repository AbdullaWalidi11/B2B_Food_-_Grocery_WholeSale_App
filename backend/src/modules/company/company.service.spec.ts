// backend/src/modules/company/company.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CompanyService } from './company.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CompanyService - Cari Hesap Credit Validation', () => {
  let service: CompanyService;
  let prisma: PrismaService;

  // Mocked database object
  const mockPrismaService = {
    vendorCustomerRelationship: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    buyerCompany: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    priceSheet: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks before every test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCreditAvailability', () => {
    const vendorId = 'vendor-uuid-123';
    const companyId = 'restaurant-uuid-456';

    it('should THROW BadRequestException if restaurant has no relationship with vendor', async () => {
      // Arrange: Database returns null (no Cari account exists)
      mockPrismaService.vendorCustomerRelationship.findUnique.mockResolvedValue(
        null,
      );

      // Act & Assert
      await expect(
        service.validateCreditAvailability(vendorId, companyId, 5000),
      ).rejects.toThrow(BadRequestException);

      expect(
        mockPrismaService.vendorCustomerRelationship.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          vendorId_companyId: { vendorId, companyId },
        },
      });
    });

    it('should THROW BadRequestException if order total exceeds available credit line', async () => {
      // Arrange: Credit Limit = 20,000 TL, Current Debt = 15,000 TL -> Available = 5,000 TL
      mockPrismaService.vendorCustomerRelationship.findUnique.mockResolvedValue({
        id: 'rel-1',
        vendorId,
        companyId,
        creditLimit: 20000,
        currentBalance: 15000,
      });

      // Act & Assert: Restaurant tries to place an 8,000 TL order (exceeds 5,000 TL available!)
      await expect(
        service.validateCreditAvailability(vendorId, companyId, 8000),
      ).rejects.toThrow(
        /exceeds your available credit line/i,
      );
    });

    it('should SUCCEED and return the relationship if order total is within credit line', async () => {
      // Arrange: Credit Limit = 50,000 TL, Current Debt = 10,000 TL -> Available = 40,000 TL
      const mockRelationship = {
        id: 'rel-1',
        vendorId,
        companyId,
        creditLimit: 50000,
        currentBalance: 10000,
      };
      mockPrismaService.vendorCustomerRelationship.findUnique.mockResolvedValue(
        mockRelationship,
      );

      // Act: Restaurant places a 12,000 TL order (Safe! 12,000 <= 40,000)
      const result = await service.validateCreditAvailability(
        vendorId,
        companyId,
        12000,
      );

      // Assert
      expect(result).toEqual(mockRelationship);
    });
  });
});