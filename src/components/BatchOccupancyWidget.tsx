import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Layers, 
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  Flame,
  Search,
  Sparkles
} from 'lucide-react';
import { Batch, Student } from '../types';
import { cn } from '../lib/utils';

interface BatchOccupancyWidgetProps {
  batches: Batch[];
  students: Student[];
  language: 'en' | 'bn';
  selectedBatchId?: string;
  onSelectBatch?: (id: string) => void;
}

export default function BatchOccupancyWidget({
  batches,
  students,
  language,
  selectedBatchId,
  onSelectBatch,
}: BatchOccupancyWidgetProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'full' | 'available'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Calculate occupancy for each batch
  const batchOccupancyData = useMemo(() => {
    return batches.map(batch => {
      const activeStudentsInBatch = students.filter(
        s => s.batch === batch.name && s.status === 'Active'
      ).length;
      
      const maxCap = batch.maxCapacity || 50;
      const percentage = maxCap > 0 ? Math.round((activeStudentsInBatch / maxCap) * 100) : 0;
      const vacancy = Math.max(0, maxCap - activeStudentsInBatch);
      const isOverloaded = activeStudentsInBatch > maxCap;

      // Color coding logic:
      // Emerald if < 60% (plenty of space)
      // Indigo if 60% - 85% (healthy size)
      // Orange if 86% - 99% (nearing maximum space)
      // Rose if >= 100% (at or holding critical limit)
      let colorClass = 'bg-emerald-500';
      let textClass = 'text-emerald-600 dark:text-emerald-400';
      let borderClass = 'border-emerald-100 dark:border-emerald-950/40';
      let bgClass = 'bg-emerald-50 dark:bg-emerald-950/10';

      if (percentage >= 100) {
        colorClass = 'bg-rose-500';
        textClass = 'text-rose-600 dark:text-rose-400';
        borderClass = 'border-rose-100 dark:border-rose-950/40';
        bgClass = 'bg-rose-50 dark:bg-rose-950/10';
      } else if (percentage >= 85) {
        colorClass = 'bg-amber-500';
        textClass = 'text-amber-600 dark:text-amber-400';
        borderClass = 'border-amber-100 dark:border-amber-950/40';
        bgClass = 'bg-amber-50 dark:bg-amber-950/10';
      } else if (percentage >= 60) {
        colorClass = 'bg-indigo-600';
        textClass = 'text-indigo-600 dark:text-indigo-400';
        borderClass = 'border-indigo-100 dark:border-indigo-950/40';
        bgClass = 'bg-indigo-50 dark:bg-indigo-950/10';
      }

      return {
        ...batch,
        studentCount: activeStudentsInBatch,
        maxCapacity: maxCap,
        percentage,
        vacancy,
        isOverloaded,
        colorClass,
        textClass,
        borderClass,
        bgClass,
      };
    });
  }, [batches, students]);

  // 2. Compute aggregate metrics
  const aggregateMetrics = useMemo(() => {
    const activeBatchesOnly = batchOccupancyData.filter(b => b.status === 'Active');
    const totalCapacity = activeBatchesOnly.reduce((sum, b) => sum + b.maxCapacity, 0);
    const totalEnrolled = activeBatchesOnly.reduce((sum, b) => sum + b.studentCount, 0);
    const overallPercentage = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
    
    const highOccupancyCount = activeBatchesOnly.filter(b => b.percentage >= 85).length;
    const lowOccupancyCount = activeBatchesOnly.filter(b => b.percentage < 50).length;

    return {
      totalCapacity,
      totalEnrolled,
      overallPercentage,
      highOccupancyCount,
      lowOccupancyCount,
      activeBatchesCount: activeBatchesOnly.length,
    };
  }, [batchOccupancyData]);

  // 3. Filter data
  const filteredBatches = useMemo(() => {
    return batchOccupancyData.filter(b => {
      // Search matches name
      const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (filterMode === 'full') {
        return b.percentage >= 85;
      }
      if (filterMode === 'available') {
        return b.percentage < 85 && b.status === 'Active';
      }
      return true; // All
    });
  }, [batchOccupancyData, searchQuery, filterMode]);

  return (
    <div className="bg-card border border-border rounded-[2rem] shadow-xl shadow-slate-100/50 dark:shadow-none overflow-hidden transition-all duration-300">
      
      {/* Dynamic Interactive Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-6 flex items-center justify-between cursor-pointer border-b border-border hover:bg-muted/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
            <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-black text-foreground uppercase tracking-tight flex items-center gap-2">
              {language === 'en' ? 'Batch Occupancy Monitor' : 'ব্যাচ ধারণক্ষমতা মনিটর'}
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-[9px] font-black tracking-widest text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-100 dark:border-indigo-900/45">
                LIVE
              </span>
            </h3>
            <p className="text-[10px] md:text-xs text-muted font-bold uppercase tracking-widest">
              {language === 'en' 
                ? 'At-a-glance capacity & enrollment thresholds' 
                : 'ধারণক্ষমতা এবং ছাত্র ভর্তির তথ্য বিবরণী'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick status dots for desktop */}
          <div className="hidden md:flex items-center gap-3 text-[10px] font-black uppercase">
            <span className="flex items-center gap-1 text-rose-500">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
              {aggregateMetrics.highOccupancyCount} {language === 'en' ? 'Critical' : 'জটিল'}
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1 text-emerald-500">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              {aggregateMetrics.activeBatchesCount - aggregateMetrics.highOccupancyCount} {language === 'en' ? 'Healthy' : 'স্বাভাবিক'}
            </span>
          </div>

          <div className="p-1.5 bg-muted/20 hover:bg-muted/30 rounded-full text-foreground transition-all">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Top Stat Summary Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-border bg-slate-50/40 dark:bg-slate-900/20">
              
              <div className="p-5 border-r border-b lg:border-b-0 border-border flex items-center gap-4">
                <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Layers size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted">
                    {language === 'en' ? 'ACTIVE BATCHES' : 'সক্রিয় ব্যাচ সংখ্যা'}
                  </p>
                  <p className="text-lg font-black text-foreground leading-tight">
                    {aggregateMetrics.activeBatchesCount}
                  </p>
                </div>
              </div>

              <div className="p-5 border-b lg:border-b-0 lg:border-r border-border flex items-center gap-4">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted">
                    {language === 'en' ? 'TOTAL SEATS LOADED' : 'মোট শিক্ষার্থীর সিট'}
                  </p>
                  <p className="text-lg font-black text-foreground leading-tight">
                    {aggregateMetrics.totalEnrolled} <span className="text-xs font-bold text-muted">/ {aggregateMetrics.totalCapacity}</span>
                  </p>
                </div>
              </div>

              <div className="p-5 border-r border-border flex items-center gap-4">
                <div className="p-2 bg-indigo-600/10 text-indigo-700 dark:text-indigo-400 rounded-xl">
                  <TrendingUp size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted leading-tight mb-1">
                    {language === 'en' ? 'OVERALL CAP LOAD' : 'সামগ্রিক পূর্ণ লোড'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-foreground leading-none">
                      {aggregateMetrics.overallPercentage}%
                    </span>
                    {/* Ring or simple visual gauge bar */}
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[50px]">
                      <div 
                        className="h-full bg-indigo-600 rounded-full" 
                        style={{ width: `${aggregateMetrics.overallPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 flex items-center gap-4">
                <div className={cn(
                  "p-2 rounded-xl",
                  aggregateMetrics.highOccupancyCount > 0 
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse" 
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                )}>
                  {aggregateMetrics.highOccupancyCount > 0 ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted">
                    {language === 'en' ? 'NEAR CAPACITY (>85%)' : 'পূর্ণ ধারণক্ষমতার কাছাকাছি'}
                  </p>
                  <p className={cn(
                    "text-lg font-black leading-tight",
                    aggregateMetrics.highOccupancyCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                  )}>
                    {aggregateMetrics.highOccupancyCount} {language === 'en' ? 'Batches' : 'টি ব্যাচ'}
                  </p>
                </div>
              </div>

            </div>

            {/* Filters and search box */}
            <div className="p-6 bg-card border-b border-border flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              
              {/* Filter pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar shrink-0">
                <button
                  onClick={() => setFilterMode('all')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                    filterMode === 'all' 
                      ? "bg-slate-900 text-white dark:bg-slate-800" 
                      : "bg-muted/15 text-muted hover:bg-muted/30"
                  )}
                >
                  {language === 'en' ? 'All Batches' : 'সব ব্যাচ'} ({batchOccupancyData.length})
                </button>

                <button
                  onClick={() => setFilterMode('full')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                    filterMode === 'full' 
                      ? "bg-rose-600 text-white" 
                      : "bg-muted/15 text-muted hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
                  )}
                >
                  <Flame size={12} className={filterMode === 'full' ? "animate-bounce" : ""} />
                  {language === 'en' ? 'Near Capacity' : 'ধারণক্ষমতা সমাপ্ত'} ({aggregateMetrics.highOccupancyCount})
                </button>

                <button
                  onClick={() => setFilterMode('available')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                    filterMode === 'available' 
                      ? "bg-emerald-600 text-white" 
                      : "bg-muted/15 text-muted hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20"
                  )}
                >
                  <CheckCircle size={12} />
                  {language === 'en' ? 'Seats Available' : 'সিট খালি আছে'} ({aggregateMetrics.activeBatchesCount - aggregateMetrics.highOccupancyCount})
                </button>
              </div>

              {/* Instant Query box */}
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={language === 'en' ? "Search batch capacity..." : "ব্যাচ ধারণক্ষমতা খুঁজুন..."}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-muted/10 hover:bg-muted/20 focus:bg-card text-xs font-bold border-2 border-border focus:border-indigo-600 rounded-xl transition-all"
                />
              </div>

            </div>

            {/* List grid of occupancies */}
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {filteredBatches.map(b => {
                  const isSelected = selectedBatchId === b.id;

                  return (
                    <motion.div
                      layout
                      onClick={() => onSelectBatch?.(b.id)}
                      key={b.id}
                      className={cn(
                        "p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between group cursor-pointer",
                        isSelected 
                          ? "border-indigo-600 ring-2 ring-indigo-500/10 shadow-lg shadow-indigo-100 dark:shadow-none bg-indigo-50/5 dark:bg-indigo-950/5" 
                          : "border-border bg-card hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
                      )}
                    >
                      {/* Alert banner background glows slightly if critical and hovered */}
                      {b.percentage >= 85 && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 dark:bg-rose-500/10 blur-2xl rounded-full" />
                      )}

                      <div className="flex justify-between items-start mb-4 z-10">
                        <div className="space-y-1 max-w-[70%]">
                          <h4 className="font-extrabold text-sm text-foreground truncate uppercase group-hover:text-indigo-600 transition-colors">
                            {b.name}
                          </h4>
                          <span className={cn(
                            "inline-flex text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                            b.status === 'Active' ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400" : "bg-muted/20 text-muted"
                          )}>
                            {b.status === 'Active' 
                              ? (language === 'en' ? 'Active Batch' : 'সক্রিয় ব্যাচ') 
                              : (language === 'en' ? 'Inactive' : 'নিষ্ক্রিয়')}
                          </span>
                        </div>

                        <div className="text-right">
                          <div className={cn(
                            "text-xs font-black uppercase tracking-tight font-mono px-2 py-1 rounded-lg border",
                            b.borderClass, b.bgClass, b.textClass
                          )}>
                            {b.percentage}%
                          </div>
                        </div>
                      </div>

                      {/* Display Color-Coded Progress Bar */}
                      <div className="space-y-2 z-10">
                        <div className="flex justify-between items-end text-[10px] font-extrabold text-muted">
                          <span>{language === 'en' ? 'Enrollment Scale' : 'ছাত্র ভর্তির অনুপাত'}</span>
                          <span className="font-mono text-foreground font-black">
                            {b.studentCount} / {b.maxCapacity}
                          </span>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="w-full h-3 bg-muted/20 dark:bg-slate-800 rounded-full overflow-hidden border border-border/50 dark:border-slate-700/50 p-[1px] relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, b.percentage)}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className={cn(
                              "h-full rounded-full transition-colors relative", 
                              b.colorClass,
                              b.percentage >= 100 && "animate-pulse" // overbooked pulse alert
                            )}
                          />
                        </div>

                        {/* Helper alerts based on vacancy */}
                        <div className="flex justify-between text-[10px] font-extrabold pt-1">
                          {b.vacancy <= 5 && b.vacancy > 0 && b.status === "Active" ? (
                            <span className="text-amber-500 flex items-center gap-1">
                              <AlertTriangle size={11} />
                              {language === 'en' ? `Only ${b.vacancy} slots left` : `মাত্র ${b.vacancy} টি সিট খালি`}
                            </span>
                          ) : b.vacancy === 0 && b.status === "Active" ? (
                            <span className="text-rose-500 font-black uppercase tracking-wider flex items-center gap-1">
                              <Flame size={11} />
                              {language === 'en' ? 'Strictly Full' : 'কোন সিট খালি নেই'}
                            </span>
                          ) : b.isOverloaded ? (
                            <span className="text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
                              <AlertTriangle size={11} />
                              {language === 'en' ? 'OVER CAPACITY!' : 'অতিরিক্ত ধারণ ক্ষমতা!'}
                            </span>
                          ) : (
                            <span className="text-emerald-500 font-bold flex items-center gap-1">
                              <CheckCircle size={11} />
                              {language === 'en' ? `${b.vacancy} free seats` : `${b.vacancy} টি সিট খালি`}
                            </span>
                          )}

                          {isSelected && (
                            <span className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-[9px] flex items-center gap-0.5">
                              {language === 'en' ? 'SELECTED' : 'নির্বাচিত'}
                              <Sparkles size={10} className="text-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
                            </span>
                          )}
                        </div>
                      </div>

                    </motion.div>
                  );
                })}

                {filteredBatches.length === 0 && (
                  <div className="col-span-full py-12 px-6 border-2 border-dashed border-border rounded-2xl text-center">
                    <Info size={32} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-xs font-bold text-muted uppercase tracking-widest">
                      {language === 'en' ? 'No matching batch occupancy found' : 'ম্যাচিং ব্যাচ ধারণক্ষমতা মিলছে না'}
                    </p>
                    <button 
                      onClick={() => { setSearchQuery(''); setFilterMode('all'); }}
                      className="mt-3 px-3 py-1.5 bg-slate-900 border border-slate-800 text-[10px] text-white font-black uppercase tracking-widest rounded-lg"
                    >
                      {language === 'en' ? 'Reset Filters' : 'ফিল্টার রিসেট করুন'}
                    </button>
                  </div>
                )}

              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
