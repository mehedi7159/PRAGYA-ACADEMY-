import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../store/AppContext';
import { Payment, Student, DiscountType } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Receipt, 
  Search, 
  Printer, 
  Trash2, 
  History, 
  User, 
  Calendar, 
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Wallet,
  Smartphone,
  Building2,
  Banknote,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { translations } from '../lib/translations';
import { getCurrentMonthStr, getPreviousMonthStr, getMonthsBetween } from '../lib/dateUtils';
import PaymentQRCodeCard from '../components/PaymentQRCodeCard';

export function FeeCollection() {
  const { students, payments, addPayment, deletePayment, batches, language } = useAppContext();
  const t = translations[language];
  
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [discount, setDiscount] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('Manual');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [month, setMonth] = useState(getCurrentMonthStr()); // YYYY-MM
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Bank'>('Cash');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [printReceipt, setPrintReceipt] = useState<Payment | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);
  
  // Auto-save logic
  const isInitialMount = useRef(true);
  const DRAFT_KEY = 'PRAGYA_FEE_COLLECTION_DRAFT';

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.selectedStudentId) setSelectedStudentId(draft.selectedStudentId);
        if (draft.amount) setAmount(draft.amount);
        if (draft.discount) setDiscount(draft.discount);
        if (draft.discountType) setDiscountType(draft.discountType);
        if (draft.includeInactive !== undefined) setIncludeInactive(draft.includeInactive);
        if (draft.month) setMonth(draft.month);
        if (draft.paymentDate) setPaymentDate(draft.paymentDate);
        if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
        if (draft.notes) setNotes(draft.notes);
      } catch (e) {
        console.error('Failed to load fee collection draft', e);
      }
    }
    isInitialMount.current = false;
  }, []);

  useEffect(() => {
    if (isInitialMount.current) return;
    
    const draft = {
      selectedStudentId,
      amount,
      discount,
      discountType,
      includeInactive,
      month,
      paymentDate,
      paymentMethod,
      notes
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [selectedStudentId, amount, discount, discountType, includeInactive, month, paymentDate, paymentMethod, notes]);

  // Calculate student outstanding due helper
  function getStudentTotalDue(student: Student | undefined) {
    if (!student) return 0;
    
    // Capped max due month (current month - 1)
    const maxDueMonthStr = getPreviousMonthStr();

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
    if (batchObj && (batchObj.status === 'Inactive' || batchObj.status === 'Archive')) {
      const batchEnd = batchObj.endDate || batchObj.startDate || student.admissionDate;
      const batchInactiveMonth = batchEnd.slice(0, 7);
      if (batchInactiveMonth < endMonthStr) {
        endMonthStr = batchInactiveMonth;
      }
    }

    const monthsSinceAdmission = getMonthsBetween(admissionMonth, endMonthStr);
    
    const paymentsForStudent = payments.filter(p => p.studentId === student.id);
    
    let dueAmount = 0;
    monthsSinceAdmission.forEach(m => {
      const monthPayments = paymentsForStudent.filter(p => p.month === m);
      const paidForMonth = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const discountForMonth = monthPayments.reduce((sum, p) => sum + (p.discount || 0), 0);
      const due = student.finalFee - paidForMonth - discountForMonth;
      if (due > 0) {
        dueAmount += due;
      }
    });

    return dueAmount;
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Filter students for the dropdown/search
  const selectableStudents = students.filter(s => {
    if (s.status === 'Active') return true;
    if (includeInactive) return true;
    // Include inactive students if they have outstanding dues
    return getStudentTotalDue(s) > 0;
  });

  const filteredStudents = searchQuery 
    ? selectableStudents.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.mobile.includes(searchQuery)
      )
    : selectableStudents;

  const sortedPayments = [...payments].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.id.localeCompare(a.id);
  });

  const lastSelectedStudentId = useRef(selectedStudentId);

  // Pre-fill amount based on student's finalFee when student is selected
  useEffect(() => {
    // Only pre-fill if it's a REAL change of student (not restoring from draft on mount)
    if (selectedStudentId !== lastSelectedStudentId.current) {
      if (selectedStudent) {
        setAmount(selectedStudent.finalFee.toString());
        setDiscount('');
      } else {
        setAmount('');
        setDiscount('');
      }
      lastSelectedStudentId.current = selectedStudentId;
    }
  }, [selectedStudentId]);

  const studentPayments = payments.filter(p => p.studentId === selectedStudentId);
  const lastPayment = studentPayments.length > 0 
    ? studentPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedStudentId) newErrors.studentId = language === 'en' ? 'Please select a student' : 'অনুগ্রহ করে একজন শিক্ষার্থী নির্বাচন করুন';
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = language === 'en' ? 'Amount must be greater than 0' : 'টাকার পরিমাণ ০ এর বেশি হতে হবে';
    if (!month) newErrors.month = language === 'en' ? 'Please select a month' : 'অনুগ্রহ করে একটি মাস নির্বাচন করুন';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!selectedStudent || !amount) return;

    try {
      const newPayment = addPayment({
        date: paymentDate,
        month,
        studentId: selectedStudent.id,
        amount: parseFloat(amount),
        fullFee: selectedStudent.finalFee,
        discount: parseFloat(discount) || 0,
        discountType: discount ? discountType : undefined,
        due: selectedStudent.finalFee - parseFloat(amount) - (parseFloat(discount) || 0),
        paymentMethod,
        receivedBy: 'Admin',
        notes
      });

      // Show receipt modal automatically
      setPrintReceipt(newPayment);

      // Reset form but keep same student for potential multiple payments
      setAmount('');
      setDiscount('');
      setDiscountType('Manual');
      setNotes('');
      localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      alert("Error saving payment. Please check your connection.");
    }
  };

  const handlePrintReceipt = (payment: Payment) => {
    setPrintReceipt(payment);
  };

  const methods = [
    { id: 'Cash', label: language === 'en' ? 'Cash' : 'নগদ', icon: Banknote, color: 'emerald' },
    { id: 'bKash', label: 'bKash', icon: Smartphone, color: 'pink' },
    { id: 'Nagad', label: 'Nagad', icon: Wallet, color: 'orange' },
    { id: 'Bank', label: language === 'en' ? 'Bank' : 'ব্যাংক', icon: Building2, color: 'blue' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4 md:px-0">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{t.feeCollection}</h2>
          <p className="text-muted font-medium text-sm md:text-base">{t.recordPaymentsDescription}</p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs md:text-sm text-muted bg-card px-4 py-2 rounded-full border border-border shadow-sm self-start">
          <Calendar size={16} />
          {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Main Collection Panel */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-border relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-16 -mt-16 opacity-50" />
            
            <h3 className="text-xl font-black text-foreground mb-6 flex items-center relative gap-2">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl md:rounded-2xl shrink-0">
                <Receipt size={22} className="md:w-6 md:h-6" />
              </div>
              {t.newPayment}
            </h3>
            
            <form onSubmit={handleCollect} className="space-y-6 relative">
              {/* Student Selection */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] md:text-xs font-black text-muted uppercase tracking-[0.2em]">{t.selectStudent}</label>
                  <label className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={includeInactive} 
                      onChange={e => setIncludeInactive(e.target.checked)} 
                      className="rounded border-border text-indigo-600 focus:ring-indigo-500 h-3 w-3 cursor-pointer"
                    />
                    {language === 'en' ? 'Include Inactive' : 'নিষ্ক্রিয় শিক্ষার্থী'}
                  </label>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                    <Search size={18} />
                  </div>
                  <select 
                    required 
                    value={selectedStudentId} 
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                      if (errors.studentId) setErrors(prev => ({ ...prev, studentId: '' }));
                    }}
                    className={cn(
                      "w-full pl-12 pr-10 py-4 md:py-5 border-2 rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 bg-muted/5 text-foreground font-bold transition-all appearance-none text-sm md:text-base",
                      errors.studentId ? "border-rose-500 bg-rose-50/50 dark:bg-rose-900/20" : "border-border focus:border-indigo-500 focus:bg-card"
                    )}
                  >
                    <option value="">{t.chooseStudent}</option>
                    {selectableStudents.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.id}) {s.status === 'Inactive' ? `[${language === 'en' ? 'Inactive' : 'নিষ্ক্রিয়'}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.studentId && <p className="text-rose-600 text-[10px] font-black uppercase tracking-tight flex items-center gap-1 mt-1 font-plus"><AlertCircle size={12}/> {errors.studentId}</p>}
              </div>

              {/* Date, Month, and Amount Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-muted uppercase tracking-[0.2em] px-1">{t.date}</label>
                  <input 
                    required 
                    type="date" 
                    value={paymentDate} 
                    onChange={e => setPaymentDate(e.target.value)} 
                    className="w-full px-5 py-4 md:py-5 border-2 border-border focus:border-indigo-500 focus:bg-card rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 bg-muted/5 text-foreground font-black transition-all text-sm md:text-base cursor-pointer appearance-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-muted uppercase tracking-[0.2em] px-1">{t.feeMonth}</label>
                  <input 
                    required 
                    type="month" 
                    value={month} 
                    onChange={e => {
                      setMonth(e.target.value);
                      if (errors.month) setErrors(prev => ({ ...prev, month: '' }));
                    }} 
                    className={cn(
                      "w-full px-5 py-4 md:py-5 border-2 rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 bg-muted/5 text-foreground font-black transition-all text-sm md:text-base",
                      errors.month ? "border-rose-500 bg-rose-50/50 dark:bg-rose-900/20" : "border-border focus:border-indigo-500 focus:bg-card"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-muted uppercase tracking-[0.2em] px-1">{t.amount}</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted font-black font-mono">৳</div>
                    <input 
                      required 
                      type="number" 
                      value={amount} 
                      onChange={e => {
                        setAmount(e.target.value);
                        if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
                      }} 
                      placeholder="0" 
                      className={cn(
                        "w-full pl-10 pr-5 py-4 md:py-5 border-2 rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 bg-muted/5 text-foreground font-black text-xl md:text-2xl transition-all",
                        errors.amount ? "border-rose-500 bg-rose-50/50 dark:bg-rose-900/20" : "border-border focus:border-indigo-500 focus:bg-card"
                      )}
                    />
                  </div>
                  {errors.amount && <p className="text-rose-600 text-[10px] font-black uppercase tracking-tight flex items-center gap-1 mt-1 font-plus"><AlertCircle size={12}/> {errors.amount}</p>}
                </div>
              </div>

              {/* Extra Discount Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-muted uppercase tracking-[0.2em] px-1">
                    {language === 'en' ? 'Extra Discount' : 'অতিরিক্ত ছাড়'}
                  </label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted font-mono">৳</div>
                    <input 
                      type="number" 
                      value={discount} 
                      onChange={e => setDiscount(e.target.value)} 
                      placeholder="0" 
                      className="w-full pl-10 pr-5 py-4 border-2 border-border hover:border-indigo-200 focus:border-indigo-500 bg-muted/5 focus:bg-card rounded-xl focus:outline-none transition-all text-sm font-bold text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-muted uppercase tracking-[0.2em] px-1">
                    {language === 'en' ? 'Discount Type' : 'ছাড়ের ধরণ'}
                  </label>
                  <select 
                    value={discountType} 
                    onChange={e => setDiscountType(e.target.value as DiscountType)} 
                    disabled={!discount}
                    className="w-full px-5 py-4 border-2 border-border focus:border-indigo-500 bg-muted/5 focus:bg-card rounded-xl focus:outline-none transition-all text-sm font-bold text-foreground disabled:opacity-50 cursor-pointer"
                  >
                    <option value="Manual">{language === 'en' ? 'Manual' : 'ম্যানুয়াল'}</option>
                    <option value="Partial Attendance">{language === 'en' ? 'Partial Attendance' : 'আংশিক উপস্থিতি'}</option>
                    <option value="Financial Support">{language === 'en' ? 'Financial Support' : 'আর্থিক মওকুফ'}</option>
                    <option value="Offer">{language === 'en' ? 'Offer' : 'অফার / ডিসকাউন্ট'}</option>
                  </select>
                </div>
              </div>

              {/* Dynamic summary indicator */}
              {selectedStudent && (
                <div className="bg-muted/5 p-4 rounded-xl border border-dashed border-border text-xs font-bold text-muted space-y-1">
                  <div className="flex justify-between">
                    <span>{language === 'en' ? 'Monthly Standard Fee:' : 'মাসিক ফি:'}</span>
                    <span className="font-mono">{formatCurrency(selectedStudent.finalFee)}</span>
                  </div>
                  {parseFloat(discount) > 0 && (
                    <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                      <span>{language === 'en' ? 'Applied Discount:' : 'প্রযুক্ত ছাড়:'}</span>
                      <span className="font-mono">- {formatCurrency(parseFloat(discount))} ({discountType === 'Manual' ? (language === 'en' ? 'Manual' : 'ম্যানুয়াল') : discountType === 'Partial Attendance' ? (language === 'en' ? 'Partial Attendance' : 'আংশিক উপস্থিতি') : discountType === 'Financial Support' ? (language === 'en' ? 'Financial Support' : 'আর্থিক মওকুফ') : (language === 'en' ? 'Offer' : 'অফার / ডিসকাউন্ট')})</span>
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 border-t border-border pt-1 mt-1 font-black">
                    <span>{language === 'en' ? 'Adjusted Net Payable:' : 'সংশোধিত পরিশোধযোগ্য পরিমাণ:'}</span>
                    <span className="font-mono">{formatCurrency(selectedStudent.finalFee - (parseFloat(discount) || 0))}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1 mt-1">
                    <span>{language === 'en' ? 'Paid Amount:' : 'পরিশোধিত অর্থ:'}</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatCurrency(parseFloat(amount) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-foreground border-t border-border pt-1 mt-1 font-black">
                    <span>{language === 'en' ? 'This Month\'s Remaining Due:' : 'এই মাসের অবশিষ্ট বকেয়া:'}</span>
                    <span className={cn("font-mono", (selectedStudent.finalFee - (parseFloat(discount) || 0) - (parseFloat(amount) || 0)) > 0 ? "text-rose-600" : "text-emerald-600")}>
                      {formatCurrency(Math.max(0, selectedStudent.finalFee - (parseFloat(discount) || 0) - (parseFloat(amount) || 0)))}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              <div className="space-y-3">
                <label className="text-[10px] md:text-xs font-black text-muted uppercase tracking-[0.2em] px-1">{t.paymentMethod}</label>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {methods.map((m) => {
                    const MethodIcon = m.icon;
                    const isActive = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={cn(
                          "flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all text-left relative overflow-hidden active:scale-95",
                          isActive 
                            ? `border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-md` 
                            : "border-border hover:border-muted/30 text-muted hover:bg-muted/10"
                        )}
                      >
                         {isActive && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                        <div className={cn(
                          "p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all shrink-0",
                          isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-card text-muted border border-border shadow-sm"
                        )}>
                          <MethodIcon size={16} className="md:w-5 md:h-5" />
                        </div>
                        <span className="text-[11px] md:text-sm font-black whitespace-nowrap">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] md:text-xs font-black text-muted uppercase tracking-[0.2em] px-1">{t.notes}</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  rows={2}
                  placeholder={language === 'en' ? "Add any reference or remarks..." : "যেকোনো রেফারেন্স বা মন্তব্য লিখুন..."} 
                  className="w-full px-5 py-4 border-2 border-border rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 bg-muted/5 text-foreground text-xs md:text-sm font-bold transition-all focus:border-indigo-500 focus:bg-card resize-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={!selectedStudent}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-muted/20 disabled:text-muted text-white py-4 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-base md:text-xl transition-all shadow-xl shadow-indigo-200 dark:shadow-none active:scale-[0.98] flex items-center justify-center gap-3 group"
              >
                {t.collectSavePayment}
                <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform" />
              </button>
            </form>
          </motion.div>
        </div>

        {/* Info and History Panel */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6 md:space-y-8">
          <AnimatePresence mode="wait">
            {selectedStudent ? (
              <motion.div 
                key="student-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
              >
                {/* Selected Student Summary Card */}
                <div className="bg-indigo-600 dark:bg-indigo-700 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none border border-indigo-500/50 relative overflow-hidden h-fit">
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -mb-16 -mr-16" />
                  
                  <div className="flex items-start gap-4 mb-8">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md shrink-0">
                      <User size={30} className="md:w-8 md:h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xl md:text-2xl font-black truncate">{selectedStudent.name}</h4>
                        <span className={cn(
                          "px-2 py-0.5 text-white text-[8px] md:text-[10px] font-black rounded-lg uppercase tracking-widest backdrop-blur-md border shrink-0",
                          selectedStudent.status === 'Active' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" : "bg-slate-500/20 border-slate-500/30 text-slate-300"
                        )}>
                          {selectedStudent.status === 'Active' ? (language === 'en' ? 'Active' : 'সক্রিয়') : (language === 'en' ? 'Inactive' : 'নিষ্ক্রিয়')}
                        </span>
                      </div>
                      <p className="text-indigo-100/70 font-mono text-xs mt-0.5">{selectedStudent.id} • {selectedStudent.batch}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    <div className="bg-white/10 p-3 md:p-4 rounded-xl md:rounded-2xl backdrop-blur-sm border border-white/10">
                      <p className="text-indigo-100 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-70">{t.monthlyFee}</p>
                      <p className="text-sm md:text-base font-black tracking-tighter truncate">{formatCurrency(selectedStudent.finalFee)}</p>
                    </div>
                    <div className="bg-white/10 p-3 md:p-4 rounded-xl md:rounded-2xl backdrop-blur-sm border border-white/10">
                      <p className="text-indigo-100 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-70">{t.totalPaid}</p>
                      <p className="text-sm md:text-base font-black tracking-tighter truncate">{formatCurrency(studentPayments.reduce((s, p) => s + p.amount, 0))}</p>
                    </div>
                    <div className="bg-white/10 p-3 md:p-4 rounded-xl md:rounded-2xl backdrop-blur-sm border border-white/10">
                      <p className="text-indigo-100 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-70">{language === 'en' ? 'Previous Due' : 'পূর্বের বকেয়া'}</p>
                      <p className="text-sm md:text-base font-black tracking-tighter truncate text-rose-300">{formatCurrency(getStudentTotalDue(selectedStudent))}</p>
                    </div>
                  </div>

                  {lastPayment && (
                    <div className="mt-6 md:mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-[10px] md:text-xs">
                      <span className="text-indigo-100/60 font-black uppercase tracking-widest">{language === 'en' ? 'Last Payment' : 'সর্বশেষ পেমেন্ট'}:</span>
                      <span className="font-black flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
                        <CheckCircle2 size={14} className="text-white" />
                        {lastPayment.month} ({formatCurrency(lastPayment.amount)})
                      </span>
                    </div>
                  )}
                </div>

                {/* History Quick View */}
                <div className="bg-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-border shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col">
                  <div className="flex items-center justify-between mb-6 md:mb-8">
                    <h4 className="text-lg md:text-xl font-black text-foreground flex items-center gap-2">
                      <History size={20} className="text-indigo-500" />
                      {t.paymentHistory}
                    </h4>
                    <span className="text-[10px] font-black uppercase text-muted tracking-widest">{studentPayments.length} Rec</span>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar flex-1">
                    {studentPayments.length > 0 ? (
                      studentPayments
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(p => (
                          <div key={p.id} className="p-4 bg-muted/5 rounded-2xl border-2 border-transparent flex justify-between items-center group hover:bg-card hover:border-indigo-200 transition-all active:scale-95">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center text-muted group-hover:text-indigo-500 transition-colors border border-border shrink-0">
                                <Banknote size={20} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-black text-foreground text-sm truncate">{p.month}</p>
                                <p className="text-[9px] text-muted font-bold uppercase tracking-tight">{p.date} • {p.paymentMethod}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-black text-indigo-600 dark:text-indigo-400 text-sm">৳{p.amount}</p>
                              <button 
                                onClick={() => handlePrintReceipt(p)}
                                className="text-[9px] font-black text-muted hover:text-indigo-500 flex items-center gap-1 ml-auto mt-0.5 uppercase tracking-tighter"
                              >
                                <Printer size={10} /> {language === 'en' ? 'Receipt' : 'রশিদ'}
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 opacity-30">
                        <Receipt size={40} className="mb-2 text-muted" />
                        <p className="text-[10px] font-black uppercase text-muted tracking-widest">{t.noPreviousPayments}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secure Instant Digital QR Payment Card */}
                <PaymentQRCodeCard 
                  student={selectedStudent}
                  amount={amount}
                  month={month}
                  paymentMethod={paymentMethod}
                  language={language}
                />
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card border-2 border-dashed border-border rounded-[2.5rem] p-12 md:p-24 text-center lg:h-full flex flex-col items-center justify-center"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 bg-muted/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-muted">
                  <User size={48} className="md:w-16 md:h-16" />
                </div>
                <h4 className="text-xl md:text-2xl font-black text-foreground mb-2">{t.selectStudent}</h4>
                <p className="text-muted max-w-xs mx-auto text-xs md:text-sm font-bold">{t.recordPaymentsDescription}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent Collections Card List / Table */}
          <div className="bg-card rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-border overflow-hidden">
            <div className="p-6 md:p-8 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/5">
              <div>
                <h3 className="text-lg md:text-xl font-black text-foreground tracking-tight">{t.recentCollections}</h3>
                <p className="text-[10px] md:text-xs text-muted font-bold uppercase tracking-widest mt-1">Live Transaction Stream</p>
              </div>
              <div className="relative w-full md:w-64 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-500 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder={t.searchReceiptPlaceholder} 
                  className="w-full pl-11 pr-4 py-3 text-xs font-bold border-2 border-border rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-card text-foreground"
                />
              </div>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/5 text-left border-b border-border">
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-muted tracking-[0.2em]">{t.date}</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-muted tracking-[0.2em]">{t.name}</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-muted tracking-[0.2em]">{t.month}</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-muted tracking-[0.2em] text-right">{t.amount}</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-muted tracking-[0.2em] text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedPayments.length > 0 ? (showAllPayments ? sortedPayments : sortedPayments.slice(0, 10)).map(payment => {
                    const student = students.find(s => s.id === payment.studentId);
                    return (
                      <tr key={payment.id} className="hover:bg-indigo-50/20 transition-colors group">
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-foreground">{payment.date}</p>
                          <p className="text-[9px] font-mono text-muted uppercase tracking-tighter">#{payment.receiptNumber}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-foreground">{student?.name || 'Deleted Student'}</p>
                          <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-widest">{payment.studentId}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded-lg uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/50">
                            {payment.month}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{formatCurrency(payment.amount)}</p>
                          <p className="text-[10px] text-muted font-black uppercase tracking-widest">{payment.paymentMethod}</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handlePrintReceipt(payment)}
                              className="p-2.5 text-muted hover:text-indigo-600 hover:bg-card rounded-xl transition-all border border-transparent hover:border-border shadow-sm" 
                            >
                              <Printer size={18} />
                            </button>
                            {confirmDeleteId === payment.id ? (
                               <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/30 p-1 rounded-xl animate-in flip-in-y">
                                 <button onClick={() => {
                                   deletePayment(payment.id);
                                   setConfirmDeleteId(null);
                                 }} className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors cursor-pointer">
                                   Delete
                                 </button>
                                 <button onClick={() => setConfirmDeleteId(null)} className="p-1 px-2 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition-colors cursor-pointer">
                                   <X size={14} />
                                 </button>
                               </div>
                             ) : (
                               <button 
                                 onClick={() => setConfirmDeleteId(payment.id)}
                                 className="p-2.5 text-muted hover:text-rose-600 hover:bg-card rounded-xl transition-all border border-transparent hover:border-border shadow-sm cursor-pointer" 
                               >
                                 <Trash2 size={18} />
                               </button>
                             )}
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                     <tr>
                        <td colSpan={5} className="py-24 text-center">
                           <div className="opacity-20 flex flex-col items-center">
                             <Receipt size={64} className="mb-4 text-muted" />
                             <p className="text-xl font-black uppercase text-muted tracking-[0.2em]">{t.noPaymentsRecorded}</p>
                           </div>
                        </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-border">
              {sortedPayments.length > 0 ? (showAllPayments ? sortedPayments : sortedPayments.slice(0, 10)).map(payment => {
                const student = students.find(s => s.id === payment.studentId);
                return (
                  <div key={payment.id} className="p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                       <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black text-muted uppercase tracking-widest">{payment.date}</span>
                          <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded uppercase">{payment.month}</span>
                       </div>
                       <h4 className="font-black text-foreground text-sm truncate">{student?.name || 'Deleted'}</h4>
                       <p className="text-[10px] font-bold text-muted uppercase tracking-tighter">#{payment.receiptNumber} • {payment.paymentMethod}</p>
                    </div>
                    <div className="text-right shrink-0">
                       <p className="font-black text-emerald-600 dark:text-emerald-400 text-lg leading-none mb-1 tracking-tighter font-plus">৳{payment.amount}</p>
                       {false ? (
                         <p className="text-[10px] text-rose-500 font-bold mb-1">৳{payment.discount} {language === 'en' ? 'Disc.' : 'ছাড়'}</p>
                       ) : null}
                       <div className="flex gap-2 justify-end">
                         <button onClick={() => handlePrintReceipt(payment)} className="p-2 bg-muted/10 text-muted hover:text-indigo-600 rounded-lg active:scale-90 transition-colors cursor-pointer"><Printer size={16} /></button>
                         {confirmDeleteId === payment.id ? (
                           <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/30 p-1 rounded-lg animate-in flip-in-y">
                             <button onClick={() => {
                               deletePayment(payment.id);
                               setConfirmDeleteId(null);
                             }} className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors cursor-pointer">
                               Delete
                             </button>
                             <button onClick={() => setConfirmDeleteId(null)} className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-md transition-colors cursor-pointer">
                               <X size={14} />
                             </button>
                           </div>
                         ) : (
                           <button onClick={() => setConfirmDeleteId(payment.id)} className="p-2 bg-muted/10 text-muted hover:text-rose-600 rounded-lg active:scale-90 transition-colors cursor-pointer"><Trash2 size={16} /></button>
                         )}
                       </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-20 text-center opacity-20">
                   <Receipt size={48} className="mx-auto mb-4 text-muted" />
                   <p className="text-sm font-black uppercase tracking-widest text-muted">{t.noPaymentsRecorded}</p>
                </div>
              )}
            </div>
            
            {sortedPayments.length > 10 && (
              <div className="p-5 md:p-6 bg-muted/5 text-center border-t border-border">
                <button onClick={() => setShowAllPayments(!showAllPayments)} className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-foreground uppercase tracking-widest transition-colors">
                  {showAllPayments 
                    ? (language === 'en' ? 'Show Less' : 'কম দেখুন') 
                    : (language === 'en' ? 'View All Recorded Payments' : 'সব পেমেন্ট রেকর্ড দেখুন')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in transition-all">
          <div className="bg-card rounded-[2rem] shadow-2xl w-full max-w-sm p-8 text-center border border-border">
            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-3xl flex items-center justify-center mx-auto mb-6 scale-110 shadow-lg shadow-rose-200 dark:shadow-none">
              <Trash2 size={36} />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-3 underline decoration-rose-200 dark:decoration-rose-900/40 decoration-8 underline-offset-[-2px]">{t.deletePaymentTitle}</h3>
            <p className="text-muted mb-8 font-medium">
              {t.deletePaymentConfirmation}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteId(null)} 
                className="flex-1 py-4 bg-muted/10 hover:bg-muted/20 text-muted font-bold rounded-2xl transition-all active:scale-95"
              >
                {t.cancel}
              </button>
              <button 
                onClick={() => { deletePayment(deleteId); setDeleteId(null); }} 
                className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-rose-200 dark:shadow-none active:scale-95"
              >
                {t.yesDelete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Receipt Modal - Modern Preview */}
      {printReceipt && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in transition-all print:p-0 print:bg-card text-card-foreground print:static">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative overflow-hidden print:shadow-none print:rounded-none print:max-h-none print:w-full print:max-w-none print:p-0"
          >
            {/* Header - Hidden on print */}
            <div className="flex justify-between items-center p-6 border-b border-border bg-slate-50/50 dark:bg-slate-900/50 print:hidden shrink-0">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                     <Receipt size={20} />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-foreground tracking-tight uppercase">{t.moneyReceipt}</h3>
                     <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-none mt-1">{t.receiptPreview}</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                 <button 
                   onClick={() => window.print()}
                   className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:bg-slate-900 transition-all active:scale-95 shadow-lg shadow-indigo-100 dark:shadow-none"
                 >
                    <Printer size={16} />
                    {t.print}
                 </button>
                 <button 
                  onClick={() => setPrintReceipt(null)}
                  className="p-2.5 bg-background hover:bg-slate-200 dark:hover:bg-slate-800 text-muted rounded-xl transition-all"
                 >
                   <X size={20} />
                 </button>
               </div>
            </div>

            {/* Receipt Content */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 custom-scrollbar print:overflow-visible print:p-0 print:m-0 bg-card dark:bg-slate-950 print:bg-card text-card-foreground text-foreground print:text-black">
               {/* Academy Header */}
               <div className="text-center space-y-2 border-b-[3px] border-slate-900 dark:border-white print:border-slate-900 pb-8">
                  <h1 className="text-3xl md:text-5xl font-black tracking-[calc(-0.02em)] text-slate-900 dark:text-white print:text-black leading-none">PRAGYA ACADEMY</h1>
                  <p className="text-xs md:text-sm font-black text-muted uppercase tracking-[0.3em] font-plus">{language === 'en' ? 'Smart Academic Decision System' : 'স্মার্ট একাডেমিক সিস্টেম'}</p>
                  <div className="pt-4 flex justify-center">
                    <span className="px-6 py-2 border-2 border-slate-900 dark:border-white print:border-slate-900 rounded-full font-black text-xs md:text-sm uppercase tracking-widest bg-slate-900 dark:bg-card text-card-foreground text-white dark:text-slate-900 shadow-xl shadow-slate-200 dark:shadow-none print:shadow-none">
                      {t.moneyReceipt}
                    </span>
                  </div>
               </div>

               {/* Meta Info Grid */}
               <div className="grid grid-cols-2 gap-4 md:gap-8">
                  <div className="p-4 md:p-6 bg-muted/10 dark:bg-slate-900/50 rounded-2xl md:rounded-[2rem] border-2 border-border/50 dark:border-slate-800 space-y-3 print:bg-card text-card-foreground print:border-slate-900 print:rounded-none">
                     <div className="flex justify-between items-center text-[10px] md:text-xs font-bold text-muted uppercase tracking-widest print:text-black">
                        <span>{t.receiptNumber}</span>
                        <span className="font-black text-foreground font-mono">#{printReceipt.receiptNumber}</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] md:text-xs font-bold text-muted uppercase tracking-widest print:text-black">
                        <span>{t.date}</span>
                        <span className="font-black text-foreground">{printReceipt.date}</span>
                     </div>
                  </div>
                  <div className="p-4 md:p-6 bg-muted/10 dark:bg-slate-900/50 rounded-2xl md:rounded-[2rem] border-2 border-border/50 dark:border-slate-800 space-y-3 print:bg-card text-card-foreground print:border-slate-900 print:rounded-none">
                     <div className="flex justify-between items-center text-[10px] md:text-xs font-bold text-muted uppercase tracking-widest print:text-black">
                        <span>{t.studentID}</span>
                        <span className="font-black text-foreground font-mono">{printReceipt.studentId}</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] md:text-xs font-bold text-muted uppercase tracking-widest print:text-black">
                        <span>{t.feeMonth}</span>
                        <span className="font-black text-foreground">{printReceipt.month}</span>
                     </div>
                  </div>
               </div>

               {/* Student Highlights */}
               <div className="p-6 md:p-10 border-[3px] border-slate-900 dark:border-white print:border-slate-900 rounded-[2rem] md:rounded-[3rem] relative overflow-hidden print:rounded-none bg-card">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-muted/10 dark:bg-white/5 rounded-full -mr-16 -mt-16 print:hidden"></div>
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                     <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{t.name}</p>
                        <p className="text-xl md:text-3xl font-black text-slate-900 dark:text-white print:text-black leading-tight underline decoration-indigo-200 decoration-8 underline-offset-[-4px] print:no-underline">{students.find(s => s.id === printReceipt.studentId)?.name || 'N/A'}</p>
                     </div>
                     <div className="md:text-right">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{t.batch}</p>
                        <p className="text-lg md:text-2xl font-bold text-foreground dark:text-slate-200 print:text-black">{students.find(s => s.id === printReceipt.studentId)?.batch || 'N/A'}</p>
                     </div>
                  </div>
               </div>

               {/* Detailed Table */}
               <div className="overflow-hidden">
                  <table className="w-full">
                     <thead>
                        <tr className="border-b-[3px] border-slate-900 dark:border-white print:border-slate-900 text-left">
                           <th className="py-4 text-[10px] md:text-xs font-black uppercase text-muted-foreground tracking-widest print:text-black">{t.description}</th>
                           <th className="py-4 text-right text-[10px] md:text-xs font-black uppercase text-muted-foreground tracking-widest print:text-black">{t.amount}</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-900">
                        <tr>
                           <td className="py-6 md:py-8 font-black text-foreground dark:text-slate-200 print:text-black text-sm md:text-base">
                              {t.monthlyTuitionFee} ({printReceipt.month})
                           </td>
                           <td className="py-6 md:py-8 text-right font-black text-slate-900 dark:text-white print:text-black text-lg md:text-xl font-plus">
                              BDT {printReceipt.amount}
                           </td>
                        </tr>
                        {printReceipt.discount > 0 && (
                          <tr className="text-rose-500 font-bold">
                             <td className="py-4 text-sm md:text-base italic">
                                {t.feeSupplement}
                                {printReceipt.discountType && <span className="block text-[10px] uppercase tracking-tighter opacity-70">Reason: {printReceipt.discountType}</span>}
                             </td>
                             <td className="py-4 text-right font-black text-sm md:text-base">- BDT {printReceipt.discount}</td>
                          </tr>
                        )}
                        <tr className="bg-slate-900 dark:bg-card text-card-foreground text-white dark:text-slate-900 rounded-2xl print:bg-muted/20 print:text-black">
                           <td className="py-6 px-6 font-black text-base md:text-xl uppercase tracking-widest">{t.total}</td>
                           <td className="py-6 px-6 text-right font-black text-2xl md:text-4xl tracking-tighter font-plus">
                              BDT {printReceipt.amount} /=
                           </td>
                        </tr>
                     </tbody>
                  </table>
               </div>

               {/* Footer / Auth */}
               <div className="flex flex-col md:flex-row justify-between items-end gap-12 pt-10">
                  <div className="w-full md:w-auto space-y-2">
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.paymentMethod}</p>
                     <p className="text-lg md:text-2xl font-black text-slate-900 dark:text-white print:text-black flex items-center gap-2">
                        {printReceipt.paymentMethod === 'Cash' && <Banknote size={24} className="text-emerald-500" />}
                        {printReceipt.paymentMethod === 'bKash' && <Smartphone size={24} className="text-pink-600" />}
                        {printReceipt.paymentMethod === 'Nagad' && <Wallet size={24} className="text-orange-600" />}
                        {printReceipt.paymentMethod === 'Bank' && <Building2 size={24} className="text-blue-600" />}
                        {printReceipt.paymentMethod}
                     </p>
                     <p className="text-[10px] font-bold text-muted-foreground italic">Received by: {printReceipt.receivedBy || 'Administrative Office'}</p>
                  </div>
                  <div className="text-center w-full md:w-72 space-y-4">
                     <div className="border-b-[3px] border-slate-900 dark:border-white print:border-slate-900 w-full mb-2"></div>
                     <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white print:text-black tracking-[0.3em] font-plus">{t.authorizedSignature}</p>
                  </div>
               </div>

               <div className="pt-10 border-t border-dashed border-border dark:border-slate-800 text-center text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex flex-col md:flex-row items-center justify-center gap-4 print:text-black">
                  <span>Contact: +880 1XXX-XXXXXX</span>
                  <span className="hidden md:inline">•</span>
                  <span>Office: Pragya Center, Lake Road, Dhaka</span>
                  <span className="hidden md:inline">•</span>
                  <span>{t.digitallyGenerated}</span>
               </div>
            </div>
            
            {/* Action Footer - Hidden on print */}
            <div className="p-6 border-t border-border bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-3 print:hidden shrink-0">
               <button 
                 onClick={() => setPrintReceipt(null)}
                 className="flex-1 py-4 border-2 border-border dark:bg-slate-800 text-foreground font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
               >
                 {t.closePreview}
               </button>
               <button 
                 onClick={() => window.print()}
                 className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all active:scale-95 shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
               >
                 <Printer size={16} />
                 {t.printReceipt}
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

