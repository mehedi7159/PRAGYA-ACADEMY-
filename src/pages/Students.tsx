import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../store/AppContext';
import { Student, StudentStatus } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Search, Plus, Filter, Edit, Trash2, X, Download, User, Printer, 
  IdCard, Wallet, FileText, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, 
  Upload, Loader2, Sparkles, LayoutGrid, List, Phone, MapPin, Calendar, 
  Clock as ClockIcon, MoreVertical, Target, AlertCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { translations } from '../lib/translations';
import StudentDocuments from '../components/StudentDocuments';

const localT = {
  en: {
    studentDob: "Date of Birth",
    schoolName: "School / Madrasah Name",
    fatherProfession: "Father's Profession",
    favouriteSubject: "Favorite Subject",
    weakSubject: "Weak Subject",
    dobPlaceholder: "YYYY-MM-DD",
    batchPlaceholder: "Select Batch",
    smartFill: "Smart Auto-Fill Form (Gemini AI)",
    smartFillDesc: "Upload student admission form image to fill fields automatically with Gemini 3.5 AI.",
    uploading: "AI is analyzing admission form...",
    extractError: "Extraction failed. Please enter details manually.",
    emptyTrash: "Empty Recycle Bin",
    profileTitle: "Student Profile",
    personalPreference: "Preferences & Background",
    formNoShort: "Form No / ID",
    gender: "Gender",
    remarks: "Remarks",
    saveSuccess: "Student saved successfully!",
    validationErr: "Please fill in all required fields."
  },
  bn: {
    studentDob: "জন্ম তারিখ",
    schoolName: "স্কুল বা মাদ্রাসার নাম",
    fatherProfession: "বাবার পেশা",
    favouriteSubject: "পছন্দের বিষয়",
    weakSubject: "দুর্বল বিষয়",
    dobPlaceholder: "দিন-মাস-বছর",
    batchPlaceholder: "ব্যাচ নির্বাচন করুন",
    smartFill: "আর্টিফিশিয়াল ইন্টেলিজেন্স দিয়ে ফর্ম পূরণ",
    smartFillDesc: "ভর্তি ফর্মের ছবি এখানে ফেলে দিন বা ফাইল সিলেক্ট করুন। জেমিনি ৩.৫ এআই সমস্ত তথ্য স্বয়ংক্রিয়ভাবে লিখে দিবে।",
    uploading: "এআই দ্বারা ভর্তি ফর্মের ছবি বিশ্লেষণ করা হচ্ছে...",
    extractError: "অটো-ফিল সম্ভব হয়নি। অনুগ্রহ করে নিজে লিখুন।",
    emptyTrash: "রিসাইকেল বিন খালি করুন",
    profileTitle: "শিক্ষার্থীর প্রোফাইল",
    personalPreference: "পছন্দ ও অন্যান্য তথ্য",
    formNoShort: "ফরম নং / আইডি",
    gender: "লিঙ্গ",
    remarks: "মন্তব্য",
    saveSuccess: "শিক্ষার্থীর তথ্য সফলভাবে সংরক্ষিত হয়েছে!",
    validationErr: "অনুগ্রহ করে সব প্রয়োজনীয় ঘর পূরণ করুন।"
  }
};

