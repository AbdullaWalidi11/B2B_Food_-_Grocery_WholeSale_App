// backend/src/modules/catalog/dto/create-product.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { UnitOfMeasure } from '../../../../generated/prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'FLOUR-001', description: 'Stock Keeping Unit unique to this vendor' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 'Baklavalık Un (50 Kg Çuval)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Un & Bakliyat' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ enum: UnitOfMeasure, example: UnitOfMeasure.SACK })
  @IsEnum(UnitOfMeasure)
  uom: UnitOfMeasure;

  @ApiProperty({ example: 5, description: 'Minimum Order Quantity' })
  @IsInt()
  @Min(1)
  moq: number;

  @ApiProperty({ example: 850.50, description: 'Default wholesale price in TRY' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  basePrice: number;

  @ApiProperty({ example: 200, description: 'Available stock units' })
  @IsInt()
  @Min(0)
  stockQuantity: number;
}
