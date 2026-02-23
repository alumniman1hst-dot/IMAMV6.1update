import React from 'react';
import { ArrowLeftIcon } from './Icons';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ElementType;
  onBack?: () => void;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  withBottomNav?: boolean; 
  customHeader?: React.ReactNode; 
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  icon: Icon, 
  onBack, 
  actions, 
  footer,
  className = "",
  withBottomNav = false,
  customHeader
}) => {
  return (
    <div className={`flex flex-col h-full w-full bg-[#f8fafc] dark:bg-[#020617] transition-colors relative overflow-hidden ${className}`}>
      
      {/* --- HEADER (COMPACT & FULL FRAME) --- */}
      <header className="shrink-0 z-30 sticky top-0 safe-pt">
        <div className="absolute inset-0 bg-white/80 dark:bg-[#0B1121]/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors"></div>
        <div className="relative z-10 flex items-center justify-between p-3 lg:px-6 lg:py-4 gap-2 max-w-screen-2xl mx-auto w-full">
          
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {onBack && (
              <button 
                onClick={onBack} 
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
            )}
            
            {customHeader ? (
              customHeader
            ) : (
              <div className="flex flex-col min-w-0">
                <h1 className="text-sm font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5 transition-colors">
                  {title}
                  {Icon && <div className="p-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30"><Icon className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /></div>}
                </h1>
                {subtitle && (
                  <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 truncate transition-colors">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-1 shrink-0">
              {actions}
            </div>
          )}
        </div>
      </header>

      {/* --- MAIN ARCHITECTURE (TIGHT PADDING) --- */}
      <main className={`flex-1 overflow-y-auto relative w-full ${withBottomNav ? 'pb-24' : 'pb-6'} scroll-smooth custom-scrollbar`}>
        <div className="max-w-screen-2xl mx-auto w-full h-full">
            {children}
        </div>
      </main>

      {/* --- FOOTER (SLIM) --- */}
      {footer && (
        <footer className="shrink-0 z-30 bg-white/80 dark:bg-[#0B1121]/80 backdrop-blur-lg border-t border-slate-200/50 dark:border-slate-800 p-3 lg:px-6 pb-4 safe-pb transition-colors">
          <div className="max-w-screen-2xl mx-auto w-full">
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;