import React from 'react';
import { ViewState, UserRole } from '../types';
import { 
  HomeIcon, UserIcon, CameraIcon, Squares2x2Icon, 
  ClipboardDocumentListIcon, ChartBarIcon, RobotIcon, HeadsetIcon
} from './Icons';

interface BottomNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  userRole?: UserRole;
  canAccessView?: (view: ViewState) => boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate, userRole, canAccessView }) => {
  const isStudent = userRole === UserRole.SISWA;

  const navItems = [
    { 
        id: 'home', 
        view: ViewState.DASHBOARD, 
        label: 'Beranda', 
        icon: HomeIcon 
    },
    { 
        id: 'assignments', 
        view: ViewState.ASSIGNMENTS, 
        label: 'Tugas', 
        icon: ClipboardDocumentListIcon 
    },
    { 
        id: 'menu', 
        view: ViewState.ALL_FEATURES, 
        label: 'Menu', 
        icon: Squares2x2Icon 
    },
    { 
        id: 'reports', 
        view: ViewState.REPORTS, 
        label: 'Laporan', 
        icon: ChartBarIcon 
    },
    { 
        id: 'profile', 
        view: ViewState.PROFILE, 
        label: 'Akun', 
        icon: UserIcon 
    }
  ];

  const filteredNavItems = navItems.filter((item) => !canAccessView || canAccessView(item.view));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)] md:hidden">
        {/* Kontainer utama */}
        <div className="pointer-events-auto relative w-full max-w-md px-4 pb-2">
            
            {/* --- FLOATING ACTION GROUP (Raised to bottom-24) --- */}
            <div className="absolute bottom-24 right-6 z-50 flex flex-col items-center gap-4">
                
                {/* 1. FLOATING LIVE CHAT BUTTON (Helpdesk) */}
                {(!canAccessView || canAccessView(ViewState.ADVISOR)) && (
                <div className="flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
                    <div className="px-2 py-0.5 bg-violet-600 dark:bg-violet-500 rounded-full shadow-lg border border-white/20">
                        <span className="text-[6px] font-black text-white uppercase tracking-[0.2em]">Live Chat</span>
                    </div>
                    <button 
                        onClick={() => onNavigate(ViewState.ADVISOR)}
                        className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white shadow-xl flex items-center justify-center border-2 border-white/20 active:scale-90 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <HeadsetIcon className="w-5 h-5 relative z-10 drop-shadow-md animate-pulse" />
                    </button>
                </div>
                )}

                {/* 2. FLOATING SCAN BUTTON (Hanya untuk non-Siswa) */}
                {!isStudent && (!canAccessView || canAccessView(ViewState.SCANNER)) && (
                    <div className="flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="px-2.5 py-0.5 bg-indigo-600 dark:bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/30 border border-white/20 animate-bounce">
                            <span className="text-[7px] font-black text-white uppercase tracking-[0.2em]">Scan QR</span>
                        </div>
                        <button 
                            onClick={() => onNavigate(ViewState.SCANNER)}
                            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 text-white shadow-[0_10px_20px_rgba(79,70,229,0.4)] flex items-center justify-center border-2 border-white/20 active:scale-90 transition-all duration-300 hover:-translate-y-1 group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <CameraIcon className="w-5 h-5 relative z-10 drop-shadow-md" />
                        </button>
                    </div>
                )}

            </div>

            {/* --- DOCK NAV CONTAINER --- */}
            <nav className="bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-2xl border border-white/40 dark:border-slate-800/60 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex justify-between items-center px-2 py-2 ring-1 ring-black/5">
                
                {filteredNavItems.map((item) => {
                    const isActive = currentView === item.view;
                    const Icon = item.icon;

                    return (
                        <button 
                            key={item.id}
                            onClick={() => item.view && onNavigate(item.view)}
                            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-500 group active:scale-90 ${
                                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                            }`}
                        >
                            <div className={`relative p-2 rounded-xl transition-all duration-500 ${
                                isActive 
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 -translate-y-1 shadow-inner' 
                                : 'group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50'
                            }`}>
                                <Icon className={`w-5 h-5 transition-all duration-500 ${isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[1.5px]'}`} />
                                
                                {isActive && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600 dark:bg-indigo-400"></span>
                                    </span>
                                )}
                            </div>

                            <span className={`text-[7px] font-black uppercase tracking-widest transition-all duration-500 ${
                                isActive ? 'opacity-100 scale-100' : 'opacity-60 scale-95 group-hover:opacity-100'
                            }`}>
                                {item.label}
                            </span>
                            
                            {isActive && (
                                <div className="absolute -bottom-0.5 w-4 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full blur-[1px]"></div>
                            )}
                        </button>
                    );
                })}

            </nav>
        </div>
    </div>
  );
};

export default BottomNav;