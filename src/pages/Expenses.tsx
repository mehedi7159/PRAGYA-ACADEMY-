import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../store/AppContext';
import { Expense } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { ArrowDownRight, Plus, Trash2, TrendingDown, Calendar, Search, PieChart as PieChartIcon, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

import { translations } from '../lib/translations';
import { getLocalDateStr, getCurrentMonthStr } from '../lib/dateUtils';

export function Expenses() {
  const { expenses, expenseCategories, addExpense, deleteExpense, language } = useAppContext();
  const t = translations[language];
  
  const [date, setDate] = useState(getLocalDateStr());
  const [category, setCategory] = useState(expenseCategories[0] || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Auto-save logic
  const isInitialMount = useRef(true);
  const DRAFT_KEY = 'PRAGYA_EXPENSES_DRAFT';

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.date) setDate(draft.date);
        if (draft.category) setCategory(draft.category);
        if (draft.amount) setAmount(draft.amount);
        if (draft.description) setDescription(draft.description);
      } catch (e) {
        console.error('Failed to load expenses draft', e);
      }
    }
    isInitialMount.current = false;
  }, []);

  useEffect(() => {
    if (isInitialMount.current) return;
    
    const draft = {
      date,
      category,
      amount,
      description
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [date, category, amount, description]);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = language === 'en' ? 'Amount must be greater than 0' : 'টাকার পরিমাণ ০ এর বেশি হতে হবে';
    if (!category) newErrors.category = language === 'en' ? 'Please select a category' : 'অনুগ্রহ করে একটি বিভাগ নির্বাচন করুন';
    if (!date) newErrors.date = language === 'en' ? 'Please select a date' : 'অনুগ্রহ করে একটি তারিখ নির্বাচন করুন';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!amount || !category) return;
    
    try {
      await addExpense({
        date,
        category,
        amount: parseFloat(amount),
        description,
        paidBy: 'Admin',
        notes: ''
      });
      
      setAmount('');
      setDescription('');
      localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      alert("Error saving expense. Please check your connection.");
    }
  };

  const currentMonth = getCurrentMonthStr();
  const thisMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
  const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category for pie chart
  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value: value as number })).filter(d => d.value > 0);
  
  const COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 font-plus px-4 md:px-0">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight underline decoration-indigo-500 decoration-8 underline-offset-[-2px]">{t.expenseTracker}</h2>
          <p className="text-sm md:text-lg text-muted font-black uppercase tracking-widest mt-1 opacity-70">{t.manageExpensesDescription}</p>
        </div>
        <div className="flex items-center gap-3 text-xs md:text-sm font-black text-muted bg-card px-5 py-3 rounded-2xl border border-border shadow-xl shadow-slate-200/40 dark:shadow-none self-start md:self-center transition-transform hover:scale-105">
          <Calendar size={18} className="text-indigo-600" />
          {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' })}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        {/* Form */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-4 bg-card p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl shadow-slate-200/80 dark:shadow-none border border-border flex flex-col gap-10 relative overflow-hidden h-fit"
        >
           <div className="absolute top-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full -ml-24 -mt-24 blur-3xl" />
           
           <div className="relative z-10 p-8 bg-slate-900 dark:bg-slate-950 text-white rounded-[2rem] shadow-2xl shadow-slate-400/50 dark:shadow-none flex items-center justify-between overflow-hidden group">
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-orange-500/30 blur-2xl rounded-full -mr-16 -mb-16 group-hover:bg-orange-500/50 transition-colors duration-1000"></div>
              <div className="relative z-10">
                <p className="text-[10px] text-orange-400 font-black uppercase tracking-[0.25em] mb-2">{language === 'en' ? 'T-Expenses' : 'মোট ব্যয়'}</p>
                <div className="text-3xl md:text-4xl font-black tracking-tighter">৳{totalThisMonth}</div>
              </div>
              <div className="relative z-10 p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md transform group-hover:rotate-12 transition-transform">
                <TrendingDown size={32} className="text-orange-400" />
              </div>
           </div>

           <form onSubmit={handleAdd} className="space-y-6 relative z-10">
              <h3 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-3 mb-2">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none border border-indigo-100 dark:border-indigo-900/30">
                  <Plus size={24} />
                </div>
                {t.recordNewExpense}
              </h3>
              
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-muted uppercase tracking-[0.2em] ml-1">{t.date}</label>
                  <input 
                    required 
                    type="date" 
                    value={date} 
                    onChange={e => {
                      setDate(e.target.value);
                      if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                    }} 
                    className={cn(
                      "w-full px-6 py-4 border-2 rounded-2xl md:rounded-[1.5rem] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 bg-muted/10 border-transparent transition-all font-black text-foreground",
                      errors.date ? "border-rose-300 ring-4 ring-rose-500/5 bg-rose-50" : "focus:border-indigo-500 focus:bg-card"
                    )}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-muted uppercase tracking-[0.2em] ml-1">{t.category}</label>
                  <div className="relative">
                    <select 
                      required 
                      value={category} 
                      onChange={e => {
                        setCategory(e.target.value);
                        if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
                      }} 
                      className={cn(
                        "w-full px-6 py-4 border-2 rounded-2xl md:rounded-[1.5rem] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 bg-muted/10 border-transparent transition-all font-black text-foreground appearance-none cursor-pointer",
                        errors.category ? "border-rose-300 ring-4 ring-rose-500/5 bg-rose-50" : "focus:border-indigo-500 focus:bg-card"
                      )}
                    >
                      {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                      <ArrowDownRight size={20} className="rotate-45" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-muted uppercase tracking-[0.2em] ml-1">{t.amount}</label>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted font-black text-xl group-focus-within:text-orange-500 transition-colors">৳</div>
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
                        "w-full pl-12 pr-6 py-4 md:py-5 border-2 rounded-2xl md:rounded-[1.5rem] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 bg-muted/10 border-transparent transition-all font-black text-foreground text-2xl tracking-tighter",
                        errors.amount ? "border-rose-300 ring-4 ring-rose-500/5 bg-rose-50" : "focus:border-indigo-500 focus:bg-card focus:text-orange-600"
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-muted uppercase tracking-[0.2em] ml-1">{t.description}</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    rows={3}
                    placeholder={language === 'en' ? "Describe this payment..." : "ব্যয়টি সম্পর্কে লিখুন..."} 
                    className="w-full px-6 py-5 border-2 border-transparent bg-muted/10 rounded-2xl md:rounded-[1.5rem] focus:outline-none focus:ring-8 focus:ring-indigo-500/5 text-foreground font-black text-sm md:text-base transition-all focus:border-indigo-500 focus:bg-card resize-none placeholder:text-muted/50"
                  />
                </div>
              </div>

              <button type="submit" className="w-full mt-2 bg-slate-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-700 text-white py-5 rounded-2xl md:rounded-[1.5rem] font-black text-lg transition-all shadow-2xl shadow-slate-300 dark:shadow-none active:scale-95 group flex items-center justify-center gap-3">
                {language === 'en' ? 'Record Expense' : 'ব্যয়টি জমা দিন'}
                <ArrowDownRight size={24} className="group-hover:translate-x-1 group-hover:translate-y-1 transition-transform" />
              </button>
           </form>
        </motion.div>

        {/* Breakdown & List */}
        <div className="lg:col-span-8 space-y-8 md:space-y-12">
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="bg-card p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-border overflow-hidden relative"
           >
              <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100 dark:shadow-none">
                     <PieChartIcon size={32} />
                   </div>
                   <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{t.expenseBreakdown}</h3>
                </div>
                <div className="px-5 py-2 bg-muted/10 border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted">Total Analytics</div>
              </div>

              {pieData.length > 0 ? (
                <div className="h-[350px] md:h-[400px] w-full flex justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={pieData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={window.innerWidth < 768 ? 70 : 100} 
                        outerRadius={window.innerWidth < 768 ? 100 : 140} 
                        stroke="none"
                        paddingAngle={5} 
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-60 transition-opacity cursor-pointer" />)}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                             return (
                               <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">{payload[0].name}</p>
                                  <p className="text-xl font-black">{formatCurrency(payload[0].value as number)}</p>
                               </div>
                             );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        verticalAlign={window.innerWidth < 768 ? "bottom" : "middle"} 
                        align={window.innerWidth < 768 ? "center" : "right"} 
                        layout={window.innerWidth < 768 ? "horizontal" : "vertical"} 
                        iconType="circle" 
                        wrapperStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex flex-col items-center justify-center text-muted/20">
                  <div className="w-32 h-32 bg-muted/5 rounded-full flex items-center justify-center mb-6">
                    <TrendingDown size={48} />
                  </div>
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-center max-w-[200px] leading-relaxed">{t.noExpensesRecorded}</p>
                </div>
              )}
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="bg-card rounded-[2.5rem] md:rounded-[4rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-border overflow-hidden"
           >
             <div className="p-8 md:p-10 border-b border-border flex justify-between items-center bg-muted/5">
               <h3 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-3">
                 <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100 dark:border-rose-900/30">
                   <TrendingDown size={20} />
                 </div>
                 {t.recentExpenses}
               </h3>
               <span className="bg-slate-900 dark:bg-slate-950 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{expenses.length} Records</span>
             </div>
             
             {/* Desktop Table */}
             <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-muted/10 text-muted font-black text-[10px] uppercase tracking-[0.25em] border-b border-border">
                    <tr>
                      <th className="px-10 py-6">{t.date}</th>
                      <th className="px-10 py-6 font-mono">ID</th>
                      <th className="px-10 py-6">{t.category}</th>
                      <th className="px-10 py-6">{t.description}</th>
                      <th className="px-10 py-6 text-right">{t.amount}</th>
                      <th className="px-10 py-6 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {expenses.slice(0, 50).map((exp, idx) => (
                      <tr key={exp.id} className="hover:bg-indigo-50/10 transition-colors group">
                        <td className="px-10 py-6 font-black text-muted group-hover:text-foreground tracking-tighter">{exp.date}</td>
                        <td className="px-10 py-6">
                           <span className="font-mono text-[9px] font-black text-muted/50 bg-muted/10 px-2 py-1 rounded">#{exp.id.slice(-6)}</span>
                        </td>
                        <td className="px-10 py-6">
                           <span className="px-3 py-1.5 bg-card border border-border text-foreground font-black rounded-lg text-[10px] uppercase tracking-widest shadow-sm">{exp.category}</span>
                        </td>
                        <td className="px-10 py-6">
                           <p className="text-sm font-bold text-muted truncate max-w-[250px]">{exp.description || '—'}</p>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <span className="font-black text-rose-600 text-xl tracking-tighter">{formatCurrency(exp.amount)}</span>
                        </td>
                        <td className="px-10 py-6 text-center">
                           {confirmDeleteId === exp.id ? (
                             <div className="flex items-center justify-center gap-1 bg-rose-50 dark:bg-rose-900/30 p-1 rounded-xl animate-in flip-in-y w-fit mx-auto">
                               <button onClick={() => {
                                 deleteExpense(exp.id);
                                 setConfirmDeleteId(null);
                               }} className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors cursor-pointer">
                                 Delete
                               </button>
                               <button onClick={() => setConfirmDeleteId(null)} className="p-1 px-2 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition-colors cursor-pointer">
                                 <X size={14} />
                               </button>
                             </div>
                           ) : (
                             <button onClick={() => setConfirmDeleteId(exp.id)} className="p-3 text-muted/50 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-[1.25rem] transition-all inline-flex hover:border-rose-100 dark:hover:border-rose-900/30 border border-transparent shadow-sm cursor-pointer">
                               <Trash2 size={20} />
                             </button>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>

             {/* Mobile Card-Based List */}
             <div className="lg:hidden divide-y divide-border">
                {expenses.slice(0, 50).map(exp => (
                  <div key={exp.id} className="p-6 space-y-4 active:bg-muted/10 transition-colors">
                    <div className="flex justify-between items-start">
                       <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-muted bg-muted/10 px-2.5 py-1 rounded-lg border border-border font-mono">#{exp.id.slice(-4)}</span>
                            <span className="text-[9px] font-black text-muted tracking-tighter">{exp.date}</span>
                          </div>
                          <span className="text-[11px] font-black text-foreground bg-card border border-border px-3 py-1.5 rounded-xl inline-block w-fit uppercase tracking-widest shadow-sm">{exp.category}</span>
                       </div>
                       {confirmDeleteId === exp.id ? (
                         <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/30 p-1 rounded-xl animate-in flip-in-y">
                           <button onClick={() => {
                             deleteExpense(exp.id);
                             setConfirmDeleteId(null);
                           }} className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors cursor-pointer">
                             Confirm Delete
                           </button>
                           <button onClick={() => setConfirmDeleteId(null)} className="p-1 px-2 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition-colors cursor-pointer">
                             <X size={14} />
                           </button>
                         </div>
                       ) : (
                         <button onClick={() => setConfirmDeleteId(exp.id)} className="p-3 text-muted hover:text-rose-600 bg-card shadow-sm border border-border rounded-[1.25rem] active:scale-90 cursor-pointer transition-colors">
                           <Trash2 size={20} />
                         </button>
                       )}
                    </div>
                    {exp.description && <p className="text-sm font-bold text-muted leading-snug bg-muted/10 p-4 rounded-2xl italic border border-border">"{exp.description}"</p>}
                    <div className="flex justify-between items-center pt-2">
                       <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{language === 'en' ? 'Expensed Amount' : 'ব্যয়ের পরিমাণ'}</span>
                       <span className="font-black text-rose-600 text-2xl tracking-tighter leading-none">{formatCurrency(exp.amount)}</span>
                    </div>
                  </div>
                ))}
             </div>

             {expenses.length === 0 && (
               <div className="px-10 py-32 text-center opacity-20">
                 <div className="w-24 h-24 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingDown size={48} />
                 </div>
                 <p className="text-lg font-black uppercase tracking-[0.3em] text-foreground">{t.noRecentExpenses}</p>
               </div>
             )}
           </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {deleteId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 text-center border border-border"
            >
              <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6 scale-110 shadow-lg shadow-rose-200">
                <Trash2 size={36} />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-2 underline decoration-rose-200 decoration-8 underline-offset-[-2px]">{t.deleteExpenseTitle}</h3>
              <p className="text-muted mb-8 font-medium">
                {t.deleteExpenseConfirmation}
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteId(null)} 
                  className="flex-1 py-4 bg-muted/10 hover:bg-muted/20 text-muted font-bold rounded-2xl transition-all active:scale-95"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={() => { deleteExpense(deleteId); setDeleteId(null); }} 
                  className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-rose-200 active:scale-95"
                >
                  {t.yesDelete}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
