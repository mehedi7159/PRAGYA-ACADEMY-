import React from 'react';
import { BookOpen, CheckCircle, Settings as SettingsIcon, Users, Wallet, Receipt, AlertCircle, FileText, Smartphone, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

import { useAppContext } from '../store/AppContext';
import { translations } from '../lib/translations';

export function Guide() {
  const { language } = useAppContext();
  const t = translations[language];

  const sections = [
    {
       title: t.setupTitle,
       icon: SettingsIcon,
       color: "bg-indigo-500/10 text-indigo-500",
       steps: t.setupSteps as string[]
    },
    {
       title: t.studentDatabaseTitle,
       icon: Users,
       color: "bg-emerald-500/10 text-emerald-500",
       steps: t.admissionSteps as string[]
    },
    {
       title: t.feeCollectionTitle,
       icon: Wallet,
       color: "bg-blue-500/10 text-blue-500",
       steps: t.feeCollectionSteps as string[]
    },
    {
       title: t.expenseTrackerTitle,
       icon: Receipt,
       color: "bg-rose-500/10 text-rose-500",
       steps: t.expenseTrackerSteps as string[]
    },
    {
       title: t.dueListTitle,
       icon: AlertCircle,
       color: "bg-amber-500/10 text-amber-500",
       steps: t.dueListSteps as string[]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 font-plus text-foreground">
      <header className="text-center space-y-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-500 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/20"
        >
           <Sparkles size={14} /> {t.systemDocumentation}
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight flex items-center justify-center gap-3">
           {t.userGuide}
        </h2>
        <p className="text-muted font-medium max-w-2xl mx-auto text-lg">{t.guideDescription}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((section, idx) => (
          <motion.div 
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-card rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-border hover:border-indigo-200 transition-all flex flex-col"
          >
             <div className="flex items-center gap-4 mb-8">
                <div className={`w-14 h-14 ${section.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                   <section.icon size={28} />
                </div>
                <h3 className="text-2xl font-black text-foreground tracking-tight">{section.title}</h3>
             </div>

             <div className="space-y-4 flex-1">
                {section.steps.map((step, i) => (
                   <div key={i} className="flex gap-4 group">
                      <div className="mt-1 w-6 h-6 rounded-full bg-muted/10 text-muted text-[10px] font-black flex items-center justify-center shrink-0 border border-border group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                         {i + 1}
                      </div>
                      <p className="text-muted font-bold leading-relaxed">{step}</p>
                   </div>
                ))}
             </div>
          </motion.div>
        ))}

        {/* Backup Section Special Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-950 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-400 relative overflow-hidden md:col-span-2"
        >
           <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full -mr-32 -mt-32"></div>
           <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full -ml-24 -mb-24"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="w-24 h-24 bg-amber-500/20 text-amber-500 rounded-[2rem] flex items-center justify-center shrink-0 border border-white/10 shadow-inner rotate-12">
                 <ShieldCheck size={48} />
              </div>
              <div className="space-y-4 text-center md:text-left">
                 <h3 className="text-3xl font-black tracking-tight">{t.backupTitle}</h3>
                 <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-amber-500/20 mb-2">
                    <Zap size={14} /> {t.criticalInformation}
                 </div>
                 <p className="text-muted-foreground text-lg font-bold max-w-2xl leading-relaxed">
                    {t.backupWarning}
                 </p>
              </div>
           </div>
        </motion.div>
      </div>

      <footer className="text-center pt-10">
         <div className="inline-flex items-center gap-3 bg-card text-card-foreground px-8 py-4 rounded-3xl border border-border/50 shadow-xl shadow-slate-200/50">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-sm font-black text-foreground uppercase tracking-widest">
               {language === 'en' ? 'PRAGYA ACADEMY • System Version 2.0.4' : 'PRAGYA ACADEMY • সিস্টেম ভার্সন ২.০.৪'}
            </p>
         </div>
      </footer>
    </div>
  );
}
