import React, { useState, useRef, useMemo } from 'react';
import { 
  FileText, 
  Trash2, 
  Download, 
  Eye, 
  Plus, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  UploadCloud,
  ChevronDown,
  X,
  FileCode,
  FileCheck,
  Award,
  BookOpen
} from 'lucide-react';
import { Student, StudentDocument } from '../types';
import { cn } from '../lib/utils';

interface StudentDocumentsProps {
  student: Student;
  onUpdateDocuments: (updatedDocs: StudentDocument[]) => void;
  language: 'en' | 'bn';
}

export default function StudentDocuments({ student, onUpdateDocuments, language }: StudentDocumentsProps) {
  const documents = student.documents || [];
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | StudentDocument['type']>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [newDocType, setNewDocType] = useState<StudentDocument['type']>('id_card');
  const [newDocTitle, setNewDocTitle] = useState('');
  
  // Image preview state
  const [previewDoc, setPreviewDoc] = useState<StudentDocument | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Translations
  const t = {
    en: {
      title: "Document Repository",
      subtitle: "Secure cloud-synced student profiles attachments",
      searchPlaceholder: "Search document title or file name...",
      all: "All Documents",
      id_card: "Student ID Card",
      transcript: "Academic Transcript",
      fee_agreement: "Fee Agreement",
      other: "Other Records",
      uploadedOn: "Uploaded on",
      uploadedBy: "By",
      noDocs: "No documents attached to this profile.",
      uploadAreaTitle: "Drag & drop file here or click to choose",
      uploadAreaLimit: "Support images and standard document formats (Max 5MB)",
      addDocument: "Add Document Attachment",
      docTitleLabel: "Custom Title (optional)",
      docTypeLabel: "Document Category",
      uploadBtn: "Save File Attachment",
      deleteConfirm: "Are you sure you want to delete this document?",
      downloadTooltip: "Download file to your computer",
      previewTooltip: "Open image preview",
      successAdded: "Document added successfully!",
      successDeleted: "Document deleted.",
      errorSize: "File is too large. Max size is 5MB.",
      errorUpload: "Failed to read the file. Please try again.",
      categoryLabel: "Filter by category",
      filesize: "Size"
    },
    bn: {
      title: "নথি সংগ্রহশালা",
      subtitle: "শিক্ষার্থীর প্রোফাইলে সংযুক্ত সুনিরাপদ ও ক্লাউড-সংরক্ষিত নথিসমূহ",
      searchPlaceholder: "ডকুমেন্টের শিরোনাম বা নাম দিয়ে খুঁজুন...",
      all: "সমস্ত নথি",
      id_card: "শিক্ষার্থী আইডি কার্ড",
      transcript: "একাডেমিক ট্রান্সক্রিপ্ট",
      fee_agreement: "ফি পরিশোধ চুক্তিপত্র",
      other: "অন্যান্য নথি",
      uploadedOn: "আপলোড করা হয়েছে",
      uploadedBy: "দ্বারা",
      noDocs: "এই শিক্ষার্থীর কোনো নথি এখনও দেওয়া হয়নি।",
      uploadAreaTitle: "এখানে ফাইলটি টেনে আনুন অথবা ক্লিক করে ফাইল নির্বাচন করুন",
      uploadAreaLimit: "ছবি এবং সাধারণ ডকুমেন্ট ফরম্যাট সমর্থন করে (সর্বোচ্চ ৫ মেগাবাইট)",
      addDocument: "নতুন নথি সংযুক্ত করুন",
      docTitleLabel: "কাস্টম শিরোনাম (ঐচ্ছিক)",
      docTypeLabel: "ডকুমেন্টের ধরন",
      uploadBtn: "সংযুক্তি সংরক্ষণ করুন",
      deleteConfirm: "আপনি কি নিশ্চিত যে এই নথিটি মুছে ফেলতে চান?",
      downloadTooltip: "আপনার কম্পিউটারে ফাইল ডাউনলোড করুন",
      previewTooltip: "ছবি আকারে দেখুন",
      successAdded: "ডকুমেন্টটি সফলভাবে সংযুক্ত হয়েছে!",
      successDeleted: "ডকুমেন্টটি মুছে ফেলা হয়েছে।",
      errorSize: "ফাইলটি অনেক বড়। ফাইল সাইজ ৫ মেগাবাইটের কম হতে হবে।",
      errorUpload: "ফাইল পড়া যায়নি। আবার চেষ্টা করুন।",
      categoryLabel: "বিভাগ অনুযায়ী ফিল্টার",
      filesize: "সাইজ"
    }
  }[language];

  // Map categories to friendly labels
  const getCategoryLabel = (type: StudentDocument['type']) => {
    switch(type) {
      case 'id_card': return t.id_card;
      case 'transcript': return t.transcript;
      case 'fee_agreement': return t.fee_agreement;
      default: return t.other;
    }
  };

  // Filter documents based on inputs
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || doc.type === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchTerm, selectedCategory]);

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(t.errorSize);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      try {
        const fileDataResult = uploadEvent.target?.result as string;
        if (!fileDataResult) {
          throw new Error('No target data found');
        }

        const newDoc: StudentDocument = {
          id: `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          studentId: student.id,
          title: newDocTitle.trim() || file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
          type: newDocType,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
          fileData: fileDataResult,
          uploadedAt: new Date().toISOString(),
          uploadedBy: language === 'en' ? 'Administrative Staff' : 'প্রশাসনিক কর্মকর্তা'
        };

        const updated = [...documents, newDoc];
        onUpdateDocuments(updated);
        
        // Reset local form states
        setNewDocTitle('');
        setIsUploading(false);
      } catch (err) {
        console.error('File parsing error:', err);
        setUploadError(t.errorUpload);
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setUploadError(t.errorUpload);
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDeleteDoc = (docId: string) => {
    if (window.confirm(t.deleteConfirm)) {
      const updated = documents.filter(d => d.id !== docId);
      onUpdateDocuments(updated);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  return (
    <div className="space-y-6" id="student-document-repository">
      
      {/* Tab/Section title */}
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            {t.title}
          </h3>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
            {t.subtitle}
          </p>
        </div>
        
        <span className="text-xs font-mono font-black py-1 px-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
          {documents.length} Attachment{documents.length !== 1 && 's'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Add/Upload Zone (4 cols) */}
        <div className="lg:col-span-4 bg-slate-50/50 border border-border/50 p-5 rounded-3xl space-y-4">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">
            {t.addDocument}
          </h4>

          <div className="space-y-4">
            
            {/* Title field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                {t.docTitleLabel}
              </label>
              <input
                type="text"
                value={newDocTitle}
                onChange={e => setNewDocTitle(e.target.value)}
                placeholder="E.g., Nid Card Mehedi"
                className="w-full px-3.5 py-2 bg-card text-card-foreground border border-border focus:border-indigo-600 rounded-xl text-xs font-bold leading-tight"
              />
            </div>

            {/* Document type selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                {t.docTypeLabel}
              </label>
              <div className="relative">
                <select
                  value={newDocType}
                  onChange={e => setNewDocType(e.target.value as any)}
                  className="w-full appearance-none px-3.5 py-2 bg-card text-card-foreground border border-border focus:border-indigo-600 rounded-xl text-xs font-bold leading-tight"
                >
                  <option value="id_card">{t.id_card}</option>
                  <option value="transcript">{t.transcript}</option>
                  <option value="fee_agreement">{t.fee_agreement}</option>
                  <option value="other">{t.other}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Drag & Drop File Zone */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={cn(
                "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2",
                dragActive 
                  ? "border-indigo-500 bg-indigo-50/10 scale-[1.02]" 
                  : "border-border hover:border-indigo-500 hover:bg-muted/10 bg-card text-card-foreground"
              )}
            >
              <input 
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInputChange}
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              />

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                <UploadCloud size={24} className="animate-pulse" />
              </div>

              <div>
                <p className="text-xs font-black text-foreground leading-tight">
                  {t.uploadAreaTitle}
                </p>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
                  {t.uploadAreaLimit}
                </p>
              </div>

              {isUploading && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-black mt-2">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
                  <span>Processing Attachment...</span>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-rose-700 font-bold flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

          </div>

        </div>

        {/* Right column: Document Listing and interactive Filters (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Categories Horizontal Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex bg-slate-50/80 p-0.5 rounded-2xl border border-border/50 w-full sm:w-auto overflow-x-auto whitespace-nowrap shrink-0 max-w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden gap-1.5">
              {(['all', 'id_card', 'transcript', 'fee_agreement', 'other'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex-1 sm:flex-initial text-center whitespace-nowrap min-w-[70px] sm:min-w-0",
                    selectedCategory === cat 
                      ? "bg-card text-card-foreground text-indigo-600 shadow-sm border border-border/50" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat === 'all' ? t.all : getCategoryLabel(cat)}
                </button>
              ))}
            </div>

            {/* Sub-search input */}
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-4 py-1.5 bg-muted/10 hover:bg-slate-100/50 focus:bg-card text-card-foreground border border-border focus:border-indigo-500 rounded-xl text-xs font-medium transition-all"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
            </div>
          </div>

          {/* Cards dynamic listing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
            
            {filteredDocs.map(doc => {
              const isImg = isImageFile(doc.fileType);

              return (
                <div 
                  key={doc.id}
                  className="bg-card text-card-foreground border border-border/50 rounded-2xl p-4 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between group relative"
                >
                  <div className="flex justify-between items-start gap-2">
                    
                    {/* File icon preview depending on image status */}
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-muted/10 border border-border/50 group-hover:bg-indigo-50/50 group-hover:border-indigo-100 transition-colors shrink-0">
                        {isImg ? (
                          <Award className="text-emerald-500" size={18} />
                        ) : doc.type === 'fee_agreement' ? (
                          <FileCheck className="text-purple-500" size={18} />
                        ) : (
                          <FileText className="text-indigo-600" size={18} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase text-indigo-600 block leading-none mb-1">
                          {getCategoryLabel(doc.type)}
                        </span>
                        <h5 className="text-xs font-black text-foreground uppercase tracking-tight truncate max-w-[140px]">
                          {doc.title}
                        </h5>
                        <p className="text-[9px] text-muted-foreground font-mono truncate max-w-[140px]">
                          {doc.fileName}
                        </p>
                      </div>
                    </div>

                    {/* Actions moved to bottom */}

                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                    
                    <div className="text-[9px] text-muted-foreground font-bold uppercase">
                      <span>{t.filesize}: {formatSize(doc.fileSize)}</span>
                    </div>

                    {/* Active Download & Viewer Triggers */}
                    <div className="flex items-center gap-1.5">
                      
                      {confirmDeleteId === doc.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in zoom-in-95">
                          <button
                            onClick={() => {
                              const updated = documents.filter(d => d.id !== doc.id);
                              onUpdateDocuments(updated);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-[0.5rem] transition-colors text-[9px] font-black uppercase tracking-wider shadow-sm"
                          >
                            Confirm Delete?
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1 hover:bg-muted/20 text-muted-foreground rounded-lg transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(doc.id)}
                          className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase mr-1"
                          title="Delete Document"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      {/* Image Viewer trigger */}
                      {isImg && (
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1 hover:bg-muted/10 text-indigo-600 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
                          title={t.previewTooltip}
                        >
                          <Eye size={12} />
                        </button>
                      )}

                      {/* Explicit Secure Downloader using direct href containing Base64 */}
                      <a
                        href={doc.fileData}
                        download={doc.fileName}
                        className="p-1 hover:bg-muted/10 text-indigo-600 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
                        title={t.downloadTooltip}
                      >
                        <Download size={12} />
                      </a>

                    </div>

                  </div>

                </div>
              );
            })}

            {filteredDocs.length === 0 && (
              <div className="col-span-2 py-12 text-center border border-dashed border-border/50 rounded-2xl bg-slate-50/30">
                <FileText className="mx-auto text-slate-300 mb-2 scale-110" size={24} />
                <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                  {t.noDocs}
                </p>
              </div>
            )}

          </div>

          {/* Secure Cloud Backups Assurance Badge */}
          <div className="p-3 border border-indigo-100 bg-indigo-50/10 rounded-2xl flex items-center gap-2.5 text-[10px] text-indigo-700/80 font-bold uppercase tracking-wider">
            <CheckCircle size={14} className="text-emerald-500 shrink-0" />
            <span>Encrypted locally & automatically synchronized with Coordinator Firebase Document Cloud</span>
          </div>

        </div>

      </div>

      {/* Lightbox / Image Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          
          <div className="relative max-w-3xl w-full max-h-[85vh] bg-card text-card-foreground rounded-[2rem] overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
            
            <div className="flex justify-between items-center p-4 bg-muted/10 border-b border-border/50">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase">
                  {previewDoc.title}
                </h4>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {previewDoc.fileName} • {getCategoryLabel(previewDoc.type)}
                </p>
              </div>

              <button 
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-slate-100/50 flex justify-center items-center">
              <img 
                src={previewDoc.fileData} 
                alt={previewDoc.title}
                className="max-h-[55vh] max-w-full rounded-xl object-contain shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-4 bg-muted/10 border-t border-border/50 flex justify-between items-center text-[10px] text-muted-foreground font-bold uppercase">
              <span>{t.uploadedOn}: {new Date(previewDoc.uploadedAt).toLocaleString()}</span>
              <a
                href={previewDoc.fileData}
                download={previewDoc.fileName}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
              >
                <Download size={12} />
                Download Attachment
              </a>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
