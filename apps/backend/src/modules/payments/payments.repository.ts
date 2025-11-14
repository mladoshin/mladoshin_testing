import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentDomain } from './domains/payment.domain';
import { PaymentsMapper } from './payments.mapper';

export interface IPaymentRepo {
  create(createPaymentDto: CreatePaymentDto, options?: any): Promise<PaymentDomain>;
  update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
    options?: any,
  ): Promise<PaymentDomain>;
  delete(id: string, options?: any): Promise<PaymentDomain>;
  findById(id: string, options?: any): Promise<PaymentDomain | null>;
  findOrFailById(id: string, options?: any): Promise<PaymentDomain>;
  findByUserAndCourse(
    userId: string,
    courseId: string,
    options?: any,
  ): Promise<PaymentDomain | null>;
  findAllByCourse(courseId: string, options?: any): Promise<PaymentDomain[]>;
  findAllByUser(userId: string, options?: any): Promise<PaymentDomain[]>;
  findAll(options?: any): Promise<PaymentDomain[]>;
}

@Injectable()
export class PaymentRepo implements IPaymentRepo {
  public constructor(
    @InjectRepository(Payment)
    private readonly repository: Repository<Payment>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  private async getORMRepository(options?: any) {
    const entityManager = this.dataSource.createEntityManager();
    if (options?.schema) {
      await entityManager.query(`SET search_path TO "${options.schema}"`);
    }
    return entityManager.getRepository(Payment);
  }

  async create(createPaymentDto: CreatePaymentDto, options?: any) {
    const repository = await this.getORMRepository(options);

    const payment = repository.create({
      user_id: createPaymentDto.userId,
      course_id: createPaymentDto.courseId,
      amount: createPaymentDto.amount,
    });
    try {
      const paymentDBEntity = await repository.save(payment);
      return PaymentsMapper.toDomainEntity(paymentDBEntity);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, PaymentRepo.name);
    }
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    const paymentDomainEntity = await this.findOrFailById(id);
    const paymentDBEntity = await this.repository.findOne({ where: { id } });
    
    if (!paymentDBEntity) {
      throw new RepositoryNotFoundError('Платеж не найден.', Payment.name);
    }

    const updated = this.repository.merge(paymentDBEntity, updatePaymentDto);
    try {
      const savedPayment = await this.repository.save(updated);
      return PaymentsMapper.toDomainEntity(savedPayment);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, PaymentRepo.name);
    }
  }

  async findById(id: string) {
    const paymentDBEntity = await this.repository.findOne({
      where: { id },
      relations: {
        user: true,
        course: true,
      },
    });
    return paymentDBEntity
      ? PaymentsMapper.toDomainEntity(paymentDBEntity)
      : null;
  }

  async findByUserAndCourse(userId: string, courseId: string) {
    const paymentDBEntity = await this.repository.findOne({
      where: { user_id: userId, course_id: courseId },
      relations: {
        user: true,
        course: true,
      },
    });
    return paymentDBEntity
      ? PaymentsMapper.toDomainEntity(paymentDBEntity)
      : null;
  }

  async findAllByCourse(courseId: string) {
    const paymentDBEntities = await this.repository.find({
      where: { course_id: courseId },
      relations: {
        user: true,
        course: true,
      },
    });
    return paymentDBEntities.map((payment) =>
      PaymentsMapper.toDomainEntity(payment),
    );
  }

  async findAllByUser(userId: string) {
    const paymentDBEntities = await this.repository.find({
      where: { user_id: userId },
      relations: {
        user: true,
        course: true,
      },
    });
    return paymentDBEntities.map((payment) =>
      PaymentsMapper.toDomainEntity(payment),
    );
  }

  async findOrFailById(id: string): Promise<PaymentDomain> {
    const paymentDBEntity = await this.repository.findOne({
      where: { id },
    });
    if (!paymentDBEntity) {
      throw new RepositoryNotFoundError('Транзакция не найдена.', Payment.name);
    }
    return PaymentsMapper.toDomainEntity(paymentDBEntity);
  }

  async findAll() {
    const paymentDBEntities = await this.repository.find();
    return paymentDBEntities.map((payment) =>
      PaymentsMapper.toDomainEntity(payment),
    );
  }

  async delete(id: string) {
    const payment = await this.findOrFailById(id);
    const tmp = { ...payment };
    try {
      await this.repository.remove(payment as Payment);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, PaymentRepo.name);
    }
    return tmp;
  }
}
