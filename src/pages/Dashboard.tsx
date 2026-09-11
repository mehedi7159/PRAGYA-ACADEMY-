import React from 'react';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, cn } from '../lib/utils';
import { 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie, 
  Legend,
  CartesianGrid
} from 'recharts';
import { 
  BarChart3,
  TrendingUp, 
  TrendingDown, 
  Users, 
  Wallet, 
  Activity, 
  CreditCard,
  Layers,
  ArrowRight,
  AlertCircle,
  Plus,
  Zap,
  CheckCircle2,
  Sparkles,
  Shield,
  Phone,
  MessageCircle,
  Save,
  FileText,
  X,
  Check,
  ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';

import { translations } from '../lib/translations';
import { getCurrentMonthStr, getPreviousMonthStr, getMonthsBetween, getYearMonthStr, getLocalDateStr } from '../lib/dateUtils';
import AcademicCalendar from '../components/AcademicCalendar';

export function Dashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { 
    students, payments, expenses, batches, attendance, 
    teachers, teacherRecords, exams, examResults, 
    attendanceConfig, language, theme, addPayment, updateStudent
  } = useAppContext();
  const t = translations[language];
  const [activeTab, setActiveTab] = React.useState<'action' | 'overview' | 'intel' | 'alerts' | 'calendar'>('action');
  const [animKey, setAnimKey] = React.useState(0);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [showAnalysis, setShowAnalysis] = React.useState(false);

  // Smart decision panel states
  const [selectedActionInsight, setSelectedActionInsight] = React.useState<any | null>(null);
  const [actionNotes, setActionNotes] = React.useState<Record<string, string>>({});
  const [spotPayments, setSpotPayments] = React.useState<Record<string, { amount: string; method: 'Cash' | 'bKash' | 'Nagad' | 'Bank'; month: string }>>({});
  const [alertMessage, setAlertMessage] = React.useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 3500);
  };

  // Card-specific time filters state ('today' | 'week' | 'month' | 'year' | 'all')
  const [filterCard1, setFilterCard1] = React.useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [filterCard2, setFilterCard2] = React.useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [filterCard3, setFilterCard3] = React.useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [filterCard4, setFilterCard4] = React.useState<'today' | 'week' | 'month' | 'year' | 'all'>('today');
  const [filterCard6, setFilterCard6] = React.useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  // Currently open dropdown (1 through 6, or null)
  const [activeDropdown, setActiveDropdown] = React.useState<number | null>(null);

  // Time boundaries relative to today
  const dRef = new Date();
  const todayYMD = getLocalDateStr(dRef);

  // Start of current week (assuming Monday is index 0 or adjusted appropriately)
  const currentDayIndex = dRef.getDay();
  const diffToMonday = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
  const mondayOfThisWeek = new Date(dRef);
  mondayOfThisWeek.setDate(dRef.getDate() - diffToMonday);
  const startOfWeekYMD = getLocalDateStr(mondayOfThisWeek);

  // Start of current month
  const startOfMonthYMD = `${dRef.getFullYear()}-${String(dRef.getMonth() + 1).padStart(2, '0')}-01`;

  // Start of current year
  const startOfYearYMD = `${dRef.getFullYear()}-01-01`;

  const getFilteredData = (period: 'today' | 'week' | 'month' | 'year' | 'all') => {
    let incomePayments = payments;
    let periodExpenses = expenses;
    let periodClasses = teacherRecords;

    if (period === 'today') {
      incomePayments = payments.filter(p => p.date === todayYMD);
      periodExpenses = expenses.filter(e => e.date === todayYMD);
      periodClasses = teacherRecords.filter(r => r.date === todayYMD);
    } else if (period === 'week') {
      incomePayments = payments.filter(p => p.date >= startOfWeekYMD && p.date <= todayYMD);
      periodExpenses = expenses.filter(e => e.date >= startOfWeekYMD && e.date <= todayYMD);
      periodClasses = teacherRecords.filter(r => r.date >= startOfWeekYMD && r.date <= todayYMD);
    } else if (period === 'month') {
      incomePayments = payments.filter(p => p.date >= startOfMonthYMD && p.date <= todayYMD);
      periodExpenses = expenses.filter(e => e.date >= startOfMonthYMD && e.date <= todayYMD);
      periodClasses = teacherRecords.filter(r => r.date >= startOfMonthYMD && r.date <= todayYMD);
    } else if (period === 'year') {
      incomePayments = payments.filter(p => p.date >= startOfYearYMD && p.date <= todayYMD);
      periodExpenses = expenses.filter(e => e.date >= startOfYearYMD && e.date <= todayYMD);
      periodClasses = teacherRecords.filter(r => r.date >= startOfYearYMD && r.date <= todayYMD);
    }

    const income = incomePayments.reduce((sum, p) => sum + p.amount, 0);
    const expense = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = income - expense;
    const profitMargin = income > 0 ? (profit / income) * 100 : 0;
    
    // Exclude 'Absent' from the active/conducted classes count
    const activeClasses = periodClasses.filter(r => r.status !== 'Absent');
    const classesCount = activeClasses.length;
    
    // Completed/Marked means it is not Pending, and not Cancelled, and not Absent (already handled)
    const completedClassesCount = activeClasses.filter(r => r.status !== 'Pending' && r.status !== 'Cancelled').length;
    const classCompletionRate = classesCount > 0 ? Math.round((completedClassesCount / classesCount) * 100) : 0;

    return {
      income,
      expense,
      profit,
      profitMargin,
      classesCount,
      completedClassesCount,
      classCompletionRate
    };
  };

  const getPeriodLabel = (period: 'today' | 'week' | 'month' | 'year' | 'all', lang: 'en' | 'bn') => {
    const labels = {
      today: { en: "Today", bn: "আজ" },
      week: { en: "This Week", bn: "এই সপ্তাহ" },
      month: { en: "This Month", bn: "এই মাস" },
      year: { en: "This Year", bn: "এই বছর" },
      all: { en: "All Time", bn: "সর্বমোট" }
    };
    return lang === 'bn' ? labels[period].bn : labels[period].en;
  };

  const getCard1Subtext = (period: string, lang: 'en' | 'bn') => {
    if (lang === 'bn') {
      if (period === 'today') return "আজকের আয় + মোট বকেয়া";
      if (period === 'week') return "এই সপ্তাহের আয় + মোট বকেয়া";
      if (period === 'month') return "মাসিক সম্ভাব্য মোট রাজস্ব";
      if (period === 'year') return "বাৎসরিক সম্ভাব্য মোট রাজস্ব";
      return "সর্বমোট সম্ভাব্য রাজস্ব";
    } else {
      if (period === 'today') return "Today's income + total dues";
      if (period === 'week') return "This week's income + total dues";
      if (period === 'month') return "Expected monthly revenue";
      if (period === 'year') return "Expected yearly revenue";
      return "All-time expected ledger";
    }
  };

  const getCard2Subtext = (period: string, lang: 'en' | 'bn') => {
    if (lang === 'bn') {
      if (period === 'today') return "আজকে আদায়কৃত মোট ক্যাশ";
      if (period === 'week') return "এই সপ্তাহে সংগৃহীত মোট অর্থ";
      if (period === 'month') return "এই মাসে সংগৃহীত মোট অর্থ";
      if (period === 'year') return "এই বছরে সংগৃহীত মোট অর্থ";
      return "সর্বমোট পেমেন্ট সংগ্রহ";
    } else {
      if (period === 'today') return "Total cash received today";
      if (period === 'week') return "Total collected this week";
      if (period === 'month') return "Total collected this month";
      if (period === 'year') return "Total collected this year";
      return "Total all-time collected fees";
    }
  };

  const getCard4Subtext = (period: string, lang: 'en' | 'bn') => {
    if (lang === 'bn') {
      if (period === 'today') return "আজকের সম্পন্ন ক্লাস";
      if (period === 'week') return "এই সপ্তাহের মোট ক্লাস";
      if (period === 'month') return "এই মাসের মোট ক্লাস";
      if (period === 'year') return "এই বছরের মোট ক্লাস";
      return "সর্বমোট সম্পন্ন ক্লাস";
    } else {
      if (period === 'today') return "Classes scheduled today";
      if (period === 'week') return "Classes scheduled this week";
      if (period === 'month') return "Classes scheduled this month";
      if (period === 'year') return "Classes scheduled this year";
      return "Total scheduled classes count";
    }
  };

  const getCard5Subtext = (period: string, lang: 'en' | 'bn') => {
    if (lang === 'bn') {
      if (period === 'today') return "আজকের আদায়কৃত মোট ক্যাশ";
      if (period === 'week') return "এই সপ্তাহের সর্বমোট সংগ্রহ";
      if (period === 'month') return "এই মাসের সর্বমোট সংগ্রহ";
      if (period === 'year') return "এই বছরের সর্বমোট সংগ্রহ";
      return "আজ পর্যন্ত সংগৃহীত মোট অর্থ";
    } else {
      if (period === 'today') return "Payment received today";
      if (period === 'week') return "Payments received this week";
      if (period === 'month') return "Payments received this month";
      if (period === 'year') return "Payments received this year";
      return "All-time payments received";
    }
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      setAnimKey(prev => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendance.filter(a => a.date === today);
  const presentToday = todayAttendance.filter(a => a.status === 'Present').length;
  const attendanceRate = todayAttendance.length > 0 ? (presentToday / todayAttendance.length) * 100 : 0;
  
  const activeTeachers = teachers.filter(t => t.status === 'Active').length;

  const activeStudentsList = students.filter(s => s.status === 'Active');
  const inactiveStudentsCount = students.filter(s => s.status === 'Inactive').length;
  
  const currentMonth = getCurrentMonthStr();
  const thisMonthPayments = payments.filter(p => p.date.startsWith(currentMonth));
  const totalIncomeThisMonth = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  const thisMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
  const totalExpenseThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalIncomeThisMonth - totalExpenseThisMonth;

  // Metrics for Graphs (6 Months trend)
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setDate(1); // prevent rollover
    d.setMonth(d.getMonth() - i);
    return getYearMonthStr(d);
  }).reverse();

  const trendData = last6Months.map(month => {
    const monthPayments = payments.filter(p => p.date.startsWith(month)).reduce((sum, p) => sum + p.amount, 0);
    const monthExpenses = expenses.filter(e => e.date.startsWith(month)).reduce((sum, e) => sum + e.amount, 0);
    const monthAttendance = attendance.filter(a => a.date.startsWith(month));
    const attRate = monthAttendance.length > 0 
      ? (monthAttendance.filter(a => a.status === 'Present').length / monthAttendance.length) * 100 
      : 0;
    
    return {
      month: new Date(month + '-01').toLocaleString(language, { month: 'short' }),
      Income: monthPayments,
      Expense: monthExpenses,
      Attendance: attRate,
      Students: students.filter(s => s.admissionDate <= month + '-31' && (s.status === 'Active' || (s.endDate && s.endDate > month))).length
    };
  });

  // Calculate unpaid dues for all students (active and inactive, capped up to inactivation month)
  const maxDueMonthStr = getPreviousMonthStr();

  const studentsWithDues = students.map(student => {
    const admissionMonth = student.admissionDate.slice(0, 7);
    
    // Determine maximum month for dues
    let endMonthStr = maxDueMonthStr;
    
    if (student.status === 'Inactive') {
      const studentEnd = student.endDate || student.admissionDate;
      const studentInactiveMonth = studentEnd.slice(0, 7);
      if (studentInactiveMonth < endMonthStr) {
        endMonthStr = studentInactiveMonth;
      }
    }
    
    const batchObj = batches.find(b => b.name === student.batch || b.id === student.batch);
    if (batchObj && batchObj.status === 'Inactive') {
      const batchEnd = batchObj.endDate || batchObj.startDate || student.admissionDate;
      const batchInactiveMonth = batchEnd.slice(0, 7);
      if (batchInactiveMonth < endMonthStr) {
        endMonthStr = batchInactiveMonth;
      }
    }

    const monthsSinceAdmission = getMonthsBetween(admissionMonth, endMonthStr);
    
    const studentPayments = payments.filter(p => p.studentId === student.id);
    let dueAmount = 0;
    let unpaidMonthsCount = 0;
    monthsSinceAdmission.forEach(m => {
      const monthPayments = studentPayments.filter(p => p.month === m);
      const paidForMonth = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const discountForMonth = monthPayments.reduce((sum, p) => sum + (p.discount || 0), 0);
      const due = student.finalFee - paidForMonth - discountForMonth;
      if (due > 0) {
        dueAmount += due;
        unpaidMonthsCount++;
      }
    });

    return {
      student,
      dueAmount,
      unpaidMonthsCount
    };
  }).filter(item => item.dueAmount > 0)
    .sort((a, b) => b.dueAmount - a.dueAmount);

  const totalDueAccumulated = studentsWithDues.reduce((sum, item) => sum + item.dueAmount, 0);
  const pendingStudentCount = studentsWithDues.length;
  const top5Dues = studentsWithDues.slice(0, 5);

  // Intelligence: Weak Students (Attendance < threshold OR average marks < 40%)
  const studentIntelligence = activeStudentsList.map(student => {
    const studentAttendance = attendance.filter(a => a.studentId === student.id);
    const attRate = studentAttendance.length > 0 
      ? (studentAttendance.filter(a => a.status === 'Present').length / studentAttendance.length) * 100 
      : 100;
    
    const results = examResults.filter(r => r.studentId === student.id);
    const avgScore = results.length > 0
      ? results.reduce((sum, r) => {
          const exam = exams.find(e => e.id === r.examId);
          return sum + (exam ? (r.obtainedMarks / exam.totalMarks) * 100 : 0);
        }, 0) / results.length
      : 100;

    const sortedAttendance = [...studentAttendance].sort((a, b) => b.date.localeCompare(a.date));
    const isAbsent3Days = sortedAttendance.length >= 3 && sortedAttendance.slice(0, 3).every(a => a.status === 'Absent');

    return { 
      id: student.id, 
      name: student.name, 
      batch: student.batch,
      attRate, 
      avgScore,
      isWeak: attRate < attendanceConfig.lowThreshold || avgScore < 40,
      isAbsentAlert: isAbsent3Days,
      isLowAttendance: attRate < 60
    };
  });

  const weakStudents = studentIntelligence.filter(s => s.isWeak);
  const absentAlertStudents = studentIntelligence.filter(s => s.isAbsentAlert);
  const lowAttendanceStudents = studentIntelligence.filter(s => s.isLowAttendance);

  // Teacher Performance (retains legacy teacherPerformance variable name so graphs build successfully)
  const teacherPerformance = teachers.filter(t => t.status === 'Active').map(teacher => {
    const records = teacherRecords.filter(r => r.teacherId === teacher.id && r.date.startsWith(currentMonth) && r.status !== 'Absent' && r.status !== 'Cancelled' && r.status !== 'Pending');
    const validTotalAllClasses = teacherRecords.filter(r => r.status !== 'Absent' && r.status !== 'Cancelled' && r.status !== 'Pending').length;
    return {
      name: teacher.name,
      classes: records.length,
      contribution: validTotalAllClasses > 0 ? (records.length / validTotalAllClasses) * 100 : 0
    };
  }).sort((a, b) => b.classes - a.classes);

  // Dynamic calculations for advanced command panel and cards
  const upgradedTeacherPerformance = teachers.filter(t => t.status === 'Active').map(teacher => {
    const records = teacherRecords.filter(r => r.teacherId === teacher.id && r.date.startsWith(currentMonth) && r.status !== 'Absent' && r.status !== 'Cancelled' && r.status !== 'Pending');
    const classesCount = records.length;
    
    let totalPresent = 0;
    let totalScheduled = 0;
    
    records.forEach(rec => {
      const batchObj = batches.find(b => b.id === rec.batchId || b.name === rec.batchId);
      const batchName = batchObj ? batchObj.name : rec.batchId;
      const batchStudents = students.filter(s => s.batch === batchName);
      const studentIds = batchStudents.map(s => s.id);
      
      const dayAttendance = attendance.filter(a => a.date === rec.date && studentIds.includes(a.studentId));
      totalPresent += dayAttendance.filter(a => a.status === 'Present').length;
      totalScheduled += dayAttendance.length;
    });

    const avgAttendance = totalScheduled > 0 ? (totalPresent / totalScheduled) * 100 : 85; 
    const totalAllClasses = teacherRecords.filter(r => r.status !== 'Absent' && r.status !== 'Cancelled' && r.status !== 'Pending').length || 1;
    const contribution = (classesCount / totalAllClasses) * 100;
    const efficiencyScore = Math.round(0.7 * avgAttendance + 0.3 * Math.min(100, contribution * 7));

    return {
      name: teacher.name,
      subject: teacher.subject,
      classes: classesCount,
      avgAttendance,
      contribution,
      score: Math.min(100, Math.max(40, efficiencyScore))
    };
  }).sort((a, b) => b.score - a.score);

  // Today's metrics (Core requirement #7)
  const classesToday = teacherRecords.filter(r => r.date === today).length;
  const incomeToday = payments.filter(p => p.date === today).reduce((sum, p) => sum + p.amount, 0);

  // Calculate Risk Scores for all active students securely (Risk Score System)
  const riskAnalysis = activeStudentsList.map(s => {
     let score = 0;
     const intelligence = studentIntelligence.find(si => si.id === s.id);
     if (intelligence && intelligence.isAbsentAlert) score += 5; // Long absence is high risk
     if (intelligence && intelligence.isLowAttendance) score += 3; // Low attendance is medium risk
     const dues = studentsWithDues.find(d => d.student.id === s.id);
     if (dues && dues.dueAmount > 2000) score += 3;
     else if (dues && dues.dueAmount > 500) score += 1;

     let riskStatus = 'SAFE';
     if (score >= 5) riskStatus = 'HIGH';
     else if (score >= 3) riskStatus = 'MEDIUM';

     return { ...s, score, riskStatus, intelligence, dueAmount: dues ? dues.dueAmount : 0 };
  });

  // Dynamic Insight Engine (Requirement #2)
  const generateInsights = () => {
    const insights = [];
    
    // 1. Dropout Risk (riskStatus === 'HIGH')
    const highRiskStudents = riskAnalysis.filter(s => s.riskStatus === 'HIGH');

    if (highRiskStudents.length > 0) {
      insights.push({
        id: 'dropout',
        category: language === 'en' ? 'Critical Immediate Attention' : 'জরুরী পদক্ষেপ আবশ্যক',
        type: 'danger',
        text: language === 'en' 
          ? `⚠️ Critical Alert: ${highRiskStudents.length} student(s) identified as HIGH RISK for dropout due to severe inactivity or large dues.`
          : `⚠️ সতর্কতা: ${highRiskStudents.length} জন শিক্ষার্থী দীর্ঘ অনুপস্থিতি বা বা বড় বকেয়ার কারণে ঝরে পড়ার উচ্চ ঝুঁকিতে রয়েছে।`,
        actionLabel: language === 'en' ? '📞 Resolve Dropout Risks' : '📞 ঝরে পড়া রোধে পদক্ষেপ নিন',
        actionType: 'dropout',
        students: highRiskStudents
      });
    }

    // 2. Attendance Failure Risk (<60% or isAbsentAlert, excluding HIGH risks)
    const highRiskIds = highRiskStudents.map(h => h.id);
    const atRiskStudents = riskAnalysis.filter(s => 
      (s.intelligence?.isAbsentAlert || s.intelligence?.isLowAttendance) && 
      !highRiskIds.includes(s.id)
    );

    if (atRiskStudents.length > 0) {
      insights.push({
        id: 'attendance-risk',
        category: language === 'en' ? 'Attendance Risk Log' : 'অনুপস্থিতি ঝুঁকি লগ',
        type: 'warning',
        text: language === 'en' 
          ? `We've noticed ${atRiskStudents.length} student(s) with declining attendance patterns. Early intervention recommended.`
          : `আমরা ${atRiskStudents.length} জন শিক্ষার্থীর নিয়মিত উপস্থিতির হার হ্রাস দেখতে পাচ্ছি। অভিভাবক যোগাযোগ করুন।`,
        actionLabel: language === 'en' ? '💬 Resolve Absence Alerts' : '💬 অনুপস্থিতি এলার্ট সমাধান করুন',
        actionType: 'attendance-risk',
        students: atRiskStudents
      });
    }

    // 3. Batch Decline Risk
    const batchStats = batches.filter(b => b.status === 'Active').map(batch => {
      const batchStudents = activeStudentsList.filter(s => s.batch === batch.name);
      const studentIds = batchStudents.map(s => s.id);
      
      const lastMonth = last6Months[last6Months.length - 2] || '';
      const thisMonth = last6Months[last6Months.length - 1] || '';

      const thisMonthAtt = attendance.filter(a => studentIds.includes(a.studentId) && a.date.startsWith(thisMonth));
      const lastMonthAtt = attendance.filter(a => studentIds.includes(a.studentId) && a.date.startsWith(lastMonth));

      const thisRate = thisMonthAtt.length > 0 ? (thisMonthAtt.filter(a => a.status === 'Present').length / thisMonthAtt.length) * 100 : 100;
      const lastRate = lastMonthAtt.length > 0 ? (lastMonthAtt.filter(a => a.status === 'Present').length / lastMonthAtt.length) * 100 : 100;

      return {
        batchName: batch.name,
        diff: thisRate - lastRate
      };
    });

    const decreasingBatch = batchStats.find(b => b.diff < -5);
    if (decreasingBatch) {
      const batchStudents = riskAnalysis.filter(s => s.batch === decreasingBatch.batchName);
      insights.push({
        id: 'attendance-trend',
        category: language === 'en' ? 'Batch Alert' : 'ব্যাচ সতর্কতা',
        type: 'warning',
        text: language === 'en'
          ? `📉 Performance in class "${decreasingBatch.batchName}" is declining. Attendance dropped by ${Math.abs(decreasingBatch.diff).toFixed(0)}% this month.`
          : `📉 "${decreasingBatch.batchName}" ব্যাচের পারফরম্যান্স কমছে। এ মাসে উপস্থিতি ${Math.abs(decreasingBatch.diff).toFixed(0)}% কমেছে।`,
        actionLabel: language === 'en' ? '📢 Notify Batch Parents' : '📢 ব্যাচ অভিভাবকদের সতর্ক করুন',
        actionType: 'attendance-trend',
        students: batchStudents,
        meta: { batchName: decreasingBatch.batchName, diff: decreasingBatch.diff }
      });
    }

    // 4. Financial Alert
    const duesToRemind = riskAnalysis.filter(s => s.dueAmount > 2000);
    if (duesToRemind.length > 0) {
      insights.push({
        id: 'fees-dues',
        category: language === 'en' ? 'Outstanding Dues' : 'বকেয়া ওভারভিউ',
        type: 'warning',
        text: language === 'en'
          ? `💰 Payment behavior anomaly detected. ${duesToRemind.length} student(s) have accumulated serious outstanding dues.`
          : `💰 পেমেন্ট প্যাটার্নে অস্বাভাবিকতা: ${duesToRemind.length} জন শিক্ষার্থীর বড় বকেয়া জমেছে।`,
        actionLabel: language === 'en' ? '৳ Dispatch Fee Reminders' : '৳ বকেয়া নোটিশ পাঠান',
        actionType: 'fees-dues',
        students: duesToRemind
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: 'status-good',
        category: language === 'en' ? 'System Green' : 'সব সূচক ইতিবাচক',
        type: 'success',
        text: language === 'en'
          ? `✨ Your coaching parameters are optimal. No immediate risks detected.`
          : `✨ সব সূচক ইতিবাচক। কোনো ঝুঁকি নেই।`,
        actionNav: 'reports',
        actionLabel: language === 'en' ? '[View Growth]' : '[প্রবৃদ্ধি দেখুন]'
      });
    }

    return insights;
  };

  const dynamicInsights = generateInsights();

  // Calculate Global Recent Activity (Last 5 actions)
  const recentActivities = React.useMemo(() => {
    const activityItems: any[] = [];
    
    // Add payments
    payments.forEach(p => {
      const student = students.find(s => s.id === p.studentId);
      activityItems.push({
        id: p.id,
        type: 'payment',
        title: t.feeCollection,
        subtitle: `${student?.name || 'Unknown Student'} • ${p.month}`,
        value: `+৳${p.amount}`,
        date: p.date,
        icon: Wallet,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50'
      });
    });
    
    // Add expenses
    expenses.forEach(e => {
      activityItems.push({
        id: e.id,
        type: 'expense',
        title: t.expenseRecord,
        subtitle: `${e.category} • ${e.description}`,
        value: `-৳${e.amount}`,
        date: e.date,
        icon: TrendingDown,
        color: 'text-rose-500',
        bg: 'bg-rose-50'
      });
    });
    
    // Add class records
    teacherRecords.forEach(r => {
      const teacher = teachers.find(t => t.id === r.teacherId);
      activityItems.push({
        id: r.id,
        type: 'class',
        title: t.classCompleted,
        subtitle: `${teacher?.name || 'Teacher'} • ${r.batchId}`,
        value: r.topic || 'No topic',
        date: r.date,
        icon: Activity,
        color: 'text-indigo-500',
        bg: 'bg-indigo-50'
      });
    });
    
    // Add new student admissions
    students.forEach(s => {
      activityItems.push({
        id: s.id,
        type: 'admission',
        title: t.admission,
        subtitle: `${s.name} • ${s.batch}`,
        value: language === 'en' ? 'Welcome' : 'স্বাগতম',
        date: s.admissionDate,
        icon: Plus,
        color: 'text-amber-500',
        bg: 'bg-amber-50'
      });
    });
    
    // Sort by date (descending)
    return activityItems
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [payments, expenses, teacherRecords, students, teachers, language, t]);
  
  // Calculate Daily Revenue Trend for current month
  const dailyRevenueData = React.useMemo(() => {
    // Current date reference for calculation logic
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentMonthPrefix = getYearMonthStr(now);
    
    return Array.from({ length: daysInMonth }).map((_, i) => {
      const day = String(i + 1).padStart(2, '0');
      const dateStr = `${currentMonthPrefix}-${day}`;
      const dailyTotal = payments
        .filter(p => p.date === dateStr)
        .reduce((sum, p) => sum + p.amount, 0);
      
      const dateObj = new Date(dateStr);
      return {
        day: i + 1,
        revenue: dailyTotal,
        dateLabel: dateObj.toLocaleDateString(language, { day: 'numeric', month: 'short' })
      };
    });
  }, [payments, language]);

  // Financial Health Calculations (Requirement #6)
  const profitMarginPercent = totalIncomeThisMonth > 0 ? Math.max(0, Math.min(100, (netProfit / totalIncomeThisMonth) * 100)) : 0;
  const expectedTotalIncome = totalIncomeThisMonth + totalDueAccumulated;
  
  const dueToIncomeRatio = totalIncomeThisMonth > 0 ? (totalDueAccumulated / totalIncomeThisMonth) : 0;
  let financialRiskLevel = 'LOW';
  let financialRiskColor = 'text-emerald-500 bg-emerald-50 border-emerald-100';
  if (dueToIncomeRatio > 0.4 || profitMarginPercent < 25) {
    financialRiskLevel = 'HIGH';
    financialRiskColor = 'bg-rose-50 border-rose-100 text-rose-700';
  } else if (dueToIncomeRatio > 0.15 || profitMarginPercent < 50) {
    financialRiskLevel = 'MEDIUM';
    financialRiskColor = 'bg-amber-50 border-amber-100 text-amber-700';
  }

  // Batch Performance Comparison (Requirement #3)
  const batchPerformanceList = batches.filter(b => b.status === 'Active').map(batch => {
    const batchStudents = students.filter(s => s.batch === batch.name && s.status === 'Active');
    const studentCount = batchStudents.length;
    
    const studentIds = students.filter(s => s.batch === batch.name).map(s => s.id);
    const batchIncome = payments.filter(p => studentIds.includes(p.studentId) && p.date.startsWith(currentMonth)).reduce((sum, p) => sum + p.amount, 0);

    const batchAttendance = attendance.filter(a => studentIds.includes(a.studentId) && a.date.startsWith(currentMonth));
    const attRate = batchAttendance.length > 0
      ? (batchAttendance.filter(a => a.status === 'Present').length / batchAttendance.length) * 100
      : 85;

    return {
      name: batch.name,
      studentCount,
      income: batchIncome,
      attRate
    };
  });

  const weakestBatchObj = batchPerformanceList.length > 0 
    ? [...batchPerformanceList].sort((a, b) => a.attRate - b.attRate)[0]
    : null;

  // Growth Intelligence Calculations (Requirement #5)
  const startOfMonth = currentMonth + '-01';
  const newStudentsCount = activeStudentsList.filter(s => s.admissionDate >= startOfMonth).length;
  const dropoutStudentsCount = students.filter(s => s.status === 'Inactive' || (s.endDate && s.endDate >= startOfMonth)).length;
  const initialCount = Math.max(1, students.length - newStudentsCount + dropoutStudentsCount);
  const netGrowthPercent = ((newStudentsCount - dropoutStudentsCount) / initialCount) * 100;

  // AI Forecast State
  const [forecastData, setForecastData] = React.useState<any>(null);
  const [isForecasting, setIsForecasting] = React.useState(false);

  const generateForecast = async () => {
    setIsForecasting(true);
    try {
      const historicalPayments = trendData.map(d => ({ month: d.month, revenue: d.Income }));
      const response = await fetch('/api/revenue-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historicalPayments,
          activeStudentsCount: activeStudentsList.length,
          currentMonth: new Date().toLocaleString(language, { month: 'long', year: 'numeric' })
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        try {
          const parsed = JSON.parse(errText);
          throw new Error(parsed.error || `Server responded with status ${response.status}`);
        } catch {
          throw new Error(`Server responded with status ${response.status}`);
        }
      }
      const data = await response.json();
      setForecastData(data);
    } catch (error: any) {
      console.error("Forecast failed:", error);
      setForecastData({ error: error.message || "Failed to fetch" });
    } finally {
      setIsForecasting(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'intel' && !forecastData && !isForecasting) {
      generateForecast();
    }
  }, [activeTab]);

  // Combined chart data for forecast
  const combinedForecastData = React.useMemo(() => {
    if (!forecastData || forecastData.error || !forecastData.forecast) return [];
    const history = trendData.map(d => ({ name: d.month, Actual: d.Income, type: 'history' }));
    const forecast = forecastData.forecast.map((f: any) => ({ 
      name: f.month, 
      Predicted: f.predictedRevenue, 
      type: 'forecast' 
    }));
    return [...history, ...forecast];
  }, [forecastData, trendData]);

  // Card calculations based on filters
  const c1Data = getFilteredData(filterCard1);
  const c1Value = c1Data.income + totalDueAccumulated;

  const c2Data = getFilteredData(filterCard2);
  const c2Value = c2Data.income;

  const c3Data = getFilteredData(filterCard3);
  const c3Value = c3Data.profitMargin;

  const c4Data = getFilteredData(filterCard4);
  const c4Value = c4Data.classesCount;

  const c5Data = getFilteredData('today');
  const c5Value = c5Data.income;

  const c6Data = getFilteredData(filterCard6);
  const c6Income = c6Data.income;
  const c6ProfitMargin = c6Data.profitMargin;
  const c6Ratio = c6Income > 0 ? (totalDueAccumulated / c6Income) : 0;
  
  let c6RiskLevel = 'LOW';
  let c6RiskColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (c6Ratio > 0.4 || c6ProfitMargin < 25) {
    c6RiskLevel = 'HIGH';
    c6RiskColor = 'bg-rose-50 text-rose-700 border-rose-100';
  } else if (c6Ratio > 0.15 || c6ProfitMargin < 50) {
    c6RiskLevel = 'MEDIUM';
    c6RiskColor = 'bg-amber-50 text-amber-700 border-amber-100';
  }

  return (
    <div className="w-full space-y-6 pb-12 font-plus">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight leading-none uppercase italic">Command Center</h1>
          <p className="text-muted font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Smart Decision Support System 4.0</p>
        </div>
        <div className="flex bg-background p-1 rounded-2xl border border-border w-full md:w-auto overflow-x-auto whitespace-nowrap shrink-0 max-w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
           {(['action', 'overview', 'intel', 'alerts'] as const).map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={cn(
                 "px-4 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all text-center whitespace-nowrap shrink-0 mr-1 last:mr-0",
                 activeTab === tab ? "bg-card text-indigo-600 shadow-sm" : "text-muted hover:text-foreground"
               )}
             >
               {tab}
             </button>
           ))}
        </div>
      </header>

      {activeTab === 'action' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-10">

          {/* Crystal Modern Hero Banner */}
          <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] md:rounded-[5rem] bg-card border border-border p-8 sm:p-12 md:p-20 shadow-2xl shadow-slate-200/50 dark:shadow-none flex flex-col items-center text-center group">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.05),transparent)] pointer-events-none"></div>
            <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-indigo-50 dark:bg-indigo-950/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="relative z-10 max-w-7xl w-full space-y-6 md:space-y-12">
              <div className="cursor-default overflow-hidden">
                 <div className="text-[12vw] sm:text-[10vw] md:text-[8rem] font-black text-foreground leading-[0.8] tracking-[calc(-0.05em)] uppercase select-none flex flex-col items-center">
                    <motion.div 
                      key={`pragya-${animKey}`}
                      initial="hidden"
                      animate="visible"
                      className="flex overflow-hidden"
                    >
                      {"PRAGYA".split("").map((char, index) => (
                        <motion.span
                          key={index}
                          variants={{
                            hidden: { x: -150, opacity: 0 },
                            visible: { 
                              x: 0, 
                              opacity: 1,
                              transition: { 
                                delay: index * 0.1,
                                duration: 0.6,
                                ease: [0.16, 1, 0.3, 1] 
                              }
                            }
                          }}
                          className="inline-block italic"
                        >
                          {char}
                        </motion.span>
                      ))}
                    </motion.div>
                    
                    <motion.div 
                      key={`academy-${animKey}`}
                      initial="hidden"
                      animate="visible"
                      className="flex overflow-hidden mt-2"
                    >
                      {"ACADEMY".split("").map((char, index) => (
                        <motion.span
                          key={index}
                          variants={{
                            hidden: { x: 150, opacity: 0 },
                            visible: { 
                              x: 0, 
                              opacity: 1,
                              transition: { 
                                delay: (7 + index) * 0.1,
                                duration: 0.6,
                                ease: [0.16, 1, 0.3, 1]
                              }
                            }
                          }}
                          className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700"
                        >
                          {char}
                        </motion.span>
                      ))}
                    </motion.div>
                 </div>
              </div>
              <div className="h-px w-24 bg-indigo-100 mx-auto" />
              <p className="text-xs sm:text-base md:text-2xl font-black italic tracking-[0.2em] text-muted-foreground uppercase">
                Excellence in Knowledge and Values
              </p>
            </div>
          </div>

          {/* Attendance Tracker Quick Action */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <motion.button 
              whileHover={{ scale: 1.02, y: -5, boxShadow: "0 0 40px rgba(79,70,229,0.3)", borderColor: "rgba(165,180,252,1)", transition: { type: "spring", stiffness: 300, damping: 20 } }}
              onClick={() => onNavigate?.('attendance')}
              className="md:col-span-8 group relative overflow-hidden bg-card p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-border shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8 transition-all duration-500 active:scale-[0.98]"
            >
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-[1.2rem] sm:rounded-[2rem] flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                  <CheckCircle2 size={24} className="sm:w-8 sm:h-8" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tighter uppercase italic truncate">{language === 'en' ? 'Track Attendance' : 'উপস্থিতি নিশ্চিত করুন'}</h3>
                  <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest sm:tracking-[0.3em]">{language === 'en' ? 'Quickly mark today\'s presence' : 'দ্রুত আজকের উপস্থিতি রেকর্ড করুন'}</p>
                </div>
              </div>
              <div className="w-full sm:w-auto flex items-center justify-center gap-4 bg-slate-900 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-[1.5rem] sm:rounded-[2rem] font-black text-xs sm:text-sm uppercase tracking-widest group-hover:bg-indigo-600 transition-colors shadow-2xl overflow-hidden truncate">
                {language === 'en' ? 'Open Portal' : 'পোর্টাল খুলুন'} <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform shrink-0" />
              </div>
            </motion.button>

            <motion.div 
              whileHover={{ scale: 1.02, y: -5, boxShadow: "0 0 30px rgba(79,70,229,0.3)", borderColor: "rgba(165,180,252,1)", transition: { type: "spring", stiffness: 300, damping: 20 } }}
              className="md:col-span-4 bg-indigo-50 dark:bg-indigo-950/20 p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-indigo-100 dark:border-indigo-900/30 flex flex-col justify-center gap-4 transition-all duration-300 hover:bg-card cursor-default">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <span className="text-[9px] sm:text-[10px] font-black text-indigo-600 uppercase tracking-widest">{t.attendance} Rate Today</span>
               </div>
               <div className="text-4xl sm:text-5xl font-black text-foreground tracking-tighter italic">{attendanceRate.toFixed(0)}%</div>
               <div className="h-2 w-full bg-card rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${attendanceRate}%` }}
                    className="h-full bg-indigo-500"
                  />
               </div>
            </motion.div>
          </div>

          {/* Strategic Command Center */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {[
              { id: 'students', label: language === 'en' ? 'Students' : 'শিক্ষার্থী', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', span: 'col-span-1' },
              { id: 'fees', label: language === 'en' ? 'Finance' : 'অর্থায়ন', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', span: 'col-span-1' },
              { id: 'teachers', label: language === 'en' ? 'Faculty' : 'অনুষদ', icon: Shield, color: 'text-rose-600', bg: 'bg-rose-50', span: 'col-span-1' },
              { id: 'reports', label: language === 'en' ? 'Intelligence' : 'গোয়েন্দা', icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50', span: 'col-span-1' },
              { id: 'dues', label: t.pending, subLabel: `৳${(totalDueAccumulated/1000).toFixed(1)}k`, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100', span: 'col-span-full lg:col-span-2 border-rose-100 hover:border-rose-300' },
            ].map((action, index) => (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.02, y: -5, boxShadow: "0 0 30px rgba(79,70,229,0.3)", borderColor: "rgba(165,180,252,1)", transition: { type: "spring", stiffness: 300, damping: 20 } }}
                onClick={() => onNavigate?.(action.id)}
                className={cn(
                  "group relative overflow-hidden p-4 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] border bg-card transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 sm:gap-4 min-w-0 w-full",
                  action.span,
                  index === 4 ? "flex-row text-left hover:shadow-rose-200/50" : "flex-col text-center border-border hover:shadow-slate-200 dark:hover:shadow-none"
                )}
              >
                <div className={cn("rounded-[1rem] sm:rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-sm shrink-0 group-hover:text-white", 
                  action.bg, 
                  action.color,
                  index === 4 ? "w-12 h-12 sm:w-16 sm:h-16 group-hover:bg-rose-600" : "w-10 h-10 sm:w-14 sm:h-14 group-hover:bg-slate-900"
                )}>
                  <action.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </div>
                <div className={cn("space-y-0.5 sm:space-y-1 min-w-0 flex-1", index === 4 ? "text-left" : "text-center")}>
                  <span className={cn("text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] block truncate", index === 4 ? "text-rose-400 font-bold" : "text-muted-foreground")}>
                    {index === 4 ? (language === 'en' ? 'Pending Dues' : 'বকেয়া তালিকা') : 'Portal Access'}
                  </span>
                  {action.subLabel ? (
                    <div className="flex flex-col sm:block">
                       <p className="text-xl sm:text-2xl md:text-3xl font-black text-rose-600 tracking-tighter shrink-0">{action.subLabel}</p>
                       <p className="text-[9px] sm:text-[10px] font-black text-muted tracking-wide uppercase italic truncate">{action.label}</p>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm font-black text-slate-900 tracking-tight uppercase italic truncate">{action.label}</p>
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Smart Decision Card (Requirement #2) */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 sm:p-8 rounded-[2.5rem] border border-indigo-950 shadow-2xl hover:shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                   <div className="flex items-center gap-2 bg-indigo-500/25 px-3 py-1 rounded-full w-fit">
                      <Sparkles size={14} className="text-indigo-300 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Pragya AI Insight Pulse</span>
                   </div>
                   <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-none uppercase italic">{language === 'en' ? "Strategic AI Prescriptions" : "স্মার্ট সিদ্ধান্ত প্যানেল"}</h3>
                   <p className="text-[10px] text-indigo-200/60 font-bold uppercase tracking-wider">{language === 'en' ? "Patterns analyzed automatically based on attendance & fee logs" : "উপস্থিতি ও বকেয়া ডেটার ভিত্তিতে স্বয়ংক্রিয়ভাবে জেনারেটেড সিদ্ধান্ত"}</p>
                </div>
                <span className="hidden md:inline-block text-[8px] font-mono text-indigo-300/50 bg-white/5 px-3 py-1 rounded-md border border-white/5">Update: Realtime</span>
             </div>

             <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {dynamicInsights.map((insight, idx) => (
                   <div 
                     key={insight.id || idx} 
                     className="bg-white/5 border border-white/10 p-5 rounded-3xl flex flex-col justify-between gap-3 hover:bg-white/10 transition-colors"
                   >
                      <div className="space-y-1">
                         <span className={cn(
                           "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                           insight.type === 'danger' ? "bg-rose-500/20 text-rose-300" :
                           insight.type === 'warning' ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                         )}>
                            {insight.category}
                         </span>
                         <p className="text-xs font-bold text-slate-100 mt-2 leading-relaxed">{insight.text}</p>
                      </div>
                      <button 
                        onClick={() => {
                          if (insight.students && insight.students.length > 0) {
                            setSelectedActionInsight(insight);
                          } else {
                            onNavigate?.(insight.actionNav || 'reports');
                          }
                        }}
                        className={cn(
                          "text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-4 py-2 mt-2 rounded-xl border flex items-center justify-between group/btn transition-all cursor-pointer",
                          insight.type === 'danger' ? "bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500 hover:text-white" :
                          insight.type === 'warning' ? "bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500 hover:text-slate-900" :
                          "bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500 hover:text-white"
                        )}
                      >
                         <span>{insight.actionLabel || (language === 'en' ? "Take Resolution" : "সমাধান বাস্তবায়ন করুন")}</span>
                         <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                   </div>
                ))}
             </div>
          </div>
          
          {/* Academic Calendar replaces Recent Activity */ }
          <AcademicCalendar language={language} batches={batches} />
        </motion.div>
      )}

       {activeTab === 'overview' && (
           <>
              {/* Global overlay wrapper to handle outside clicks for open dropdowns */}
              {activeDropdown !== null && (
                 <div 
                    className="fixed inset-0 z-30 bg-transparent cursor-default" 
                    onClick={() => setActiveDropdown(null)} 
                 />
              )}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
            {/* Financial Diagnostics Zone (Requirement #6) & Today's Realtime Status - fully fluid 2-column grid on mobile to avoid long scroll, going to 3-columns on large screens */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 relative">
                
                {/* Expected Ledger Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  whileHover={{ scale: 1.02, y: -5, boxShadow: "0 0 30px rgba(79,70,229,0.3)", borderColor: "rgba(165,180,252,1)", transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
                  className="bg-card p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-border shadow-md sm:shadow-lg shadow-slate-100/50 dark:shadow-none transition-all duration-300 flex flex-col justify-between min-h-[100px] sm:min-h-[140px] relative"
                >
                   <div className="flex justify-between items-start w-full">
                      <p className="text-[8px] sm:text-[10px] font-black text-muted uppercase tracking-widest leading-none">
                         {language === 'en' ? "Expected Ledger" : "প্রত্যাশিত রাজস্ব"}
                      </p>
                      
                      {/* Mini Filter Menu */}
                      <div className="relative z-45">
                         <button 
                            onClick={(e) => {
                               e.stopPropagation();
                               setActiveDropdown(activeDropdown === 1 ? null : 1);
                            }}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-border hover:border-indigo-200 text-[7px] sm:text-[9px] font-bold text-muted hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer select-none"
                         >
                            <span>{getPeriodLabel(filterCard1, language)}</span>
                            <ChevronDown size={8} className={cn("transform transition-transform text-muted", activeDropdown === 1 ? "rotate-180" : "rotate-0")} />
                         </button>
                         {activeDropdown === 1 && (
                            <div className="absolute right-0 mt-1 w-20 sm:w-24 bg-card border border-border rounded-lg shadow-xl py-0.5 flex flex-col z-50">
                               {(['today', 'week', 'month', 'year', 'all'] as const).map((p) => (
                                  <button
                                     key={p}
                                     onClick={(e) => {
                                        e.stopPropagation();
                                        setFilterCard1(p);
                                        setActiveDropdown(null);
                                     }}
                                     className={cn(
                                        "px-2 py-1 text-left text-[7px] sm:text-[9px] font-bold transition-colors w-full cursor-pointer hover:bg-muted/10",
                                        filterCard1 === p ? "text-indigo-600 bg-indigo-50/50 dark:text-indigo-400 dark:bg-indigo-900/40" : "text-muted hover:text-foreground"
                                     )}
                                  >
                                     {getPeriodLabel(p, language)}
                                  </button>
                               ))}
                            </div>
                         )}
                      </div>
                   </div>
                   <p className="text-[15px] sm:text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 italic tracking-tighter mt-1 sm:mt-4">
                      ৳{c1Value}
                   </p>
                   <p className="text-[7px] sm:text-[9px] font-bold text-muted mt-1 uppercase leading-none">
                      {getCard1Subtext(filterCard1, language)}
                   </p>
                </motion.div>

                {/* Collected Income Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  whileHover={{ scale: 1.02, y: -5, boxShadow: "0 0 30px rgba(79,70,229,0.3)", borderColor: "rgba(165,180,252,1)", transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                  className="bg-card p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-border shadow-md sm:shadow-lg shadow-slate-100/50 dark:shadow-none transition-all duration-300 flex flex-col justify-between min-h-[100px] sm:min-h-[140px] relative"
                >
                   <div className="flex justify-between items-start w-full">
                      <p className="text-[8px] sm:text-[10px] font-black text-muted uppercase tracking-widest leading-none">
                         {language === 'en' ? "Collected Income" : "সংগৃহীত আয়"}
                      </p>
                      
                      {/* Mini Filter Menu */}
                      <div className="relative z-45">
                         <button 
                            onClick={(e) => {
                               e.stopPropagation();
                               setActiveDropdown(activeDropdown === 2 ? null : 2);
                            }}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-border hover:border-emerald-200 text-[7px] sm:text-[9px] font-bold text-muted hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer select-none"
                         >
                            <span>{getPeriodLabel(filterCard2, language)}</span>
                            <ChevronDown size={8} className={cn("transform transition-transform text-muted", activeDropdown === 2 ? "rotate-180" : "rotate-0")} />
                         </button>
                         {activeDropdown === 2 && (
                            <div className="absolute right-0 mt-1 w-20 sm:w-24 bg-card border border-border rounded-lg shadow-xl py-0.5 flex flex-col z-50">
                               {(['today', 'week', 'month', 'year', 'all'] as const).map((p) => (
                                  <button
                                     key={p}
                                     onClick={(e) => {
                                        e.stopPropagation();
                                        setFilterCard2(p);
                                        setActiveDropdown(null);
                                     }}
                                     className={cn(
                                        "px-2 py-1 text-left text-[7px] sm:text-[9px] font-bold transition-colors w-full cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20",
                                        filterCard2 === p ? "text-emerald-600 bg-emerald-50/50 dark:text-emerald-400 dark:bg-emerald-900/40" : "text-muted hover:text-foreground"
                                     )}
                                  >
                                     {getPeriodLabel(p, language)}
                                  </button>
                               ))}
                            </div>
                         )}
                      </div>
                   </div>
                   <p className="text-[15px] sm:text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 italic tracking-tighter mt-1 sm:mt-4">
                      ৳{c2Value}
                   </p>
                   <p className="text-[7px] sm:text-[9px] font-bold text-muted mt-1 uppercase leading-none">
                      {getCard2Subtext(filterCard2, language)}
                   </p>
                </motion.div>

                {/* Profit Margin Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  whileHover={{ scale: 1.02, y: -5, boxShadow: "0 0 30px rgba(79,70,229,0.3)", borderColor: "rgba(165,180,252,1)", transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
                  className="bg-card p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-border shadow-md sm:shadow-lg shadow-slate-100/50 dark:shadow-none transition-all duration-300 flex flex-col justify-between min-h-[100px] sm:min-h-[140px] relative"
                >
                   <div className="flex justify-between items-start w-full">
                      <p className="text-[8px] sm:text-[10px] font-black text-muted uppercase tracking-widest leading-none">
                         {language === 'en' ? "Profit Margin" : "লাভের হার"}
                      </p>
                      
                      {/* Mini Filter Menu */}
                      <div className="relative z-45">
                         <button 
                            onClick={(e) => {
                               e.stopPropagation();
                               setActiveDropdown(activeDropdown === 3 ? null : 3);
                            }}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted/10 hover:bg-muted/20 dark:hover:bg-slate-800 border border-border text-[7px] sm:text-[9px] font-bold text-muted hover:text-foreground transition-all cursor-pointer select-none"
                         >
                            <span>{getPeriodLabel(filterCard3, language)}</span>
                            <ChevronDown size={8} className={cn("transform transition-transform text-muted", activeDropdown === 3 ? "rotate-180" : "rotate-0")} />
                         </button>
                         {activeDropdown === 3 && (
                            <div className="absolute right-0 mt-1 w-20 sm:w-24 bg-card border border-border rounded-lg shadow-xl py-0.5 flex flex-col z-50">
                               {(['today', 'week', 'month', 'year', 'all'] as const).map((p) => (
                                  <button
                                     key={p}
                                     onClick={(e) => {
                                        e.stopPropagation();
                                        setFilterCard3(p);
                                        setActiveDropdown(null);
                                     }}
                                     className={cn(
                                        "px-2 py-1 text-left text-[7px] sm:text-[9px] font-bold transition-colors w-full cursor-pointer hover:bg-muted/10",
                                        filterCard3 === p ? "text-indigo-600 bg-indigo-50/50 dark:text-indigo-400 dark:bg-indigo-900/40" : "text-muted hover:text-foreground"
                                     )}
                                  >
                                     {getPeriodLabel(p, language)}
                                  </button>
                               ))}
                            </div>
                         )}
                      </div>
                   </div>
                   <p className="text-[15px] sm:text-2xl md:text-3xl font-black text-foreground italic tracking-tighter mt-1 sm:mt-4">
                      {c3Value.toFixed(1)}%
                   </p>
                   <p className="text-[7px] sm:text-[9px] font-mono font-bold text-muted mt-1 uppercase leading-none">
                      {language === 'en' ? 'In: ৳' + c3Data.income + ' | Out: ৳' + c3Data.expense : 'আয়: ৳' + c3Data.income + ' | ব্যয়: ৳' + c3Data.expense}
                   </p>
                </motion.div>

                 {/* Today's Classes Card */}
                 <motion.div 
                   initial={{ opacity: 0, y: 15 }} 
                   animate={{ opacity: 1, y: 0 }} 
                   whileHover={{ scale: 1.02, y: -5, boxShadow: "0 0 30px rgba(79,70,229,0.3)", borderColor: "rgba(165,180,252,1)", transition: { type: "spring", stiffness: 300, damping: 20 } }}
                   transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                   className="bg-card p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-border shadow-md sm:shadow-lg shadow-slate-100/50 dark:shadow-none transition-all duration-300 flex flex-col justify-between relative overflow-hidden group min-h-[100px] sm:min-h-[140px]"
                 >
                    <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full blur-xl sm:blur-2xl pointer-events-none"></div>
                    <div className="flex justify-between items-start w-full relative z-10">
                       <p className="text-[8px] sm:text-[10px] font-black text-muted uppercase tracking-widest leading-none">
                          {language === 'en' ? "Classes Count" : "ক্লাসের সংখ্যা"}
                       </p>
                       
                       {/* Mini Filter Menu */}
                       <div className="relative z-45">
                          <button 
                             onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(activeDropdown === 4 ? null : 4);
                             }}
                             className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-border hover:border-indigo-200 text-[7px] sm:text-[9px] font-bold text-muted hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer select-none"
                          >
                             <span>{getPeriodLabel(filterCard4, language)}</span>
                             <ChevronDown size={8} className={cn("transform transition-transform text-muted", activeDropdown === 4 ? "rotate-180" : "rotate-0")} />
                          </button>
                          {activeDropdown === 4 && (
                             <div className="absolute right-0 mt-1 w-20 sm:w-24 bg-card border border-border rounded-lg shadow-xl py-0.5 flex flex-col z-50">
                                {(['today', 'week', 'month', 'year', 'all'] as const).map((p) => (
                                   <button
                                      key={p}
                                      onClick={(e) => {
                                         e.stopPropagation();
                                         setFilterCard4(p);
                                         setActiveDropdown(null);
                                      }}
                                      className={cn(
                                         "px-2 py-1 text-left text-[7px] sm:text-[9px] font-bold transition-colors w-full cursor-pointer hover:bg-muted/10",
                                         filterCard4 === p ? "text-indigo-600 bg-indigo-50/50 dark:text-indigo-400 dark:bg-indigo-900/40" : "text-muted hover:text-foreground"
                                      )}
                                   >
                                      {getPeriodLabel(p, language)}
                                   </button>
                                ))}
                             </div>
                          )}
                       </div>
                    </div>
                    
                    <div className="mt-1 sm:mt-4 relative z-10 flex items-baseline justify-between w-full">
                       <p className="text-[15px] sm:text-2xl md:text-3xl font-black text-foreground italic tracking-tight">
                          {c4Value} {language === 'en' ? "Classes" : "টি ক্লাস"}
                       </p>
                       <span className="text-[10px] sm:text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                          {c4Data.classCompletionRate}% {language === 'en' ? "Done" : "সম্পন্ন"}
                       </span>
                    </div>

                    {/* Progress line (bar) */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800/60 h-1.5 rounded-full overflow-hidden mt-2 mb-1.5 relative z-10 border border-slate-200/40 dark:border-transparent">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-700" 
                        style={{ width: `${c4Data.classCompletionRate}%` }}
                      ></div>
                    </div>

                    <p className="text-[7px] sm:text-[9px] font-bold text-muted mt-1 uppercase leading-none relative z-10">
                       {getCard4Subtext(filterCard4, language)}
                    </p>
                 </motion.div>

                {/* Collected Today Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  whileHover={{ scale: 1.02, y: -5, boxShadow: "0 0 30px rgba(79,70,229,0.3)", borderColor: "rgba(165,180,252,1)", transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
                  className="bg-card p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-border shadow-md sm:shadow-lg shadow-slate-100/50 dark:shadow-none transition-all duration-300 flex flex-col justify-between relative overflow-hidden group min-h-[100px] sm:min-h-[140px]"
                >
                   <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-amber-50/50 dark:bg-amber-900/20 rounded-full blur-xl sm:blur-2xl pointer-events-none"></div>
                   <div className="flex justify-between items-start w-full relative z-10">
                      <p className="text-[8px] sm:text-[10px] font-black text-muted uppercase tracking-widest leading-none">
                         {language === 'en' ? "Collection Overview" : "সংগ্রহ বিবরণী"}
                      </p>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                         <div className="w-4 h-4 sm:w-6 sm:h-6 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded flex items-center justify-center shrink-0">
                           <Wallet size={10} className="sm:w-3.5 sm:h-3.5" />
                         </div>
                      </div>
                   </div>
                   <p className="text-[15px] sm:text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 italic tracking-tight mt-1 sm:mt-4 relative z-10">
                      ৳{c5Value}
                   </p>
                   <p className="text-[7px] sm:text-[9px] font-bold text-muted mt-1 uppercase leading-none relative z-10">
                      {getCard5Subtext('today', language)}
                   </p>
                </motion.div>

                {/* Risk Roster Status Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  whileHover={{ scale: 1.02, y: -5, boxShadow: "0 0 30px rgba(79,70,229,0.3)", borderColor: "rgba(165,180,252,1)", transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
                  className="bg-card p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-border shadow-md sm:shadow-lg shadow-slate-100/50 dark:shadow-none transition-all duration-300 flex flex-col justify-between min-h-[100px] sm:min-h-[140px] relative mt-0"
                >
                   <div className="flex justify-between items-start w-full">
                      <p className="text-[8px] sm:text-[10px] font-black text-muted uppercase tracking-widest leading-none">
                         {language === 'en' ? "Risk Roster Status" : "ঝুঁকির তালিকা সূচক"}
                      </p>
                      
                      {/* Mini Filter Menu */}
                      <div className="relative z-45">
                         <button 
                            onClick={(e) => {
                               e.stopPropagation();
                               setActiveDropdown(activeDropdown === 6 ? null : 6);
                            }}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted/10 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-border hover:border-rose-200 text-[7px] sm:text-[9px] font-bold text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer select-none"
                         >
                            <span>{getPeriodLabel(filterCard6, language)}</span>
                            <ChevronDown size={8} className={cn("transform transition-transform text-muted", activeDropdown === 6 ? "rotate-180" : "rotate-0")} />
                         </button>
                         {activeDropdown === 6 && (
                            <div className="absolute right-0 mt-1 w-20 sm:w-24 bg-card border border-border rounded-lg shadow-xl py-0.5 flex flex-col z-50">
                               {(['today', 'week', 'month', 'year', 'all'] as const).map((p) => (
                                  <button
                                     key={p}
                                     onClick={(e) => {
                                        e.stopPropagation();
                                        setFilterCard6(p);
                                        setActiveDropdown(null);
                                     }}
                                     className={cn(
                                        "px-2 py-1 text-left text-[7px] sm:text-[9px] font-bold transition-colors w-full cursor-pointer hover:bg-muted/10",
                                        filterCard6 === p ? "text-rose-600 bg-rose-50/50 dark:text-rose-400 dark:bg-rose-900/40" : "text-muted hover:text-foreground"
                                     )}
                                  >
                                     {getPeriodLabel(p, language)}
                                  </button>
                               ))}
                            </div>
                         )}
                      </div>
                   </div>
                   <div className="mt-1 sm:mt-4">
                      <span className={cn(
                         "inline-block text-[8px] sm:text-xs font-black px-2.5 py-0.5 sm:px-3 sm:py-1.5 rounded-full border text-center w-auto uppercase tracking-widest leading-none",
                         c6RiskColor
                      )}>
                         {language === 'en' ? c6RiskLevel : (
                            c6RiskLevel === 'HIGH' ? "উচ্চ" : 
                            c6RiskLevel === 'MEDIUM' ? "মাঝারি" : "নিম্ন"
                         )}
                      </span>
                   </div>
                   <p className="text-[7px] sm:text-[9px] font-bold text-muted mt-1 uppercase leading-none">
                      {language === 'en' ? "Debt-to-Cash Ratio: " + (c6Ratio * 100).toFixed(0) + "%" : "বকেয়া অনুপাত: " + (c6Ratio * 100).toFixed(0) + "%"}
                   </p>
                </motion.div>
             </div>

              {/* Daily Revenue Trend Chart */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5, delay: 0.32 }}
                className="bg-card border border-border p-6 sm:p-8 rounded-[2.5rem] shadow-xl shadow-slate-100/50 dark:shadow-none mb-6 sm:mb-8"
              >
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="space-y-1">
                       <h3 className="text-xl font-black text-foreground tracking-tight uppercase italic">{t.dailyRevenueTrend}</h3>
                       <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">{t.revenueThisMonth}</p>
                    </div>
                    <div className="flex items-center gap-4 bg-background p-2 rounded-2xl border border-border">
                       <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                          <span className="text-[10px] font-black text-muted uppercase tracking-widest">{t.collectionAmount}</span>
                       </div>
                    </div>
                 </div>

                 <div className="h-[250px] sm:h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={dailyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                             <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-foreground" />
                          <XAxis 
                             dataKey="day" 
                             axisLine={false}
                             tickLine={false}
                             tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                             className="text-muted-foreground font-plus"
                             dy={10}
                          />
                          <YAxis 
                             axisLine={false}
                             tickLine={false}
                             tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                             className="text-muted-foreground font-plus"
                             tickFormatter={(value) => `৳${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                          />
                          <Tooltip 
                             contentStyle={{ 
                                backgroundColor: theme === 'dark' ? '#1e293b' : 'white', 
                                borderRadius: '16px', 
                                border: 'none', 
                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                padding: '12px'
                             }}
                             labelStyle={{ fontWeight: 900, fontSize: '12px', color: theme === 'dark' ? '#f8fafc' : '#1e293b', marginBottom: '4px', textTransform: 'uppercase' }}
                             itemStyle={{ fontWeight: 700, fontSize: '12px', color: '#6366f1' }}
                             formatter={(value: any) => [`৳${value}`, t.collectionAmount]}
                             labelFormatter={(label) => `Day ${label}`}
                          />
                          <Area 
                             type="monotone" 
                             dataKey="revenue" 
                             stroke="#6366f1" 
                             strokeWidth={4}
                             fillOpacity={1} 
                             fill="url(#colorRevenue)" 
                             animationDuration={2000}
                          />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </motion.div>

            {/* Active Batches 'Quick Stats' Summary Cards (Teacher & Admin Overview) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.33 }}
              className="bg-card p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-border shadow-xl shadow-slate-200/20 dark:shadow-none mb-6 sm:mb-8"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                      {language === 'en' ? "Live Seat & Enrollment Tracker" : "লাইভ আসন সক্ষমতা ও রুটিন"}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-foreground uppercase italic tracking-tight mt-1">
                    {language === 'en' ? "Active Batches Quick Stats" : "সক্রিয় ব্যাচ কুইক স্ট্যাটস"}
                  </h3>
                  <p className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-widest mt-0.5">
                    {language === 'en' ? "Provides teachers an immediate overview of active rosters and enrollment levels" : "শিক্ষকদের জন্য ব্যাচভিত্তিক মোট সক্রিয় শিক্ষার্থী ও আসন ওভারভিউ।"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(batches || []).filter(b => b.status === 'Active' || b.status === "active").map(batch => {
                  const batchStudents = (students || []).filter(s => s.batch === batch.name && s.status === 'Active');
                  const studentCount = batchStudents.length;
                  const capacity = batch.maxCapacity || 40;
                  const fillPercentage = Math.min(100, Math.round((studentCount / capacity) * 100));
                  const isFull = studentCount >= capacity;

                  return (
                    <motion.div
                      key={batch.id}
                      whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
                      className="bg-background border border-border p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden h-36"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-black text-foreground truncate max-w-[70%]">{batch.name}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest border",
                            isFull 
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/20" 
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          )}>
                            {isFull 
                              ? (language === 'en' ? 'Full' : 'পূর্ণ') 
                              : (language === 'en' ? 'Active' : 'সক্রিয়')}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                          👤 {language === 'en' ? `${studentCount} Enrolled` : `${studentCount} জন শিক্ষার্থী`}
                        </p>
                      </div>

                      <div className="space-y-1 mt-4">
                        <div className="flex justify-between items-center text-[8px] font-bold text-muted uppercase tracking-wide">
                          <span>{language === 'en' ? 'CAPACITY FILL' : 'আসন সক্ষমতা'}</span>
                          <span>{fillPercentage}% ({studentCount}/{capacity})</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-transparent">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              isFull ? "bg-rose-500" : "bg-indigo-500"
                            )} 
                            style={{ width: `${fillPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Batch Performance Comparison Table (Requirement #3) */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }} 
              whileHover={{ scale: 1.01, boxShadow: "0 0 40px rgba(79,70,229,0.2)", borderColor: "rgba(165,180,252,1)", transition: { type: "spring", stiffness: 300, damping: 20 } }}
              transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
              className="bg-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border shadow-xl shadow-slate-200/20 dark:shadow-none"
            >
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                  <div>
                     <h3 className="text-base sm:text-lg font-black text-foreground uppercase italic tracking-tight">{language === 'en' ? 'Batch Performance Matrice' : 'ব্যাচ পারফরম্যান্স ম্যাট্রিক্স'}</h3>
                     <p className="text-[8px] sm:text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">{language === 'en' ? 'Cross-sectional study of active batches' : 'সক্রিয় ব্যাচসমূহের তুলনামূলক বিশ্লেষণ'}</p>
                  </div>
                  {weakestBatchObj && (
                     <div className="flex items-center gap-2 bg-rose-100 dark:bg-rose-950/45 border border-rose-200 dark:border-rose-900/60 px-4 py-2 rounded-2xl text-[9px] sm:text-[10px] font-black text-rose-800 dark:text-rose-300 uppercase tracking-widest w-full sm:w-auto justify-center sm:justify-start shadow-sm shadow-rose-200/20 dark:shadow-none">
                        <span>⚠️ Attention Required:</span>
                        <span className="italic underline">{weakestBatchObj.name} ({weakestBatchObj.attRate.toFixed(0)}% attendance)</span>
                     </div>
                  )}
               </div>

               {/* Mobile View: Cards */}
               <div className="flex flex-col gap-3 sm:hidden">
                  {batchPerformanceList.map(batch => {
                     const isWeakest = weakestBatchObj && batch.name === weakestBatchObj.name;
                     return (
                        <div key={batch.name} className={cn("p-4 rounded-xl border flex flex-col gap-3", isWeakest ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40" : "bg-muted/5 border-border")}>
                           <div className="flex justify-between items-center bg-white/5 px-3 py-2 -mx-2 -mt-2 rounded-lg">
                              <div className="font-black text-foreground flex items-center gap-2 text-sm uppercase italic tracking-tight">
                                 {batch.name}
                                 {isWeakest && <span className="bg-rose-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest shrink-0">Weakest</span>}
                              </div>
                              <span className={cn("font-black px-2 py-0.5 rounded-full text-[10px] border shadow-sm shrink-0", isWeakest ? "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800" : "bg-card text-foreground border-border")}>
                                 {batch.attRate.toFixed(1)}% Att.
                              </span>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-0.5 bg-card p-2.5 rounded-lg border border-border shadow-sm">
                                 <span className="text-[8px] font-black text-muted uppercase tracking-widest">{language === 'en' ? 'Active Rosters' : 'ভর্তিকৃত শিক্ষার্থী'}</span>
                                 <span className="font-bold text-foreground text-sm">{batch.studentCount} active</span>
                              </div>
                              <div className="flex flex-col gap-0.5 bg-card p-2.5 rounded-lg border border-border shadow-sm">
                                 <span className="text-[8px] font-black text-muted uppercase tracking-widest">{language === 'en' ? 'Collected Revenue' : 'সংগৃহীত অর্থ'}</span>
                                 <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">৳{batch.income}</span>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>

               {/* Desktop View: Table */}
               <div className="hidden sm:block overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                     <table className="w-full text-left text-xs text-muted">
                        <thead className="bg-muted/5 text-muted font-bold uppercase text-[9px] tracking-widest border-b border-border">
                           <tr>
                              <th className="p-4">{language === 'en' ? 'Batch Details' : 'ব্যাচের নাম'}</th>
                              <th className="p-4 text-right">{language === 'en' ? 'Active Rosters' : 'ভর্তিকৃত শিক্ষার্থী'}</th>
                              <th className="p-4 text-right">{language === 'en' ? 'Collected Revenue' : 'সংগৃহীত অর্থ'}</th>
                              <th className="p-4 text-right">{language === 'en' ? 'Avg Attendance' : 'গড় উপস্থিতি'}</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                           {batchPerformanceList.map(batch => {
                             const isWeakest = weakestBatchObj && batch.name === weakestBatchObj.name;
                             return (
                               <tr key={batch.name} className={isWeakest ? "bg-rose-500/5" : ""}>
                                  <td className="p-4 font-black text-foreground flex items-center gap-2">
                                     {batch.name}
                                     {isWeakest && <span className="bg-rose-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest">Weakest</span>}
                                  </td>
                                  <td className="p-4 text-right font-bold text-muted">{batch.studentCount} active</td>
                                  <td className="p-4 text-right font-mono font-black text-foreground">৳{batch.income}</td>
                                  <td className="p-4 text-right">
                                     <span className="font-black px-2 py-0.5 rounded text-[10px]">
                                        {batch.attRate.toFixed(1)}%
                                     </span>
                                  </td>
                               </tr>
                             );
                           })}
                        </tbody>
                     </table>
                  </div>
               </div>
            </motion.div>
         </motion.div>
       </>
    )}

       {activeTab === 'intel' && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Machine Learning Revenue Forecast Widget */}
            <motion.div 
              whileHover={{ scale: 1.01, transition: { type: "spring", stiffness: 300, damping: 20 } }}
              className="bg-card p-8 rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden group"
            >
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-700"></div>
               
               <div className="relative z-10 flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                     <div className="flex items-center justify-between">
                        <div className="space-y-1">
                           <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1 rounded-full w-fit">
                              <Sparkles size={14} className="text-indigo-600 animate-pulse" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-700">{language === 'en' ? 'AI Predictive Analytics' : 'এআই প্রক্ষেপণ বিশ্লেষণ'}</span>
                           </div>
                           <h3 className="text-2xl font-black text-foreground tracking-tight italic uppercase">{language === 'en' ? 'Revenue Forecast' : 'রাজস্ব প্রক্ষেপণ'}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                              <span className="text-[9px] font-black text-muted uppercase tracking-widest">{language === 'en' ? 'Actual' : 'প্রকৃত'}</span>
                           </div>
                           <div className="flex items-center gap-1.5 ml-3">
                              <div className="w-2.5 h-2.5 rounded-full bg-indigo-400/40 border border-indigo-500/30"></div>
                              <span className="text-[9px] font-black text-muted uppercase tracking-widest">{language === 'en' ? 'Forecast' : 'ভবিষ্যদ্বাণী'}</span>
                           </div>
                        </div>
                     </div>

                     <div className="h-[350px] w-full">
                        {isForecasting ? (
                          <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
                             <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                             <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] animate-pulse">Analyzing Payment Patterns...</p>
                          </div>
                        ) : (forecastData && !forecastData.error && forecastData.forecast) ? (
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={combinedForecastData}>
                                <defs>
                                   <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                   </linearGradient>
                                   <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                   </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                <XAxis 
                                   dataKey="name" 
                                   axisLine={false} 
                                   tickLine={false} 
                                   tick={{ fontSize: 9, fontWeight: 800, fill: 'var(--muted)', letterSpacing: '0.1em' }} 
                                />
                                <YAxis 
                                   axisLine={false} 
                                   tickLine={false} 
                                   tick={{ fontSize: 9, fontWeight: 800, fill: 'var(--muted)' }}
                                   tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`}
                                />
                                <Tooltip 
                                   contentStyle={{ 
                                      backgroundColor: 'var(--card)', 
                                      borderRadius: '1.5rem', 
                                      border: '1px solid var(--border)', 
                                      boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' 
                                   }}
                                   itemStyle={{ fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}
                                   labelStyle={{ fontWeight: 900, color: 'var(--foreground)', marginBottom: '4px', letterSpacing: '0.05em' }}
                                />
                                <Area 
                                   type="monotone" 
                                   dataKey="Actual" 
                                   stroke="#4f46e5" 
                                   strokeWidth={4}
                                   fillOpacity={1} 
                                   fill="url(#colorActual)" 
                                   activeDot={{ r: 8, strokeWidth: 0 }}
                                />
                                <Area 
                                   type="monotone" 
                                   dataKey="Predicted" 
                                   stroke="#818cf8" 
                                   strokeWidth={4}
                                   strokeDasharray="8 8"
                                   fillOpacity={1} 
                                   fill="url(#colorPredicted)" 
                                   activeDot={{ r: 8, strokeWidth: 0 }}
                                />
                             </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-center text-center space-y-4 px-4">
                              {forecastData?.error && (
                                 <p className="text-xs font-semibold text-rose-500 max-w-md my-2">
                                    {language === 'en' ? 'Error generating forecast: ' : 'পূর্বাভাস তৈরি করতে সমস্যা হয়েছে: '} {forecastData.error}
                                 </p>
                              )}
                             <BarChart3 size={48} className="text-muted opacity-20" />
                             <button 
                                onClick={generateForecast}
                                className="px-8 py-3 bg-slate-900 dark:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all shadow-xl"
                             >
                                {forecastData?.error ? (language === 'en' ? 'Retry AI Forecast' : 'পুনরায় চেষ্টা করুন') : (language === 'en' ? 'Initialize AI Forecast Engine' : 'এআই পূর্বাভাস ইঞ্জিন শুরু করুন')}
                             </button>
                          </div>
                        )}
                     </div>
                  </div>

                  {forecastData && !forecastData.error && forecastData.forecast && (
                     <div className="w-full lg:w-80 space-y-4">
                        <div className="bg-muted/10 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-border/50 dark:border-slate-800">
                           <h4 className="text-[10px] font-black text-muted uppercase tracking-widest mb-4 inline-flex items-center gap-2">
                              <TrendingUp size={12} className="text-emerald-500" />
                              {language === 'en' ? 'Strategy Insights' : 'কৌশলী বিশ্লেষণ'}
                           </h4>
                           <p className="text-xs font-bold text-foreground leading-relaxed">
                              {language === 'en' ? forecastData.insight.en : forecastData.insight.bn}
                           </p>
                           
                           <div className="mt-6 pt-6 border-t border-border/50 dark:border-slate-800 flex items-center justify-between">
                              <div>
                                 <p className="text-[8px] font-black text-muted uppercase tracking-widest">{language === 'en' ? 'AI Confidence' : 'এআই নিশ্চয়তা'}</p>
                                 <p className="text-xl font-black text-foreground italic">{forecastData.confidenceScore}%</p>
                               </div>
                               <div className="h-12 w-12 rounded-full border-4 border-emerald-500/20 flex items-center justify-center p-1">
                                  <div className="h-full w-full rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                               </div>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                           {forecastData.forecast.map((f: any, i: number) => (
                              <div key={i} className="bg-card p-4 rounded-2xl border border-border flex items-center justify-between group/item hover:border-indigo-200 transition-all">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-muted/10 dark:bg-slate-900 flex items-center justify-center font-black text-[10px] text-muted">M{i+1}</div>
                                    <div>
                                       <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{f.month}</p>
                                       <p className="text-sm font-black text-foreground">৳{f.predictedRevenue.toLocaleString()}</p>
                                    </div>
                                 </div>
                                 <div className={cn(
                                    "text-[10px] font-black px-2 py-1 rounded-lg italic",
                                    f.growth >= 0 ? "text-emerald-500 bg-emerald-500/5" : "text-rose-500 bg-rose-500/5"
                                 )}>
                                    {f.growth >= 0 ? '+' : ''}{f.growth.toFixed(1)}%
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Teacher Efficiency Metrics (Requirement #4) */}
              <motion.div whileHover={{ scale: 1.02, y: -5, boxShadow: "0 0 40px rgba(79,70,229,0.2)", borderColor: "rgba(165,180,252,1)", transition: { type: "spring", stiffness: 300, damping: 20 } }} className="bg-card p-6 rounded-3xl border border-border shadow-xl dark:shadow-none">
                 <h3 className="text-lg font-black text-foreground uppercase italic tracking-tight mb-6">
                    {language === 'en' ? 'Faculty Efficiency Scorecard' : 'প্রভাষক কার্যদক্ষতা সূচক'}
                 </h3>
                 <div className="space-y-4">
                    {upgradedTeacherPerformance.map(teacher => (
                      <div key={teacher.name} className="p-4 bg-muted/10 dark:bg-slate-900 rounded-2xl border border-border/50/50 dark:border-slate-800 flex justify-between items-center hover:shadow-md transition-all gap-4">
                         <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{teacher.name}</p>
                            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">{teacher.subject}</p>
                            
                            <div className="grid grid-cols-3 gap-2 mt-3 text-[9px] text-muted font-bold uppercase tracking-wider">
                               <div>
                                  <span className="block text-muted-foreground font-medium">Classes:</span>
                                  <span className="text-foreground dark:text-slate-300 font-extrabold">{teacher.classes} session{teacher.classes > 1 ? 's' : ''}</span>
                               </div>
                               <div>
                                  <span className="block text-muted-foreground font-medium">Student Att:</span>
                                  <span className="text-foreground dark:text-slate-300 font-extrabold">{teacher.avgAttendance.toFixed(0)}% avg</span>
                               </div>
                               <div>
                                  <span className="block text-muted-foreground font-medium font-bold">Share:</span>
                                  <span className="text-foreground dark:text-slate-300 font-extrabold">{teacher.contribution.toFixed(0)}% load</span>
                               </div>
                            </div>
                         </div>

                         <div className="text-center shrink-0">
                            <span className="block text-[8px] font-black uppercase text-muted-foreground tracking-wider">Index Score</span>
                            <span className="text-2xl sm:text-3xl font-black italic tracking-tighter text-slate-900 dark:text-slate-100">
                               {teacher.score}
                            </span>
                         </div>
                      </div>
                    ))}
                    {upgradedTeacherPerformance.length === 0 && (
                       <p className="text-xs font-semibold text-muted-foreground italic py-6 text-center">{language === 'en' ? 'No active teacher roster logs available.' : 'কোন সক্রিয় প্রভাষকের রেকর্ড নেই।'}</p>
                    )}
                 </div>
              </motion.div>

              {/* Growth Intelligence Panel (Requirement #5) */}
              <motion.div whileHover={{ scale: 1.02, y: -5, boxShadow: "0 0 40px rgba(79,70,229,0.2)", borderColor: "rgba(165,180,252,1)", transition: { type: "spring", stiffness: 300, damping: 20 } }} className="bg-card p-6 rounded-3xl border border-border shadow-xl dark:shadow-none flex flex-col justify-between">
                 <div>
                    <h3 className="text-lg font-black text-foreground uppercase italic tracking-tight mb-6">
                       {language === 'en' ? 'Growth Intelligence Node' : 'গ্রোথ ইন্টেলিজেন্স ও ভর্তি প্রবাহ'}
                    </h3>
                    
                    {/* Growth KPIs Row */}
                    <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950 text-white rounded-2xl border border-slate-900 mb-6">
                       <div className="text-center">
                          <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest leading-none">{language === 'en' ? 'New Admits' : 'নতুন ভর্তি'}</p>
                          <p className="text-xl sm:text-2xl font-black text-white italic tracking-tight mt-1">+{newStudentsCount}</p>
                          <p className="text-[7px] font-mono text-muted-foreground mt-0.5 uppercase">This Month</p>
                       </div>
                       <div className="text-center border-x border-white/10">
                          <p className="text-[8px] font-black text-rose-300 uppercase tracking-widest leading-none">{language === 'en' ? 'Dropouts' : 'বাদ পড়া'}</p>
                          <p className="text-xl sm:text-2xl font-black text-rose-400 italic tracking-tight mt-1">-{dropoutStudentsCount}</p>
                          <p className="text-[7px] font-mono text-muted-foreground mt-0.5 uppercase">Inactive</p>
                       </div>
                       <div className="text-center">
                          <p className="text-[8px] font-black text-emerald-300 uppercase tracking-widest leading-none">{language === 'en' ? 'Net Grow %' : 'নেট প্রবৃদ্ধি'}</p>
                          <p className="text-xl sm:text-2xl font-black text-emerald-400 italic tracking-tight mt-1">
                             {netGrowthPercent >= 0 ? '+' : ''}{netGrowthPercent.toFixed(1)}%
                          </p>
                          <p className="text-[7px] font-mono text-muted-foreground mt-0.5 uppercase">Compound</p>
                       </div>
                    </div>

                    <div className="h-[200px] sm:h-[220px]">
                       <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800/60" />
                              <XAxis 
                                 dataKey="month" 
                                 axisLine={false}
                                 tickLine={false}
                                 tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                                 className="text-muted-foreground"
                                 dy={10}
                              />
                              <YAxis 
                                 axisLine={false}
                                 tickLine={false}
                                 tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                                 className="text-muted-foreground"
                                 dx={-5}
                              />
                             <Tooltip 
                                 contentStyle={{ 
                                    backgroundColor: theme === 'dark' ? '#1e293b' : 'white', 
                                    borderRadius: '16px', 
                                    border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    fontFamily: 'inherit',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    padding: '8px 12px'
                                 }}
                                 itemStyle={{ color: '#6366f1' }}
                                 labelStyle={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                 formatter={(value: any) => [`${value} ${language === 'en' ? 'Students' : 'ছাত্র-ছাত্রী'}`, language === 'en' ? 'Enrollment' : 'মোট শিক্ষার্থী']}
                              />
                             <Line 
                                 type="monotone" 
                                 dataKey="Students" 
                                 stroke="#6366f1" 
                                 strokeWidth={3} 
                                 dot={{ r: 4, stroke: '#6366f1', strokeWidth: 2, fill: theme === 'dark' ? '#0f172a' : '#ffffff' }}
                                 activeDot={{ r: 7, stroke: '#6366f1', strokeWidth: 2, fill: '#818cf8' }}
                                 animationDuration={1500}
                              />
                          </LineChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 p-4 bg-muted/10 dark:bg-slate-900 rounded-2xl border border-border/50 dark:border-slate-800">
                    <div>
                       <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest">Enrollment Peak Index</p>
                       <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">{Math.max(...trendData.map(d => d.Students))} active students</p>
                    </div>
                    <div className="sm:text-right">
                       <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest">Admission Momentum</p>
                       <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                          {netGrowthPercent > 0 ? 'Expansive 🔥' : 'Consolidating ⚖️'}
                       </p>
                    </div>
                 </div>
              </motion.div>
            </div>
         </motion.div>
       )}

       {activeTab === 'alerts' && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Financial High-Due Students Zone (Top 5 Dues) */}
               <div className="bg-card text-card-foreground dark:bg-slate-900 border border-border/50 dark:border-slate-800 p-6 rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-none flex flex-col justify-between gap-6 min-w-0">
                  <div>
                     <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                           {language === 'en' ? 'Top 5 Debts' : 'শীর্ষ ৫টি বকেয়া'}
                        </span>
                        <span className="text-[8px] font-mono text-muted-foreground">Total: ৳{totalDueAccumulated}</span>
                     </div>
                     <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">{language === 'en' ? 'Critical Deficit Alerts' : 'গুরুতর বকেয়া এলার্ট'}</h4>
                     <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{language === 'en' ? 'Top students with high outstanding amounts' : 'উচ্চ পরিমাণ বিলম্বিত বকেয়া শিক্ষার্থী'}</p>
                     
                     <div className="space-y-3 mt-6">
                        {top5Dues.map((item, idx) => (
                          <div key={item.student.id} className="flex justify-between items-center bg-muted/10 p-3 rounded-xl border border-border/50/80 hover:bg-slate-100/50 transition-colors gap-2 min-w-0">
                             <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 bg-slate-950 text-white rounded-full flex items-center justify-center text-[8px] font-bold shrink-0">{idx + 1}</span>
                                <span className="text-xs font-black text-foreground truncate">{item.student.name}</span>
                             </div>
                             <span className="text-xs font-black text-rose-600 whitespace-nowrap shrink-0">৳{item.dueAmount}</span>
                          </div>
                        ))}
                        {top5Dues.length === 0 && (
                           <p className="text-xs font-semibold text-muted-foreground italic py-4 text-center">{language === 'en' ? 'No outstanding dues!' : 'কোনো বকেয়া নেই!'}</p>
                        )}
                     </div>
                  </div>
                  <button 
                    onClick={() => onNavigate?.('dues')} 
                    className="mt-6 w-full py-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm"
                  >
                     {language === 'en' ? 'Reconcile Financial Ledger' : 'বকেয়া খাতা সমন্বয় করুন'}
                  </button>
               </div>

               {/* Consecutive Absenteeism Alert Board (3+ Consecutive Days) */}
               <div className="bg-card text-card-foreground dark:bg-slate-900 border border-border/50 dark:border-slate-800 p-6 rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-none flex flex-col justify-between gap-6 min-w-0">
                  <div>
                     <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                           {language === 'en' ? 'Dropout Prevention' : 'ঝরে পড়া রোধ'}
                        </span>
                        <span className="text-[8px] font-mono text-muted-foreground">Absent 3+ Days</span>
                     </div>
                     <h4 className="text-lg font-black text-foreground uppercase italic tracking-tight">{language === 'en' ? 'Chronic Absenteeism' : 'ক্রমাগত অনুপস্থিতি এলার্ট'}</h4>
                     <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">{language === 'en' ? 'Students missed school for 3+ days straight' : 'টানা ৩ বা তার বেশি দিন অনুপস্থিত শিক্ষার্থী'}</p>
                     
                     <div className="space-y-3 mt-6">
                        {absentAlertStudents.slice(0, 5).map((student, idx) => (
                          <div key={student.id} className="flex justify-between items-center bg-muted/20 p-3 rounded-xl border border-border hover:bg-amber-50/50 dark:hover:bg-amber-900/20 transition-colors gap-2 min-w-0">
                             <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold shrink-0">{idx + 1}</span>
                                <span className="text-xs font-black text-foreground/80 truncate">{student.name}</span>
                             </div>
                             <span className="text-[8px] font-black text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded whitespace-nowrap shrink-0">
                                {language === 'en' ? 'Critical' : 'টানা অনুপস্থিত'}
                             </span>
                          </div>
                        ))}
                        {absentAlertStudents.length === 0 && (
                           <p className="text-xs font-semibold text-muted/60 italic py-4 text-center">{language === 'en' ? 'Excellent attendance logs!' : 'সবাই চমৎকার উপস্থিত!'}</p>
                        )}
                     </div>
                  </div>
                  <button 
                    onClick={() => onNavigate?.('attendance')} 
                    className="mt-6 w-full py-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all shadow-sm"
                  >
                     {language === 'en' ? 'Initiate Parent Audits' : 'অভিভাবকের সাথে যোগাযোগ'}
                  </button>
               </div>

               {/* Severe Low Attendance Alerts (<60%) */}
               <div className="bg-card border border-border p-6 rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-none flex flex-col justify-between gap-6 min-w-0">
                  <div>
                     <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-3 py-1 rounded-full">
                           {language === 'en' ? 'Academic Support' : 'একাডেমিক সহায়তা'}
                        </span>
                        <span className="text-[8px] font-mono text-muted">Attendance &lt; 60%</span>
                     </div>
                     <h4 className="text-lg font-black text-foreground uppercase italic tracking-tight">{language === 'en' ? 'Critical Performance' : 'সংকটাপন্ন উপস্থিতি এলার্ট'}</h4>
                     <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">{language === 'en' ? 'Extremely low engagement rosters' : 'অত্যন্ত নিম্ন হারের উপস্থিতি'}</p>
                     
                     <div className="space-y-3 mt-6">
                        {lowAttendanceStudents.slice(0, 5).map((student, idx) => (
                          <div key={student.id} className="flex justify-between items-center bg-muted/30 p-3 rounded-xl border border-border hover:bg-rose-50/50 dark:hover:bg-rose-900/20 transition-colors gap-2 min-w-0">
                             <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold shrink-0">{idx + 1}</span>
                                <span className="text-xs font-black text-foreground/70 truncate">{student.name}</span>
                             </div>
                             <span className="text-xs font-black text-rose-600 shrink-0 whitespace-nowrap">{student.attRate.toFixed(0)}%</span>
                          </div>
                        ))}
                        {lowAttendanceStudents.length === 0 && (
                           <p className="text-xs font-semibold text-muted/60 italic py-4 text-center">{language === 'en' ? 'No students with low attendance!' : 'সকল শিক্ষার্থীর আশানুরূপ উপস্থিতি!'}</p>
                        )}
                     </div>
                  </div>
                  <button 
                    onClick={() => onNavigate?.('reports')} 
                    className="mt-6 w-full py-3.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-sm"
                  >
                     {language === 'en' ? 'Launch Retention Desk' : 'একাডেমিক অডিট ট্রিগার'}
                  </button>
               </div>
            </div>

            {/* Student Risk Score Radar (Requirement #4) */}
            <motion.div whileHover={{ scale: 1.02, y: -5, boxShadow: "0 0 40px rgba(79,70,229,0.2)", borderColor: "rgba(165,180,252,1)", transition: { type: "spring", stiffness: 300, damping: 20 } }} className="bg-card p-6 rounded-3xl border border-border shadow-xl shadow-slate-200/20 dark:shadow-none">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                     <h3 className="text-lg font-black text-foreground uppercase italic tracking-tight">{language === 'en' ? 'Student Risk Radar' : 'শিক্ষার্থী ঝুঁকি রাডার'}</h3>
                     <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">{language === 'en' ? 'Proprietary AI Score based on attendance, dues, and activity' : 'উপস্থিতি ও বকেয়ার উপর ভিত্তি করে এআই স্কোর'}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                     <span className="flex-1 sm:flex-none text-center text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 border border-rose-100 dark:border-rose-900/30">
                        {riskAnalysis.filter(s => s.riskStatus === 'HIGH').length} High
                     </span>
                     <span className="flex-1 sm:flex-none text-center text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 border border-amber-100 dark:border-amber-900/30">
                        {riskAnalysis.filter(s => s.riskStatus === 'MEDIUM').length} Med
                     </span>
                     <span className="flex-1 sm:flex-none text-center text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30">
                        {riskAnalysis.filter(s => s.riskStatus === 'SAFE').length} Safe
                     </span>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {riskAnalysis.filter(s => s.riskStatus !== 'SAFE').slice(0, 8).map(student => (
                     <div key={student.id} className="p-4 rounded-2xl border flex flex-col justify-between gap-4 bg-muted/20 border-border">
                        <div>
                           <div className="flex justify-between items-start mb-2">
                              <span className={cn(
                                 "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                                 student.riskStatus === 'HIGH' ? "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400" : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400"
                              )}>
                                 {student.riskStatus} RISK
                              </span>
                              <span className="text-[10px] font-black font-mono text-muted">Score: {student.score}</span>
                           </div>
                           <h4 className="text-sm font-black text-foreground truncate">{student.name}</h4>
                           <p className="text-[10px] font-bold text-muted truncate">{student.batch}</p>
                        </div>
                        <div className="space-y-1">
                           {student.intelligence?.isAbsentAlert && <p className="text-[9px] font-bold text-rose-600 truncate">• Long Absence</p>}
                           {student.intelligence?.isLowAttendance && <p className="text-[9px] font-bold text-amber-600 truncate">• Low Attendance</p>}
                           {student.dueAmount > 0 && <p className="text-[9px] font-bold text-muted truncate">• ৳{student.dueAmount} Dues</p>}
                        </div>
                     </div>
                  ))}
                  {riskAnalysis.filter(s => s.riskStatus !== 'SAFE').length === 0 && (
                     <div className="col-span-full py-8 text-center text-muted-foreground font-bold italic text-sm">
                        {language === 'en' ? 'All students are in the safe zone!' : 'সকল শিক্ষার্থী নিরাপদ জোনে আছে!'}
                     </div>
                  )}
               </div>
            </motion.div>

            {/* One-Click Analysis Engine (Requirement #9 & #10) */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -5, boxShadow: "0 0 40px rgba(79,70,229,0.4)", transition: { type: "spring", stiffness: 300, damping: 20 } }} 
              className="bg-slate-950 p-6 md:p-8 rounded-3xl border border-slate-900 shadow-2xl transition-all duration-500 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                     <div className="flex justify-center md:justify-start items-center gap-2">
                        <Zap size={16} className="text-amber-400 animate-pulse" />
                        <h3 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tight">{language === 'en' ? 'Deep Analyze My Coaching' : 'সম্পূর্ণ একাডেমি স্ক্যান'}</h3>
                     </div>
                     <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">{language === 'en' ? 'Generate a comprehensive human-readable automated report' : 'স্বয়ংক্রিয় বিস্তারিত এআই রিপোর্ট তৈরি করুন'}</p>
                  </div>
                  {!showAnalysis && (
                     <button 
                       onClick={() => {
                           setIsAnalyzing(true);
                           setTimeout(() => {
                              setIsAnalyzing(false);
                              setShowAnalysis(true);
                           }, 1500);
                       }}
                       disabled={isAnalyzing}
                       className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:shadow-lg hover:-translate-y-1 hover:shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {isAnalyzing ? (
                           <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              {language === 'en' ? 'Analyzing...' : 'বিশ্লেষণ চলছে...'}
                           </>
                        ) : (
                           <>
                              <Sparkles size={16} /> 
                              {language === 'en' ? 'Start Analysis' : 'বিশ্লেষণ শুরু করুন'}
                           </>
                        )}
                     </button>
                  )}
               </div>

               {showAnalysis && (
                  <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     className="relative z-10 mt-8 pt-8 border-t border-white/10"
                  >
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500">{language === 'en' ? '⚠️ Weak Areas & Risks' : '⚠️ দুর্বল দিক ও ঝুঁকি'}</h4>
                           <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                              <p className="text-xs text-slate-300 font-medium">
                                 • {language === 'en' ? `Financial collection is delayed. ৳${totalDueAccumulated} currently uncollected.` : `অর্থ সংগ্রহ ধীর। বর্তমানে ৳${totalDueAccumulated} বকেয়া আছে।`}
                              </p>
                              <p className="text-xs text-slate-300 font-medium">
                                 • {language === 'en' ? `${riskAnalysis.filter(s => s.riskStatus === 'HIGH').length} students are at high risk of dropout.` : `${riskAnalysis.filter(s => s.riskStatus === 'HIGH').length} জন শিক্ষার্থী ঝরে পড়ার উচ্চ ঝুঁকিতে।`}
                              </p>
                           </div>
                        </div>
                        <div className="space-y-3">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{language === 'en' ? '✨ Opportunities & Suggestions' : '✨ সুযোগ ও পরামর্শ'}</h4>
                           <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                              {netGrowthPercent > 0 && (
                                 <p className="text-xs text-slate-300 font-medium">
                                    • {language === 'en' ? `Student base is growing by ${netGrowthPercent.toFixed(1)}%. Capitalize on this momentum.` : `শিক্ষার্থীর সংখ্যা ${netGrowthPercent.toFixed(1)}% বৃদ্ধি পাচ্ছে।`}
                                 </p>
                              )}
                              <p className="text-xs text-slate-300 font-medium">
                                 • {language === 'en' ? `Schedule an immediate Parent-Teacher session for at-risk students.` : `ঝুঁকিতে থাকা শিক্ষার্থীদের জন্য অবিলম্বে অভিভাবক সভার আয়োজন করুন।`}
                              </p>
                              <p className="text-xs text-slate-300 font-medium">
                                 • {language === 'en' ? `Average attendance rate today is ${attendanceRate.toFixed(0)}%.` : `আজকের গড় উপস্থিতির হার ${attendanceRate.toFixed(0)}%।`}
                              </p>
                           </div>
                        </div>
                     </div>
                     <div className="mt-8 flex justify-center">
                        <button 
                          onClick={() => setShowAnalysis(false)}
                          className="text-[9px] font-black uppercase tracking-widest text-muted hover:text-white transition-colors"
                        >
                           {language === 'en' ? 'Close Report' : 'রিপোর্ট বন্ধ করুন'}
                        </button>
                     </div>
                  </motion.div>
               )}
            </motion.div>

         </motion.div>
       )}



        {/* Floating Toast Notification */}
        {alertMessage && (
          <div className="fixed bottom-5 right-5 bg-slate-900 border border-indigo-500/30 text-white px-6 py-4 rounded-3xl shadow-2xl z-50 flex items-center gap-3 animate-bounce">
            <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />
            <span className="text-xs font-black uppercase tracking-wider text-white">{alertMessage}</span>
          </div>
        )}

        {/* Smart Decisions Action Resolution Modal */}
        {selectedActionInsight && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-card text-card-foreground rounded-[2.5rem] border border-border/50 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden text-foreground"
            >
              {/* Header */}
              <div className="flex justify-between items-center bg-slate-900 text-white p-6 md:p-8 shrink-0 animate-none">
                 <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded">
                       {selectedActionInsight.category}
                    </span>
                    <h3 className="text-xl font-black italic tracking-tight text-white uppercase mt-2">
                       {language === 'en' ? 'Smart Action Resolution Hub' : 'স্মার্ট অ্যাকশন ও যোগাযোগ হাব'}
                    </h3>
                    <p className="text-xs text-muted-foreground font-bold max-w-2xl mt-0.5">
                       {selectedActionInsight.text}
                    </p>
                 </div>
                 <button 
                   onClick={() => setSelectedActionInsight(null)}
                   className="w-10 h-10 bg-white/5 border border-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 shrink-0 cursor-pointer"
                 >
                    <X size={18} />
                 </button>
              </div>

              {/* Content Section - Lists of Students to audit */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
                 {selectedActionInsight.students && selectedActionInsight.students.length > 0 ? (
                    <div className="space-y-4">
                       {selectedActionInsight.students.map((student: any) => {
                          // Find student unpaid months
                          const studentPayments = payments.filter(p => p.studentId === student.id);
                          const admissionM = student.admissionDate.slice(0, 7);
                          const monthsSinceAdm = getMonthsBetween(admissionM, getCurrentMonthStr());
                          const studentPaidMonths = studentPayments.map(p => p.month);
                          const studentUnpaidMonths = monthsSinceAdm.filter(m => !studentPaidMonths.includes(m));
                          
                          // Track user input for this child
                          const paymentInput = spotPayments[student.id] || {
                            amount: String(student.finalFee || student.monthlyFee || 1000),
                            method: 'Cash',
                            month: studentUnpaidMonths[0] || getCurrentMonthStr()
                          };

                          return (
                             <div key={student.id} className="bg-card text-card-foreground border border-border/50 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md hover:border-border transition-all space-y-4">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                   {/* Student Profile Info */}
                                   <div className="flex items-center gap-3">
                                      <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-sm italic border border-indigo-100 uppercase shrink-0">
                                         {student.name.slice(0, 2)}
                                      </div>
                                      <div className="min-w-0">
                                         <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="text-sm font-black text-foreground">{student.name}</h4>
                                            <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase">{student.batch}</span>
                                         </div>
                                         <p className="text-[10px] font-mono text-muted-foreground mt-0.5">ID: {student.id}</p>
                                      </div>
                                   </div>

                                   {/* Status Pills */}
                                   <div className="flex flex-wrap gap-2">
                                      {student.intelligence?.attRate !== undefined && (
                                         <span className={cn(
                                           "text-[9px] font-black uppercase px-2.5 py-1 rounded-xl border flex items-center gap-1",
                                           student.intelligence.attRate < 60 ? "bg-rose-50 text-rose-600 border-rose-100/50" :
                                           student.intelligence.attRate < 75 ? "bg-amber-50 text-amber-600 border-amber-100/50" :
                                           "bg-emerald-50 text-emerald-600 border-emerald-100/50"
                                         )}>
                                            Attendance: {student.intelligence.attRate.toFixed(0)}%
                                         </span>
                                      )}
                                      {student.intelligence?.isAbsentAlert && (
                                         <span className="text-[9px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100/50 px-2.5 py-1 rounded-xl animate-pulse">
                                            {language === 'en' ? 'Consecutive Absences' : 'টানা অনুপস্থিত'}
                                         </span>
                                      )}
                                      {student.dueAmount > 0 && (
                                         <span className="text-[9px] font-black uppercase bg-red-50 text-red-600 border border-red-100/30 px-2.5 py-1 rounded-xl">
                                            {language === 'en' ? 'Dues' : 'বকেয়া'}: ৳{student.dueAmount}
                                         </span>
                                      )}
                                   </div>
                                </div>

                                {/* Parent Contact Block */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-border/50/75 text-left">
                                   <div className="text-[11px] font-bold text-slate-600 space-y-0.5">
                                      <p><span className="text-muted-foreground">{language === 'en' ? "Father's Name" : "পিতার নাম"}:</span> {student.fatherName || 'N/A'}</p>
                                      <p><span className="text-muted-foreground">{language === 'en' ? "Mother's Name" : "মাতার নাম"}:</span> {student.motherName || 'N/A'}</p>
                                      <p className="font-mono text-muted bg-transparent"><span className="text-muted-foreground">{language === 'en' ? "Contacts / Guardians" : "মোবাইল নম্বর"}:</span> {student.guardianMobile || student.mobile || 'N/A'}</p>
                                   </div>
                                   
                                   {/* Quick Communication Actions */}
                                   <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
                                      {/* Primary Dial button */}
                                      <a 
                                        href={`tel:${student.mobile || student.guardianMobile}`}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all text-center"
                                        onClick={() => triggerToast(`Dialing primary contact: ${student.mobile || student.guardianMobile}...`)}
                                      >
                                         <Phone size={12} />
                                         {language === 'en' ? 'Call Father / Student' : 'শিক্ষার্থী/পিতা কে কল'}
                                      </a>
                                      
                                      {/* Secondary Dial button */}
                                      {student.guardianMobile && student.guardianMobile !== student.mobile && (
                                         <a 
                                           href={`tel:${student.guardianMobile}`}
                                           className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all text-center"
                                           onClick={() => triggerToast(`Dialing mother/guardian: ${student.guardianMobile}...`)}
                                         >
                                            <Phone size={12} />
                                            {language === 'en' ? 'Call Mother / Guardian' : 'অভিভাবক কে কল'}
                                         </a>
                                      )}

                                      {/* Direct WhatsApp link */}
                                      <a 
                                        href={`https://api.whatsapp.com/send?phone=${student.guardianMobile || student.mobile}&text=${encodeURIComponent(
                                          selectedActionInsight.actionType === 'fees-dues' 
                                            ? `সম্মানিত অভিভাবক, প্রজ্ঞা একাডেমী থেকে আপনার সন্তান ${student.name} এর বকেয়া ফি বাবদ ৳${student.dueAmount} পরিশোধ করার জন্য অনুরোধ করা হচ্ছে। অনুগ্রহ করে দ্রুত পরিশোধ করুন। ধন্যবাদ!` 
                                            : `সম্মানিত অভিভাবক, প্রজ্ঞা একাডেমী থেকে জানানো যাচ্ছে যে আপনার সন্তান ${student.name} ক্লাসে নিয়মিত উপস্থিত থাকছে না। নিয়মিত ক্লাসে পাঠানোর অনুরোধ রইলো। ধন্যবাদ!`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all text-center"
                                        onClick={() => triggerToast(`Opening WhatsApp template chat...`)}
                                      >
                                         <MessageCircle size={12} />
                                         WhatsApp
                                      </a>
                                   </div>
                                </div>

                                {/* Actions Desk (Logger Form and Spot Payment Form) */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-left">
                                   {/* Notes Logging Section */}
                                   <div className="space-y-2 border border-border/50 p-4 rounded-2xl">
                                      <div className="flex justify-between items-center bg-transparent mt-0">
                                         <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1 font-mono">
                                            <FileText size={11} /> {language === 'en' ? 'Audit Logs / Parent Response' : 'অভিভাবক যোগাযোগ লগ'}
                                         </label>
                                      </div>
                                      <div className="flex gap-2 bg-transparent mt-1">
                                         <input 
                                           value={actionNotes[student.id] || ''}
                                           onChange={e => setActionNotes({ ...actionNotes, [student.id]: e.target.value })}
                                           placeholder={language === 'en' ? 'e.g., Target called today, promised to clear dues or send student...' : 'যেমন: কল করা হয়েছে, আগামী সোমবারে পরিশোধ করবেন...'}
                                           className="flex-1 px-4 py-2 bg-muted/10 border border-border/50 rounded-xl text-xs font-semibold focus:bg-card text-card-foreground outline-none focus:ring-1 focus:ring-indigo-500 text-foreground"
                                           onKeyDown={e => {
                                             if (e.key === 'Enter' && actionNotes[student.id]) {
                                               const text = actionNotes[student.id];
                                               const dateStamp = new Date().toLocaleDateString(language, {month: 'short', day: 'numeric'});
                                               const updated = (student.notes ? student.notes + '\n' : '') + `[${dateStamp}]: ${text}`;
                                               updateStudent(student.id, { notes: updated });
                                               setActionNotes({ ...actionNotes, [student.id]: '' });
                                               triggerToast('Log registered successfully!');
                                             }
                                           }}
                                         />
                                         <button 
                                           onClick={() => {
                                              if (!actionNotes[student.id]) return;
                                              const text = actionNotes[student.id];
                                              const dateStamp = new Date().toLocaleDateString(language, {month: 'short', day: 'numeric'});
                                              const updated = (student.notes ? student.notes + '\n' : '') + `[${dateStamp}]: ${text}`;
                                              updateStudent(student.id, { notes: updated });
                                              setActionNotes({ ...actionNotes, [student.id]: '' });
                                              triggerToast('Log registered successfully!');
                                           }}
                                           className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl transition-all active:scale-95 flex items-center justify-center shadow-sm cursor-pointer"
                                         >
                                            <Save size={14} />
                                         </button>
                                      </div>
                                      {student.notes ? (
                                         <div className="text-[10px] bg-indigo-50/40 text-foreground p-3 rounded-xl border border-indigo-100/30 whitespace-pre-line max-h-24 overflow-y-auto mt-2">
                                            <span className="font-black uppercase tracking-wider text-[8px] text-indigo-600 font-mono">Communications History:</span>
                                            <p className="mt-1 leading-relaxed font-semibold">{student.notes}</p>
                                         </div>
                                      ) : (
                                         <p className="text-[10px] text-muted-foreground italic font-semibold mt-2">{language === 'en' ? 'No parent response logs registered yet for this student.' : 'কোনো পূর্ববর্তী কল বা যোগাযোগ ডেটা সংরক্ষিত নেই।'}</p>
                                      )}
                                   </div>

                                   {/* Spot Payment Module */}
                                   {student.dueAmount > 0 ? (
                                      <div className="space-y-2 border border-rose-100/50 p-4 rounded-2xl bg-rose-50/15">
                                         <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1 font-mono">
                                            <Wallet size={11} /> {language === 'en' ? 'Collect Fees (Spot Action)' : 'স্পট ফি সংগ্রহ সম্পন্ন করুন'}
                                         </label>
                                         <div className="grid grid-cols-2 gap-2 mt-1">
                                            <div>
                                               <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Month Owed</span>
                                               <select 
                                                 value={paymentInput.month}
                                                 onChange={e => setSpotPayments({
                                                   ...spotPayments,
                                                   [student.id]: { ...paymentInput, month: e.target.value }
                                                 })}
                                                 className="w-full px-3 py-1.5 border border-border/50 bg-card text-card-foreground rounded-xl text-xs font-bold text-foreground"
                                               >
                                                  {studentUnpaidMonths.map(m => (
                                                     <option key={m} value={m}>{m}</option>
                                                  ))}
                                                  {studentUnpaidMonths.length === 0 && (
                                                     <option value={getCurrentMonthStr()}>{getCurrentMonthStr()}</option>
                                                  )}
                                               </select>
                                            </div>
                                            <div>
                                               <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Collect Amount</span>
                                               <input 
                                                 type="number"
                                                 value={paymentInput.amount}
                                                 onChange={e => setSpotPayments({
                                                   ...spotPayments,
                                                   [student.id]: { ...paymentInput, amount: e.target.value }
                                                 })}
                                                 className="w-full px-3 py-1.5 border border-border/50 bg-card text-card-foreground rounded-xl text-xs font-bold text-foreground"
                                               />
                                            </div>
                                         </div>
                                         
                                         <div className="flex gap-2 items-end mt-2">
                                            <div className="flex-1">
                                               <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Method</span>
                                               <select 
                                                 value={paymentInput.method}
                                                 onChange={e => setSpotPayments({
                                                   ...spotPayments,
                                                   [student.id]: { ...paymentInput, method: e.target.value as any }
                                                 })}
                                                 className="w-full px-3 py-1.5 border border-border/50 bg-card text-card-foreground rounded-xl text-xs font-bold text-foreground"
                                               >
                                                  <option value="Cash">Cash</option>
                                                  <option value="bKash">bKash</option>
                                                  <option value="Nagad">Nagad</option>
                                                  <option value="Bank">Bank</option>
                                               </select>
                                            </div>
                                            <button 
                                              onClick={() => {
                                                 if (!paymentInput.amount || isNaN(Number(paymentInput.amount))) {
                                                   alert('Please write a valid payment amount');
                                                   return;
                                                 }
                                                 addPayment({
                                                   date: new Date().toISOString().slice(0, 10),
                                                   month: paymentInput.month,
                                                   studentId: student.id,
                                                   amount: Number(paymentInput.amount),
                                                   paymentMethod: paymentInput.method as any,
                                                   receivedBy: 'Admin (AI Decisions Hub)',
                                                   notes: 'Spot payment cleared via AI Decisions Dialog.'
                                                 });
                                                 triggerToast(`Received fee of ৳${paymentInput.amount} successfully for month ${paymentInput.month}!`);
                                              }}
                                              className="px-4 h-[34px] bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                                            >
                                               <Check size={11} /> {language === 'en' ? 'Collect Fee' : 'ফি গ্রহণ করুন'}
                                            </button>
                                         </div>
                                      </div>
                                   ) : (
                                      <div className="border border-border/50 p-4 rounded-2xl bg-emerald-50/10 flex flex-col justify-center items-center text-center mt-2">
                                         <CheckCircle2 size={24} className="text-emerald-500" />
                                         <p className="text-[10px] font-black text-muted uppercase mt-2">{language === 'en' ? 'Paid - No Outstanding Dues' : 'পরিশোধিত - কোনো বকেয়া নেই'}</p>
                                      </div>
                                   )}
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 ) : (
                    <div className="text-center py-12 space-y-3 bg-card text-card-foreground border border-border/50 rounded-3xl p-6">
                       <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
                       <p className="text-sm font-black text-foreground uppercase">{language === 'en' ? 'Excellent! All alerts resolved' : 'চমৎকার! সকল সমস্যা সমাধান করা হয়েছে'}</p>
                       <p className="text-xs font-semibold text-muted-foreground italic max-w-sm mx-auto">{language === 'en' ? 'All student alerts under this category have been successfully resolved.' : 'এই ক্যাটাগরির অন্তর্ভুক্ত সকল শিক্ষার্থীর উপস্থিতি বা বকেয়া রেকর্ড এখন স্থিতিশীল।'}</p>
                    </div>
                 )}
              </div>

              {/* Footer Actions */}
              <div className="bg-muted/10 px-6 py-4 flex justify-between items-center border-t border-border/50 shrink-0">
                 <span className="text-[9px] font-mono text-muted-foreground italic">Pragya AI Operational Decisions Desk</span>
                 <button 
                   onClick={() => setSelectedActionInsight(null)}
                   className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                 >
                    {language === 'en' ? 'Done / Back to Dashboard' : 'সম্পন্ন / ড্যাশবোর্ডে ফিরুন'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
    </div>
  );
}
