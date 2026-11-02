// backend/src/modules/catalog/dto/set-price-sheet-items.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class PriceSheetItemInput {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 750.00, description: 'Custom negotiated price for this product' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  contractedPrice: number;
}

export class SetPriceSheetItemsDto {
  @ApiProperty({ type: [PriceSheetItemInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceSheetItemInput)
  items: PriceSheetItemInput[];
}
