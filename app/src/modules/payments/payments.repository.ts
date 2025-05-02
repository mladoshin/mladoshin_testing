import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentRepo {
  public constructor(
    @InjectRepository(Payment)
    private readonly repository: Repository<Payment>,
  ) {}

  create(createPaymentDto: CreatePaymentDto) {
    const payment = this.repository.create(createPaymentDto);
    return this.repository.save(payment);
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    let payment = await this.findOrFailById(id);
    const updated = this.repository.merge(payment, updatePaymentDto);
    payment = await this.repository.save(updated);
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

  findByUserIdAndCourseId(userId: string, courseId: string) {
    return this.repository.findOne({
      where: { user_id: userId, course_id: courseId },
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
    await this.repository.remove(payment);
    return payment;
  }
}
