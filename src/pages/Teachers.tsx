import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  MoreVertical,
  Phone,
  BookOpen,
  CheckCircle2,
  XCircle,
  Activity,
  History,
  Calendar,
  Clock,
  Target,
  ArrowLeft,
  Shield,
  UserCheck,
  BadgeCheck,
  CreditCard,
  DollarSign,
  Grip,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { Teacher, TeacherClassRecord } from '../types';
import { cn } from '../lib/utils';
import { translations } from '../lib/translations';
import { getCurrentMonthStr } from '../lib/dateUtils';

export default function Teachers() {
  const { 
    teachers, 
    teacherRecords, 
    batches, 
    payments,
    salaryRecords,
    addTeacher, 
    updateTeacher, 
    deleteTeacher, 
    addTeacherRecord,
    updateTeacherRecord, 
    deleteTeacherRecord,
    finalizeSalary,
    deleteSalaryRecord,
    language 
  } = useAppContext();
  const t = translations[language];
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedTeacherForRecord, setSelectedTeacherForRecord] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [historyTeacherId, setHistoryTeacherId] = useState<string | null>(null);
  
  // Payroll State
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr()); // YYYY-MM
  const [payrollMode, setPayrollMode] = useState<'revenue-sharing' | 'fixed-rate'>('revenue-sharing');

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
  const lockedRecord = salaryRecords.find(r => r.month === selectedMonth);

  const handleFinalize = () => {
    const distributions = teachers.map(teacher => {
      const classesTaken = monthClasses.filter(r => r.teacherId === teacher.id).length;
      const teacherSalary = classesTaken * perClassValue;
      const founderShare = teacher.isFounder ? (founderPool / 2) : 0;
      
      return {
        teacherId: teacher.id,
        classesTaken,
        teacherSalary,
        founderShare,
        totalSalary: teacherSalary + founderShare
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

  const formDataRef = useRef<Omit<Teacher, 'id'>>({
    name: '',
    mobile: '',
    subject: '',
    status: 'Active',
    role: 'Teacher',
    totalBookPages: 100,
    salaryRatePerClass: 500,
    salaryRatePerPage: 0,
    isFounder: false
  });

  const [formData, setFormData] = useState<Omit<Teacher, 'id'>>(formDataRef.current);

  const filteredTeachers = teachers.filter(tea => 
    tea.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tea.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tea.mobile.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher) {
      updateTeacher(editingTeacher.id, formData);
    } else {
      addTeacher({
        ...formData,
        id: `TEA-${Date.now()}`
      });
    }
    closeModal();
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      mobile: teacher.mobile,
      subject: teacher.subject,
      status: teacher.status,
      role: teacher.role || 'Teacher',
      isFounder: teacher.isFounder || false,
      totalBookPages: teacher.totalBookPages || 100,
      salaryRatePerClass: teacher.salaryRatePerClass ?? 500,
      salaryRatePerPage: teacher.salaryRatePerPage ?? 0
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingTeacher(null);
    setFormData({
      name: '',
      mobile: '',
      subject: '',
      status: 'Active',
      role: 'Teacher',
      isFounder: false,
      totalBookPages: 100,
      salaryRatePerClass: 500,
      salaryRatePerPage: 0
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-24 font-plus text-foreground">
      <header className="px-5 md:px-0 flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-500 px-4 py-2 rounded-full text-[10px] md:text-xs font-black tracking-[0.2em] uppercase mb-4 border border-indigo-500/20 shadow-sm">
             <Users size={14} className="animate-pulse" /> {language === 'en' ? 'Faculty Hub' : 'অনুষদ কেন্দ্র'}
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tight leading-none">
             Expert <span className="text-indigo-600 italic">Faculty</span>
          </h2>
          <p className="text-muted font-bold text-xs md:text-lg mt-4 max-w-xl opacity-70">
            {language === 'en' 
              ? 'Manage educational leaders, track teaching milestones, and automate transparent revenue-based payroll.' 
              : 'শিক্ষাগত নেতাদের পরিচালনা করুন, পাঠদানের মাইলফলকগুলি ট্র্যাক করুন এবং স্বচ্ছ আয়-ভিত্তিক বেতন সহজ করুন।'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button 
            onClick={() => {
              setSelectedTeacherForRecord(null);
              setShowRecordModal(true);
            }}
            className="w-full sm:w-auto bg-card border-2 border-border hover:border-emerald-600 text-foreground px-8 py-5 md:py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 text-sm shadow-xl active:scale-95 group"
          >
            <Activity size={20} className="text-emerald-500" />
            {language === 'en' ? 'Record Session' : 'সেশন রেকর্ড'}
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto bg-foreground hover:bg-indigo-600 text-background px-8 py-5 md:py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 text-sm shadow-2xl active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            {language === 'en' ? 'Add Teacher' : 'নতুন শিক্ষক'}
          </button>
        </div>
      </header>

      <div className="px-5 md:px-0">
      </div>

      <div className="relative group px-5 md:px-0">
        <Search className="absolute left-10 md:left-8 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-500 transition-colors" size={24} />
        <input 
          type="text"
          placeholder={language === 'en' ? "Identify a faculty member..." : "অনুষদের সদস্য খুঁজুন..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-20 md:pl-20 pr-8 py-5 md:py-8 bg-card border-2 border-border rounded-[2rem] md:rounded-[4rem] shadow-2xl shadow-slate-200/50 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-black text-foreground placeholder-muted text-sm md:text-xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-5 md:px-0 text-foreground">
        {filteredTeachers.map((teacher) => {
          const records = teacherRecords.filter(r => r.teacherId === teacher.id);
          
          const completedCount = records.filter(r => !r.status || r.status === 'Completed').length;
          const absencesCount = records.filter(r => r.status === 'Absent').length;
          const cancellationsCount = records.filter(r => r.status === 'Cancelled').length;
          const latenessCount = records.filter(r => r.status === 'Late').length;
          const adjustedCount = records.filter(r => r.isTimeModifiedAtAttendance).length;

          const totalScheduled = completedCount + absencesCount + cancellationsCount + latenessCount;
          const attendanceRate = totalScheduled > 0 ? (completedCount + latenessCount) / totalScheduled : 1.0;

          const consistencyScore = Math.min(100, completedCount * 6);
          const timingPenalty = (latenessCount * 10) + (adjustedCount * 5);
          const punctualityScore = Math.max(0, 100 - timingPenalty);

          const efficiency = totalScheduled > 0 
            ? Math.round((attendanceRate * 40) + (consistencyScore * 0.4) + (punctualityScore * 0.2))
            : 100;
          
          return (
            <motion.div 
              key={teacher.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group bg-card rounded-[3rem] p-8 md:p-10 border-2 border-border hover:border-indigo-200 hover:shadow-3xl hover:shadow-indigo-100/30 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-muted/10 rounded-full -mr-24 -mt-24 group-hover:bg-indigo-500/10 transition-all duration-500"></div>
              
              <div className="relative flex justify-between items-start mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-foreground text-background rounded-[2rem] flex items-center justify-center group-hover:bg-indigo-600 transition-all shadow-2xl group-active:scale-95 shrink-0">
                    {teacher.isFounder ? <BadgeCheck size={36} className="text-amber-400" /> : <Users size={32} />}
                  </div>
                  <div className="flex flex-col gap-2">
                      {teacher.isFounder && (
                        <div className="w-fit px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border border-amber-500/20 shadow-sm animate-bounce">
                          Founder
                        </div>
                      )}
                      <span className={cn(
                        "w-fit px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm",
                        teacher.role === 'Admin' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                        teacher.role === 'Staff' ? "bg-violet-500/10 text-violet-500 border-violet-500/20" :
                        "bg-muted/10 text-muted border-border"
                      )}>
                        {teacher.role || 'Teacher'}
                      </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setSelectedTeacherForRecord(teacher);
                      setShowRecordModal(true);
                    }}
                    className="p-4 bg-card border-2 border-border text-emerald-500 hover:text-emerald-600 hover:border-emerald-500/50 rounded-2xl transition-all shadow-md active:scale-90"
                    title={language === 'en' ? 'Record Session' : 'সেশন রেকর্ড করুন'}
                  >
                    <Plus size={18} />
                  </button>
                  <button 
                    onClick={() => setHistoryTeacherId(teacher.id)}
                    className="p-4 bg-card border-2 border-border text-muted hover:text-indigo-600 hover:border-indigo-500/50 rounded-2xl transition-all shadow-md active:scale-90"
                  >
                    <History size={18} />
                  </button>
                  <button 
                    onClick={() => openEditModal(teacher)}
                    className="p-4 bg-card border-2 border-border text-muted hover:text-indigo-600 hover:border-indigo-500/50 rounded-2xl transition-all shadow-md active:scale-90"
                  >
                    <Edit3 size={18} />
                  </button>
                </div>
              </div>

              <div className="relative space-y-8">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-foreground group-hover:text-indigo-600 transition-colors tracking-tighter leading-none mb-3">{teacher.name}</h3>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                    <BookOpen size={12} className="text-indigo-400" /> {teacher.subject}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-muted text-base font-black bg-muted/10 p-4 rounded-2xl border border-border shadow-inner group-hover:bg-card transition-all">
                      <Phone size={20} className="text-indigo-500" />
                      <span className="tracking-tight">{teacher.mobile}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-card text-card-foreground rounded-3xl border-2 border-slate-50 shadow-sm text-center">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">{language === 'en' ? 'Efficiency' : 'দক্ষতা'}</span>
                        <span className="text-xl font-black text-indigo-600 tracking-tighter">
                          {efficiency}%
                        </span>
                    </div>
                    <div className="p-6 bg-card text-card-foreground rounded-3xl border-2 border-slate-50 shadow-sm text-center">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">{language === 'en' ? 'Sessions' : 'সেশন'}</span>
                        <span className="text-xl font-black text-slate-900 tracking-tighter">{records.length}</span>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-muted/10 rounded-[2rem] border border-border/50 group-hover:bg-card text-card-foreground transition-all shadow-inner">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{language === 'en' ? 'Efficiency Progress' : 'দক্ষতার অগ্রগতি'}</span>
                          <span className="text-[10px] font-black text-white bg-indigo-600 px-3 py-1 rounded-lg shadow-lg group-hover:scale-110 transition-transform">{efficiency}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex shadow-inner p-0.5 border border-border/50">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${efficiency}%` }}
                            className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(79,70,229,0.5)]" 
                          />
                      </div>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setDeleteId(teacher.id)}
                className="absolute bottom-6 right-6 p-4 bg-card text-card-foreground md:bg-rose-50 text-rose-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity border-2 border-slate-50 hover:border-rose-100 shadow-md active:scale-95"
              >
                <Trash2 size={20} />
              </button>
            </motion.div>
          );
        })}
      </div>

      {showRecordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-card text-card-foreground rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative"
          >
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black text-foreground">
                 {language === 'en' ? 'Record Class Session' : 'ক্লাস সেশন রেকর্ড করুন'}
               </h3>
               <button onClick={() => setShowRecordModal(false)} className="p-3 bg-muted/10 rounded-2xl text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-all border border-border/50">
                 <XCircle size={20} />
               </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              
              const record: TeacherClassRecord = {
                id: `TCR-${Date.now()}`,
                teacherId: formData.get('teacherId') as string,
                batchId: formData.get('batchId') as string,
                date: formData.get('date') as string,
                startTime: formData.get('startTime') as string,
                endTime: formData.get('endTime') as string,
                topic: formData.get('topic') as string,
                pagesTaught: parseInt(formData.get('pagesTaught') as string) || 0,
                subject: teachers.find(t => t.id === formData.get('teacherId'))?.subject || '',
                status: 'Completed'
              };

              addTeacherRecord(record);
              setShowRecordModal(false);
            }} className="space-y-6">
               <div className="space-y-1">
                 <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">{language === 'en' ? 'Select Teacher' : 'শিক্ষক নির্বাচন'}</label>
                 <select 
                   required
                   name="teacherId"
                   defaultValue={selectedTeacherForRecord?.id || ''}
                   className="w-full px-6 py-4 bg-muted/10 border-2 border-border/50 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                 >
                   <option value="" disabled>{language === 'en' ? 'Choose Teacher' : 'শিক্ষক বেছে নিন'}</option>
                   {teachers.map(tea => (
                     <option key={tea.id} value={tea.id}>{tea.name} ({tea.subject})</option>
                   ))}
                 </select>
               </div>

               <div className="space-y-1">
                 <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">{language === 'en' ? 'Select Batch' : 'ব্যাচ নির্বাচন'}</label>
                 <select 
                   required
                   name="batchId"
                   className="w-full px-6 py-4 bg-muted/10 border-2 border-border/50 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                 >
                   <option value="" disabled>{language === 'en' ? 'Choose Batch' : 'ব্যাচ বেছে নিন'}</option>
                   {batches.map(batch => (
                     <option key={batch.id} value={batch.id}>{batch.name}</option>
                   ))}
                 </select>
               </div>
               
               <div className="space-y-1">
                 <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">{language === 'en' ? 'Date' : 'তারিখ'}</label>
                 <input 
                   required
                   type="date"
                   name="date"
                   defaultValue={new Date().toISOString().split('T')[0]}
                   className="w-full px-6 py-4 bg-muted/10 border-2 border-border/50 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">{language === 'en' ? 'Start Time' : 'শুরুর সময়'}</label>
                   <input 
                     required
                     type="time"
                     name="startTime"
                     className="w-full px-6 py-4 bg-muted/10 border-2 border-border/50 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">{language === 'en' ? 'End Time' : 'শেষের সময়'}</label>
                   <input 
                     required
                     type="time"
                     name="endTime"
                     className="w-full px-6 py-4 bg-muted/10 border-2 border-border/50 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                   />
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">{language === 'en' ? 'Topic Covered' : 'পঠিত বিষয়'}</label>
                 <input 
                   required
                   name="topic"
                   placeholder={language === 'en' ? 'What was taught?' : 'আজ কি পড়ানো হয়েছে?'}
                   className="w-full px-6 py-4 bg-muted/10 border-2 border-border/50 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                 />
               </div>



               <button className="w-full py-5 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-100 active:scale-95 mt-4">
                 {language === 'en' ? 'Save Session' : 'সেশন সংরক্ষণ করুন'}
               </button>
            </form>
          </motion.div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-card text-card-foreground rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative"
          >
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black text-foreground">
                 {editingTeacher ? (language === 'en' ? 'Edit Teacher' : 'শিক্ষক তথ্য পরিবর্তন') : (language === 'en' ? 'Add New Teacher' : 'নতুন শিক্ষক যুক্ত করুন')}
               </h3>
               <button onClick={closeModal} className="p-3 bg-muted/10 rounded-2xl text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-all border border-border/50">
                 <XCircle size={20} />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-1">
                 <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">{language === 'en' ? 'Full Name' : 'পূর্ণ নাম'}</label>
                 <input 
                   required
                   value={formData.name}
                   onChange={e => setFormData({ ...formData, name: e.target.value })}
                   className="w-full px-6 py-4 bg-muted/10 border-2 border-border/50 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">{language === 'en' ? 'Mobile' : 'মোবাইল'}</label>
                   <input 
                     required
                     value={formData.mobile}
                     onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                     className="w-full px-6 py-4 bg-muted/10 border-2 border-border/50 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">{language === 'en' ? 'Role' : 'ভূমিকা'}</label>
                   <select 
                     value={formData.role}
                     onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                     className="w-full px-6 py-4 bg-muted/10 border-2 border-border/50 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                   >
                     <option value="Teacher">{language === 'en' ? 'Teacher' : 'শিক্ষক'}</option>
                     <option value="Guest Teacher">{language === 'en' ? 'Guest Teacher' : 'গেস্ট টিচার'}</option>
                   </select>
                 </div>
               </div>

               <div className="space-y-3 p-6 bg-muted/10 rounded-3xl border border-border/50">
                  <label className="flex items-center gap-3 cursor-pointer group">
                     <div className="relative">
                        <input 
                          type="checkbox"
                          className="sr-only"
                          checked={formData.isFounder}
                          onChange={(e) => setFormData({...formData, isFounder: e.target.checked})}
                        />
                        <div className={cn(
                          "w-12 h-6 rounded-full transition-colors",
                          formData.isFounder ? "bg-indigo-600" : "bg-slate-300"
                        )}></div>
                        <div className={cn(
                          "absolute top-1 left-1 w-4 h-4 bg-card text-card-foreground rounded-full transition-transform",
                          formData.isFounder ? "translate-x-6" : "translate-x-0"
                        )}></div>
                     </div>
                     <div>
                        <span className="text-sm font-bold text-foreground block transition-colors group-hover:text-indigo-600">Mark as Founder</span>
                        <span className="text-[10px] font-medium text-muted-foreground">Founders get a fixed 10% share of total revenue</span>
                     </div>
                  </label>
               </div>

               <div className="space-y-1">
                 <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">{language === 'en' ? 'Status' : 'অবস্থা'}</label>
                 <select 
                   value={formData.status}
                   onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                   className="w-full px-6 py-4 bg-muted/10 border-2 border-border/50 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                 >
                   <option value="Active">{language === 'en' ? 'Active' : 'সক্রিয়'}</option>
                   <option value="Inactive">{language === 'en' ? 'Inactive' : 'নিষ্ক্রিয়'}</option>
                 </select>
               </div>

               <button className="w-full py-5 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-100 active:scale-95 mt-4">
                 {editingTeacher ? (language === 'en' ? 'Save Changes' : 'পরিবর্তন সংরক্ষণ') : (language === 'en' ? 'Create Teacher' : 'শিক্ষক যুক্ত করুন')}
               </button>
            </form>
          </motion.div>
        </div>
      )}

      {historyTeacherId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card text-card-foreground rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                    <History size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground">
                      {teachers.find(tea => tea.id === historyTeacherId)?.name}'s {language === 'en' ? 'Class History' : 'ক্লাস ইতিহাস'}
                    </h3>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                       {teacherRecords.filter(r => r.teacherId === historyTeacherId).length} {language === 'en' ? 'Total Sessions' : 'মোট সেশন'}
                    </p>
                  </div>
               </div>
               <button 
                 onClick={() => setHistoryTeacherId(null)}
                 className="p-3 bg-card text-card-foreground border border-border/50 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all shadow-sm"
               >
                 <XCircle size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
               <div className="space-y-4">
                  {teacherRecords
                    .filter(r => r.teacherId === historyTeacherId)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(record => {
                       const batch = batches.find(b => b.id === record.batchId);
                       return (
                         <div key={record.id} className="bg-muted/10 p-6 rounded-3xl border border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-card text-card-foreground hover:shadow-xl hover:shadow-slate-200/40 transition-all group">
                            <div className="flex items-center gap-6">
                               <div className="w-14 h-14 bg-card text-card-foreground rounded-2xl flex flex-col items-center justify-center shadow-sm border border-border/50 text-muted-foreground group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                                  <Calendar size={18} />
                                  <span className="text-[8px] font-black mt-1 uppercase">{record.date.split('-')[2]} {record.date.split('-')[1]}</span>
                               </div>
                               <div>
                                  <div className="flex items-center gap-2">
                                     <span className="text-sm font-black text-foreground">{record.date}</span>
                                     <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">{batch?.name || 'Academic'}</span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                                     <span className="flex items-center gap-1 text-[10px] font-bold">
                                        <Clock size={12} /> {record.startTime} - {record.endTime}
                                     </span>
                                     <span className={cn(
                                        "flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border",
                                        record.status === 'Absent' ? "text-rose-600 bg-rose-50 border-rose-100" :
                                        record.status === 'Cancelled' ? "text-slate-600 bg-slate-50 border-slate-100" :
                                        record.status === 'Late' ? "text-amber-600 bg-amber-50 border-amber-100" :
                                        "text-emerald-600 bg-emerald-50 border-emerald-100"
                                     )}>
                                        {record.status || 'Completed'}
                                     </span>
                                  </div>
                               </div>
                            </div>

                            <div className="flex-1 md:px-10">
                               <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Topic Covered</div>
                               <p className="text-sm font-bold text-slate-600">{record.topic}</p>
                            </div>
                         </div>
                       );
                    })}

                  {teacherRecords.filter(r => r.teacherId === historyTeacherId).length === 0 && (
                    <div className="py-20 text-center">
                       <div className="w-20 h-20 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                          <History size={40} />
                       </div>
                       <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">No Class History Found</p>
                    </div>
                  )}
               </div>
            </div>
          </motion.div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card text-card-foreground rounded-[2.5rem] w-full max-w-sm p-8 text-center"
          >
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Trash2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2">{language === 'en' ? 'Are you sure?' : 'আপনি কি নিশ্চিত?'}</h3>
            <p className="text-muted font-bold mb-8 leading-relaxed">
              {language === 'en' ? 'Teacher and all their class records will be deleted forever.' : 'শিক্ষক এবং তাদের সমস্ত ক্লাস রেকর্ড চিরতরে মুছে ফেলা হবে।'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-4 bg-muted/10 hover:bg-muted/20 text-muted font-bold rounded-2xl transition-all">{t.cancel}</button>
              <button 
                onClick={() => { deleteTeacher(deleteId); setDeleteId(null); }} 
                className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-xl shadow-rose-200 transition-all active:scale-95"
              >
                {t.yesDelete}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
