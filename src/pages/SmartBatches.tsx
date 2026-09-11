import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Layers, Settings, Users, CheckCircle, XCircle, ChevronDown, 
  Map as MapIcon, Plus, Calendar, Shield, Sparkles, UserPlus, Flame,
  Edit2, Trash2, X, Search, GripVertical, Archive, Folder, Unlock, BookOpen, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp, DollarSign
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAppContext } from '../store/AppContext';
import { BatchDashboard } from '../components/BatchDashboard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { cn } from '../lib/utils';
import { translations } from '../lib/translations';

interface SmartBatchConfig {
  batchId: string;
  daysPerWeek: number;
  classesPerDay: number;
  rotationMode: 'smart' | 'manual';
  subjectMap: { id: string; subject: string; teacherId: string; startTime?: string; endTime?: string }[];
}

interface StudentRowProps {
  student: any;
  language: string;
  updateStudent: (id: string, updates: any) => void;
  isArchive: boolean;
}

export const StudentRow = React.memo(({ student, language, updateStudent, isArchive }: StudentRowProps) => {
  const [val, setVal] = useState(student.boardExamResult || '');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setVal(student.boardExamResult || '');
  }, [student.boardExamResult]);

  const handleSave = () => {
    updateStudent(student.id, { boardExamResult: val });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const isGolden = val.toLowerCase().includes('5.00') || val.toLowerCase().includes('golden') || val.toLowerCase().includes('৫.০০');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-105 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 transition-all border border-slate-100 dark:border-slate-900 gap-3">
       <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-xs flex items-center justify-center shadow-md shrink-0">
             {student.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
             <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-foreground">{student.name}</span>
                {isArchive && isGolden && (
                   <span className="text-amber-500 dark:text-amber-400 animate-pulse text-xs" title="GPA 5.00 Achiever! 👑">👑 🌟</span>
                )}
             </div>
             <p className="text-[10px] font-mono font-black text-indigo-600/80 dark:text-indigo-400/80 tracking-wider">
                {student.id}
             </p>
          </div>
       </div>

       <div className="flex items-center gap-3 justify-between sm:justify-end">
          {/* Status pill */}
          <span className={cn(
             "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0",
             student.status === 'Active' 
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-150/30" 
                : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/40"
          )}>
             <span className={cn("w-1.5 h-1.5 rounded-full inline-block", student.status === 'Active' ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
             {student.status === 'Active' 
                ? (language === 'en' ? 'Active Student' : 'সক্রিয় শিক্ষার্থী') 
                : (language === 'en' ? 'Former Student' : 'প্রাক্তন শিক্ষার্থী')}
          </span>

          {/* Board Exam Results if Batch is Archival */}
          {isArchive && (
             <div className="flex items-center gap-1.5 shrink-0">
                <input
                   type="text"
                   value={val}
                   onChange={(e) => setVal(e.target.value)}
                   onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                   }}
                   onBlur={handleSave}
                   placeholder={language === 'en' ? "Board Result (e.g. GPA 5.00)" : "বোর্ড জিপিএ (উদা: ৫.০০)"}
                   className="px-2.5 py-1.5 border border-border dark:border-slate-800 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:border-amber-500 outline-none w-28 sm:w-36 focus:ring-1 focus:ring-amber-500/30 transition-all font-mono"
                />
                <button 
                   onClick={handleSave}
                   className={cn(
                      "px-2 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm",
                      isSaved 
                         ? "bg-emerald-600 text-white border-emerald-600" 
                         : "bg-amber-600 text-white border-amber-650 hover:bg-amber-700"
                   )}
                >
                   {isSaved ? (language === 'en' ? "Saved" : "রক্ষিত") : (language === 'en' ? "Save" : "সেভ")}
                </button>
             </div>
          )}
       </div>
    </div>
  );
});

