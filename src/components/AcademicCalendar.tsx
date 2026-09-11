import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  CalendarDays, 
  AlertCircle, 
  BadgeHelp,
  Clock, 
  Tag, 
  Sparkles, 
  X, 
  CheckCircle, 
  PlusCircle, 
  BookOpen, 
  DollarSign, 
  Coffee,
  Edit2
} from 'lucide-react';
import { CalendarEvent, Batch } from '../types';
import { cn } from '../lib/utils';
import { useAppContext } from '../store/AppContext';

interface AcademicCalendarProps {
  language: 'en' | 'bn';
  batches: Batch[];
}

export default function AcademicCalendar({ language, batches }: AcademicCalendarProps) {
  const { calendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = useAppContext();

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 3)); // Initialize at June 3, 2026 (matching system date)
  const [selectedDay, setSelectedDay] = useState<number | null>(3); // Default selected June 3
  
  // Modal/Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formType, setFormType] = useState<'holiday' | 'exam' | 'deadline' | 'other'>('holiday');
  const [formDescription, setFormDescription] = useState('');
  const [formBatch, setFormBatch] = useState('All Batches');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Translations
  const t = {
    en: {
      academicCalendar: 'Academic & Admin Calendar',
      subtitle: 'Coordinator hub for exams, payment deadlines, and holidays',
      holiday: 'Holiday',
      exam: 'Exam Date',
      deadline: 'Payment Deadline',
      other: 'Other Administrative',
      allBatches: 'All Batches',
      addEvent: 'Create Event',
      editEvent: 'Edit Event',
      save: 'Save Event',
      cancel: 'Cancel',
      delete: 'Delete',
      titleLabel: 'Event Title',
      typeLabel: 'Event Category',
      dateLabel: 'Event Date',
      batchLabel: 'Target Class / Group',
      descLabel: 'Description / Notes',
      noEvents: 'No planning items recorded for this date.',
      upcomingEvents: 'Upcoming Actions This Month',
      prevMonth: 'Previous Month',
      nextMonth: 'Next Month',
      jan: 'January', feb: 'February', mar: 'March', apr: 'April', may: 'May', jun: 'June',
      jul: 'July', aug: 'August', sep: 'September', oct: 'October', nov: 'November', dec: 'December',
      sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
      formTitlePlaceholder: 'E.g., Second Sem Trigonometry Recit',
      staffCoordinator: 'Staff Coordinator',
      created: 'Created by',
      actions: 'Administrative Activities',
      totalThisMonth: 'scheduled items in',
      successCreated: 'Event scheduled successfully!',
      successUpdated: 'Event revised successfully!',
      successDeleted: 'Event cancelled / removed.'
    },
    bn: {
      academicCalendar: 'একাডেমিক ও প্রশাসনিক ক্যালেন্ডার',
      subtitle: 'পরীক্ষা, বেতন প্রদানের সময়সীমা এবং ছুটির সমন্বয় কেন্দ্র',
      holiday: 'ছুটির দিন',
      exam: 'পরীক্ষার তারিখ',
      deadline: 'ফি পরিশোধের শেষ দিন',
      other: 'অন্যান্য প্রশাসনিক',
      allBatches: 'সকল ব্যাচ',
      addEvent: 'নতুন ইভেন্ট',
      editEvent: 'ইভেন্ট সংশোধন',
      save: 'ইভেন্ট সংরক্ষণ',
      cancel: 'বাতিল',
      delete: 'মুছে ফেলুন',
      titleLabel: 'ইভেন্টের শিরোনাম',
      typeLabel: 'ইভেন্ট ক্যাটাগরি',
      dateLabel: 'অনুষ্ঠানের তারিখ',
      batchLabel: 'টার্গেট ব্যাচ / শ্রেণী',
      descLabel: 'বিবরণ / নোট',
      noEvents: 'এই তারিখে কোনো নির্ধারিত ইভেন্ট নেই।',
      upcomingEvents: 'এই মাসের আসন্ন নির্ধারিত বিষয়সমূহ',
      prevMonth: 'পূর্ববর্তী মাস',
      nextMonth: 'পরবর্তী মাস',
      jan: 'জানুয়ারী', feb: 'ফেব্রুয়ারী', mar: 'মার্চ', apr: 'এপ্রিল', may: 'মে', jun: 'জুন',
      jul: 'জুলাই', aug: 'আগস্ট', sep: 'সেপ্টেম্বর', oct: 'অক্টোবর', nov: 'নভেম্বর', dec: 'ডিসেম্বর',
      sun: 'রবি', mon: 'সোম', tue: 'মঙ্গল', wed: 'বুধ', thu: 'বৃহঃ', fri: 'শুক্র', sat: 'শনি',
      formTitlePlaceholder: 'যেমন: ২য় সেমিস্টার ত্রিকোণমিতি পরীক্ষা',
      staffCoordinator: 'স্টাফ সমন্বয়কারী',
      created: 'তৈরি করেছেন',
      actions: 'প্রশাসনিক কার্যক্রম',
      totalThisMonth: 'টি প্রোগ্রাম রয়েছে',
      successCreated: 'ইভেন্টটি সফলভাবে যোগ করা হয়েছে!',
      successUpdated: 'ইভেন্টটি সফলভাবে সংশোধন করা হয়েছে!',
      successDeleted: 'ইভেন্টটি মুছে ফেলা হয়েছে।'
    }
  }[language];

  const monthNames = [
    t.jan, t.feb, t.mar, t.apr, t.may, t.jun,
    t.jul, t.aug, t.sep, t.oct, t.nov, t.dec
  ];

  const daysOfWeek = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];

  // Helper date conversions
  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const firstDayIndex = useMemo(() => {
    return new Date(year, month, 1).getDay();
  }, [year, month]);

  // Handle Month Switch
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(1);
  };

  // Safe checks & filtering on calendarEvents
  const processedEvents = useMemo(() => {
    return (calendarEvents || []).map(evt => {
      // Parse dates safely YYYY-MM-DD
      const dateParts = evt.date.split('-');
      const evtYear = parseInt(dateParts[0]);
      const evtMonth = parseInt(dateParts[1]) - 1; // 0-indexed
      const evtDay = parseInt(dateParts[2]);

      return {
        ...evt,
        parsedYear: evtYear,
        parsedMonth: evtMonth,
        parsedDay: evtDay
      };
    });
  }, [calendarEvents]);

  // Selected date full string: YYYY-MM-DD format
  const selectedDateStr = useMemo(() => {
    if (selectedDay === null) return '';
    const dStr = String(selectedDay).padStart(2, '0');
    const mStr = String(month + 1).padStart(2, '0');
    return `${year}-${mStr}-${dStr}`;
  }, [selectedDay, month, year]);

  // Selected Day's events
  const selectedDayEvents = useMemo(() => {
    if (selectedDay === null) return [];
    return processedEvents.filter(
      evt => evt.parsedYear === year && evt.parsedMonth === month && evt.parsedDay === selectedDay
    );
  }, [processedEvents, selectedDay, year, month]);

  // Current Month's events
  const currentMonthEvents = useMemo(() => {
    return processedEvents.filter(
      evt => evt.parsedYear === year && evt.parsedMonth === month
    ).sort((a, b) => a.date.localeCompare(b.date));
  }, [processedEvents, year, month]);

  // Check if a day has events of certain type
  const getDayEventStatus = (day: number) => {
    const dayEvts = processedEvents.filter(
      evt => evt.parsedYear === year && evt.parsedMonth === month && evt.parsedDay === day
    );

    return {
      hasHoliday: dayEvts.some(e => e.type === 'holiday'),
      hasExam: dayEvts.some(e => e.type === 'exam'),
      hasDeadline: dayEvts.some(e => e.type === 'deadline'),
      hasOther: dayEvts.some(e => e.type === 'other'),
      count: dayEvts.length,
      events: dayEvts
    };
  };

  // Form handling
  const handleOpenNewForm = (dayNum?: number) => {
    setEditingEventId(null);
    setFormTitle('');
    
    // Default to the selected day if available
    const targetDay = dayNum || selectedDay || 3;
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(targetDay).padStart(2, '0');
    setFormDate(`${year}-${mStr}-${dStr}`);
    
    setFormType('holiday');
    setFormDescription('');
    setFormBatch('All Batches');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (evt: CalendarEvent) => {
    setEditingEventId(evt.id);
    setFormTitle(evt.title);
    setFormDate(evt.date);
    setFormType(evt.type);
    setFormDescription(evt.description || '');
    setFormBatch(evt.batchName || 'All Batches');
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;

    const eventPayload = {
      title: formTitle,
      date: formDate,
      type: formType,
      description: formDescription,
      batchName: formBatch,
      createdBy: language === 'en' ? 'Administrative staff' : 'প্রশাসনিক সহকারী',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    if (editingEventId) {
      updateCalendarEvent(editingEventId, eventPayload);
    } else {
      addCalendarEvent(eventPayload);
    }

    // Set selectedDay to match the date added/edited
    const addedDay = parseInt(formDate.split('-')[2]);
    if (!isNaN(addedDay)) {
      setSelectedDay(addedDay);
      // If the month/year of the form matches, adjust current month view
      const addedYr = parseInt(formDate.split('-')[0]);
      const addedM = parseInt(formDate.split('-')[1]) - 1;
      if (addedYr !== year || addedM !== month) {
        setCurrentDate(new Date(addedYr, addedM, 1));
      }
    }

    setIsFormOpen(false);
    setEditingEventId(null);
  };

  const handleDeleteEvent = (id: string) => {
    deleteCalendarEvent(id);
  };

  // Icon selector based on Calendar Type
  const getTypeMeta = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'holiday':
        return {
          icon: <Coffee className="text-purple-600 dark:text-purple-400" size={16} />,
          badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-100 dark:border-purple-900/30',
          dotBg: 'bg-purple-500',
          label: t.holiday
        };
      case 'exam':
        return {
          icon: <BookOpen className="text-amber-600 dark:text-amber-400" size={16} />,
          badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-100 dark:border-amber-900/30',
          dotBg: 'bg-amber-500',
          label: t.exam
        };
      case 'deadline':
        return {
          icon: <DollarSign className="text-rose-600 dark:text-rose-400" size={16} />,
          badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-100 dark:border-rose-900/30',
          dotBg: 'bg-rose-500',
          label: t.deadline
        };
      default:
        return {
          icon: <CalendarDays className="text-indigo-600 dark:text-indigo-400" size={16} />,
          badgeBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/30',
          dotBg: 'bg-indigo-500',
          label: t.other
        };
    }
  };

  return (
    <div className="bg-card border border-border rounded-[2.5rem] shadow-xl overflow-hidden" id="dashboard-academic-calendar">
      
      {/* Top Banner Header */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-slate-50 to-indigo-50/20 dark:from-slate-900/50 dark:to-slate-950/10 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/10">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
              {t.academicCalendar}
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-[9px] font-black tracking-widest text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-950/40">
                ACTIVE
              </span>
            </h3>
            <p className="text-xs text-muted font-bold tracking-tight uppercase">
              {t.subtitle}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenNewForm()}
          className="px-5 py-2.5 bg-slate-950 dark:bg-indigo-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-slate-950/10 dark:shadow-indigo-900/10"
        >
          <Plus size={16} />
          {t.addEvent}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Side: Calendar Grid Panel (7 columns) */}
        <div className="lg:col-span-7 p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-border">
          
          {/* Calendar Month Header Control */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight italic">
                {monthNames[month]}
              </span>
              <span className="font-mono text-base md:text-lg text-muted font-black">
                {year}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                aria-label={t.prevMonth}
                className="p-2 hover:bg-muted font-bold text-foreground hover:text-indigo-600 rounded-xl transition-all border border-border"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextMonth}
                aria-label={t.nextMonth}
                className="p-2 hover:bg-muted font-bold text-foreground hover:text-indigo-600 rounded-xl transition-all border border-border"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Grid Layout: Days of Week */}
          <div className="grid grid-cols-7 gap-1.5 md:gap-2 mb-2 text-center">
            {daysOfWeek.map((day, dIdx) => (
              <div 
                key={day} 
                className={cn(
                  "text-[10px] md:text-xs font-black uppercase tracking-wider text-muted py-2",
                  dIdx === 5 && "text-rose-500/70" // highlight friday/weekend visually depending on region
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid Layout: Dates */}
          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            
            {/* Empty boxes for offset days */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div 
                key={`empty-${idx}`} 
                className="aspect-square rounded-2xl bg-slate-50/40 dark:bg-slate-900/10 border border-border/50/50 dark:border-slate-800/10 opacity-30" 
              />
            ))}

            {/* Days boxes */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNumber = idx + 1;
              const isSelected = selectedDay === dayNumber;
              const status = getDayEventStatus(dayNumber);
              const isToday = new Date().getDate() === dayNumber && new Date().getMonth() === month && new Date().getFullYear() === year;

              return (
                <button
                  key={`day-${dayNumber}`}
                  onClick={() => setSelectedDay(dayNumber)}
                  className={cn(
                    "aspect-square rounded-2xl border transition-all duration-200 relative flex flex-col justify-between p-2 group",
                    isSelected 
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.03]" 
                      : isToday
                        ? "border-amber-500 bg-amber-500/5 dark:bg-amber-400/5 text-foreground ring-1 ring-amber-400/30"
                        : "border-border hover:border-slate-300 dark:hover:border-slate-700 bg-card hover:bg-muted/10 text-foreground"
                  )}
                >
                  <span className={cn(
                    "text-xs md:text-sm font-black font-mono leading-none block",
                    isSelected ? "text-white" : isToday ? "text-amber-600 dark:text-amber-400" : "text-foreground dark:text-slate-300"
                  )}>
                    {dayNumber}
                  </span>

                  {/* Dot status panel */}
                  <div className="flex gap-1 flex-wrap justify-end">
                    {status.hasHoliday && (
                      <span className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-card text-card-foreground" : "bg-purple-500")} />
                    )}
                    {status.hasExam && (
                      <span className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-card text-card-foreground" : "bg-amber-500")} />
                    )}
                    {status.hasDeadline && (
                      <span className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-card text-card-foreground" : "bg-rose-500")} />
                    )}
                    {status.hasOther && (
                      <span className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-card text-card-foreground" : "bg-indigo-500")} />
                    )}
                  </div>

                  {/* Count indicator on hover */}
                  {status.count > 0 && !isSelected && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 border border-slate-700 text-[8px] font-black text-white scale-0 group-hover:scale-100 transition-all">
                      {status.count}
                    </span>
                  )}
                </button>
              );
            })}

          </div>

          {/* Quick Categories Legend */}
          <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-4 items-center justify-start text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 block" />
              <span>{t.holiday}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" />
              <span>{t.exam}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block" />
              <span>{t.deadline}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 block" />
              <span>{t.other}</span>
            </div>
          </div>

        </div>

        {/* Right Side: Event Details & Action Panel (5 columns) */}
        <div className="lg:col-span-5 p-6 md:p-8 bg-slate-50/30 dark:bg-slate-900/10 flex flex-col justify-between">
          
          <div className="space-y-6">
            
            {/* Panel Selected Day Header */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                {language === 'en' ? 'SELECTED DATE' : 'নির্বাচিত তারিখ'}
              </span>
              <div className="flex justify-between items-center mt-1">
                <h4 className="text-base md:text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                  {selectedDay ? `${monthNames[month]} ${selectedDay}, ${year}` : 'Select a date'}
                  <span className="text-xs font-bold text-indigo-600 font-mono">
                    ({selectedDateStr})
                  </span>
                </h4>
              </div>
            </div>

            {/* List of events on this day */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
              
              <AnimatePresence mode="popLayout">
                {selectedDayEvents.length > 0 ? (
                  selectedDayEvents.map(evt => {
                    const meta = getTypeMeta(evt.type);

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={evt.id}
                        className="p-4 rounded-2xl bg-card border border-border hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all relative group/item"
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border",
                            meta.badgeBg
                          )}>
                            {meta.icon}
                            {meta.label}
                          </span>

                          <span className="text-[9px] font-black text-muted uppercase tracking-wider bg-muted/20 px-2 py-0.5 rounded">
                            {evt.batchName || t.allBatches}
                          </span>
                        </div>

                        <h5 className="text-sm font-black text-foreground uppercase tracking-tight group-hover/item:text-indigo-600 transition-colors">
                          {evt.title}
                        </h5>

                        {evt.description && (
                          <p className="text-xs text-muted font-medium mt-1 leading-relaxed">
                            {evt.description}
                          </p>
                        )}

                        <div className="mt-4 pt-3 border-t border-dotted border-border flex justify-between items-center text-[10px] text-muted">
                          <div className="flex items-center gap-1 font-bold">
                            <Clock size={11} className="opacity-60" />
                            <span>{t.created}: {evt.createdBy || 'Staff'}</span>
                          </div>

                          {/* Action triggers */}
                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEditForm(evt)}
                              className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 rounded-lg transition-colors"
                              title={t.editEvent}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(evt.id)}
                              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 rounded-lg transition-colors"
                              title={t.delete}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                      </motion.div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center border-2 border-dashed border-border rounded-2xl">
                    <CalendarActiveIcon className="mx-auto text-slate-300 opacity-60 mb-2 scale-110" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {t.noEvents}
                    </p>
                    <button
                      onClick={() => handleOpenNewForm()}
                      className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      <PlusCircle size={12} />
                      {t.addEvent}
                    </button>
                  </div>
                )}
              </AnimatePresence>

            </div>

          </div>

          {/* Quick list summary for the rest of current Month */}
          <div className="pt-6 border-t border-border mt-6">
            <h5 className="text-[10px] font-black text-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Sparkles size={12} className="text-indigo-500 animate-pulse" />
              {t.upcomingEvents}
            </h5>

            <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
              {currentMonthEvents.map(evt => {
                const meta = getTypeMeta(evt.type);
                const dayNum = parseInt(evt.date.split('-')[2]);

                return (
                  <button
                    key={`side-${evt.id}`}
                    onClick={() => setSelectedDay(dayNum)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all",
                      selectedDay === dayNum 
                        ? "border-indigo-600/30 bg-indigo-50/10 dark:bg-indigo-950/5 ring-1 ring-indigo-500/5 shadow-sm" 
                        : "border-border bg-card/40 hover:bg-muted/10"
                    )}
                  >
                    <div className="flex items-center gap-2 max-w-[70%]">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", meta.dotBg)} />
                      <span className="text-xs font-black text-foreground truncate uppercase tracking-tight">
                        {evt.title}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-[10px] font-black bg-muted/30 px-1.5 py-0.5 rounded text-foreground dark:text-slate-300">
                        {monthNames[month].slice(0, 3)} {dayNum}
                      </span>
                    </div>
                  </button>
                );
              })}

              {currentMonthEvents.length === 0 && (
                <p className="text-[11px] font-medium text-muted-foreground italic">
                  {language === 'en' ? 'No other monthly activities scheduled yet.' : 'এই মাসে অন্যান্য কোনো প্রোগ্রাম এখনও ঠিক করা হয়নি।'}
                </p>
              )}
            </div>

            {/* aggregate count indicator */}
            <div className="text-[9px] font-bold text-muted uppercase mt-3 tracking-widest text-right">
              {currentMonthEvents.length} {t.totalThisMonth} {monthNames[month]}
            </div>

          </div>

        </div>

      </div>

      {/* ADMIN DIALOG MODAL: Create / Edit Event */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop slide-in */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
              className="bg-card border border-border w-full max-w-lg rounded-[2.5rem] overflow-y-auto max-h-[90vh] shadow-2xl relative z-10 p-6 md:p-8"
            >
              
              <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-foreground uppercase tracking-tight">
                      {editingEventId ? t.editEvent : t.addEvent}
                    </h4>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
                      {t.staffCoordinator}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 bg-muted/20 hover:bg-muted/30 text-foreground rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form schema fields */}
              <form onSubmit={handleSaveForm} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest block">
                    {t.titleLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder={t.formTitlePlaceholder}
                    className="w-full px-4 py-2.5 bg-muted/10 hover:bg-muted/20 focus:bg-card border-2 border-border focus:border-indigo-600 rounded-xl leading-snug transition-all text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest block">
                      {t.typeLabel}
                    </label>
                    <select
                      value={formType}
                      onChange={e => setFormType(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-muted/10 hover:bg-muted/20 focus:bg-card border-2 border-border focus:border-indigo-600 rounded-xl text-xs font-bold"
                    >
                      <option value="holiday">{t.holiday}</option>
                      <option value="exam">{t.exam}</option>
                      <option value="deadline">{t.deadline}</option>
                      <option value="other">{t.other}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest block">
                      {t.dateLabel}
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/10 hover:bg-muted/20 focus:bg-card border-2 border-border focus:border-indigo-600 rounded-xl text-xs font-bold"
                    />
                  </div>

                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest block">
                    {t.batchLabel}
                  </label>
                  <select
                    value={formBatch}
                    onChange={e => setFormBatch(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/10 hover:bg-muted/20 focus:bg-card border-2 border-border focus:border-indigo-600 rounded-xl text-xs font-bold"
                  >
                    <option value="All Batches">{t.allBatches}</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest block">
                    {t.descLabel}
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder={language === 'en' ? 'Provide important details, syllabus range, or staff notes here.' : 'গুরুত্বপূর্ণ বিবরণ, সিলেবাসের পরিসর বা স্টাফ নোট এখানে যোগ করুন।'}
                    className="w-full px-4 py-2.5 bg-muted/10 hover:bg-muted/20 focus:bg-card border-2 border-border focus:border-indigo-600 rounded-xl transition-all text-xs font-medium resize-none"
                  />
                </div>

                {/* Confirm Buttons */}
                <div className="flex justify-end items-center gap-3 pt-4 border-t border-border mt-6">
                  
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground rounded-xl"
                  >
                    {t.cancel}
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                  >
                    {t.save}
                  </button>

                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Inline decorative active calendar icon inside details section placeholder
function CalendarActiveIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      width="44" 
      height="44" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <circle cx="8" cy="14" r="1" />
      <circle cx="12" cy="14" r="1" />
      <circle cx="16" cy="14" r="1" />
      <circle cx="8" cy="18" r="1" />
      <circle cx="12" cy="18" r="1" />
      <circle cx="16" cy="18" r="1" />
    </svg>
  );
}
