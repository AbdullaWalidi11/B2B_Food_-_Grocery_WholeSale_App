// backend/src/modules/company/dto/create-relationship.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateRelationshipDto {
  @ApiProperty({
    example: 'uuid-of-buyer-company',
    description: 'The ID of the restaurant / buyer company',
  })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({
    example: 50000.0,
    description: 'Total credit limit (debt cap) in TRY allowed by this vendor',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  creditLimit: number;

  @ApiProperty({
    example: 30,
    description: 'Payment terms in days (e.g. 15, 30, 45, 60)',
  })
  @IsInt()
  @IsPositive()
  netTermsDays: number;

  @ApiProperty({
    example: 'uuid-of-price-sheet',
    description: 'The price sheet assigned to this restaurant',
  })
  @IsUUID()
  @IsNotEmpty()
  priceSheetId: string;
}