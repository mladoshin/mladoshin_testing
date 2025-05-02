import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentResponse } from './dto/payment-response.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponse> {
    const payment = await this.paymentsService.create(createPaymentDto);
    return PaymentResponse.make(payment);
  }

  @Get()
  async findAll(): Promise<PaymentResponse[]> {
    const payments = await this.paymentsService.findAll();
    return PaymentResponse.collection(payments);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PaymentResponse> {
    const payment = await this.paymentsService.findOne(id);
    return PaymentResponse.make(payment);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentResponse> {
    const payment = await this.paymentsService.update(id, updatePaymentDto);
    return PaymentResponse.make(payment);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<PaymentResponse> {
    const payment = await this.paymentsService.remove(id);
    return PaymentResponse.make(payment);
  }
}
