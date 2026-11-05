// backend/src/modules/order/order.module.ts
import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [CompanyModule], // Provides CompanyService for Cari Hesap checks!
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}