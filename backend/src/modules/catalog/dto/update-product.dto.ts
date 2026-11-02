// backend/src/modules/catalog/dto/update-product.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
/**
 * PartialType automatically makes every field from CreateProductDto optional!
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
