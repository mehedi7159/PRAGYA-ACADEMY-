import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { translations } from '../lib/translations';
import { Trash2, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export function RecycleBin() {
  const { language, recycleBin = [], restoreFromBin, permanentlyDeleteFromBin, emptyBin } = useAppContext();
  const t = translations[language];

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const handleRestore = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: language === 'en' ? 'Restore Item' : 'আইটেম রিস্টোর',
      message: language === 'en' ? 'Are you sure you want to restore this item?' : 'আপনি কি নিশ্চিত যে আপনি এটি রিস্টোর করতে চান?',
      onConfirm: () => restoreFromBin(id)
    });
  };

  const handlePermanentDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: language === 'en' ? 'Delete Permanently' : 'স্থায়ীভাবে মুছুন',
      message: language === 'en' ? 'Are you sure you want to permanently delete this item? This action cannot be undone.' : 'আপনি কি নিশ্চিত যে আপনি এটি স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফেরানো যাবে না।',
      onConfirm: () => permanentlyDeleteFromBin(id)
    });
  };

  const handleEmptyBin = () => {
    setConfirmDialog({
      isOpen: true,
      title: language === 'en' ? 'Empty Recycle Bin' : 'রিসাইকেল বিন খালি করুন',
      message: language === 'en' ? 'Are you sure you want to empty the recycle bin? All items will be permanently deleted.' : 'আপনি কি রিসাইকেল বিন খালি করতে চান? সমস্ত ডেটা স্থায়ীভাবে মুছে যাবে।',
      onConfirm: () => emptyBin()
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'Student': return language === 'en' ? 'Student' : 'শিক্ষার্থী';
      case 'Teacher': return language === 'en' ? 'Teacher' : 'শিক্ষক';
      case 'Payment': return language === 'en' ? 'Payment' : 'পেমেন্ট';
      case 'Expense': return language === 'en' ? 'Expense' : 'খরচ';
      case 'Batch': return language === 'en' ? 'Batch' : 'ব্যাচ';
      case 'TeacherClassRecord': return language === 'en' ? 'Class Record' : 'ক্লাস রেকর্ড';
      case 'SalaryRecord': return language === 'en' ? 'Salary Record' : 'বেতন রেকর্ড';
      default: return type;
    }
  };

  const getItemPreview = (item: any) => {
    try {
      if (item.type === 'Student' || item.type === 'Teacher') {
        return item.data.name;
      }
      if (item.type === 'Batch') {
        return item.data.name;
      }
      if (item.type === 'Payment') {
        return `${item.data.studentId || ''} - ৳${item.data.amount}`;
      }
      if (item.type === 'Expense') {
        return `${item.data.category} - ৳${item.data.amount}`;
      }
      if (item.type === 'SalaryRecord') {
        return `${item.data.month} - ৳${item.data.totalAmount}`;
      }
      return JSON.stringify(item.data).substring(0, 50) + '...';
    } catch(e) {
      return 'Unknown Data';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">
            {language === 'en' ? 'Recycle Bin' : 'রিসাইকেল বিন'}
          </h1>
          <p className="text-muted font-medium">
            {language === 'en' ? 'Manage deleted items and prevent accidental data loss.' : 'মুছে ফেলা ডেটা পরিচালনা করুন এবং দুর্ঘটনাজনিত মুছে যাওয়া রোধ করুন।'}
          </p>
        </div>
        {recycleBin.length > 0 && (
          <button
            onClick={handleEmptyBin}
            className="px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all border border-rose-200 dark:border-rose-900/30 cursor-pointer"
          >
            <Trash2 size={20} />
            {language === 'en' ? 'Empty Bin' : 'খালি করুন'}
          </button>
        )}
      </div>

      {recycleBin.length === 0 ? (
        <div className="bg-card rounded-3xl p-10 md:p-16 text-center shadow-xl shadow-slate-200/40 dark:shadow-none border border-border">
          <div className="w-24 h-24 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={48} className="text-muted/50" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {language === 'en' ? 'Recycle bin is empty' : 'রিসাইকেল বিন খালি'}
          </h3>
          <p className="text-muted max-w-md mx-auto">
            {language === 'en' ? 'Items you delete will appear here so you can easily restore them if needed.' : 'মুছে ফেলা ডেটা এখানে দেখানো হবে যাতে প্রয়োজনে আপনি সহজেই সেগুলো রিস্টোর করতে পারেন।'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-border overflow-hidden">
          {/* Mobile View: Cards */}
          <div className="md:hidden divide-y divide-border">
            {[...recycleBin].reverse().map((item) => (
              <div key={item.id} className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold px-3 py-1 bg-muted/20 text-muted rounded-lg">
                    {getTypeLabel(item.type)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestore(item.id)}
                      className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                      title="Restore"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(item.id)}
                      className="w-9 h-9 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                      title="Delete Permanently"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground break-words line-clamp-2">
                  {getItemPreview(item)}
                </p>
                <p className="text-[10px] text-muted">
                  {new Date(item.deletedAt).toLocaleString(language === 'en' ? 'en-US' : 'bn-BD', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/10 border-b border-border text-xs uppercase tracking-widest text-muted font-bold">
                  <th className="px-6 py-5">{language === 'en' ? 'Type' : 'ধরন'}</th>
                  <th className="px-6 py-5">{language === 'en' ? 'Details' : 'বিস্তারিত'}</th>
                  <th className="px-6 py-5">{language === 'en' ? 'Deleted At' : 'মুছে ফেলার সময়'}</th>
                  <th className="px-6 py-5 text-right">{language === 'en' ? 'Actions' : 'অ্যাকশন'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...recycleBin].reverse().map((item) => (
                  <tr key={item.id} className="hover:bg-muted/5 transition-all">
                    <td className="px-6 py-6">
                      <span className="text-xs font-bold px-3 py-1 bg-muted/20 text-muted rounded-lg whitespace-nowrap">
                        {getTypeLabel(item.type)}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className="font-medium text-foreground">
                        {getItemPreview(item)}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-sm text-muted whitespace-nowrap">
                      {new Date(item.deletedAt).toLocaleString(language === 'en' ? 'en-US' : 'bn-BD', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-6 font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleRestore(item.id)}
                          className="w-10 h-10 bg-card border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer"
                          title="Restore"
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(item.id)}
                          className="w-10 h-10 bg-card border border-rose-200 dark:border-rose-900/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer"
                          title="Delete Permanently"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-border">
            <div className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-2">{confirmDialog.title}</h3>
              <p className="text-muted">{confirmDialog.message}</p>
            </div>
            <div className="p-4 bg-muted/10 flex justify-end gap-3 rounded-b-2xl border-t border-border">
              <button
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                className="px-4 py-2 font-medium text-muted hover:bg-muted/20 bg-muted/10 rounded-lg transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'বাতিল'}
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                }}
                className="px-4 py-2 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                {language === 'en' ? 'Confirm' : 'নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecycleBin;
