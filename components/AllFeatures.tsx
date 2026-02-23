/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import React from 'react';
import Layout from './Layout';
import { ViewState, UserRole } from '../types';
import { 
  QrCodeIcon, BookOpenIcon, EnvelopeIcon, CalendarDaysIcon, UsersIcon, 
  BriefcaseIcon, CalendarIcon, ArrowTrendingUpIcon, BuildingLibraryIcon,
  InfoIcon, AcademicCapIcon, ClipboardDocumentListIcon,
  CommandLineIcon, CameraIcon, Squares2x2Icon, 
  SparklesIcon, MegaphoneIcon, UserIcon, PusakaIcon, RdmIcon, Emis40Icon, EmisIcon, 
  SimsdmIcon, AbsensiKemenagIcon, PintarIcon, AsnDigitalIcon, HeadsetIcon, 
  IdentificationIcon, ShieldCheckIcon, ClockIcon, StarIcon, CogIcon, ChartBarIcon
} from './Icons';

interface AllFeaturesProps {
    onBack: () => void;
    onNavigate: (v: ViewState) => void;
    userRole: UserRole;
}

const AllFeatures: React.FC<AllFeaturesProps> = ({ onBack, onNavigate, userRole }) => {
  // Koleksi Fitur dengan Nama Singkat & Normal Case
  const menuItems = [
    { label: 'Berita', icon: MegaphoneIcon, view: ViewState.NEWS, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
    { label: 'Profil', icon: BuildingLibraryIcon, view: ViewState.MADRASAH_INFO, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Tentang', icon: InfoIcon, view: ViewState.ABOUT, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' },
    { label: 'Log Login', icon: ShieldCheckIcon, view: ViewState.LOGIN_HISTORY, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    
    { label: 'Jadwal', icon: CalendarIcon, view: ViewState.SCHEDULE, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/30' },
    { label: 'Jurnal', icon: BookOpenIcon, view: ViewState.JOURNAL, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/30', roles: [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.GURU, UserRole.WALI_KELAS] },
    { label: 'Tugas', icon: ClipboardDocumentListIcon, view: ViewState.ASSIGNMENTS, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/30' },
    { label: 'Input Nilai', icon: AcademicCapIcon, view: ViewState.GRADES, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30', roles: [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.GURU, UserRole.STAF_TU] },
    { label: 'Tahun Ajaran', icon: CalendarDaysIcon, view: ViewState.ACADEMIC_YEAR, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/30', roles: [UserRole.ADMIN, UserRole.DEVELOPER] },
    { label: 'Naik Kelas', icon: ArrowTrendingUpIcon, view: ViewState.PROMOTION, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/30', roles: [UserRole.ADMIN, UserRole.DEVELOPER] },
    { label: 'Rapor', icon: AcademicCapIcon, view: ViewState.REPORT_CARDS, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Cetak Laporan', icon: ChartBarIcon, view: ViewState.REPORTS, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800', roles: [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.KEPALA_MADRASAH] },

    { label: 'Scan QR', icon: CameraIcon, view: ViewState.SCANNER, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/30', roles: [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.GURU, UserRole.STAF_TU, UserRole.WALI_KELAS, UserRole.KEPALA_MADRASAH] },
    { label: 'Presensi', icon: QrCodeIcon, view: ViewState.PRESENSI, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/30', roles: [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.GURU, UserRole.STAF_TU] },
    { label: 'Log Absen', icon: ClockIcon, view: ViewState.ATTENDANCE_HISTORY, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Poin', icon: ShieldCheckIcon, view: ViewState.POINTS, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { label: 'Siswa', icon: UsersIcon, view: ViewState.STUDENTS, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30', roles: [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.GURU, UserRole.STAF_TU] },
    { label: 'Guru', icon: BriefcaseIcon, view: ViewState.TEACHERS, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30', roles: [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.GURU, UserRole.STAF_TU] },
    { label: 'Kelas', icon: BookOpenIcon, view: ViewState.CLASSES, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30', roles: [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.GURU, UserRole.STAF_TU] },
    { label: 'ID Card', icon: IdentificationIcon, view: ViewState.ID_CARD, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },

    { label: 'Chat AI', icon: HeadsetIcon, view: ViewState.ADVISOR, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/30' },
    { label: 'Alat AI', icon: SparklesIcon, view: ViewState.CONTENT_GENERATION, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/30', roles: [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.GURU, UserRole.WALI_KELAS] },
    { label: 'Surat', icon: EnvelopeIcon, view: ViewState.LETTERS, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/30' },
    { label: 'Akun Saya', icon: UserIcon, view: ViewState.PROFILE, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-800' },
    { label: 'Premium', icon: StarIcon, view: ViewState.PREMIUM, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/30', roles: [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.KEPALA_MADRASAH] },
    { label: 'Console', icon: CommandLineIcon, view: ViewState.DEVELOPER, color: 'text-white', bg: 'bg-slate-900', roles: [UserRole.DEVELOPER] },
    { label: 'Setelan', icon: CogIcon, view: ViewState.SETTINGS, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },

    { label: 'Pusaka', icon: PusakaIcon, onClick: () => window.open('https://pusaka-v3.kemenag.go.id/', '_blank'), isFrameless: true },
    { label: 'RDM', icon: RdmIcon, onClick: () => window.open('https://hdmadrasah.id/login/auth', '_blank'), isFrameless: true },
    { label: 'Emis 4.0', icon: Emis40Icon, onClick: () => window.open('https://emis.kemenag.go.id/', '_blank'), isFrameless: true },
    { label: 'Emis GTK', icon: EmisIcon, onClick: () => window.open('https://emisgtk.kemenag.go.id/', '_blank'), isFrameless: true },
    { label: 'SIMSDM', icon: SimsdmIcon, onClick: () => window.open('https://simpeg5.kemenag.go.id/', '_blank'), isFrameless: true },
    { label: 'Absensi', icon: AbsensiKemenagIcon, onClick: () => window.open('https://sso.kemenag.go.id/auth/signin?appid=42095eeec431ac23eb12d2b772c94be0', '_blank'), isFrameless: true },
    { label: 'Pintar', icon: PintarIcon, onClick: () => window.open('https://pintar.kemenag.go.id/', '_blank'), isFrameless: true },
    { label: 'ASN Digital', icon: AsnDigitalIcon, onClick: () => window.open('https://asndigital.bkn.go.id/', '_blank'), isFrameless: true }
  ].filter(item => !item.roles || item.roles.includes(userRole));

  return (
    <Layout title="Menu Eksplorasi" subtitle="Integrasi Fitur Madrasah" icon={Squares2x2Icon} onBack={onBack} withBottomNav={true}>
      <div className="p-4 lg:p-10 pb-40 max-w-6xl mx-auto">
        {/* Grid Tunggal Rapat (Reduced gap-y-8 to gap-y-5) */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-y-5 gap-x-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {menuItems.map((item, idx) => (
                <button 
                    key={idx} 
                    onClick={() => item.onClick ? item.onClick() : (item.view && onNavigate(item.view))} 
                    className="flex flex-col items-center gap-1.5 group outline-none"
                >
                    {/* Ikon Container */}
                    <div className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center transition-all active:scale-90 group-hover:-translate-y-1 group-hover:shadow-xl duration-300 relative overflow-hidden ${
                        item.isFrameless 
                        ? 'bg-transparent' 
                        : `${item.bg} ${item.color} rounded-[1.8rem] shadow-sm border border-black/5 dark:border-white/10`
                    }`}>
                        {!item.isFrameless && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        )}
                        <item.icon className={item.isFrameless ? 'w-full h-full object-contain filter drop-shadow-sm' : 'w-6 h-6 md:w-7 md:h-7 relative z-10'} />
                    </div>
                    
                    {/* Label Menu - Normal Case & 10.5px (Removed min-h to tighten spacing) */}
                    <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 text-center tracking-tight leading-tight w-full px-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 flex items-start justify-center">
                        {item.label}
                    </span>
                </button>
            ))}
        </div>

        {/* Decorative Footer */}
        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800/50 text-center opacity-20 pointer-events-none">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">IMAM Digital Ecosystem v6.2</p>
        </div>
      </div>
    </Layout>
  );
};

export default AllFeatures;