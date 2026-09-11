import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  Trophy, 
  ClipboardCheck, 
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit,
  User,
  Hash,
  Download
} from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { cn } from '../lib/utils';
import { translations } from '../lib/translations';
import { Exam, ExamResult } from '../types';

export function Exams() {
  const { 
    students, exams, examResults, 
    addExam, updateExam, deleteExam,
    addExamResult, updateExamResult, deleteExamResult,
    language 
  } = useAppContext();
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'exams' | 'results'>('exams');
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Exam Form State
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().slice(0, 10));
  const [examTotalMarks, setExamTotalMarks] = useState(100);
  const [examBatch, setExamBatch] = useState('');

  // Result Entry State
  const [markingStudentId, setMarkingStudentId] = useState<string | null>(null);
  const [obtainedMarks, setObtainedMarks] = useState<number>(0);

  const filteredExams = exams.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.batch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName || !examBatch) return;

    addExam({
      id: 'EX-' + Date.now().toString(),
      name: examName,
      date: examDate,
      totalMarks: examTotalMarks,
      batch: examBatch
    });

    setIsAddingExam(false);
    setExamName('');
    setExamBatch('');
  };

  const handleMarkEntry = (studentId: string, examId: string) => {
    const existing = examResults.find(r => r.studentId === studentId && r.examId === examId);
    if (existing) {
      updateExamResult(existing.id, { obtainedMarks });
    } else {
      addExamResult({
        id: 'ER-' + Date.now().toString() + '-' + studentId,
        examId,
        studentId,
        obtainedMarks,
        date: new Date().toISOString().slice(0, 10)
      });
    }
    setMarkingStudentId(null);
    setObtainedMarks(0);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 px-5 md:px-0 font-plus text-foreground">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight leading-none uppercase italic">Exams <span className="text-indigo-600">&</span> Results</h1>
          <p className="text-muted font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Performance Tracking Intelligence</p>
        </div>
        <div className="flex bg-muted/10 p-1 rounded-2xl border border-border">
           {(['exams', 'results'] as const).map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={cn(
                 "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 activeTab === tab ? "bg-card text-indigo-600 shadow-sm" : "text-muted hover:text-foreground"
               )}
             >
               {tab}
             </button>
           ))}
        </div>
      </header>

      {activeTab === 'exams' ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
             <div className="flex-1 relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input 
                   type="text"
                   placeholder="Search exams or batches..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-16 pr-8 py-5 bg-card text-card-foreground dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-[2rem] shadow-xl shadow-slate-200/40 dark:shadow-none text-sm font-bold text-foreground dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
             </div>
             <button 
               onClick={() => setIsAddingExam(true)}
               className="bg-slate-900 hover:bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3"
             >
               <Plus size={18} /> Schedule Exam
             </button>
          </div>

          {isAddingExam && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card text-card-foreground dark:bg-slate-900 p-8 rounded-[3rem] border border-border/50 dark:border-slate-800 shadow-2xl text-foreground">
               <form onSubmit={handleAddExam} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Exam Name</label>
                     <input 
                        required
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        placeholder="Weekly Test 1"
                        className="w-full px-6 py-4 bg-muted/10 dark:bg-slate-950 border border-border/50 dark:border-slate-800 rounded-2xl font-bold text-sm dark:text-white outline-none"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Date</label>
                     <input 
                        type="date"
                        required
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        className="w-full px-6 py-4 bg-muted/10 dark:bg-slate-950 border border-border/50 dark:border-slate-800 rounded-2xl font-bold text-sm dark:text-white outline-none"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Total Marks</label>
                     <input 
                        type="number"
                        required
                        value={examTotalMarks}
                        onChange={(e) => setExamTotalMarks(Number(e.target.value))}
                        className="w-full px-6 py-4 bg-muted/10 dark:bg-slate-950 border border-border/50 dark:border-slate-800 rounded-2xl font-bold text-sm dark:text-white outline-none"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Batch</label>
                     <input 
                        required
                        value={examBatch}
                        onChange={(e) => setExamBatch(e.target.value)}
                        placeholder="Science B1"
                        className="w-full px-6 py-4 bg-muted/10 dark:bg-slate-950 border border-border/50 dark:border-slate-800 rounded-2xl font-bold text-sm dark:text-white outline-none"
                     />
                  </div>
                  <div className="md:col-span-4 flex justify-end gap-4 mt-4">
                     <button type="button" onClick={() => setIsAddingExam(false)} className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Cancel</button>
                     <button type="submit" className="bg-slate-900 dark:bg-card text-card-foreground dark:text-slate-950 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest">Create Exam</button>
                  </div>
               </form>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredExams.map((exam, index) => {
               const participations = examResults.filter(r => r.examId === exam.id).length;
               return (
                  <div key={`${exam.id}-${index}`} className="bg-card text-card-foreground dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-50 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none group hover:border-indigo-200 dark:hover:border-indigo-500 transition-all">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                           <FileText size={24} />
                        </div>
                        <button onClick={() => deleteExam(exam.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                           <Trash2 size={18} />
                        </button>
                     </div>
                     <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic mb-2">{exam.name}</h3>
                     <div className="flex items-center gap-3 mb-6">
                        <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full uppercase border border-indigo-100/50 dark:border-indigo-900/60">{exam.batch}</span>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{exam.date}</span>
                     </div>
                     <div className="space-y-4">
                        <div className="flex justify-between p-4 bg-muted/10 dark:bg-slate-950 rounded-2xl border border-border/50/50 dark:border-slate-800/40">
                           <div className="text-center flex-1">
                              <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Total Marks</p>
                              <p className="text-xl font-black text-slate-900 dark:text-white">{exam.totalMarks}</p>
                           </div>
                           <div className="w-px bg-slate-200 dark:bg-slate-800" />
                           <div className="text-center flex-1">
                              <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Graded</p>
                              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{participations}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedExamId(exam.id);
                            setActiveTab('results');
                          }}
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest group-hover:bg-indigo-600 transition-colors"
                        >
                           Enter Marks
                        </button>
                     </div>
                  </div>
               )
             })}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
           <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="flex-1 space-y-2">
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Select Exam for Result Entry</label>
                 <select 
                    value={selectedExamId || ''}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="w-full px-8 py-5 bg-card text-card-foreground dark:bg-slate-900 border border-border/50 dark:border-slate-800 rounded-[2rem] shadow-xl shadow-slate-200/40 dark:shadow-none text-sm font-bold text-foreground dark:text-slate-100 outline-none"
                 >
                    <option value="" className="dark:bg-slate-900">Select an exam...</option>
                    {exams.map((e, index) => <option key={`${e.id}-${index}`} value={e.id} className="dark:bg-slate-900">{e.name} ({e.batch})</option>)}
                 </select>
              </div>
           </div>

           {selectedExamId && (
             <div className="bg-card text-card-foreground dark:bg-slate-900 rounded-[3rem] border border-slate-50 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden text-foreground">
                <div className="p-10 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 flex justify-between items-center">
                   <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Student Roster</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Batch: {exams.find(e => e.id === selectedExamId)?.batch}</p>
                   </div>
                   <div className="flex gap-4">
                      <div className="text-right">
                         <p className="text-[9px] font-black text-muted-foreground uppercase">Class Average</p>
                         <p className="text-xl font-black text-slate-900 dark:text-white">
                            {(examResults.filter(r => r.examId === selectedExamId).reduce((sum, r) => sum + r.obtainedMarks, 0) / 
                            (examResults.filter(r => r.examId === selectedExamId).length || 1)).toFixed(1)}
                         </p>
                      </div>
                   </div>
                </div>
                
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.3em]">
                         <tr>
                            <th className="px-10 py-6">Student</th>
                            <th className="px-10 py-6 text-center">Current Score</th>
                            <th className="px-10 py-6 text-right">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                         {students
                           .filter(s => s.batch === exams.find(e => e.id === selectedExamId)?.batch && s.status === 'Active')
                           .map((student, index) => {
                              const result = examResults.find(r => r.studentId === student.id && r.examId === selectedExamId);
                              const isMarking = markingStudentId === student.id;
                              const exam = exams.find(e => e.id === selectedExamId)!;

                              return (
                                <tr key={`${student.id}-${index}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors">
                                   <td className="px-10 py-6">
                                      <div className="font-black text-slate-900 dark:text-slate-100 text-lg uppercase italic">{student.name}</div>
                                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{student.studentID}</div>
                                   </td>
                                   <td className="px-10 py-6 text-center">
                                      {isMarking ? (
                                        <input 
                                           autoFocus
                                           type="number"
                                           max={exam.totalMarks}
                                           value={obtainedMarks}
                                           onChange={(e) => setObtainedMarks(Number(e.target.value))}
                                           className="w-24 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl font-black text-center text-indigo-600 outline-none"
                                        />
                                      ) : (
                                        <div className={cn(
                                           "inline-flex flex-col items-center justify-center w-20 h-20 rounded-[2rem] border-2",
                                           result 
                                             ? (result.obtainedMarks / exam.totalMarks > 0.4 ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400")
                                             : "bg-muted/10 dark:bg-slate-950 border-border/50 dark:border-slate-800 text-slate-300 dark:text-slate-600"
                                        )}>
                                           <span className="text-xl font-black">{result ? result.obtainedMarks : '--'}</span>
                                           <span className="text-[8px] font-black uppercase opacity-50">/{exam.totalMarks}</span>
                                        </div>
                                      )}
                                   </td>
                                   <td className="px-10 py-6 text-right">
                                      {isMarking ? (
                                        <div className="flex justify-end gap-2">
                                           <button onClick={() => handleMarkEntry(student.id, selectedExamId)} className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg"><ClipboardCheck size={18} /></button>
                                           <button onClick={() => setMarkingStudentId(null)} className="w-10 h-10 bg-slate-200 text-muted rounded-xl flex items-center justify-center"><AlertCircle size={18} /></button>
                                        </div>
                                      ) : (
                                        <button 
                                           onClick={() => {
                                              setMarkingStudentId(student.id);
                                              setObtainedMarks(result?.obtainedMarks || 0);
                                           }} 
                                           className="px-6 py-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/50 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                        >
                                           {result ? 'Update Marks' : 'Enter Marks'}
                                        </button>
                                      )}
                                   </td>
                                </tr>
                              );
                           })}
                      </tbody>
                   </table>
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
