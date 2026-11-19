// backend/src/modules/company/dto/record-payment.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class RecordPaymentDto {
  @ApiProperty({
    example: 15000.0,
    description: 'Tahsilat / Ödeme tutarı (TRY)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({
    example: 'Garanti Bankası Havale Dekont No: 984321',
    description: 'Banka dekontu, EFT referansı veya ödeme açıklaması',
  })
  @IsOptional()
  @IsString()
  note?: string;
}