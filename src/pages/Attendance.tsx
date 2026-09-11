import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { Attendance as AttendanceType, TeacherClassRecord } from '../types';
import { cn } from '../lib/utils';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  Users, 
  Search, 
  User, 
  GraduationCap, 
  Plus, 
  Trash2, 
  Target, 
  BookOpen,
  History,
  Shield,
  ChevronDown,
  UserPlus,
  FileWarning,
  Sparkles,
  Filter,
  Check,
  Award,
  BookMarked
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../lib/translations';

interface SmartBatchConfig {
  batchId: string;
  daysPerWeek: number;
  classesPerDay: number;
  rotationMode: 'smart' | 'manual';
  subjectMap: { id: string; subject: string; teacherId: string; startTime?: string; endTime?: string }[];
}

export function Attendance() {
  const { 
    students = [], 
    attendance = [], 
    batches = [], 
    bulkMarkAttendance, 
    teachers = [], 
    teacherRecords = [], 
    addTeacherRecord, 
    updateTeacherRecord, 
    deleteTeacherRecord, 
    language = 'en'
  } = useAppContext();

  const t = translations[language];

  // --- Core View State ---
  const [view, setView] = useState<'student' | 'teacher'>('student');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [rosterDate, setRosterDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // --- Teacher Logs Sub-view State ---
  const [teacherSubView, setTeacherSubView] = useState<'roster' | 'daily' | 'history' | 'overview'>('roster');
  const [historySearch, setHistorySearch] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [selectedRosterBatchId, setSelectedRosterBatchId] = useState<string>('');

  // --- State for Smart configuration / Batches schedule ---
  const [configs, setConfigs] = useState<SmartBatchConfig[]>(() => {
    try {
      const saved = localStorage.getItem('smart_batch_configs');
      return saved ? JSON.parse(saved) : [];
    } catch(e) { return []; }
  });

  // Persist smart config in localStorage
  useEffect(() => {
    localStorage.setItem('smart_batch_configs', JSON.stringify(configs));
  }, [configs]);

  // Handle toast timers
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Set default selected batch - initialized as 'all' by default

  // Set default selected batch for the teacher roster
  useEffect(() => {
    const active = (batches || []).filter(b => b.status === 'Active' || b.status === 'active');
    const curBatch = (batches || []).find(b => b.id === selectedRosterBatchId);
    
    if (!selectedRosterBatchId || !curBatch || (curBatch.status !== 'Active' && curBatch.status !== 'active')) {
      if (active.length > 0) {
        setSelectedRosterBatchId(active[0].id);
      } else if ((batches || []).length > 0) {
        setSelectedRosterBatchId(batches[0].id);
      }
    }
  }, [batches, selectedRosterBatchId]);

  // Auto initialize configs if a selected roster batch has none - stabilized to prevent infinite loops
  useEffect(() => {
    if (selectedRosterBatchId) {
      setConfigs(prev => {
        if (prev.find(c => c.batchId === selectedRosterBatchId)) {
          return prev;
        }
        return [...prev, {
          batchId: selectedRosterBatchId,
          daysPerWeek: 5,
          classesPerDay: 4,
          rotationMode: 'smart',
          subjectMap: [
            { id: '1', subject: 'Mathematics', teacherId: (teachers || [])[0]?.id || '' },
            { id: '2', subject: 'English', teacherId: (teachers || [])[1]?.id || (teachers || [])[0]?.id || '' },
            { id: '3', subject: 'Physics', teacherId: (teachers || []).length > 2 ? (teachers || [])[2].id : (teachers || [])[0]?.id || '' }
          ]
        }];
      });
    }
  }, [selectedRosterBatchId, teachers]);

  const currentConfig = configs.find(c => c.batchId === selectedRosterBatchId) || {
    batchId: selectedRosterBatchId,
    daysPerWeek: 5,
    classesPerDay: 4,
    rotationMode: 'smart' as const,
    subjectMap: [
      { id: '1', subject: 'Mathematics', teacherId: (teachers || [])[0]?.id || '' },
      { id: '2', subject: 'English', teacherId: (teachers || [])[1]?.id || (teachers || [])[0]?.id || '' },
      { id: '3', subject: 'Physics', teacherId: (teachers || []).length > 2 ? (teachers || [])[2].id : (teachers || [])[0]?.id || '' },
      { id: '4', subject: 'ICT / Computer Science', teacherId: (teachers || [])[0]?.id || '' }
    ]
  };
  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = (teacherRecords || []).filter(r => r.batchId === selectedRosterBatchId && r.date === rosterDate);

  // Generate today's default classes from batch rotation template
  const generateTodayClasses = () => {
    const config = currentConfig || {
      batchId: selectedRosterBatchId,
      daysPerWeek: 5,
      classesPerDay: 4,
      rotationMode: 'smart',
      subjectMap: []
    };
    
    let generated = [];
    const classesCount = config.classesPerDay || 4;
    const subMap = (config.subjectMap && config.subjectMap.length > 0) ? config.subjectMap : [
      { id: '1', subject: 'Mathematics', teacherId: (teachers || [])[0]?.id || '' },
      { id: '2', subject: 'English', teacherId: (teachers || [])[1]?.id || (teachers || [])[0]?.id || '' },
      { id: '3', subject: 'Physics', teacherId: (teachers || []).length > 2 ? (teachers || [])[2].id : (teachers || [])[0]?.id || '' },
      { id: '4', subject: 'ICT / Computer Science', teacherId: (teachers || [])[0]?.id || '' }
    ];
    
    const getRosterDayOfWeek = (dateStr: string) => {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.getDay();
      }
      return new Date().getDay();
    };

    for (let i = 0; i < classesCount; i++) {
        const mapIdx = config.rotationMode === 'smart' 
                       ? (getRosterDayOfWeek(rosterDate) + i) % (subMap.length || 1)
                       : i % (subMap.length || 1);
        
        const subjMap = subMap[mapIdx];
        if (subjMap) {
            generated.push({
               index: i + 1,
               subject: subjMap.subject || 'Subject',
               defaultTeacherId: subjMap.teacherId || (teachers || [])[0]?.id || '',
               topic: `${subjMap.subject || 'Subject'} Session ${i+1}`,
               startTime: subjMap.startTime || (i === 0 ? '16:00' : i === 1 ? '17:00' : i === 2 ? '18:00' : '19:00'),
               endTime: subjMap.endTime || (i === 0 ? '17:00' : i === 1 ? '18:00' : i === 2 ? '19:00' : '20:00')
            });
        }
    }
    return generated;
  };

  const dailyClasses = generateTodayClasses();

  // Teacher Performance Analytics on Selected Roster Batch
  const calculatePerformance = () => {
     if (!currentConfig) return { planned: 0, completed: 0, percentage: 0 };
     const planned = (currentConfig.classesPerDay || 4) * 20; 
     const past30Days = new Date(); past30Days.setDate(past30Days.getDate() - 30);
     const completed = (teacherRecords || []).filter(r => r.batchId === selectedRosterBatchId && (r.status === 'Completed' || r.status === 'Late') && new Date(r.date) >= past30Days).length;
     return { planned, completed, percentage: planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 0 };
  };

  const performance = calculatePerformance();

  // Create custom non-roster classes log
  const [classForm, setClassForm] = useState<Omit<TeacherClassRecord, 'id'>>({
    teacherId: '',
    batchId: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '10:00',
    topic: '',
    pagesTaught: 0,
    status: 'Completed'
  });

  // Pre-fill class form defaults on modal open
  useEffect(() => {
    if (showAddClassModal) {
      setClassForm({
        teacherId: (teachers || [])[0]?.id || '',
        batchId: (batches || [])[0]?.id || '',
        date: new Date().toISOString().slice(0, 10),
        startTime: '09:00',
        endTime: '10:00',
        topic: '',
        pagesTaught: 0,
        status: 'Completed'
      });
    }
  }, [showAddClassModal, teachers, batches]);

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.teacherId || !classForm.batchId) {
      setNotification({
        message: language === 'en' ? "Please select teacher and batch." : "দয়া করে শিক্ষক এবং ব্যাচ নির্বাচন করুন।",
        type: 'error'
      });
      return;
    }
    addTeacherRecord({
      ...classForm,
      id: `TCR-${Date.now()}`
    });
    setShowAddClassModal(false);
    setNotification({
      message: language === 'en' ? "Successfully logged classroom record!" : "শ্রেণি কার্যবিবরণী সফলভাবে রেকর্ড করা হয়েছে!",
      type: 'success'
    });
  };

  // --- Students Filter & Attendance Metrics ---
  const activeBatchNames = (batches || [])
    .filter(b => b.status === 'Active')
    .map(b => b.name);

  const activeStudentsForBatchSelection = students.filter(s => 
    s.status === 'Active' && 
    activeBatchNames.includes(s.batch)
  );
  
  // Enrolled student counts parsed by batch map
  const studentsCountByBatch = activeStudentsForBatchSelection.reduce((acc, curr) => {
    acc[curr.batch] = (acc[curr.batch] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter students matching criteria
  const filteredStudents = activeStudentsForBatchSelection.filter(s => 
    (selectedBatch === 'all' || s.batch === selectedBatch) &&
    (searchQuery === '' || 
     s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (s.mobile && s.mobile.includes(searchQuery)))
  );

  // Student Daily Records calculations
  const currentAttendance = attendance.filter(a => a.date === selectedDate);
  const getStudentStatus = (studentId: string) => {
    const record = currentAttendance.find(a => a.studentId === studentId);
    return record ? record.status : null;
  };

  const handleMarkStudent = async (studentId: string, status: AttendanceType['status']) => {
    try {
      await bulkMarkAttendance(selectedDate, [{ studentId, status }]);
      setNotification({
        message: language === 'en' 
          ? `Marked Student as ${status}` 
          : `শিক্ষার্থীকে সফলভাবে ${status === 'Present' ? 'উপস্থিত' : status === 'Absent' ? 'অনুপস্থিত' : 'দেরী'} হিসেবে চিহ্নিত করা হয়েছে।`,
        type: 'success'
      });
    } catch (error) {
      setNotification({
        message: language === 'en' ? "Failed to save attendance." : "হাজিরা সংরক্ষণ সম্ভব হয়নি।",
        type: 'error'
      });
    }
  };

  const handleMarkAll = async (status: AttendanceType['status']) => {
    if (filteredStudents.length === 0) return;
    const records = filteredStudents.map(s => ({ studentId: s.id, status }));
    try {
      await bulkMarkAttendance(selectedDate, records);
      setNotification({
        message: language === 'en' 
          ? `Marked all ${filteredStudents.length} students as ${status}` 
          : `নির্বাচিত ${filteredStudents.length} জন শিক্ষার্থীকে একবারে ${status === 'Present' ? 'উপস্থিত' : 'অনুপস্থিত'} করা হয়েছে।`,
        type: 'success'
      });
    } catch (error) {
      setNotification({
        message: language === 'en' ? "Multiple attendance log error." : "একত্রে হাজিরা লগ করার সময় ত্রুটি ঘটেছে।",
        type: 'error'
      });
    }
  };

  // Metrics summary calculations for filtered pool
  const stats = filteredStudents.reduce((acc, curr) => {
    const status = getStudentStatus(curr.id);
    if (status === 'Present') acc.present += 1;
    else if (status === 'Absent') acc.absent += 1;
    else if (status === 'Late') acc.late += 1;
    else acc.unmarked += 1;
    return acc;
  }, { present: 0, absent: 0, late: 0, unmarked: 0 });

  const totalFilteredCount = filteredStudents.length;
  const totalMarkedCount = stats.present + stats.absent + stats.late;
  const completionPercent = totalFilteredCount > 0 ? Math.round((totalMarkedCount / totalFilteredCount) * 100) : 0;

  // Render initials or clean profile badges for students
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div id="attendance-erp-container" className="space-y-6 pb-20 select-none text-slate-800 dark:text-slate-100">
      
      {/* Toast notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className={cn(
              "fixed top-4 right-4 z-50 p-4 rounded-2xl border flex items-center gap-3 shadow-2xl max-w-sm transition-all",
              notification.type === 'success' 
                ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                : notification.type === 'error'
                ? "bg-rose-50 dark:bg-rose-950 border-rose-500/20 text-rose-700 dark:text-rose-400"
                : "bg-indigo-50 dark:bg-indigo-950 border-indigo-500/20 text-indigo-700 dark:text-indigo-400"
            )}
          >
            <div className="p-1 rounded-full bg-white dark:bg-slate-950 shadow-inner">
              {notification.type === 'success' ? (
                <CheckCircle className="text-emerald-500" size={18} />
              ) : notification.type === 'error' ? (
                <XCircle className="text-rose-500" size={18} />
              ) : (
                <Clock className="text-indigo-500" size={18} />
              )}
            </div>
            <p className="text-xs sm:text-sm font-bold tracking-tight">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Top Header with Real Glow Design & Dual Portal Navigation --- */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-[2.5rem] border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-[0.25em]">
              <Sparkles size={14} className="animate-pulse" />
              <span>{language === 'en' ? 'Core ERP Module' : 'কোর ইআরপি মডিউল'}</span>
            </div>
            <h1 className="text-2xl md:text-3.5xl font-black tracking-tight mt-1.5 bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              {language === 'en' ? 'Attendance & Logs Suite' : 'হাজিরা এবং ক্লাস পর্যবেক্ষণ প্যানেল'}
            </h1>
            <p className="text-[11px] md:text-sm text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              {language === 'en' ? 'Manage everyday presence with smart automation' : 'স্মার্ট অটোমেশন দ্বারা দৈনন্দিন ক্লাসরুম ও শিক্ষক লগ নিয়ন্ত্রণ করুন'}
            </p>
          </div>

          <div className="flex items-center bg-white/5 border border-white/10 p-1.5 rounded-2xl w-full md:w-auto self-stretch md:self-auto shadow-inner">
            <button
              onClick={() => setView('student')}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                view === 'student' 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Users size={16} />
              <span>{language === 'en' ? 'Students' : 'শিক্ষার্থী'}</span>
            </button>
            <button
              onClick={() => setView('teacher')}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                view === 'teacher' 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <GraduationCap size={16} />
              <span>{language === 'en' ? 'Teachers' : 'শিক্ষক'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🟢 STUDENTS PORTAL PAGE VIEW                              */}
      {/* ========================================================= */}
      <AnimatePresence mode="wait">
        {view === 'student' ? (
          <motion.div
            key="student-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Real Controls, Filter Options, Carousel Pill list */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] shadow-sm flex flex-col gap-6">
              
              {/* Horizontal sliding batch pill container */}
              <div>
                <label className="flex items-center gap-1.5 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  <Filter size={12} className="text-indigo-500" />
                  <span>{language === 'en' ? 'Select Active Batch' : 'সক্রিয় ব্যাচ নির্বাচন করুন'}</span>
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <button 
                    onClick={() => setSelectedBatch('all')}
                    className={cn(
                      "px-5 py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all border shrink-0 flex items-center gap-2",
                      selectedBatch === 'all' 
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 dark:shadow-none" 
                        : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span>🎯 {language === 'en' ? 'All Batches' : 'সকল ব্যাচ'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-black/10 text-inherit text-[9px] font-bold">
                      {activeStudentsForBatchSelection.length}
                    </span>
                  </button>

                  {batches.filter(b => b.status === 'Active' || b.status === 'active').map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBatch(b.name)}
                      className={cn(
                        "px-5 py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all border shrink-0 flex items-center gap-2",
                        selectedBatch === b.name
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 dark:shadow-none"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <BookMarked size={12} />
                      <span>{b.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-black/10 text-inherit text-[9px] font-bold">
                        {studentsCountByBatch[b.name] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Datepicker and keyword search box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Calendar size={18} className="text-slate-400 shrink-0 mr-3" />
                  <div className="flex-1">
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      {language === 'en' ? 'Attendance Date' : 'হাজিরার তারিখ'}
                    </label>
                    <input 
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="w-full bg-transparent border-none text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-0 outline-none p-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Search size={18} className="text-slate-400 shrink-0 mr-3" />
                  <div className="flex-1">
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      {language === 'en' ? 'Quick Search Student' : 'শিক্ষার্থী খুঁজুন'}
                    </label>
                    <input 
                      type="text"
                      placeholder={language === 'en' ? 'Search by name, student ID, mobile...' : 'নাম, রোল আইডি, অথবা মোবাইল দিয়ে খুঁজুন...'}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-none text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-0 outline-none p-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- Completion Stats tracker Row --- */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[2rem] shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'en' ? 'Present' : 'উপস্থিত'}</div>
                  <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{stats.present}</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[2rem] shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                  <XCircle size={24} />
                </div>
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'en' ? 'Absent' : 'অনুপস্থিত'}</div>
                  <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{stats.absent}</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[2rem] shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'en' ? 'Late' : 'দেরী'}</div>
                  <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{stats.late}</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[2rem] shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-500/10 text-slate-500 rounded-2xl flex items-center justify-center shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'en' ? 'Unmarked' : 'অবশিষ্ট'}</div>
                  <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{stats.unmarked}</div>
                </div>
              </div>

              <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-5 rounded-[2rem] shadow-md flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest">{language === 'en' ? 'Progress' : 'অগ্রগতি'}</span>
                  <span className="text-sm font-black italic">{completionPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-700" style={{ width: `${completionPercent}%` }}></div>
                </div>
                <span className="text-[9px] uppercase tracking-wider font-bold mt-1 text-indigo-100 flex items-center gap-1">
                  <span>{totalMarkedCount} {language === 'en' ? 'of' : 'জন /'} {totalFilteredCount} {language === 'en' ? 'logged' : 'হাজিরা সম্পন্ন'}</span>
                </span>
              </div>
            </div>

            {/* Bulk Trigger Command Controls & Total count header */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <span>{language === 'en' ? 'Filtered Student Roster' : 'শ্রেণি ছাত্র তালিকা প্যানেল'}</span>
                <span className="px-2.5 py-1 text-[10px] rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
                  {totalFilteredCount} {language === 'en' ? 'Students' : 'শিক্ষার্থী'}
                </span>
              </h3>

              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleMarkAll('Present')}
                  className="px-5 py-2.5 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white transition-all"
                >
                  ✓ {language === 'en' ? 'All Present' : 'সবাই উপস্থিত'}
                </button>
                <button
                  onClick={() => handleMarkAll('Absent')}
                  className="px-5 py-2.5 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl text-rose-600 bg-rose-500/5 hover:bg-rose-500 hover:text-white transition-all"
                >
                  ✕ {language === 'en' ? 'All Absent' : 'সবাই অনুপস্থিত'}
                </button>
              </div>
            </div>

            {/* --- Beautiful Student Cards Grid --- */}
            {filteredStudents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStudents.map((student) => {
                  const status = getStudentStatus(student.id);
                  const isPresent = status === 'Present';
                  const isAbsent = status === 'Absent';
                  const isLate = status === 'Late';

                  return (
                    <motion.div
                      layout
                      key={student.id}
                      className={cn(
                        "rounded-[2rem] border p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group min-h-[15rem]",
                        isPresent 
                          ? "bg-emerald-50 dark:bg-slate-900 border-emerald-500/35 shadow-lg shadow-emerald-500/5 hover:shadow-xl"
                          : isAbsent
                          ? "bg-rose-50 dark:bg-slate-900 border-rose-500/35 shadow-lg shadow-rose-500/5 hover:shadow-xl"
                          : isLate
                          ? "bg-amber-50 dark:bg-slate-900 border-amber-500/35 shadow-lg shadow-amber-500/5 hover:shadow-xl"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500/35 hover:shadow-md"
                      )}
                    >
                      {/* Top profile view & metadata */}
                      <div className="flex gap-4 items-start relative z-10">
                        {/* Elegant Initial Circle */}
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-black tracking-tighter text-sm shadow-inner shrink-0 transition-colors",
                          isPresent
                            ? "bg-emerald-500 text-white"
                            : isAbsent
                            ? "bg-rose-500 text-white"
                            : isLate
                            ? "bg-amber-500 text-white"
                            : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                        )}>
                          {getInitials(student.name)}
                        </div>

                        <div className="space-y-0.5 leading-tight flex-1">
                          <h4 className="font-black text-slate-900 dark:text-white tracking-tight text-sm line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {student.name}
                          </h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                            ID: {student.id}
                          </p>
                          <p className="text-[10px] font-extrabold text-slate-500">
                            📞 {student.mobile || t.unmarked}
                          </p>
                        </div>
                      </div>

                      {/* Display Status indicators */}
                      <div className="my-4 relative z-10">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full",
                          isPresent
                            ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20"
                            : isAbsent
                            ? "bg-rose-500/10 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-500/20"
                            : isLate
                            ? "bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-500/20"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        )}>
                          {isPresent ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>{t.present}</span>
                            </>
                          ) : isAbsent ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span>{t.absent}</span>
                            </>
                          ) : isLate ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              <span>{t.late}</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                              <span>{t.unmarked}</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* 3 Large Circular/Button touch actions */}
                      <div className="grid grid-cols-3 gap-2 relative z-10 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => handleMarkStudent(student.id, 'Present')}
                          className={cn(
                            "py-2.5 rounded-xl text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1 transition-all border",
                            isPresent 
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-95" 
                              : "bg-slate-100 dark:bg-slate-800 text-emerald-600 border-transparent hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-500/20"
                          )}
                          title={t.present}
                        >
                          <CheckCircle size={14} />
                          <span>{t.present}</span>
                        </button>

                        <button
                          onClick={() => handleMarkStudent(student.id, 'Absent')}
                          className={cn(
                            "py-2.5 rounded-xl text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1 transition-all border",
                            isAbsent 
                              ? "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-500/20 scale-95" 
                              : "bg-slate-100 dark:bg-slate-800 text-rose-600 border-transparent hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-500/20"
                          )}
                          title={t.absent}
                        >
                          <XCircle size={14} />
                          <span>{t.absent}</span>
                        </button>

                        <button
                          onClick={() => handleMarkStudent(student.id, 'Late')}
                          className={cn(
                            "py-2.5 rounded-xl text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1 transition-all border",
                            isLate 
                              ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20 scale-95" 
                              : "bg-slate-100 dark:bg-slate-800 text-amber-600 border-transparent hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-500/20"
                          )}
                          title={t.late}
                        >
                          <Clock size={14} />
                          <span>{t.late}</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/50 border-2 border-dashed border-border rounded-[2.5rem] py-20 text-center dark:bg-slate-900/30">
                <FileWarning size={48} className="text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-sm">
                  {language === 'en' ? 'No students match search criteria.' : 'খুজে পাওয়া তথ্যানুসারে কোনো শিক্ষার্থী পাওয়া যায়নি।'}
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="teacher-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Horizontal Sub-view Switcher for Teacher */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-[2.5rem] shadow-sm flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
              
              <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-200/60 dark:bg-slate-950/60 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800 gap-1.5">
                <button
                  onClick={() => { setTeacherSubView('roster'); setSelectedTeacherId(null); }}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all",
                    teacherSubView === 'roster' 
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-200/10 dark:border-slate-700/60" 
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  )}
                >
                  <Calendar size={14} />
                  <span>{language === 'en' ? "Today's Roster" : 'আজকের রুটিন'}</span>
                </button>

                <button
                  onClick={() => { setTeacherSubView('daily'); setSelectedTeacherId(null); }}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all",
                    teacherSubView === 'daily' 
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-200/10 dark:border-slate-700/60" 
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  )}
                >
                  <BookOpen size={14} />
                  <span>{language === 'en' ? 'Daily Logs' : 'প্রতিদিনের লগ'}</span>
                </button>

                <button
                  onClick={() => { setTeacherSubView('history'); setSelectedTeacherId(null); }}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all",
                    teacherSubView === 'history' 
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-200/10 dark:border-slate-700/60" 
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  )}
                >
                  <History size={14} />
                  <span>{language === 'en' ? 'Class History' : 'শ্রেণি ইতিহাস'}</span>
                </button>

                <button
                  onClick={() => { setTeacherSubView('overview'); setSelectedTeacherId(null); }}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all",
                    teacherSubView === 'overview' 
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-200/10 dark:border-slate-700/60" 
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  )}
                >
                  <Target size={14} />
                  <span>{language === 'en' ? 'Teacher Metrics' : 'শিক্ষক প্রোফাইল'}</span>
                </button>
              </div>

              {/* Dynamic Action Buttons inside Teacher Panel */}
              <div className="flex flex-col sm:flex-row gap-2 relative">
                {teacherSubView === 'roster' && (
                  <div className="flex items-center bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <Calendar size={16} className="text-slate-400 mr-2" />
                    <input 
                      type="date"
                      value={rosterDate}
                      onChange={e => setRosterDate(e.target.value)}
                      className="bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-100 outline-none outline-0 cursor-pointer"
                    />
                  </div>
                )}

                {teacherSubView === 'daily' && (
                  <div className="flex items-center bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <Calendar size={16} className="text-slate-400 mr-2" />
                    <input 
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-100 outline-none outline-0 cursor-pointer"
                    />
                  </div>
                )}

                {teacherSubView === 'history' && (
                  <div className="flex items-center bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-64">
                    <Search size={16} className="text-slate-400 mr-2" />
                    <input 
                      type="text"
                      placeholder={language === 'en' ? 'Search topic/teacher...' : 'শিক্ষক বা বিষয়াংশ খুঁজুন...'}
                      value={historySearch}
                      onChange={e => setHistorySearch(e.target.value)}
                      className="w-full bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-100 outline-none outline-0"
                    />
                  </div>
                )}

                <button
                  onClick={() => setShowAddClassModal(true)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95 transition-all text-center whitespace-nowrap"
                >
                  <Plus size={16} />
                  <span>{language === 'en' ? 'Record Extra Class' : 'অতিরিক্ত ক্লাস লগ'}</span>
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* SUBVIEW 1: Today's scheduled class Roster */}
              {teacherSubView === 'roster' && (
                <motion.div
                  key="roster-view"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  {/* Select active batch sub-carousel on roster */}
                  <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-center gap-3 overflow-x-auto scrollbar-none">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap px-3">
                      {language === 'en' ? 'Filter Batch:' : 'ব্যাচ ফিল্টার:'}
                    </span>
                    <div className="flex gap-2">
                      {batches.filter(b => b.status === 'Active' || b.status === 'active').map(b => (
                        <button
                          key={b.id}
                          onClick={() => setSelectedRosterBatchId(b.id)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border whitespace-nowrap",
                            selectedRosterBatchId === b.id
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                          )}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {currentConfig ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                        <div>
                          <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <span>{language === 'en' ? "Work Roster" : "শ্রেণি রুটিন শিডিউল"}</span>
                            <span className="text-indigo-600 dark:text-indigo-400">({batches.find(b => b.id === selectedRosterBatchId)?.name || ''})</span>
                          </h3>
                          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            📅 {(() => {
                              const parts = rosterDate.split('-');
                              const d = parts.length === 3 ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) : new Date();
                              return d.toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
                            })()}
                          </p>
                        </div>
                        
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => {
                              dailyClasses.forEach(cls => {
                                const savedRec = todayRecords.find(r => r.topic === cls.topic);
                                if (savedRec) {
                                  updateTeacherRecord(savedRec.id, { status: 'Completed' });
                                } else {
                                  addTeacherRecord({
                                    id: `TCR-${Date.now()}-${cls.index}`,
                                    teacherId: cls.defaultTeacherId,
                                    batchId: selectedRosterBatchId,
                                    date: rosterDate,
                                    startTime: cls.startTime,
                                    endTime: cls.endTime,
                                    topic: cls.topic,
                                    isPaid: true,
                                    subject: cls.subject,
                                    status: 'Completed'
                                  });
                                }
                              });
                              setNotification({
                                message: language === 'en' ? "Completed all scheduled classes present." : "রুটিনের সকল ক্লাস উপস্থিত হিসেবে রেকর্ড সম্পন্ন!",
                                type: 'success'
                              });
                            }}
                            className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest px-4 py-2.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 border border-emerald-500/20"
                          >
                            <CheckCircle size={14} />
                            <span>{language === 'en' ? 'All Present' : 'সবাই উপস্থিত'}</span>
                          </button>

                          <button
                            onClick={() => {
                              dailyClasses.forEach(cls => {
                                const savedRec = todayRecords.find(r => r.topic === cls.topic);
                                if (savedRec) {
                                  updateTeacherRecord(savedRec.id, { status: 'Absent' });
                                } else {
                                  addTeacherRecord({
                                    id: `TCR-${Date.now()}-${cls.index}`,
                                    teacherId: cls.defaultTeacherId,
                                    batchId: selectedRosterBatchId,
                                    date: rosterDate,
                                    startTime: cls.startTime,
                                    endTime: cls.endTime,
                                    topic: cls.topic,
                                    isPaid: true,
                                    subject: cls.subject,
                                    status: 'Absent'
                                  });
                                }
                              });
                              setNotification({
                                message: language === 'en' ? "Marked all roster teachers as Absent today." : "রুটিনের সকল শিক্ষক আজকে অনুপস্থিত হিসেবে চিহ্নিত।",
                                type: 'error'
                              });
                            }}
                            className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest px-4 py-2.5 bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 border border-rose-500/20"
                          >
                            <XCircle size={14} />
                            <span>{language === 'en' ? 'All Absent' : 'সবাই অনুপস্থিত'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Progress summary block */}
                      {(() => {
                        const totalClasses = dailyClasses.length;
                        const markedClasses = dailyClasses.filter(cls => todayRecords.some(r => r.topic === cls.topic && r.status !== 'Pending')).length;
                        const percent = totalClasses > 0 ? Math.round((markedClasses / totalClasses) * 100) : 0;
                        return (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">📊</span>
                              <div>
                                <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none">
                                  {language === 'en' ? 'Roster tracker' : 'রুটিন অগ্রগতি ট্র্যাকার'}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                  {language === 'en' 
                                    ? `${markedClasses} of ${totalClasses} Classes Logged (${percent}% Complete)`
                                    : `${totalClasses}টির মধ্যে ${markedClasses}টি ক্লাস লগ সম্পন্ন (${percent}% কমপ্লিট)`}
                                </p>
                              </div>
                            </div>
                            <div className="w-full sm:w-48 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-transparent">
                              <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* --- Roster Cards Grid --- */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {dailyClasses.map((cls, idx) => {
                          const savedRec = todayRecords.find(r => r.topic === cls.topic);
                          const currentTeacherId = savedRec ? savedRec.teacherId : cls.defaultTeacherId;
                          const currentStatus = savedRec ? savedRec.status : 'Pending';

                          const isCompleted = currentStatus === 'Completed';
                          const isAbsent = currentStatus === 'Absent';
                          const isLate = currentStatus === 'Late';

                          return (
                            <div 
                              key={idx}
                              className={cn(
                                "border rounded-[2rem] p-5 flex flex-col justify-between transition-all relative overflow-hidden min-h-[16rem]",
                                isCompleted 
                                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/35"
                                  : isAbsent
                                  ? "bg-rose-50 dark:bg-rose-950/20 border-rose-500/35"
                                  : isLate
                                  ? "bg-amber-50 dark:bg-amber-950/20 border-amber-500/35"
                                  : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
                              )}
                            >
                              <div className="absolute top-4 right-4 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none">
                                <span className={cn(
                                  "w-2 h-2 rounded-full",
                                  isCompleted ? "bg-emerald-500 animate-pulse" : isAbsent ? "bg-rose-500" : isLate ? "bg-amber-500" : "bg-slate-300"
                                )}></span>
                                <span>
                                  {currentStatus === 'Completed' ? (language === 'en' ? 'Completed' : 'সম্পন্ন') :
                                   currentStatus === 'Absent' ? (language === 'en' ? 'Absent' : 'অনুপস্থিত') :
                                   currentStatus === 'Late' ? (language === 'en' ? 'Late' : 'দেরী') :
                                   (language === 'en' ? 'Pending' : 'চলমান')}
                                </span>
                              </div>

                              <div className="space-y-1 pr-12 relative z-10 text-left">
                                <span className="inline-block text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  {language === 'en' ? `Class Slot #${cls.index}` : `ক্লাস স্লট # ${cls.index}`}
                                </span>
                                <h4 className="text-base font-black tracking-tight text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                                  {cls.subject}
                                </h4>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                  🕒 {cls.startTime} - {cls.endTime}
                                </p>
                              </div>

                              {/* Editable Teacher Option Dropdown */}
                              <div className="my-4 bg-slate-100 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">
                                  👤 {language === 'en' ? 'Assigned Teacher' : 'নিযুক্ত শিক্ষক'}
                                </label>
                                <div className="relative">
                                  <select
                                    value={currentTeacherId}
                                    onChange={(e) => {
                                      if (savedRec) {
                                        updateTeacherRecord(savedRec.id, { teacherId: e.target.value });
                                      } else {
                                        addTeacherRecord({
                                          id: `TCR-${Date.now()}-${cls.index}`,
                                          teacherId: e.target.value,
                                          batchId: selectedRosterBatchId,
                                          date: rosterDate,
                                          startTime: cls.startTime,
                                          endTime: cls.endTime,
                                          topic: cls.topic,
                                          isPaid: true,
                                          subject: cls.subject,
                                          status: 'Pending'
                                        });
                                      }
                                      setNotification({
                                        message: language === 'en' ? "Re-assigned teacher successfully!" : "সফলভাবে অন্য শিক্ষক নিয়োগ করা হয়েছে!",
                                        type: 'success'
                                      });
                                    }}
                                    className="w-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-transparent border-none p-0 outline-none select-none appearance-none cursor-pointer pr-5"
                                  >
                                    {teachers.map(t => (
                                      <option key={t.id} value={t.id} className="bg-card text-foreground">{t.name}</option>
                                    ))}
                                  </select>
                                  <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                              </div>

                              {/* Footer marking action buttons */}
                              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                  onClick={() => {
                                    if (savedRec) {
                                      updateTeacherRecord(savedRec.id, { status: isCompleted ? 'Pending' : 'Completed' });
                                    } else {
                                      addTeacherRecord({
                                        id: `TCR-${Date.now()}-${cls.index}`,
                                        teacherId: currentTeacherId,
                                        batchId: selectedRosterBatchId,
                                        date: rosterDate,
                                        startTime: cls.startTime,
                                        endTime: cls.endTime,
                                        topic: cls.topic,
                                        isPaid: true,
                                        subject: cls.subject,
                                        status: 'Completed'
                                      });
                                    }
                                  }}
                                  className={cn(
                                    "py-2 px-1 rounded-xl text-[9px] font-black uppercase flex flex-col items-center justify-center gap-1 transition-all border",
                                    isCompleted 
                                      ? "bg-emerald-600 border-emerald-600 text-white" 
                                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-500/20"
                                  )}
                                >
                                  <CheckCircle size={12} />
                                  <span>{language === 'en' ? 'Done' : 'সম্পন্ন'}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    if (savedRec) {
                                      updateTeacherRecord(savedRec.id, { status: isAbsent ? 'Pending' : 'Absent' });
                                    } else {
                                      addTeacherRecord({
                                        id: `TCR-${Date.now()}-${cls.index}`,
                                        teacherId: currentTeacherId,
                                        batchId: selectedRosterBatchId,
                                        date: rosterDate,
                                        startTime: cls.startTime,
                                        endTime: cls.endTime,
                                        topic: cls.topic,
                                        isPaid: true,
                                        subject: cls.subject,
                                        status: 'Absent'
                                      });
                                    }
                                  }}
                                  className={cn(
                                    "py-2 px-1 rounded-xl text-[9px] font-black uppercase flex flex-col items-center justify-center gap-1 transition-all border",
                                    isAbsent 
                                      ? "bg-rose-600 border-rose-600 text-white" 
                                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-rose-500/20"
                                  )}
                                >
                                  <XCircle size={12} />
                                  <span>{language === 'en' ? 'Absent' : 'অনুপস্থিত'}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    if (savedRec) {
                                      updateTeacherRecord(savedRec.id, { status: isLate ? 'Pending' : 'Late' });
                                    } else {
                                      addTeacherRecord({
                                        id: `TCR-${Date.now()}-${cls.index}`,
                                        teacherId: currentTeacherId,
                                        batchId: selectedRosterBatchId,
                                        date: rosterDate,
                                        startTime: cls.startTime,
                                        endTime: cls.endTime,
                                        topic: cls.topic,
                                        isPaid: true,
                                        subject: cls.subject,
                                        status: 'Late'
                                      });
                                    }
                                  }}
                                  className={cn(
                                    "py-2 px-1 rounded-xl text-[9px] font-black uppercase flex flex-col items-center justify-center gap-1 transition-all border",
                                    isLate 
                                      ? "bg-amber-500 border-amber-500 text-white" 
                                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-500/20"
                                  )}
                                >
                                  <Clock size={12} />
                                  <span>{language === 'en' ? 'Late' : 'দেরী'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Impromptu extra sessions creation utility block */}
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-5 text-left">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield size={14} className="text-indigo-500" />
                          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                            {language === 'en' ? 'Impromptu Master Class Creator' : 'মাস্টার ক্লাস / অতিরিক্ত সেশন সৃষ্টি করুন'}
                          </h4>
                        </div>
                        <button
                          onClick={() => {
                            setClassForm({
                              teacherId: (teachers || [])[0]?.id || '',
                              batchId: selectedRosterBatchId || (batches || [])[0]?.id || '',
                              date: today,
                              startTime: '16:00',
                              endTime: '17:30',
                              subject: 'Master Class on Mathematics',
                              topic: 'Master Class on Mathematics',
                              pagesTaught: 0,
                              status: 'Completed'
                            });
                            setShowAddClassModal(true);
                          }}
                          className="px-5 py-3 border-2 border-indigo-500/10 dark:border-indigo-550/20 hover:border-indigo-500 text-indigo-600 dark:text-indigo-400 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900"
                        >
                          <UserPlus size={14} />
                          <span>{language === 'en' ? 'Add Master Class block for Today' : 'আজকের অতিরিক্ত শ্রেণির সেশন যুক্ত করুন'}</span>
                        </button>
                      </div>

                      {/* Interactive Metrics for Active batch scheduling */}
                      <div className="bg-slate-900 text-slate-300 p-5 rounded-[2rem] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
                        <div>
                          <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block leading-none">30-Day Scheduling performance index</span>
                          <h4 className="text-2xl font-black text-white mt-1 italic leading-none">{performance.percentage}%</h4>
                          <span className="text-[10px] font-bold text-slate-400 mt-0.5 inline-block">
                             {performance.completed} / {performance.planned} {language === 'en' ? 'Planned classes completed' : 'পরিকল্পিত শ্রেণি সম্পন্ন করা হয়েছে'}
                          </span>
                        </div>
                        <div className="flex-1 max-w-sm h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shrink-0">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${performance.percentage}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/50 border-2 border-dashed border-border rounded-[2.5rem] py-16 text-center dark:bg-slate-900/30">
                      <FileWarning size={48} className="text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-sm">
                        {language === 'en' ? 'No active schedule configs available.' : 'সক্রিয় কোনো রুটিন শিডিউল খুঁজে পাওয়া যায়নি।'}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* SUBVIEW 2: Daily logging manager */}
              {teacherSubView === 'daily' && (
                <motion.div
                  key="daily-view"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6 text-left"
                >
                  {/* Daily Log lists */}
                  {(() => {
                    const logs = teacherRecords.filter(r => r.date === selectedDate);
                    if (logs.length === 0) {
                      return (
                        <div className="bg-white/50 border-2 border-dashed border-border rounded-[2.5rem] py-16 text-center dark:bg-slate-900/30">
                          <FileWarning size={48} className="text-indigo-500 animate-pulse mx-auto mb-4" />
                          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.16em] text-xs">
                            {language === 'en' ? 'No class records logged for this selected date.' : 'রুটিনের বাইরে আলাদা কোনো ক্লাস রেকর্ড এই তারিখে মেলেনি।'}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {logs.map(log => {
                          const teach = teachers.find(t => t.id === log.teacherId);
                          const bat = batches.find(b => b.id === log.batchId);
                          return (
                            <div 
                              key={log.id}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-between relative group"
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                  <span className="inline-block text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-md">
                                    {bat?.name || log.subject || 'All Batch'}
                                  </span>
                                  <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                    {teach?.name || 'Assigned Instructor'}
                                  </h4>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">
                                    Slot: {log.startTime} - {log.endTime}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400 leading-none pt-3 border-t border-slate-100 dark:border-slate-800">
                                <span>Status: <span className="text-emerald-500">{log.status || 'Done'}</span></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </motion.div>
              )}

              {/* SUBVIEW 3: Complete Class history Ledger */}
              {teacherSubView === 'history' && (
                <motion.div
                  key="history-view"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden text-left">
                    {/* Desktop detailed ledger view */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/55 dark:bg-slate-950/50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <th className="px-6 py-4">{language === 'en' ? 'Date' : 'তারিখ'}</th>
                            <th className="px-6 py-4">{language === 'en' ? 'Teacher' : 'শিক্ষক'}</th>
                            <th className="px-6 py-4">{language === 'en' ? 'Batch / Subject' : 'ব্যাচ / বিষয়'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {teacherRecords
                            .filter(r => {
                              const searchVal = historySearch.toLowerCase();
                              const teacherObj = teachers.find(t => t.id === r.teacherId);
                              return r.topic.toLowerCase().includes(searchVal) || 
                                     (r.subject && r.subject.toLowerCase().includes(searchVal)) ||
                                     (teacherObj && teacherObj.name.toLowerCase().includes(searchVal));
                            })
                            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(rec => {
                              const instruct = teachers.find(t => t.id === rec.teacherId);
                              const bch = batches.find(b => b.id === rec.batchId);
                              return (
                                <tr key={rec.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/40 transition-colors">
                                  <td className="px-6 py-4">
                                    <span className="font-bold text-slate-600 dark:text-slate-300 text-xs">{rec.date}</span>
                                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mt-0.5">{rec.startTime} - {rec.endTime}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="font-black text-slate-900 dark:text-white text-sm block leading-none">{instruct?.name || 'Instructor'}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 inline-block">{instruct?.subject || 'General'}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full inline-block">
                                      {bch?.name || rec.subject || 'Session'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile responsive history ledger stacking */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {teacherRecords
                        .filter(r => {
                          const searchVal = historySearch.toLowerCase();
                          const teacherObj = teachers.find(t => t.id === r.teacherId);
                          return r.topic.toLowerCase().includes(searchVal) || 
                                 (r.subject && r.subject.toLowerCase().includes(searchVal)) ||
                                 (teacherObj && teacherObj.name.toLowerCase().includes(searchVal));
                        })
                        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(rec => {
                          const instruct = teachers.find(t => t.id === rec.teacherId);
                          const bch = batches.find(b => b.id === rec.batchId);
                          return (
                            <div key={rec.id} className="p-4 space-y-3">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{rec.date}</span>
                                  <h4 className="font-black text-slate-950 dark:text-white leading-tight mt-0.5">
                                    {instruct?.name || 'Instructor'}
                                  </h4>
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 mt-2">
                                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-md">
                                  {bch?.name || rec.subject || 'Extra'}
                                </span>
                                <span>🕒 {rec.startTime} - {rec.endTime}</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SUBVIEW 4: Teacher consistency scorecards & metrics */}
              {teacherSubView === 'overview' && (
                <motion.div
                  key="overview-view"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left"
                >
                  {teachers.map(teacher => {
                    const allTeacherRecords = teacherRecords.filter(r => r.teacherId === teacher.id);
                    const completedRecords = allTeacherRecords.filter(r => !r.status || r.status === 'Completed');
                    const absences = allTeacherRecords.filter(r => r.status === 'Absent').length;
                    const lateness = allTeacherRecords.filter(r => r.status === 'Late').length;
                    
                    // Math formula for computing activity points out of 100
                    const consistencyScore = Math.min(100, completedRecords.length * 5); 
                    const penalty = (absences * 12) + (lateness * 4);
                    const perfIndex = Math.max(10, Math.min(100, Math.round(consistencyScore - penalty)));

                    const getTierData = (score: number) => {
                      if (score >= 85) return { label: 'Platinum Rank', color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20', icon: '🏆' };
                      if (score >= 60) return { label: 'Gold Rank', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20', icon: '⭐' };
                      if (score >= 35) return { label: 'Silver Rank', color: 'text-slate-500 bg-slate-500/10 border-slate-500/20', icon: '🥈' };
                      return { label: 'Bronze Rank', color: 'text-orange-600 bg-orange-500/10 border-orange-500/25', icon: '🥉' };
                    };

                    const tier = getTierData(perfIndex);

                    return (
                      <div
                        key={teacher.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors"></div>
                        
                        <div className="flex justify-between items-start gap-4 mb-4 relative z-10">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                              <GraduationCap size={24} />
                            </div>
                            <div>
                              <h4 className="font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                {teacher.name}
                              </h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                {teacher.subject || 'All Faculty'}
                              </p>
                            </div>
                          </div>

                          <span className={cn("inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border", tier.color)}>
                            <span>{tier.icon}</span> <span>{tier.label}</span>
                          </span>
                        </div>

                        {/* Four grid statistical indicators */}
                        <div className="grid grid-cols-3 gap-2.5 my-4">
                          <div className="bg-slate-50 dark:bg-slate-950 p-2 border border-slate-100 dark:border-slate-800 rounded-xl text-center">
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{language === 'en' ? 'Completed' : 'সম্পন্ন'}</span>
                            <span className="text-sm font-black text-emerald-600">{completedRecords.length}</span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-950 p-2 border border-slate-100 dark:border-slate-800 rounded-xl text-center">
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{language === 'en' ? 'Lateness' : 'দেরী'}</span>
                            <span className="text-sm font-black text-amber-600">{lateness}</span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-950 p-2 border border-slate-100 dark:border-slate-800 rounded-xl text-center">
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{language === 'en' ? 'Absent' : 'অনুপস্থিত'}</span>
                            <span className="text-sm font-black text-rose-600">{absences}</span>
                          </div>
                        </div>

                        {/* Progress Consistency bar indicator */}
                        <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                            <span>{language === 'en' ? 'Consistency Index:' : 'ধারাবাহিকতা ইনডেক্স:'}</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{perfIndex}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/40 dark:border-transparent">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${perfIndex}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 🔮 MODAL FOR RECORDING NEW EXTRA CLASS                    */}
      {/* ========================================================= */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-lg p-8 md:p-10 shadow-2xl relative text-left"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                {language === 'en' ? 'Log Master Class' : 'মাস্টার ক্লাস লগ'}
              </h3>
              <button 
                onClick={() => setShowAddClassModal(false)}
                className="p-3 bg-slate-50 dark:bg-slate-950 text-slate-400 hover:text-rose-500 rounded-xl border border-slate-100 dark:border-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddClass} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  {language === 'en' ? 'Class Date' : 'ক্লাসের তারিখ'}
                </label>
                <input 
                  type="date"
                  required
                  value={classForm.date}
                  onChange={e => setClassForm({ ...classForm, date: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 font-bold text-sm outline-none w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                    {language === 'en' ? 'Master Class Subject / Topic' : 'কিসের ওপর স্পেশাল মাস্টার ক্লাস:'}
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder={language === 'en' ? "e.g. Higher Math Chapter 5" : "যেমন: উচ্চতর গণিত অধ্যায় ৫"}
                    value={classForm.subject || ''}
                    onChange={e => setClassForm({ ...classForm, subject: e.target.value, topic: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 font-bold text-sm outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                    {language === 'en' ? 'Target Batch' : 'নির্দিষ্ট ব্যাচ'}
                  </label>
                  <select
                    required
                    value={classForm.batchId}
                    onChange={e => setClassForm({ ...classForm, batchId: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 font-bold text-sm outline-none cursor-pointer appearance-none"
                  >
                    <option value="">-- Choose Batch --</option>
                    {batches.filter(b => b.status === "Active" || b.status === "active").map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  {language === 'en' ? 'Instructor / Who Took Class' : 'কে ক্লাস নিয়েছেন (শিক্ষক):'}
                </label>
                <select
                  required
                  value={classForm.teacherId}
                  onChange={e => setClassForm({ ...classForm, teacherId: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 font-bold text-sm outline-none cursor-pointer appearance-none"
                >
                  <option value="">-- Choose Teacher --</option>
                  {teachers.filter(t => t.status === "Active").map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.subject || 'Faculty'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                    {language === 'en' ? 'Start Time' : 'শুরুর সময়'}
                  </label>
                  <input 
                    type="time"
                    required
                    value={classForm.startTime}
                    onChange={e => setClassForm({ ...classForm, startTime: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 font-bold text-sm outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                    {language === 'en' ? 'End Time' : 'শেষের সময়'}
                  </label>
                  <input 
                    type="time"
                    required
                    value={classForm.endTime}
                    onChange={e => setClassForm({ ...classForm, endTime: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 font-bold text-sm outline-none"
                  />
                </div>
              </div>

              <button className="w-full py-4 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-indigo-100 dark:shadow-none mt-2">
                {language === 'en' ? 'Save Master Class Log' : 'মাস্টার ক্লাস সংরক্ষণ করুন'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
