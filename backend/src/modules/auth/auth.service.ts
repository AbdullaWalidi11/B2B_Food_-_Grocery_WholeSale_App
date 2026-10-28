// backend/src/modules/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../../generated/prisma/client';
import { RegisterVendorDto } from './dto/register-vendor.dto';
import { RegisterBuyerDto } from './dto/register-buyer.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new Vendor (Wholesale Distributor) + Vendor Admin User
   */
  async registerVendor(dto: RegisterVendorDto) {
    // 1. Check if user email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    // 2. Check if tax number already registered
    const existingVendor = await this.prisma.vendor.findUnique({
      where: { taxNumber: dto.taxNumber },
    });
    if (existingVendor) {
      throw new ConflictException('A vendor with this tax number already exists');
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 4. Create both Vendor and User in an atomic transaction
    const { vendor, user } = await this.prisma.$transaction(async (tx) => {

      const newVendor = await tx.vendor.create({
        data: {
          name: dto.companyName,
          taxNumber: dto.taxNumber,
          taxOffice: dto.taxOffice,
          isActive: false, // New vendors start inactive until approved
        },
      });

      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.VENDOR_ADMIN,
          vendorId: newVendor.id,
        },
      });

      return { vendor: newVendor, user: newUser };
    });

    const token = await this.generateToken(user);

    return {
      message: 'Vendor account registered successfully',
      vendor: { id: vendor.id, name: vendor.name },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...token,
    };
  }

  /**
   * Register a new Buyer Company (Restaurant / Lokanta) + Buyer Admin User
   */
  async registerBuyer(dto: RegisterBuyerDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const existingCompany = await this.prisma.buyerCompany.findUnique({
      where: { taxNumber: dto.taxNumber },
    });
    if (existingCompany) {
      throw new ConflictException('A company with this tax number already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const { company, user } = await this.prisma.$transaction(async (tx) => {
      const newCompany = await tx.buyerCompany.create({
        data: {
          name: dto.companyName,
          taxNumber: dto.taxNumber,
          taxOffice: dto.taxOffice,
          shippingAddress: dto.shippingAddress,
          billingAddress: dto.billingAddress,
        },
      });

      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.BUYER_ADMIN,
          companyId: newCompany.id,
        },
      });

      return { company: newCompany, user: newUser };
    });

    const token = await this.generateToken(user);

    return {
      message: 'Restaurant account registered successfully',
      company: { id: company.id, name: company.name },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...token,
    };
  }

  /**
   * Login for all roles
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { vendor: true, company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.generateToken(user);

    return {
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        vendorId: user.vendorId,
        companyId: user.companyId,
        vendorName: user.vendor?.name,
        companyName: user.company?.name,
      },
      ...token,
    };
  }

  /**
   * Helper: Signs a JWT with user and tenant info
   */
  private async generateToken(user: {
    id: string;
    email: string;
    role: UserRole;
    vendorId?: string | null;
    companyId?: string | null;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      vendorId: user.vendorId,
      companyId: user.companyId,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }
}
