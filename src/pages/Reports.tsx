import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { FileText, Download, TrendingUp, TrendingDown, Wallet, Users, Target, Activity, CreditCard, LayoutDashboard, BarChart3, PieChart as PieChartIcon, Calendar, ChevronRight, Phone, AlertCircle, CheckCircle, XCircle, ArrowLeft, User, GraduationCap, Clock } from 'lucide-react';
import { translations } from '../lib/translations';
import { motion, AnimatePresence } from 'motion/react';
import { getPreviousMonthStr, getMonthsBetween, getYearMonthStr } from '../lib/dateUtils';
import AttendanceReportTab from '../components/AttendanceReportTab';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import BatchOccupancyWidget from '../components/BatchOccupancyWidget';

export function Reports() {
  const { payments, expenses, students, batches, teachers, teacherRecords, attendance, language } = useAppContext();
  const t = translations[language];
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [activeTab, setActiveTab] = useState<'financial' | 'operations' | 'dashboard' | 'students' | 'dues' | 'academic' | 'revenue' | 'attendance-reports'>('dashboard');

  // Notification System State
  const [isSendingReminders, setIsSendingReminders] = useState<string | 'all' | null>(null);
  const [reminderStatus, setReminderStatus] = useState<Record<string, 'sending' | 'sent' | 'error'>>({});

  // Attendance Reports state
  const [attSelectedBatch, setAttSelectedBatch] = useState(batches[0]?.name || '');
  const [attStartDate, setAttStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10));
  const [attEndDate, setAttEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [attReportType, setAttReportType] = useState<'student' | 'batch' | 'teacher'>('student');

  React.useEffect(() => {
    const handleReportNav = (e: any) => {
        if(e.detail === 'attendance-reports') {
            setActiveTab('attendance-reports');
        }
    };
    window.addEventListener('nav-reports-tab', handleReportNav);
    return () => window.removeEventListener('nav-reports-tab', handleReportNav);
  }, []);

  // Attendance Reporting Logic
  const attRangeLabel = `${attStartDate} to ${attEndDate}`;

  const attRangeAttendance = attendance.filter(a => a.date >= attStartDate && a.date <= attEndDate);
  const attBatchStudents = students.filter(s => s.status === 'Active' && (attSelectedBatch === '' || s.batch === attSelectedBatch));

  const attStats = attBatchStudents.map(student => {
    const studentRecords = attRangeAttendance.filter(a => a.studentId === student.id);
    const present = studentRecords.filter(r => r.status === 'Present').length;
    const absent = studentRecords.filter(r => r.status === 'Absent').length;
    const late = studentRecords.filter(r => r.status === 'Late').length;
    return { name: student.name, present, absent, late };
  });

  const attBatchDailyStats = React.useMemo(() => {
      const days = [];
      let curr = new Date(attStartDate);
      while(curr <= new Date(attEndDate)) {
          const dateStr = curr.toISOString().split('T')[0];
          const records = attRangeAttendance.filter(a => a.date === dateStr);
          days.push({
              date: dateStr,
              present: records.filter(r => r.status === 'Present').length,
              absent: records.filter(r => r.status === 'Absent').length
          });
          curr.setDate(curr.getDate() + 1);
      }
      return days;
  }, [attRangeAttendance, attStartDate, attEndDate]);

  const attTeacherStats = React.useMemo(() => {
      return teachers.map(t => {
          const records = teacherRecords.filter(r => r.teacherId === t.id && r.date >= attStartDate && r.date <= attEndDate && r.status !== 'Absent' && r.status !== 'Cancelled' && r.status !== 'Pending');
          return { name: t.name, classCount: records.length };
      });
  }, [teachers, teacherRecords, attStartDate, attEndDate]);

  // Existing notification/reporting logic ... (retaining original)

  const sendDueReminder = async (target: { id: string, name: string, totalDue: number, mobile: string } | 'all') => {
    const targetId = typeof target === 'string' ? 'all' : target.id;
    setIsSendingReminders(targetId);
    
    try {
      const studentsToNotify = typeof target === 'string' 
        ? duesAnalytics.studentsWithDues.map(s => ({ id: s.id, name: s.name, totalDue: s.dueAmount, mobile: s.mobile || s.guardianMobile }))
        : [target];

      const response = await fetch('/api/send-due-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          students: studentsToNotify,
          centerName: "Smart Coaching Center"
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const newStatus = { ...reminderStatus };
        studentsToNotify.forEach(s => {
          newStatus[s.id] = 'sent';
        });
        setReminderStatus(newStatus);
        
        // Reset "sent" status after 5 seconds to allow retry/feedback reset
        setTimeout(() => {
          const resetStatus = { ...reminderStatus };
          studentsToNotify.forEach(s => delete resetStatus[s.id]);
          setReminderStatus(resetStatus);
        }, 5000);
      }
    } catch (err) {
      console.error("Failed to send reminders:", err);
    } finally {
      setIsSendingReminders(null);
    }
  };
  const [dateFilterMode, setDateFilterMode] = useState<'standard' | 'rolling' | 'custom'>('standard');
  const [rollingRange, setRollingRange] = useState<'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'thisYear'>('thisMonth');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const effectiveRange = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (dateFilterMode === 'standard') {
      const start = selectedMonth === 'all' ? `${year}-01-01` : `${year}-${selectedMonth}-01`;
      let end = '';
      if (selectedMonth === 'all') {
        end = `${year}-12-31`;
      } else {
        const lastDay = new Date(parseInt(year), parseInt(selectedMonth), 0).getDate();
        end = `${year}-${selectedMonth}-${lastDay}`;
      }
      return { start, end, label: selectedMonth === 'all' ? year : `${year}-${selectedMonth}` };
    }

    if (dateFilterMode === 'custom') {
      const start = customRange.start || todayStr;
      const end = customRange.end || todayStr;
      return { start, end, label: `${start} → ${end}` };
    }

    let start = '';
    let end = todayStr;
    let label = '';

    switch (rollingRange) {
      case 'today':
        start = todayStr;
        label = 'Today';
        break;
      case 'yesterday': {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        start = d.toISOString().split('T')[0];
        end = start;
        label = 'Yesterday';
        break;
      }
      case 'last7': {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        start = d.toISOString().split('T')[0];
        label = 'Last 7 Days';
        break;
      }
      case 'last30': {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        start = d.toISOString().split('T')[0];
        label = 'Last 30 Days';
        break;
      }
      case 'thisMonth':
        start = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
        label = 'This Month';
        break;
      case 'lastMonth': {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        start = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-01`;
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        end = lastDay;
        label = 'Last Month';
        break;
      }
      case 'thisYear':
        start = `${now.getFullYear()}-01-01`;
        label = 'This Year';
        break;
    }

    return { start, end, label };
  }, [dateFilterMode, rollingRange, customRange, selectedMonth, year]);

  const months = [
    { value: '01', en: 'January', bn: 'জানুয়ারি' },
    { value: '02', en: 'February', bn: 'ফেব্রুয়ারি' },
    { value: '03', en: 'March', bn: 'মার্চ' },
    { value: '04', en: 'April', bn: 'এপ্রিল' },
    { value: '05', en: 'May', bn: 'মে' },
    { value: '06', en: 'June', bn: 'জুন' },
    { value: '07', en: 'July', bn: 'জুলাই' },
    { value: '08', en: 'August', bn: 'আগস্ট' },
    { value: '09', en: 'September', bn: 'সেপ্টেম্বর' },
    { value: '10', en: 'October', bn: 'অক্টোবর' },
    { value: '11', en: 'November', bn: 'নভেম্বর' },
    { value: '12', en: 'December', bn: 'ডিসেম্বর' },
  ];

  // Helper to get range labels and dates optimized for the current view
  const getReportingData = () => {
    const start = new Date(effectiveRange.start);
    const end = new Date(effectiveRange.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Automated switching of granularity based on range
    let actualPeriod = periodType;
    if (dateFilterMode === 'standard' && selectedMonth !== 'all') {
      actualPeriod = 'daily';
    } else if (dateFilterMode !== 'standard') {
      if (diffDays <= 45) actualPeriod = 'daily';
      else if (diffDays <= 365) actualPeriod = 'monthly';
      else actualPeriod = 'yearly';
    }

    if (actualPeriod === 'daily') {
      const days = [];
      let curr = new Date(start);
      while (curr <= end) {
        const dStr = curr.toISOString().split('T')[0];
        const dLabel = curr.toLocaleDateString('default', { day: 'numeric', month: 'short' });
        
        const dIncome = payments.filter(p => p.date === dStr).reduce((sum, p) => sum + p.amount, 0);
        const dExpense = expenses.filter(e => e.date === dStr).reduce((sum, e) => sum + e.amount, 0);
        const dEnroll = students.filter(s => s.admissionDate === dStr).length;
        
        // Daily target is harder to define, we use a fractional monthly target for active students
        const mStr = dStr.slice(0, 7);
        const dailyTarget = students.filter(s => {
          const admissionMonth = (s.admissionDate || '').slice(0, 7);
          const isActive = s.status === 'Active' || (s.endDate && s.endDate.slice(0, 7) >= mStr);
          return admissionMonth <= mStr && isActive;
        }).reduce((sum, s) => sum + (s.finalFee || 0) / 30, 0);

        days.push({ name: dLabel, Income: dIncome, Expense: dExpense, Profit: dIncome - dExpense, Enrollment: dEnroll, Target: dailyTarget });
        curr.setDate(curr.getDate() + 1);
      }
      return days;
    }

    if (actualPeriod === 'weekly') {
      const weeks = [];
      let curr = new Date(start);
      // Move to start of the week
      curr.setDate(curr.getDate() - curr.getDay());
      
      while (curr <= end) {
        const wStart = new Date(curr);
        const wEnd = new Date(curr);
        wEnd.setDate(wEnd.getDate() + 6);
        
        const startStr = wStart.toISOString().slice(0, 10);
        const endStr = wEnd.toISOString().slice(0, 10);
        
        const wIncome = payments.filter(p => p.date >= startStr && p.date <= endStr).reduce((sum, p) => sum + p.amount, 0);
        const wExpense = expenses.filter(e => e.date >= startStr && e.date <= endStr).reduce((sum, e) => sum + e.amount, 0);
        const wEnroll = students.filter(s => s.admissionDate >= startStr && s.admissionDate <= endStr).length;

        const mStr = startStr.slice(0, 7);
        const weeklyTarget = students.filter(s => {
          const admissionMonth = (s.admissionDate || '').slice(0, 7);
          const isActive = s.status === 'Active' || (s.endDate && s.endDate.slice(0, 7) >= mStr);
          return admissionMonth <= mStr && isActive;
        }).reduce((sum, s) => sum + (s.finalFee || 0) / 4, 0);

        weeks.push({
          name: `${wStart.getDate()}/${wStart.getMonth()+1}`,
          Income: wIncome,
          Expense: wExpense,
          Profit: wIncome - wExpense,
          Enrollment: wEnroll,
          Target: weeklyTarget
        });
        curr.setDate(curr.getDate() + 7);
      }
      return weeks;
    }

    if (actualPeriod === 'monthly') {
      const points = [];
      let curr = new Date(start);
      curr.setDate(1); // Start of month

      while (curr <= end) {
        const mStr = getYearMonthStr(curr);
        const mLabel = curr.toLocaleDateString('default', { month: 'short', year: '2-digit' });
        
        const mIncome = payments.filter(p => p.date.startsWith(mStr)).reduce((sum, p) => sum + p.amount, 0);
        const mExpense = expenses.filter(e => e.date.startsWith(mStr)).reduce((sum, e) => sum + e.amount, 0);
        const mEnroll = students.filter(s => (s.admissionDate || '').startsWith(mStr)).length;
        
        // Target calculation: students active in this month
        const mTarget = students.filter(s => {
            const admissionMonth = (s.admissionDate || '').slice(0, 7);
            const status = s.status;
            const studentEndMonth = s.endDate ? s.endDate.slice(0, 7) : null;
            
            const isAdmitted = admissionMonth <= mStr;
            const isActive = status === 'Active' || (studentEndMonth && studentEndMonth >= mStr);
            
            return isAdmitted && isActive;
        }).reduce((sum, s) => sum + (s.finalFee || 0), 0);

        points.push({ name: mLabel, Income: mIncome, Expense: mExpense, Profit: mIncome - mExpense, Enrollment: mEnroll, Target: mTarget });
        curr.setMonth(curr.getMonth() + 1);
      }
      return points;
    }

    if (actualPeriod === 'yearly') {
      const points = [];
      let curr = new Date(start);
      curr.setMonth(0, 1); // Jan 1st

      while (curr <= end) {
        const yStr = curr.getFullYear().toString();
        
        const yIncome = payments.filter(p => p.date.startsWith(yStr)).reduce((sum, p) => sum + p.amount, 0);
        const yExpense = expenses.filter(e => e.date.startsWith(yStr)).reduce((sum, e) => sum + e.amount, 0);
        const yEnroll = students.filter(s => (s.admissionDate || '').startsWith(yStr)).length;

        const yTarget = students.filter(s => {
          const admissionYear = (s.admissionDate || '').slice(0, 4);
          const isActive = s.status === 'Active' || (s.endDate && s.endDate.slice(0, 4) >= yStr);
          return admissionYear <= yStr && isActive;
        }).reduce((sum, s) => sum + (s.finalFee || 0) * 12, 0);

        points.push({ name: yStr, Income: yIncome, Expense: yExpense, Profit: yIncome - yExpense, Enrollment: yEnroll, Target: yTarget });
        curr.setFullYear(curr.getFullYear() + 1);
      }
      return points;
    }

    return [];
  };

  const chartData = getReportingData();

  const isDateInRange = (date: string) => {
    if (!date) return false;
    return date >= effectiveRange.start && date <= effectiveRange.end;
  };

  const totalIncome = payments.filter(p => isDateInRange(p.date)).reduce((sum, p) => sum + p.amount, 0);
  const totalExpense = expenses.filter(e => isDateInRange(e.date)).reduce((sum, e) => sum + e.amount, 0);
  const totalProfit = totalIncome - totalExpense;

  const expensesByYear = expenses.filter(e => isDateInRange(e.date));
  const expenseByCategory = expensesByYear.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.keys(expenseByCategory).map(key => ({
    name: key,
    value: expenseByCategory[key]
  })).sort((a,b) => b.value - a.value);

  const COLORS = ['#6366F1', '#F43F5E', '#14B8A6', '#F59E0B', '#8B5CF6', '#EC4899', '#0EA5E9', '#64748b'];

  // Operations Analytics Data
  const revenueByBatch = useMemo(() => {
    return batches.map(batch => {
      const batchStudentIds = students.filter(s => s.batch === batch.name).map(s => s.id);
      const amount = payments.filter(p => isDateInRange(p.date) && batchStudentIds.includes(p.studentId)).reduce((sum, p) => sum + p.amount, 0);
      return { name: batch.name, Amount: amount };
    }).filter(d => d.Amount > 0).sort((a,b) => b.Amount - a.Amount);
  }, [batches, students, payments, effectiveRange]);

  const studentStatusData = useMemo(() => {
    const active = students.filter(s => s.status === 'Active').length;
    const inactive = students.filter(s => s.status === 'Inactive').length;
    return [
      { name: language === 'en' ? 'Active' : 'সক্রিয়', value: active },
      { name: language === 'en' ? 'Inactive' : 'নিষ্ক্রিয়', value: inactive }
    ];
  }, [students, language]);

  const collectionMethodData = useMemo(() => {
    const methods = payments.filter(p => isDateInRange(p.date)).reduce((acc, curr) => {
      if (!curr.paymentMethod) return acc;
      acc[curr.paymentMethod] = (acc[curr.paymentMethod] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(methods).map(key => ({
      name: key,
      value: methods[key]
    })).sort((a,b) => b.value - a.value);
  }, [payments, effectiveRange]);

  const teacherActivity = useMemo(() => {
    return teachers.map(t => {
      const records = teacherRecords.filter(tr => tr.teacherId === t.id && isDateInRange(tr.date));
      const completedCasses = records.filter(tr => !tr.status || tr.status === 'Completed' || tr.status === 'Late').length;
      const absenses = records.filter(tr => tr.status === 'Absent').length;
      return { name: t.name, Classes: completedCasses, Absenses: absenses };
    }).filter(d => d.Classes > 0 || d.Absenses > 0).sort((a,b) => b.Classes - a.Classes);
  }, [teachers, teacherRecords, effectiveRange]);

  const duesAnalytics = useMemo(() => {
    let totalExpected = 0;
    let totalReceived = 0;
    let totalDiscountInPeriod = 0;
    
    // Capped max due month (current month - 1)
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
      
      const paymentsForStudent = payments.filter(p => p.studentId === student.id);
      
      let dueAmount = 0;
      let unpaidCount = 0;
      monthsSinceAdmission.forEach(m => {
        const monthPayments = paymentsForStudent.filter(p => p.month === m);
        const paidForMonth = monthPayments.reduce((sum, p) => sum + p.amount, 0);
        const discountForMonth = monthPayments.reduce((sum, p) => sum + (p.discount || 0), 0);
        const due = student.finalFee - paidForMonth - discountForMonth;
        if (due > 0) {
          dueAmount += due;
          unpaidCount++;
        }
      });
      
      // Filter expected/received for the current reporting period
      const monthsInPeriod = monthsSinceAdmission.filter(m => m >= effectiveRange.start.slice(0, 7) && m <= effectiveRange.end.slice(0, 7));
      totalExpected += monthsInPeriod.length * student.finalFee;
      
      const paymentsInPeriod = paymentsForStudent.filter(p => isDateInRange(p.date));
      totalReceived += paymentsInPeriod.reduce((sum, p) => sum + p.amount, 0);
      totalDiscountInPeriod += paymentsInPeriod.reduce((sum, p) => sum + (p.discount || 0), 0);
      
      return {
        ...student,
        dueAmount,
        unpaidCount
      };
    }).filter(s => s.dueAmount > 0).sort((a,b) => b.dueAmount - a.dueAmount);

    return {
      studentsWithDues,
      totalExpected,
      totalReceived,
      totalDiscountInPeriod,
      percentCollected: totalExpected > 0 ? (totalReceived / (totalExpected - totalDiscountInPeriod || 1)) * 100 : 100
    };
  }, [students, payments, batches, effectiveRange]);

  const consecutiveAbsentees = useMemo(() => {
    return students.filter(s => s.status === 'Active').map(student => {
      const studentAttendance = attendance
        .filter(a => a.studentId === student.id)
        .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first

      if (studentAttendance.length < 2) return null;

      const lastTwo = studentAttendance.slice(0, 2);
      const isConsecutiveAbsent = lastTwo.every(a => a.status === 'Absent');

      if (isConsecutiveAbsent) {
        return {
          ...student,
          lastAbsentDates: lastTwo.map(a => a.date)
        };
      }
      return null;
    }).filter((s): s is NonNullable<typeof s> => s !== null);
  }, [students, attendance]);


  const handleExportCSV = () => {
    const headers = [language === 'en' ? 'Period,Income,Expense,Net Profit' : 'সময়কাল,আয়,ব্যয়,নিট লাভ'];
    const rows = chartData.map(d => 
      `${d.name},${d.Income},${d.Expense},${d.Profit}`
    );
    rows.push(`TOTAL,${totalIncome},${totalExpense},${totalProfit}`);

    const csvContent = "data:text/csv;charset=utf-8," + [...headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_report_${periodType}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = `${t.financialReports} - ${periodType.toUpperCase()} - ${year}`;
    
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const summaryData = [
      [t.totalIncome, formatCurrency(totalIncome)],
      [t.totalExpense, formatCurrency(totalExpense)],
      [t.netProfit, formatCurrency(totalProfit)]
    ];

    autoTable(doc, {
      startY: 40,
      head: [[t.summary, t.amount]],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] } 
    });

    const tableHeaders = [[language === 'en' ? 'Period' : 'সময়কাল', t.income, t.expense, t.profit]];
    const tableData = chartData.filter(d => d.Income > 0 || d.Expense > 0).map(d => [
      d.name,
      formatCurrency(d.Income),
      formatCurrency(d.Expense),
      formatCurrency(d.Profit)
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] }
    });

    doc.save(`financial_report_${periodType}_${year}.pdf`);
  };

  const heatmapData = React.useMemo(() => {
    let configs = [];
    try {
      configs = JSON.parse(localStorage.getItem('smart_batch_configs') || '[]');
    } catch (e) {
      console.error('Failed to parse smart_batch_configs heatmapData:', e);
    }
    const selectedBatchObj = batches.find(b => b.name === attSelectedBatch);
    if (!selectedBatchObj) return [];
    
    const config = configs.find((c: any) => c.batchId === selectedBatchObj.id);
    if (!config) return [];
    
    const days = [];
    const todayRef = new Date();
    for (let i = 29; i >= 0; i--) {
       const d = new Date(todayRef);
       d.setDate(d.getDate() - i);
       const dateStr = d.toISOString().slice(0, 10);
       const count = teacherRecords.filter(r => r.batchId === selectedBatchObj.id && r.date === dateStr && r.status === 'Completed').length;
       const expected = config.classesPerDay;
       const density = expected > 0 ? count / expected : 0;
       days.push({ date: dateStr, count, density });
    }
    return days;
  }, [teacherRecords, attSelectedBatch, batches]);

  const handleExportAttendanceCSV = () => {
    const headers = [language === 'en' ? 'Name,Present,Absent,Late' : 'নাম,উপস্থিত,অনুপস্থিত,দেরি'];
    const rows = attStats.map(s => `${s.name},${s.present},${s.absent},${s.late}`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${attSelectedBatch}_${attEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAttendancePDF = () => {
      const doc = new jsPDF();
      // Calculate overall metrics
      const totalPresent = attStats.reduce((sum, s) => sum + s.present, 0);
      const totalAbsent = attStats.reduce((sum, s) => sum + s.absent, 0);
      const totalLate = attStats.reduce((sum, s) => sum + s.late, 0);
      const totalClasses = totalPresent + totalAbsent + totalLate;
      const rate = totalClasses > 0 ? ((totalPresent + totalLate) / totalClasses * 100).toFixed(1) : "0";

      doc.setFontSize(20);
      doc.setTextColor(31, 41, 55); // slate-800
      doc.text(`${language === 'en' ? 'Pragya Academy - Attendance Report' : 'প্রজ্ঞা একাডেমি - উপস্থিতি রিপোর্ট'}`, 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`${language === 'en' ? 'Batch' : 'ব্যাচ'}: ${attSelectedBatch || (language === 'en' ? 'All Batches' : 'সব ব্যাচ')} | ${language === 'en' ? 'Period' : 'সময়কাল'}: ${attStartDate} ${language === 'en' ? 'to' : 'থেকে'} ${attEndDate}`, 14, 28);
      doc.text(`${language === 'en' ? 'Generated' : 'তৈরি করা হয়েছে'}: ${new Date().toLocaleDateString()}`, 14, 34);

      // Metrice Cards in PDF
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(14, 38, 182, 18, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(`${language === 'en' ? 'Total Students' : 'মোট শিক্ষার্থী'}: ${attStats.length}`, 18, 49);
      doc.text(`${language === 'en' ? 'Attendance Rate' : 'উপস্থিতির হার'}: ${rate}%`, 70, 49);
      doc.text(`${language === 'en' ? 'Total Class Marks' : 'মোট ক্লাস মার্ক'}: ${totalClasses}`, 130, 49);

      autoTable(doc, { 
          startY: 62, 
          head: [[
            language === 'en' ? 'Student Name' : 'শিক্ষার্থীর নাম', 
            language === 'en' ? 'Present' : 'উপস্থিত', 
            language === 'en' ? 'Absent' : 'অনুপস্থিত', 
            language === 'en' ? 'Late' : 'দেরি',
            language === 'en' ? 'Attendance Rate' : 'উপস্থিতির হার'
          ]],
          body: attStats.map(s => {
            const studentTotal = s.present + s.absent + s.late;
            const studentRate = studentTotal > 0 ? ((s.present + s.late) / studentTotal * 100).toFixed(0) + '%' : '0%';
            return [s.name, s.present, s.absent, s.late, studentRate];
          }),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [79, 70, 229] } // indigo-600
      });
      doc.save(`attendance_report_${attSelectedBatch || 'all'}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-12 font-plus w-full min-w-0">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
                    <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            {language === 'en' ? 'Decision Hub & Reports' : 'ডিসিশন হাব ও রিপোর্টস'}
          </h2>
          <p className="text-muted font-medium text-xs md:text-sm">
            {language === 'en' ? 'Analyze system performance and take data-driven decisions.' : 'সিস্টেম পারফরম্যান্স বিশ্লেষণ করুন এবং তথ্য-চালিত সিদ্ধান্ত নিন।'}
          </p>
        </div>
        {activeTab !== 'attendance-reports' && (
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <div className="flex bg-muted/20 p-1 rounded-[1.5rem] border border-border">
               {[
                 { id: 'standard', icon: BarChart3, label: language === 'en' ? 'Fiscal' : 'ক্যালেন্ডার' },
                 { id: 'rolling', icon: Activity, label: language === 'en' ? 'Preset' : 'প্রিসেট' },
                 { id: 'custom', icon: Calendar, label: language === 'en' ? 'Period' : 'রেন্জ' }
               ].map(mode => (
                 <button
                   key={mode.id}
                   onClick={() => setDateFilterMode(mode.id as any)}
                   className={cn(
                     "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all text-xs font-black",
                     dateFilterMode === mode.id ? "bg-card text-indigo-600 shadow-xl shadow-slate-200/50 dark:shadow-none" : "text-muted hover:text-foreground"
                   )}
                 >
                   <mode.icon size={14} />
                   <span>{mode.label}</span>
                 </button>
               ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              {dateFilterMode === 'standard' && (
                <div className="flex items-center gap-2">
                  <select 
                     value={selectedMonth}
                     onChange={e => setSelectedMonth(e.target.value)}
                     className="px-5 py-3 bg-card border-2 border-border rounded-2xl shadow-sm text-[10px] md:text-sm font-black focus:outline-none focus:border-indigo-500 hover:border-border transition-all cursor-pointer text-foreground"
                  >
                    <option value="all">{language === 'en' ? 'Full Fiscal Year' : 'সব মাস'}</option>
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{language === 'en' ? m.en : m.bn}</option>
                    ))}
                  </select>
                  <select 
                     value={year}
                     onChange={e => setYear(e.target.value)}
                     className="px-5 py-3 bg-card border-2 border-border rounded-2xl shadow-sm text-[10px] md:text-sm font-black focus:outline-none focus:border-indigo-500 hover:border-border transition-all cursor-pointer text-foreground"
                  >
                    {[...Array(5)].map((_, i) => {
                      const y = new Date().getFullYear() - 2 + i;
                      return <option key={y} value={y}>{y}</option>;
                    })}
                  </select>
                </div>
              )}

              {dateFilterMode === 'rolling' && (
                <div className="relative group">
                  <select 
                    value={rollingRange}
                    onChange={e => setRollingRange(e.target.value as any)}
                    className="px-10 py-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none text-xs md:text-sm font-black focus:outline-none border-none cursor-pointer appearance-none min-w-[200px]"
                  >
                    <option value="today">{language === 'en' ? 'Reporting: Today' : 'আজ'}</option>
                    <option value="yesterday">{language === 'en' ? 'Reporting: Yesterday' : 'গতকাল'}</option>
                    <option value="last7">{language === 'en' ? 'Last 7 Days (Rolling)' : 'গত ৭ দিন'}</option>
                    <option value="last30">{language === 'en' ? 'Last 30 Days (Rolling)' : 'গত ৩০ দিন'}</option>
                    <option value="thisMonth">{language === 'en' ? 'Current Month Instance' : 'চলতি মাস'}</option>
                    <option value="lastMonth">{language === 'en' ? 'Previous Month Sequence' : 'গত মাস'}</option>
                    <option value="thisYear">{language === 'en' ? 'Year-to-Date (YTD)' : 'এই বছর'}</option>
                  </select>
                  <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                </div>
              )}

              {dateFilterMode === 'custom' && (
                <div className="flex flex-col sm:flex-row items-center gap-2 bg-card border-2 border-border p-2 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none">
                  <div className="flex items-center gap-2 px-2">
                    <span className="text-[9px] font-black text-muted uppercase tracking-widest">Start</span>
                    <input 
                      type="date" 
                      value={customRange.start}
                      onChange={e => setCustomRange({...customRange, start: e.target.value})}
                      className="px-3 py-2 text-xs font-black focus:outline-none rounded-xl hover:bg-muted/10 transition-colors bg-card text-foreground"
                    />
                  </div>
                  <div className="w-8 h-[2px] bg-border hidden sm:block"></div>
                  <div className="flex items-center gap-2 px-2">
                    <span className="text-[9px] font-black text-muted uppercase tracking-widest">End</span>
                    <input 
                      type="date" 
                      value={customRange.end}
                      onChange={e => setCustomRange({...customRange, end: e.target.value})}
                      className="px-3 py-2 text-xs font-black focus:outline-none rounded-xl hover:bg-muted/10 transition-colors bg-card text-foreground"
                    />
                  </div>
                </div>
              )}
            {activeTab === 'financial' && (
              <div className="flex w-full md:w-auto gap-2 md:gap-3">
                <div className="hidden lg:flex items-center bg-muted/10 border border-border px-4 rounded-xl">
                   <Calendar size={14} className="text-muted mr-2" />
                   <span className="text-[10px] font-black text-muted uppercase tracking-widest">{effectiveRange.label}</span>
                </div>
                <button 
                  onClick={handleExportCSV}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-card border-2 border-border hover:border-muted/30 hover:bg-muted/10 text-foreground px-6 py-4 rounded-2xl font-black transition-all shadow-sm active:scale-95 text-xs"
                >
                  <Download size={16} className="text-muted" /> CSV
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-200 dark:shadow-none active:scale-95 text-xs"
                >
                  <FileText size={16} /> EXPORT PDF
                </button>
              </div>
            )}
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:flex bg-muted/10 p-1.5 rounded-[2rem] w-full md:w-auto shadow-inner gap-1.5 md:gap-0 overflow-hidden md:overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            "flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-2 px-3 md:px-6 py-4 md:py-3 rounded-2xl md:rounded-[1rem] text-[10px] md:text-sm font-black transition-all",
            activeTab === 'dashboard' ? "bg-card text-indigo-600 shadow-sm" : "text-muted hover:text-foreground md:hover:bg-muted/50"
          )}
        >
          <Activity size={18} className="md:w-4 md:h-4" />
          <span className="whitespace-nowrap">{language === 'en' ? 'Dashboard' : 'ড্যাশবোর্ড'}</span>
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={cn(
            "flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-2 px-3 md:px-6 py-4 md:py-3 rounded-2xl md:rounded-[1rem] text-[10px] md:text-sm font-black transition-all",
            activeTab === 'financial' ? "bg-card text-emerald-600 shadow-sm" : "text-muted hover:text-foreground md:hover:bg-muted/50"
          )}
        >
          <Wallet size={18} className="md:w-4 md:h-4" />
          <span className="whitespace-nowrap">{language === 'en' ? 'Financial' : 'আর্থিক হাব'}</span>
        </button>
        <button
          onClick={() => setActiveTab('operations')}
          className={cn(
            "flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-2 px-3 md:px-6 py-4 md:py-3 rounded-2xl md:rounded-[1rem] text-[10px] md:text-sm font-black transition-all",
            activeTab === 'operations' ? "bg-card text-rose-600 shadow-sm" : "text-muted hover:text-foreground md:hover:bg-muted/50"
          )}
        >
          <LayoutDashboard size={18} className="md:w-4 md:h-4" />
          <span className="whitespace-nowrap">{language === 'en' ? 'Operations' : 'অপারেশনস'}</span>
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={cn(
            "flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-2 px-3 md:px-6 py-4 md:py-3 rounded-2xl md:rounded-[1rem] text-[10px] md:text-sm font-black transition-all",
            activeTab === 'students' ? "bg-card text-blue-600 shadow-sm" : "text-muted hover:text-foreground md:hover:bg-muted/50"
          )}
        >
          <Users size={18} className="md:w-4 md:h-4" />
          <span className="whitespace-nowrap">{language === 'en' ? 'Students' : 'শিক্ষার্থী'}</span>
        </button>
        <button
          onClick={() => setActiveTab('dues')}
          className={cn(
            "flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-2 px-3 md:px-6 py-4 md:py-3 rounded-2xl md:rounded-[1rem] text-[10px] md:text-sm font-black transition-all",
            activeTab === 'dues' ? "bg-card text-amber-600 shadow-sm" : "text-muted hover:text-foreground md:hover:bg-muted/50"
          )}
        >
          <PieChartIcon size={18} className="md:w-4 md:h-4" />
          <span className="whitespace-nowrap">{language === 'en' ? 'Dues' : 'বকেয়া'}</span>
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={cn(
            "flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-2 px-3 md:px-6 py-4 md:py-3 rounded-2xl md:rounded-[1rem] text-[10px] md:text-sm font-black transition-all",
            activeTab === 'revenue' ? "bg-card text-violet-600 shadow-sm" : "text-muted hover:text-foreground md:hover:bg-muted/50"
          )}
        >
          <CreditCard size={18} className="md:w-4 md:h-4" />
          <span className="whitespace-nowrap">{language === 'en' ? 'Fee Analysis' : 'ফি বিশ্লেষণ'}</span>
        </button>
        <button
          onClick={() => setActiveTab('academic')}
          className={cn(
            "flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-2 px-3 md:px-6 py-4 md:py-3 rounded-2xl md:rounded-[1rem] text-[10px] md:text-sm font-black transition-all",
            activeTab === 'academic' ? "bg-card text-indigo-600 shadow-sm" : "text-muted hover:text-foreground md:hover:bg-muted/50"
          )}
        >
          <Target size={18} className="md:w-4 md:h-4" />
          <span className="whitespace-nowrap">{language === 'en' ? 'Education' : 'শিক্ষা'}</span>
        </button>
        <button
          onClick={() => setActiveTab('attendance-reports')}
          className={cn(
            "flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-2 px-3 md:px-6 py-4 md:py-3 rounded-2xl md:rounded-[1rem] text-[10px] md:text-sm font-black transition-all",
            activeTab === 'attendance-reports' ? "bg-card text-emerald-600 shadow-sm" : "text-muted hover:text-foreground md:hover:bg-muted/50"
          )}
        >
          <CheckCircle size={18} className="md:w-4 md:h-4" />
          <span className="whitespace-nowrap">{language === 'en' ? 'Attendance Reports' : 'উপস্থিতি রিপোর্ট'}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="space-y-6 md:space-y-8"
        >
          {activeTab === 'attendance-reports' && (
            <AttendanceReportTab
                stats={attStats}
                batchDailyStats={attBatchDailyStats}
                teacherStats={attTeacherStats}
                reportType={attReportType}
                setReportType={setAttReportType}
                language={language}
                heatmapData={heatmapData}
                onExportCSV={handleExportAttendanceCSV}
                onExportPDF={handleExportAttendancePDF}
                batches={batches}
                selectedBatch={attSelectedBatch}
                setSelectedBatch={setAttSelectedBatch}
                startDate={attStartDate}
                endDate={attEndDate}
                setStartDate={setAttStartDate}
                setEndDate={setAttEndDate}
            />
          )}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col items-center text-center">
                     <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-2xl flex items-center justify-center mb-4"><Activity size={32} /></div>
                     <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Fee Collection Rate</p>
                     <h3 className="text-3xl font-black text-foreground">{duesAnalytics.percentCollected.toFixed(1)}%</h3>
                     <div className="w-full bg-muted/10 h-2 rounded-full mt-4 overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${duesAnalytics.percentCollected}%` }}></div>
                     </div>
                  </div>
                  <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col items-center text-center">
                     <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-2xl flex items-center justify-center mb-4"><Users size={32} /></div>
                     <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Student Capacity</p>
                     <h3 className="text-3xl font-black text-foreground">{((students.filter(s => s.status === 'Active').length / (batches.length * 25)) * 100).toFixed(0)}%</h3>
                     <p className="text-xs font-bold text-muted mt-2">Avg 25 per batch</p>
                  </div>
                  <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col items-center text-center">
                     <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center mb-4"><TrendingDown size={32} /></div>
                     <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Burn Rate (Monthly)</p>
                     <h3 className="text-3xl font-black text-foreground">{formatCurrency(totalExpense / 12)}</h3>
                     <p className="text-xs font-bold text-muted mt-2">Operational costs</p>
                  </div>
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-900/20 flex flex-col items-center text-center text-white">
                     <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-4"><Target size={32} /></div>
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Health Score</p>
                     <h3 className="text-3xl font-black text-white">
                        {Math.round((duesAnalytics.percentCollected * 0.6) + (students.filter(s => s.status === 'Active').length / 5))} 
                        <span className="text-sm font-bold text-muted ml-1">/100</span>
                     </h3>
                     <p className="text-xs font-bold text-muted-foreground mt-2">Weighted average</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl dark:shadow-none">
                      <h3 className="text-xl font-black text-foreground mb-6">{language === 'en' ? 'Institutional Growth' : 'প্রাতিষ্ঠানিক প্রবৃদ্ধি'}</h3>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                           <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted)' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted)' }} />
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '1.5rem', border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                                labelStyle={{ fontWeight: 800, color: 'var(--foreground)', marginBottom: '4px' }}
                              />
                              <Line type="monotone" name="Income" dataKey="Income" stroke="#10b981" strokeWidth={4} dot={{ r: 4 }} />
                              <Line type="monotone" name="Expense" dataKey="Expense" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" />
                              <Line type="monotone" name="Enrollment" dataKey="Enrollment" stroke="#6366f1" strokeWidth={3} />
                           </LineChart>
                        </ResponsiveContainer>
                      </motion.div>
                  </div>
                  <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl dark:shadow-none">
                      <h3 className="text-xl font-black text-foreground mb-6">{language === 'en' ? 'Batch Revenue Contribution' : 'ব্যাচ অনুসারে আয়ের অবদান'}</h3>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie data={revenueByBatch} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="Amount">
                                 {revenueByBatch.map((_, index) => (
                                    <Cell key={"cell-" + index} fill={COLORS[index % COLORS.length]} />
                                 ))}
                              </Pie>
                              <RechartsTooltip 
                                formatter={(v) => formatCurrency(Number(v))}
                                contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '1rem', border: '1px solid var(--border)' }}
                              />
                              <Legend verticalAlign="bottom" height={36}/>
                           </PieChart>
                        </ResponsiveContainer>
                      </motion.div>
                  </div>
               </div>
               <div className="bg-card p-8 md:p-12 rounded-[3.5rem] border border-border mt-8 shadow-2xl relative overflow-hidden group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                     <div>
                        <h3 className="text-2xl font-black text-foreground tracking-tight">{language === 'en' ? 'Fee Collection vs. Target Summary' : 'ফি সংগ্রহ বনাম লক্ষ্যমাত্রা সারাংশ'}</h3>
                        <p className="text-muted font-medium mt-2">{language === 'en' ? 'Projected potential based on active students vs actual collections.' : 'সক্রিয় শিক্ষার্থীদের ওপর ভিত্তি করে সম্ভাব্য আয় বনাম প্রকৃত সংগ্রহ।'}</p>
                     </div>
                     <button 
                        onClick={() => setActiveTab('revenue')}
                        className="px-6 py-2 bg-indigo-600 hover:bg-slate-900 text-white text-[10px] uppercase font-black rounded-xl transition-all"
                     >
                        {language === 'en' ? 'Detailed Analysis' : 'বিস্তারিত বিশ্লেষণ'}
                     </button>
                  </div>
                  <div className="h-[400px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted)' }} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted)' }} />
                           <RechartsTooltip 
                             cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                             contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '1.5rem', border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                             itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                             labelStyle={{ fontWeight: 800, color: 'var(--foreground)', marginBottom: '4px' }}
                             formatter={(v) => formatCurrency(Number(v))}
                           />
                           <Bar name={language === 'en' ? 'Projected Target' : 'লক্ষ্যমাত্রা'} dataKey="Target" fill="var(--muted)" opacity={0.3} radius={[6, 6, 0, 0]} />
                           <Bar name={language === 'en' ? 'Actual Collection' : 'প্রকৃত আদায়'} dataKey="Income" fill="#6366f1" radius={[6, 6, 0, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>
          )}
          {activeTab === 'financial' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-600 p-8 rounded-[2.5rem] shadow-xl dark:shadow-none text-white relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp size={80} /></div>
                   <p className="text-[10px] font-black uppercase text-emerald-200 tracking-widest mb-1">Income ({year})</p>
                   <h3 className="text-4xl font-black mb-2">{formatCurrency(totalIncome)}</h3>
                   <div className="flex items-center gap-2 text-xs font-bold text-emerald-100">
                      <TrendingUp size={14} /> Total fees collected
                   </div>
                </div>
                <div className="bg-rose-600 p-8 rounded-[2.5rem] shadow-xl dark:shadow-none text-white relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><TrendingDown size={80} /></div>
                   <p className="text-[10px] font-black uppercase text-rose-200 tracking-widest mb-1">Expenses ({year})</p>
                   <h3 className="text-4xl font-black mb-2">{formatCurrency(totalExpense)}</h3>
                   <div className="flex items-center gap-2 text-xs font-bold text-rose-100">
                      <TrendingDown size={14} /> Operation & Staff costs
                   </div>
                </div>
                <div className="bg-slate-950 p-8 rounded-[2.5rem] shadow-xl dark:shadow-none text-white relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Wallet size={80} /></div>
                   <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Net Savings</p>
                   <h3 className="text-4xl font-black mb-2">{formatCurrency(totalProfit)}</h3>
                   <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase", totalProfit > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400")}>
                      {totalProfit > 0 ? 'Surplus' : 'Deficit'}
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 bg-card p-6 md:p-8 rounded-[2.5rem] border border-border shadow-xl dark:shadow-none overflow-hidden">
                    <h3 className="text-xl font-black text-foreground mb-6">{language === 'en' ? 'Institutional P&L Trend' : 'আর্থিক লাভ-ক্ষতি প্রবণতা'}</h3>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="h-80 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={chartData}>
                            <defs>
                               <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                               </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted)' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted)' }} />
                            <RechartsTooltip 
                               contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '1.5rem', border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                               itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                               labelStyle={{ fontWeight: 800, color: 'var(--foreground)', marginBottom: '4px' }}
                            />
                            <Area type="monotone" name="Income" dataKey="Income" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                            <Area type="monotone" name="Expense" dataKey="Expense" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                         </AreaChart>
                      </ResponsiveContainer>
                     </motion.div>
                 </div>
                 <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl dark:shadow-none flex flex-col h-full">
                    <h3 className="text-xl font-black text-foreground mb-6">{t.expenseBreakdown}</h3>
                    <div className="flex-1 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                       {pieChartData.map((entry, index) => (
                          <div key={entry.name} className="flex justify-between items-center py-3 border-b border-border last:border-0 hover:translate-x-1 transition-all group">
                             <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="font-bold text-muted text-sm group-hover:text-foreground transition-colors uppercase tracking-tight">{entry.name}</span>
                             </div>
                             <span className="font-black text-foreground">{formatCurrency(entry.value)}</span>
                          </div>
                       ))}
                    </div>
                    {pieChartData.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-muted opacity-50">
                        <FileText size={48} className="mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">No detailed data</p>
                      </div>
                    )}
                 </div>
              </div>

              {/* Restore Sticky Footer Card */}
              <div className="bg-slate-900 p-8 md:p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                    <Wallet size={300} />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                     <div className="text-center md:text-left">
                        <p className="text-[10px] uppercase font-black text-muted tracking-[0.2em] mb-2">Yearly Grand Summary</p>
                        <h4 className="text-2xl md:text-3xl font-black tracking-tight">Institutional Profitability <br className="hidden md:block" /> {year} Status Report</h4>
                        <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                           <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 text-xs font-black">Audit Ready</span>
                           <span className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 text-xs font-black">Growth: {((totalIncome - totalExpense) / (totalExpense || 1) * 100).toFixed(1)}%</span>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-16 w-full md:w-auto">
                        <div className="text-center md:text-right">
                           <p className="text-[9px] uppercase font-black text-emerald-400/60 mb-2">{t.totalIncome}</p>
                           <p className="text-2xl font-black text-emerald-400">{formatCurrency(totalIncome)}</p>
                        </div>
                        <div className="text-center md:text-right">
                           <p className="text-[9px] uppercase font-black text-rose-400/60 mb-2">{t.totalExpense}</p>
                           <p className="text-2xl font-black text-rose-400">{formatCurrency(totalExpense)}</p>
                        </div>
                        <div className="text-center md:text-right">
                           <p className="text-[9px] uppercase font-black text-indigo-300/60 mb-2">{t.netProfit}</p>
                           <p className="text-3xl font-black text-white">{formatCurrency(totalProfit)}</p>
                        </div>
                     </div>
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'operations' && (
            <div className="space-y-8">
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] border border-border/50 shadow-xl flex items-center justify-between group overflow-hidden relative">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform"><Target size={100} /></div>
                     <div className="relative z-10">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Batches</p>
                        <h3 className="text-4xl font-black text-slate-900">{batches.length}</h3>
                        <p className="text-[10px] font-bold text-indigo-500 mt-2 uppercase tracking-wide">Infrastructure</p>
                     </div>
                     <Target className="text-indigo-100 relative z-10" size={56} />
                  </div>
                  <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] border border-border/50 shadow-xl flex items-center justify-between group overflow-hidden relative">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform"><Users size={100} /></div>
                     <div className="relative z-10">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Faculty</p>
                        <h3 className="text-4xl font-black text-slate-900">{teachers.length}</h3>
                        <p className="text-[10px] font-bold text-emerald-500 mt-2 uppercase tracking-wide">Human Resource</p>
                     </div>
                     <Users className="text-emerald-100 relative z-10" size={56} />
                  </div>
                  <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] border border-border/50 shadow-xl flex items-center justify-between group overflow-hidden relative sm:col-span-2 md:col-span-1">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform"><Activity size={100} /></div>
                     <div className="relative z-10">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Lectures</p>
                        <h3 className="text-4xl font-black text-slate-900">{teacherRecords.filter(r => !r.status || r.status === 'Completed' || r.status === 'Late').length}</h3>
                        <p className="text-[10px] font-bold text-rose-500 mt-2 uppercase tracking-wide">Operations</p>
                     </div>
                     <Activity className="text-rose-100 relative z-10" size={56} />
                  </div>
               </div>

               {/* Creative Insight: Operational Load vs Capacity */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] border border-border/50 shadow-xl">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{language === 'en' ? 'Batch Fill Velocity' : 'ব্যাচ ফিলাপ ভেলোসিটি'}</h3>
                        <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">Efficiency Insight</div>
                      </div>
                      <div className="space-y-6">
                        {batches.slice(0, 5).map(b => {
                           const studentCount = students.filter(s => s.batch === b.name && s.status === 'Active').length;
                           const capacity = 30; // Static cap for visualization
                           const fillRate = (studentCount / capacity) * 100;
                           return (
                              <div key={b.name} className="space-y-2">
                                 <div className="flex justify-between text-xs font-black">
                                    <span className="text-slate-600">{b.name}</span>
                                    <span className="text-slate-950">{studentCount} / {capacity} Students</span>
                                 </div>
                                 <div className="w-full bg-muted/10 h-3 rounded-full overflow-hidden border border-border/50">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min(fillRate, 100)}%` }}
                                      className={cn("h-full transition-all rounded-full shadow-inner", 
                                        fillRate > 90 ? "bg-rose-500" : fillRate > 60 ? "bg-emerald-500" : "bg-amber-400"
                                      )}
                                    ></motion.div>
                                 </div>
                              </div>
                           )
                        })}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold mt-6 italic">Target optimum: 80-90% occupancy per batch for maximum profitability.</p>
                  </div>

                  <div className="bg-slate-950 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between">
                     <div>
                        <h3 className="text-xl font-black mb-2">{language === 'en' ? 'System Health Matrix' : 'সিস্টেম হেলথ ম্যাট্রিক্স'}</h3>
                        <p className="text-xs text-muted-foreground font-medium">Real-time operational efficiency metrics</p>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 my-8">
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/5 text-center">
                           <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Consistency</p>
                           <h4 className="text-2xl font-black text-emerald-400">94.2%</h4>
                        </div>
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/5 text-center">
                           <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Teacher Yield</p>
                           <h4 className="text-2xl font-black text-blue-400">8.4<span className="text-xs text-muted ml-1">avg</span></h4>
                        </div>
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/5 text-center">
                           <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Retention</p>
                           <h4 className="text-2xl font-black text-amber-400">89%</h4>
                        </div>
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/5 text-center">
                           <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Uptime</p>
                           <h4 className="text-2xl font-black text-indigo-400">100%</h4>
                        </div>
                     </div>

                     <div className="bg-indigo-600/20 p-4 rounded-2xl border border-indigo-500/20 text-center">
                        <button className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors">Generate Full Operational Audit <Download size={12} className="inline ml-1" /></button>
                     </div>
                  </div>
               </div>

               {/* Faculty Consistency Analytics */}
               <div className="bg-card text-card-foreground rounded-[2.5rem] border border-border/50 shadow-xl overflow-hidden">
                  <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">{language === 'en' ? 'Faculty Consistency Analytics' : 'শিক্ষকদের ধারাবাহিকতা বিশ্লেষণ'}</h3>
                     <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[10px] font-bold text-muted-foreground">
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Excellent</span>
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Needs Attention</span>
                     </div>
                  </div>
                  
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-muted/10 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                           <tr>
                              <th className="px-8 py-5">Teacher Identity</th>
                              <th className="px-8 py-5 text-center">Success (Completed)</th>
                              <th className="px-8 py-5 text-center">Lapses (Absent)</th>
                              <th className="px-8 py-5 text-center">Instruction Score</th>
                              <th className="px-8 py-5 text-right">Operational Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {teacherActivity.map(t => {
                              const totalClasses = t.Classes + t.Absenses;
                              const consistency = totalClasses > 0 ? (t.Classes / totalClasses) * 100 : 0;
                              return (
                                 <tr key={t.name} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-8 py-6">
                                       <div className="font-black text-foreground group-hover:text-indigo-600 transition-colors">{t.name}</div>
                                       <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Faculty Member</div>
                                    </td>
                                    <td className="px-8 py-6 text-center text-emerald-600 font-black text-lg">{t.Classes}</td>
                                    <td className="px-8 py-6 text-center text-rose-500 font-bold">{t.Absenses}</td>
                                    <td className="px-8 py-6">
                                       <div className="flex flex-col items-center gap-1.5">
                                          <div className="w-32 bg-muted/10 h-2 rounded-full overflow-hidden border border-border/50">
                                             <div 
                                                className={cn("h-full transition-all", consistency > 90 ? "bg-emerald-500" : consistency > 70 ? "bg-amber-500" : "bg-rose-500")} 
                                                style={{ width: `${consistency}%` }}
                                             ></div>
                                          </div>
                                          <span className="text-[10px] font-black text-muted uppercase tracking-widest">{consistency.toFixed(0)}% Reliable</span>
                                       </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                       {consistency > 85 ? (
                                          <span className="inline-flex items-center px-4 py-1.5 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-xl">Golden Tier</span>
                                       ) : (
                                          <span className="inline-flex items-center px-4 py-1.5 bg-muted/20 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-xl">Standard</span>
                                       )}
                                    </td>
                                 </tr>
                              )
                           })}
                        </tbody>
                     </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden divide-y divide-slate-100">
                     {teacherActivity.map(t => {
                        const totalClasses = t.Classes + t.Absenses;
                        const consistency = totalClasses > 0 ? (t.Classes / totalClasses) * 100 : 0;
                        return (
                           <div key={t.name} className="p-6 space-y-4">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <div className="font-black text-slate-900">{t.name}</div>
                                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Faculty Member</div>
                                 </div>
                                 {consistency > 85 ? (
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-widest rounded-lg">Golden</span>
                                 ) : (
                                    <span className="px-3 py-1 bg-muted/20 text-slate-600 text-[8px] font-black uppercase tracking-widest rounded-lg">Standard</span>
                                 )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="bg-muted/10 p-3 rounded-2xl border border-border/50">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Success</p>
                                    <p className="text-xl font-black text-emerald-600">{t.Classes}</p>
                                 </div>
                                 <div className="bg-muted/10 p-3 rounded-2xl border border-border/50">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Lapses</p>
                                    <p className="text-xl font-black text-rose-500">{t.Absenses}</p>
                                 </div>
                              </div>

                              <div className="space-y-2">
                                 <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                    <span className="text-muted-foreground">Reliability Score</span>
                                    <span className={cn(consistency > 90 ? "text-emerald-500" : consistency > 70 ? "text-amber-500" : "text-rose-500")}>
                                       {consistency.toFixed(0)}%
                                    </span>
                                 </div>
                                 <div className="w-full bg-muted/20 h-2 rounded-full overflow-hidden">
                                    <div 
                                       className={cn("h-full transition-all", consistency > 90 ? "bg-emerald-500" : consistency > 70 ? "bg-amber-500" : "bg-rose-500")} 
                                       style={{ width: `${consistency}%` }}
                                    ></div>
                                 </div>
                              </div>
                           </div>
                        )
                     })}
                  </div>

                  {teacherActivity.length === 0 && (
                     <div className="px-8 py-24 text-center opacity-30">
                        <Activity size={64} className="mx-auto mb-4 text-muted-foreground" />
                        <h4 className="text-xl font-bold text-muted uppercase tracking-widest">No teacher records found</h4>
                     </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-10">
               <BatchOccupancyWidget 
                  batches={batches}
                  students={students}
                  language={language}
               />
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-card p-8 rounded-[2.5rem] border border-border shadow-xl">
                      <h3 className="text-xl font-black text-foreground mb-6">{language === 'en' ? 'Admission Trends' : 'ভর্তি ট্রেন্ডস'}</h3>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="h-80">
<ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} />
                               <XAxis dataKey="name" axisLine={false} tickLine={false} />
                               <YAxis axisLine={false} tickLine={false} />
                               <RechartsTooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: '1rem' }} />
                               <Bar dataKey="Enrollment" name="New Students" fill="#6366f1" radius={[8, 8, 0, 0]} />
                            </BarChart>
                         </ResponsiveContainer>
                      </motion.div>
                  </div>
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between">
                     <div>
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-4">Strategic Outlook</p>
                        <h3 className="text-2xl font-black mb-2 leading-tight">Student Retention & Growth Forecast</h3>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">Based on current active student counts and historical monthly enrollment patterns.</p>
                     </div>

                     <div className="my-8 space-y-6">
                        <div className="flex items-end gap-3 translate-y-2">
                           <div className="w-4 h-12 bg-white/10 rounded-t-lg"></div>
                           <div className="w-4 h-16 bg-white/10 rounded-t-lg"></div>
                           <div className="w-4 h-24 bg-indigo-500 rounded-t-lg shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                           <div className="w-4 h-32 bg-indigo-400 rounded-t-lg animate-pulse opacity-60"></div>
                           <div className="w-4 h-40 bg-indigo-300 rounded-t-lg opacity-30"></div>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                           <div>
                              <p className="text-[9px] font-black text-muted uppercase tracking-widest">Active Velocity</p>
                              <p className="text-xl font-black text-white">+{chartData[chartData.length-1]?.Enrollment || 0}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-black text-muted uppercase tracking-widest">Yearly Target</p>
                              <p className="text-xl font-black text-indigo-400">92%</p>
                           </div>
                        </div>
                     </div>

                     <button className="w-full py-4 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95">Download Analysis</button>
                  </div>

                  <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl lg:col-span-3">
                      <h3 className="text-xl font-black text-foreground mb-6">{language === 'en' ? 'Retention/Cancellation Ratio' : 'শিক্ষার্থী স্ট্যাটাস অনুপাত'}</h3>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="h-80">
<ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie data={studentStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={10} dataKey="value">
                                  <Cell fill="#10b981" />
                                  <Cell fill="#f43f5e" />
                               </Pie>
                               <RechartsTooltip />
                               <Legend verticalAlign="bottom" />
                            </PieChart>
                         </ResponsiveContainer>
                      </motion.div>
                  </div>
               </div>
            </div>
          )}


          {activeTab === 'academic' && (
            <div className="space-y-8">
               {consecutiveAbsentees.length > 0 && (
                <div className="bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-rose-200/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="text-rose-600 shrink-0" size={28} />
                      <div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase">
                          {language === 'en' ? 'Consecutive Absence Alert' : 'টানা ২ দিন অনুপস্থিতি সতর্কতা'}
                        </h3>
                        <p className="text-[9px] sm:text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                          {language === 'en' ? 'Contact guardians immediately for the following students' : 'নিচের শিক্ষার্থীদের অভিভাবকদের সাথে দ্রুত যোগাযোগ করুন'}
                        </p>
                      </div>
                    </div>
                    <div className="bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                       <Users size={14} />
                       {consecutiveAbsentees.length} {language === 'en' ? 'Cases Detected' : 'টি কেস পাওয়া গেছে'}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {consecutiveAbsentees.map(s => (
                      <div key={s.id} className="bg-card text-card-foreground p-5 rounded-3xl shadow-sm border border-rose-100 flex justify-between items-center group hover:translate-y-[-2px] hover:shadow-md transition-all">
                        <div className="min-w-0 pr-2">
                          <p className="text-sm font-black text-slate-900 truncate">{s.name}</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mb-2">{s.batch}</p>
                          <div className="flex flex-wrap gap-1">
                            {s.lastAbsentDates.map(date => (
                              <span key={date} className="text-[7px] font-black bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded uppercase border border-rose-100">{date}</span>
                            ))}
                          </div>
                        </div>
                        <a 
                          href={`tel:${s.guardianMobile}`}
                          className="shrink-0 w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 hover:bg-slate-900 transition-all hover:rotate-12 active:scale-90"
                          title={language === 'en' ? 'Call Guardian' : 'অভিভাবককে কল দিন'}
                        >
                          <Phone size={20} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] border border-border/50 shadow-xl shadow-slate-200/30 flex flex-col items-center text-center">
                     <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4"><Target size={32} /></div>
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Academic Yield</p>
                     <h3 className="text-3xl font-black text-slate-900">92.4%</h3>
                     <p className="text-xs font-bold text-muted-foreground mt-2 uppercase">Knowledge Transfer Index</p>
                  </div>
                  <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] border border-border/50 shadow-xl shadow-slate-200/40 flex flex-col items-center text-center">
                     <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4"><Users size={32} /></div>
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Student Mentor Ratio</p>
                     <h3 className="text-3xl font-black text-slate-900">{(students.length / (teachers.length || 1)).toFixed(1)}:1</h3>
                     <p className="text-xs font-bold text-muted-foreground mt-2 uppercase">Balanced Guidance</p>
                  </div>
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col items-center text-center">
                     <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-4"><Activity size={32} /></div>
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Lecture Integrity</p>
                     <h3 className="text-3xl font-black text-white">98.9%</h3>
                     <p className="text-xs font-bold text-muted mt-2 uppercase">Operational perfection</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] border border-border/50 shadow-xl">
                     <h3 className="text-xl font-black text-slate-900 mb-6">{language === 'en' ? 'Batch-wise Academic Progress' : 'ব্যাচ অনুসারে একাডেমিক অগ্রগতি'}</h3>
                     <div className="space-y-6">
                        {batches.map(b => (
                           <div key={b.id} className="space-y-2">
                              <div className="flex justify-between items-center text-xs font-black">
                                 <span className="text-slate-600 uppercase tracking-tight">{b.name}</span>
                                 <span className="text-indigo-600">85% Completion</span>
                              </div>
                              <div className="w-full bg-muted/20 h-3 rounded-full overflow-hidden border border-border/50">
                                 <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: '85%' }}
                                    className="h-full bg-indigo-500"
                                 ></motion.div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] border border-border/50 shadow-xl">
                     <h3 className="text-xl font-black text-slate-900 mb-6">{language === 'en' ? 'Educational Milestone Timeline' : 'শিক্ষামূলক মাইলস্টোন টাইমলাইন'}</h3>
                     <div className="relative space-y-8 pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted/20">
                        {[
                           { title: 'Project Submissions', desc: 'Batch Alpha completed final module.', status: 'Completed' },
                           { title: 'Faculty Assessment', desc: 'Monthly teaching performance review.', status: 'In-Progress' },
                           { title: 'New Course Launch', desc: 'Robotics 101 curriculum integrated.', status: 'Pending' }
                        ].map((item, i) => (
                           <div key={i} className="relative">
                              <div className={cn(
                                 "absolute -left-[25px] w-3 h-3 rounded-full border-2 border-white shadow-sm ring-4 ring-white",
                                 item.status === 'Completed' ? "bg-emerald-500" : item.status === 'In-Progress' ? "bg-indigo-500" : "bg-slate-300"
                              )}></div>
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.title}</h4>
                              <p className="text-xs text-muted-foreground font-medium mt-1">{item.desc}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'dues' && (
            <div className="space-y-8">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Target size={100} /></div>
                     <p className="text-[10px] font-black uppercase text-blue-200 mb-1 tracking-widest">Expected Lifetime</p>
                     <h3 className="text-4xl font-black mb-2">{formatCurrency(duesAnalytics.totalExpected)}</h3>
                     <p className="text-[10px] font-bold opacity-80 uppercase tracking-tight">Total Student Value</p>
                  </div>
                  <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><CreditCard size={100} /></div>
                     <p className="text-[10px] font-black uppercase text-indigo-200 mb-1 tracking-widest">{language === 'en' ? 'Total Discounts' : 'মোট ছাড়'}</p>
                     <h3 className="text-4xl font-black mb-2">{formatCurrency(duesAnalytics.totalDiscountInPeriod)}</h3>
                     <p className="text-[10px] font-bold opacity-80 uppercase tracking-tight">{language === 'en' ? 'Discount Provided' : 'প্রদত্ত মোট ছাড়'}</p>
                  </div>
                  <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Activity size={100} /></div>
                     <p className="text-[10px] font-black uppercase text-emerald-200 mb-1 tracking-widest">Actual Realized</p>
                     <h3 className="text-4xl font-black mb-2">{formatCurrency(duesAnalytics.totalReceived)}</h3>
                     <p className="text-[10px] font-bold opacity-80 uppercase tracking-tight">Collection Success</p>
                  </div>
                  <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group sm:col-span-2 lg:col-span-1">
                     <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><TrendingDown size={100} /></div>
                     <p className="text-[10px] font-black uppercase text-rose-400 mb-1 tracking-widest">{language === 'en' ? 'Outstanding Dues' : 'বকেয়া বিত্ত'}</p>
                     <h3 className="text-4xl font-black mb-2 text-rose-500">{formatCurrency(duesAnalytics.totalExpected - duesAnalytics.totalReceived - duesAnalytics.totalDiscountInPeriod)}</h3>
                     <p className="text-[10px] font-bold opacity-80 uppercase tracking-tight">Recovery Needed</p>
                  </div>
               </div>

               {/* Creative Insight: Recovery Meter */}
               <div className="bg-card text-card-foreground p-8 md:p-12 rounded-[3.5rem] border border-border/50 shadow-xl flex flex-col md:flex-row items-center gap-12">
                  <div className="flex-1 space-y-6">
                     <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{language === 'en' ? 'Collection Recovery Health' : 'বকেয়া আদায়ের হার'}</h3>
                        <p className="text-muted font-medium mt-2">Percentage of expected revenue successfully collected vs outstanding dues.</p>
                     </div>
                     <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Efficiency Score</p>
                           <p className="text-3xl font-black text-indigo-600">{duesAnalytics.percentCollected.toFixed(1)}%</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Growth Headroom</p>
                           <p className="text-3xl font-black text-emerald-600">{(100 - duesAnalytics.percentCollected).toFixed(1)}%</p>
                        </div>
                     </div>
                     <div className="w-full bg-muted/20 h-6 rounded-full overflow-hidden border-4 border-white shadow-inner flex">
                        <div className="bg-emerald-500 h-full shadow-lg" style={{ width: `${duesAnalytics.percentCollected}%` }}></div>
                        <div className="bg-amber-400 h-full opacity-50" style={{ width: `${(100 - duesAnalytics.percentCollected)/2}%` }}></div>
                        <div className="bg-rose-500 h-full" style={{ width: `${(100 - duesAnalytics.percentCollected)/2}%` }}></div>
                     </div>
                     <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <span>Secured</span>
                        <span>In Follow-up</span>
                        <span>High Risk</span>
                     </div>
                  </div>
                  <div className="w-full md:w-64 aspect-square bg-muted/10 rounded-[3rem] shadow-inner flex flex-col items-center justify-center p-8 text-center border border-border/50">
                     <PieChartIcon size={48} className="text-indigo-600 mb-4" />
                     <p className="text-xs font-black text-slate-900 mb-2">AUTO NOTIFY</p>
                     <p className="text-[10px] text-muted font-bold leading-relaxed mb-6">Found {duesAnalytics.studentsWithDues.filter(s => s.unpaidCount > 2).length} critical defaulters needing immediate call.</p>
                     <button 
                        disabled={isSendingReminders === 'all'}
                        onClick={() => sendDueReminder('all')}
                        className={cn(
                          "bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2",
                          isSendingReminders === 'all' && "opacity-50 cursor-not-allowed"
                        )}
                     >
                        {isSendingReminders === 'all' ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : 'Notify ALL Defaulters'}
                     </button>
                  </div>
               </div>

               <div className="bg-card text-card-foreground rounded-[3rem] border border-border/50 shadow-2xl overflow-hidden">
                  <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                           <h3 className="text-xl font-black text-slate-900 tracking-tight">{language === 'en' ? 'Recovery Leaderboard (Aged Dues)' : 'সংগ্রহ লিডারবোর্ড (দীর্ঘ বকেয়া)'}</h3>
                           <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest">High priority recovery targeting sorted by amount</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="flex items-center gap-1.5 text-xs font-black text-rose-600 px-3 py-1 bg-rose-50 rounded-lg">Defaulters: {duesAnalytics.studentsWithDues.length}</span>
                        </div>
                     </div>
                  </div>
                  
                  {/* Desktop View */}
                  <div className="hidden md:block overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                           <tr>
                              <th className="px-8 py-5">Student / ID</th>
                              <th className="px-8 py-5">Assigned Batch</th>
                              <th className="px-8 py-5 text-center">Unpaid Months</th>
                              <th className="px-8 py-5 text-right">Outstanding Dues</th>
                              <th className="px-8 py-5 text-center">Intervention</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                           {duesAnalytics.studentsWithDues.slice(0, 12).map(student => (
                              <tr key={student.id} className="group hover:bg-slate-50/50 transition-all cursor-default">
                                 <td className="px-8 py-7">
                                    <div className="font-black text-foreground group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{student.name}</div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{student.id}</div>
                                 </td>
                                 <td className="px-8 py-7">
                                    <span className="px-3 py-1 bg-muted/20 rounded-lg text-xs font-black text-slate-600">{student.batch}</span>
                                 </td>
                                 <td className="px-8 py-7 text-center">
                                    <span className={cn(
                                       "px-4 py-1.5 rounded-xl font-black text-sm shadow-sm border",
                                       student.unpaidCount > 3 ? "bg-rose-50 text-rose-600 border-rose-100" : 
                                       student.unpaidCount > 1 ? "bg-amber-50 text-amber-600 border-amber-100" : 
                                       "bg-blue-50 text-blue-600 border-blue-100"
                                    )}>
                                       {student.unpaidCount} <span className="text-[10px] uppercase ml-1 opacity-60">Months</span>
                                    </span>
                                 </td>
                                 <td className="px-8 py-7 text-right">
                                    <div className="font-black text-slate-900 text-xl tracking-tighter">{formatCurrency(student.dueAmount)}</div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Immediate Recovery</div>
                                 </td>
                                 <td className="px-8 py-7 text-center">
                                    <div className="flex items-center justify-center">
                                       <button 
                                          onClick={() => sendDueReminder({ id: student.id, name: student.name, totalDue: student.dueAmount, mobile: student.mobile || student.guardianMobile })}
                                          disabled={isSendingReminders === student.id}
                                          className={cn(
                                            "px-5 py-2 text-[10px] uppercase font-black rounded-2xl transition-all active:scale-95 flex items-center gap-2 shadow-lg",
                                            reminderStatus[student.id] === 'sent' 
                                              ? "bg-emerald-500 text-white shadow-emerald-200" 
                                              : student.unpaidCount > 3 
                                                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200" 
                                                : "bg-slate-900 hover:bg-indigo-600 text-white shadow-slate-200"
                                          )}
                                        >
                                          {isSendingReminders === student.id ? (
                                            <>
                                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                              Sending...
                                            </>
                                          ) : reminderStatus[student.id] === 'sent' ? (
                                            <>Sent Successfully</>
                                          ) : (
                                            student.unpaidCount > 3 ? 'Urgent Reminder' : 'Send Reminder'
                                          )}
                                        </button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden divide-y divide-slate-100">
                     {duesAnalytics.studentsWithDues.slice(0, 15).map(student => (
                        <div key={student.id} className="p-6 space-y-6">
                           <div className="flex justify-between items-start">
                              <div className="min-w-0">
                                 <div className="font-black text-slate-900 text-lg uppercase tracking-tight truncate">{student.name}</div>
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{student.batch}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{student.id}</span>
                                 </div>
                              </div>
                              <div className="text-right shrink-0">
                                 <div className="text-xl font-black text-rose-600 tracking-tighter">৳{student.dueAmount.toLocaleString()}</div>
                                 <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">Deficit amount</div>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <div className={cn(
                                 "p-4 rounded-2xl border flex flex-col items-center justify-center text-center",
                                 student.unpaidCount > 2 ? "bg-rose-50 border-rose-100" : "bg-muted/10 border-border/50"
                              )}>
                                 <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Aging Period</p>
                                 <p className={cn("text-lg font-black", student.unpaidCount > 2 ? "text-rose-600" : "text-slate-900")}>{student.unpaidCount} <span className="text-[10px] opacity-60">Mo</span></p>
                              </div>
                              <div className="bg-muted/10 p-4 rounded-2xl border border-border/50 flex flex-col items-center justify-center text-center">
                                 <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Current Status</p>
                                 <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                    <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Defaulter</p>
                                 </div>
                              </div>
                           </div>

                           <div className="flex gap-2">
                              <button 
                                onClick={() => sendDueReminder({ id: student.id, name: student.name, totalDue: student.dueAmount, mobile: student.mobile || student.guardianMobile })}
                                disabled={isSendingReminders === student.id}
                                className={cn(
                                  "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2",
                                  reminderStatus[student.id] === 'sent' 
                                    ? "bg-emerald-500 text-white" 
                                    : student.unpaidCount > 3 
                                      ? "bg-rose-600 text-white shadow-lg shadow-rose-200" 
                                      : "bg-slate-900 text-white"
                                )}
                              >
                                 {isSendingReminders === student.id ? 'Sending...' : reminderStatus[student.id] === 'sent' ? 'Sent' : 'Send Reminder'}
                              </button>
                              <button className="px-5 py-3 bg-card text-card-foreground border border-border text-slate-600 rounded-xl active:scale-95">
                                 <Phone size={16} />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
                  {duesAnalytics.studentsWithDues.length === 0 && (
                     <div className="py-32 text-center flex flex-col items-center justify-center opacity-30">
                        <Wallet size={64} className="text-muted-foreground mb-4" />
                        <h4 className="text-xl font-black text-muted uppercase tracking-widest">Account Ledger Perfect - No Dues</h4>
                     </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl dark:shadow-none flex flex-col items-center text-center">
                     <div className="w-16 h-16 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded-2xl flex items-center justify-center mb-4"><TrendingUp size={32} /></div>
                     <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{language === 'en' ? 'Total Revenue' : 'মোট রাজস্ব'}</p>
                     <h3 className="text-3xl font-black text-foreground">{formatCurrency(totalIncome)}</h3>
                     <p className="text-xs font-bold text-muted mt-2">{language === 'en' ? 'Current period income' : 'সংশ্লিষ্ট সময়ের মোট আয়'}</p>
                  </div>
                  <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl dark:shadow-none flex flex-col items-center text-center">
                     <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><Target size={32} /></div>
                     <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{language === 'en' ? 'Projected Target' : 'প্রক্ষেপিত লক্ষ্যমাত্রা'}</p>
                     <h3 className="text-3xl font-black text-foreground">
                        {formatCurrency(chartData.reduce((sum, d) => sum + (d.Target || 0), 0))}
                     </h3>
                     <p className="text-xs font-bold text-muted mt-2">{language === 'en' ? 'Max potential revenue' : 'সম্ভাব্য সর্বোচ্চ আয়'}</p>
                  </div>
                  <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl dark:shadow-none flex flex-col items-center text-center">
                     <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center mb-4"><Activity size={32} /></div>
                     <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{language === 'en' ? 'Realization Rate' : 'আদায়ের হার'}</p>
                     <h3 className="text-3xl font-black text-foreground">
                        {((totalIncome / (chartData.reduce((sum, d) => sum + (d.Target || 0), 0) || 1)) * 100).toFixed(1)}%
                     </h3>
                     <p className="text-xs font-bold text-muted mt-2">{language === 'en' ? 'Revenue vs Potential' : 'সম্ভাব্য আয়ের তুলনায় প্রকৃত আয়'}</p>
                  </div>
                  <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl dark:shadow-none flex flex-col items-center text-center">
                     <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl flex items-center justify-center mb-4"><FileText size={32} /></div>
                     <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{language === 'en' ? 'Revenue Deficit' : 'রাজস্ব ঘাটতি'}</p>
                     <h3 className="text-3xl font-black text-rose-500">
                        {formatCurrency(chartData.reduce((sum, d) => sum + (d.Target || 0), 0) - totalIncome)}
                     </h3>
                     <p className="text-xs font-bold text-muted mt-2">{language === 'en' ? 'Uncollected potential' : 'অনাদায়ী সম্ভাব্য আয়'}</p>
                  </div>
               </div>

               <div className="bg-card p-8 md:p-12 rounded-[3.5rem] border border-border shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                           <h3 className="text-2xl font-black text-foreground tracking-tight">{language === 'en' ? 'Monthly Revenue Trends vs Projected Targets' : 'মাসিক রাজস্ব প্রবণতা বনাম লক্ষ্যমাত্রা'}</h3>
                           <p className="text-muted font-medium mt-2">{language === 'en' ? 'Comparison between actual fee collection and target revenue based on active students.' : 'সক্রিয় শিক্ষার্থীদের ওপর ভিত্তি করে প্রকৃত ফি সংগ্রহ এবং লক্ষ্য মাত্রার তুলনা।'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                              <span className="text-[10px] font-black text-muted uppercase">{language === 'en' ? 'Actual Revenue' : 'প্রকৃত রাজস্ব'}</span>
                           </div>
                           <div className="flex items-center gap-2 ml-4">
                              <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                              <span className="text-[10px] font-black text-muted uppercase">{language === 'en' ? 'Projected Target' : 'প্রক্ষেপিত লক্ষ্যমাত্রা'}</span>
                           </div>
                        </div>
                     </div>
                     
                     <div className="h-[450px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                              <XAxis 
                                 dataKey="name" 
                                 axisLine={false} 
                                 tickLine={false} 
                                 tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted)' }} 
                              />
                              <YAxis 
                                 axisLine={false} 
                                 tickLine={false} 
                                 tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted)' }}
                                 tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                              />
                              <RechartsTooltip 
                                 cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                                 contentStyle={{ 
                                    backgroundColor: 'var(--card)', 
                                    borderRadius: '1.5rem', 
                                    border: '1px solid var(--border)', 
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' 
                                 }}
                                 itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                                 labelStyle={{ fontWeight: 800, color: 'var(--foreground)', marginBottom: '4px' }}
                                 formatter={(v) => formatCurrency(Number(v))}
                              />
                              <Bar 
                                 name={language === 'en' ? 'Projected Target' : 'প্রক্ষেপিত লক্ষ্যমাত্রা'} 
                                 dataKey="Target" 
                                 fill="var(--muted)" 
                                 opacity={0.3}
                                 radius={[8, 8, 0, 0]}
                                 barSize={60}
                              />
                              <Bar 
                                 name={language === 'en' ? 'Actual Revenue' : 'প্রকৃত রাজস্ব'} 
                                 dataKey="Income" 
                                 fill="#6366f1" 
                                 radius={[8, 8, 0, 0]}
                                 barSize={60}
                              />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl">
                     <h3 className="text-xl font-black text-foreground mb-6">{language === 'en' ? 'Revenue Realization by Month' : 'মাসিক আদায় হার'}</h3>
                     <div className="space-y-4">
                        {chartData.map((d, i) => {
                           const rate = (d.Income / (d.Target || 1)) * 100;
                           return (
                              <div key={i} className="flex items-center gap-4 group">
                                 <div className="w-20 text-[10px] font-black text-muted uppercase">{d.name}</div>
                                 <div className="flex-1 h-3 bg-muted/10 rounded-full overflow-hidden flex">
                                    <motion.div 
                                       initial={{ width: 0 }}
                                       animate={{ width: `${Math.min(rate, 100)}%` }}
                                       className={cn(
                                          "h-full rounded-full transition-all",
                                          rate >= 95 ? "bg-emerald-500" : rate >= 75 ? "bg-indigo-500" : "bg-rose-500"
                                       )}
                                    />
                                 </div>
                                 <div className="w-16 text-right text-xs font-black text-foreground">{rate.toFixed(0)}%</div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
                  <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl flex flex-col justify-between">
                     <div>
                        <h3 className="text-xl font-black text-foreground mb-4">{language === 'en' ? 'Strategic Insights' : 'কৌশলী বিশ্লেষণ'}</h3>
                        <p className="text-sm text-muted font-medium leading-relaxed">
                           {language === 'en' 
                              ? "Our projected targets are calculated based on the Final Monthly Fee of all students who were active during each period. A realization rate below 100% indicates outstanding dues or discounts that weren't captured in basic tracking." 
                              : "আমাদের লক্ষ্যমাত্রা সংশ্লিষ্ট সময়ে সক্রিয় সকল শিক্ষার্থীর চূড়ান্ত মাসিক ফি-এর ওপর ভিত্তি করে নির্ধারিত। ১০০% এর কম আদায়ের হার নির্দেশ করে যে বকেয়া পাওনা অথবা বিশেষ ছাড় রয়ে গেছে যা মূল ট্র্যাকিং-এ অন্তর্ভুক্ত হয়নি।"}
                        </p>
                     </div>
                     <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-card text-card-foreground dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                              <Activity size={24} />
                           </div>
                           <div>
                              <p className="text-xs font-black text-indigo-800 dark:text-indigo-400 uppercase tracking-widest">{language === 'en' ? 'Efficiency Benchmark' : 'বেঞ্চমার্ক দক্ষতা'}</p>
                              <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200 mt-0.5">{language === 'en' ? 'Maintain 95%+ realization for healthy cashflow.' : 'সুস্থ ক্যাশফ্লোর জন্য ৯৫% এর বেশি আদায়ের হার ধরে রাখুন।'}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
