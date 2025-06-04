import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
} from '@nestjs/common';
import { IPaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentResponse } from './dto/payment-response.dto';
import { AccessLog } from 'src/common/logging/access-log.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(
    @Inject('IPaymentsService')
    private readonly paymentsService: IPaymentsService,
  ) {}

  @Post()
  @AccessLog()
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponse> {
    const payment = await this.paymentsService.create(createPaymentDto);
    return PaymentResponse.make(payment);
  }

  @Get()
  @AccessLog()
  async findAll(): Promise<PaymentResponse[]> {
    const payments = await this.paymentsService.findAll();
    return PaymentResponse.collection(payments);
  }

  @Get(':id')
  @AccessLog()
  async findOne(@Param('id') id: string): Promise<PaymentResponse> {
    const payment = await this.paymentsService.findOne(id);
    return PaymentResponse.make(payment);
  }

  @Patch(':id')
  @AccessLog()
  async update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentResponse> {
    const payment = await this.paymentsService.update(id, updatePaymentDto);
    return PaymentResponse.make(payment);
  }

  @Delete(':id')
  @AccessLog()
  async remove(@Param('id') id: string): Promise<PaymentResponse> {
    const payment = await this.paymentsService.remove(id);
    return PaymentResponse.make(payment);
  }
}
