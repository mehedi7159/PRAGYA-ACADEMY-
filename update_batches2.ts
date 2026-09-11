import fs from 'fs';

const combined = `import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Layers, CheckCircle, XCircle, 
  Map as MapIcon, Plus, Calendar, Sparkles, Edit2, Trash2, X
} from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { cn } from '../lib/utils';
import { translations } from '../lib/translations';

// Smart Batch Configurations (persisted locally for pure SPA simplicity)
interface SmartBatchConfig {
  batchId: string;
  daysPerWeek: number;
  classesPerDay: number;
  rotationMode: 'smart' | 'manual';
  subjectMap: { id: string; subject: string; teacherId: string }[];
}

export function Batches() {
  const { language, batches, teachers, teacherRecords, addTeacherRecord, addBatch, updateBatch, removeBatch } = useAppContext();
  
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

  // Modals inside Batches
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '' });
  const [batchError, setBatchError] = useState<string | null>(null);
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState<string | null>(null);

  // SmartBatch UI States
  const [activeTab, setActiveTab] = useState<'planner' | 'tracker' | 'insights'>('tracker');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  const activeBatches = batches; // show all or just active, we show all
  const today = new Date().toISOString().slice(0, 10);
  
  const handleOpenModal = (batch?: any) => {
    if (batch) {
      setEditingBatch(batch);
      setFormData({ name: batch.name, startDate: batch.startDate || '', endDate: batch.endDate || '' });
    } else {
      setEditingBatch(null);
      setFormData({ name: '', startDate: '', endDate: '' });
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

    if (editingBatch) {
      updateBatch(editingBatch.id, { name: trimmedName, startDate: formData.startDate, endDate: formData.endDate });
    } else {
      addBatch({ name: trimmedName, startDate: formData.startDate, endDate: formData.endDate, sessions: [] });
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
          { id: '1', subject: 'Mathematics', teacherId: teachers[0]?.id || '' }
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
  const todayRecords = teacherRecords.filter(r => r.batchId === selectedBatchId && r.date === today);

  const generateTodayClasses = () => {
    if (!currentConfig || currentConfig.subjectMap.length === 0) return [];
    let generated = [];
    for (let i = 0; i < currentConfig.classesPerDay; i++) {
        const mapIdx = currentConfig.rotationMode === 'smart' 
                       ? (new Date().getDay() + i) % currentConfig.subjectMap.length
                       : i % currentConfig.subjectMap.length;
        const subjMap = currentConfig.subjectMap[mapIdx];
        if (subjMap) {
            generated.push({ index: i + 1, subject: subjMap.subject, defaultTeacherId: subjMap.teacherId, topic: \`\${subjMap.subject} Session \${i+1}\` });
        }
    }
    return generated;
  };

  const dailyClasses = generateTodayClasses();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase italic">{language === 'en' ? 'Smart Batches' : 'স্মার্ট ব্যাচ'}</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{language === 'en' ? 'Manage & Track Intelligent Batches' : 'স্মার্ট ব্যাচসমূহ পরিচালনা করুন'}</p>
         </div>
         <button 
           onClick={() => handleOpenModal()}
           className="bg-indigo-600 hover:bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest sm:shadow-xl sm:shadow-indigo-200 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
         >
           <Plus size={16} /> {language === 'en' ? 'Add New Batch' : 'নতুন ব্যাচ'}
         </button>
       </div>

       {batches.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-xl shadow-slate-200/50">
             <Layers size={48} className="mx-auto text-slate-200 mb-6" />
             <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">{language === 'en' ? 'No Batches Found' : 'কোন ব্যাচ পাওয়া যায়নি'}</h3>
             <p className="text-sm font-bold text-slate-400 max-w-md mx-auto mb-8 uppercase tracking-widest">
                {language === 'en' ? 'Create your first batch to start assigning teachers, planning smart rotations, and tracking progress.' : 'টিচার অ্যাসাইন, রুটিন প্ল্যানিং এবং ট্র্যাকিং করতে আপনার প্রথম ব্যাচটি তৈরি করুন।'}
             </p>
             <button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 transition-all inline-flex items-center justify-center gap-2">
               <Plus size={16} /> {language === 'en' ? 'Add Batch' : 'ব্যাচ তৈরি করুন'}
             </button>
          </div>
       ) : (
         <>
           {/* Unified Sub Navigation Tabs */}
           <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar border-b border-slate-200">
              <button 
                 onClick={() => setActiveTab('tracker')}
                 className={cn("px-4 py-2 rounded-t-xl text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap", activeTab === 'tracker' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
              >
                 {language === 'en' ? 'Daily Tracker' : 'ডেইলি ট্র্যাকার'}
              </button>
              <button 
                 onClick={() => setActiveTab('planner')}
                 className={cn("px-4 py-2 rounded-t-xl text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap", activeTab === 'planner' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
              >
                 {language === 'en' ? 'Batch Planner' : 'ব্যাচ প্ল্যানার'}
              </button>
              <button 
                 onClick={() => setActiveTab('insights')}
                 className={cn("px-4 py-2 rounded-t-xl text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap flex items-center gap-1", activeTab === 'insights' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
              >
                 <Sparkles size={12} className={activeTab === 'insights' ? "text-amber-300" : "text-amber-500"}/>
                 {language === 'en' ? 'AI Insights' : 'এআই অন্তর্দৃষ্টি'}
              </button>
           </div>

           {/* Batch Selection Banner */}
           <div className="flex flex-wrap gap-2 mb-4 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100">
              {batches.map(b => (
                 <div key={b.id} className="relative group">
                    <button 
                      onClick={() => handleSelectBatch(b.id)}
                      className={cn("px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap tracking-wide border-2 transition-all shadow-sm flex items-center gap-2", selectedBatchId === b.id ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-200" : "bg-white text-slate-600 border-slate-100 hover:border-slate-300 hover:bg-slate-50")}
                    >
                      {b.name}
                    </button>
                 </div>
              ))}
           </div>

           {/* Tabs Payload */}
           {currentConfig && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 {activeTab === 'tracker' && (
                    <div className="bg-white p-4 sm:p-6 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col gap-6">
                       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">{language === 'en' ? "Today's Target Classes" : "আজকের ক্লাসসমূহ"}</h3>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">{new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</p>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                             <button 
                                onClick={() => handleOpenModal(batches.find(b => b.id === selectedBatchId))}
                                className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest px-3 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1"
                             >
                                <Edit2 size={14} /> Edit Batch
                             </button>
                             <button 
                                onClick={() => setConfirmDeleteBatch(selectedBatchId)}
                                className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                             >
                                <Trash2 size={14} /> Delete Batch
                             </button>
                          </div>
                       </div>

                       {currentConfig.subjectMap.length === 0 ? (
                         <div className="text-center py-12 px-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50">
                           <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                             Go to Planner to assign Subjects & Teachers
                           </p>
                         </div>
                       ) : (
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {dailyClasses.map((cls, idx) => {
                               const savedRec = todayRecords.find(r => r.topic === cls.topic);
                               const currentTeacherId = savedRec ? savedRec.teacherId : cls.defaultTeacherId;
                               const th = teachers.find(t => t.id === currentTeacherId);

                               return (
                                  <div key={idx} className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 flex items-center justify-between gap-4 relative overflow-hidden group">
                                    {savedRec?.status === 'Completed' && <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l from-emerald-500/10 to-transparent"></div>}
                                    {savedRec?.status === 'Absent' && <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l from-rose-500/10 to-transparent"></div>}
                                    
                                    <div>
                                       <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-white px-2 py-1 rounded-md shadow-sm border border-indigo-100">Session {cls.index}</span>
                                       <h4 className="font-black text-slate-900 mt-2 text-lg">{cls.subject}</h4>
                                       <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1.5 line-clamp-1">
                                          <span className="w-5 h-5 bg-white shadow-sm border border-slate-200 rounded-md flex items-center justify-center text-[10px] text-slate-500">{th?.name?.charAt(0) || '?'}</span> 
                                          {th?.name || 'Unassigned Teacher'}
                                       </p>
                                    </div>
                                    <div className="flex flex-col gap-2 shrink-0 z-10">
                                       <button 
                                          onClick={() => {
                                             if (savedRec) deleteTeacherRecord(savedRec.id);
                                             addTeacherRecord({ id: \`TCR-\${Date.now()}-\${cls.index}\`, teacherId: currentTeacherId, batchId: selectedBatchId, date: today, startTime: '10:00', endTime: '11:00', topic: cls.topic, isPaid: true, subject: cls.subject, status: 'Completed' });
                                          }}
                                          className={cn("w-10 h-10 border-2 rounded-xl flex items-center justify-center transition-all", savedRec?.status === 'Completed' ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105" : "bg-white border-slate-200 text-slate-400 hover:border-emerald-200 hover:text-emerald-500")}
                                       >
                                          <CheckCircle size={18} />
                                       </button>
                                       <button 
                                          onClick={() => {
                                             if (savedRec) deleteTeacherRecord(savedRec.id);
                                             addTeacherRecord({ id: \`TCR-\${Date.now()}-\${cls.index}\`, teacherId: currentTeacherId, batchId: selectedBatchId, date: today, startTime: '10:00', endTime: '11:00', topic: cls.topic, isPaid: false, subject: cls.subject, status: 'Absent' });
                                          }}
                                          className={cn("w-10 h-10 border-2 rounded-xl flex items-center justify-center transition-all", savedRec?.status === 'Absent' ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-200 scale-105" : "bg-white border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-500")}
                                       >
                                          <XCircle size={18} />
                                       </button>
                                    </div>
                                  </div>
                               )
                            })}
                         </div>
                       )}
                    </div>
                 )}

                 {activeTab === 'planner' && (
                    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col gap-8">
                       <div>
                          <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">{language === 'en' ? "Batch Parameters" : "ব্যাচ কনফিগারেশন"}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'en' ? "AI Engine Generation Rules" : "এআই জেনারেশন রুলস"}</p>
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-slate-100">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Days Per Week</label>
                              <select 
                                value={currentConfig.daysPerWeek}
                                onChange={(e) => setConfigs(prev => prev.map(c => c.batchId === selectedBatchId ? { ...c, daysPerWeek: parseInt(e.target.value) } : c))}
                                className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
                              >
                                 {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} Days</option>)}
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Classes Per Day</label>
                              <select 
                                value={currentConfig.classesPerDay}
                                onChange={(e) => setConfigs(prev => prev.map(c => c.batchId === selectedBatchId ? { ...c, classesPerDay: parseInt(e.target.value) } : c))}
                                className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
                              >
                                 {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Classes</option>)}
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rotation Mode</label>
                              <select 
                                value={currentConfig.rotationMode}
                                onChange={(e) => setConfigs(prev => prev.map(c => c.batchId === selectedBatchId ? { ...c, rotationMode: e.target.value as 'smart' | 'manual' } : c))}
                                className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
                              >
                                 <option value="smart">Smart Engine</option>
                                 <option value="manual">Fixed / Manual</option>
                              </select>
                          </div>
                       </div>

                       <div>
                          <div className="flex justify-between items-center mb-6">
                             <div>
                               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{language === 'en' ? 'Faculty & Subject Mapping' : 'ফ্যাকাল্টি ম্যাপিং'}</h3>
                             </div>
                             <button 
                               onClick={() => setConfigs(prev => prev.map(c => c.batchId !== selectedBatchId ? c : { ...c, subjectMap: [...c.subjectMap, { id: Date.now().toString(), subject: '', teacherId: teachers[0]?.id || '' }] }))}
                               className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 border border-indigo-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex gap-1 items-center"
                             >
                                <Plus size={14} /> Add Pattern
                             </button>
                          </div>
                          
                          <div className="space-y-3">
                              {currentConfig.subjectMap.length === 0 && (
                                <div className="text-center py-6 border border-slate-200 border-dashed rounded-xl text-slate-400 font-bold text-xs">No subjects mapped. Click Add Pattern.</div>
                              )}
                              {currentConfig.subjectMap.map((map, i) => (
                                  <div key={map.id} className="flex flex-col sm:flex-row gap-3 items-center bg-white p-3 rounded-2xl border-2 border-slate-100 group hover:border-indigo-200 transition-colors">
                                      <span className="w-8 h-8 flex shrink-0 items-center justify-center bg-indigo-50 text-indigo-700 font-black rounded-xl text-xs">{i+1}</span>
                                      <input 
                                         value={map.subject}
                                         placeholder="e.g. Higher Math"
                                         onChange={(e) => setConfigs(prev => prev.map(c => c.batchId !== selectedBatchId ? c : { ...c, subjectMap: c.subjectMap.map((m, idx) => idx === i ? {...m, subject: e.target.value} : m) }))}
                                         className="flex-1 border-0 bg-slate-50 px-4 py-3 rounded-xl text-sm font-bold w-full outline-none focus:ring-2 focus:ring-indigo-100"
                                      />
                                      <select 
                                         value={map.teacherId}
                                         onChange={(e) => setConfigs(prev => prev.map(c => c.batchId !== selectedBatchId ? c : { ...c, subjectMap: c.subjectMap.map((m, idx) => idx === i ? {...m, teacherId: e.target.value} : m) }))}
                                         className="flex-1 border-0 bg-slate-50 px-4 py-3 rounded-xl text-sm font-bold w-full outline-none focus:ring-2 focus:ring-indigo-100"
                                      >
                                         <option value="">-- Choose Teacher --</option>
                                         {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                      </select>
                                      <button 
                                        onClick={() => setConfigs(prev => prev.map(c => c.batchId !== selectedBatchId ? c : { ...c, subjectMap: c.subjectMap.filter((_, idx) => idx !== i) }))}
                                        className="p-3 text-rose-300 hover:text-white hover:bg-rose-500 rounded-xl transition-colors shrink-0"
                                      >
                                         <Trash2 size={16} />
                                      </button>
                                  </div>
                              ))}
                          </div>
                       </div>
                    </div>
                 )}

                 {activeTab === 'insights' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-emerald-100 shadow-xl shadow-emerald-50">
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                             <CheckCircle size={24} />
                          </div>
                          <h3 className="font-black text-slate-800 text-lg tracking-tight uppercase">High Consistency</h3>
                          <p className="mt-2 text-xs font-bold text-slate-500 leading-relaxed max-w-sm">
                             {language === 'en' ? 'Batch "Class 10 (Science)" has completed 98% of their planned classes. No intervention needed at this time.' : 'এই ব্যাচটি প্রায় ৯৮% ক্লাস শিডিউল সফলভাবে সম্পন্ন করেছে।'}
                          </p>
                       </div>
                       <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-amber-100 shadow-xl shadow-amber-50">
                          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                             <MapIcon size={24} />
                          </div>
                          <h3 className="font-black text-slate-800 text-lg tracking-tight uppercase">Subject Imbalance Detected</h3>
                          <p className="mt-2 text-xs font-bold text-slate-500 leading-relaxed max-w-sm">
                             {language === 'en' ? 'Physics is receiving less allocation time compared to Mathematics over the past 14 days.' : 'গত ১৪ দিনে ফিজিক্সে কম সময় বরাদ্দ হয়েছে।'}
                          </p>
                       </div>
                    </div>
                 )}
              </motion.div>
           )}
         </>
       )}

       {/* Add / Edit Batch Modal */}
       {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="p-6 md:p-8 border-b border-slate-50 flex items-center justify-between">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                      {editingBatch ? (language === 'en' ? 'Edit Batch' : 'ব্যাচ সম্পাদনা') : (language === 'en' ? 'New Batch' : 'নতুন ব্যাচ')}
                   </h3>
                   <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors">
                      <X size={18} />
                   </button>
                </div>
                <div className="p-6 md:p-8">
                   <form onSubmit={handleSaveBatch} className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{language === 'en' ? 'Batch Name' : 'ব্যাচের নাম'}</label>
                         <input 
                            type="text" 
                            value={formData.name} 
                            onChange={e => { setFormData({...formData, name: e.target.value}); setBatchError(null); }}
                            className={cn("w-full px-5 py-4 border-2 rounded-xl text-sm font-bold outline-none", batchError ? "border-rose-300 focus:border-rose-500 bg-rose-50" : "bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white")}
                            placeholder="e.g. HSC 2025" 
                         />
                         {batchError && <p className="text-rose-500 text-xs font-bold mt-1">{batchError}</p>}
                      </div>
                      <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-colors">
                         {editingBatch ? 'Save Changes' : 'Create Batch'}
                      </button>
                   </form>
                </div>
             </motion.div>
          </div>
       )}

       {/* Delete Confirm Modal */}
       {confirmDeleteBatch && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Delete Batch?</h3>
              <p className="text-sm font-bold text-slate-500 mt-2">This action is irreversible.</p>
              <div className="flex gap-3 mt-8">
                 <button onClick={() => setConfirmDeleteBatch(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-black text-xs uppercase tracking-widest transition-all">Cancel</button>
                 <button onClick={() => { removeBatch(confirmDeleteBatch); setConfirmDeleteBatch(null); }} className="flex-1 py-3 bg-rose-600 text-white hover:bg-rose-700 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-200">Delete</button>
              </div>
           </motion.div>
         </div>
       )}
    </div>
  );
}`;

fs.writeFileSync('src/pages/Batches.tsx', combined);
