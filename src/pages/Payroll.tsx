import React, { useState } from 'react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  UserCheck, 
  Users, 
  Activity, 
  CheckCircle2,
  Shield,
  BadgeCheck,
  Printer,
  User,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { cn, formatCurrency } from '../lib/utils';
import { translations } from '../lib/translations';
import { getCurrentMonthStr } from '../lib/dateUtils';

export function Payroll() {
  const { 
    teachers, 
    teacherRecords, 
    payments,
    salaryRecords,
    finalizeSalary,
    language 
  } = useAppContext();
  const t = translations[language];
  
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr()); // YYYY-MM
  const [adjustments, setAdjustments] = useState<Record<string, { amount: number, note: string }>>({});
  
  const monthIncome = payments
    .filter(p => p.month === selectedMonth)
    .reduce((sum, p) => sum + p.amount, 0);

  const monthClasses = teacherRecords.filter(r => 
    r.date.startsWith(selectedMonth) && 
    r.status !== 'Absent' && 
    r.status !== 'Cancelled' && 
    r.status !== 'Pending'
  );
  const totalMonthClasses = monthClasses.length;

  const founderPool = monthIncome * 0.20;
  const teacherPool = monthIncome * 0.80;
  const perClassValue = totalMonthClasses > 0 ? teacherPool / totalMonthClasses : 0;

  const isMonthLocked = salaryRecords.some(r => r.month === selectedMonth && r.isLocked);

  const handleFinalize = () => {
    const distributions = teachers.map(teacher => {
      const classesTaken = monthClasses.filter(r => r.teacherId === teacher.id).length;
      const teacherSalary = classesTaken * perClassValue;
      const founderShare = teacher.isFounder ? (founderPool / 2) : 0;
      const adj = adjustments[teacher.id] || { amount: 0, note: '' };
      
      return {
        teacherId: teacher.id,
        classesTaken,
        teacherSalary,
        founderShare,
        adjustmentAmount: adj.amount,
        adjustmentNote: adj.note,
        totalSalary: teacherSalary + founderShare + adj.amount
      };
    });

    finalizeSalary({
      id: `SAL-${selectedMonth}`,
      month: selectedMonth,
      totalIncome: monthIncome,
      founderPool,
      teacherPool,
      totalClasses: totalMonthClasses,
      perClassRate: perClassValue,
      isLocked: true,
      distributions
    });
  };

  const currentSalaryRecord = salaryRecords.find(r => r.month === selectedMonth && r.isLocked);

  const generateSalarySlip = (teacher: any, distribution: any) => {
    if (!currentSalaryRecord) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(24);
    doc.text("Coaching Center", 105, 20, { align: "center" });
    
    doc.setFontSize(16);
    doc.text("Salary Slip", 105, 30, { align: "center" });
    
    // Info
    doc.setFontSize(12);
    doc.text(`Instructor: ${teacher.name}`, 20, 45);
    doc.text(`Month: ${selectedMonth}`, 20, 52);
    doc.text(`Slip Generation Date: ${new Date().toLocaleDateString()}`, 20, 59);

    // Auto Table for breakdown
    autoTable(doc, {
      startY: 65,
      head: [['Description', 'Details']],
      body: [
        ['Classes Taken', distribution.classesTaken.toString()],
        ['Rate per Class', `Tk ${currentSalaryRecord.perClassRate.toFixed(2)}`],
        ['Base Salary', `Tk ${distribution.teacherSalary.toFixed(2)}`],
        ['Founder Share', `Tk ${distribution.founderShare.toFixed(2)}`],
        ['Total Salary', `Tk ${distribution.totalSalary.toFixed(2)}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] } // indigo-600
    });

    // Signature
    doc.setFontSize(10);
    const finalY = (doc as any).lastAutoTable.finalY || 130;
    doc.text("_________________________", 20, finalY + 30);
    doc.text("Authorized Signature", 20, finalY + 35);
    
    doc.text("_________________________", 140, finalY + 30);
    doc.text("Instructor Signature", 140, finalY + 35);

    doc.save(`Salary_Slip_${teacher.name}_${selectedMonth}.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-7xl mx-auto space-y-8 pb-24 px-5 md:px-0 font-plus text-foreground"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none uppercase italic">
            Smart <span className="text-indigo-600">Payroll</span>
          </h1>
          <p className="text-muted font-bold text-[10px] md:text-xs uppercase tracking-[0.3em] mt-2 max-w-xl opacity-70">
            {language === 'en' 
              ? 'Automate revenue-based payroll processing for faculty members' 
              : 'অনুষদ সদস্যদের জন্য স্বয়ংক্রিয়ভাবে আয়-ভিত্তিক বেতন প্রক্রিয়াকরণ' }
          </p>
        </div>
        <div className="bg-card p-2 rounded-2xl border-2 border-border shadow-sm flex items-center px-4 w-full md:w-auto shrink-0">
          <Calendar size={18} className="text-indigo-500 mr-2 shrink-0" />
          <input 
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="py-2.5 bg-transparent font-black text-foreground outline-none text-sm cursor-pointer w-full"
          />
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t.totalIncome} value={formatCurrency(monthIncome)} icon={TrendingUp} color="emerald" />
        <StatCard title={t.founderPool} value={formatCurrency(founderPool)} icon={UserCheck} color="amber" />
        <StatCard title={t.teacherPool} value={formatCurrency(teacherPool)} icon={Users} color="indigo" />
        <StatCard title={t.perClassValue} value={formatCurrency(perClassValue)} icon={Activity} color="rose" />
      </div>

      {/* Main Payroll Content */}
      <div className="bg-card rounded-[2.5rem] border border-border shadow-xl hover:border-indigo-500/30 transition-all overflow-hidden flex flex-col">
        {/* Payroll Header area */}
        <div className="p-6 md:p-8 border-b border-border bg-muted/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-500/20">
               <FileText size={24} />
             </div>
             <div>
               <h3 className="text-xl font-black tracking-tight uppercase italic">{t.revenueReport}</h3>
               <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{selectedMonth} Distribution</p>
             </div>
          </div>
          
          {isMonthLocked ? (
            <div className="w-full md:w-auto px-6 py-4 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-sm">
              <Shield size={16} /> Payroll Finalized
            </div>
          ) : (
            <button 
              onClick={handleFinalize}
              disabled={totalMonthClasses === 0}
              className={cn(
                "w-full md:w-auto px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 cursor-pointer",
                totalMonthClasses > 0 
                  ? "bg-foreground text-background hover:bg-indigo-600 hover:text-white shadow-xl active:scale-95" 
                  : "bg-muted/20 text-muted cursor-not-allowed border border-border"
              )}
            >
              <CheckCircle2 size={16} /> {t.lockSalary}
            </button>
          )}
        </div>
        
        {/* Payroll List */}
        <div className="flex flex-col divide-y divide-border">
          {teachers.map(teacher => {
            const adj = adjustments[teacher.id] || { amount: 0, note: '' };
            let classesTaken = 0;
            let teacherSalary = 0;
            let founderShareValue = 0;
            let total = 0;
            let distribution: any = null;

            if (isMonthLocked && currentSalaryRecord) {
              distribution = currentSalaryRecord.distributions.find(d => d.teacherId === teacher.id);
              if (distribution) {
                classesTaken = distribution.classesTaken;
                teacherSalary = distribution.teacherSalary;
                founderShareValue = distribution.founderShare;
                total = distribution.totalSalary;
              }
            } else {
              classesTaken = monthClasses.filter(r => r.teacherId === teacher.id).length;
              teacherSalary = classesTaken * perClassValue;
              founderShareValue = teacher.isFounder ? (founderPool / 2) : 0;
              total = teacherSalary + founderShareValue + adj.amount;
              
              distribution = {
                teacherId: teacher.id,
                classesTaken,
                teacherSalary,
                founderShare: founderShareValue,
                adjustmentAmount: adj.amount,
                adjustmentNote: adj.note,
                totalSalary: total
              }
            }
            
            if (total === 0 && classesTaken === 0 && !teacher.isFounder) return null;

            return (
              <div key={teacher.id} className="p-6 md:p-8 hover:bg-muted/5 transition-colors flex flex-col xl:flex-row gap-6 xl:items-center justify-between group">
                
                {/* Faculty Info */}
                <div className="flex items-center gap-4 xl:w-1/4">
                  <div className="w-12 h-12 bg-card border border-border shadow-sm text-muted rounded-[1.25rem] flex items-center justify-center shrink-0 group-hover:border-indigo-500/30 group-hover:text-indigo-500 transition-colors">
                    <User size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-foreground text-sm sm:text-base flex items-center gap-2 truncate">
                      {teacher.name}
                      {teacher.isFounder && <BadgeCheck size={16} className="text-amber-500 shrink-0" title="Founder" />}
                    </h4>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest truncate mt-0.5">{teacher.subject}</p>
                  </div>
                </div>

                {/* Sessions */}
                <div className="xl:w-1/6 flex items-center xl:justify-center">
                   <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg shadow-sm group-hover:border-indigo-500/30 transition-colors">
                     <Activity size={14} className="text-indigo-500" /> 
                     <span className="text-[11px] font-black">{classesTaken} <span className="opacity-60">Sessions</span></span>
                   </div>
                </div>

                {/* Adjustments */}
                <div className="xl:w-1/3">
                  {!isMonthLocked ? (
                    <div className="flex flex-col sm:flex-row gap-3 w-full border-t xl:border-0 border-border pt-4 xl:pt-0">
                      <div className="relative flex-1">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-muted/10 rounded flex items-center justify-center border border-border">
                          <DollarSign size={12} className="text-foreground" />
                        </div>
                        <input 
                          type="number"
                          placeholder="Adj."
                          value={adj.amount || ''}
                          onChange={(e) => setAdjustments(prev => ({ 
                            ...prev, 
                            [teacher.id]: { ...prev[teacher.id], amount: Number(e.target.value) } 
                          }))}
                          className="w-full pl-10 pr-3 py-2 bg-card border border-border rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-muted/40 shadow-sm"
                        />
                      </div>
                      <div className="relative flex-[2]">
                        <input 
                          type="text"
                          placeholder="Adjustment Note"
                          value={adj.note || ''}
                          onChange={(e) => setAdjustments(prev => ({ 
                            ...prev, 
                            [teacher.id]: { ...prev[teacher.id], note: e.target.value } 
                          }))}
                          className="w-full px-3 py-2 bg-card border border-border rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-muted/40 shadow-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    distribution?.adjustmentAmount !== 0 ? (
                      <div className="flex items-center gap-3 border-t xl:border-0 border-border pt-4 xl:pt-0">
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border",
                          distribution?.adjustmentAmount > 0 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                            : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        )}>
                          Adj: {distribution?.adjustmentAmount > 0 ? '+' : ''}{distribution?.adjustmentAmount}
                        </span>
                        <span className="text-xs font-bold text-muted italic truncate">{distribution?.adjustmentNote}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 opacity-30 border-t xl:border-0 border-border pt-4 xl:pt-0">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">No Adjustments</span>
                      </div>
                    )
                  )}
                </div>

                {/* Net Total */}
                <div className="xl:w-1/4 flex items-center justify-between xl:justify-end gap-6 border-t xl:border-0 border-border pt-4 xl:pt-0">
                  <div className="text-left xl:text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-0.5 whitespace-nowrap">Net Pay</p>
                    <p className="text-lg sm:text-2xl font-black text-indigo-600 tracking-tight leading-none whitespace-nowrap">
                      {formatCurrency(total)}
                    </p>
                  </div>
                  {isMonthLocked && distribution && (
                    <button 
                      onClick={() => generateSalarySlip(teacher, distribution)}
                      className="p-3 bg-card border border-border text-muted hover:text-indigo-600 hover:border-indigo-500/30 hover:bg-indigo-500/5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer flex shrink-0"
                      title={language === 'en' ? "Print Salary Slip" : "বেতন স্লিপ প্রিন্ট করুন"}
                    >
                      <Printer size={18} />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
          
          {teachers.length === 0 && (
             <div className="p-12 text-center text-muted">
                <Users size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest">No Faculty Members Found</p>
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string, icon: React.ElementType, color: 'emerald' | 'amber' | 'indigo' | 'rose' }) {
  
  const colorMap = {
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20",
    indigo: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20",
    rose: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20"
  };

  const iconColorMap = {
    emerald: "text-emerald-500",
    amber: "text-amber-500",
    indigo: "text-indigo-500",
    rose: "text-rose-500"
  };

  return (
    <div className={cn(
      "p-6 rounded-[2rem] border transition-all flex flex-col justify-between gap-4 shadow-sm", 
      colorMap[color]
    )}>
      <div className="flex items-center justify-between">
         <p className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
         <div className="p-2 bg-background/50 rounded-xl shadow-sm backdrop-blur-sm">
           <Icon size={16} className={iconColorMap[color]} />
         </div>
      </div>
      <div>
         <h4 className="text-2xl sm:text-3xl font-black tracking-tight">{value}</h4>
      </div>
    </div>
  );
}
