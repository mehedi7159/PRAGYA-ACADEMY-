import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Users, Layers, Activity } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { cn } from '../lib/utils';
import { translations } from '../lib/translations';

interface BatchInfoModalProps {
  batchName: string;
  onClose: () => void;
}

export function BatchInfoModal({ batchName, onClose }: BatchInfoModalProps) {
  const { batches, students, language } = useAppContext();
  const t = translations[language];

  // Find the requested batch details
  const batchDetails = batches.find(b => b.name === batchName);
  
  // Calculate students in this batch
  const batchStudents = useMemo(() => {
    return students.filter(s => s.batch === batchName);
  }, [students, batchName]);

  if (!batchDetails) {
     return null; // Don't render if batch not found (unlikely but safe)
  }

  // Format dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card text-card-foreground rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative border border-border/50"
      >
        <div className="absolute top-4 right-4 z-10">
          <button 
             onClick={onClose}
             className="w-10 h-10 bg-muted/20 hover:bg-slate-200 text-muted rounded-full flex items-center justify-center transition-colors shadow-sm"
          >
             <X size={18} />
          </button>
        </div>

        <div className="p-8 md:p-10 border-b border-indigo-50 bg-indigo-50/30">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-100 mb-6">
             <Layers size={32} />
          </div>
          <h3 className="font-black text-slate-900 text-2xl tracking-tight mb-2">{batchName}</h3>
          <div className="flex items-center gap-2">
            <span className={cn(
               "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
               batchDetails.status === 'Active' ? "bg-emerald-100 text-emerald-700" : "bg-muted/20 text-muted"
            )}>
              {batchDetails.status}
            </span>
          </div>
        </div>

        <div className="p-8 md:p-10 grid grid-cols-2 gap-6 bg-card text-card-foreground">
          <div className="bg-muted/10 p-5 rounded-3xl border border-border/50 flex flex-col items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-card text-card-foreground flex items-center justify-center shadow-sm text-blue-500">
               <Calendar size={14} />
             </div>
             <div>
               <p className="text-[10px] font-black text-muted-foreground tracking-widest uppercase mb-1">Start Date</p>
               <p className="font-bold text-sm text-foreground">{formatDate(batchDetails.startDate)}</p>
             </div>
          </div>
          <div className="bg-muted/10 p-5 rounded-3xl border border-border/50 flex flex-col items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-card text-card-foreground flex items-center justify-center shadow-sm text-purple-500">
               <Users size={14} />
             </div>
             <div>
               <p className="text-[10px] font-black text-muted-foreground tracking-widest uppercase mb-1">Students</p>
               <p className="font-black text-xl text-foreground">{batchStudents.length}</p>
             </div>
          </div>
          {batchDetails.endDate && (
             <div className="col-span-2 bg-muted/10 p-5 rounded-3xl border border-border/50 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-card text-card-foreground flex items-center justify-center shadow-sm text-rose-500 shrink-0">
                  <Activity size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground tracking-widest uppercase mb-1">Closed On</p>
                  <p className="font-bold text-sm text-foreground">{formatDate(batchDetails.endDate)}</p>
                </div>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
