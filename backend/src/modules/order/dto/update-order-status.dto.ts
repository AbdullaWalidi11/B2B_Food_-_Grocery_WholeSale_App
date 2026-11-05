// backend/src/modules/order/dto/update-order-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '../../../../generated/prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PROCESSING,
    description: 'New status: SUBMITTED, PROCESSING, SHIPPED, DELIVERED, or CANCELLED',
  })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}