export function Students() {
  const { 
    students, addStudent, updateStudent, deleteStudent, batches, 
    payments, attendance, language 
  } = useAppContext();
  
  const t = translations[language];
  const lt = localT[language];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatch, setFilterBatch] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<Student | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<'info' | 'documents' | 'payments' | 'attendance'>('info');

  const [idCardStudent, setIdCardStudent] = useState<Student | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Student; direction: 'asc' | 'desc' } | null>({ key: 'id', direction: 'asc' });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Intelligent Extractions States
  const [isExtracting, setIsExtracting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedStudentProfile) {
      setProfileActiveTab('info');
    }
  }, [selectedStudentProfile]);

  // Form State
  const initialFormState = {
    id: '',
    name: '',
    fatherName: '',
    motherName: '',
    mobile: '',
    guardianMobile: '',
    address: '',
    dateOfBirth: '',
    schoolName: '',
    fatherProfession: '',
    favouriteSubject: '',
    weakSubject: '',
    batch: '',
    monthlyFee: 0,
    discount: 0,
    admissionDate: new Date().toISOString().slice(0, 10),
    endDate: '', // dynamic inactivation date
    reactivationDate: '', // dynamic reactivation date
    status: 'Active' as StudentStatus,
    notes: ''
  };

  const [formState, setFormState] = useState(initialFormState);
  const [showToast, setShowToast] = useState<{ message: string, type: 'success' | 'err' } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processImageForOCR(e.dataTransfer.files[0]);
    }
  };

  const processImageForOCR = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      triggerToast(lt.validationErr + " Only image files are supported.", 'err');
      return;
    }

    setIsExtracting(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          const mimeType = file.type;

          const response = await fetch('/api/extract-student', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType,
            }),
          });

          if (!response.ok) {
            throw new Error('AI Server extraction failure');
          }

          const responseData = await response.json();

          // Smoothly fill student details
          setFormState(prev => ({
            ...prev,
            id: responseData.id || prev.id,
            admissionDate: responseData.admissionDate || prev.admissionDate,
            name: responseData.name || prev.name,
            fatherName: responseData.fatherName || prev.fatherName,
            motherName: responseData.motherName || prev.motherName,
            mobile: responseData.mobile || prev.mobile,
            guardianMobile: responseData.guardianMobile || prev.guardianMobile,
            address: responseData.address || prev.address,
            dateOfBirth: responseData.dateOfBirth || prev.dateOfBirth,
            schoolName: responseData.schoolName || prev.schoolName,
            fatherProfession: responseData.fatherProfession || prev.fatherProfession,
            favouriteSubject: responseData.favouriteSubject || prev.favouriteSubject,
            weakSubject: responseData.weakSubject || prev.weakSubject
          }));

          triggerToast("Successfully extracted information!", 'success');
        } catch (err) {
          console.error("Extraction Parsing error:", err);
          triggerToast(lt.extractError, 'err');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File reading error:", error);
      triggerToast(lt.extractError, 'err');
    } finally {
      setIsExtracting(false);
    }
  };

  const triggerToast = (msg: string, type: 'success' | 'err') => {
    setShowToast({ message: msg, type });
    setTimeout(() => setShowToast(null), 3500);
  };

  const [statusFilter, setStatusFilter] = useState<StudentStatus>('Active');

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.id && s.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (s.mobile && s.mobile.includes(searchTerm)) ||
                          (s.schoolName && s.schoolName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBatch = filterBatch ? s.batch === filterBatch : true;
    const matchesStatus = s.status === statusFilter;
    return matchesSearch && matchesBatch && matchesStatus;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (!sortConfig) return 0;
    
    // Natural numeric sort for ID
    if (sortConfig.key === 'id') {
       const aId = a.id || '';
       const bId = b.id || '';
       const aMatches = aId.match(/\d+$/);
       const bMatches = bId.match(/\d+$/);
       
       if (aMatches && bMatches) {
         const numA = parseInt(aMatches[0], 10);
         const numB = parseInt(bMatches[0], 10);
         if (numA !== numB) {
            return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
         }
       }
       return sortConfig.direction === 'asc' ? aId.localeCompare(bId) : bId.localeCompare(aId);
    }
    
    let aValue: any = a[sortConfig.key] || '';
    let bValue: any = b[sortConfig.key] || '';
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key: keyof Student) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof Student) => {
    if (sortConfig?.key !== key) return <ArrowUpDown size={14} className="ml-2 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp size={14} className="ml-2 text-indigo-600" /> : 
      <ArrowDown size={14} className="ml-2 text-indigo-600" />;
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text(t.studentDatabase, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Batch Filter: ${filterBatch || t.allBatches}`, 14, 34);

    const tableHeaders = [[t.studentID, t.name, t.batch, t.mobile, lt.schoolName, lt.studentDob, t.monthlyFee, t.status, t.admissionDate]];
    const tableData = sortedStudents.map(s => [
      s.id, s.name, s.batch, s.mobile, s.schoolName || '-', s.dateOfBirth || '-',
      formatCurrency(s.finalFee), s.status, s.admissionDate
    ]);

    autoTable(doc, {
      startY: 40,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`student_list_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setFormState(initialFormState);
    setIsModalOpen(true);
  };
  
  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormState({
      id: student.id || '',
      name: student.name || '',
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      mobile: student.mobile || '',
      guardianMobile: student.guardianMobile || '',
      address: student.address || '',
      dateOfBirth: student.dateOfBirth || '',
      schoolName: student.schoolName || '',
      fatherProfession: student.fatherProfession || '',
      favouriteSubject: student.favouriteSubject || '',
      weakSubject: student.weakSubject || '',
      batch: student.batch || '',
      monthlyFee: student.monthlyFee || 0,
      discount: student.discount || 0,
      admissionDate: student.admissionDate || new Date().toISOString().slice(0, 10),
      endDate: student.endDate || '',
      reactivationDate: student.reactivationDate || '',
      status: student.status || 'Active',
      notes: student.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.batch) {
      triggerToast(lt.validationErr, 'err');
      return;
    }

    const calculatedFinalFee = Math.max(0, Number(formState.monthlyFee) - Number(formState.discount));
    
    // Auto generate ID if not provided, format nicely
    const resolvedId = formState.id.trim() || `STU-${Math.floor(10000 + Math.random() * 90000)}`;

    const studentPayload: Student = {
      ...formState,
      id: resolvedId,
      monthlyFee: Number(formState.monthlyFee),
      discount: Number(formState.discount),
      finalFee: calculatedFinalFee,
      endDate: formState.status === 'Inactive' ? (formState.endDate || new Date().toISOString().slice(0, 10)) : undefined,
      reactivationDate: formState.status === 'Active' ? (formState.reactivationDate || new Date().toISOString().slice(0, 10)) : undefined
    };

    if (editingStudent) {
      updateStudent(editingStudent.id, studentPayload);
      triggerToast(lt.saveSuccess, 'success');
    } else {
      addStudent(studentPayload);
      triggerToast(lt.saveSuccess, 'success');
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteStudent(deleteId);
      triggerToast("Student moved to Recycle Bin.", 'success');
      setDeleteId(null);
    }
  };

  // Real-time calculated final fee preview
  const currentFinalFee = Math.max(0, (Number(formState.monthlyFee) || 0) - (Number(formState.discount) || 0));

  return (
    <div className="p-4 md:p-8 space-y-8 bg-background min-h-screen font-sans">
      
      {/* Toast Alert */}
      {showToast && (
        <div className={cn(
          "fixed bottom-5 right-5 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all duration-300 animate-bounce",
          showToast.type === 'success' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" : "bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-800"
        )}>
          {showToast.type === 'success' ? <Sparkles className="text-emerald-500" /> : <AlertCircle className="text-rose-500" />}
          <span className="font-bold text-sm">{showToast.message}</span>
        </div>
      )}

      {/* Header Widget */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-[2rem] border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <User className="text-indigo-600 w-8 h-8" />
            {t.studentDatabase}
          </h1>
          <p className="text-sm text-muted font-medium mt-1">{t.manageAllStudents}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={openAddModal}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-transform hover:-translate-y-0.5"
            id="add-student-btn"
          >
            <Plus size={20} />
            {t.addStudent}
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-2 bg-muted/10 hover:bg-muted/20 text-foreground font-bold py-3.5 px-5 rounded-2xl transition-all"
            id="export-pdf-btn"
          >
            <Download size={20} />
            {lt.dobPlaceholder === "YYYY-MM-DD" ? "Export" : "এক্সপোর্ট"}
          </button>
          <div className="flex bg-muted/10 p-1.5 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-lg transition-colors", viewMode === 'grid' ? "bg-card text-indigo-600 shadow-sm" : "text-muted hover:text-foreground")}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-lg transition-colors", viewMode === 'list' ? "bg-card text-indigo-600 shadow-sm" : "text-muted hover:text-foreground")}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Area */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Status Filter Buttons */}
        <div className="flex bg-card p-1 rounded-2xl border border-border shadow-sm md:col-span-1">
          {(['Active', 'Inactive', 'Former'] as StudentStatus[]).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                statusFilter === status 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "text-muted hover:text-foreground"
              )}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-medium placeholder-muted text-sm shadow-sm transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Batch Filter Dropdown */}
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5 pointer-events-none" />
          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="w-full pl-12 pr-8 py-4 bg-card border border-border rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm shadow-sm transition-all appearance-none cursor-pointer"
          >
            <option value="">{t.allBatches}</option>
            {batches.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5 pointer-events-none rotate-90" />
        </div>
      </div>

      {/* Database Empty State */}
      {sortedStudents.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-[2.5rem] p-16 text-center shadow-sm">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <User className="text-indigo-600 w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-foreground mb-2">{t.noStudentsFound}</h3>
          <p className="text-sm text-muted max-w-sm mx-auto font-medium">Try checking spelling, resetting batch filter, or admit some fresh student parameters into the Academy system.</p>
        </div>
      ) : (
        /* Render Grid or List */
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedStudents.map(student => (
              <div 
                key={student.id} 
                onClick={() => setSelectedStudentProfile(student)}
                className={cn(
                  "bg-card border border-border rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-800 transition-all group relative overflow-hidden cursor-pointer",
                  student.status === 'Inactive' ? 'opacity-70 bg-muted/5' : ''
                )}
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-indigo-500 to-transparent opacity-10 rounded-bl-[4rem]" />

                <div className="flex justify-between items-start gap-3 relative mb-4">
                  <div>
                    <span className="inline-block text-[10px] font-black tracking-widest bg-indigo-100 dark:bg-indigo-950/65 text-indigo-900 dark:text-indigo-200 border border-indigo-200/60 dark:border-indigo-800/80 px-3 py-1.5 rounded-xl uppercase mb-2">
                      {student.batch}
                    </span>
                    <h3 className="text-lg font-black text-foreground group-hover:text-indigo-600 transition-colors">
                      {student.name}
                    </h3>
                    <p className="text-xs font-bold text-muted font-mono mt-0.5">{student.id}</p>
                  </div>
                  
                  {/* Status Pill */}
                  <span className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-black",
                    student.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' : 'bg-muted/10 text-muted'
                  )}>
                    {student.status === 'Active' ? t.active : t.inactive}
                  </span>
                </div>

                {/* Body Meta Details */}
                <div className="space-y-3.5 border-t border-border pt-4 text-sm font-semibold text-muted">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-muted" />
                    <span>{student.mobile || t.mobile}</span>
                  </div>
                  {student.schoolName && (
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-muted" />
                      <span className="truncate max-w-[200px]" title={student.schoolName}>{student.schoolName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-muted" />
                    <span className="text-indigo-600 dark:text-indigo-400 font-black">{formatCurrency(student.finalFee)} <span className="text-[10px] text-muted font-bold">/ {translations[language].feeMonth || "Month"}</span></span>
                  </div>
                </div>

                {/* Card Button Triggers */}
                <div className="flex items-center justify-between border-t border-border mt-5 pt-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSelectedStudentProfile(student)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-50 py-2 px-3.5 rounded-xl transition-all"
                  >
                    <User size={14} />
                    {t.viewProfile}
                  </button>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(student)}
                      className="p-2 text-muted hover:text-foreground hover:bg-muted/10 rounded-xl transition-all"
                      title="Edit Student"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setIdCardStudent(student)}
                      className="p-2 text-indigo-500 hover:text-indigo-800 hover:bg-indigo-950/30 rounded-xl transition-all"
                      title="ID Card"
                    >
                      <IdCard size={16} />
                    </button>
                    {confirmDeleteId === student.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/30 p-1 rounded-xl animate-in flip-in-y">
                        <button onClick={() => {
                          deleteStudent(student.id);
                          setConfirmDeleteId(null);
                        }} className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors cursor-pointer">
                          Delete
                        </button>
                        <button onClick={() => setConfirmDeleteId(null)} className="p-1 px-2 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition-colors cursor-pointer">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(student.id)}
                        className="p-2 text-rose-500 hover:text-rose-800 hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer"
                        title="Delete Student"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List Mode Table View */
          <div className="bg-card border border-border rounded-[2.5rem] shadow-sm overflow-hidden border-collapse">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-semibold select-none">
                <thead>
                  <tr className="bg-muted/5 border-b border-border text-muted text-xs font-extrabold uppercase tracking-wider">
                    <th onClick={() => requestSort('id')} className="p-5 cursor-pointer group hover:bg-muted/10 transition-colors">
                      <div className="flex items-center">{t.studentID} {getSortIndicator('id')}</div>
                    </th>
                    <th onClick={() => requestSort('name')} className="p-5 cursor-pointer group hover:bg-muted/10 transition-colors">
                      <div className="flex items-center">{t.name} {getSortIndicator('name')}</div>
                    </th>
                    <th onClick={() => requestSort('batch')} className="p-5 cursor-pointer group hover:bg-muted/10 transition-colors">
                      <div className="flex items-center">{t.batch} {getSortIndicator('batch')}</div>
                    </th>
                      <th className="p-5">{t.guardianMobile}</th>
                    <th className="p-5">{lt.schoolName}</th>
                    <th onClick={() => requestSort('finalFee')} className="p-5 cursor-pointer group hover:bg-muted/10 transition-colors text-right">
                      <div className="flex items-center justify-end">{t.monthlyFee} {getSortIndicator('finalFee')}</div>
                    </th>
                    <th className="p-5 text-center">{t.status}</th>
                    <th className="p-5 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {sortedStudents.map(student => (
                    <tr 
                      key={student.id} 
                      onClick={() => setSelectedStudentProfile(student)}
                      className={cn(
                        "hover:bg-muted/10 transition-colors cursor-pointer group", 
                        student.status === 'Inactive' ? 'opacity-70 bg-muted/5' : ''
                      )}
                    >
                      <td className="p-5 font-mono text-xs font-black text-muted">{student.id}</td>
                      <td className="p-5">
                        <div className="font-bold text-foreground group-hover:text-indigo-600 transition-colors">{student.name}</div>
                        {student.mobile && <span className="text-[10px] text-muted font-bold">{t.mobile}: {student.mobile}</span>}
                      </td>
                      <td className="p-5">
                        <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border border-indigo-200/50 dark:border-indigo-800/60 font-black text-[10px] px-2.5 py-1.5 rounded-lg uppercase">
                          {student.batch}
                        </span>
                      </td>
                      <td className="p-5 font-mono text-xs">{student.guardianMobile || '-'}</td>
                      <td className="p-5 max-w-[150px] truncate">{student.schoolName || '-'}</td>
                      <td className="p-5 text-right text-indigo-600 dark:text-indigo-400 font-black">{formatCurrency(student.finalFee)}</td>
                      <td className="p-5 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase",
                          student.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400' : 'bg-muted/10 text-muted'
                        )}>
                          {student.status === 'Active' ? t.active : t.inactive}
                        </span>
                      </td>
                      <td className="p-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudentProfile(student)}
                            className="p-2 text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-all"
                            title="View Profile"
                          >
                            <User size={16} />
                          </button>
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-2 text-muted hover:text-foreground hover:bg-muted/10 rounded-xl transition-all"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setIdCardStudent(student)}
                            className="p-2 text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-all"
                          >
                            <IdCard size={16} />
                          </button>
                          {confirmDeleteId === student.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/30 p-1 rounded-xl animate-in flip-in-y">
                              <button onClick={() => {
                                deleteStudent(student.id);
                                setConfirmDeleteId(null);
                              }} className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors cursor-pointer">
                                Delete
                              </button>
                              <button onClick={() => setConfirmDeleteId(null)} className="p-1 px-2 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition-colors cursor-pointer">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(student.id)}
                              className="p-2 text-rose-500 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Edit/Add Admission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-[2.5rem] w-full max-w-4xl shadow-2xl border border-border overflow-hidden flex flex-col my-8 max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-border bg-muted/5">
              <div className="flex items-center gap-3">
                <Sparkles className="text-indigo-600 w-6 h-6 animate-pulse" />
                <h2 className="text-xl font-black text-foreground">
                  {editingStudent ? t.editStudentDetails : t.addNewStudent}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-muted hover:text-foreground hover:bg-muted/10 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Contents */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8">
              
              {/* Intelligent Drag and Drop File Upload Area */}
              {!editingStudent && (
                <div 
                  onDragEnter={handleDrag} 
                  onDragOver={handleDrag} 
                  onDragLeave={handleDrag} 
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-3xl p-6 text-center transition-all relative group flex flex-col items-center justify-center",
                    dragActive ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10 scale-[1.01]" : "border-border bg-muted/5 hover:bg-card hover:border-indigo-400",
                    isExtracting ? "pointer-events-none opacity-80" : ""
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processImageForOCR(file);
                    }}
                    className="hidden"
                  />
                  
                  {isExtracting ? (
                    <div className="py-6 flex flex-col items-center">
                      <Loader2 className="animate-spin text-indigo-600 w-12 h-12 mb-4" />
                      <h4 className="font-extrabold text-foreground text-base">{lt.uploading}</h4>
                      <p className="text-xs text-indigo-500 font-bold mt-1">Extracting fields with high-precision Google Gemini Vision</p>
                    </div>
                  ) : (
                    <div className="cursor-pointer py-4" onClick={() => fileInputRef.current?.click()}>
                      <div className="bg-card w-14 h-14 rounded-2xl flex items-center justify-center shadow-md mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="text-indigo-600 w-6 h-6" />
                      </div>
                      <h4 className="font-extrabold text-foreground text-lg mb-1">{lt.smartFill}</h4>
                      <p className="text-xs font-semibold text-muted max-w-md mx-auto leading-relaxed">{lt.smartFillDesc}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Main Admission Capture Form */}
              <form onSubmit={handleSaveStudent} className="space-y-6">
                
                {/* Visual Title Details Section */}
                <h3 className="text-base font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border-b border-indigo-100 dark:border-indigo-900/40 pb-2">
                  {t.personalDetails}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  
                  {/* Student Full Name */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-muted uppercase tracking-wide">{t.name} <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Rafi Ahmed"
                      value={formState.name}
                      onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="p-3.5 bg-muted/5 border border-border rounded-xl focus:bg-card focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm transition-all"
                    />
                  </div>

                  {/* Student Date of Birth */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-muted uppercase tracking-wide">{lt.studentDob}</label>
                    <input
                      type="date"
                      value={formState.dateOfBirth}
                      onChange={(e) => setFormState(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="p-3.5 bg-muted/5 border border-border rounded-xl focus:bg-card focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm transition-all"
                    />
                  </div>

                  {/* School Name */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-muted uppercase tracking-wide">{lt.schoolName}</label>
                    <input
                      type="text"
                      placeholder="e.g. Ideal School and College"
                      value={formState.schoolName}
                      onChange={(e) => setFormState(prev => ({ ...prev, schoolName: e.target.value }))}
                      className="p-3.5 bg-muted/5 border border-border rounded-xl focus:bg-card focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm transition-all"
                    />
                  </div>

                  {/* Father's Name */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-muted uppercase tracking-wide">{t.fatherName}</label>
                    <input
                      type="text"
                      placeholder="e.g. Kamal Ahmed"
                      value={formState.fatherName}
                      onChange={(e) => setFormState(prev => ({ ...prev, fatherName: e.target.value }))}
                      className="p-3.5 bg-muted/5 border border-border rounded-xl focus:bg-card focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm transition-all"
                    />
                  </div>

                  {/* Father's Career/Profession */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-muted uppercase tracking-wide">{lt.fatherProfession}</label>
                    <input
                      type="text"
                      placeholder="e.g. Govt. Service"
                      value={formState.fatherProfession}
                      onChange={(e) => setFormState(prev => ({ ...prev, fatherProfession: e.target.value }))}
                      className="p-3.5 bg-muted/5 border border-border rounded-xl focus:bg-card focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm transition-all"
                    />
                  </div>

                  {/* Mother's Name */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-muted uppercase tracking-wide">{t.motherName}</label>
                    <input
                      type="text"
                      placeholder="e.g. Salma Begum"
                      value={formState.motherName}
                      onChange={(e) => setFormState(prev => ({ ...prev, motherName: e.target.value }))}
                      className="p-3.5 bg-muted/5 border border-border rounded-xl focus:bg-card focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm transition-all"
                    />
                  </div>

                  {/* Student Mobile */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-muted uppercase tracking-wide">{t.mobile}</label>
                    <input
                      type="tel"
                      placeholder="e.g. 017XXXXXXXX"
                      value={formState.mobile}
                      onChange={(e) => setFormState(prev => ({ ...prev, mobile: e.target.value }))}
                      className="p-3.5 bg-muted/5 border border-border rounded-xl focus:bg-card focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm transition-all"
                    />
                  </div>

                  {/* Guardian Mobile */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-muted uppercase tracking-wide">{t.guardianMobile}</label>
                    <input
                      type="tel"
                      placeholder="e.g. 018XXXXXXXX"
                      value={formState.guardianMobile}
                      onChange={(e) => setFormState(prev => ({ ...prev, guardianMobile: e.target.value }))}
                      className="p-3.5 bg-muted/5 border border-border rounded-xl focus:bg-card focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm transition-all"
                    />
                  </div>

                  {/* Real Address Details */}
                  <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-1">
                    <label className="text-xs font-extrabold text-muted uppercase tracking-wide">{t.address}</label>
                    <input
                      type="text"
                      placeholder="e.g. Sector-4, Uttara, Dhaka"
                      value={formState.address}
                      onChange={(e) => setFormState(prev => ({ ...prev, address: e.target.value }))}
                      className="p-3.5 bg-muted/5 border border-border rounded-xl focus:bg-card focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Preferred Subjects details */}
                <h3 className="text-base font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border-b border-indigo-100 dark:border-indigo-900/40 pb-2 pt-4">
                  {lt.personalPreference}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Favourite Subject */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-muted uppercase tracking-wide">{lt.favouriteSubject}</label>
                    <input
                      type="text"
                      placeholder="e.g. Mathematics, physics"
                      value={formState.favouriteSubject}
                      onChange={(e) => setFormState(prev => ({ ...prev, favouriteSubject: e.target.value }))}
                      className="p-3.5 bg-muted/5 border border-border rounded-xl focus:bg-card focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm transition-all"
                    />
                  </div>

                  {/* Weak Subject */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-muted uppercase tracking-wide">{lt.weakSubject}</label>
                    <input
                      type="text"
                      placeholder="e.g. Chemistry, English"
                      value={formState.weakSubject}
                      onChange={(e) => setFormState(prev => ({ ...prev, weakSubject: e.target.value }))}
                      className="p-3.5 bg-muted/5 border border-border rounded-xl focus:bg-card focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Academic & Fee Info Details Section */}
                <h3 className="text-base font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border-b border-indigo-100 dark:border-indigo-900/40 pb-2 pt-4">
                  {t.academicFeeInfo}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  
                  {/* Student ID / Form No */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-muted uppercase tracking-wide">{lt.formNoShort}</label>
                    <input
                      type="text"
                      placeholder="Leave blank to auto generate"
                      value={formState.id}
                      onChange={(e) => setFormState(prev => ({ ...prev, id: e.target.value }))}
                      className="p-3.5 bg-muted/5 border border-border rounded-xl focus:bg-card focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm transition-all font-mono"
                    />
                  </div>

                  {/* Admission Date */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-muted uppercase tracking-wide">{t.admissionDate}</label>
                    <input
                      type="date"
                      value={formState.admissionDate}
                      onChange={(e) => setFormState(prev => ({ ...prev, admissionDate: e.target.value }))}
                      className="p-3.5 bg-muted/5 border border-border rounded-xl focus:bg-card focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm transition-all"
                    />
                  </div>

                  {/* Batch Select Dropdown */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-muted uppercase tracking-wide">{t.batch} <span className="text-rose-500">*</span></label>
                    <select
                      value={formState.batch}
                      onChange={(e) => {
                        const newBatchName = e.target.value;
                        const selectedBatch = batches.find(b => b.name === newBatchName);
                        
                        const batchFee = selectedBatch?.feeAmount || 0;
                        const batchOther = selectedBatch?.otherCharges || 0;
                        const defaultMonthlyFee = batchFee + batchOther;
                        const defaultDiscount = selectedBatch?.discountAmount || 0;
                        
                        setFormState(prev => ({
                          ...prev,
                          batch: newBatchName,
                          monthlyFee: defaultMonthlyFee > 0 ? defaultMonthlyFee : prev.monthlyFee,
                          discount: defaultDiscount > 0 ? defaultDiscount : prev.discount
                        }));
                      }}
                      required
                      className="p-3.5 bg-muted/5 border border-border rounded-xl focus:bg-card focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm transition-all appearance-none cursor-pointer"
                    >
                      <option value="">{lt.batchPlaceholder}</option>
                      {batches.filter(b => b.status === "Active").map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Base Monthly Fee */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">{t.baseMonthlyFee}</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={formState.monthlyFee || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, monthlyFee: Number(e.target.value) }))}
                      className="p-3.5 bg-slate-50/50 border border-border rounded-xl focus:bg-card text-card-foreground focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm transition-all font-mono"
                    />
                  </div>

                  {/* Discount */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">{t.discount}</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={formState.discount || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, discount: Number(e.target.value) }))}
                      className="p-3.5 bg-slate-50/50 border border-border rounded-xl focus:bg-card text-card-foreground focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm transition-all font-mono"
                    />
                  </div>

                  {/* Final Monthly Fee Calc (Disabled/Read only) */}
                  <div className="flex flex-col gap-2 relative">
                    <label className="text-xs font-extrabold text-indigo-600 uppercase tracking-wide flex items-center gap-1">
                      {t.finalMonthlyFee}
                      <Sparkles size={11} className="text-indigo-500 animate-pulse" />
                    </label>
                    <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-foreground font-black text-sm font-mono flex items-center justify-between">
                      <span>{formatCurrency(currentFinalFee)}</span>
                      <span className="text-[10px] font-bold text-indigo-600/60 uppercase">Auto Calculated</span>
                    </div>
                  </div>

                  {/* Notes / Special Demands */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">{t.notes}</label>
                    <textarea
                      placeholder="e.g. Sibling discount, requires extra physics support, etc."
                      value={formState.notes}
                      onChange={(e) => setFormState(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      className="p-3.5 bg-slate-50/50 border border-border rounded-xl focus:bg-card text-card-foreground focus:ring-4 focus:ring-indigo-100 outline-none text-foreground font-bold text-sm transition-all"
                    />
                  </div>

                  {/* Status Indicator */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">{t.status}</label>
                    <select
                      value={formState.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as StudentStatus;
                        setFormState(prev => ({ 
                          ...prev, 
                          status: newStatus,
                          endDate: newStatus === 'Inactive' ? (prev.endDate || new Date().toISOString().slice(0, 10)) : ''
                        }));
                      }}
                      className="p-3.5 bg-muted/10 border border-border rounded-xl focus:bg-card text-foreground focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm transition-all cursor-pointer appearance-none"
                    >
                      <option value="Active">{t.active}</option>
                      <option value="Inactive">{t.inactive}</option>
                    </select>
                  </div>

                  {/* Conditional Inactivation Date */}
                  {formState.status === 'Inactive' && (
                    <div className="flex flex-col gap-2 transition-all animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">
                        {language === 'bn' ? "নিষ্ক্রিয় করার তারিখ" : "Inactivation Date"} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formState.endDate}
                        onChange={(e) => setFormState(prev => ({ ...prev, endDate: e.target.value }))}
                        required
                        className="p-3.5 bg-muted/10 border border-border rounded-xl focus:bg-card text-foreground focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm transition-all font-mono"
                      />
                    </div>
                  )}

                  {editingStudent && formState.status === 'Inactive' && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormState(prev => ({ 
                          ...prev, 
                          status: 'Former', 
                          endDate: new Date().toISOString().slice(0, 10) 
                        }));
                      }}
                      className="md:col-span-3 py-3.5 rounded-xl bg-indigo-600 text-white font-black uppercase text-sm tracking-widest hover:bg-indigo-700 shadow-md transition-all mt-2"
                    >
                      Mark as Former
                    </button>
                  )}
                </div>

                {/* Submit button Area */}
                <div className="flex items-center justify-end gap-3 mt-8 border-t border-border/50 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-3 px-6 bg-muted/20 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all text-sm"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-8 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold rounded-2xl shadow-lg transition-transform hover:-translate-y-0.5 text-sm"
                  >
                    {t.saveStudent}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Individual Student Profile Modal */}
      {selectedStudentProfile && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card text-card-foreground rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-border/50 overflow-hidden flex flex-col transform transition-transform animate-in fade-in zoom-in-95 max-h-[90vh]">
            
            {/* Header Details */}
            <div className="bg-gradient-to-r from-indigo-600/10 to-violet-600/10 p-6 flex justify-between items-start border-b border-indigo-50/20 relative">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-md">
                  {selectedStudentProfile.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground leading-tight">{selectedStudentProfile.name}</h2>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">{selectedStudentProfile.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudentProfile(null)}
                className="p-2 bg-card text-card-foreground hover:bg-muted/20 text-muted-foreground hover:text-foreground rounded-full shadow-sm transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div className="flex border-b border-border/50 bg-muted/10 px-6 py-1 gap-1 overflow-x-auto shrink-0 scrollbar-none">
              <button
                onClick={() => setProfileActiveTab('info')}
                className={cn(
                  "px-4 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap",
                  profileActiveTab === 'info' 
                    ? "border-indigo-600 text-indigo-600 font-extrabold" 
                    : "border-transparent text-muted-foreground hover:text-slate-600"
                )}
              >
                {language === 'en' ? 'Profile Details' : 'জীবনবৃত্তান্ত বিবরণ'}
              </button>
              <button
                onClick={() => setProfileActiveTab('payments')}
                className={cn(
                  "px-4 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap",
                  profileActiveTab === 'payments' 
                    ? "border-indigo-600 text-indigo-600 font-extrabold" 
                    : "border-transparent text-muted-foreground hover:text-slate-600"
                )}
              >
                {language === 'en' ? 'Fee History' : 'ফি প্রদানের রেকর্ড'}
              </button>
              <button
                onClick={() => setProfileActiveTab('attendance')}
                className={cn(
                  "px-4 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap",
                  profileActiveTab === 'attendance' 
                    ? "border-indigo-600 text-indigo-600 font-extrabold" 
                    : "border-transparent text-muted-foreground hover:text-slate-600"
                )}
              >
                {language === 'en' ? 'Attendance' : 'উপস্থিতির হার ও তথ্য'}
              </button>
              <button
                onClick={() => setProfileActiveTab('documents')}
                className={cn(
                  "px-4 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap",
                  profileActiveTab === 'documents' 
                    ? "border-indigo-600 text-indigo-600 font-extrabold" 
                    : "border-transparent text-muted-foreground hover:text-slate-600"
                )}
              >
                {language === 'en' ? 'Documents & Records' : 'প্রয়োজনীয় নথিপত্র'}
                {(selectedStudentProfile.documents || []).length > 0 && (
                  <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[9px] font-black font-mono leading-none rounded-full px-1.5 py-0.5">
                    {(selectedStudentProfile.documents || []).length}
                  </span>
                )}
              </button>
            </div>

            {/* Scrollable details container */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
              {profileActiveTab === 'info' && (
                <>
                  {/* Primary Personal Grid */}
                  <div className="bg-slate-50/50 dark:bg-muted/10 border border-border/50 rounded-3xl p-5 space-y-4">
                    <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">{t.personalDetails}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm font-semibold">
                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-0.5 uppercase">{lt.studentDob}</span>
                        <span className="text-foreground font-bold">{selectedStudentProfile.dateOfBirth || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-0.5 uppercase">{lt.schoolName}</span>
                        <span className="text-foreground font-bold">{selectedStudentProfile.schoolName || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-0.5 uppercase">{t.fatherName}</span>
                        <span className="text-foreground font-bold">{selectedStudentProfile.fatherName || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-0.5 uppercase">{lt.fatherProfession}</span>
                        <span className="text-foreground font-bold">{selectedStudentProfile.fatherProfession || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-0.5 uppercase">{t.motherName}</span>
                        <span className="text-foreground font-bold">{selectedStudentProfile.motherName || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-0.5 uppercase">{t.address}</span>
                        <span className="text-foreground font-bold truncate block">{selectedStudentProfile.address || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Preferences section */}
                  <div className="bg-slate-50/50 dark:bg-muted/10 border border-border/50 rounded-3xl p-5 space-y-4">
                    <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">{lt.personalPreference}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm font-semibold">
                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-0.5 uppercase">{lt.favouriteSubject}</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">{selectedStudentProfile.favouriteSubject || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-0.5 uppercase">{lt.weakSubject}</span>
                        <span className="text-rose-700 font-bold bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg">{selectedStudentProfile.weakSubject || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Academic Grid details */}
                  <div className="bg-slate-50/50 dark:bg-muted/10 border border-border/50 rounded-3xl p-5 space-y-4">
                    <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">{t.academicFeeInfo}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm font-semibold">
                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-0.5 uppercase">{t.batch}</span>
                        <span className="text-foreground font-black">{selectedStudentProfile.batch}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-0.5 uppercase">{t.admissionDate}</span>
                        <span className="text-foreground font-bold">{selectedStudentProfile.admissionDate || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-0.5 uppercase">{t.mobile}</span>
                        <span className="text-foreground font-mono font-bold">{selectedStudentProfile.mobile || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-0.5 uppercase">{t.guardianMobile}</span>
                        <span className="text-foreground font-mono font-bold">{selectedStudentProfile.guardianMobile || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-0.5 uppercase">{t.monthlyFee}</span>
                        <span className="text-foreground font-mono font-bold">{formatCurrency(selectedStudentProfile.monthlyFee)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-0.5 uppercase">{t.finalMonthlyFee}</span>
                        <span className="text-indigo-600 font-mono font-black">{formatCurrency(selectedStudentProfile.finalFee)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes box */}
                  {selectedStudentProfile.notes && (
                    <div className="bg-indigo-50/30 border border-indigo-50 rounded-3xl p-5">
                      <span className="text-indigo-500 block text-[10px] uppercase font-extrabold tracking-widest mb-1.5">{t.notes}</span>
                      <p className="text-sm font-semibold text-indigo-900/80 leading-relaxed">{selectedStudentProfile.notes}</p>
                    </div>
                  )}
                </>
              )}

              {profileActiveTab === 'documents' && (
                <StudentDocuments
                  student={selectedStudentProfile}
                  onUpdateDocuments={(updatedDocs) => {
                    const updatedProfile = { ...selectedStudentProfile, documents: updatedDocs };
                    setSelectedStudentProfile(updatedProfile);
                    updateStudent(selectedStudentProfile.id, { documents: updatedDocs });
                  }}
                  language={language}
                />
              )}

              {profileActiveTab === 'payments' && (() => {
                const studentPayments = (payments || []).filter(p => p.studentId === selectedStudentProfile.id);
                const sortedPayments = [...studentPayments].sort((a, b) => b.date.localeCompare(a.date));
                const totalPaidAmount = studentPayments.reduce((acc, p) => acc + p.amount, 0);
                const totalDiscountAvailed = studentPayments.reduce((acc, p) => acc + (p.discount || 0), 0);
                
                return (
                  <div className="space-y-6">
                    {/* Payment Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/35 rounded-2xl p-4">
                        <span className="text-muted-foreground text-[10px] font-black uppercase block mb-1">
                          {language === 'en' ? 'Total Paid' : 'মোট পরিশোধ'}
                        </span>
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(totalPaidAmount)}
                        </div>
                      </div>
                      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/35 rounded-2xl p-4">
                        <span className="text-muted-foreground text-[10px] font-black uppercase block mb-1">
                          {language === 'en' ? 'Discounts Availed' : 'কমিশন / ছাড়'}
                        </span>
                        <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(totalDiscountAvailed)}
                        </div>
                      </div>
                      <div className="bg-slate-50/50 dark:bg-muted/10 border border-border rounded-2xl p-4">
                        <span className="text-muted-foreground text-[10px] font-black uppercase block mb-1">
                          {language === 'en' ? 'Monthly Payable' : 'ধার্যকৃত মাসিক ফি'}
                        </span>
                        <div className="text-xl font-black text-foreground">
                          {formatCurrency(selectedStudentProfile.finalFee)}
                        </div>
                      </div>
                    </div>

                    {/* Payments List */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-muted tracking-widest">
                        {language === 'en' ? 'Payment History' : 'পরিশোধিত অর্থ বিবরণী'}
                      </h4>
                      {sortedPayments.length === 0 ? (
                        <div className="text-center py-10 space-y-2 border border-dashed border-border rounded-2xl">
                          <Wallet className="w-8 h-8 text-muted mx-auto" />
                          <p className="text-xs font-bold text-muted uppercase tracking-wider">
                            {language === 'en' ? 'No Payments Recorded' : 'কোনো মূল্য পরিশোধের রেকর্ড পাওয়া যায়নি'}
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-border">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-muted/10 border-b border-border font-black uppercase text-[10px] text-muted-foreground">
                                <th className="p-3.5">{language === 'en' ? 'Receipt' : 'রসিদ নং'}</th>
                                <th className="p-3.5">{language === 'en' ? 'Date' : 'তারিখ'}</th>
                                <th className="p-3.5">{language === 'en' ? 'Period' : 'মাস'}</th>
                                <th className="p-3.5">{language === 'en' ? 'Method' : 'পেমেন্ট মেথড'}</th>
                                <th className="p-3.5 text-right">{language === 'en' ? 'Amount' : 'পরিশোধিত ফি'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-foreground font-semibold">
                              {sortedPayments.map((pay) => (
                                <tr key={pay.id} className="hover:bg-muted/5 transition-colors">
                                  <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{pay.receiptNumber || pay.id.slice(0, 8).toUpperCase()}</td>
                                  <td className="p-3.5 font-mono">{pay.date}</td>
                                  <td className="p-3.5 font-bold">{pay.month}</td>
                                  <td className="p-3.5">
                                    <span className="px-2 py-1 rounded-md bg-muted/20 font-black text-[9px] uppercase">
                                      {pay.paymentMethod}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-right text-emerald-600 dark:text-emerald-400 font-extrabold">{formatCurrency(pay.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {profileActiveTab === 'attendance' && (() => {
                const studentAtt = (attendance || []).filter(a => a.studentId === selectedStudentProfile.id);
                const sortedAtt = [...studentAtt].sort((a, b) => b.date.localeCompare(a.date));
                const attTotal = studentAtt.length;
                const attPresentCount = studentAtt.filter(a => a.status === 'Present').length;
                const attLateCount = studentAtt.filter(a => a.status === 'Late').length;
                const attAbsentCount = studentAtt.filter(a => a.status === 'Absent').length;
                const attRate = attTotal > 0 ? Math.round(((attPresentCount + (attLateCount * 0.5)) / attTotal) * 100) : 100;

                return (
                  <div className="space-y-6">
                    {/* Attendance summary statistics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-card border border-border rounded-2xl p-4 text-center">
                        <span className="text-muted text-[10px] font-black uppercase tracking-widest block mb-1">
                          {language === 'en' ? 'Presence Rate' : 'উপস্থিতির হার'}
                        </span>
                        <div className={cn(
                          "text-2xl font-black font-mono",
                          attRate >= 90 ? "text-emerald-600 dark:text-emerald-400" :
                          attRate >= 75 ? "text-amber-600 dark:text-amber-400" :
                          "text-rose-600 dark:text-rose-400"
                        )}>
                          {attRate}%
                        </div>
                      </div>
                      <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/35 rounded-2xl p-4 text-center">
                        <span className="text-emerald-800 dark:text-emerald-400 text-[10px] font-black uppercase block mb-1">
                          {language === 'en' ? 'Presents' : 'উপস্থিত'}
                        </span>
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {attPresentCount}
                        </div>
                      </div>
                      <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/35 rounded-2xl p-4 text-center">
                        <span className="text-amber-800 dark:text-amber-400 text-[10px] font-black uppercase block mb-1">
                          {language === 'en' ? 'Lates' : 'বিলম্বিত'}
                        </span>
                        <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                          {attLateCount}
                        </div>
                      </div>
                      <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/35 rounded-2xl p-4 text-center">
                        <span className="text-rose-800 dark:text-rose-400 text-[10px] font-black uppercase block mb-1">
                          {language === 'en' ? 'Absents' : 'অনুপস্থিত'}
                        </span>
                        <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
                          {attAbsentCount}
                        </div>
                      </div>
                    </div>

                    {/* Streak visualization */}
                    {sortedAtt.length > 0 && (
                      <div className="space-y-3 bg-muted/5 border border-border/80 p-5 rounded-3xl">
                        <h4 className="text-[10px] font-black uppercase text-muted tracking-widest flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-indigo-600" />
                          {language === 'en' ? 'Recent Class Attendance Strip' : 'সাম্প্রতিক ক্লাসের রিয়েল-টাইম উপস্থিতি'}
                        </h4>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {sortedAtt.slice(0, 32).reverse().map((att, idx) => (
                            <div 
                              key={att.id || idx}
                              className={cn(
                                "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 relative group cursor-help transition-transform hover:scale-110",
                                att.status === 'Present' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/10' :
                                att.status === 'Late' ? 'bg-amber-500 shadow-sm shadow-amber-500/10' :
                                'bg-rose-500 shadow-sm shadow-rose-500/10'
                              )}
                            >
                              {att.status.charAt(0)}
                              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-950 text-white text-[9px] font-bold py-1 px-2.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-50">
                                {att.date}: {att.status === 'Present' ? (language === 'en' ? 'Present' : 'উপস্থিত') : att.status === 'Late' ? (language === 'en' ? 'Late' : 'দেরি') : (language === 'en' ? 'Absent' : 'অনুপস্থিত')}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-4 text-[10px] font-bold text-muted mt-2 pt-1 border-t border-border/40">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded bg-emerald-500 block"></span>
                            <span>{language === 'en' ? 'Present (P)' : 'উপস্থিত (P)'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded bg-amber-500 block"></span>
                            <span>{language === 'en' ? 'Late (L)' : 'বিলম্বিত (L)'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded bg-rose-500 block"></span>
                            <span>{language === 'en' ? 'Absent (A)' : 'অনুপস্থিত (A)'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Simple logs lists */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-muted tracking-widest">
                        {language === 'en' ? 'Recent Class Details' : 'সাম্প্রতিক ক্লাসের বিস্তারিত'}
                      </h4>
                      {sortedAtt.length === 0 ? (
                        <div className="text-center py-10 space-y-2 border border-dashed border-border rounded-2xl">
                          <Calendar className="w-8 h-8 text-muted mx-auto" />
                          <p className="text-xs font-bold text-muted uppercase tracking-wider">
                            {language === 'en' ? 'No Attendance History Logged' : 'উপস্থিতি নিবন্ধনের কোনো রেকর্ড নেই'}
                          </p>
                        </div>
                      ) : (
                        <div className="max-h-[220px] overflow-y-auto rounded-2xl border border-border divide-y divide-border">
                          {sortedAtt.map((att) => (
                            <div key={att.id} className="flex justify-between items-center p-3.5 text-xs font-semibold hover:bg-muted/5 transition-colors">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-muted" />
                                <span className="font-mono text-muted-foreground">{att.date}</span>
                              </div>
                              <span className={cn(
                                "px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase",
                                att.status === 'Present' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200/20' :
                                att.status === 'Late' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200/20' :
                                'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-200/20'
                              )}>
                                {att.status === 'Present' ? (language === 'en' ? 'Present' : 'উপস্থিত') :
                                 att.status === 'Late' ? (language === 'en' ? 'Late' : 'দেরি') :
                                 (language === 'en' ? 'Absent' : 'অনুপস্থিত')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card text-card-foreground rounded-3xl w-full max-w-md shadow-2xl border border-border/50 overflow-hidden text-center p-6 space-y-6 transform transition-transform animate-in fade-in zoom-in-95">
            <div className="bg-rose-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-rose-500">
              <Trash2 size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{t.deleteStudentTitle}</h2>
              <p className="text-sm text-muted font-medium mt-2">{t.deleteStudentConfirmation}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 text-muted hover:text-foreground bg-muted/20 hover:bg-slate-200 font-bold rounded-2xl transition-all text-sm"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-3 text-white bg-rose-600 hover:bg-rose-700 font-extrabold rounded-2xl transition-all text-sm shadow-md"
              >
                {t.yesDelete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print PDF ID Card Layout Modal */}
      {idCardStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card text-card-foreground rounded-[2.5rem] w-full max-w-md shadow-2xl border border-border/50 overflow-hidden p-6 flex flex-col items-center">
            
            <div className="w-full flex justify-between items-center mb-6">
              <span className="font-extrabold text-foreground text-sm flex items-center gap-2">
                <Printer size={16} />
                Student Badge Generator
              </span>
              <button onClick={() => setIdCardStudent(null)} className="p-1 text-muted-foreground hover:text-slate-600 rounded-full hover:bg-muted/20">
                <X size={20} />
              </button>
            </div>

            {/* Simulated ID Card Widget */}
            <div id="print-badge-card" className="w-[85mm] h-[120mm] bg-gradient-to-b from-indigo-700 via-indigo-800 to-indigo-950 rounded-[1.5rem] p-5 shadow-xl text-white flex flex-col items-center justify-between text-center relative overflow-hidden select-none border border-indigo-600">
              {/* Graphic Overlay Accent */}
              <div className="absolute -top-10 -right-10 bg-indigo-500/25 w-40 h-40 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 bg-indigo-900/60 w-44 h-44 rounded-full blur-xl" />

              <div className="relative w-full">
                <h2 className="text-sm font-black tracking-widest text-indigo-200">PRAGYA ACADEMY</h2>
                <div className="h-[2px] w-12 bg-indigo-400 mx-auto mt-1" />
              </div>

              <div className="flex flex-col items-center justify-center gap-3 relative z-10">
                <div className="w-24 h-24 rounded-full bg-card text-card-foreground text-indigo-800 border-4 border-indigo-400 flex items-center justify-center text-4xl font-extrabold font-sans select-none shadow-md">
                  {idCardStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black">{idCardStudent.name}</h3>
                  <p className="text-[10px] font-mono tracking-widest text-indigo-300 font-extrabold bg-indigo-900/50 px-2 py-0.5 rounded-lg inline-block mt-0.5">
                    {idCardStudent.id}
                  </p>
                </div>
              </div>

              {/* ID Badge parameters */}
              <div className="w-full space-y-2 text-xs font-semibold text-indigo-100 relative z-10 border-t border-indigo-500/30 pt-4 mb-2">
                <div className="flex justify-between">
                  <span className="text-indigo-300 font-bold uppercase text-[9px]">Class/Batch</span>
                  <span className="font-extrabold text-white">{idCardStudent.batch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-300 font-bold uppercase text-[9px]">Guardian</span>
                  <span className="font-extrabold text-white font-mono">{idCardStudent.guardianMobile || '-'}</span>
                </div>
                {idCardStudent.schoolName && (
                  <div className="flex justify-between truncate">
                    <span className="text-indigo-300 font-bold uppercase text-[9px]">School</span>
                    <span className="font-extrabold text-white max-w-[150px] truncate" title={idCardStudent.schoolName}>{idCardStudent.schoolName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-indigo-300 font-bold uppercase text-[9px]">Admitted</span>
                  <span className="font-extrabold text-white font-mono">{idCardStudent.admissionDate}</span>
                </div>
              </div>

              <div className="w-full text-[8px] font-extrabold tracking-widest text-indigo-400 uppercase select-none">
                Official Student Identity
              </div>
            </div>

            {/* Trigger Button */}
            <button
              onClick={() => {
                triggerToast("Generating ID badge card...", 'success');
                const doc = new jsPDF('p', 'mm', [85, 120]);
                
                // Add graphic styling directly to PDF
                doc.setFillColor(79, 70, 229); // Primary Indigo-600
                doc.rect(0, 0, 85, 120, 'F');

                // Accent banner top
                doc.setFillColor(67, 56, 202); // Darker Indigo-700
                doc.rect(0, 0, 85, 25, 'F');

                doc.setFontSize(14);
                doc.setTextColor(255, 255, 255);
                doc.setFont('Helvetica', 'bold');
                doc.text("PRAGYA ACADEMY", 42.5, 12, { align: 'center' });

                doc.setFontSize(8);
                doc.setTextColor(199, 210, 254);
                doc.text("STUDENT IDENTITY CARD", 42.5, 18, { align: 'center' });

                // Draw Avatar background
                doc.setFillColor(255, 255, 255);
                doc.circle(42.5, 45, 14, 'F');
                doc.setTextColor(79, 70, 229);
                doc.setFontSize(24);
                doc.text(idCardStudent.name.charAt(0), 42.5, 48.5, { align: 'center' });

                // Student Details
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(13);
                doc.setFont('Helvetica', 'bold');
                doc.text(idCardStudent.name, 42.5, 66, { align: 'center' });

                doc.setFillColor(49, 46, 129); // Dark Indigo indigo-900
                doc.roundedRect(22.5, 70, 40, 6, 1.5, 1.5, 'F');
                doc.setFontSize(7.5);
                doc.setTextColor(165, 180, 252);
                doc.text(idCardStudent.id, 42.5, 74, { align: 'center' });

                // Horizontal separator
                doc.setDrawColor(99, 102, 241);
                doc.setLineWidth(0.3);
                doc.line(10, 81, 75, 81);

                // Meta Attributes
                doc.setTextColor(199, 210, 254);
                doc.setFontSize(7);
                doc.setFont('Helvetica', 'bold');
                doc.text("BATCH / CLASS:", 12, 88);
                doc.text("GUARDIAN MOBILE:", 12, 94);
                
                if (idCardStudent.schoolName) {
                  doc.text("SCHOOL NAME:", 12, 100);
                  doc.text("ADMISSION DATE:", 12, 106);
                } else {
                  doc.text("ADMISSION DATE:", 12, 100);
                }

                // Values
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(7.5);
                doc.text(idCardStudent.batch, 44, 88);
                doc.text(idCardStudent.guardianMobile || '-', 44, 94);
                
                if (idCardStudent.schoolName) {
                  const cutSchool = idCardStudent.schoolName.length > 21 ? idCardStudent.schoolName.substring(0, 18) + "..." : idCardStudent.schoolName;
                  doc.text(cutSchool, 44, 100);
                  doc.text(idCardStudent.admissionDate, 44, 106);
                } else {
                  doc.text(idCardStudent.admissionDate, 44, 100);
                }

                // Footer signature
                doc.setFontSize(6.5);
                doc.setTextColor(165, 180, 252);
                doc.text("OFFICIAL PRAGYA IDENTITY CARD", 42.5, 115, { align: 'center' });

                doc.save(`student_id_card_${idCardStudent.id}.pdf`);
              }}
              className="mt-6 flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold rounded-2xl transition-all text-sm shadow-md"
            >
              <Download size={18} />
              {lt.dobPlaceholder === "YYYY-MM-DD" ? "Download PDF Badge" : "পিডিএফ আইডি কার্ড ডাউনলোড"}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
