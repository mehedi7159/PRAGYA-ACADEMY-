import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppState, Student, Payment, Expense, Attendance, Teacher, TeacherClassRecord, SalaryRecord, Exam, ExamResult, CalendarEvent, AuditLog } from '../types';
import { uploadToCloud } from '../lib/cloudSync';
import { auth } from '../lib/firebase';

const demoEvents: CalendarEvent[] = [
  {
    id: 'EVT-26001',
    title: 'Tuition Payment Deadline',
    date: '2026-06-10',
    type: 'deadline',
    description: 'Ensure monthly tuition forms and payment updates are processed by parents.',
    batchName: 'All Batches',
    createdBy: 'System Admin',
    createdAt: '2026-06-01'
  },
  {
    id: 'EVT-26002',
    title: 'Mid-Term Examination (Class 9)',
    date: '2026-06-18',
    type: 'exam',
    description: 'Special science and math diagnostic evaluations planned.',
    batchName: 'Class 9 (Science)',
    createdBy: 'Staff Academic',
    createdAt: '2026-06-01'
  },
  {
    id: 'EVT-26003',
    title: 'Summer Vacation Break',
    date: '2026-06-25',
    type: 'holiday',
    description: 'Pragya Academy closed for standard heatwave/summer vacations.',
    batchName: 'All Batches',
    createdBy: 'Principal Office',
    createdAt: '2026-06-01'
  }
];

const defaultState: AppState = {
  students: [],
  payments: [],
  expenses: [],
  attendance: [],
  batches: [
    { id: 'b1', name: 'Class 6', status: 'Active', maxCapacity: 40 },
    { id: 'b2', name: 'Class 7', status: 'Active', maxCapacity: 40 },
    { id: 'b3', name: 'Class 8', status: 'Active', maxCapacity: 40 },
    { id: 'b4', name: 'Class 9 (Science)', status: 'Active', maxCapacity: 50 },
    { id: 'b5', name: 'Class 10 (Science)', status: 'Active', maxCapacity: 50 },
    { id: 'b6', name: 'HSC 1st Year', status: 'Active', maxCapacity: 60 },
    { id: 'b7', name: 'HSC 2nd Year', status: 'Active', maxCapacity: 60 }
  ],
  teachers: [],
  teacherRecords: [],
  salaryRecords: [],
  exams: [],
  examResults: [],
  calendarEvents: demoEvents,
  auditLogs: [],
  attendanceConfig: { lowThreshold: 75 },
  expenseCategories: ['Teacher Salary', 'Rent', 'Electricity', 'Internet', 'Furniture', 'Snacks', 'Others'],
  language: 'en',
  theme: 'light',
  recycleBin: []
};

const demoStudents: Student[] = [
  {
    id: 'STU-26001',
    name: 'Rafi Ahmed',
    fatherName: 'Kamal Ahmed',
    motherName: 'Salma Begum',
    mobile: '01711000001',
    guardianMobile: '01711000002',
    address: 'Dhaka',
    batch: 'Class 9 (Science)',
    monthlyFee: 1500,
    discount: 0,
    finalFee: 1500,
    admissionDate: '2024-01-10',
    status: 'Active',
    notes: ''
  },
  {
    id: 'STU-26002',
    name: 'Sumaiya Akter',
    fatherName: 'Jalal Uddin',
    motherName: 'Fatema Khatun',
    mobile: '01811000001',
    guardianMobile: '01811000002',
    address: 'Mirpur, Dhaka',
    batch: 'HSC 1st Year',
    monthlyFee: 2000,
    discount: 200,
    finalFee: 1800,
    admissionDate: '2024-01-15',
    status: 'Active',
    notes: 'Sibling discount'
  }
];

interface AppContextType extends AppState {
  addStudent: (student: Student) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  
  addPayment: (payment: Omit<Payment, 'id' | 'receiptNumber'>) => Payment;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  
  markAttendance: (attendance: Omit<Attendance, 'id'>) => void;
  bulkMarkAttendance: (date: string, records: { studentId: string, status: Attendance['status'] }[]) => void;
  
