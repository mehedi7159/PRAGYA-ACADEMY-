import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CheckCircle,
  BarChart3,
  Wallet, 
  AlertCircle,
  Layers,
  Receipt, 
  MessageSquare,
  Settings, 
  HelpCircle,
  Menu,
  X,
  Trash2,
  DollarSign,
  Sun,
  Moon,
  ChevronDown,
  GraduationCap,
  Banknote,
  LineChart,
  Megaphone,
  Shield,
  LifeBuoy,
  Languages
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../store/AppContext';
import { translations } from '../lib/translations';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

import { GlobalSearch } from './GlobalSearch';

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const { language, setLanguage, theme, toggleTheme } = useAppContext();
  const t = translations[language];

  const handleToggleCategory = (catId: string) => {
    setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const navCategories = [
    {
      id: 'main',
      title: language === 'en' ? 'Main' : 'প্রধান',
      icon: LayoutDashboard,
      hideTitle: true,
      items: [
        { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
      ]
    },
    {
      id: 'academics',
      title: language === 'en' ? 'Academics' : 'অ্যাকাডেমিক্স',
      icon: GraduationCap,
      items: [
        { id: 'smart-batches', label: language === 'en' ? 'Smart Batches' : 'স্মার্ট ব্যাচ', icon: Layers },
        { id: 'students', label: language === 'en' ? 'Students' : 'শিক্ষার্থী', icon: Users },
        { id: 'attendance', label: language === 'en' ? 'Attendance' : 'উপস্থিতি', icon: CheckCircle },
        { id: 'exams', label: language === 'en' ? 'Exams' : 'পরীক্ষা', icon: Receipt },
      ]
    },
    {
      id: 'finance',
      title: language === 'en' ? 'Finance' : 'অর্থনীতি',
      icon: Banknote,
      items: [
        { id: 'fees', label: language === 'en' ? 'Fee Collection' : 'ফি সংগ্রহ' , icon: Wallet },
        { id: 'dues', label: language === 'en' ? 'Due List' : 'বকেয়া', icon: AlertCircle },
        { id: 'expenses', label: language === 'en' ? 'Expenses' : 'খরচ', icon: Receipt },
        { id: 'payroll', label: t.payroll, icon: DollarSign },
      ]
    },
    {
      id: 'reports',
      title: language === 'en' ? 'Analytics' : 'বিশ্লেষণ',
      icon: LineChart,
      items: [
        { id: 'reports', label: language === 'en' ? 'Reports Center' : 'রিপোর্ট কেন্দ্র', icon: BarChart3 },
      ]
    },
    {
      id: 'communication',
      title: language === 'en' ? 'Communication' : 'যোগাযোগ',
      icon: Megaphone,
      items: [
        { id: 'communication', label: language === 'en' ? 'Messaging' : 'বার্তা', icon: MessageSquare },
      ]
    },
    {
      id: 'admin',
      title: language === 'en' ? 'Administration' : 'প্রশাসন',
      icon: Shield,
      items: [
        { id: 'teachers', label: language === 'en' ? 'Teachers' : 'শিক্ষক', icon: Users },
        { id: 'settings', label: language === 'en' ? 'Settings' : 'সেটিংস', icon: Settings },
        { id: 'recycle-bin', label: t.recycleBin, icon: Trash2 },
      ]
    },
    {
      id: 'help',
      title: language === 'en' ? 'Help Center' : 'সাহায্য',
      icon: LifeBuoy,
      items: [
        { id: 'guide', label: language === 'en' ? 'Documentation' : 'নির্দেশিকা', icon: HelpCircle },
      ]
    }
  ];

  return (
    <div className="flex w-full h-[100dvh] bg-background overflow-hidden text-foreground font-sans transition-colors duration-300">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-slate-900/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-[270px] bg-slate-950 text-slate-300 transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:static lg:translate-x-0 flex flex-col pt-8 pb-4 border-r border-slate-800/80 shadow-2xl lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-6 mb-8 flex justify-between items-center">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="flex flex-col text-left group active:scale-95 transition-transform"
          >
             <div className="flex items-center gap-2">
                <div className="flex flex-col">
                   <span className="text-xl font-black text-white tracking-tight leading-none group-hover:text-indigo-400 transition-colors">PRAGYA</span>
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-0.5">Academy ERP</span>
                </div>
             </div>
          </button>
          <button className="lg:hidden text-slate-400 hover:text-white transition-colors p-2 bg-slate-900 rounded-xl border border-slate-800" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col flex-1 overflow-y-auto px-4 custom-scrollbar gap-1">
          {navCategories.map((category) => {
            const isCategoryOpen = !!openCategories[category.id];
            // Always open single item categories conceptually, but we can treat them as just headers or standalone items.
            // Actually, if a category has only 1 item and no sub-items structure requested conceptually, we'll just show it inline or with header.
            // The prompt says "Only major sections should appear in sidebar. Everything else should be submenus."

            return (
               <div key={category.id} className="mb-2">
                 {!category.hideTitle ? (
                    <button 
                       onClick={() => handleToggleCategory(category.id)}
                       className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors group mb-1"
                    >
                       <div className="flex items-center gap-2">
                          <category.icon size={14} />
                          {category.title}
                       </div>
                       <ChevronDown size={14} className={cn("transition-transform duration-300", isCategoryOpen ? "rotate-180" : "rotate-0")} />
                    </button>
                 ) : (
                   /* For categories with hideTitle=true (like 'main'), treat as always open or standalone items */
                    <div className="mb-1" />
                 )}
                 
                 <div className={cn("flex flex-col gap-1 overflow-hidden transition-all duration-300", (!isCategoryOpen && !category.hideTitle) ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100")}>
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPage === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onNavigate(item.id);
                            if (window.innerWidth < 1024) setSidebarOpen(false);
                          }}
                          className={cn(
                            "flex items-center w-full px-3 py-2.5 text-sm font-bold rounded-xl transition-all relative group",
                            isActive 
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                              : "text-slate-400 hover:bg-slate-900 hover:text-white"
                          )}
                        >
                          <Icon size={18} className={cn("mr-3 transition-transform", isActive ? "" : "group-hover:scale-110 text-slate-500 group-hover:text-slate-300")} />
                          {item.label}
                        </button>
                      )
                    })}
                 </div>
               </div>
            )
          })}
        </nav>
        
        <div className="mt-4 px-6 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-slate-900/50 rounded-xl p-1 border border-slate-800">
            <div className="flex-1 flex gap-1">
              <button 
                onClick={() => setLanguage('en')}
                className={cn(
                  "flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all",
                  language === 'en' ? "bg-indigo-600 text-white shadow-md relative" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                )}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('bn')}
                className={cn(
                  "flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all",
                  language === 'bn' ? "bg-indigo-600 text-white shadow-md relative" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                )}
              >
                বাংলা
              </button>
            </div>
            <div className="w-px h-6 bg-slate-800 mx-2"></div>
            <button 
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-800 transition-all text-slate-400 hover:text-white"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
          
          <div className="flex items-center gap-2 justify-center py-2 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">System Operational</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
         {/* Global Header */}
         <div className="flex-shrink-0 z-10 flex items-center justify-between px-4 md:px-8 py-4 bg-card/80 backdrop-blur-md border-b border-border">
           <div className="flex items-center gap-4">
             <button 
               className="lg:hidden text-muted hover:text-indigo-600 p-2.5 bg-muted/10 border border-border rounded-xl transition-all active:scale-95 flex items-center justify-center"
               onClick={() => setSidebarOpen(true)}
             >
               <Menu size={18} />
             </button>
             
             {/* Dynamic Page Title in Header */}
             <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-3">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{language === 'en' ? 'Pragya Academy' : 'প্রজ্ঞা একাডেমি'}</span>
                  <span className="font-bold text-lg leading-tight text-foreground capitalize">
                     {navCategories.flatMap(c => c.items).find(i => i.id === currentPage)?.label || currentPage}
                  </span>
                </div>
             </button>
           </div>
           
           <div className="flex items-center gap-3">
             <GlobalSearch onNavigate={onNavigate} />
             <div className="hidden sm:flex items-center gap-2 mr-2">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">v2.0.0</span>
             </div>
             
             <button 
                onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                className="w-10 h-10 rounded-xl bg-muted/10 border border-border flex items-center justify-center text-muted hover:text-foreground transition-all active:scale-95"
             >
                <Languages size={18} />
             </button>

             <button 
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl bg-muted/10 border border-border flex items-center justify-center text-muted hover:text-foreground transition-all active:scale-95"
             >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
             </button>
             

           </div>
         </div>
         
         <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
            <div className="p-4 md:p-8 w-full max-w-7xl mx-auto flex flex-col gap-8">
               {children}
            </div>
         </div>
      </main>
    </div>
  );
}
