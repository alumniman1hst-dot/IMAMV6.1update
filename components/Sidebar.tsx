
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import React, { useMemo } from 'react';
import { ViewState, UserRole } from '../types';
import { 
  HomeIcon, UserIcon, QrCodeIcon, RobotIcon, ChartBarIcon, AppLogo, 
  BookOpenIcon, EnvelopeIcon, CalendarDaysIcon, UsersIcon, LogOutIcon,
  BriefcaseIcon, CalendarIcon, ArrowTrendingUpIcon, BuildingLibraryIcon,
  InfoIcon, XMarkIcon, CommandLineIcon, ClipboardDocumentListIcon, AcademicCapIcon,
  SparklesIcon, CogIcon, UserPlusIcon, HeadsetIcon, ShieldCheckIcon
} from './Icons';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  userRole?: UserRole;
  onLogout?: () => void;
  onClose?: () => void;
}

interface SidebarItem {
    label: string;
    icon: React.ElementType;
    view?: ViewState;
    url?: string;
    roles?: UserRole[]; 
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, userRole = UserRole.GURU, onLogout, onClose }) => {
  
  const menuItems: SidebarItem[] = [
    { label: 'Beranda', icon: HomeIcon, view: ViewState.DASHBOARD },
    { label: 'Profil madrasah', icon: BuildingLibraryIcon, view: ViewState.MADRASAH_INFO },
    { label: 'Data siswa', icon: UsersIcon, view: ViewState.STUDENTS },
    { label: 'Data guru', icon: BriefcaseIcon, view: ViewState.TEACHERS },
    { label: 'Data kelas', icon: BookOpenIcon, view: ViewState.CLASSES },
    { label: 'Jadwal pelajaran', icon: CalendarIcon, view: ViewState.SCHEDULE },
    { label: 'Jurnal mengajar', icon: BookOpenIcon, view: ViewState.JOURNAL },
    { label: 'Tugas & PR', icon: ClipboardDocumentListIcon, view: ViewState.ASSIGNMENTS },
    { label: 'Rapor digital', icon: AcademicCapIcon, view: ViewState.REPORT_CARDS },
    { label: 'Scan QR presensi', icon: QrCodeIcon, view: ViewState.SCANNER, roles: [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.GURU, UserRole.STAF_TU, UserRole.WALI_KELAS, UserRole.KEPALA_MADRASAH] },
    { label: 'Input presensi', icon: QrCodeIcon, view: ViewState.PRESENSI, roles: [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.GURU, UserRole.STAF_TU] },
    { label: 'Riwayat absen', icon: CalendarDaysIcon, view: ViewState.ATTENDANCE_HISTORY },
    { label: 'Layanan kemenag', icon: BuildingLibraryIcon, view: ViewState.KEMENAG_HUB },
    { label: 'Live chat bantuan', icon: HeadsetIcon, view: ViewState.ADVISOR },
    { label: 'Alat bantu guru AI', icon: SparklesIcon, view: ViewState.CONTENT_GENERATION, roles: [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.GURU, UserRole.WALI_KELAS] },
    { label: 'Layanan surat', icon: EnvelopeIcon, view: ViewState.LETTERS },
    { label: 'Laporan cetak', icon: ChartBarIcon, view: ViewState.REPORTS, roles: [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.KEPALA_MADRASAH] },
    { label: 'Profil saya', icon: UserIcon, view: ViewState.PROFILE },
    { 
        label: 'Manajemen klaim', 
        icon: ShieldCheckIcon, 
        view: ViewState.CLAIM_MANAGEMENT, 
        roles: [UserRole.ADMIN, UserRole.DEVELOPER] 
    },
    { 
        label: 'Manajemen user', 
        icon: UserPlusIcon, 
        view: ViewState.CREATE_ACCOUNT, 
        roles: [UserRole.ADMIN, UserRole.DEVELOPER] 
    },
    { 
        label: 'Developer console', 
        icon: CommandLineIcon, 
        view: ViewState.DEVELOPER, 
        roles: [UserRole.DEVELOPER] 
    },
    { label: 'Pengaturan sistem', icon: CogIcon, view: ViewState.SETTINGS },
    { label: 'Tentang aplikasi', icon: InfoIcon, view: ViewState.ABOUT },
  ];

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(userRole as UserRole);
    });
  }, [userRole]);

  return (
    <div className="h-full w-full bg-white dark:bg-[#0B1121] flex flex-col relative overflow-hidden">
      <div className="p-4 pt-6 pb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
            <AppLogo className="w-9 h-9" />
            <div>
                <h1 className="font-black text-slate-900 dark:text-white text-lg leading-none">IMAM</h1>
                <p className="text-[7px] font-bold text-slate-400 mt-1">MAN 1 Hulu Sungai Tengah</p>
            </div>
        </div>
        {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700">
                <XMarkIcon className="w-4 h-4" />
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 scrollbar-hide">
        {filteredItems.map((item, idx) => (
            <button
                key={idx}
                onClick={() => { 
                    if (item.url) {
                        window.open(item.url, '_blank');
                    } else if (item.view) {
                        onNavigate(item.view); 
                    }
                    if (onClose) onClose(); 
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all ${
                    !item.url && currentView === item.view
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
            >
                <item.icon className={`w-3.5 h-3.5 ${!item.url && currentView === item.view ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className="text-[10.5px] font-bold text-left tracking-tight flex-1">{item.label}</span>
            </button>
        ))}
      </div>

      <div className="p-2 border-t border-slate-100 dark:border-slate-800 mt-auto bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm cursor-pointer" onClick={() => onNavigate(ViewState.PROFILE)}>
            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-black text-[10px] text-indigo-600">{(userRole || 'G').charAt(0).toUpperCase()}</div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-800 dark:text-white truncate">Profil akun</p>
                <p className="text-[8px] text-slate-400 font-medium truncate">{userRole || '-'}</p>
            </div>
            {onLogout && (
                <button onClick={(e) => { e.stopPropagation(); onLogout(); }} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                    <LogOutIcon className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
