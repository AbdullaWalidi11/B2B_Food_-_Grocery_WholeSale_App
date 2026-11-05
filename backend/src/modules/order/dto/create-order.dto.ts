import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  isUUID,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { SnapshotAddress } from 'generated/prisma/enums';

export class OrderItemDto {
  @ApiProperty({
    example: 'uuid-of-product',
    description: 'The product being purchased',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    example: 10,
    description: 'Quantity of units (must meet or exceed product MOQ)',
  })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    example: 'uuid-of-vendor',
    description: 'The distributor receiving and fulfilling this order',
  })
  @IsUUID()
  @IsNotEmpty()
  vendorId: string;

  @ApiProperty({
    enum: SnapshotAddress,
    example: SnapshotAddress.SHIPPING,
    description:
      'Deliver to company registered shipping address or billing address',
    required: false,
  })
  @IsOptional()
  @IsEnum(SnapshotAddress)
  shippingAddress?: SnapshotAddress;


  @ApiProperty({
    type: [OrderItemDto],
    description: 'List of products and quantities to purchase',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'An order must contain at least one item' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
