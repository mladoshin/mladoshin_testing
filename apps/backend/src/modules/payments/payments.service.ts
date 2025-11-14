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
  create(createPaymentDto: CreatePaymentDto, options?: any): Promise<PaymentDomain>;
  findAll(options?: any): Promise<PaymentDomain[]>;
  findOne(id: string, options?: any): Promise<PaymentDomain>;
  update(id: string, updatePaymentDto: UpdatePaymentDto, options?: any): Promise<PaymentDomain>;
  remove(id: string, options?: any): Promise<PaymentDomain>;
}

@Injectable()
export class PaymentsService implements IPaymentsService{
  public constructor(
    @Inject('IPaymentRepo') private readonly paymentRepository: IPaymentRepo,
  ) {}

  create(createPaymentDto: CreatePaymentDto, options?: any): Promise<PaymentDomain> {
    return this.paymentRepository.create(createPaymentDto, options);
  }

  findAll(options?: any): Promise<PaymentDomain[]> {
    return this.paymentRepository.findAll(options);
  }

  findOne(id: string, options?: any): Promise<PaymentDomain> {
    try {
      return this.paymentRepository.findOrFailById(id, options);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  update(id: string, updatePaymentDto: UpdatePaymentDto, options?: any): Promise<PaymentDomain> {
    try {
      return this.paymentRepository.update(id, updatePaymentDto, options);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  remove(id: string, options?: any): Promise<PaymentDomain> {
    try {
      return this.paymentRepository.delete(id, options);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }
}
