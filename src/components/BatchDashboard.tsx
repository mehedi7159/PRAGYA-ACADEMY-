import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, LayoutDashboard, Users, UserCog, BookOpen, Calendar, Activity, BarChart3, Search, X, Folder, Archive } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { cn, formatCurrency } from '../lib/utils';
import { Batch } from '../types';
import { StudentRow } from '../pages/SmartBatches';

export function BatchDashboard({ batch, onClose }: { batch: Batch, onClose: () => void }) {
  const { language, students, teacherRecords, teachers, attendance, payments, updateBatch, updateStudent, bulkMarkAttendance } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'teachers' | 'subjects' | 'schedule' | 'attendance' | 'analytics'>('overview');
  
  const isArchive = batch.status === 'Archive' || batch.status === 'Archived';
  const isActive = batch.status === 'Active';
  const isInactive = batch.status === 'Inactive';

  const batchStudents = students.filter(s => s.batch === batch.name || s.batch === batch.id);
  const activeStudents = batchStudents.filter(s => s.status === 'Active');

  const handleStatusChange = (newStatus: 'Active' | 'Inactive' | 'Archived') => {
      // Logic for status transition
      updateBatch(batch.id, { status: newStatus });
      
      // If archiving, update student statuses to Former (handle with caution)
      if (newStatus === 'Archived') {
          batchStudents.forEach(student => {
             updateStudent(student.id, { ...student, status: 'Former' });
          });
      }
  };

  // Helpers for Health Score
  const totalClasses = teacherRecords.filter(r => r.batchId === batch.id).length;
  const completedClasses = teacherRecords.filter(r => r.batchId === batch.id && r.status === 'Completed').length;
  const pendingClasses = Math.max(0, (batch.monthlyClassTarget || 0) - completedClasses);
  
  // Calculate attendance rate
  const batchAttendanceLogs = attendance.filter(a => activeStudents.some(s => s.id === a.studentId));
  const presentCount = batchAttendanceLogs.filter(a => a.status === 'Present').length;
  const attendanceRate = batchAttendanceLogs.length > 0 ? presentCount / batchAttendanceLogs.length : 1;

  // Calculate Fee Health (simplified: totalDue / totalExpectedFee)
  // Replicating part of DueList logic
  const getBatchDue = () => {
    let totalDue = 0;
    let totalExpected = 0;
    
    activeStudents.forEach(student => {
       // Simplified fee calculation
       const studentPayments = payments.filter(p => p.studentId === student.id);
       const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount + (p.discount || 0), 0);
       const expected = student.finalFee || 0; // Assuming this based on DueList usage
       
       totalExpected += expected;
       totalDue += Math.max(0, expected - totalPaid);
    });
    return totalExpected > 0 ? totalDue / totalExpected : 0;
  };
  const dueRate = getBatchDue();

  // Basic Health calculation (Excellent/Good/Warning/Critical)
  let healthScoreLabel = "Good";
  let healthScoreColor = "text-emerald-500";
  let healthScoreBg = "bg-emerald-50 dark:bg-emerald-500/10";
  
  if (isArchive) {
     healthScoreLabel = "Archived";
     healthScoreColor = "text-slate-500";
     healthScoreBg = "bg-slate-50 dark:bg-slate-500/10";
  } else if (!isActive) {
     healthScoreLabel = "Paused";
     healthScoreColor = "text-slate-500";
     healthScoreBg = "bg-slate-50 dark:bg-slate-500/10";
  } else {
     // Scoring Logic
     const attendanceScore = attendanceRate; // 0 to 1
     const feeScore = 1 - dueRate; // 0 to 1
     const completionRate = totalClasses > 0 ? completedClasses / totalClasses : 1;
     
     const overallScore = (attendanceScore + feeScore + completionRate) / 3;

     if (activeStudents.length === 0) {
        healthScoreLabel = "Action Needed";
        healthScoreColor = "text-rose-500";
        healthScoreBg = "bg-rose-50 dark:bg-rose-500/10";
     } else if (overallScore < 0.6) {
        healthScoreLabel = "Critical"; // or Risk
        healthScoreColor = "text-rose-500";
        healthScoreBg = "bg-rose-50 dark:bg-rose-500/10";
     } else if (overallScore < 0.8) {
        healthScoreLabel = "Warning"; // or Average
        healthScoreColor = "text-amber-500";
        healthScoreBg = "bg-amber-50 dark:bg-amber-500/10";
     } else if (overallScore >= 0.8 && overallScore < 0.95) {
        healthScoreLabel = "Good";
        healthScoreColor = "text-emerald-500";
        healthScoreBg = "bg-emerald-50 dark:bg-emerald-500/10";
     } else {
        healthScoreLabel = "Excellent";
        healthScoreColor = "text-indigo-500";
        healthScoreBg = "bg-indigo-50 dark:bg-indigo-500/10";
     }
  }

  return (
    <div className="fixed inset-0 z-[120] bg-background animate-in fade-in flex flex-col">
      {/* Header Navigation */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-muted/10 border border-border flex items-center justify-center hover:bg-muted/20 transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
              {batch.name}
              <select 
                 className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-widest font-black inline-flex items-center gap-1 cursor-pointer outline-none",
                    isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20" :
                    isArchive ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20" :
                    "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800"
                 )}
                 value={batch.status}
                 onChange={(e) => handleStatusChange(e.target.value as 'Active' | 'Inactive' | 'Archived')}
              >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
              </select>
            </h2>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">
              {batch.academicYear || (language === 'en' ? 'NO ACADEMIC YEAR SET' : 'শিক্ষাবর্ষ নির্ধারণ করা হয়নি')} • {activeStudents.length} {language === 'en' ? 'Active Students' : 'সক্রিয় শিক্ষার্থী'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout containing Tabs and Content */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-border bg-card/30 flex lg:flex-col overflow-x-auto custom-scrollbar p-4 gap-2 shrink-0">
           <TabButton active={activeTab === 'overview'} icon={LayoutDashboard} label={language === 'en' ? 'Overview' : 'ওভারভিউ'} onClick={() => setActiveTab('overview')} />
           <TabButton active={activeTab === 'students'} icon={Users} label={language === 'en' ? 'Students' : 'শিক্ষার্থী'} onClick={() => setActiveTab('students')} />
           <TabButton active={activeTab === 'teachers'} icon={UserCog} label={language === 'en' ? 'Teachers' : 'শিক্ষক'} onClick={() => setActiveTab('teachers')} />
           <TabButton active={activeTab === 'subjects'} icon={BookOpen} label={language === 'en' ? 'Subjects' : 'বিষয়'} onClick={() => setActiveTab('subjects')} />
           <TabButton active={activeTab === 'schedule'} icon={Calendar} label={language === 'en' ? 'Schedule' : 'শিডিউল'} onClick={() => setActiveTab('schedule')} />
           <TabButton active={activeTab === 'attendance'} icon={Activity} label={language === 'en' ? 'Attendance' : 'উপস্থিতি'} onClick={() => setActiveTab('attendance')} />
           <TabButton active={activeTab === 'analytics'} icon={BarChart3} label={language === 'en' ? 'Analytics' : 'অ্যানালিটিক্স'} onClick={() => setActiveTab('analytics')} />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-muted/5 custom-scrollbar">
          
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Batch Health Card */}
                 <div className="bg-card border border-border p-6 rounded-3xl shadow-sm text-center flex flex-col items-center justify-center">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">{language === 'en' ? 'Batch Health' : 'ব্যাচের অবস্থা'}</span>
                    <div className={cn("px-6 py-2 rounded-2xl border flex items-center justify-center text-lg font-black uppercase tracking-widest", healthScoreColor, healthScoreBg, `border-${healthScoreColor.split('-')[1]}-200`)}>
                       {healthScoreLabel}
                    </div>
                 </div>

                 {/* Class Progress Card */}
                 <div className="bg-card border border-border p-6 rounded-3xl shadow-sm text-center flex flex-col items-center justify-center">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">{language === 'en' ? 'Class Progress' : 'ক্লাস অগ্রগতি'}</span>
                    <h3 className="text-4xl font-black">{completedClasses} <span className="text-xl text-muted-foreground">/ {totalClasses || 0}</span></h3>
                 </div>

                 {/* Students Card */}
                 <div className="bg-card border border-border p-6 rounded-3xl shadow-sm text-center flex flex-col items-center justify-center">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">{language === 'en' ? 'Total Students' : 'মোট ছাত্রছাত্রী'}</span>
                    <h3 className="text-4xl font-black">{batchStudents.length}</h3>
                    <span className="text-xs text-muted-foreground mt-2">{activeStudents.length} Active / {batch.maxCapacity || 50} Capacity</span>
                 </div>
              </div>

            </div>
          )}

          {activeTab === 'students' && (
            <div className="max-w-5xl mx-auto bg-card border border-border rounded-3xl p-6 shadow-sm">
               <h3 className="text-lg font-black uppercase tracking-widest mb-6 border-b border-border pb-4">{language === 'en' ? 'Directory' : 'শিক্ষার্থী তালিকা'}</h3>
               {batchStudents.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Folder className="mx-auto mb-3 opacity-20" size={40} />
                    <p className="font-bold">{language === 'en' ? 'No students enrolled.' : 'কোন শিক্ষার্থী নেই।'}</p>
                  </div>
               ) : (
                  <div className="space-y-3">
                    {batchStudents.map(student => (
                      <StudentRow 
                          key={student.id} 
                          student={student} 
                          language={language} 
                          updateStudent={updateStudent}
                          isArchive={isArchive} 
                      />
                    ))}
                  </div>
               )}
            </div>
          )}

          {activeTab === 'teachers' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                 <h3 className="text-lg font-black uppercase tracking-widest mb-6 border-b border-border pb-4">{language === 'en' ? 'Assigned Teachers' : 'নিযুক্ত শিক্ষক'}</h3>
                 <p className="text-sm text-muted-foreground mb-6">
                   {language === 'en' ? 'Map subjects to teachers to auto-assign them during attendance and scheduling.' : 'উপস্থিতি এবং রুটিন তৈরি করার জন্য বিষয়ের সাথে শিক্ষক ম্যাপ করুন।'}
                 </p>

                 {/* Teacher Subject Mapping */}
                 {!(batch.subjects && batch.subjects.length > 0) ? (
                    <div className="p-8 text-center bg-muted/20 rounded-2xl border border-dashed border-border">
                       <p className="text-muted-foreground font-medium mb-2">{language === 'en' ? 'No subjects defined for this batch.' : 'এই ব্যাচের জন্য কোনো বিষয় নির্ধারণ করা হয়নি।'}</p>
                       <button onClick={() => setActiveTab('subjects')} className="text-indigo-600 hover:underline text-sm font-bold">{language === 'en' ? 'Go to Subjects tab to add subjects' : 'বিষয় যোগ করতে বিষয় ট্যাবে যান'}</button>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       {batch.subjects.map((sub, idx) => {
                          const assignedSession = (batch.sessions || []).find(s => s.subject === sub);
                          const assignedTeacher = teachers.find(t => t.id === assignedSession?.teacherId);
                          
                          return (
                             <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-border rounded-2xl bg-background">
                                <div className="font-bold text-foreground px-3 py-1 bg-muted/20 rounded-lg">{sub}</div>
                                
                                <select 
                                   className="border border-border rounded-xl px-3 py-2 text-sm bg-muted/5 font-medium outline-none focus:border-indigo-500"
                                   value={assignedSession?.teacherId || ''}
                                   onChange={(e) => {
                                      const newTeacherId = e.target.value;
                                      const newSessions = [...(batch.sessions || [])];
                                      const existingIdx = newSessions.findIndex(s => s.subject === sub);
                                      if (existingIdx !== -1) {
                                         if (newTeacherId) {
                                            newSessions[existingIdx].teacherId = newTeacherId;
                                         } else {
                                            newSessions.splice(existingIdx, 1);
                                         }
                                      } else if (newTeacherId) {
                                         newSessions.push({
                                            id: `session-${Date.now()}-${idx}`,
                                            subject: sub,
                                            teacherId: newTeacherId,
                                            startTime: '10:00',
                                            endTime: '11:00'
                                         });
                                      }
                                      updateBatch(batch.id, { sessions: newSessions });
                                   }}
                                >
                                   <option value="">{language === 'en' ? '-- Unassigned --' : '-- নির্ধারিত নয় --'}</option>
                                   {teachers.filter(t => t.status === 'Active').map(t => (
                                      <option key={t.id} value={t.id}>{t.name}</option>
                                   ))}
                                </select>
                             </div>
                          );
                       })}
                    </div>
                 )}
              </div>
            </div>
          )}

          {activeTab === 'subjects' && (
             <div className="max-w-3xl mx-auto bg-card border border-border rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-black uppercase tracking-widest mb-6 border-b border-border pb-4">{language === 'en' ? 'Batch Subjects' : 'ব্যাচের বিষয়সমূহ'}</h3>
                
                <div className="space-y-4">
                   {(batch.subjects || []).map((sub, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border border-border rounded-xl bg-muted/5">
                         <span className="font-bold">{sub}</span>
                         <button 
                            onClick={() => {
                               const newSubjects = (batch.subjects || []).filter((_, i) => i !== idx);
                               updateBatch(batch.id, { subjects: newSubjects });
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                         >
                            <X size={16} />
                         </button>
                      </div>
                   ))}

                   <div className="flex gap-2 pt-4">
                      <input 
                         type="text" 
                         id="newSubjectInput"
                         placeholder={language === 'en' ? "Add new subject..." : "নতুন বিষয় যোগ করুন..."}
                         className="flex-1 px-4 py-2 border border-border rounded-xl focus:outline-none focus:border-indigo-500 bg-background"
                         onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                               const val = e.currentTarget.value.trim();
                               if (val) {
                                  updateBatch(batch.id, { subjects: [...(batch.subjects || []), val] });
                                  e.currentTarget.value = '';
                               }
                            }
                         }}
                      />
                      <button 
                         onClick={() => {
                            const input = document.getElementById('newSubjectInput') as HTMLInputElement;
                            const val = input.value.trim();
                            if (val) {
                               updateBatch(batch.id, { subjects: [...(batch.subjects || []), val] });
                               input.value = '';
                            }
                         }}
                         className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm"
                      >
                         {language === 'en' ? 'Add' : 'যুক্ত করুন'}
                      </button>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'schedule' && (
             <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                   <h3 className="text-lg font-black uppercase tracking-widest mb-6 border-b border-border pb-4">{language === 'en' ? 'Class Planning & Targets' : 'ক্লাস প্ল্যানিং এবং টার্গেট'}</h3>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                      {/* Weekly Target */}
                      <div className="p-4 border border-border rounded-2xl bg-muted/5 flex flex-col justify-between items-start">
                         <div>
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{language === 'en' ? 'Weekly Target' : 'সাপ্তাহিক টার্গেট'}</p>
                            <div className="flex items-end gap-2 mt-2">
                               <input 
                                  type="number" 
                                  className="text-4xl font-black w-24 bg-transparent border-b-2 border-border focus:border-indigo-500 outline-none p-0 appearance-none"
                                  value={batch.weeklyClassTarget || ''}
                                  onChange={(e) => updateBatch(batch.id, { weeklyClassTarget: Number(e.target.value) })}
                                  placeholder="0"
                                  min="0"
                               />
                               <span className="text-sm font-bold text-muted-foreground mb-1">{language === 'en' ? 'classes / week' : 'ক্লাস / সপ্তাহে'}</span>
                            </div>
                         </div>
                      </div>

                      {/* Monthly Target */}
                      <div className="p-4 border border-border rounded-2xl bg-muted/5 flex flex-col justify-between items-start">
                         <div>
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{language === 'en' ? 'Monthly Target' : 'মাসিক টার্গেট'}</p>
                            <div className="flex items-end gap-2 mt-2">
                               <input 
                                  type="number" 
                                  className="text-4xl font-black w-24 bg-transparent border-b-2 border-border focus:border-indigo-500 outline-none p-0 appearance-none"
                                  value={batch.monthlyClassTarget || ''}
                                  onChange={(e) => updateBatch(batch.id, { monthlyClassTarget: Number(e.target.value) })}
                                  placeholder="0"
                                  min="0"
                               />
                               <span className="text-sm font-bold text-muted-foreground mb-1">{language === 'en' ? 'classes / month' : 'ক্লাস / মাসে'}</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   <hr className="border-border my-6" />

                   {/* Quick Stats on Schedule */}
                   <h4 className="text-sm font-black uppercase tracking-widest mb-4">{language === 'en' ? 'Completion Status' : 'সম্পন্ন হওয়া ক্লাস'}</h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                         <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">{language === 'en' ? 'Completed Tasks' : 'সম্পন্ন ক্লাস'}</p>
                         <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-1">{completedClasses}</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800">
                         <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">{language === 'en' ? 'Pending Tracker' : 'বাকি আছে'}</p>
                         <p className="text-2xl font-black text-amber-800 dark:text-amber-300 mt-1">
                            {Math.max(0, (batch.monthlyClassTarget || 0) - completedClasses)}
                         </p>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'analytics' && (
             <div className="max-w-5xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   <div className="bg-card border border-border p-5 rounded-3xl shadow-sm">
                      <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">{language === 'en' ? 'Gross Expected Revenue' : 'প্রত্যাশিত আয়'}</p>
                      <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                         {formatCurrency(batch.feeAmount ? batch.feeAmount * activeStudents.length : 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">{language === 'en' ? 'Monthly Projection' : 'মাসিক হিসাব'}</p>
                   </div>
                   <div className="bg-card border border-border p-5 rounded-3xl shadow-sm">
                      <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">{language === 'en' ? 'Average Attendance' : 'গড় উপস্থিতি'}</p>
                      <p className="text-2xl font-black">
                         {activeStudents.length > 0 ? `${Math.round(attendanceRate * 100)}%` : "0%"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">{language === 'en' ? 'All Time' : 'সর্বকালীন'}</p>
                   </div>
                   <div className="bg-card border border-border p-5 rounded-3xl shadow-sm">
                      <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">{language === 'en' ? 'Active Students' : 'সক্রিয় শিক্ষার্থী'}</p>
                      <p className="text-2xl font-black">{activeStudents.length}</p>
                      <p className="text-xs text-muted-foreground mt-2">{language === 'en' ? 'Currently Enrolled' : 'বর্তমান ব্যাচে ভর্তি'}</p>
                   </div>
                   <div className="bg-card border border-border p-5 rounded-3xl shadow-sm">
                      <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">{language === 'en' ? 'Dropped Out / Former' : 'প্রাক্তন'}</p>
                      <p className="text-2xl font-black">{batchStudents.length - activeStudents.length}</p>
                      <p className="text-xs text-muted-foreground mt-2">{language === 'en' ? 'Inactive status' : 'নিষ্ক্রিয় স্ট্যাটাস'}</p>
                   </div>
                </div>

                <div className="bg-card p-8 border border-border rounded-3xl shadow-sm flex items-center justify-center flex-col min-h-[300px]">
                   <BarChart3 className="text-muted-foreground opacity-20 mb-4" size={64} />
                   <p className="text-muted-foreground font-black tracking-widest uppercase">{language === 'en' ? 'More charts coming soon' : 'আরও চার্ট শীঘ্রই যোগ করা হবে'}</p>
                </div>
             </div>
          )}

          {activeTab === 'attendance' && (
             <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-border pb-4">
                      <h3 className="text-lg font-black uppercase tracking-widest">{language === 'en' ? 'Student Attendance' : 'শিক্ষার্থী উপস্থিতি'}</h3>
                      <input 
                         type="date" 
                         className="px-4 py-2 border border-border rounded-xl text-sm font-bold bg-muted/5 outline-none"
                         defaultValue={new Date().toISOString().slice(0, 10)}
                         id="batch-attendance-date"
                      />
                   </div>

                   {activeStudents.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">
                        <Folder className="mx-auto mb-3 opacity-20" size={40} />
                        <p className="font-bold">{language === 'en' ? 'No active students to take attendance.' : 'উপস্থিতি নেওয়ার জন্য কোনো সক্রিয় শিক্ষার্থী নেই।'}</p>
                      </div>
                   ) : (
                      <div className="space-y-4">
                         <div className="flex justify-end gap-2 mb-4">
                            <button 
                               onClick={() => {
                                  const date = (document.getElementById('batch-attendance-date') as HTMLInputElement).value;
                                  const records = activeStudents.map(s => ({ studentId: s.id, status: 'Present' as const }));
                                  if (window.confirm(language === 'en' ? 'Mark all present?' : 'সবাই উপস্থিত?')) {
                                     bulkMarkAttendance(date, records);
                                  }
                               }}
                               className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors"
                            >
                               {language === 'en' ? 'Mark All Present' : 'সবাই উপস্থিত'}
                            </button>
                         </div>
                         <div className="space-y-2">
                            {activeStudents.map(student => {
                               // Assuming we can get current date value
                               const dateInput = document.getElementById('batch-attendance-date') as HTMLInputElement;
                               const today = dateInput ? dateInput.value : new Date().toISOString().slice(0, 10);
                               const record = attendance.find(a => a.studentId === student.id && a.date === today);
                               const currentStatus = record?.status || 'Pending';

                               return (
                                  <div key={student.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-border rounded-2xl bg-muted/5 gap-4">
                                     <div>
                                        <p className="font-bold">{student.name}</p>
                                        <p className="text-xs text-muted-foreground">{student.id}</p>
                                     </div>
                                     <div className="flex gap-2">
                                        <button 
                                           onClick={() => {
                                              const date = (document.getElementById('batch-attendance-date') as HTMLInputElement).value;
                                              bulkMarkAttendance(date, [{ studentId: student.id, status: 'Present' }]);
                                           }}
                                           className={cn("px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-colors", currentStatus === 'Present' ? "bg-emerald-600 text-white border-emerald-600" : "bg-card border-border hover:border-emerald-500")}
                                        >
                                           Present
                                        </button>
                                        <button 
                                           onClick={() => {
                                              const date = (document.getElementById('batch-attendance-date') as HTMLInputElement).value;
                                              bulkMarkAttendance(date, [{ studentId: student.id, status: 'Absent' }]);
                                           }}
                                           className={cn("px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-colors", currentStatus === 'Absent' ? "bg-rose-600 text-white border-rose-600" : "bg-card border-border hover:border-rose-500")}
                                        >
                                           Absent
                                        </button>
                                     </div>
                                  </div>
                               );
                            })}
                         </div>
                      </div>
                   )}
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}

function TabButton({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl text-left font-black tracking-widest text-[10px] uppercase transition-all whitespace-nowrap shrink-0",
        active 
          ? "bg-indigo-600 text-white shadow-md" 
          : "text-muted-foreground hover:bg-muted/20"
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
