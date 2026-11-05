import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CompanyModule } from './modules/company/company.module';
import { OrderModule } from './modules/order/order.module';

@Module({
  imports: [PrismaModule, AuthModule, CatalogModule, CompanyModule, OrderModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
