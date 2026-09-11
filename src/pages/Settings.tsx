import React, { useState, useEffect } from 'react';
import { useAppContext, STORAGE_KEY } from '../store/AppContext';
import { Settings as SettingsIcon, Plus, Trash2, Database, Download, Upload, AlertTriangle, List, Languages, FolderSync, ShieldAlert, Cloud, CloudOff, CheckCircle, Wallet, Save, Activity } from 'lucide-react';
import { translations } from '../lib/translations';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { initAuth, googleSignIn, logout } from '../lib/firebase';
import { uploadToCloud, getCloudBackupMeta, downloadFromCloud } from '../lib/cloudSync';
import { User } from 'firebase/auth';

export function Settings() {
  const { batches, expenseCategories, updateBatch, removeBatch, addExpenseCategory, removeExpenseCategory, language, setLanguage, auditLogs } = useAppContext();
  const t = translations[language];
  
  const [newBatch, setNewBatch] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState<string | null>(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [resetPrompt, setResetPrompt] = useState<string>('');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const [batchError, setBatchError] = useState(false);
  const [catError, setCatError] = useState(false);

  // Cloud sync states
  const [user, setUser] = useState<User | null>(null);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [driveLastSync, setDriveLastSync] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [offlineRestoreConfirm, setOfflineRestoreConfirm] = useState(false);
  const [offlineData, setOfflineData] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(async (u) => {
      setUser(u);
      if (u) {
         try {
           const meta = await getCloudBackupMeta();
           if (meta && meta.updatedAt) {
             const date = new Date(meta.updatedAt);
             setDriveLastSync(date.toLocaleString(language === 'en' ? 'en-US' : 'bn-BD', { dateStyle: 'medium', timeStyle: 'short' }));
           }
         } catch(e) {
            console.error('Failed to get cloud backup meta', e);
         }
      } else {
         setDriveLastSync(null);
      }
    });
    return () => unsubscribe();
  }, [language]);

  const handleDriveConnect = async () => {
    try {
      setIsDriveSyncing(true);
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAlertMsg(language === 'en' ? 'Successfully connected to Cloud. Data will be auto-synced.' : 'সফলভাবে ক্লাউডের সাথে যুক্ত হয়েছে। ডেটা স্বয়ংক্রিয়ভাবে ব্যাকআপ হবে।');
        // Auto trigger sync on connect
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          await uploadToCloud(data);
          setDriveLastSync(new Date().toLocaleString(language === 'en' ? 'en-US' : 'bn-BD', { dateStyle: 'medium', timeStyle: 'short' }));
        }
      }
    } catch (e: any) {
      console.error(e);
      if (e?.code === 'auth/popup-closed-by-user' || e?.message?.includes('popup')) {
        setAlertMsg(language === 'en' 
          ? 'Popup was blocked or closed. Please click the "Open App in New Tab" icon at the top right of this preview, and try connecting from there.' 
          : 'পপআপ ব্লক বা বন্ধ করা হয়েছে। অনুগ্রহ করে এই প্রিভিউয়ের উপরের ডানদিকে "Open App in New Tab" আইকনে ক্লিক করুন এবং সেখান থেকে চেষ্টা করুন।');
      } else {
        setAlertMsg(language === 'en' ? `Failed to connect to Cloud: ${e?.message || 'Network error'}` : `ক্লাউডের সাথে যুক্ত হতে সমস্যা হয়েছে: ${e?.message || 'Network error'}`);
      }
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handleDriveDisconnect = async () => {
    try {
      await logout();
      setUser(null);
      setAlertMsg(language === 'en' ? 'Disconnected from Cloud.' : 'ক্লাউড থেকে সংযোগ বিচ্ছিন্ন করা হয়েছে।');
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualDriveSync = async () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    try {
      setIsDriveSyncing(true);
      await uploadToCloud(data);
      setDriveLastSync(new Date().toLocaleString(language === 'en' ? 'en-US' : 'bn-BD', { dateStyle: 'medium', timeStyle: 'short' }));
      setAlertMsg(language === 'en' ? 'Successfully saved to Cloud.' : 'ক্লাউডে সফলভাবে সংরক্ষণ করা হয়েছে।');
    } catch (e: any) {
      console.error(e);
      setAlertMsg(language === 'en' ? `Backup to Cloud failed: ${e?.message || 'Network Error'}` : `ক্লাউডে সংরক্ষণে সমস্যা হয়েছে: ${e?.message || 'Network Error'}`);
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handleLanguageChange = (lang: 'en' | 'bn') => {
    setLanguage(lang);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim()) {
      addExpenseCategory(newCategory.trim());
      setNewCategory('');
      setCatError(false);
    } else {
      setCatError(true);
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result as string;
        JSON.parse(data); // Validate JSON
        localStorage.setItem(STORAGE_KEY, data);
        window.location.reload();
      } catch (err) {
        setAlertMsg(t.invalidBackupFile);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
     setShowWarning(true);
  };

  const executeReset = () => {
    if (resetPrompt === 'DELETE') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('coaching_management_data_backup');
      window.location.reload();
    } else {
      setAlertMsg(language === 'en' ? 'You must type DELETE exactly.' : 'আপনাকে হুবহু "DELETE" টাইপ করুন।');
    }
  };

  const handleBackup = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academy_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-24 font-plus px-0 md:px-0">
      <header className="px-5 md:px-0 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 px-4 py-2 rounded-full text-[10px] md:text-xs font-black tracking-widest uppercase mb-4 border border-indigo-100 dark:border-indigo-900/30">
             <SettingsIcon size={14} /> {t.systemSettings}
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tight leading-none">
             Configure <span className="text-indigo-600 italic">Academy</span>
          </h2>
          <p className="text-muted font-bold text-xs md:text-lg mt-4 max-w-xl opacity-70">
            {language === 'en' 
              ? 'Manage batches, expenses, data backups, and personalize your experience.' 
              : 'ব্যাচ, খরচ, ডেটা ব্যাকআপ পরিচালনা করুন এবং আপনার অভিজ্ঞতা ব্যক্তিগতকৃত করুন।'}
          </p>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 md:px-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10"
      >
        {/* Language Settings */}
        <div className="bg-card rounded-[3rem] border border-border shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden md:col-span-2 lg:col-span-1">
          <div className="p-8 md:p-10 border-b border-border bg-muted/5 flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none border border-indigo-100 dark:border-indigo-900/30">
                <Languages size={24} />
             </div>
             <div>
                <h3 className="font-black text-foreground text-xl tracking-tight">{t.appLanguage}</h3>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">{t.selectDefaultLanguage}</p>
             </div>
          </div>
          <div className="p-8 md:p-10">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleLanguageChange('en')}
                className={cn(
                  "py-8 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-4 font-black active:scale-95 group cursor-pointer",
                  language === 'en' 
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-xl shadow-indigo-100 dark:shadow-none' 
                    : 'border-border bg-muted/20 text-muted hover:border-indigo-400'
                )}
              >
                <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-transform group-hover:scale-110", language === 'en' ? 'bg-card shadow-xl' : 'bg-muted/30')}>🇺🇸</div>
                <span className="tracking-[0.2em] uppercase text-[10px] font-black">{t.english}</span>
              </button>
              <button 
                onClick={() => handleLanguageChange('bn')}
                className={cn(
                  "py-8 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-4 font-black active:scale-95 group cursor-pointer",
                  language === 'bn' 
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-xl shadow-indigo-100 dark:shadow-none' 
                    : 'border-border bg-muted/20 text-muted hover:border-indigo-400'
                )}
              >
                <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-transform group-hover:scale-110", language === 'bn' ? 'bg-card shadow-xl' : 'bg-muted/30')}>🇧🇩</div>
                <span className="tracking-[0.2em] uppercase text-[10px] font-black">{t.bangla}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[3rem] border border-border shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden md:col-span-2 lg:col-span-1">
          <div className="p-8 md:p-10 border-b border-border bg-muted/5 flex items-center gap-4">
             <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100 dark:shadow-none border border-amber-100 dark:border-amber-900/30">
                <List size={24} />
             </div>
             <div>
                <h3 className="font-black text-foreground text-xl tracking-tight">{t.expenseCategories}</h3>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-0.5">Transaction types</p>
             </div>
          </div>
          <div className="p-8 md:p-10 flex-1 flex flex-col">
            <form onSubmit={handleAddCategory} className="space-y-4 mb-8">
               <div className="flex gap-3">
                 <input 
                    type="text" 
                    value={newCategory} 
                    onChange={e => {
                      setNewCategory(e.target.value);
                      if (catError) setCatError(false);
                    }}
                    placeholder="e.g. Marketing" 
                    className={cn(
                      "flex-1 px-6 py-4 border-2 rounded-2xl focus:outline-none font-bold text-sm md:text-base transition-all bg-muted/10 border-transparent text-foreground",
                      catError ? "border-rose-200 bg-rose-50 dark:bg-rose-900/10" : "focus:border-indigo-500 focus:bg-card"
                    )}
                 />
                 <button type="submit" className="bg-slate-900 dark:bg-indigo-600 hover:bg-amber-600 text-white w-14 h-14 rounded-2xl transition-all flex items-center justify-center shrink-0 shadow-lg active:scale-95 cursor-pointer">
                    <Plus size={24} />
                 </button>
               </div>
            </form>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 flex-1 custom-scrollbar">
               {expenseCategories.map(cat => (
                 <div key={cat} className="flex justify-between items-center p-4 md:p-5 bg-card border-2 border-border rounded-2xl shadow-sm hover:border-amber-100 transition-colors group">
                    <span className="font-black text-sm md:text-base text-foreground truncate tracking-tight">{cat}</span>
                    <button onClick={() => setConfirmDeleteCat(cat)} className="w-10 h-10 rounded-xl bg-muted/20 text-muted flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-900/40 hover:text-rose-600 transition-colors cursor-pointer">
                       <Trash2 size={18} />
                    </button>
                 </div>
               ))}
               {expenseCategories.length === 0 && (
                 <div className="py-10 text-center opacity-20 italic font-black uppercase tracking-widest text-xs text-muted">No categories added</div>
               )}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[3rem] border border-border shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden md:col-span-2 lg:col-span-1">
          <div className="p-8 md:p-10 border-b border-border bg-muted/5 flex items-center gap-4">
             <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 dark:shadow-none border border-emerald-100 dark:border-emerald-900/30">
                <Wallet size={24} />
             </div>
             <div>
                <h3 className="font-black text-foreground text-xl tracking-tight">{language === 'en' ? 'Fee Structure' : 'ফি কাঠামো'}</h3>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-0.5">{language === 'en' ? 'Fees by Batch' : 'ব্যাচ অনুযায়ী ফি'}</p>
             </div>
          </div>
          <div className="p-4 md:p-6 flex-1 flex flex-col">
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 flex-1 custom-scrollbar">
               {batches.map(batch => (
                 <div key={batch.id} className="p-4 md:p-6 bg-card border-2 border-border rounded-2xl shadow-sm space-y-4 hover:border-emerald-100 transition-colors">
                    <h4 className="font-black text-base text-foreground tracking-tight">{batch.name}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">{language === 'en' ? 'Monthly Fee' : 'মাসিক ফি'}</label>
                        <input
                          type="number"
                          value={batch.feeAmount ?? ''}
                          onChange={e => updateBatch(batch.id, { feeAmount: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-3 bg-muted/10 border-2 border-transparent focus:border-emerald-500 rounded-xl text-sm font-bold text-foreground outline-none transition-all"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">{language === 'en' ? 'Discount' : 'ডিসকাউন্ট'}</label>
                        <input
                          type="number"
                          value={batch.discountAmount ?? ''}
                          onChange={e => updateBatch(batch.id, { discountAmount: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-3 bg-muted/10 border-2 border-transparent focus:border-emerald-500 rounded-xl text-sm font-bold text-foreground outline-none transition-all"
                          placeholder="0"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">{language === 'en' ? 'Other Charges' : 'অন্যান্য খরচ'}</label>
                        <input
                          type="number"
                          value={batch.otherCharges ?? ''}
                          onChange={e => updateBatch(batch.id, { otherCharges: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-3 bg-muted/10 border-2 border-transparent focus:border-emerald-500 rounded-xl text-sm font-bold text-foreground outline-none transition-all"
                          placeholder="0"
                        />
                      </div>
                    </div>
                 </div>
               ))}
               {batches.length === 0 && (
                 <div className="py-10 text-center opacity-20 italic font-black uppercase tracking-widest text-xs text-muted">No batches found</div>
               )}
            </div>
          </div>
        </div>

        {/* Database Management section */}
        <div className="bg-card rounded-[3rem] border border-border shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden md:col-span-2">
          {/* Cloud Auto-Backup */}
          <div className="p-8 md:p-10 border-b border-indigo-50 dark:border-indigo-900/30 bg-indigo-50/20 dark:bg-indigo-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-none shrink-0 border border-indigo-500">
                 <Cloud size={32} />
              </div>
              <div className="flex-1 min-w-0">
                 <h3 className="font-black text-foreground text-xl md:text-2xl tracking-tight flex items-center gap-3">
                   {language === 'en' ? 'Cloud Infrastructure' : 'ক্লাউড ইনফ্রাস্ট্রাকচার'}
                   {user && <span className="inline-flex items-center bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] md:text-[10px] uppercase font-black tracking-widest"><CheckCircle size={10} className="mr-1 inline" /> {language === 'en' ? 'Online' : 'অনলাইন'}</span>}
                 </h3>
                 <p className="text-xs md:text-sm font-bold text-muted mt-1">
                   {language === 'en' ? 'Synchronize your academy data globally.' : 'আপনার একাডেমির ডেটা বিশ্বব্যাপী সিঙ্ক্রোনাইজ করুন।'}
                 </p>
              </div>
            </div>
            {user && (
               <button onClick={handleDriveDisconnect} className="px-6 py-2 bg-card hover:bg-rose-50 dark:hover:bg-rose-900/20 text-muted hover:text-rose-600 font-black rounded-xl transition-all text-xs border-2 border-border uppercase tracking-widest active:scale-95 cursor-pointer">
                  {language === 'en' ? 'Disconnect' : 'বিচ্ছিন্ন'}
               </button>
            )}
          </div>

          <div className="p-8 md:p-12 bg-indigo-50/10 dark:bg-indigo-900/5 border-b border-border">
            {(!user) ? (
              <div className="flex flex-col lg:flex-row items-center gap-8 justify-between bg-card border-2 border-indigo-100 dark:border-indigo-900/30 p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-50/50 dark:shadow-none">
                <div className="text-center lg:text-left">
                  <h4 className="font-black text-foreground text-xl md:text-2xl tracking-tight">{language === 'en' ? 'Enable Real-time Sync' : 'রিয়েল-টাইম সিঙ্ক চালু করুন'}</h4>
                  <p className="text-xs md:text-sm font-bold text-muted mt-2">{language === 'en' ? 'Secure, automated backups with your Google account.' : 'আপনার গুগল অ্যাকাউন্টের মাধ্যমে নিরাপদ, স্বয়ংক্রিয় ব্যাকআপ।'}</p>
                </div>
                <button 
                  onClick={handleDriveConnect} 
                  disabled={isDriveSyncing}
                  className="w-full lg:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black transition-all text-sm md:text-base shadow-2xl shadow-indigo-200 dark:shadow-none active:scale-95 cursor-pointer"
                >
                  <Cloud size={20} />
                  {isDriveSyncing ? 'Connecting...' : (language === 'en' ? 'Connect Cloud Account' : 'ক্লাউড একাউন্ট যুক্ত করুন')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-card border-2 border-border p-6 md:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
                  <div className="min-w-0">
                     <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">Connected Account</p>
                     <p className="font-black text-foreground text-sm md:text-lg break-all truncate">{user.email}</p>
                  </div>
                  <div className="text-left md:text-right">
                     <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">Last System Backup</p>
                     <p className="font-black text-emerald-600 text-sm md:text-lg">{driveLastSync || 'Processing...'}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row md:flex-col gap-3">
                  <button 
                    onClick={handleManualDriveSync}
                    disabled={isDriveSyncing}
                    className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black transition-all text-sm shadow-xl active:scale-95 whitespace-nowrap cursor-pointer"
                  >
                    <FolderSync size={20} className={cn(isDriveSyncing && "animate-spin")} />
                    {isDriveSyncing ? 'Syncing...' : (language === 'en' ? 'Manual Sync' : 'ম্যানুয়াল সিঙ্ক')}
                  </button>
                  {!confirmRestore ? (
                    <button 
                      onClick={() => setConfirmRestore(true)}
                      disabled={isDriveSyncing}
                      className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-card border-2 border-indigo-100 dark:border-indigo-900/30 text-indigo-600 rounded-2xl font-black transition-all text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 active:scale-95 whitespace-nowrap cursor-pointer"
                    >
                      <Download size={20} />
                      {language === 'en' ? 'Restore Remote' : 'রিমোট রিস্টোর'}
                    </button>
                  ) : (
                    <div className="flex-1 flex flex-col gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-900/30 rounded-2xl animate-pulse">
                      <p className="text-[10px] font-black text-amber-800 dark:text-amber-400 text-center uppercase tracking-widest leading-none">Overwrite Local Storage?</p>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmRestore(false)} className="flex-1 py-2 bg-card text-muted border border-border rounded-xl text-[10px] font-black cursor-pointer">Cancel</button>
                        <button 
                          onClick={async () => {
                             setIsDriveSyncing(true);
                             try {
                               const content = await downloadFromCloud();
                               if (content && typeof content === 'object') {
                                 localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
                                 window.location.reload();
                               }
                             } catch (e) {
                                console.error(e);
                                setAlertMsg(language === 'en' ? 'Restore Failed. Check connection.' : 'রিস্টোর ব্যর্থ হয়েছে। কানেকশন চেক করুন।');
                             } finally {
                               setIsDriveSyncing(false);
                               setConfirmRestore(false);
                             }
                          }}
                          className="flex-1 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black cursor-pointer"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-8 md:p-10 border-b border-border bg-muted/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 dark:shadow-none border border-blue-100 dark:border-blue-900/30">
               <Database size={24} />
            </div>
            <div>
               <h3 className="font-black text-foreground text-xl tracking-tight">{t.dataManagement}</h3>
               <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-0.5">Local Backup & Restore</p>
            </div>
          </div>
          <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            <div className="border-2 border-border p-8 rounded-[2.5rem] text-center space-y-6 bg-card hover:border-blue-100 transition-colors shadow-sm">
               <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto text-blue-500">
                  <Download size={32} />
               </div>
               <h4 className="font-black text-foreground text-base uppercase tracking-widest">{t.backupData}</h4>
               <button onClick={handleBackup} className="bg-slate-900 dark:bg-indigo-600 text-white px-6 py-4 rounded-xl font-black hover:bg-blue-600 w-full text-xs uppercase tracking-widest transition-all shadow-xl dark:shadow-none active:scale-95 cursor-pointer">
                  {t.downloadBackup}
               </button>
            </div>
            <div className="border-2 border-border p-8 rounded-[2.5rem] text-center space-y-6 bg-card hover:border-emerald-100 transition-colors shadow-sm">
               <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-500">
                  <Upload size={32} />
               </div>
               <h4 className="font-black text-foreground text-base uppercase tracking-widest">{t.restoreData}</h4>
               {!offlineRestoreConfirm ? (
                 <label className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-6 py-4 rounded-xl font-black w-full inline-block cursor-pointer text-xs uppercase tracking-widest transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-900/30">
                    {t.selectBackupFile}
                    <input type="file" accept=".json" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setOfflineData(ev.target?.result as string);
                        setOfflineRestoreConfirm(true);
                      };
                      reader.readAsText(file);
                    }}/>
                 </label>
               ) : (
                 <button 
                  onClick={() => {
                    if(offlineData) {
                      localStorage.setItem(STORAGE_KEY, offlineData);
                      window.location.reload();
                    }
                  }}
                  className="bg-emerald-600 text-white px-6 py-4 rounded-xl font-black w-full text-xs uppercase tracking-widest animate-bounce shadow-xl cursor-pointer"
                 >Confirm Restore</button>
               )}
            </div>
            <div className="border-2 border-rose-50 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-900/10 p-8 rounded-[2.5rem] text-center space-y-6">
               <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mx-auto text-rose-500">
                  <AlertTriangle size={32} />
               </div>
               <h4 className="font-black text-rose-800 dark:text-rose-400 text-base uppercase tracking-widest">{t.factoryReset}</h4>
               <button onClick={handleReset} className="bg-rose-600 text-white px-6 py-4 rounded-xl font-black hover:bg-rose-700 w-full text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 shadow-rose-200 dark:shadow-none cursor-pointer">
                  {t.deleteCompletely}
               </button>
            </div>
          </div>
        </div>

        {/* Audit Log Section */}
        <div className="bg-card rounded-[3rem] border border-border shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden md:col-span-2 lg:col-span-3">
          <div className="p-8 md:p-10 border-b border-border bg-muted/5 flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center shadow-inner border border-slate-200 dark:border-slate-700">
                  <Activity size={24} />
               </div>
               <div>
                  <h3 className="font-black text-foreground text-xl tracking-tight">{language === 'en' ? 'System Audit Log' : 'সিস্টেম অডিট লগ'}</h3>
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-0.5">{language === 'en' ? 'Major Activity Tracking' : 'প্রধান কার্যকলাপ ট্র্যাকিং'}</p>
               </div>
             </div>
             <div className="text-[10px] font-black uppercase text-muted tracking-widest bg-muted/20 px-3 py-1 rounded-full">
               {auditLogs?.length || 0} {language === 'en' ? 'Records' : 'রেকর্ড'}
             </div>
          </div>
          <div className="p-0">
             <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                {(!auditLogs || auditLogs.length === 0) ? (
                   <div className="p-16 text-center text-muted font-bold tracking-widest uppercase text-xs">
                     {language === 'en' ? 'No audit logs found yet. Actions you take will appear here.' : 'এখনো কোনো লগ নেই।'}
                   </div>
                ) : (
                   <div className="divide-y divide-border">
                     {auditLogs.map((log) => (
                        <div key={log.id} className="p-6 md:p-8 hover:bg-muted/5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                           <div>
                              <div className="flex items-center gap-3">
                                 <span className="font-black text-sm text-foreground tracking-tight">{log.action}</span>
                                 <span className="text-[9px] font-black bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full uppercase tracking-widest border border-indigo-100/50 dark:border-indigo-800/30">
                                   {log.user || 'Admin'}
                                 </span>
                              </div>
                              {log.details && (
                                <p className="text-sm font-medium text-muted mt-1">{log.details}</p>
                              )}
                           </div>
                           <div className="text-[10px] font-black text-muted uppercase tracking-wider text-left md:text-right">
                              {new Date(log.timestamp).toLocaleString(language === 'en' ? 'en-US' : 'bn-BD', { dateStyle: 'medium', timeStyle: 'short' })}
                           </div>
                        </div>
                     ))}
                   </div>
                )}
             </div>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      {confirmDeleteBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-[2rem] shadow-2xl w-full max-sm p-8 text-center border border-border">
              <Trash2 className="text-rose-500 mx-auto mb-4" size={32} />
              <h3 className="text-xl font-black text-foreground mb-2">Remove Batch?</h3>
              <div className="flex gap-4">
                <button onClick={() => setConfirmDeleteBatch(null)} className="flex-1 py-4 bg-muted/20 text-muted font-bold rounded-2xl cursor-pointer">Cancel</button>
                <button onClick={() => { removeBatch(confirmDeleteBatch); setConfirmDeleteBatch(null); }} className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-2xl cursor-pointer">Delete</button>
              </div>
           </motion.div>
        </div>
      )}

      {confirmDeleteCat && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-[2rem] shadow-2xl w-full max-sm p-8 text-center border border-border">
              <Trash2 className="text-amber-500 mx-auto mb-4" size={32} />
              <h3 className="text-xl font-black text-foreground mb-2">Remove Category?</h3>
              <div className="flex gap-4">
                <button onClick={() => setConfirmDeleteCat(null)} className="flex-1 py-4 bg-muted/20 text-muted font-bold rounded-2xl cursor-pointer">Cancel</button>
                <button onClick={() => { removeExpenseCategory(confirmDeleteCat); setConfirmDeleteCat(null); }} className="flex-1 py-4 bg-amber-500 text-white font-bold rounded-2xl cursor-pointer">Delete</button>
              </div>
           </motion.div>
        </div>
      )}

      {alertMsg && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center">
           <div className="bg-card rounded-[2rem] shadow-2xl w-full max-sm p-8 text-center border border-border">
              <ShieldAlert className="text-indigo-500 mx-auto mb-4" size={32} />
              <h3 className="text-xl font-black text-foreground mb-2">Notice</h3>
              <p className="text-muted mb-6 font-bold text-sm">{alertMsg}</p>
              <button onClick={() => setAlertMsg(null)} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl cursor-pointer">Okay</button>
           </div>
        </div>
      )}

      {showWarning && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md p-4 flex items-center justify-center">
           <div className="bg-card rounded-[2.5rem] shadow-2xl w-full max-md p-6 md:p-8 border border-border">
              <AlertTriangle className="text-rose-600 mx-auto mb-4 transform rotate-12" size={48} />
              <h3 className="text-2xl font-black text-rose-600 mb-3 text-center">{t.dangerZone}</h3>
              <p className="text-muted mb-6 font-bold text-center text-xs md:text-sm">{t.resetWarning}</p>
              <input 
                type="text" 
                value={resetPrompt} 
                onChange={e => setResetPrompt(e.target.value)} 
                className="w-full px-5 py-4 border-2 border-rose-200 dark:border-rose-900/30 rounded-2xl mb-6 font-black text-center text-rose-600 outline-none uppercase tracking-widest bg-muted/10"
                placeholder="DELETE"
              />
              <div className="flex flex-col gap-3">
                <button onClick={executeReset} className={cn("w-full py-4 font-black rounded-2xl transition-all cursor-pointer", resetPrompt === 'DELETE' ? "bg-rose-600 text-white shadow-xl shadow-rose-200 dark:shadow-none" : "bg-muted text-muted-foreground/30 cursor-not-allowed")}>
                  {t.deleteCompletely}
                </button>
                <button onClick={() => setShowWarning(false)} className="w-full py-4 text-muted font-bold cursor-pointer">Cancel</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
