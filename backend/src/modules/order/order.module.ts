// backend/src/modules/order/order.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderProcessor } from './order.processor';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    CompanyModule,
    BullModule.registerQueue({
      name: 'order-processing',
    }),
  ], // Provides CompanyService for Cari Hesap checks!
  controllers: [OrderController],
  providers: [OrderService, OrderProcessor],
  exports: [OrderService],
})
export class OrderModule {}