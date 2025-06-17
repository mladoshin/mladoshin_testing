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
import { PaymentDomain } from './domains/payment.domain';

export interface IPaymentsService {
  create(createPaymentDto: CreatePaymentDto): Promise<PaymentDomain>;
  findAll(): Promise<PaymentDomain[]>;
  findOne(id: string): Promise<PaymentDomain>;
  update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<PaymentDomain>;
  remove(id: string): Promise<PaymentDomain>;
}

@Injectable()
export class PaymentsService implements IPaymentsService{
  public constructor(
    @Inject('IPaymentRepo') private readonly paymentRepository: IPaymentRepo,
  ) {}

  create(createPaymentDto: CreatePaymentDto): Promise<PaymentDomain> {
    return this.paymentRepository.create(createPaymentDto);
  }

  findAll(): Promise<PaymentDomain[]> {
    return this.paymentRepository.findAll();
  }

  findOne(id: string): Promise<PaymentDomain> {
    try {
      return this.paymentRepository.findOrFailById(id);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<PaymentDomain> {
    try {
      return this.paymentRepository.update(id, updatePaymentDto);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  remove(id: string): Promise<PaymentDomain> {
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
