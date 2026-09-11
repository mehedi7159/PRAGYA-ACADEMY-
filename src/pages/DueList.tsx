import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, cn } from '../lib/utils';
import { AlertCircle, Search, MessageCircle, Copy, Check, Download, FileText, Calendar, Filter, Users, LayoutList } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';

import { BatchInfoModal } from '../components/BatchInfoModal';
import { translations } from '../lib/translations';
import { getPreviousMonthStr, getMonthsBetween, getYearMonthStr } from '../lib/dateUtils';

export function DueList() {
  const { students, payments, batches, language } = useAppContext();
  const t = translations[language];

  const [filterMonth, setFilterMonth] = useState('all');
  const [filterBatch, setFilterBatch] = useState('');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedBatchInfo, setSelectedBatchInfo] = useState<string | null>(null);

  // Calculate Due for a specific month
  const dueList: any[] = [];
  
  // Grace current month: max due month is current calendar month - 1
  const maxDueMonthStr = getPreviousMonthStr();

  students.forEach(student => {
    const admissionMonthStr = student.admissionDate ? student.admissionDate.substring(0, 7) : maxDueMonthStr;
    
    // Determine maximum boundary month for student dues
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

    const monthsSinceAdmission = getMonthsBetween(admissionMonthStr, endMonthStr);
    
    let totalPaid = 0;
    let totalDue = 0;
    let dueMonths: string[] = [];
    let totalFinalFee = 0;

    monthsSinceAdmission.forEach(monthStr => {
      if (filterMonth !== 'all' && monthStr !== filterMonth) {
        return;
      }
      
      const monthPayments = payments.filter(p => p.studentId === student.id && p.month === monthStr);
      const paidAmount = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const discountAmount = monthPayments.reduce((sum, p) => sum + (p.discount || 0), 0);
      const dueAmount = student.finalFee - paidAmount - discountAmount;
      
      if (dueAmount > 0) {
        totalPaid += paidAmount;
        totalDue += dueAmount;
        dueMonths.push(monthStr);
        totalFinalFee += student.finalFee;
      }
    });
    
    if (totalDue > 0) {
      dueList.push({
         ...student, 
         dueMonths,
         totalPaidAmount: totalPaid,
         totalDueAmount: totalDue,
         totalFinalFee: totalFinalFee
      });
    }
  });

  // Filter out by batch and search
  const filteredDueList = dueList.filter(s => {
    const matchesBatch = filterBatch ? s.batch === filterBatch : true;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.id.toLowerCase().includes(search.toLowerCase());
    return matchesBatch && matchesSearch;
  });

  const totalDueAmount = filteredDueList.reduce((sum, s) => sum + s.totalDueAmount, 0);

  const displayMonthStr = filterMonth === 'all' ? (language === 'en' ? 'All Months' : 'সকল মাস') : new Date(filterMonth + '-01').toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' });

  const handleCopyNumbers = () => {
    const numbers = filteredDueList.map(s => s.guardianMobile).filter(Boolean);
    const uniqueNumbers = [...new Set(numbers)]; // Remove possible duplicates
    const stringNumbers = uniqueNumbers?.join(',') || '';
    
    navigator.clipboard.writeText(stringNumbers).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = `${t.dueList} - ${displayMonthStr}`;
    
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`${t.totalDue}: ${formatCurrency(totalDueAmount)} (${filteredDueList.length} ${t.students})`, 14, 36);

    const tableHeaders = [[t.studentID, t.name, t.batch, language === 'bn' ? 'মাসগুলো' : 'Months', t.totalFee, t.paid, t.dueAmount]];
    const tableData = filteredDueList.map(s => [
      s.id,
      s.name,
      s.batch,
      (s.dueMonths || []).map((m: string) => new Date(m + '-01').toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'short' })).join(', '),
      formatCurrency(s.totalFinalFee),
      formatCurrency(s.totalPaidAmount),
      formatCurrency(s.totalDueAmount)
    ]);

    autoTable(doc, {
      startY: 45,
      head: tableHeaders,
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [225, 29, 72] } // rose-600
    });

    doc.save(`due_list_${filterMonth}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-12 font-plus text-foreground">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 md:px-0">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 md:w-14 md:h-14 bg-rose-500 text-white rounded-2xl shadow-xl shadow-rose-200 dark:shadow-rose-950/20 flex items-center justify-center">
              <LayoutList size={24} />
           </div>
           <div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
               {t.dueList}
            </h2>
            <p className="text-muted font-medium text-xs md:text-sm">{t.trackUnpaidFees} {displayMonthStr}</p>
           </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
             onClick={handleExportPDF}
             className="w-full flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl md:rounded-2xl font-black transition-all shadow-xl shadow-indigo-200 active:scale-95 text-sm"
          >
             <Download size={18} />
             {language === 'en' ? 'Export PDF' : 'পিডিএফ ডাউনলোড'}
          </button>
          <a
             href={`sms:${filteredDueList.map(s => s.guardianMobile).filter(Boolean).join(',')}?body=${encodeURIComponent(`প্রিয় অভিভাবক, আপনার সন্তানের মাসিক ফি বকেয়া রয়েছে। দয়া করে দ্রুত বকেয়া পরিশোধ করুন। ধন্যবাদ। - PRAGYA ACADEMY`)}`}
             className="w-full flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-50 text-blue-600 border-2 border-blue-100 hover:border-blue-200 rounded-xl md:rounded-2xl font-black transition-all shadow-sm active:scale-95 text-sm"
          >
             <MessageCircle size={18} />
             {language === 'en' ? 'Bulk SMS' : 'বাল্ক এসএমএস'}
          </a>
          <button 
             onClick={handleCopyNumbers}
             className="w-full flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-card text-card-foreground border-2 border-border/50 hover:border-border text-foreground rounded-xl md:rounded-2xl font-bold transition-all shadow-sm active:scale-95 text-sm"
          >
             {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
             {copied ? t.copiedToClipboard : t.copyAllNumbers}
          </button>
        </div>
      </header>

      {/* Summary Stat Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-rose-600 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl shadow-rose-200 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
           <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-4 md:gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-2xl md:rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/10">
                <AlertCircle size={32} md:size={40} className="text-white" />
              </div>
              <div>
                 <p className="text-rose-100 font-black uppercase tracking-[0.2em] text-[10px] md:text-sm mb-1">{t.totalDue} ({filteredDueList.length} {t.students})</p>
                 <h3 className="text-3xl md:text-5xl font-black">{formatCurrency(totalDueAmount)}</h3>
              </div>
           </div>
           <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/20 font-bold text-sm">
              <Calendar size={16} />
              {displayMonthStr}
           </div>
        </div>
      </motion.div>

      {/* Filters Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 bg-card p-6 rounded-[2rem] md:rounded-[2.5rem] border border-border shadow-xl shadow-slate-200/50"
      >
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">{t.feeMonth}</label>
          <div className="relative group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-500 transition-colors" size={18} />
            <select 
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-border rounded-xl md:rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none bg-muted/20 hover:bg-muted/40 focus:bg-card font-bold text-foreground text-sm"
            >
              <option value="all">{language === 'en' ? 'All Unpaid Months' : 'সকল বকেয়া মাস'}</option>
              {Array.from({length: 12}).map((_, i) => {
                const d = new Date();
                d.setDate(1); // avoid rollover
                d.setMonth(d.getMonth() - i);
                const mVal = getYearMonthStr(d);
                return <option key={mVal} value={mVal}>{d.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' })}</option>
              })}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">{t.batch}</label>
          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-500 transition-colors" size={18} />
            <select 
              value={filterBatch}
              onChange={e => setFilterBatch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-border rounded-xl md:rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none bg-muted/20 hover:bg-muted/40 focus:bg-card font-bold text-foreground text-sm"
            >
              <option value="">{t.allBatches}</option>
              {batches.map(b => (
                <option key={b.id} value={b.name}>{b.name} {b.status === 'Inactive' ? '(Closed)' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2 md:col-span-1">
          <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">{language === 'en' ? 'Search Student' : 'শিক্ষার্থী খুঁজুন'}</label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-border rounded-xl md:rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-muted/20 hover:bg-muted/40 focus:bg-card font-bold text-foreground text-sm"
            />
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-[2rem] md:rounded-[2.5rem] border border-border shadow-2xl shadow-slate-200/50 overflow-hidden"
      >
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/10 text-muted font-black text-[10px] uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">{t.studentID}</th>
                <th className="px-8 py-5">{t.name}</th>
                <th className="px-8 py-5">{t.batch}</th>
                <th className="px-8 py-5">{language === 'en' ? 'Months' : 'মাসগুলো'}</th>
                <th className="px-8 py-5 text-right">{t.totalFee}</th>
                <th className="px-8 py-5 text-right">{t.paid}</th>
                <th className="px-8 py-5 text-right">{t.dueAmount}</th>
                <th className="px-8 py-5 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDueList.map(item => (
                <tr key={item.id} className="hover:bg-rose-500/10 transition-all group">
                  <td className="px-8 py-6">
                    <span className="font-mono text-xs font-bold text-muted bg-muted/20 px-3 py-1 rounded-lg">
                      {item.id}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-black text-slate-900 text-lg">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{item.guardianMobile}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => setSelectedBatchInfo(item.batch)}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full border border-indigo-100 uppercase uppercase tracking-wider transition-colors active:scale-95"
                    >
                      {item.batch}
                    </button>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-1">
                      {item.dueMonths.map((m: string) => (
                        <span key={m} className="text-[10px] font-bold text-slate-600 bg-muted/10 px-2.5 py-1 rounded-full border border-border/50 whitespace-nowrap">
                           {new Date(m + '-01').toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'short' })}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right font-bold text-slate-600">{formatCurrency(item.totalFinalFee)}</td>
                  <td className="px-8 py-6 text-right text-emerald-600 font-black">{formatCurrency(item.totalPaidAmount)}</td>
                  <td className="px-8 py-6 text-right">
                     <span className="text-xl font-black text-rose-600 tracking-tighter">{formatCurrency(item.totalDueAmount)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center gap-2">
                       <a 
                         href={`sms:${item.guardianMobile}?body=${encodeURIComponent(`প্রিয় অভিভাবক, ${item.name}-এর ${item.dueMonths.length > 1 ? `${item.dueMonths.length} মাসের` : 'মাসিক'} ফি বাবদ মোট ${item.totalDueAmount} টাকা বকেয়া আছে। দয়া করে দ্রুত পরিশোধ করুন। - PRAGYA ACADEMY`)}`}
                         className="w-12 h-12 bg-card text-card-foreground border-2 border-border/50 text-blue-500 hover:border-blue-500 hover:bg-blue-50 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
                       >
                         <MessageCircle size={20} />
                       </a>
                       <a 
                         href={`https://wa.me/88${item.guardianMobile}?text=${encodeURIComponent(`প্রিয় অভিভাবক,\nআপনার সন্তানের ${item.dueMonths.length > 1 ? `${item.dueMonths.length} মাসের` : 'মাসিক'} ফি বাবদ মোট ${item.totalDueAmount} টাকা বকেয়া আছে (${item.dueMonths.map((m: string) => new Date(m + '-01').toLocaleString('bn-BD', { month: 'long' })).join(', ')} মাসের জন্য)। দয়া করে দ্রুত বকেয়া পরিশোধ করুন।\n\nধন্যবাদ,\nPRAGYA ACADEMY`)}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="w-12 h-12 bg-card text-card-foreground border-2 border-border/50 text-emerald-500 hover:border-emerald-500 hover:bg-emerald-50 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
                       >
                         <MessageCircle size={20} />
                       </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-50">
          {filteredDueList.length > 0 ? filteredDueList.map(item => (
            <div key={item.id} className="p-5 flex flex-col gap-4">
               <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <h4 className="font-black text-slate-900 text-lg">{item.name}</h4>
                       <button 
                         onClick={() => setSelectedBatchInfo(item.batch)}
                         className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[9px] font-black rounded-md transition-colors active:scale-95"
                       >
                         {item.batch}
                       </button>
                    </div>
                    <div className="flex flex-wrap gap-1 items-center mt-1">
                       <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted/10 px-2 py-0.5 rounded border border-border/50">{item.id}</span>
                       {item.dueMonths.map((m: string) => (
                         <span key={m} className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                           {new Date(m + '-01').toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'short' })}
                         </span>
                       ))}
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.dueAmount}</p>
                     <p className="text-2xl font-black text-rose-600 tracking-tighter">{formatCurrency(item.totalDueAmount)}</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/10 rounded-xl border border-border/50">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t.totalFee}</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(item.totalFinalFee)}</p>
                  </div>
                  <div className="p-3 bg-muted/10 rounded-xl border border-border/50">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t.paid}</p>
                    <p className="text-sm font-black text-emerald-600">{formatCurrency(item.totalPaidAmount)}</p>
                  </div>
               </div>

               <div className="flex gap-2">
                  <a 
                    href={`sms:${item.guardianMobile}?body=${encodeURIComponent(`প্রিয় অভিভাবক, ${item.name}-এর ${item.dueMonths.length > 1 ? `${item.dueMonths.length} মাসের` : 'মাসিক'} ফি বাবদ মোট ${item.totalDueAmount} টাকা বকেয়া আছে। দয়া করে দ্রুত পরিশোধ করুন। - PRAGYA ACADEMY`)}`}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-50 text-blue-600 rounded-xl font-black text-xs border border-blue-100 active:scale-95 transition-all"
                  >
                    <MessageCircle size={18} /> SMS
                  </a>
                  <a 
                    href={`https://wa.me/88${item.guardianMobile}?text=${encodeURIComponent(`প্রিয় অভিভাবক,\nআপনার সন্তানের ${item.dueMonths.length > 1 ? `${item.dueMonths.length} মাসের` : 'মাসিক'} ফি বাবদ মোট ${item.totalDueAmount} টাকা বকেয়া আছে (${item.dueMonths.map((m: string) => new Date(m + '-01').toLocaleString('bn-BD', { month: 'long' })).join(', ')} মাসের জন্য)। দয়া করে দ্রুত বকেয়া পরিশোধ করুন।\n\nধন্যবাদ,\nPRAGYA ACADEMY`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-50 text-emerald-600 rounded-xl font-black text-xs border border-emerald-100 active:scale-95 transition-all"
                  >
                    <MessageCircle size={18} /> WhatsApp
                  </a>
               </div>
            </div>
          )) : (
            <div className="px-8 py-32 text-center text-muted">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-2 shadow-inner">
                  <Check size={40} />
                </div>
                <h4 className="text-xl md:text-2xl font-black text-slate-900">{t.clear}</h4>
                <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">{t.noDueStudents}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
      {selectedBatchInfo && (
        <BatchInfoModal batchName={selectedBatchInfo} onClose={() => setSelectedBatchInfo(null)} />
      )}
    </div>
  );
}
