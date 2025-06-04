import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { IPaymentRepo } from './payments.repository';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';
import { Payment } from './entities/payment.entity';

export interface IPaymentsService {
  create(createPaymentDto: CreatePaymentDto): Promise<Payment>;
  findAll(): Promise<Payment[]>;
  findOne(id: string): Promise<Payment>;
  update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment>;
  remove(id: string): Promise<Payment>;
}

@Injectable()
export class PaymentsService implements IPaymentsService{
  public constructor(
    @Inject('IPaymentRepo') private readonly paymentRepository: IPaymentRepo,
  ) {}

  create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    return this.paymentRepository.create(createPaymentDto);
  }

  findAll(): Promise<Payment[]> {
    return this.paymentRepository.findAll();
  }

  findOne(id: string): Promise<Payment> {
    try {
      return this.paymentRepository.findOrFailById(id);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    try {
      return this.paymentRepository.update(id, updatePaymentDto);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  remove(id: string): Promise<Payment> {
    try {
      return this.paymentRepository.delete(id);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }
}
