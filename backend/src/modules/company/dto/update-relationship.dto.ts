// backend/src/modules/company/dto/update-relationship.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  Min,
} from 'class-validator';

export class UpdateRelationshipDto {
  @ApiPropertyOptional({
    example: 75000.0,
    description: 'Updated credit limit in TRY',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({
    example: 45,
    description: 'Updated net terms in days',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  netTermsDays?: number;

  @ApiPropertyOptional({
    example: 'uuid-of-new-price-sheet',
    description: 'Re-assign to a different price sheet',
  })
  @IsOptional()
  @IsUUID()
  priceSheetId?: string;
}