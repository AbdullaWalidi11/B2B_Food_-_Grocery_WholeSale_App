import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterBuyerDto {
  @ApiProperty({ example: 'Lezzet Lokantası' })
  @IsString()
  @IsNotEmpty({ message: 'Restaurant company name is required' })
  companyName: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @IsNotEmpty({ message: 'Tax number (Vergi No) is required' })
  taxNumber: string;

  @ApiProperty({ example: 'Beşiktaş' })
  @IsString()
  @IsNotEmpty({ message: 'Tax office (Vergi Dairesi) is required' })
  taxOffice: string;

  @ApiProperty({ example: 'Çarşı Mah. No: 12, Beşiktaş, İstanbul' })
  @IsString()
  @IsNotEmpty({ message: 'Shipping address is required' })
  shippingAddress: string;

  @ApiProperty({ example: 'Çarşı Mah. No: 12, Beşiktaş, İstanbul' })
  @IsString()
  @IsNotEmpty({ message: 'Billing address is required' })
  billingAddress: string;

  @ApiProperty({ example: 'chef@lezzetlokantasi.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @ApiProperty({ example: 'Mehmet' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Demir' })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}
