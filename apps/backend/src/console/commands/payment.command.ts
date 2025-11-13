import { Command, CommandRunner, Option } from 'nest-commander';
import { Inject, Injectable } from '@nestjs/common';
import { IPaymentsService } from 'src/modules/payments/payments.service';
import { CreatePaymentDto } from 'src/modules/payments/dto/create-payment.dto';
import { UpdatePaymentDto } from 'src/modules/payments/dto/update-payment.dto';

interface PaymentCreateOptions {
  amount: number;
  user_id: string;
  course_id: string;
}

@Command({ name: 'payment:list', description: 'List all payments' })
@Injectable()
export class ListPaymentsCommand extends CommandRunner {
  constructor(
    @Inject('IPaymentsService') private readonly paymentsService: IPaymentsService,
  ) {
    super();
  }

  async run(): Promise<void> {
    const payments = await this.paymentsService.findAll();
    console.table(payments, ['id', 'amount', 'user_id', 'course_id']);
  }
}

@Command({ name: 'payment:create', description: 'Create a new payment' })
@Injectable()
export class CreatePaymentCommand extends CommandRunner {
  constructor(
    @Inject('IPaymentsService') private readonly paymentsService: IPaymentsService,
  ) {
    super();
  }

  async run(
    passedParams: string[],
    options: PaymentCreateOptions,
  ): Promise<void> {
    const { amount, user_id, course_id } = options;

    if (!amount || !user_id || !course_id) {
      console.error(
        'Missing required options: --amount, --user_id, --course_id',
      );
      return;
    }

    const createPaymentDto: CreatePaymentDto = {
      amount,
      userId: user_id,
      courseId: course_id
    };

    try {
      const payment = await this.paymentsService.create(createPaymentDto);
      console.log('Payment created:', payment);
    } catch (error) {
      console.error('Error creating payment:', error.message);
    }
  }

  @Option({ flags: '--amount <amount>', description: 'Payment amount' })
  parseAmount(val: string): number {
    return parseFloat(val);
  }

  @Option({ flags: '--user_id <user_id>', description: 'User ID' })
  parseUserId(val: string): string {
    return val;
  }

  @Option({ flags: '--course_id <course_id>', description: 'Course ID' })
  parseCourseId(val: string): string {
    return val;
  }
}

interface PaymentGetOptions {
  id: string;
}

@Command({ name: 'payment:get', description: 'Get payment by ID' })
@Injectable()
export class GetPaymentCommand extends CommandRunner {
  constructor(
    @Inject('IPaymentsService') private readonly paymentsService: IPaymentsService,
  ) {
    super();
  }

  async run(
    _passedParams: string[],
    options: PaymentGetOptions,
  ): Promise<void> {
    const { id } = options;
    if (!id) {
      console.error('Missing required option: --id');
      return;
    }

    try {
      const payment = await this.paymentsService.findOne(id);
      console.log('Payment details:', payment);
    } catch (error) {
      console.error('Error retrieving payment:', error.message);
    }
  }

  @Option({ flags: '--id <id>', description: 'Payment ID' })
  parseId(val: string): string {
    return val;
  }
}

interface PaymentUpdateOptions {
  id: string;
  amount?: number;
  user_id?: string;
  course_id?: string;
}

@Command({ name: 'payment:update', description: 'Update a payment' })
@Injectable()
export class UpdatePaymentCommand extends CommandRunner {
  constructor(
    @Inject('IPaymentsService') private readonly paymentsService: IPaymentsService,
  ) {
    super();
  }

  async run(
    _passedParams: string[],
    options: PaymentUpdateOptions,
  ): Promise<void> {
    const { id, amount, user_id, course_id } = options;
    if (!id) {
      console.error('Missing required option: --id');
      return;
    }

    const updatePaymentDto: UpdatePaymentDto = {
      ...(amount !== undefined && { amount }),
      ...(user_id && { user_id }),
      ...(course_id && { course_id }),
    };

    try {
      const payment = await this.paymentsService.update(id, updatePaymentDto);
      console.log('Payment updated:', payment);
    } catch (error) {
      console.error('Error updating payment:', error.message);
    }
  }

  @Option({ flags: '--id <id>', description: 'Payment ID' })
  parseId(val: string): string {
    return val;
  }

  @Option({ flags: '--amount <amount>', description: 'Payment amount' })
  parseAmount(val: string): number {
    return parseFloat(val);
  }

  @Option({ flags: '--user_id <user_id>', description: 'User ID' })
  parseUserId(val: string): string {
    return val;
  }

  @Option({ flags: '--course_id <course_id>', description: 'Course ID' })
  parseCourseId(val: string): string {
    return val;
  }
}

interface PaymentDeleteOptions {
  id: string;
}

@Command({ name: 'payment:remove', description: 'Delete a payment' })
@Injectable()
export class RemovePaymentCommand extends CommandRunner {
  constructor(@Inject('IPaymentsService') private readonly paymentsService: IPaymentsService) {
    super();
  }

  async run(
    _passedParams: string[],
    options: PaymentDeleteOptions,
  ): Promise<void> {
    const { id } = options;
    if (!id) {
      console.error('Missing required option: --id');
      return;
    }

    try {
      await this.paymentsService.remove(id);
      console.log(`Payment with ID ${id} has been deleted.`);
    } catch (error) {
      console.error('Error deleting payment:', error.message);
    }
  }

  @Option({ flags: '--id <id>', description: 'Payment ID' })
  parseId(val: string): string {
    return val;
  }
}
