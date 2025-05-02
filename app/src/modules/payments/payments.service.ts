import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentRepo } from './payments.repository';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';
import { PaymentResponse } from './dto/payment-response.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  public constructor(private readonly paymentRepository: PaymentRepo) {}

  create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    return this.paymentRepository.create(createPaymentDto);
  }

  findAll(): Promise<Payment[]> {
    return this.paymentRepository.findAll();
  }

  findOne(id: string): Promise<Payment> {
    try {
      return this.paymentRepository.findOrFailById(id);
    }
 catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    try {
      return this.paymentRepository.update(id, updatePaymentDto);
    }
 catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  remove(id: string): Promise<Payment> {
    try {
      return this.paymentRepository.delete(id);
    }
 catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }
}
