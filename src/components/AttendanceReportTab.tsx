import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Flame, 
  GraduationCap, 
  Users, 
  Download, 
  FileText, 
  Search, 
  ArrowUpDown, 
  TrendingUp, 
  Clock, 
  Sparkles, 
  User, 
  Briefcase 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';

interface AttendanceReportTabProps {
  stats: any[];
  batchDailyStats: any[];
  teacherStats: any[];
  reportType: 'student' | 'batch' | 'teacher';
  setReportType: (type: 'student' | 'batch' | 'teacher') => void;
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  batches: any[];
  selectedBatch: string;
  setSelectedBatch: (batchName: string) => void;
  language: 'en' | 'bn';
  heatmapData?: { date: string, count: number, density: number }[];
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export default function AttendanceReportTab({
  stats,
  batchDailyStats,
  teacherStats,
  reportType,
  setReportType,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  language,
  heatmapData,
  onExportCSV,
  onExportPDF,
  batches,
  selectedBatch,
  setSelectedBatch
}: AttendanceReportTabProps) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'name' | 'rate-desc' | 'rate-asc'>('rate-desc');

  // Overall metric calculation
  const totalPresent = stats.reduce((sum, s) => sum + s.present, 0);
  const totalAbsent = stats.reduce((sum, s) => sum + s.absent, 0);
  const totalLate = stats.reduce((sum, s) => sum + s.late, 0);
  const totalClasses = totalPresent + totalAbsent + totalLate;
  const attendanceRate = totalClasses > 0 ? ((totalPresent + totalLate) / totalClasses * 100).toFixed(1) : "0";

  // Quick range triggers
  const setQuickRange = (range: 'week' | 'month' | '30days' | 'all') => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    let startStr = '';

    if (range === 'week') {
      const currentDay = today.getDay();
      const distance = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date();
      monday.setDate(today.getDate() + distance);
      startStr = monday.toISOString().slice(0, 10);
    } else if (range === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      startStr = firstDay.toISOString().slice(0, 10);
    } else if (range === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      startStr = thirtyDaysAgo.toISOString().slice(0, 10);
    } else if (range === 'all') {
      startStr = '2025-01-01'; // Default system start standard or earliest recorded
    }

