import { AppDataSource } from '../../config/data-source';
import { Payment } from '../payment/payment.entity';
import { PaymentService, paymentService as defaultPaymentService } from '../payment/payment.service';

export class SchoolAdminPaymentsService {
  constructor(
    private readonly paymentRepo = AppDataSource.getRepository(Payment),
    private readonly paymentService: PaymentService = defaultPaymentService,
  ) {}

  async getAllPayments(schoolId: string, page = 1, limit = 20) {
    const qb = this.paymentRepo.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.student', 'student')
      .where('payment.schoolId = :schoolId', { schoolId });

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('payment.createdAt', 'DESC')
      .getMany();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createPayment(schoolId: string, data: any) {
    return this.paymentService.create(schoolId, data);
  }
}

export const schoolAdminPaymentsService = new SchoolAdminPaymentsService();
