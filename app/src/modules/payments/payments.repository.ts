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

export interface IPaymentRepo {
  create(createPaymentDto: CreatePaymentDto): Promise<Payment>;
  update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment>;
  delete(id: string): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findOrFailById(id: string): Promise<Payment>;
  findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<Payment | null>;
  findAllByCourse(courseId: string): Promise<Payment[]>;
  findAllByUser(userId: string): Promise<Payment[]>;
  findAll(): Promise<Payment[]>;
}

@Injectable()
export class PaymentRepo implements IPaymentRepo {
  public constructor(
    @InjectRepository(Payment)
    private readonly repository: Repository<Payment>,
  ) {}

  create(createPaymentDto: CreatePaymentDto) {
    const payment = this.repository.create({
      user_id: createPaymentDto.userId,
      course_id: createPaymentDto.courseId,
      amount: createPaymentDto.amount,
    });
    try {
      return this.repository.save(payment);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, PaymentRepo.name);
    }
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    let payment = await this.findOrFailById(id);
    const updated = this.repository.merge(payment, updatePaymentDto);
    try {
      payment = await this.repository.save(updated);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, PaymentRepo.name);
    }
    return payment;
  }

  findById(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: {
        user: true,
        course: true,
      },
    });
  }

  findByUserAndCourse(userId: string, courseId: string) {
    return this.repository.findOne({
      where: { user_id: userId, course_id: courseId },
      relations: {
        user: true,
        course: true,
      },
    });
  }

  findAllByCourse(courseId: string) {
    return this.repository.find({
      where: { course_id: courseId },
      relations: {
        user: true,
        course: true,
      },
    });
  }

  findAllByUser(userId: string) {
    return this.repository.find({
      where: { user_id: userId },
      relations: {
        user: true,
        course: true,
      },
    });
  }

  async findOrFailById(id: string): Promise<Payment> {
    const payment = await this.repository.findOne({
      where: { id },
    });
    if (!payment) {
      throw new RepositoryNotFoundError('Транзакция не найдена.', Payment.name);
    }
    return payment;
  }

  findAll() {
    return this.repository.find();
  }

  async delete(id: string) {
    const payment = await this.findOrFailById(id);
    const tmp = { ...payment };
    try {
      await this.repository.remove(payment);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, PaymentRepo.name);
    }
    return tmp;
  }
}
