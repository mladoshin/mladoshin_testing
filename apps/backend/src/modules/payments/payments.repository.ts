import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  create(createPaymentDto: CreatePaymentDto): Promise<PaymentDomain>;
  update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentDomain>;
  delete(id: string): Promise<PaymentDomain>;
  findById(id: string): Promise<PaymentDomain | null>;
  findOrFailById(id: string): Promise<PaymentDomain>;
  findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<PaymentDomain | null>;
  findAllByCourse(courseId: string): Promise<PaymentDomain[]>;
  findAllByUser(userId: string): Promise<PaymentDomain[]>;
  findAll(): Promise<PaymentDomain[]>;
}

@Injectable()
export class PaymentRepo implements IPaymentRepo {
  public constructor(
    @InjectRepository(Payment)
    private readonly repository: Repository<Payment>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const payment = this.repository.create({
      user_id: createPaymentDto.userId,
      course_id: createPaymentDto.courseId,
      amount: createPaymentDto.amount,
    });
    try {
      const paymentDBEntity = await this.repository.save(payment);
      return PaymentsMapper.toDomainEntity(paymentDBEntity);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, PaymentRepo.name);
    }
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    let paymentDomainEntity = await this.findOrFailById(id);
    let paymentDBEntity: Payment;
    const updated = this.repository.merge(paymentDomainEntity as Payment, updatePaymentDto);
    try {
      paymentDBEntity = await this.repository.save(updated);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, PaymentRepo.name);
    }
    return PaymentsMapper.toDomainEntity(paymentDBEntity);
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