    setStartDate(startStr);
    setEndDate(todayStr);
  };

  const pieData = useMemo(() => [
    { name: language === 'en' ? 'Present' : 'উপস্থিত', value: totalPresent, color: '#10b981' },
    { name: language === 'en' ? 'Absent' : 'অনুপস্থিত', value: totalAbsent, color: '#ef4444' },
    { name: language === 'en' ? 'Late' : 'দেরিতে', value: totalLate, color: '#f59e0b' }
  ], [totalPresent, totalAbsent, totalLate, language]);

  // Handle student calculations, search, & sorting
  const processedStudents = useMemo(() => {
    return stats
      .map(s => {
        const studentTotal = s.present + s.absent + s.late;
        const rate = studentTotal > 0 ? ((s.present + s.late) / studentTotal) * 100 : 0;
        return { ...s, total: studentTotal, rate };
      })
      .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortOrder === 'name') return a.name.localeCompare(b.name);
        if (sortOrder === 'rate-asc') return a.rate - b.rate;
        return b.rate - a.rate; // default 'rate-desc'
      });
  }, [stats, searchQuery, sortOrder]);

  // AI-powered dynamic smart insights based on performance scores
  const scoreInsight = useMemo(() => {
    const rateNum = parseFloat(attendanceRate);
    if (rateNum >= 90) {
      return {
        title: language === 'en' ? "Excellent Turnout" : "চমৎকার উপস্থিতি",
        desc: language === 'en' 
          ? "The attendance velocity is excellent. Maintain momentum by acknowledging top student compliance." 
          : "উপস্থিতি অত্যন্ত চমৎকার অবস্থানে রয়েছে। শীর্ষ শিক্ষার্থীদের অনুপ্রাণিত করুন ও এই ধারাবাহিকতা ধরে রাখুন।",
        color: "text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950/50 bg-emerald-50/50 dark:bg-emerald-950/20"
      };
    } else if (rateNum >= 75) {
      return {
        title: language === 'en' ? "Satisfactory Balance" : "সন্তোষজনক উপস্থিতি",
        desc: language === 'en' 
          ? "Attendance is stable, but brief spikes in late arrivals indicate class scheduling adjustments might be needed." 
          : "উপস্থিতি স্থিতিশীল রয়েছে, তবে দেরিতে পৌঁছানোর হার বেশি হলে ক্লাসের সময়ে কিছুটা সময় সমন্বয় করা প্রয়োজন হতে পারে।",
        color: "text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-950/50 bg-amber-50/50 dark:bg-amber-950/20"
      };
    } else {
      return {
        title: language === 'en' ? "Risk Warning Alert" : "ঝুঁকি সতর্কতা এ্যালার্ট",
        desc: language === 'en' 
          ? "Average attendance is critical. We recommend triggering automated parent warnings for high-risk absentees." 
          : "উপস্থিতির গড় হার ঝুঁকিপূর্ণ। অনুপস্থিত উচ্চ ঝুঁকিতে থাকা শিক্ষার্থীদের অভিভাবকদের সাথে যোগাযোগ করার সুপারিশ করা হচ্ছে।",
        color: "text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-950/50 bg-rose-50/50 dark:bg-rose-950/20"
      };
    }
  }, [attendanceRate, language]);

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar Options */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          
          {/* Quick Filter buttons */}
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mr-1">
              {language === 'en' ? 'Quick period' : 'দ্রুত ফিল্টার'}
            </span>
            <button
              onClick={() => setQuickRange('week')}
              className="px-3.5 py-2 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900 active:scale-95"
            >
              {language === 'en' ? 'This Week' : 'এই সপ্তাহ'}
            </button>
            <button
              onClick={() => setQuickRange('month')}
              className="px-3.5 py-2 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-900 active:scale-95"
            >
              {language === 'en' ? 'This Month' : 'এই মাস'}
            </button>
            <button
              onClick={() => setQuickRange('30days')}
              className="px-3.5 py-2 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-900 active:scale-95"
            >
              {language === 'en' ? 'Last 30 Days' : 'গত ৩০ দিন'}
            </button>
            <button
              onClick={() => setQuickRange('all')}
              className="px-3.5 py-2 text-xs font-bold rounded-xl transition-all border border-slate-200/60 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-900 active:scale-95"
            >
              {language === 'en' ? 'All Time' : 'সব সময়'}
            </button>
          </div>

          {/* Action Export Button slots */}
          <div className="flex items-center justify-end gap-2">
            <button 
              onClick={onExportCSV} 
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
            >
              <Download size={14} /> CSV / EXCEL
            </button>
            <button 
              onClick={onExportPDF} 
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-150 dark:shadow-none active:scale-95"
            >
              <FileText size={14} /> PDF REPORT
            </button>
          </div>

        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800/80 w-full" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Custom Date Picker Fields */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">{language === 'en' ? 'Active Batch' : 'নির্দিষ্ট ব্যাচ'}</span>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-indigo-500 cursor-pointer min-w-40"
              >
                <option value="">{language === 'en' ? 'All Batches' : 'সব ব্যাচ'}</option>
                {batches.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">{language === 'en' ? 'Start Date' : 'শুরুর তারিখ'}</span>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-xl">
                <Calendar size={14} className="text-slate-400" />
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className="bg-transparent text-slate-800 dark:text-slate-100 text-xs font-bold outline-none cursor-pointer" 
                />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">{language === 'en' ? 'End Date' : 'শেষের তারিখ'}</span>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-xl">
                <Calendar size={14} className="text-slate-400" />
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="bg-transparent text-slate-800 dark:text-slate-100 text-xs font-bold outline-none cursor-pointer" 
                />
              </div>
            </div>
          </div>

          {/* Sub-view switches tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700 self-end">
            <button
              onClick={() => setReportType('student')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-extrabold tracking-tight transition-all flex items-center gap-1.5",
                reportType === 'student' 
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/10 dark:border-slate-700/60" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Users size={14} />
              <span>{language === 'en' ? 'Students' : 'শিক্ষার্থী'}</span>
            </button>
            <button
              onClick={() => setReportType('batch')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-extrabold tracking-tight transition-all flex items-center gap-1.5",
                reportType === 'batch' 
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/10 dark:border-slate-700/60" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <TrendingUp size={14} />
              <span>{language === 'en' ? 'Trends' : 'প্রবণতা'}</span>
            </button>
            <button
              onClick={() => setReportType('teacher')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-extrabold tracking-tight transition-all flex items-center gap-1.5",
                reportType === 'teacher' 
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/10 dark:border-slate-700/60" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Briefcase size={14} />
              <span>{language === 'en' ? 'Workload' : 'শিক্ষক কর্মক্ষমতা'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. Key Bird's Eve Metric Overview Card Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 rounded-2xl flex items-center justify-center border border-emerald-100/40 dark:border-emerald-900/10">
            <CheckCircle size={22} />
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider block">{language === 'en' ? 'Attendance Compliance' : 'উপস্থিতির হার'}</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{attendanceRate}%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-450 rounded-2xl flex items-center justify-center border border-indigo-100/40 dark:border-indigo-900/10">
            <Users size={22} />
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider block">{language === 'en' ? 'Report Sample' : 'মোট শিক্ষার্থী নমুনা'}</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-450 rounded-2xl flex items-center justify-center border border-amber-100/40 dark:border-amber-900/10">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider block">{language === 'en' ? 'Class Datapoints' : 'শ্রেণীকক্ষ ডেটাপয়েন্ট'}</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalClasses}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-50 dark:bg-sky-950/30 text-sky-500 dark:text-sky-450 rounded-2xl flex items-center justify-center border border-sky-100/40 dark:border-sky-900/10">
            <Calendar size={22} />
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider block">{language === 'en' ? 'Target Period' : 'রিপোর্ট সময়সীমা'}</span>
            <span className="text-xs font-black text-slate-700 dark:text-slate-350 block mt-1 truncate max-w-40" title={`${startDate} to ${endDate}`}>
              {startDate} / {endDate}
            </span>
          </div>
        </div>

      </div>

      {/* 3. AI Smart Diagnostic Compliance Alert Banner */}
      <div className={cn("p-5 rounded-[2rem] border flex items-start gap-4 transition-all shadow-sm", scoreInsight.color)}>
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 4 }} 
          className="mt-0.5"
        >
          <Sparkles size={20} className="stroke-[2.5]" />
        </motion.div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-wider leading-none mb-1">{scoreInsight.title}</h4>
          <p className="text-xs font-medium leading-relaxed opacity-90">{scoreInsight.desc}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={reportType}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          {/* reportType === 'student': Student analysis Table list */}
          {reportType === 'student' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden whitespace-nowrap">
              
              {/* Context Search and table parameters */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">
                    {language === 'en' ? 'Student Performance Ledger' : 'শিক্ষার্থী উপস্থিতির খতিয়ান'}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold tracking-tight mt-0.5">
                    {language === 'en' 
                      ? 'Detailed breakdown of active students compliance scores.' 
                      : 'সক্রিয় শিক্ষার্থীদের উপস্থিতির পূর্ণ বিবরণ খতিয়ান তালিকা।'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder={language === 'en' ? "Search student name..." : "শিক্ষার্থীর নাম খুঁজুন..."}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-9 py-2 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 w-full sm:w-56"
                    />
                  </div>

                  <select
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-xs font-bold rounded-xl outline-none cursor-pointer text-slate-600 dark:text-slate-300"
                  >
                    <option value="rate-desc">{language === 'en' ? 'Rate: High to Low' : 'শীর্ষ উপস্থিতি দিয়ে'}</option>
                    <option value="rate-asc">{language === 'en' ? 'Rate: Low to High' : 'কম উপস্থিতি দিয়ে'}</option>
                    <option value="name">{language === 'en' ? 'Sort by Name' : 'বর্ণানুক্রমিক নাম দিয়ে'}</option>
                  </select>
                </div>
              </div>

              {/* Roster list block */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-8 py-4.5">{language === 'en' ? 'Student Information' : 'শিক্ষার্থীর তথ্য'}</th>
                      <th className="px-8 py-4.5 text-center">{language === 'en' ? 'Compliance %' : 'উপস্থিতির হার'}</th>
                      <th className="px-8 py-4.5 text-center">{language === 'en' ? 'Present' : 'উপস্থিত'}</th>
                      <th className="px-8 py-4.5 text-center">{language === 'en' ? 'Absent' : 'অনুপস্থিত'}</th>
                      <th className="px-8 py-4.5 text-center">{language === 'en' ? 'Late Logs' : 'দেরিতে'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {processedStudents.map((student, idx) => {
                      // Color spectrum depending on average compliance rate
                      const scoreColor = student.rate >= 90 
                        ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/25" 
                        : student.rate >= 75 
                        ? "text-amber-500 bg-amber-50 dark:bg-amber-950/25" 
                        : "text-rose-500 bg-rose-50 dark:bg-rose-950/25";

                      return (
                        <tr key={idx} className="hover:bg-slate-50/55 dark:hover:bg-slate-800/10 transition-all group">
                          <td className="px-8 py-4.5">
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 bg-indigo-50/40 dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-sm shadow-sm">
                                {(student.name || 'S').charAt(0)}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm group-hover:text-indigo-600 transition-colors">{student.name}</div>
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">REG-00{idx + 130}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-4.5 text-center">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs text-center border border-slate-100 dark:border-transparent leading-none shadow-sm shadow-slate-100/10 dark:shadow-none min-w-20 justify-center">
                              <span className={cn("w-1.5 h-1.5 rounded-full", student.rate >= 90 ? "bg-emerald-500" : student.rate >= 75 ? "bg-amber-550" : "bg-rose-500")} />
                              <span className="font-black text-slate-800 dark:text-slate-200">{student.rate.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-8 py-4.5 text-center font-bold text-slate-700 dark:text-slate-300 text-sm">{student.present}</td>
                          <td className="px-8 py-4.5 text-center font-bold text-slate-700 dark:text-slate-300 text-sm">{student.absent}</td>
                          <td className="px-8 py-4.5 text-center font-bold text-slate-700 dark:text-slate-300 text-sm">{student.late}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {processedStudents.length === 0 && (
                <div className="py-24 text-center">
                  <span className="block opacity-20 text-slate-400 mb-2">
                    <Search size={48} className="mx-auto" />
                  </span>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {language === 'en' ? 'No reports matches your queried criteria' : 'ফিল্টার অনুযায়ী কোনো তথ্য পাওয়া যায়নি'}
                  </p>
                </div>
              )}

            </div>
          )}

          {/* reportType === 'batch': Analytics Trends & Daily breakdown view */}
          {reportType === 'batch' && (
            <div className="space-y-6">
              
              {/* Daily trend and balance charts bento layer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual Attendance breakdown */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 shadow-sm lg:col-span-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{language === 'en' ? 'Attendance Composition' : 'উপস্থিতি অনুপাত বিশ্লেষণ'}</span>
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-bold">
                      {language === 'en' ? 'Visual distribution stats of active logins.' : 'মোট উপস্থিতি, অনুপস্থিতি ও দেরিতে পৌঁছানোর শতাংশ চিত্র।'}
                    </p>
                  </div>

                  <div className="h-64 mt-4 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={pieData} 
                          innerRadius={65} 
                          outerRadius={85} 
                          paddingAngle={3} 
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'solid 1px #e2e8f0', fontFamily: 'Inter' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontFamily: 'Inter', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center justify-center pointer-events-none mt-[-18px]">
                      <span className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">{attendanceRate}%</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{language === 'en' ? 'Compliance' : 'গড় মাত্রা'}</span>
                    </div>
                  </div>
                </div>

                {/* Area trends map */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 shadow-sm lg:col-span-7 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
                      {language === 'en' ? 'Daily Attendance Velocity Trends' : 'শ্রেণীকক্ষ উপস্থিতির দৈনিক গতিধারা'}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-bold">
                      {language === 'en' ? 'Monitor progress across selected chronological window.' : 'নির্ধারিত মেয়াদের মধ্যে দৈনিক শিক্ষার্থীর উপস্থিতির ধারা ট্র্যাক করুন।'}
                    </p>
                  </div>

                  <div className="h-64 mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={batchDailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.4)" />
                        <XAxis dataKey="date" tick={{fontSize: 9, fontWeight: 'bold'}} stroke="#94a3b8" />
                        <YAxis tick={{fontSize: 9, fontWeight: 'bold'}} stroke="#94a3b8" />
                        <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'solid 1px #e2e8f0', fontFamily: 'Inter' }} />
                        <Area type="monotone" name={language === 'en' ? 'Present' : 'উপস্থিত'} dataKey="present" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPresent)" />
                        <Area type="monotone" name={language === 'en' ? 'Absent' : 'অনুপস্থিত'} dataKey="absent" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAbsent)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Attendance velocity heatmap */}
              {heatmapData && heatmapData.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame size={16} className="text-orange-500" />
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                      {language === 'en' ? 'Academic Velocity (Relative Heatmap)' : 'একাডেমিক উপস্থিতি ঘনত্ব তাপচিত্র (হিটম্যাপ)'}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {heatmapData.map((d, i) => (
                      <div 
                        key={i}
                        className={cn(
                          "w-6 h-6 sm:w-8 sm:h-8 rounded-md flex items-center justify-center text-[10px] font-black transition-all relative group cursor-default",
                          d.density === 0 ? "bg-slate-50 dark:bg-slate-950 text-slate-300 dark:text-slate-800 border border-slate-100 dark:border-slate-900" :
                          d.density < 0.5 ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/30 shadow-inner" :
                          d.density < 0.8 ? "bg-emerald-300 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200" :
                          "bg-emerald-500 text-white shadow-md shadow-emerald-100 dark:shadow-none"
                        )}
                        title={`Date: ${d.date} | Class Count: ${d.count}`}
                      >
                        {d.count > 0 && d.count}
                        
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[9px] font-bold whitespace-nowrap px-2 py-1 rounded shadow-md z-40 max-w-xs transition-opacity leading-tight">
                          {d.date}: {d.count} {language === 'en' ? 'Classes Done' : 'ক্লাস সম্পন্ন'}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase mt-4 tracking-wider">
                    {language === 'en' ? '* Represents count of completed sessions per day' : '* প্রতিটি বক্স দ্বারা প্রতিদিনের সম্পন্ন ক্লাসের তথ্য প্রকাশ করছে'}
                  </p>
                </div>
              )}

            </div>
          )}

          {/* reportType === 'teacher': Teacher Productivity layout */}
          {reportType === 'teacher' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
                  {language === 'en' ? 'Teacher Class Volume Allocation' : 'শিক্ষক ক্লাস পরিধি বণ্টন বিশ্লেষণ'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-bold">
                  {language === 'en' ? 'Total complete master classes conducted by academic faculty.' : 'দায়িত্বপ্রাপ্ত শিক্ষকদের মোট বাস্তবায়িত ক্লাসের পরিমাপ ও কার্যতালিকা বিশ্লেষণ।'}
                </p>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teacherStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.4)" />
                    <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 'bold'}} stroke="#94a3b8" />
                    <YAxis tick={{fontSize: 9, fontWeight: 'bold'}} stroke="#94a3b8" />
                    <RechartsTooltip contentStyle={{ borderRadius: '1.2rem', fontFamily: 'Inter' }} />
                    <Bar name={language === 'en' ? 'Completed Sessions' : 'সম্পন্ন ক্লাস'} dataKey="classCount" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40}>
                      {teacherStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#4f46e5'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Interactive list summary for teacher stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                {teacherStats.map((teacher, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                        {teacher.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{teacher.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider mt-0.5">{language === 'en' ? 'Assigned Mentor' : 'দায়িত্বপ্রাপ্ত মেন্টর'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{teacher.classCount}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">{language === 'en' ? 'Classes Done' : 'টি ক্লাস সম্পন্ন'}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
