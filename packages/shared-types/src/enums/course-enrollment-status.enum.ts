export const CourseEnrollmentStatus = {
  NEW: "new",
  WAITING_FOR_PAYMENT: "waiting_for_payment",
  PAID: "paid",
} as const;

export type CourseEnrollmentStatus = typeof CourseEnrollmentStatus[keyof typeof CourseEnrollmentStatus];
