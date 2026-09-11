export type StudentStatus = 'Active' | 'Inactive' | 'Former';

export interface BatchSession {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  teacherId: string;
}

export interface Batch {
  id: string; // fallback or unique ID
  name: string;
  status: 'Active' | 'Inactive' | 'Archive' | 'Archived';
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  sessions?: BatchSession[];
  maxCapacity?: number;
  feeAmount?: number;
  discountAmount?: number;
  otherCharges?: number;
  subjects?: string[];
  weeklyClassTarget?: number;
  monthlyClassTarget?: number;
}

export interface Teacher {
  id: string;
  name: string;
  mobile: string;
  subject: string;
  status: 'Active' | 'Inactive';
  role?: 'Admin' | 'Staff' | 'Teacher' | 'Guest Teacher';
  isFounder?: boolean;
  totalBookPages?: number;
  salaryRatePerClass?: number;
  salaryRatePerPage?: number;
  bankAccount?: string;
}

export interface Exam {
  id: string;
  name: string;
  date: string;
  batch: string;
  totalMarks: number;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  obtainedMarks: number;
  date: string;
}

export interface AttendanceConfig {
  lowThreshold: number; // e.g., 75
}

export interface TeacherClassRecord {
  id: string;
  teacherId: string;
  batchId: string;
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
  pagesTaught?: number;
  isPaid?: boolean;
  sessionId?: string;
  subject?: string;
  status?: 'Completed' | 'Cancelled' | 'Absent' | 'Late';
  isTimeModifiedAtAttendance?: boolean;
}

export interface Student {
  id: string; // Auto Generate e.g., STU-001001
  name: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  guardianMobile: string;
  address: string;
  dateOfBirth?: string;
  schoolName?: string;
  fatherProfession?: string;
  favouriteSubject?: string;
  weakSubject?: string;
  batch: string;
  monthlyFee: number;
  discount: number;
  finalFee: number;
  admissionDate: string;
  endDate?: string; // New field for end date
  reactivationDate?: string; // New field for reactivation date
  batchHistory?: { batchName: string; startDate: string; endDate: string }[]; // Record of previous batches
  status: StudentStatus;
  notes: string;
  documents?: StudentDocument[];
  boardExamResult?: string;
}

export interface StudentDocument {
  id: string;
  studentId: string;
  title: string;
  type: 'id_card' | 'transcript' | 'fee_agreement' | 'other';
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string; // Base64 string
  uploadedAt: string;
  uploadedBy: string;
}

export type DiscountType = 'Manual' | 'Partial Attendance' | 'Financial Support' | 'Offer';

export interface Payment {
  id: string;
  date: string;
  month: string; // e.g., '2024-05'
  studentId: string;
  amount: number; // This is Paid Amount
  fullFee?: number;
  discount?: number;
  discountType?: DiscountType;
  due?: number;
  paymentMethod: 'Cash' | 'bKash' | 'Nagad' | 'Bank';
  receivedBy: string;
  receiptNumber: string;
  notes: string;
  editedBy?: string;
  editedAt?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  paidBy: string;
  notes: string;
}

export interface SalaryRecord {
  id: string;
  month: string; // YYYY-MM
  totalIncome: number;
  founderPool: number;
  teacherPool: number;
  totalClasses: number;
  perClassRate: number;
  isLocked: boolean;
  distributions: {
    teacherId: string;
    classesTaken: number;
    teacherSalary: number;
    founderShare: number;
    adjustmentAmount?: number;
    adjustmentNote?: string;
    totalSalary: number;
  }[];
}

export interface Attendance {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  status: 'Present' | 'Absent' | 'Late';
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'holiday' | 'exam' | 'deadline' | 'other';
  description?: string;
  batchName?: string; // e.g. "Class 9 (Science)" or "All Batches"
  createdBy?: string;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details?: string;
  timestamp: string;
  user?: string;
}

export interface RecycleBinItem {
  id: string;
  type: 'Student' | 'Teacher' | 'Batch' | 'Payment' | 'Expense' | 'Attendance' | 'TeacherClassRecord' | 'Exam' | 'ExamResult' | 'CalendarEvent';
  data: any;
  deletedAt: string;
}

export interface AppState {
  students: Student[];
  payments: Payment[];
  expenses: Expense[];
  attendance: Attendance[];
  batches: Batch[];
  teachers: Teacher[];
  teacherRecords: TeacherClassRecord[];
  salaryRecords: SalaryRecord[];
  exams: Exam[];
  examResults: ExamResult[];
  calendarEvents?: CalendarEvent[]; // Optional for backwards compatibility, we'll initialize in context
  auditLogs?: AuditLog[];
  attendanceConfig: AttendanceConfig;
  expenseCategories: string[];
  language: 'en' | 'bn';
  theme: 'light' | 'dark';
  recycleBin: RecycleBinItem[];
}
