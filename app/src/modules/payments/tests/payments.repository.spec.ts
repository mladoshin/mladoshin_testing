import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { User, UserRole } from 'src/modules/users/entities/user.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { PaymentRepo } from '../payments.repository';
import { CreatePaymentDto } from '../dto/create-payment.dto';

describe('PaymentRepo', () => {
  let paymentRepo: PaymentRepo;
  let userRepository: Repository<User>;
  let courseRepository: Repository<Course>;
  let dataSource: DataSource;
  let userId: string;
  let courseId: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          synchronize: true,
          entities: [Payment, User, Course, UserProfile, CourseLesson],
        }),
        TypeOrmModule.forFeature([Payment, User, Course]),
      ],
      providers: [PaymentRepo],
    }).compile();

    paymentRepo = module.get<PaymentRepo>(PaymentRepo);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    courseRepository = module.get<Repository<Course>>(
      getRepositoryToken(Course),
    );
    dataSource = module.get<DataSource>(DataSource);

    // Create mock user
    const user = userRepository.create({
      email: 'test@user.com',
      password: 'password',
      role: UserRole.USER,
      profile: {
        first_name: 'Maxim',
        last_name: 'Ladoshin',
      },
    });
    const savedUser = await userRepository.save(user);
    userId = savedUser.id; // Save the user ID for later use

    // Create mock course
    const course = courseRepository.create({
        name: 'Test Course',
      price: 100,
      date_finish: '2025-01-01T18:37:00',
      date_start: '2025-01-01T18:37:00',
    });

    const savedCourse = await courseRepository.save(course);
    courseId = savedCourse.id; // Save the course ID for later use
  });

  it('should be defined', () => {
    expect(paymentRepo).toBeDefined();
  });

  it('should create a payment successfully', async () => {
    const createPaymentDto: CreatePaymentDto = {
      amount: 100,
      user_id: userId, // Use actual user ID here
      course_id: courseId, // Use actual course ID here
    };

    // Save to DB
    const savedPayment = await paymentRepo.create(createPaymentDto);

    expect(savedPayment).toHaveProperty('id');
    expect(savedPayment.amount).toBe((createPaymentDto as any).amount);
    expect(savedPayment.user_id).toBe(userId); // Ensure the user ID matches
    expect(savedPayment.course_id).toBe(courseId); // Ensure the course ID matches
  });

  it('should find a payment by user and course', async () => {
    const createPaymentDto: CreatePaymentDto = {
      amount: 100,
      user_id: userId, // Use actual user ID here
      course_id: courseId, // Use actual course ID here
    };

    // Save to DB
    const savedPayment = await paymentRepo.create(createPaymentDto);

    // Fetch payment by user_id and course_id
    const foundPayment = await paymentRepo.findByUserIdAndCourseId(
      userId,
      courseId,
    );
    expect(foundPayment?.id).toEqual(savedPayment.id);
    expect(foundPayment?.course_id).toEqual(savedPayment.course_id);
    expect(foundPayment?.user_id).toEqual(savedPayment.user_id);

  });

  it('should fail to find a payment by invalid user and course', async () => {
    const foundPayment = await paymentRepo.findByUserIdAndCourseId(
      'invalid-id',
      'invalid-course-id',
    );
    expect(foundPayment).toBeNull();
  });

  it('should delete a payment successfully', async () => {
    const createPaymentDto: CreatePaymentDto = {
      amount: 100,
      user_id: userId, // Use actual user ID here
      course_id: courseId, // Use actual course ID here
    };

    // Save to DB
    const savedPayment = await paymentRepo.create(createPaymentDto);

    // Delete the payment
    const deletedPayment = await paymentRepo.delete(savedPayment.id);
    console.log(deletedPayment)

    expect(deletedPayment).toHaveProperty('id');
    expect(deletedPayment.id).toBe(savedPayment.id);
  });

  afterEach(async () => {
    // Cleanup DB after each test
    await dataSource.query('DELETE FROM payment');
    await dataSource.query('DELETE FROM user');
    await dataSource.query('DELETE FROM course');
  });
});
