// backend/src/modules/catalog/dto/create-price-sheet.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePriceSheetDto {
  @ApiProperty({ example: 'Tier 1 Lokantalar (VIP Discount)' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
