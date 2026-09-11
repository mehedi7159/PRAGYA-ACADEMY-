import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Clock, FileWarning, User, Target } from 'lucide-react';
import { cn } from '../lib/utils';
import { TeacherClassRecord, Batch, Teacher } from '../types';

interface AttendanceRosterProps {
  dailyClasses: any[];
  todayRecords: TeacherClassRecord[];
  selectedRosterBatchId: string;
  setSelectedRosterBatchId: (id: string) => void;
  batches: Batch[];
  teachers: Teacher[];
  language: 'en' | 'bn';
  today: string;
  onMarkAllPresent: () => void;
  onMarkAllAbsent: () => void;
  notification: { message: string; type: 'success' | 'info' } | null;
  onCloseNotification: () => void;
  updateTeacherRecord: (id: string, updates: Partial<TeacherClassRecord>) => void;
  addTeacherRecord: (record: TeacherClassRecord) => void;
}

export default function AttendanceRoster({
  dailyClasses,
  todayRecords,
  selectedRosterBatchId,
  setSelectedRosterBatchId,
  batches,
  teachers,
  language,
  today,
  onMarkAllPresent,
  onMarkAllAbsent,
  notification,
  onCloseNotification,
  updateTeacherRecord,
  addTeacherRecord
}: AttendanceRosterProps) {
  
  const handleStatusChange = (status: 'Completed' | 'Absent' | 'Late', cls: any, savedRec: TeacherClassRecord | undefined, currentTeacherId: string, cardStartTime: string, cardEndTime: string) => {
    if (savedRec) {
      updateTeacherRecord(savedRec.id, { status });
    } else {
      addTeacherRecord({
        id: 'TCR-' + Date.now() + '-' + cls.index,
        teacherId: currentTeacherId,
        batchId: selectedRosterBatchId,
        date: today,
        startTime: cardStartTime,
        endTime: cardEndTime,
        topic: cls.topic,
        isPaid: true,
        subject: cls.subject,
        status: status
      });
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
        <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
           {batches.filter(b => b.status === 'Active').map(b => (
              <button 
                key={b.id}
                onClick={() => setSelectedRosterBatchId(b.id)}
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border whitespace-nowrap", 
                  selectedRosterBatchId === b.id 
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-300 dark:shadow-none" 
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold"
                )}
              >
                {b.name}
              </button>
           ))}
        </div>

        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className={cn(
                "p-4 rounded-3xl border flex items-center justify-between gap-4 shadow-sm",
                notification.type === 'success' 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300"
                  : "bg-indigo-50 border-indigo-100 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-300"
              )}
            >
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className={notification.type === 'success' ? "text-emerald-500" : "text-indigo-500"} />
                <p className="text-sm font-bold tracking-tight">{notification.message}</p>
              </div>
              <button onClick={onCloseNotification} className="text-xs font-bold px-2 py-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h3 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
                <span>{language === 'en' ? "Today's Roster" : "আজকের ক্লাস"}</span>
                <span className="text-indigo-500 text-sm opacity-70">({batches.find(b => b.id === selectedRosterBatchId)?.name || ''})</span>
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
               <button onClick={onMarkAllPresent} className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest px-5 py-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-2xl transition-all flex items-center justify-center gap-2">
                  <CheckCircle size={14} /> {language === 'en' ? 'All Present' : 'সবাই উপস্থিত'}
               </button>
               <button onClick={onMarkAllAbsent} className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest px-5 py-3 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-2xl transition-all flex items-center justify-center gap-2">
                  <XCircle size={14} /> {language === 'en' ? 'All Absent' : 'সবাই অনুপস্থিত'}
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {dailyClasses.length > 0 ? dailyClasses.map((cls, idx) => {
                const savedRec = todayRecords.find(r => r.topic === cls.topic);
                const currentTeacherId = savedRec ? savedRec.teacherId : cls.defaultTeacherId;
                const currentStatus = savedRec ? savedRec.status : 'Pending';
                const cardStartTime = savedRec?.startTime || cls.startTime;
                const cardEndTime = savedRec?.endTime || cls.endTime;
                
                const statusBorder = currentStatus === 'Completed' ? 'border-emerald-300 dark:border-emerald-800' : currentStatus === 'Absent' ? 'border-rose-300 dark:border-rose-800' : currentStatus === 'Late' ? 'border-amber-300 dark:border-amber-800' : 'border-slate-200 dark:border-slate-700';

                return (
                   <div key={idx} className={cn("border-2 rounded-[2rem] p-6 flex flex-col gap-5 transition-all hover:shadow-md", statusBorder)}>
                      <div className="flex justify-between items-center">
                         <span className={cn("text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest", 
                           currentStatus === 'Completed' ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" 
                           : currentStatus === 'Absent' ? "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200" 
                           : currentStatus === 'Late' ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" 
                           : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300")}>
                           {cls.index}
                         </span>
                         <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Clock size={12}/> {cardStartTime} - {cardEndTime}</span>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-black text-slate-900 dark:text-slate-100 mb-4">{cls.subject}</h4>
                        
                        <div className="relative group">
                          <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                            <User size={12} /> {language === 'en' ? 'Teacher' : 'শিক্ষক'}
                          </label>
                          <select 
                            value={currentTeacherId} 
                            onChange={(e) => {
                              if (savedRec) updateTeacherRecord(savedRec.id, { teacherId: e.target.value });
                              else addTeacherRecord({ id: 'TCR-'+Date.now()+'-'+cls.index, teacherId: e.target.value, batchId: selectedRosterBatchId, date: today, startTime: cardStartTime, endTime: cardEndTime, topic: cls.topic, isPaid: true, subject: cls.subject, status: 'Completed' });
                            }} 
                            className="w-full text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-transparent focus:border-indigo-300 outline-none appearance-none cursor-pointer"
                          >
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => handleStatusChange('Completed', cls, savedRec, currentTeacherId, cardStartTime, cardEndTime)} className={cn("flex flex-col items-center gap-1 p-2.5 rounded-xl text-[9px] font-black uppercase transition-all border", currentStatus === 'Completed' ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900 hover:border-emerald-200")}>
                           <CheckCircle size={16} /> Present
                        </button>
                        <button onClick={() => handleStatusChange('Absent', cls, savedRec, currentTeacherId, cardStartTime, cardEndTime)} className={cn("flex flex-col items-center gap-1 p-2.5 rounded-xl text-[9px] font-black uppercase transition-all border", currentStatus === 'Absent' ? "bg-rose-600 text-white border-rose-600" : "bg-slate-50 dark:bg-slate-800 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900 hover:border-rose-200")}>
                           <XCircle size={16} /> Absent
                        </button>
                        <button onClick={() => handleStatusChange('Late', cls, savedRec, currentTeacherId, cardStartTime, cardEndTime)} className={cn("flex flex-col items-center gap-1 p-2.5 rounded-xl text-[9px] font-black uppercase transition-all border", currentStatus === 'Late' ? "bg-amber-600 text-white border-amber-600" : "bg-slate-50 dark:bg-slate-800 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900 hover:border-amber-200")}>
                           <Clock size={16} /> Late
                        </button>
                      </div>
                   </div>
                );
             }) : (
               <div className="col-span-full py-16 flex flex-col items-center gap-4 text-slate-400 dark:text-slate-600">
                  <FileWarning size={48} />
                  <p className="font-bold uppercase tracking-widest">{language === 'en' ? 'No classes scheduled today' : 'আজ কোনো ক্লাস নেই'}</p>
               </div>
             )}
          </div>
        </div>
    </div>
  );
}
