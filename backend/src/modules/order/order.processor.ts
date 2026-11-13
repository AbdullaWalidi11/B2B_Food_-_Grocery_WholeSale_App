import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from 'bullmq';

export interface OrderJobData {
    orderId: string;
    totalAmount: number;
    companyName: string;
    vendorName: string;
}

@Processor('order-processing')
export class OrderProcessor extends WorkerHost {
    private readonly logger = new Logger(OrderProcessor.name);

    async process(job: Job<OrderJobData, any, string>): Promise<any> {
        this.logger.log(`⚡ [Worker] Starting Job #${job.id}: Processing Order ${job.data.orderId}`);

        const { orderId, totalAmount, companyName, vendorName } = job.data;

        // 1. Simulate Turkish e-Fatura / PDF Tax Invoice Generation
        this.logger.log(`📄 [Invoice] Generating official PDF tax invoice for ${companyName}...`);
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // 2. Simulate Warehouse & Vendor Notification Dispatch
        this.logger.log(`🔔 [Dispatch] Notifying ${vendorName} warehouse to prepare shipment for ${companyName} (${totalAmount.toFixed(2)} TL)`);
        await new Promise((resolve) => setTimeout(resolve, 500));

         this.logger.log(`✅ [Worker] Successfully completed Order #${orderId} processing!`);

        return {
            success: true,
            orderId,
            processedAt: new Date().toISOString(),
        }
    }
}