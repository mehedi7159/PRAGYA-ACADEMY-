import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  Bell, 
  Settings as SettingsIcon,
  ShieldCheck,
  Zap,
  Smartphone,
  Mail,
  History,
  AlertTriangle
} from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { cn } from '../lib/utils';
import { translations } from '../lib/translations';

export function Communication() {
  const { language } = useAppContext();
  const t = translations[language];

  const [activeChannel, setActiveChannel] = useState<'sms' | 'push' | 'email'>('sms');

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 px-5 md:px-0 font-plus text-foreground">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight leading-none uppercase italic">Comm <span className="text-indigo-600">Hub</span></h1>
          <p className="text-muted font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Future-Ready Notification Engine</p>
        </div>
        <div className="px-5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
           <Zap size={14} className="text-amber-500" />
           <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">API Integration Required for Live Sends</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Channel Selection */}
        <div className="lg:col-span-1 flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 snap-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
           {[
             { id: 'sms', label: 'SMS Gateway', icon: Smartphone, desc: 'High priority alerts (Fees, Absence)' },
             { id: 'push', label: 'Push Notifications', icon: Bell, desc: 'App-based real-time updates' },
             { id: 'email', label: 'Email Reports', icon: Mail, desc: 'Performance reports & invoices' },
           ].map(channel => (
             <button
               key={channel.id}
               onClick={() => setActiveChannel(channel.id as any)}
               className={cn(
                 "w-[85vw] sm:w-[300px] lg:w-full p-6 rounded-[2rem] border-2 text-left transition-all shrink-0 snap-start",
                 activeChannel === channel.id 
                   ? "bg-foreground border-foreground text-background shadow-2xl" 
                   : "bg-card border-border text-muted hover:border-indigo-200"
               )}
             >
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", activeChannel === channel.id ? "bg-background/10" : "bg-muted/10")}>
                    <channel.icon size={24} className={activeChannel === channel.id ? "text-background" : "text-muted"} />
                  </div>
                   <div>
                      <p className="text-sm font-black uppercase italic tracking-tight">{channel.label}</p>
                      <p className="text-[10px] font-bold opacity-60">{channel.desc}</p>
                   </div>
                </div>
             </button>
           ))}
        </div>

        {/* Template Manager */}
        <div className="lg:col-span-2 bg-card rounded-[3rem] border border-border shadow-xl overflow-hidden flex flex-col">
           <div className="p-8 border-b border-border flex justify-between items-center bg-muted/5">
              <h3 className="text-xl font-black text-foreground tracking-tight uppercase italic flex items-center gap-3">
                 <MessageSquare size={24} className="text-indigo-600" /> Template Blueprint
              </h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                 <ShieldCheck size={12} /> Sandbox Mode
              </div>
           </div>

           <div className="p-8 space-y-8 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[
                   { title: 'Fee Reminder', body: 'Dear Guardian, Fee for {student_name} is due for {month}. Please pay ৳{amount} by {date}.' },
                   { title: 'Absence Alert', body: 'Alert: {student_name} was absent today. Please ensure regular attendance for better performance.' },
                   { title: 'Exam Result', body: 'Hello, {student_name} scored {marks}/{total} in {exam_name}. Rank: {rank}.' },
                   { title: 'General Notice', body: 'Pragya Academy Notice: {notice_content}. Regards, Office.' },
                 ].map(template => (
                   <div key={template.title} className="p-6 bg-muted/10 border border-border rounded-[2rem] group hover:border-indigo-200 transition-all text-foreground">
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{template.title}</span>
                         <button className="text-muted/40 hover:text-indigo-600 transition-colors"><SettingsIcon size={16} /></button>
                      </div>
                      <p className="text-xs font-bold text-muted leading-relaxed mb-6">{template.body}</p>
                      <button className="w-full py-3 bg-card border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted hover:bg-foreground hover:text-background transition-all flex items-center justify-center gap-2">
                         <Send size={12} /> Test Template
                      </button>
                   </div>
                 ))}
              </div>
           </div>

           <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white"><AlertTriangle size={20} /></div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Infrastructure Notice</p>
                    <p className="text-xs font-bold opacity-60">Connect to a commercial SMS Gateway (Twilio/AWS) to enable live communications.</p>
                 </div>
              </div>
              <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                 System Logs
              </button>
           </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-card rounded-[3rem] border border-border shadow-xl overflow-hidden">
         <div className="p-8 border-b border-border bg-muted/10 flex justify-between items-center">
            <h3 className="text-xl font-black text-foreground tracking-tight uppercase italic flex items-center gap-3">
               <History size={24} className="text-muted" /> Dispatch History
            </h3>
         </div>
         <div className="p-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-muted/10 rounded-full flex items-center justify-center text-muted/30 mb-6 border-2 border-dashed border-border">
               <Send size={40} />
            </div>
            <p className="text-lg font-black text-muted uppercase tracking-[0.2em]">No Transmission Records</p>
            <p className="text-xs font-bold text-muted/40 uppercase tracking-widest mt-2">Active connections required to track history</p>
         </div>
      </div>
    </div>
  );
}