  addBatch: (batch: { name: string; startDate?: string; endDate?: string; status?: 'Active' | 'Inactive' | 'Archive'; maxCapacity?: number }) => void;
  updateBatch: (id: string, updates: Partial<{ name: string, status: 'Active' | 'Inactive' | 'Archive', startDate?: string, endDate?: string, maxCapacity: number, feeAmount: number, discountAmount: number, otherCharges: number }>) => void;
  removeBatch: (id: string) => void;
  
  addTeacher: (teacher: Teacher) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  
  addTeacherRecord: (record: TeacherClassRecord) => void;
  updateTeacherRecord: (id: string, updates: Partial<TeacherClassRecord>) => void;
  deleteTeacherRecord: (id: string) => void;
  
  addExpenseCategory: (category: string) => void;
  removeExpenseCategory: (category: string) => void;

  setLanguage: (lang: 'en' | 'bn') => void;
  toggleTheme: () => void;
  finalizeSalary: (record: SalaryRecord) => void;
  deleteSalaryRecord: (id: string) => void;
  
  addExam: (exam: Exam) => void;
  updateExam: (id: string, updates: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  
  addExamResult: (result: ExamResult) => void;
  updateExamResult: (id: string, updates: Partial<ExamResult>) => void;
  deleteExamResult: (id: string) => void;
  setAttendanceThreshold: (threshold: number) => void;

  auditLogs: AuditLog[];
  addAuditLog: (action: string, details?: string) => void;
  
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;

  restoreFromBin: (id: string) => void;
  permanentlyDeleteFromBin: (id: string) => void;
  emptyBin: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const STORAGE_KEY = 'coaching_management_data';
export const BACKUP_KEY = 'coaching_management_data_backup';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const backup = localStorage.getItem(BACKUP_KEY);
    
    let parsedData = null;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // More robust check: if it has any of our main keys
        const keys = ['students', 'payments', 'expenses', 'batches', 'teachers', 'attendance'];
        if (keys.some(key => parsed[key] && Array.isArray(parsed[key]))) {
          parsedData = { ...defaultState, ...parsed };
        }
      } catch (e) {
        console.error('Failed to parse saved data, trying backup');
      }
    }

    if (!parsedData && backup) {
      try {
        const parsedBackup = JSON.parse(backup);
        const keys = ['students', 'payments', 'expenses', 'batches', 'teachers', 'attendance'];
        if (keys.some(key => parsedBackup[key] && Array.isArray(parsedBackup[key]))) {
          console.log('Restored from automatic backup');
          parsedData = parsedBackup;
        }
      } catch (e) {
        console.error('Failed to parse backup data');
      }
    }

    if (parsedData) {
      // Migrate legacy string array batches
      if (parsedData.batches && parsedData.batches.length > 0 && typeof parsedData.batches[0] === 'string') {
        parsedData.batches = parsedData.batches.map((b: string) => ({ id: `batch-${Date.now()}-${Math.random()}`, name: b, status: 'Active' }));
      }
      
      // Create a backup of the successfully loaded state
      
      // Wipe all teachers
      if (localStorage.getItem('teachers_wiped_v2') !== 'true') {
        parsedData.teachers = [];
        parsedData.teacherRecords = [];
        parsedData.salaryRecords = [];
        localStorage.setItem('teachers_wiped_v2', 'true');
      }
      
      // Wipe teacher records (History)
      if (localStorage.getItem('teacher_records_wiped_v4') !== 'true') {
        parsedData.teacherRecords = [];
        localStorage.setItem('teacher_records_wiped_v4', 'true');
      }
      
      // Remove attendance records from May 17-22, 2026 (inclusive)
      if (parsedData.attendance && Array.isArray(parsedData.attendance)) {
        parsedData.attendance = parsedData.attendance.filter((att: any) => {
          return !(att.date >= '2026-05-17' && att.date <= '2026-05-22');
        });
      }

      // Remove test Master Class / Extra sessions from teacher records
      if (parsedData.teacherRecords && Array.isArray(parsedData.teacherRecords)) {
        parsedData.teacherRecords = parsedData.teacherRecords.filter((rec: any) => {
          return rec.topic !== 'Master Class' && rec.subject !== 'Extra';
        });
      }

      if (!parsedData.calendarEvents || !Array.isArray(parsedData.calendarEvents)) {
        parsedData.calendarEvents = demoEvents;
      }
      
      localStorage.setItem(BACKUP_KEY, JSON.stringify(parsedData));
      return { ...defaultState, ...parsedData };
    }

    return { ...defaultState, students: demoStudents };
  });

  const uploadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const stateString = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, stateString);
    localStorage.setItem(BACKUP_KEY, stateString);

    // Apply theme
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Check if this is the initial demo state
    const isDemo = state.students.length === demoStudents.length && 
                  state.students.length > 0 &&
                  state.students[0].id === demoStudents[0].id;

    // Debounced automatic Cloud backup
    if (uploadTimeoutRef.current) clearTimeout(uploadTimeoutRef.current);
    
    // Only auto-sync if NOT demo data and authenticated
    if (!isDemo) {
      uploadTimeoutRef.current = setTimeout(async () => {
        try {
          if (auth.currentUser) {
            await uploadToCloud(stateString);
            console.log('Auto-synced to Cloud');
          }
        } catch (err) {
          console.warn('Auto-sync to cloud skipped (offline or not configured):', err);
        }
      }, 10000); // 10 seconds debounce
    }
  }, [state]);

  const generateAuditLog = (action: string, details?: string): AuditLog => ({
    id: `AL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    action,
    details,
    timestamp: new Date().toISOString(),
    user: 'Admin'
  });

  const addStudent = (student: Student) => {
    setState(s => ({ 
      ...s, 
      students: [...s.students, student],
      auditLogs: [generateAuditLog('Add Student', `Added student ${student.name} (${student.id})`), ...(s.auditLogs || [])]
    }));
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setState(s => {
      let log: AuditLog | null = null;
      
      const newStudents = s.students.map(stu => {
        if (stu.id !== id) return stu;
        let newStu = { ...stu, ...updates };

        // Handle batch change history
        if (updates.batch && updates.batch !== stu.batch) {
          const historyItem = {
            batchName: stu.batch,
            startDate: stu.admissionDate, // Simplification
            endDate: updates.endDate || new Date().toISOString().slice(0, 10),
          };
          newStu.batchHistory = [...(stu.batchHistory || []), historyItem];
          log = generateAuditLog('Batch Transfer', `Transferred ${stu.name} from ${stu.batch} to ${updates.batch}`);
        }

        // Handle status change to Inactive
        if (updates.status === 'Inactive' && stu.status === 'Active') {
          if (!newStu.endDate) {
            newStu.endDate = updates.endDate || new Date().toISOString().slice(0, 10);
          }
          log = generateAuditLog('Deactivate Student', `Deactivated student ${stu.name} (${stu.id})`);
        }

        // Handle status change to Active clearing endDate
        if (updates.status === 'Active' && stu.status === 'Inactive') {
          newStu.endDate = undefined;
          log = generateAuditLog('Reactivate Student', `Reactivated student ${stu.name} (${stu.id})`);
        }

        return newStu;
      });

      return {
        ...s,
        auditLogs: log ? [log, ...(s.auditLogs || [])] : s.auditLogs,
        students: newStudents
      };
    });
  };

  const deleteStudent = (id: string) => {
    setState(s => {
      const student = s.students.find(stu => stu.id === id);
      if (!student) return s;
      return {
        ...s,
        auditLogs: [generateAuditLog('Delete Student', `Deleted student: ${student.name} (${student.id})`), ...(s.auditLogs || [])],
        students: s.students.filter(stu => stu.id !== id),
        recycleBin: [...(s.recycleBin || []), { 
          id: `bin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
          type: 'Student', 
          data: student, 
          deletedAt: new Date().toISOString() 
        }]
      };
    });
  };

  const addPayment = (payment: Omit<Payment, 'id' | 'receiptNumber'>) => {
    const newPayment: Payment = {
      ...payment,
      id: `PAY-${Date.now()}`,
      receiptNumber: `RCP-${Math.floor(Math.random() * 900000) + 100000}`
    };
    setState(s => ({ ...s, payments: [...s.payments, newPayment] }));
    return newPayment;
  };

  const updatePayment = (id: string, updates: Partial<Payment>) => {
    setState(s => ({
      ...s,
      payments: s.payments.map(p => p.id === id ? { 
        ...p, 
        ...updates,
        editedBy: auth.currentUser?.email || 'Admin',
        editedAt: new Date().toISOString()
      } : p)
    }));
  };

  const deletePayment = (id: string) => {
    setState(s => {
      const payment = s.payments.find(p => p.id === id);
      if (!payment) return s;
      return {
        ...s,
        payments: s.payments.filter(p => p.id !== id),
        recycleBin: [...(s.recycleBin || []), { 
          id: `bin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
          type: 'Payment', 
          data: payment, 
          deletedAt: new Date().toISOString() 
        }]
      };
    });
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: `EXP-${Date.now()}`
    };
    setState(s => ({ ...s, expenses: [...s.expenses, newExpense] }));
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setState(s => ({
      ...s,
      expenses: s.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
  };

  const deleteExpense = (id: string) => {
    setState(s => {
      const expense = s.expenses.find(e => e.id === id);
      if (!expense) return s;
      return {
        ...s,
        expenses: s.expenses.filter(e => e.id !== id),
        recycleBin: [...(s.recycleBin || []), { 
          id: `bin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
          type: 'Expense', 
          data: expense, 
          deletedAt: new Date().toISOString() 
        }]
      };
    });
  };

  const markAttendance = (attendance: Omit<Attendance, 'id'>) => {
    const id = `ATT-${attendance.date}-${attendance.studentId}`;
    setState(s => {
      const existing = s.attendance.findIndex(a => a.studentId === attendance.studentId && a.date === attendance.date);
      if (existing >= 0) {
        const newAttendance = [...s.attendance];
        newAttendance[existing] = { ...attendance, id };
        return { ...s, attendance: newAttendance };
      }
      return { ...s, attendance: [...s.attendance, { ...attendance, id }] };
    });
  };

  const bulkMarkAttendance = (date: string, records: { studentId: string, status: Attendance['status'] }[]) => {
    setState(s => {
      let newAttendance = [...s.attendance];
      records.forEach(record => {
        const id = `ATT-${date}-${record.studentId}`;
        const existingIdx = newAttendance.findIndex(a => a.studentId === record.studentId && a.date === date);
        const attRecord = { id, date, studentId: record.studentId, status: record.status };
        if (existingIdx >= 0) {
          newAttendance[existingIdx] = attRecord;
        } else {
          newAttendance.push(attRecord);
        }
      });
      return { ...s, attendance: newAttendance };
    });
  };

  const addBatch = (batchData: { name: string; startDate?: string; endDate?: string; status?: 'Active' | 'Inactive' | 'Archive'; maxCapacity?: number }) => {
    setState(s => {
      if (s.batches.some(b => b.name === batchData.name)) return s;
      return { 
        ...s, 
        auditLogs: [generateAuditLog('Add Batch', `Created new batch: ${batchData.name}`), ...(s.auditLogs || [])],
        batches: [...s.batches, { 
          id: `batch-${Date.now()}`, 
          name: batchData.name, 
          startDate: batchData.startDate, 
          endDate: batchData.endDate, 
          status: batchData.status || 'Active',
          maxCapacity: batchData.maxCapacity || 50
        }] 
      };
    });
  };

  const updateBatch = (id: string, updates: Partial<{ name: string, status: 'Active' | 'Inactive' | 'Archive', startDate?: string, endDate?: string, maxCapacity: number, feeAmount: number, discountAmount: number, otherCharges: number }>) => {
    setState(s => {
      const batchToUpdate = s.batches.find(b => b.id === id);
      if (!batchToUpdate) return s;

      const newBatches = s.batches.map(b => b.id === id ? { ...b, ...updates } : b);
      let newStudents = s.students;
      let newAuditLogs = s.auditLogs || [];

      // Force archive state to cascade to active students
      if (updates.status === 'Archive' && batchToUpdate.status !== 'Archive') {
        newAuditLogs = [generateAuditLog('Archive Batch', `Archived batch: ${batchToUpdate.name}`), ...newAuditLogs];
        const archiveDate = updates.endDate || new Date().toISOString().slice(0, 10);
        newStudents = s.students.map(stu => {
          if (stu.batch === batchToUpdate.name && stu.status === 'Active') {
            return {
              ...stu,
              status: 'Inactive',
              endDate: archiveDate,
              notes: `${stu.notes || ''}\n[Archived automatically on ${archiveDate}]`.trim()
            };
          }
          return stu;
        });
      }

      // If fee structure is being updated, sync the specific batch's students
      if ('feeAmount' in updates || 'discountAmount' in updates || 'otherCharges' in updates) {
         const newFee = updates.feeAmount !== undefined ? updates.feeAmount : (batchToUpdate.feeAmount || 0);
         const newDiscount = updates.discountAmount !== undefined ? updates.discountAmount : (batchToUpdate.discountAmount || 0);
         const newOther = updates.otherCharges !== undefined ? updates.otherCharges : (batchToUpdate.otherCharges || 0);
         
         const defaultMonthlyFee = newFee + newOther;
         const calculatedFinalFee = Math.max(0, defaultMonthlyFee - newDiscount);

         newStudents = newStudents.map(stu => {
            if (stu.batch === batchToUpdate.name) {
               return {
                  ...stu,
                  monthlyFee: defaultMonthlyFee,
                  discount: newDiscount,
                  finalFee: calculatedFinalFee
               };
            }
            return stu;
         });
      }

      // If batch name is updated, we must also update student batch references
      if (updates.name && updates.name !== batchToUpdate.name) {
         newStudents = newStudents.map(stu => {
            if (stu.batch === batchToUpdate.name) {
               return { ...stu, batch: updates.name! };
            }
            return stu;
         });
      }

      return {
        ...s,
        batches: newBatches,
        students: newStudents,
        auditLogs: newAuditLogs
      };
    });
  };

  const removeBatch = (id: string) => {
    setState(s => {
      const batch = s.batches.find(b => b.id === id);
      if (!batch) return s;
      return {
        ...s,
        auditLogs: [generateAuditLog('Delete Batch', `Deleted batch: ${batch.name}`), ...(s.auditLogs || [])],
        batches: s.batches.filter(b => b.id !== id),
        recycleBin: [...(s.recycleBin || []), { 
          id: `bin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
          type: 'Batch', 
          data: batch, 
          deletedAt: new Date().toISOString() 
        }]
      };
    });
  };

  const addTeacher = (teacher: Teacher) => {
    setState(s => ({ ...s, teachers: [...s.teachers, teacher] }));
  };

  const updateTeacher = (id: string, updates: Partial<Teacher>) => {
    setState(s => ({
      ...s,
      teachers: s.teachers.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const deleteTeacher = (id: string) => {
    setState(s => {
      const teacher = s.teachers.find(t => t.id === id);
      if (!teacher) return s;
      return {
        ...s,
        teachers: s.teachers.filter(t => t.id !== id),
        teacherRecords: s.teacherRecords.filter(r => r.teacherId !== id),
        recycleBin: [...(s.recycleBin || []), { 
          id: `bin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
          type: 'Teacher', 
          data: teacher, 
          deletedAt: new Date().toISOString() 
        }]
      };
    });
  };

  const addTeacherRecord = (record: TeacherClassRecord) => {
    setState(s => ({ ...s, teacherRecords: [...s.teacherRecords, record] }));
  };

  const updateTeacherRecord = (id: string, updates: Partial<TeacherClassRecord>) => {
    setState(s => ({
      ...s,
      teacherRecords: s.teacherRecords.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };

  const deleteTeacherRecord = (id: string) => {
    setState(s => {
      const record = s.teacherRecords.find(r => r.id === id);
      if (!record) return s;
      return {
        ...s,
        teacherRecords: s.teacherRecords.filter(r => r.id !== id),
        recycleBin: [...(s.recycleBin || []), { 
          id: `bin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
          type: 'TeacherClassRecord', 
          data: record, 
          deletedAt: new Date().toISOString() 
        }]
      };
    });
  };

  const addAuditLog = (action: string, details?: string) => {
    setState(s => {
      const newLog: AuditLog = {
        id: `AL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        action,
        details,
        timestamp: new Date().toISOString(),
        user: 'Admin'
      };
      return { ...s, auditLogs: [newLog, ...(s.auditLogs || [])] };
    });
  };

  const addExpenseCategory = (category: string) => {
    setState(s => {
      if (s.expenseCategories.includes(category)) return s;
      return { ...s, expenseCategories: [...s.expenseCategories, category] };
    });
  };

  const removeExpenseCategory = (category: string) => {
    setState(s => ({
      ...s,
      expenseCategories: s.expenseCategories.filter(c => c !== category)
    }));
  };

  const setLanguage = (lang: 'en' | 'bn') => {
    setState(s => ({ ...s, language: lang }));
  };

  const toggleTheme = () => {
    setState(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }));
  };

  const addExam = (exam: Exam) => {
    setState(s => ({ ...s, exams: [...s.exams, exam] }));
  };

  const updateExam = (id: string, updates: Partial<Exam>) => {
    setState(s => ({
      ...s,
      exams: s.exams.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
  };

  const deleteExam = (id: string) => {
    setState(s => {
      const exam = s.exams.find(e => e.id === id);
      if (!exam) return s;
      return {
        ...s,
        exams: s.exams.filter(e => e.id !== id),
        recycleBin: [...(s.recycleBin || []), { 
          id: `bin-${Date.now()}`, 
          type: 'Exam', 
          data: exam, 
          deletedAt: new Date().toISOString() 
        }]
      };
    });
  };

  const addExamResult = (result: ExamResult) => {
    setState(s => ({ ...s, examResults: [...s.examResults, result] }));
  };

  const updateExamResult = (id: string, updates: Partial<ExamResult>) => {
    setState(s => ({
      ...s,
      examResults: s.examResults.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };

  const deleteExamResult = (id: string) => {
    setState(s => {
      const result = s.examResults.find(r => r.id === id);
      if (!result) return s;
      return {
        ...s,
        examResults: s.examResults.filter(r => r.id !== id),
        recycleBin: [...(s.recycleBin || []), { 
          id: `bin-${Date.now()}`, 
          type: 'ExamResult', 
          data: result, 
          deletedAt: new Date().toISOString() 
        }]
      };
    });
  };

  const setAttendanceThreshold = (threshold: number) => {
    setState(s => ({ ...s, attendanceConfig: { ...s.attendanceConfig, lowThreshold: threshold } }));
  };

  const addCalendarEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: `EVT-${Date.now()}`
    };
    setState(s => ({
      ...s,
      calendarEvents: [...(s.calendarEvents || []), newEvent]
    }));
  };

  const updateCalendarEvent = (id: string, updates: Partial<CalendarEvent>) => {
    setState(s => ({
      ...s,
      calendarEvents: (s.calendarEvents || []).map(evt => evt.id === id ? { ...evt, ...updates } : evt)
    }));
  };

  const deleteCalendarEvent = (id: string) => {
    setState(s => {
      const event = (s.calendarEvents || []).find(evt => evt.id === id);
      if (!event) return s;
      return {
        ...s,
        calendarEvents: (s.calendarEvents || []).filter(evt => evt.id !== id),
        recycleBin: [...(s.recycleBin || []), {
          id: `bin-${Date.now()}`,
          type: 'CalendarEvent',
          data: event,
          deletedAt: new Date().toISOString()
        }]
      };
    });
  };

  const finalizeSalary = (record: SalaryRecord) => {
    setState(s => {
      const existing = s.salaryRecords.findIndex(r => r.month === record.month);
      if (existing >= 0) {
        const newRecords = [...s.salaryRecords];
        newRecords[existing] = record;
        return { ...s, salaryRecords: newRecords };
      }
      return { ...s, salaryRecords: [...s.salaryRecords, record] };
    });
  };

  const deleteSalaryRecord = (id: string) => {
    setState(s => {
      const record = s.salaryRecords.find(r => r.id === id);
      if (!record) return s;
      return {
        ...s,
        salaryRecords: s.salaryRecords.filter(r => r.id !== id),
        recycleBin: [...(s.recycleBin || []), { 
          id: `bin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
          type: 'SalaryRecord', 
          data: record, 
          deletedAt: new Date().toISOString() 
        }]
      };
    });
  };

  const restoreFromBin = (id: string) => {
    setState(s => {
      const item = (s.recycleBin || []).find(i => i.id === id);
      if (!item || !item.data) return s;
      
      const newRecycleBin = (s.recycleBin || []).filter(i => i.id !== id);
      const newState = { ...s, recycleBin: newRecycleBin };

      switch (item.type) {
        case 'Student':
          return { ...newState, students: [...s.students, item.data] };
        case 'Teacher':
          return { ...newState, teachers: [...s.teachers, item.data] };
        case 'Payment':
          return { ...newState, payments: [...s.payments, item.data] };
        case 'Expense':
          return { ...newState, expenses: [...s.expenses, item.data] };
        case 'Batch':
          return { ...newState, batches: [...s.batches, item.data] };
        case 'TeacherClassRecord':
          return { ...newState, teacherRecords: [...s.teacherRecords, item.data] };
        case 'SalaryRecord':
          return { ...newState, salaryRecords: [...s.salaryRecords, item.data] };
        case 'Exam':
          return { ...newState, exams: [...s.exams, item.data] };
        case 'ExamResult':
          return { ...newState, examResults: [...s.examResults, item.data] };
        case 'CalendarEvent':
          return { ...newState, calendarEvents: [...(s.calendarEvents || []), item.data] };
        default:
          return newState;
      }
    });
  };

  const permanentlyDeleteFromBin = (id: string) => {
    setState(s => ({
      ...s,
      recycleBin: (s.recycleBin || []).filter(i => i.id !== id)
    }));
  };

  const emptyBin = () => {
    setState(s => ({
      ...s,
      recycleBin: []
    }));
  };

  return (
    <AppContext.Provider value={{
      ...state,
      auditLogs: state.auditLogs || [],
      addAuditLog,
      calendarEvents: state.calendarEvents || [],
      addCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
      addStudent, updateStudent, deleteStudent,
      addPayment, updatePayment, deletePayment,
      addExpense, updateExpense, deleteExpense,
      markAttendance, bulkMarkAttendance,
      addBatch, updateBatch, removeBatch,
      addTeacher, updateTeacher, deleteTeacher,
      addTeacherRecord, updateTeacherRecord, deleteTeacherRecord,
      addExpenseCategory, removeExpenseCategory,
      setLanguage, toggleTheme,
      finalizeSalary, deleteSalaryRecord,
      addExam, updateExam, deleteExam,
      addExamResult, updateExamResult, deleteExamResult,
      setAttendanceThreshold,
      restoreFromBin, permanentlyDeleteFromBin, emptyBin
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