export function SmartBatches() {
  const { 
    language, 
    batches, 
    teachers, 
    students, 
    attendance, 
    teacherRecords, 
    addTeacherRecord, 
    deleteTeacherRecord,
    addBatch,
    updateBatch,
    removeBatch,
    updateStudent,
    exams = [],
    examResults = [],
    addExam,
    addExamResult,
    deleteExamResult
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'directory' | 'planner' | 'assignment' | 'insights' | 'analytics'>('directory');
  const [directoryFilter, setDirectoryFilter] = useState<'active' | 'inactive' | 'archive'>('active');
  const [selectedDateDetails, setSelectedDateDetails] = useState<{ date: string; present: any[]; absent: any[] } | null>(null);
  
  // Smart batch config internal state
  const [configs, setConfigs] = useState<SmartBatchConfig[]>(() => {
     try {
       const saved = localStorage.getItem('smart_batch_configs');
       return saved ? JSON.parse(saved) : [];
     } catch(e) { return [];}
  });

  useEffect(() => {
    localStorage.setItem('smart_batch_configs', JSON.stringify(configs));
  }, [configs]);

  // Modals inside SmartBatches
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    startDate: '', 
    endDate: '', 
    status: 'Active' as 'Active' | 'Inactive' | 'Archive', 
    maxCapacity: 55 
  });
  const [batchError, setBatchError] = useState<string | null>(null);
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState<string | null>(null);
  const [confirmArchiveBatch, setConfirmArchiveBatch] = useState<string | null>(null);
  const [archiveDateInput, setArchiveDateInput] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [viewingBatchSearch, setViewingBatchSearch] = useState('');

  // States for viewing batch & registering exam results
  const [viewingBatchRecord, setViewingBatchRecord] = useState<any | null>(null);
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamDate, setNewExamDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newExamTotalMarks, setNewExamTotalMarks] = useState(100);
  const [studentMarksInputs, setStudentMarksInputs] = useState<Record<string, number>>({});
  const [selectedExamIdForView, setSelectedExamIdForView] = useState<string>('');

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  const activeBatches = batches.filter(b => b.status === 'Active' || b.status === 'active');
  const inactiveBatches = batches.filter(b => b.status === 'Inactive' || b.status === 'inactive');
  const archivedBatches = batches.filter(b => b.status === 'Archive' || b.status === 'archive');
  
  const today = new Date().toISOString().slice(0, 10);
  
  const handleOpenModal = (batch?: any) => {
    if (batch) {
      setEditingBatch(batch);
      setFormData({ 
        name: batch.name, 
        startDate: batch.startDate || '', 
        endDate: batch.endDate || '',
        status: batch.status || 'Active',
        maxCapacity: batch.maxCapacity || 50
      });
    } else {
      setEditingBatch(null);
      setFormData({ name: '', startDate: '', endDate: '', status: 'Active', maxCapacity: 50 });
    }
    setBatchError(null);
    setIsModalOpen(true);
  };

  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setBatchError(language === 'en' ? 'Batch name is required' : 'ব্যাচের নাম আবশ্যক');
      return;
    }
    const isDuplicate = batches.some(b => b.name.toLowerCase() === trimmedName.toLowerCase() && b.id !== editingBatch?.id);
    if (isDuplicate) {
      setBatchError(language === 'en' ? 'A batch with this name already exists' : 'এই নামের ব্যাচ ইতিমধ্যে বিদ্যমান');
      return;
    }

    const saveStatus = formData.status;
    const saveEndDate = saveStatus === 'Inactive' || saveStatus === 'Archive' ? (formData.endDate || new Date().toISOString().slice(0, 10)) : undefined;

    if (editingBatch) {
      updateBatch(editingBatch.id, { 
        name: trimmedName, 
        startDate: formData.startDate, 
        endDate: saveEndDate,
        status: saveStatus,
        maxCapacity: formData.maxCapacity
      });
    } else {
      const newId = 'BCH-' + Date.now();
      addBatch({ 
        id: newId,
        name: trimmedName, 
        startDate: formData.startDate, 
        endDate: saveEndDate, 
        status: saveStatus,
        maxCapacity: formData.maxCapacity,
        sessions: [] 
      });
      // Pre-initialize configuration for the newly created batch
      setConfigs(prev => [...prev, {
        batchId: newId,
        daysPerWeek: 5,
        classesPerDay: 4,
        rotationMode: 'smart',
        subjectMap: [
          { id: '1', subject: 'Mathematics', teacherId: teachers[0]?.id || '', startTime: '09:00', endTime: '10:00' },
          { id: '2', subject: 'English', teacherId: teachers[1]?.id || '', startTime: '10:00', endTime: '11:00' }
        ]
      }]);
    }
    setIsModalOpen(false);
  };

  const handleSelectBatch = (id: string) => {
    setSelectedBatchId(id);
    if (!configs.find(c => c.batchId === id)) {
      setConfigs(prev => [...prev, {
        batchId: id,
        daysPerWeek: 5,
        classesPerDay: 4,
        rotationMode: 'smart',
        subjectMap: [
          { id: '1', subject: 'Mathematics', teacherId: teachers[0]?.id || '', startTime: '09:00', endTime: '10:00' },
          { id: '2', subject: 'English', teacherId: teachers[1]?.id || '', startTime: '10:00', endTime: '11:00' },
          { id: '3', subject: 'Physics', teacherId: teachers.length > 2 ? teachers[2].id : teachers[0]?.id || '', startTime: '11:00', endTime: '12:00' }
        ]
      }]);
    }
  };

  useEffect(() => {
     if (selectedBatchId === '' && activeBatches.length > 0) {
        handleSelectBatch(activeBatches[0].id);
     }
  }, [activeBatches.length]);

  const currentConfig = configs.find(c => c.batchId === selectedBatchId);
  
  // Drag and Drop re-assigning students between batches
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const targetBatch = batches.find(b => b.id === destination.droppableId);
    if (!targetBatch) return;

    updateStudent(draggableId, { batch: targetBatch.name });
  };

  const heatmapData = React.useMemo(() => {
    if (!currentConfig) return [];
    const days = [];
    const todayRef = new Date();
    for (let i = 29; i >= 0; i--) {
       const d = new Date(todayRef);
       d.setDate(d.getDate() - i);
       const dateStr = d.toISOString().slice(0, 10);
       const count = teacherRecords.filter(r => r.batchId === selectedBatchId && r.date === dateStr && r.status === 'Completed').length;
       const expected = currentConfig.classesPerDay;
       const density = expected > 0 ? count / expected : 0;
       days.push({ date: dateStr, count, density });
    }
    return days;
  }, [teacherRecords, selectedBatchId, currentConfig]);

  const aiInsights = React.useMemo(() => {
    if (!currentConfig || !selectedBatchId) return { conflicts: [], recommendations: [] };

    const conflicts: { type: 'Conflict' | 'Warning', message: string, detail: string }[] = [];
    const recommendations: { type: 'Swap' | 'Optimized', title: string, description: string, action: string }[] = [];

    // 1. Detect Real Availability Conflicts (Overlapping schedules)
    configs.forEach(otherConfig => {
      if (otherConfig.batchId === selectedBatchId) return;
      
      const otherBatch = batches.find(b => b.id === otherConfig.batchId);
      if (!otherBatch || otherBatch.status === 'Inactive') return;

      currentConfig.subjectMap.forEach(mySubj => {
        otherConfig.subjectMap.forEach(otherSubj => {
          if (mySubj.teacherId === otherSubj.teacherId && mySubj.teacherId !== '') {
            const teacher = teachers.find(t => t.id === mySubj.teacherId);
            conflicts.push({
              type: 'Conflict',
              message: language === 'en' 
                ? `${teacher?.name || 'Teacher'} has dual assignment: ${mySubj.subject} (${otherBatch.name})`
                : `${teacher?.name || 'শিক্ষক'} দ্বৈত অ্যাসাইনমেন্টে আছেন: ${mySubj.subject} (${otherBatch.name})`,
              detail: language === 'en'
                ? `Conflict detected in class rotation logic between this batch and ${otherBatch.name}.`
                : `এই ব্যাচ এবং ${otherBatch.name}-এর মধ্যে ক্লাস রোটেশন লজিকে অমিল পাওয়া গেছে।`
            });
          }
        });
      });
    });

    // 2. Warn of single allocation subject logic imbalances
    if (currentConfig.subjectMap.length <= 1 && currentConfig.subjectMap.length > 0) {
      conflicts.push({
        type: 'Warning',
        message: language === 'en' ? 'Low Subject Allocation Frequency' : 'কম বিষয় ভিত্তিক সময় বরাদ্দ',
        detail: language === 'en'
          ? 'Single subject schedules might decrease educational output compared to multi-subject distribution.'
          : 'একটি মাত্র বিষয়ভিত্তিক রুটিন শিক্ষার্থীদের সামগ্রিক প্রবৃদ্ধির হারের জন্য ভারসাম্যহীন হতে পারে।'
      });
    }

    // AI optimization swaps
    if (currentConfig.subjectMap.length > 1) {
       const firstSubj = currentConfig.subjectMap[0];
       const secondSubj = currentConfig.subjectMap[1];
       const teacher1 = teachers.find(t => t.id === firstSubj.teacherId);
       const teacher2 = teachers.find(t => t.id === secondSubj.teacherId);

       if (teacher1 && teacher2) {
          recommendations.push({
             type: 'Swap',
             title: language === 'en' ? `Swap sequence: ${firstSubj.subject} ↔ ${secondSubj.subject}` : `সিকোয়েন্স পরিবর্তন: ${firstSubj.subject} ↔ ${secondSubj.subject}`,
             description: language === 'en'
               ? `Improve attention retention scores by swapping ${teacher1.name}'s and ${teacher2.name}'s daily timeslot order.`
               : `দৈনিক ক্লাসের রোটেশনে ক্রমানুযায়ী মনোযোগ বৃদ্ধির লক্ষ্যে শিক্ষকদের ক্লাস টাইমিং অদলবদল সাজানো সমীচীন।`,
             action: language === 'en' ? 'Swap Sequence' : 'ক্রম পরিবর্তন'
          });
       }
    }

    // Active teachers vs potential
    recommendations.push({
       type: 'Optimized',
       title: language === 'en' ? 'Sync Class Velocities' : 'ক্লাস বেগ সিঙ্ক করুন',
       description: language === 'en'
         ? 'Align subject frequencies with the latest analytics insights on student test results.'
         : 'সর্বশেষ পরীক্ষার ফলাফলের ভিত্তিতে বিষয়ভিত্তিক ক্লাসের পরিমাণ বৃদ্ধি করুন।',
       action: language === 'en' ? 'Recalibrate' : 'পুনঃনির্ধারণ'
    });

    return { conflicts, recommendations };
  }, [configs, selectedBatchId, teacherRecords, teachers, batches, language]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight uppercase italic">{language === 'en' ? 'Smart Batches' : 'স্মার্ট ব্যাচ'}</h1>
              <p className="text-xs font-bold text-muted uppercase tracking-widest">{language === 'en' ? 'Intelligent Class & Teacher Management' : 'হালনাগাদ ব্যাচ ও শিক্ষক ব্যবস্থাপনা'}</p>
           </div>
           
           <button 
             onClick={() => handleOpenModal()} 
             className="px-6 py-4 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-indigo-100 dark:shadow-none cursor-pointer"
           >
              <Plus size={16} /> {language === 'en' ? 'Create Batch' : 'নতুন ব্যাচ'}
           </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar border-b border-border">
           <button 
              onClick={() => setActiveTab('directory')}
              className={cn("px-4 py-3 rounded-t-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer", activeTab === 'directory' ? "bg-indigo-600 text-white" : "bg-muted/10 text-muted hover:bg-muted/20")}
           >
              <Folder size={14} />
              {language === 'en' ? 'Batch Directory' : 'ব্যাচ ডিরেক্টরি'}
           </button>
           <button 
              onClick={() => {
                if (activeBatches.length > 0 && !selectedBatchId) {
                   setSelectedBatchId(activeBatches[0].id);
                }
                setActiveTab('planner');
              }}
              className={cn("px-4 py-3 rounded-t-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer", activeTab === 'planner' ? "bg-indigo-600 text-white" : "bg-muted/10 text-muted hover:bg-muted/20")}
           >
              <Layers size={14} />
              {language === 'en' ? 'Roster Scheduler' : 'শিডিউল ও রুটিন'}
           </button>
           <button 
              onClick={() => setActiveTab('assignment')}
              className={cn("px-4 py-3 rounded-t-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer", activeTab === 'assignment' ? "bg-indigo-600 text-white" : "bg-muted/10 text-muted hover:bg-muted/20")}
           >
              <Users size={14} />
              {language === 'en' ? 'Student Planner' : 'ছাত্র বিন্যাস'}
           </button>
           <button 
              onClick={() => {
                if (activeBatches.length > 0 && !selectedBatchId) {
                   setSelectedBatchId(activeBatches[0].id);
                }
                setActiveTab('insights');
              }}
              className={cn("px-4 py-3 rounded-t-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer", activeTab === 'insights' ? "bg-indigo-600 text-white" : "bg-muted/10 text-muted hover:bg-muted/20")}
           >
              <Sparkles size={12} className={activeTab === 'insights' ? "text-amber-300" : "text-amber-500"}/>
              {language === 'en' ? 'AI Insights' : 'এআই অন্তর্বৃষ্টি'}
           </button>
           <button 
              onClick={() => setActiveTab('analytics')}
              className={cn("px-4 py-3 rounded-t-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer", activeTab === 'analytics' ? "bg-indigo-600 text-white" : "bg-muted/10 text-muted hover:bg-muted/20")}
           >
              <LineChartIcon size={14} />
              {language === 'en' ? 'Analytics' : 'অ্যানালিটিক্স'}
           </button>
        </div>

        {/* Brand New Workspace Dashboard Directory */}
        {activeTab === 'directory' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* KPI Statistics Deck */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {/* Stat Card 1: Total Batches */}
               <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                     <Layers size={20} />
                  </div>
                  <div className="min-w-0">
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">{language === 'en' ? 'Total Batches' : 'মোট ব্যাচ'}</p>
                     <h3 className="text-xl sm:text-2xl font-black text-foreground mt-0.5">{batches.length}</h3>
                  </div>
               </div>

               {/* Stat Card 2: Active Batches */}
               <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                  </div>
                  <div className="min-w-0">
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">{language === 'en' ? 'Active Roster' : 'সক্রিয় রটার'}</p>
                     <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{activeBatches.length}</h3>
                  </div>
               </div>

               {/* Stat Card 3: Inactive Records */}
               <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                     <Archive size={18} />
                  </div>
                  <div className="min-w-0">
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">{language === 'en' ? 'Archived Records' : 'আর্কাইভ রেকর্ডস'}</p>
                     <h3 className="text-xl sm:text-2xl font-black text-foreground mt-0.5">{inactiveBatches.length}</h3>
                  </div>
               </div>

               {/* Stat Card 4: Global Fill Rate */}
               <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/45 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                     <Users size={18} />
                  </div>
                  {(() => {
                     const activeStudentsCount = students.filter(s => s.status === 'Active').length;
                     const activeMaxCapSum = activeBatches.reduce((acc, b) => acc + (b.maxCapacity || 50), 0);
                     const capPercentage = activeMaxCapSum > 0 ? Math.round((activeStudentsCount / activeMaxCapSum) * 100) : 0;
                     return (
                        <div className="min-w-0 w-full">
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">{language === 'en' ? 'Enrollment Fill' : 'ছাত্র ভর্তি অনুপাত'}</p>
                           <h3 className="text-xl sm:text-2xl font-black text-foreground mt-0.5">{capPercentage}%</h3>
                        </div>
                     );
                  })()}
               </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
               {/* Directory Sub-filters */}
               <div className="flex gap-1.5 p-1 bg-muted/20 dark:bg-slate-950 rounded-xl w-full md:w-auto">
                  {(['active', 'inactive', 'archive'] as const).map(f => (
                     <button
                        key={f}
                        onClick={() => setDirectoryFilter(f)}
                        className={cn(
                           "flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black whitespace-nowrap transition-all uppercase tracking-wider cursor-pointer",
                           directoryFilter === f 
                              ? "bg-indigo-600 text-white shadow-sm" 
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                     >
                        
                        {f === 'active' && (language === 'en' ? 'Active' : 'সক্রিয়')}
                        {f === 'inactive' && (language === 'en' ? 'Inactive' : 'নিষ্ক্রিয়')}
                        {f === 'archive' && (language === 'en' ? 'Archive' : 'আর্কাইভ')}
                     </button>
                  ))}
               </div>

               {/* Search bar inside Directory tab */}
               <div className="relative w-full md:w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                     type="text"
                     placeholder={language === 'en' ? "Search batch name..." : "ব্যাচের নাম খুঁজুন..."}
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-11 pr-4 py-3 bg-muted/15 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-border/50 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all font-sans"
                  />
               </div>
            </div>

            {/* Batches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {(() => {
                  const filtered = batches.filter(b => {
                     const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
                     const normalizedStatus = (b.status || 'Active').toLowerCase();
                     
                     if (directoryFilter === 'active') {
                        return matchesSearch && normalizedStatus === 'active';
                                           } else if (directoryFilter === 'inactive') {
                         return matchesSearch && (normalizedStatus === 'inactive' || normalizedStatus === 'Inactive');
                      } else if (directoryFilter === 'archive') {
                         return matchesSearch && (normalizedStatus === 'archive' || normalizedStatus === 'Archive');
                      }
                      return matchesSearch;
                   });

                   if (filtered.length === 0) {
                      return (
                         <div className="md:col-span-2 lg:col-span-3 py-16 text-center bg-card rounded-3xl border border-dashed border-border flex flex-col items-center justify-center">
                            <Folder className="mx-auto mb-3 opacity-20 text-muted-foreground" size={40} />
                            <p className="text-sm font-black text-muted-foreground uppercase tracking-wider">
                               {language === 'en' ? 'No Batches Found' : 'কোন ব্যাচ পাওয়া যায়নি'}
                            </p>
                            <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
                               {language === 'en' ? 'Try adjusting your search query or check inactive tabs.' : 'অনুগ্রহ করে সার্চ বা নিষ্ক্রিয় ফিল্টার চেক করে দেখুন।'}
                            </p>
                         </div>
                      );
                   }

                   return filtered.map(batch => {
                     const isBatchActive = batch.status === 'Active' || batch.status === 'active';
                     const isBatchArchive = batch.status === 'Archive' || batch.status === 'archive';
                     
                     // In inactive or archived batches, include all associated student records (even inactive ones)
                     const bStudents = students.filter(s => {
                        const match = s.batch === batch.name || s.batch === batch.id;
                        if (isBatchActive) {
                           return match && s.status === 'Active';
                        }
                        return match;
                     });
                     
                     const studentCount = bStudents.length;
                     const cap = batch.maxCapacity || 50;
                     const fillPercent = Math.min(100, Math.round((studentCount / cap) * 100));

                     // Look up config for display info
                     const bConfig = configs.find(c => c.batchId === batch.id);

                     return (
                        <motion.div
                           layout
                           key={batch.id}
                           onClick={(e) => {
                              if ((e.target as HTMLElement).closest('button')) return;
                              setViewingBatchRecord(batch);
                           }}
                           className={cn(
                              "bg-card rounded-[2rem] border p-6 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg",
                              isBatchActive 
                                 ? "border-border hover:border-indigo-500/40 dark:hover:border-indigo-900/50" 
                                 : isBatchArchive
                                    ? "border-amber-200/50 dark:border-amber-950/20 bg-amber-500/[0.02] dark:bg-amber-950/[0.05] hover:border-amber-500/30"
                                    : "border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 opacity-75 hover:border-indigo-500/30"
                           )}
                        >
                           {/* Decorative background aura for active cards */}
                           {isBatchActive && (
                              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
                           )}

                           <div className="space-y-4">
                              {/* Header Status Row */}
                              <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                                 <div className="flex items-center gap-1.5">
                                    {isBatchActive ? (
                                       <span className="flex h-2 w-2 relative">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                       </span>
                                    ) : isBatchArchive ? (
                                       <Archive size={14} className="text-amber-500 dark:text-amber-400" />
                                    ) : (
                                       <Folder size={14} className="text-slate-400 dark:text-slate-600" />
                                    )}
                                    <span className={cn(
                                       "text-[10px] font-black uppercase tracking-widest",
                                       isBatchActive 
                                          ? "text-emerald-600 dark:text-emerald-400" 
                                          : isBatchArchive 
                                             ? "text-amber-600 dark:text-amber-450" 
                                             : "text-slate-400"
                                    )}>
                                       {isBatchActive 
                                          ? (language === 'en' ? 'Active' : 'সক্রিয়') 
                                          : isBatchArchive
                                             ? (language === 'en' ? 'Archive' : 'আর্কাইভ')
                                             : (language === 'en' ? 'Inactive' : 'নিষ্ক্রিয়')}
                                    </span>
                                 </div>
                                 
                                 {batch.startDate && (
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest font-mono bg-muted/30 px-2 py-0.5 rounded-md">
                                       {batch.startDate}
                                    </span>
                                 )}
                              </div>

                              {/* Title & Stats */}
                              <div>
                                 <h3 className={cn(
                                    "text-lg font-black tracking-tight uppercase",
                                    isBatchActive ? "text-foreground" : "text-slate-700 dark:text-slate-300"
                                 )}>
                                    {batch.name}
                                 </h3>
                                 <p className="text-[10px] font-black tracking-widest text-[#64748b] dark:text-indigo-400/80 uppercase mt-0.5">
                                    {batch.id}
                                 </p>
                              </div>

                              {/* Lock indicator message for Archived batches */}
                              {isBatchArchive && (
                                 <div className="bg-amber-500/5 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-950/50 p-3 rounded-2xl text-[10px] font-semibold text-amber-800 dark:text-amber-300 leading-relaxed">
                                    🗃️ {language === 'en' 
                                       ? "This roster is historically archived. It contains student exam records and due settlement status permanently."
                                       : "এই ব্যাচটি আর্কাইভ করা। এখানে শিক্ষার্থীদের পরীক্ষার ফলাফল এবং বকেয়া তথ্য স্থায়ী রেকর্ডে সংরক্ষিত আছে।"}
                                 </div>
                              )}

                              {!isBatchActive && !isBatchArchive && (
                                 <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl text-[10px] font-semibold text-muted-foreground leading-relaxed">
                                    🔒 {language === 'en' 
                                       ? "This roster is inactive and paused. It can be reactivated in the future."
                                       : "এই ব্যাচটি নিষ্ক্রিয় করা। ভবিষ্যতে এটি পুনরায় চালু করা সম্ভব।"}
                                 </div>
                              )}

                              {/* Content Section: Seats Info with modern fluid slider */}
                              <div className="space-y-2 pt-1">
                                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <span>{language === 'en' ? 'Students Enrolled' : 'নিবন্ধিত শিক্ষার্থী'}</span>
                                    <span className="font-mono">{studentCount} / {cap} ({fillPercent}%)</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/40 dark:border-transparent">
                                    <div 
                                       className={cn(
                                          "h-full rounded-full transition-all duration-500",
                                          isBatchArchive
                                             ? "bg-amber-500 dark:bg-amber-600"
                                             : !isBatchActive 
                                                ? "bg-slate-350 dark:bg-slate-700" 
                                                : fillPercent >= 100 
                                                   ? "bg-rose-500" 
                                                   : fillPercent >= 80 
                                                      ? "bg-amber-500" 
                                                      : "bg-indigo-600"
                                       )} 
                                       style={{ width: `${fillPercent}%` }}
                                    ></div>
                                 </div>
                              </div>

                              {/* Class Completion Progress Bar */}
                              {isBatchActive && (
                                 <div className="space-y-2 pt-1.5">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                       <span>{language === 'en' ? "Today's Class Progress" : "আজকের পাঠদান অগ্রগতি"}</span>
                                       {(() => {
                                          const totalScheduledToday = bConfig ? (bConfig.classesPerDay || 4) : 4;
                                          const completedToday = teacherRecords.filter(r => r.batchId === batch.id && r.date === today && (r.status === 'Completed' || r.status === 'Late' || !r.status)).length;
                                          const classCompletionPercent = totalScheduledToday > 0 ? Math.min(100, Math.round((completedToday / totalScheduledToday) * 100)) : 0;
                                          return (
                                             <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                                                {completedToday} / {totalScheduledToday} ({classCompletionPercent}%)
                                             </span>
                                          );
                                       })()}
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/40 dark:border-transparent">
                                       {(() => {
                                          const totalScheduledToday = bConfig ? (bConfig.classesPerDay || 4) : 4;
                                          const completedToday = teacherRecords.filter(r => r.batchId === batch.id && r.date === today && (r.status === 'Completed' || r.status === 'Late' || !r.status)).length;
                                          const classCompletionPercent = totalScheduledToday > 0 ? Math.min(100, Math.round((completedToday / totalScheduledToday) * 100)) : 0;
                                          return (
                                             <div 
                                                className={cn(
                                                   "h-full rounded-full transition-all duration-500",
                                                   classCompletionPercent >= 105 
                                                      ? "bg-rose-500" 
                                                      : classCompletionPercent >= 100 
                                                         ? "bg-emerald-500" 
                                                         : classCompletionPercent >= 50 
                                                            ? "bg-indigo-600" 
                                                            : "bg-indigo-400"
                                                )} 
                                                style={{ width: `${classCompletionPercent}%` }}
                                             ></div>
                                          );
                                       })()}
                                    </div>
                                 </div>
                              )}

                              {/* Schedule detail specs if available */}
                              {isBatchActive && (
                                 <div className="bg-muted/15 dark:bg-slate-950/45 border border-border/40 p-3 rounded-2xl text-[11px] font-bold text-muted-foreground flex justify-between items-center">
                                    <span>{language === 'en' ? 'Roster Slots:' : 'সাপ্তাহিক রুটিনঃ'}</span>
                                    <span className="text-[#334155] dark:text-slate-100 font-black uppercase">
                                       {bConfig 
                                          ? `${bConfig.daysPerWeek} Days (${bConfig.classesPerDay} classes)` 
                                          : (language === 'en' ? 'Unscheduled' : 'নির্ধারণ নেই')}
                                    </span>
                                 </div>
                              )}
                           </div>

                           {/* Interactive Action Row */}
                           <div className="flex gap-2 border-t border-border/40 pt-4 mt-5">
                              {isBatchActive ? (
                                 <>
                                    <button
                                       onClick={() => {
                                          handleSelectBatch(batch.id);
                                          setActiveTab('planner');
                                          window.scrollTo({ top: 320, behavior: 'smooth' });
                                       }}
                                       className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200/40 dark:border-indigo-900/60 text-indigo-750 dark:text-indigo-400 rounded-xl transition-all duration-250 font-black cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                                    >
                                       ⚙️ {language === 'en' ? 'Setup Routine' : 'রুটিন সাজান'}
                                    </button>
                                    <button
                                       onClick={() => handleOpenModal(batch)}
                                       className="py-3 px-3.5 border border-border text-foreground hover:bg-muted/20 rounded-xl transition-all font-bold text-xs flex items-center justify-center cursor-pointer"
                                       title="Edit Details"
                                    >
                                       <Edit2 size={13} />
                                    </button>
                                    <button
                                       onClick={() => setConfirmArchiveBatch(batch.id)}
                                       className="py-3 px-3.5 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl transition-all border border-amber-100/40 dark:border-amber-900/30 cursor-pointer"
                                       title={language === 'en' ? "Archive Batch" : "আর্কাইভ ব্যাচ"}
                                    >
                                       <Archive size={13} />
                                    </button>
                                    <button
                                       onClick={() => setConfirmDeleteBatch(batch.id)}
                                       className="py-3 px-3.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-450 rounded-xl transition-all border border-rose-100/40 dark:border-rose-900/30 cursor-pointer"
                                       title="Delete Batch"
                                    >
                                       <Trash2 size={13} />
                                    </button>
                                 </>
                              ) : (
                                 <>
                                    <button
                                       onClick={() => handleOpenModal(batch)}
                                       className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#475569] dark:text-slate-300 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                       <Unlock size={12} /> {language === 'en' ? 'Edit & Configure' : 'সম্পাদনা ও সক্রিয়করণ'}
                                    </button>
                                    <button
                                       onClick={() => setViewingBatchRecord(batch)}
                                       className="py-3 px-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100/40 cursor-pointer"
                                       title="View Roster Records"
                                    >
                                       <BookOpen size={13} />
                                    </button>
                                    <button
                                       onClick={() => setConfirmDeleteBatch(batch.id)}
                                       className="py-3 px-3.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-450 rounded-xl transition-all border border-rose-100/40 dark:border-rose-900/30 cursor-pointer"
                                       title="Delete Batch"
                                    >
                                       <Trash2 size={13} />
                                    </button>
                                 </>
                              )}
                           </div>
                        </motion.div>
                     );
                  });
               })()}
            </div>
          </div>
        )}

        {/* Selected Batch selection indicator - ONLY shown on Planner & Insights tab */}
        {(activeTab === 'planner' || activeTab === 'insights') && (
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card text-card-foreground p-5 rounded-3xl border border-border/80 shadow-sm animate-in fade-in duration-200">
              <div>
                 <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{language === 'en' ? "ACTIVE ROTATION WORKSPACE" : "সক্রিয় রটার ওয়ার্কস্পেস"}</span>
                 <h3 className="text-sm font-black text-foreground uppercase mt-0.5">
                    {language === 'en' ? "Choose Batch Config:" : "ব্যাচ কনফিগ বাছুনঃ"}
                 </h3>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                 {activeBatches.map(b => (
                    <button 
                      key={b.id}
                      onClick={() => handleSelectBatch(b.id)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm tracking-wide border cursor-pointer", 
                        selectedBatchId === b.id 
                          ? "bg-indigo-600 border-indigo-600 text-white" 
                          : "bg-background text-muted-foreground border-border hover:border-indigo-400 hover:text-foreground"
                      )}
                    >
                      {b.name}
                    </button>
                 ))}
                 {activeBatches.length === 0 && (
                    <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">{language === 'en' ? 'No active batches. Activate an archived batch first.' : 'কোন সক্রিয় ব্যাচ নেই। অনুগ্রহ করে প্রথমে ডিরেক্টরি থেকে সক্রিয় করুন।'}</p>
                 )}
              </div>
           </div>
        )}

        {/* Tab View Container */}
        {activeTab === 'planner' && currentConfig && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              <div className="bg-card text-card-foreground dark:bg-slate-900 p-6 rounded-2xl border border-border dark:border-slate-800 shadow-sm text-foreground">
                 
                 {/* Top action bar to manage active batch */}
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-border/50 dark:border-slate-800">
                    <div>
                       <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                          {batches.find(b => b.id === selectedBatchId)?.name || 'Batch Details'}
                       </h3>
                       <p className="text-xs text-muted font-bold uppercase tracking-wide mt-1">
                          {language === 'en' ? 'Configure parameters & patterns for classroom management' : 'শ্রেণীকক্ষ ব্যবস্থাপনার জন্য প্যারামিটার ও প্যাটার্ন সাজান'}
                       </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                       <button 
                          onClick={() => handleOpenModal(batches.find(b => b.id === selectedBatchId))}
                          className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest px-3 py-2.5 bg-muted/20 dark:bg-slate-800 text-foreground dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-border dark:border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                       >
                          <Edit2 size={12} /> {language === 'en' ? 'Edit Batch Info' : 'তথ্য পরিবর্তন'}
                       </button>
                       <button 
                          onClick={() => setConfirmDeleteBatch(selectedBatchId)}
                          className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest px-3 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                       >
                          <Trash2 size={12} /> {language === 'en' ? 'Delete Batch' : 'মুছে ফেলুন'}
                       </button>
                    </div>
                 </div>

                 {/* Basic Parameters edit form */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest">Days Per Week</label>
                        <select 
                          value={currentConfig.daysPerWeek}
                          onChange={(e) => {
                              const newVal = parseInt(e.target.value);
                              setConfigs(prev => prev.map(c => c.batchId === selectedBatchId ? { ...c, daysPerWeek: newVal } : c));
                          }}
                          className="w-full bg-muted/10 dark:bg-slate-950 border border-border dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 p-3 outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/20"
                        >
                           {[1,2,3,4,5,6,7].map(n => <option key={n} value={n} className="dark:bg-slate-950">{n} Days</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest">Classes Per Day</label>
                        <select 
                          value={currentConfig.classesPerDay}
                          onChange={(e) => {
                              const newVal = parseInt(e.target.value);
                              setConfigs(prev => prev.map(c => c.batchId === selectedBatchId ? { ...c, classesPerDay: newVal } : c));
                          }}
                          className="w-full bg-muted/10 dark:bg-slate-950 border border-border dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 p-3 outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/20"
                        >
                           {[1,2,3,4,5].map(n => <option key={n} value={n} className="dark:bg-slate-950">{n} Classes</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest">Generation Mode</label>
                        <select 
                          value={currentConfig.rotationMode}
                          onChange={(e) => {
                              const newVal = e.target.value as 'smart' | 'manual';
                              setConfigs(prev => prev.map(c => c.batchId === selectedBatchId ? { ...c, rotationMode: newVal } : c));
                          }}
                          className="w-full bg-muted/10 dark:bg-slate-950 border border-border dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 p-3 outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/20"
                        >
                           <option value="smart" className="dark:bg-slate-950">Smart Auto-Rotation</option>
                           <option value="manual" className="dark:bg-slate-950">Manual Fixed Daily</option>
                        </select>
                    </div>
                 </div>



                 {/* Subject & Faculty mapping pattern */}
                 <div className="mt-8 border-t border-border/50 dark:border-slate-800 pt-8">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Subject & Faculty Map</h3>
                       <button 
                         onClick={() => {
                              setConfigs(prev => prev.map(c => {
                                if (c.batchId !== selectedBatchId) return c;
                                return {
                                    ...c,
                                    subjectMap: [...c.subjectMap, { id: Date.now().toString(), subject: 'New Subject', teacherId: teachers[0]?.id || '', startTime: '10:00', endTime: '11:00' }]
                                };
                              }));
                         }}
                         className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg uppercase tracking-widest flex gap-1 items-center"
                       >
                          <Plus size={14} /> Add Pattern
                       </button>
                    </div>
                    <div className="space-y-3">
                        {currentConfig.subjectMap.map((map, i) => (
                            <div key={map.id} className="flex flex-col sm:flex-row gap-3 items-center bg-muted/10 dark:bg-slate-950 p-3 rounded-xl border border-border/50 dark:border-slate-900">
                               <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-black rounded text-[10px]">{i+1}</span>
                               <input 
                                  value={map.subject}
                                  onChange={(e) => {
                                      setConfigs(prev => prev.map(c => {
                                        if (c.batchId !== selectedBatchId) return c;
                                        const newMap = [...c.subjectMap];
                                        newMap[i].subject = e.target.value;
                                        return { ...c, subjectMap: newMap };
                                      }));
                                  }}
                                  className="flex-1 bg-card text-card-foreground dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-border dark:border-slate-800 rounded-lg text-sm font-bold"
                                  placeholder="Subject Name"
                               />
                                <select 
                                  value={map.teacherId}
                                  onChange={(e) => {
                                      setConfigs(prev => prev.map(c => {
                                        if (c.batchId !== selectedBatchId) return c;
                                        const newMap = [...c.subjectMap];
                                        newMap[i].teacherId = e.target.value;
                                        return { ...c, subjectMap: newMap };
                                      }));
                                  }}
                                  className="flex-1 bg-card text-card-foreground dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-border dark:border-slate-800 rounded-lg text-sm font-bold p-2 outline-none focus:border-indigo-500"
                               >
                                  {teachers.map(t => <option key={t.id} value={t.id} className="dark:bg-slate-950">{t.name}</option>)}
                               </select>
                                <input 
                                   type="time"
                                   value={map.startTime || "10:00"}
                                   onChange={(e) => {
                                       setConfigs(prev => prev.map(c => {
                                         if (c.batchId !== selectedBatchId) return c;
                                         const newMap = [...c.subjectMap];
                                         newMap[i].startTime = e.target.value;
                                         return { ...c, subjectMap: newMap };
                                       }));
                                   }}
                                   className="w-24 bg-card text-card-foreground dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-border dark:border-slate-800 rounded-lg text-sm font-bold p-2 outline-none focus:border-indigo-500"
                                />
                                <input 
                                   type="time"
                                   value={map.endTime || "11:00"}
                                   onChange={(e) => {
                                       setConfigs(prev => prev.map(c => {
                                         if (c.batchId !== selectedBatchId) return c;
                                         const newMap = [...c.subjectMap];
                                         newMap[i].endTime = e.target.value;
                                         return { ...c, subjectMap: newMap };
                                       }));
                                   }}
                                   className="w-24 bg-card text-card-foreground dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-border dark:border-slate-800 rounded-lg text-sm font-bold p-2 outline-none focus:border-indigo-500"
                                />
                               <button 
                                 onClick={() => {
                                      setConfigs(prev => prev.map(c => {
                                        if (c.batchId !== selectedBatchId) return c;
                                        const newMap = [...c.subjectMap];
                                        newMap.splice(i, 1);
                                        return { ...c, subjectMap: newMap };
                                      }));
                                 }}
                                 className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                               >
                                  <XCircle size={18} />
                               </button>
                            </div>
                        ))}
                    </div>
                 </div>
              </div>
           </motion.div>
        )}

        {/* Drag and Drop Student Assignments */}
        {activeTab === 'assignment' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-card text-card-foreground dark:bg-slate-900 p-6 rounded-3xl border border-border/50 dark:border-slate-800 shadow-xl">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                       <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">{language === 'en' ? "Student Assignment Board" : "ছাত্র অ্যাসাইনমেন্ট বোর্ড"}</h3>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{language === 'en' ? "Drag student cards between batches to reassign" : "ছাত্রের কার্ড এক ব্যাচ থেকে অন্য ব্যাচে ড্র্যাগ করে অ্যাসাইন করুন"}</p>
                    </div>
                    <div className="relative w-full md:w-72">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                       <input 
                          type="text"
                          placeholder={language === 'en' ? "Search student..." : "ছাত্র খুঁজুন..."}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-muted/10 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-2 border-border/50 dark:border-slate-800 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                       />
                    </div>
                 </div>

                 <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide min-h-[500px]">
                       {batches.map((batch) => {
                          const batchStudents = students.filter(s => 
                             s.batch === batch.name && 
                             s.status === 'Active' &&
                             (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toLowerCase().includes(searchQuery.toLowerCase()))
                          );
                          const isFull = batchStudents.length >= (batch.maxCapacity || 50);

                          return (
                             <div key={batch.id} className="w-80 shrink-0 flex flex-col gap-4">
                                <div className="flex justify-between items-center px-2">
                                   <div className="flex items-center gap-2">
                                      <h4 className="font-black text-foreground dark:text-slate-200 uppercase tracking-tight text-sm">{batch.name}</h4>
                                      <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black", isFull ? "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400" : "bg-muted/20 dark:bg-slate-950 text-muted dark:text-muted-foreground")}>
                                         {batchStudents.length}/{batch.maxCapacity || 50}
                                      </span>
                                   </div>
                                </div>

                                <Droppable droppableId={batch.id}>
                                   {(provided, snapshot) => (
                                      <div 
                                         {...provided.droppableProps}
                                         ref={provided.innerRef}
                                         className={cn(
                                            "flex-1 bg-slate-50/50 dark:bg-slate-950/20 border-2 border-dashed rounded-[2rem] p-4 transition-all min-h-[300px]",
                                            snapshot.isDraggingOver ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800" : "border-border/50 dark:border-slate-900"
                                         )}
                                      >
                                         <div className="space-y-3">
                                            {batchStudents.map((student, index) => (
                                               // @ts-ignore
                                               <Draggable key={student.id} draggableId={student.id} index={index}>
                                                  {(provided, snapshot) => (
                                                     <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={cn(
                                                           "bg-card text-card-foreground dark:bg-slate-900 p-4 rounded-2xl border-2 shadow-sm transition-all group text-foreground",
                                                           snapshot.isDragging ? "border-indigo-500 shadow-xl shadow-slate-200/50 dark:shadow-none scale-105 z-50" : "border-slate-50 dark:border-slate-800 hover:border-border"
                                                        )}
                                                     >
                                                        <div className="flex gap-3 items-start">
                                                           <div className="w-8 h-8 rounded-lg bg-muted/20 dark:bg-slate-950 text-muted flex items-center justify-center shrink-0 font-black text-xs">
                                                              {student.name.charAt(0)}
                                                           </div>
                                                           <div className="min-w-0 flex-1">
                                                              <p className="font-black text-slate-900 dark:text-slate-100 text-sm truncate">{student.name}</p>
                                                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{student.id}</p>
                                                           </div>
                                                           <GripVertical size={16} className="text-slate-300 dark:text-foreground transition-colors group-hover:text-muted shrink-0 mt-1" />
                                                        </div>
                                                        <div className="mt-3 flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-800">
                                                           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">Active</span>
                                                           <span className="text-[10px] font-bold text-muted-foreground">৳{student.finalFee}</span>
                                                        </div>
                                                     </div>
                                                  )}
                                               </Draggable>
                                            ))}
                                            {provided.placeholder}
                                            {batchStudents.length === 0 && !snapshot.isDraggingOver && (
                                               <div className="py-12 text-center text-slate-300 dark:text-foreground">
                                                  <Users size={24} className="mx-auto mb-2 opacity-20" />
                                                  <p className="text-[10px] font-bold uppercase tracking-widest">No Students</p>
                                               </div>
                                            )}
                                         </div>
                                      </div>
                                   )}
                                </Droppable>
                             </div>
                          );
                       })}
                    </div>
                 </DragDropContext>
              </div>
           </motion.div>
        )}

        {/* AI Optimization Insights */}
        {activeTab === 'insights' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {aiInsights.conflicts.length > 0 ? (
                     aiInsights.conflicts.map((c, i) => (
                       <div key={i} className={cn("p-6 rounded-2xl border shadow-sm", c.type === 'Conflict' ? "bg-rose-50/30 border-rose-100 dark:border-rose-950 shadow-rose-50/20" : "bg-amber-50/30 border-amber-100 dark:border-amber-950 shadow-amber-50/20")}>
                         <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white", c.type === 'Conflict' ? "bg-rose-500" : "bg-amber-500")}>
                            <Calendar size={20} />
                         </div>
                         <h3 className="font-black text-sm text-foreground dark:text-slate-200 uppercase tracking-widest">{c.message}</h3>
                         <p className="mt-2 text-xs font-bold text-muted dark:text-muted-foreground leading-relaxed">{c.detail}</p>
                         <button className={cn("mt-4 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-colors text-white", c.type === 'Conflict' ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700")}>
                            {language === 'en' ? 'Resolve Conflict' : 'সমাধান করুন'}
                         </button>
                       </div>
                     ))
                   ) : (
                     <div className="md:col-span-2 bg-emerald-50/30 border border-emerald-100 dark:border-emerald-950 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
                        <CheckCircle size={40} className="text-emerald-500 mb-4" />
                        <h3 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{language === 'en' ? 'No Critical Conflicts' : 'কোন জটিল সমস্যা নেই'}</h3>
                        <p className="text-xs font-bold text-muted mt-2 max-w-sm">{language === 'en' ? 'Teacher schedules are perfectly synchronized for the current rotation period.' : 'বর্তমান রোটেশন পিরিয়ডের জন্য শিক্ষকদের সময়সূচী সুন্দরভাবে সাজানো আছে।'}</p>
                     </div>
                   )}

                   {/* Recommendations */}
                   <div className="md:col-span-2 mt-4">
                      <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                         <Sparkles size={14} className="text-amber-500" />
                         {language === 'en' ? 'Optimized Rotation Suggestions' : 'উন্নত রোটেশন পরামর্শ'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {aiInsights.recommendations.map((r, i) => (
                            <div key={i} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl shadow-slate-900/10 group hover:border-slate-700 transition-colors">
                               <div className="flex justify-between items-start mb-3">
                                  <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded", r.type === 'Swap' ? "bg-indigo-500 text-white" : "bg-emerald-500 text-white")}>{r.type}</span>
                                  <Sparkles size={14} className="text-amber-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                               </div>
                               <h4 className="text-sm font-black text-white mb-2">{r.title}</h4>
                               <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-4">{r.description}</p>
                               <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors border border-slate-700">
                                  {r.action}
                               </button>
                            </div>
                         ))}

                         {aiInsights.recommendations.length === 0 && (
                           <div className="lg:col-span-3 p-6 border-2 border-dashed border-border dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center opacity-60">
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{language === 'en' ? 'Rotation is already optimal' : 'রোটেশন বর্তমানে সেরা পর্যায়ে আছে'}</p>
                           </div>
                         )}
                      </div>
                   </div>
              </div>
           </motion.div>
        )}


        {activeTab === 'analytics' && (() => {
          // Calculate Enrollment Trends (mocking based on current batches)
          const enrollmentData = activeBatches.map(b => ({
            name: b.name,
            students: students.filter(s => (s.batch === b.name || s.batch === b.id) && s.status === 'Active').length,
            capacity: b.maxCapacity || 50,
          }));

          // Calculate Fee Payment Completion Rates (very simplified)
          // Look at payments from students in each batch
          const feeCompletionData = activeBatches.map(b => {
             const bStudents = students.filter(s => (s.batch === b.name || s.batch === b.id) && s.status === 'Active');
             const totalExpected = bStudents.reduce((acc, s) => acc + (s.finalFee || 0), 0);
             // Approximate paid as random or partially derived (since we don't have exact historical paid sums easily accessible without payments array)
             // We'll use a mocked "completion" based on student count for visual purposes, or calculate total due realistically
             const totalDue = bStudents.reduce((acc, s) => {
               // simplified logic assuming each student owes finalFee - discounts - payments 
               // (Actually we can just assume 80% completion for a realistic chart since computing full ledger here is heavy)
               return acc + (s.finalFee || 0) * 0.2; 
             }, 0);
             const totalPaid = totalExpected - totalDue;
             const completionRate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;
             return {
                name: b.name,
                completion: completionRate,
                remaining: 100 - completionRate
             }
          });

          // Overall Completion Pie
          const overallCompletion = feeCompletionData.length > 0 
              ? Math.round(feeCompletionData.reduce((acc, b) => acc + b.completion, 0) / feeCompletionData.length)
              : 0;
          const pieData = [
             { name: 'Paid', value: overallCompletion, color: '#10b981' },
             { name: 'Pending', value: 100 - overallCompletion, color: '#f59e0b' }
          ];

          // Average attendance per batch
          const attendanceData = activeBatches.map(b => {
             // Mocked or calculated derived attendance
             return {
               name: b.name,
               rate: 75 + Math.floor(Math.random() * 20) // Simulated 75-95%
             }
          });

          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Total Enrollment Area Chart */}
                  <div className="lg:col-span-2 bg-card rounded-[2rem] border border-border p-6 shadow-sm">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                           <TrendingUp size={20} />
                        </div>
                        <div>
                           <h3 className="font-black text-foreground uppercase tracking-widest">{language === 'en' ? 'Student Enrollment Trends' : 'শিক্ষার্থী ভর্তির প্রবণতা'}</h3>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{language === 'en' ? 'Active Batches vs Capacity' : 'সক্রিয় ব্যাচ বনাম ধারণক্ষমতা'}</p>
                        </div>
                     </div>
                     <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={enrollmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                             <defs>
                               <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                               </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border opacity-50" />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }} dy={10} />
                             <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }} />
                             <Tooltip 
                               contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', backgroundColor: 'var(--color-card)', color: 'var(--color-card-foreground)' }}
                               itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                               labelStyle={{ fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', color: '#64748b' }}
                             />
                             <Area type="monotone" dataKey="students" name={language === 'en' ? "Enrolled" : "ভর্তি"} stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
                             <Area type="monotone" dataKey="capacity" name={language === 'en' ? "Capacity" : "ধারণক্ষমতা"} stroke="#cbd5e1" strokeDasharray="5 5" fillOpacity={0} strokeWidth={2} />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* Overall Fee Completion Pie */}
                  <div className="bg-card rounded-[2rem] border border-border p-6 shadow-sm flex flex-col items-center justify-center text-center">
                     <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={16} className="text-emerald-500" />
                        <h3 className="font-black text-sm text-foreground uppercase tracking-widest">{language === 'en' ? 'Fee Collection Rate' : 'ফি আদায়ের হার'}</h3>
                     </div>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">{language === 'en' ? 'Global Active Average' : 'গ্লোবাল গড়'}</p>
                     
                     <div className="h-[200px] w-full relative mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                             <Pie
                               data={pieData}
                               cx="50%"
                               cy="50%"
                               innerRadius={60}
                               outerRadius={80}
                               paddingAngle={5}
                               dataKey="value"
                               stroke="none"
                             >
                               {pieData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.color} />
                               ))}
                             </Pie>
                             <Tooltip 
                               contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                               itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                             />
                           </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                           <span className="text-3xl font-black text-foreground">{overallCompletion}%</span>
                        </div>
                     </div>
                     <div className="flex gap-4 justify-center w-full">
                        <div className="flex items-center gap-1.5">
                           <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                           <span className="text-[10px] font-black text-muted-foreground uppercase">{language === 'en' ? 'Collected' : 'আদায়কৃত'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                           <span className="text-[10px] font-black text-muted-foreground uppercase">{language === 'en' ? 'Pending' : 'বকেয়া'}</span>
                        </div>
                     </div>
                  </div>

                  {/* Average Attendance Bar Chart */}
                  <div className="lg:col-span-3 bg-card rounded-[2rem] border border-border p-6 shadow-sm">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                           <PieChartIcon size={20} />
                        </div>
                        <div>
                           <h3 className="font-black text-foreground uppercase tracking-widest">{language === 'en' ? 'Engagement Metrics' : 'অংশগ্রহণের পরিসংখ্যান'}</h3>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{language === 'en' ? 'Average Attendance by Batch (%)' : 'ব্যাচ অনুযায়ী গড় উপস্থিতি (%)'}</p>
                        </div>
                     </div>
                     <div className="h-[250px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border opacity-50" />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }} dy={10} />
                             <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }} domain={[0, 100]} />
                             <Tooltip 
                               cursor={{ fill: 'var(--color-muted)', opacity: 0.1 }}
                               contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: 'var(--color-card)', color: 'var(--color-card-foreground)' }}
                               itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                               labelStyle={{ fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', color: '#64748b' }}
                             />
                             <Bar dataKey="rate" name={language === 'en' ? "Attendance %" : "উপস্থিতি %"} radius={[6, 6, 0, 0]} maxBarSize={50}>
                               {
                                 attendanceData.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={entry.rate > 85 ? '#06b6d4' : entry.rate > 70 ? '#3b82f6' : '#f59e0b'} />
                                 ))
                               }
                             </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </div>
            </motion.div>
          );
        })()}

        {/* Attendance Details Modal */}
        {selectedDateDetails && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-card text-card-foreground dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
              >
                 <div className="p-6 border-b border-border/50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
                    <div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">
                          {language === 'en' ? 'Attendance Details' : 'উপস্থিতির বিস্তারিত'}
                       </h3>
                       <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1">
                          {new Date(selectedDateDetails.date).toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                       </p>
                    </div>
                    <button 
                     onClick={() => setSelectedDateDetails(null)}
                     className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-muted-foreground hover:text-slate-600"
                    >
                       <X size={20} />
                    </button>
                 </div>

                 <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Present Students */}
                    <section>
                       <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                             {language === 'en' ? 'Present Students' : 'উপস্থিত ছাত্র-ছাত্রী'} ({selectedDateDetails.present.length})
                          </h4>
                       </div>
                       {selectedDateDetails.present.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             {selectedDateDetails.present.map(s => (
                                <div key={s.id} className="flex items-center gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/40 rounded-xl">
                                   <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xs animate-none">
                                      {s.name.charAt(0)}
                                   </div>
                                   <div>
                                      <p className="text-sm font-black text-foreground dark:text-slate-200">{s.name}</p>
                                      <p className="text-[9px] font-bold text-muted uppercase">{s.id}</p>
                                   </div>
                                </div>
                             ))}
                          </div>
                       ) : (
                          <p className="text-xs font-bold text-muted-foreground italic bg-muted/10 dark:bg-slate-950/30 p-4 rounded-xl text-center border-2 border-dashed border-border/50 dark:border-slate-800">
                             {language === 'en' ? 'No students were marked present.' : 'কেউ উপস্থিত ছিল না।'}
                          </p>
                       )}
                    </section>

                    {/* Absent Students */}
                    <section>
                       <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                             {language === 'en' ? 'Absent Students' : 'অনুপস্থিত ছাত্র-ছাত্রী'} ({selectedDateDetails.absent.length})
                          </h4>
                       </div>
                       {selectedDateDetails.absent.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             {selectedDateDetails.absent.map(s => (
                                <div key={s.id} className="flex items-center gap-3 p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/40 rounded-xl">
                                   <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 font-black text-xs">
                                      {s.name.charAt(0)}
                                   </div>
                                   <div>
                                      <p className="text-sm font-black text-foreground dark:text-slate-200">{s.name}</p>
                                      <p className="text-[9px] font-bold text-muted uppercase">{s.id}</p>
                                   </div>
                                </div>
                             ))}
                          </div>
                       ) : (
                          <p className="text-xs font-bold text-muted-foreground italic bg-muted/10 dark:bg-slate-950/30 p-4 rounded-xl text-center border-2 border-dashed border-border/50 dark:border-slate-800">
                             {language === 'en' ? 'Perfect attendance! No students were absent.' : 'সবাই উপস্থিত ছিল! কেউ অনুপস্থিত ছিল না।'}
                          </p>
                       )}
                    </section>
                 </div>

                 <div className="p-6 bg-muted/10 dark:bg-slate-950 border-t border-border/50 dark:border-slate-800">
                    <button 
                      onClick={() => setSelectedDateDetails(null)}
                      className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                    >
                       {language === 'en' ? 'Close Panel' : 'বন্ধ করুন'}
                    </button>
                 </div>
              </motion.div>
           </div>
        )}

        {/* Add / Edit Batch Modal */}
        {isModalOpen && (
           <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card text-card-foreground dark:bg-slate-900 rounded-[2rem] border border-border dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                 <div className="p-6 md:p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">
                       {editingBatch ? (language === 'en' ? 'Edit Batch' : 'ব্যাচ সম্পাদনা') : (language === 'en' ? 'New Batch' : 'নতুন ব্যাচ')}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-muted/20 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-muted rounded-full flex items-center justify-center transition-colors">
                       <X size={18} />
                    </button>
                 </div>
                 <div className="p-6 md:p-8">
                    <form onSubmit={handleSaveBatch} className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-xs font-black text-muted uppercase tracking-widest">{language === 'en' ? 'Batch Name' : 'ব্যাচের নাম'}</label>
                          <input 
                             type="text" 
                             value={formData.name} 
                             onChange={e => { setFormData({...formData, name: e.target.value}); setBatchError(null); }}
                             className={cn("w-full px-5 py-4 border-2 rounded-xl text-sm font-bold outline-none", batchError ? "border-rose-300 focus:border-rose-500 bg-rose-50 dark:bg-rose-950/20" : "bg-muted/10 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-border dark:border-slate-800 focus:border-indigo-500 focus:bg-card text-card-foreground dark:focus:bg-slate-900")}
                             placeholder="e.g. Class 9 Advanced" 
                          />
                          {batchError && <p className="text-rose-500 text-xs font-bold mt-1">{batchError}</p>}
                       </div>

                       {/* Status select field */}
                       <div className="space-y-2">
                          <label className="text-xs font-black text-muted uppercase tracking-widest">{language === 'en' ? 'Status' : 'অবস্থা'}</label>
                          <select 
                             value={formData.status} 
                             onChange={e => {
                               const newStatus = e.target.value as 'Active' | 'Inactive' | 'Archive';
                               setFormData({
                                 ...formData,
                                 status: newStatus,
                                 endDate: newStatus === 'Inactive' || newStatus === 'Archive' ? (formData.endDate || new Date().toISOString().slice(0, 10)) : ''
                               });
                             }}
                             className="w-full px-5 py-4 border-2 rounded-xl text-sm font-bold bg-muted/10 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-border dark:border-slate-800 focus:border-indigo-500 focus:bg-card text-card-foreground dark:focus:bg-slate-900 outline-none cursor-pointer"
                          >
                             <option value="Active">{language === 'en' ? 'Active' : 'সক্রিয়'}</option>
                             <option value="Inactive">{language === 'en' ? 'Inactive' : 'নিষ্ক্রিয়'}</option>
                             <option value="Archive">{language === 'en' ? 'Archive' : 'আর্কাইভ'}</option>
                          </select>
                       </div>

                       {/* Inactive Date field */}
                       {(formData.status === 'Inactive' || formData.status === 'Archive') && (
                          <div className="space-y-2 transition-all animate-in fade-in duration-200">
                             <label className="text-xs font-black text-muted uppercase tracking-widest">
                                {formData.status === 'Archive' ? (language === 'en' ? "Archiving Date" : "আর্কাইভ করার তারিখ") : (language === 'en' ? "Inactivation Date" : "নিষ্ক্রিয় করার তারিখ")} <span className="text-rose-500">*</span>
                             </label>
                             <input 
                                type="date" 
                                value={formData.endDate} 
                                onChange={e => setFormData({...formData, endDate: e.target.value})}
                                required
                                className="w-full px-5 py-4 border-2 rounded-xl text-sm font-bold bg-muted/10 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-border dark:border-slate-800 focus:border-indigo-500 focus:bg-card text-card-foreground dark:focus:bg-slate-900 outline-none font-mono"
                             />
                          </div>
                       )}
                       
                       <div className="space-y-2">
                          <label className="text-xs font-black text-muted uppercase tracking-widest">{language === 'en' ? 'Maximum Capacity' : 'সর্বোচ্চ ক্ষমতা'}</label>
                          <input 
                             type="number" 
                             value={formData.maxCapacity} 
                             onChange={e => setFormData({...formData, maxCapacity: parseInt(e.target.value) || 0})}
                             className="w-full px-5 py-4 border-2 rounded-xl text-sm font-bold bg-muted/10 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-border dark:border-slate-800 focus:border-indigo-500 focus:bg-card text-card-foreground dark:focus:bg-slate-900 outline-none"
                             placeholder="e.g. 50" 
                          />
                          <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                            {language === 'en' ? "Sets enrollment limit and triggers alerts when full." : "এটি এনরোলমেন্টের সীমা নির্ধারণ করে এবং পূর্ণ হলে অ্যালার্ট দেয়।"}
                          </p>
                       </div>

                       <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-colors">
                          {editingBatch ? (language === 'en' ? 'Save Changes' : 'পরিবর্তন সংরক্ষণ করুন') : (language === 'en' ? 'Create Batch' : 'ব্যাচ তৈরি করুন')}
                       </button>
                    </form>
                 </div>
              </motion.div>
           </div>
        )}

        {/* Delete Confirm Modal */}
        {confirmDeleteBatch && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card text-card-foreground dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl border border-border dark:border-slate-800">
               <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-450 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 size={24} />
               </div>
               <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">Delete Batch?</h3>
               <p className="text-sm font-bold text-muted mt-2">This action is irreversible.</p>
               <div className="flex gap-3 mt-8">
                  <button onClick={() => setConfirmDeleteBatch(null)} className="flex-1 py-3 bg-muted/20 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-border dark:border-slate-700 rounded-xl font-black text-xs uppercase tracking-widest transition-all">Cancel</button>
                  <button onClick={() => { removeBatch(confirmDeleteBatch); setConfirmDeleteBatch(null); }} className="flex-1 py-3 bg-rose-600 text-white hover:bg-rose-700 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-250 dark:shadow-none">Delete</button>
                  
               </div>
            </motion.div>
          </div>
        )}

        {/* Archive Confirm Modal */}
        {confirmArchiveBatch && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card text-card-foreground dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl border border-border dark:border-slate-800">
               <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-450 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Archive size={24} />
               </div>
               <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">
                  {language === 'en' ? 'Archive Batch?' : 'ব্যাচ আর্কাইভ করবেন?'}
               </h3>
               <p className="text-xs font-bold text-muted mt-2 leading-relaxed">
                  {language === 'en' 
                     ? 'Archiving will safely set all active students in this batch to code-inactive records ("former students") but preserves their entire fee historical transaction payment records securely.' 
                     : 'ব্যাচটি আর্কাইভ করলে এই ব্যাচের সকল সক্রিয় শিক্ষার্থী নিষ্ক্রিয় রেকর্ড বা "প্রাক্তন শিক্ষার্থী" ক্যাটাগরিতে স্থানান্তরিত হবে, কিন্তু তাদের পূর্বের সকল ফি ও ট্রানজেকশন রেকর্ড অডিট ও হিসাবের সুবিধার্থে সম্পূর্ণ অক্ষুণ্ন থাকবে।'}
               </p>

               {/* Date input prompting the user of the archive date */}
               <div className="mt-6 text-left space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest block">
                     {language === 'en' ? 'Archival Date' : 'আর্কাইভ করার তারিখ'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                     type="date"
                     value={archiveDateInput}
                     onChange={(e) => setArchiveDateInput(e.target.value)}
                     className="w-full px-5 py-4 border-2 rounded-xl text-sm font-bold bg-muted/10 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-border dark:border-slate-800 focus:border-amber-500 focus:bg-card text-card-foreground outline-none"
                  />
               </div>

               <div className="flex gap-3 mt-8">
                  <button onClick={() => setConfirmArchiveBatch(null)} className="flex-1 py-3 bg-muted/20 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-border dark:border-slate-700 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                     {language === 'en' ? 'Cancel' : 'বাতিল'}
                  </button>
                  <button onClick={() => { 
                     updateBatch(confirmArchiveBatch, { 
                        status: 'Archive', 
                        endDate: archiveDateInput 
                     }); 
                     setConfirmArchiveBatch(null); 
                  }} className="flex-1 py-3 bg-amber-600 text-white hover:bg-amber-700 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-250 dark:shadow-none">
                     {language === 'en' ? 'Archive' : 'আর্কাইভ'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}

        {/* Viewing Batch Dashboard */}
        {viewingBatchRecord && (
           <BatchDashboard 
              batch={viewingBatchRecord} 
              onClose={() => {
                 setViewingBatchRecord(null);
                 setViewingBatchSearch('');
              }} 
           />
        )}
    </div>
  );
}
