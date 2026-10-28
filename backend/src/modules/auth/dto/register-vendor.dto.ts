import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterVendorDto {
  @ApiProperty({ example: 'Marmara Gida Toptan A.Ş.' })
  @IsString()
  @IsNotEmpty({ message: 'Vendor company name is required' })
  companyName: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty({ message: 'Tax number (Vergi No) is required' })
  taxNumber: string;

  @ApiProperty({ example: 'Kadiköy' })
  @IsString()
  @IsNotEmpty({ message: 'Tax office (Vergi Dairesi) is required' })
  taxOffice: string;

  @ApiProperty({ example: 'ahmet@marmaragida.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @ApiProperty({ example: 'Ahmet' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Yilmaz' })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}
