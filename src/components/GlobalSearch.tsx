import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Layers, Users as UsersIcon, ChevronRight, X } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { cn } from '../lib/utils';
import { translations } from '../lib/translations';

export function GlobalSearch({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { students, batches, teachers, language } = useAppContext();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getFilteredResults = () => {
    if (!query.trim()) return { students: [], batches: [], teachers: [] };
    const q = query.toLowerCase();

    return {
      students: students.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.mobile.includes(q)).slice(0, 5),
      batches: batches.filter(b => b.name.toLowerCase().includes(q)).slice(0, 5),
      teachers: teachers.filter(t => t.name.toLowerCase().includes(q)).slice(0, 5),
    };
  };

  const results = getFilteredResults();
  const hasResults = results.students.length > 0 || results.batches.length > 0 || results.teachers.length > 0;

  const navigateTo = (page: string) => {
    onNavigate(page);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 bg-muted/10 border border-border px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted/20 transition-all w-64 justify-between"
      >
        <div className="flex items-center gap-2">
          <Search size={16} />
          <span className="text-sm">{language === 'en' ? 'Search...' : 'অনুসন্ধান করুন...'}</span>
        </div>
        <kbd className="hidden lg:inline-flex items-center gap-1 bg-background px-1.5 py-0.5 rounded text-[10px] font-medium font-mono text-muted-foreground border border-border">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden flex items-center justify-center bg-muted/10 border border-border w-10 h-10 rounded-xl text-muted-foreground hover:bg-muted/20 transition-all"
      >
        <Search size={18} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4">
          <div 
            ref={searchRef}
            className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-muted/5 relative">
              <Search size={22} className="text-indigo-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={language === 'en' ? 'Search students, batches, teachers...' : 'শিক্ষার্থী, ব্যাচ, শিক্ষক খুঁজুন...'}
                className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 text-lg"
              />
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground bg-muted/10 p-1.5 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Search Results */}
            {query.trim() && (
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                {!hasResults ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>{language === 'en' ? 'No results found for' : 'কোন ফলাফল পাওয়া যায়নি'} "{query}"</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    
                    {/* Students */}
                    {results.students.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground">
                          {language === 'en' ? 'Students' : 'শিক্ষার্থী'}
                        </div>
                        <div className="flex flex-col gap-1">
                          {results.students.map(student => (
                            <button
                              key={student.id}
                              onClick={() => {
                                // Provide context for the navigation if possible, but for now navigate to students page.
                                // Ideal: navigate to student profile
                                navigateTo('students');
                              }}
                              className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/10 transition-colors group text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                                  {student.name.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{student.name}</span>
                                  <span className="text-xs text-muted-foreground">{student.id} • {student.batch}</span>
                                </div>
                              </div>
                              <ChevronRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Batches */}
                    {results.batches.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground">
                          {language === 'en' ? 'Batches' : 'ব্যাচ'}
                        </div>
                        <div className="flex flex-col gap-1">
                          {results.batches.map(batch => (
                            <button
                              key={batch.id}
                              onClick={() => navigateTo('smart-batches')}
                              className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/10 transition-colors group text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                  <Layers size={20} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{batch.name}</span>
                                  <span className="text-xs text-muted-foreground">{language === 'en' ? 'Smart Batch' : 'স্মার্ট ব্যাচ'}</span>
                                </div>
                              </div>
                              <ChevronRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Teachers */}
                    {results.teachers.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground">
                          {language === 'en' ? 'Teachers' : 'শিক্ষক'}
                        </div>
                        <div className="flex flex-col gap-1">
                          {results.teachers.map(teacher => (
                            <button
                              key={teacher.id}
                              onClick={() => navigateTo('teachers')}
                              className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/10 transition-colors group text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                                  <UsersIcon size={20} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{teacher.name}</span>
                                  <span className="text-xs text-muted-foreground">{(teacher.subjects || []).join(', ')}</span>
                                </div>
                              </div>
                              <ChevronRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}
            
            {/* Initial State / Help Text */}
            {!query.trim() && (
               <div className="px-6 py-10 flex flex-col items-center justify-center text-center">
                 <Search size={48} className="text-muted-foreground/30 mb-4" />
                 <p className="text-sm font-medium text-muted-foreground">
                   {language === 'en' 
                     ? 'Search for students (by name, ID, or phone), smart batches, or teachers.' 
                     : 'শিক্ষার্থী (নাম, আইডি বা ফোন দ্বারা), স্মার্ট ব্যাচ বা শিক্ষকদের জন্য অনুসন্ধান করুন।'}
                 </p>
               </div>
            )}
            
          </div>
        </div>
      )}
    </>
  );
}
