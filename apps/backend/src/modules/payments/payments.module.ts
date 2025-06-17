import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './entities/payment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentRepo } from './payments.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [PaymentsController],
  providers: [
    { provide: 'IPaymentsService', useClass: PaymentsService },
    { provide: 'IPaymentRepo', useClass: PaymentRepo },
  ],
  exports: ['IPaymentsService', 'IPaymentRepo'],
})
export class PaymentsModule {}
