
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect, useRef } from 'react';
import { ViewState, UserRole } from '../types';
import { db, auth, isMockMode } from '../services/firebase';
import { 
  UsersGroupIcon, BriefcaseIcon, 
  QrCodeIcon, ArrowRightIcon, AcademicCapIcon, ClockIcon,
  CheckCircleIcon, ChartBarIcon, EnvelopeIcon,
  CalendarIcon, RobotIcon, BookOpenIcon, CogIcon,
  IdentificationIcon, StarIcon, 
  LogOutIcon, SparklesIcon,
  InfoIcon
} from './Icons';
import { format } from 'date-fns';

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  userRole: UserRole;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, userRole, onLogout }) => {
  const [userName, setUserName] = useState<string>('Pengguna');
  const [userIdUnik, setUserIdUnik] = useState<string | null>(null);
  
  // Menggunakan satu state objek untuk efisiensi Read
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    pendingLetters: 0,
    male: 0,
    female: 0
  });
  
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isStudent = userRole === UserRole.SISWA;

  useEffect(() => {
    const fetchDashboardData = async () => {
        setLoadingStats(true);
        
        // 1. Ambil Nama User dari Cache/Auth
        if (auth.currentUser) {
            setUserName(auth.currentUser.displayName || 'Pengguna');
        }

        // 2. Simulasi atau Real Data
        if (isMockMode) {
            setTimeout(() => {
                setStats({ students: 842, teachers: 56, classes: 24, pendingLetters: 5, male: 410, female: 432 });
                setTrendData([{day:'M', val:80}, {day:'S', val:95}, {day:'S', val:90}]);
                setLoadingStats(false);
            }, 800);
            return;
        }

        if (!db) return;

        try {
            // OPTIMASI KUOTA: Gunakan dokumen metadata 'global_stats'
            // Daripada fetch .get() ke seluruh koleksi students yang memakan RATUSAN Read Units,
            // Kita hanya melakukan 1 kali Read Unit ke dokumen counter ini.
            const statsDoc = await db.collection('settings').doc('global_stats').get();
            if (statsDoc.exists) {
                const s = statsDoc.data();
                setStats({
                    students: s?.totalStudents || 0,
                    teachers: s?.totalTeachers || 0,
                    classes: s?.totalClasses || 0,
                    pendingLetters: s?.totalPendingLetters || 0,
                    male: s?.totalMale || 0,
                    female: s?.totalFemale || 0
                });
            }

            // Kehadiran Hari Ini (Targeted Read)
            if (auth.currentUser) {
                const today = format(new Date(), 'yyyy-MM-dd');
                // Hanya ambil 1 dokumen milik user ini
                const attSnap = await db.collection('attendance')
                    .where('studentId', '==', auth.currentUser.uid)
                    .where('date', '==', today)
                    .limit(1)
                    .get();
                
                if (!attSnap.empty) setTodayAttendance(attSnap.docs[0].data());
            }
        } catch (e) {
            console.error("Dashboard Quota Optimization Error:", e);
        } finally {
            setLoadingStats(false);
        }
    };

    fetchDashboardData();
  }, []);

  const prestigePhoto = "https://lh3.googleusercontent.com/d/1nUuvSSEI4pj7YZd_Hy4iSO62LM-_KuoE";

  const hasRoleAccess = (roles?: UserRole[]) => !roles || roles.includes(userRole);

  const quickMenuItems = [
    { label: 'Jadwal', icon: CalendarIcon, view: ViewState.SCHEDULE, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Tugas', icon: BookOpenIcon, view: ViewState.ASSIGNMENTS, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Presensi', icon: QrCodeIcon, view: ViewState.SCANNER, color: 'text-teal-600', bg: 'bg-teal-50', roles: [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.GURU, UserRole.STAF_TU, UserRole.WALI_KELAS, UserRole.KEPALA_MADRASAH] },
    { label: 'Nilai', icon: AcademicCapIcon, view: ViewState.REPORT_CARDS, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Surat', icon: EnvelopeIcon, view: ViewState.LETTERS, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Laporan', icon: ChartBarIcon, view: ViewState.REPORTS, color: 'text-slate-600', bg: 'bg-slate-100', roles: [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.KEPALA_MADRASAH] }
  ].filter(item => hasRoleAccess(item.roles));

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#020617] overflow-hidden transition-colors duration-300">
      <div className="px-6 pt-12 pb-6 bg-white dark:bg-[#0B1121] rounded-b-[2.5rem] border-b border-slate-100 dark:border-slate-800/50 sticky top-0 z-40">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IMAM v6.2 Active</p>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">
                Halo, {userName.split(' ')[0]}!
            </h1>
            <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold border border-indigo-100 dark:border-indigo-800">
                    {userRole}
                </span>
            </div>
          </div>
          <div className="flex gap-2.5">
             <button onClick={() => onNavigate(ViewState.SETTINGS)} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-500 border border-slate-100 dark:border-slate-800 active:scale-90 transition-all"><CogIcon className="w-5 h-5" /></button>
             <button onClick={onLogout} className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-600 border border-rose-100 dark:border-rose-900/30 active:scale-90 transition-all"><LogOutIcon className="w-5 h-5" /></button>
          </div>
        </div>

        <div ref={scrollRef} className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide -mx-6 px-6 snap-x snap-mandatory">
            {isStudent && (
                <div onClick={() => onNavigate(ViewState.ATTENDANCE_HISTORY)} className="min-w-[280px] snap-center bg-indigo-600 rounded-[2.5rem] p-6 text-white shadow-xl cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12"><CheckCircleIcon className="w-24 h-24" /></div>
                    <p className="text-[10px] font-bold opacity-70 mb-1 uppercase tracking-widest">Kehadiran Hari Ini</p>
                    <h3 className="text-xl font-black mb-4">
                        {todayAttendance ? todayAttendance.status : 'Belum Absen'}
                    </h3>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold bg-white/20 px-4 py-1.5 rounded-xl">Lihat Riwayat</span>
                        <ClockIcon className="w-4 h-4 opacity-40" />
                    </div>
                </div>
            )}
            
            {!isStudent && (
                <>
                    <div className="relative min-w-[300px] snap-center rounded-[2.5rem] bg-[#0F172A] text-white shadow-2xl h-[160px] flex flex-col justify-end overflow-hidden border border-white/10 p-6">
                        <img src={prestigePhoto} className="absolute inset-0 w-full h-full object-cover object-top opacity-40" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] to-transparent"></div>
                        <div className="relative z-10">
                            <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest">Kepala Madrasah</span>
                            <h4 className="text-base font-black uppercase">H. Someran, S.Pd.,MM</h4>
                        </div>
                    </div>
                    <StatCardMini label="Peserta Didik" val={stats.students} icon={UsersGroupIcon} grad="from-blue-600 to-indigo-800" detail={`${stats.male} L • ${stats.female} P`} />
                    <StatCardMini label="Total Guru" val={stats.teachers} icon={BriefcaseIcon} grad="from-emerald-600 to-teal-800" detail="GTK Terverifikasi" />
                </>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-40">
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-6 animate-in fade-in duration-700">
            {quickMenuItems.map((item, idx) => (
                <button key={idx} onClick={() => onNavigate(item.view)} className="flex flex-col items-center gap-2 group outline-none">
                    <div className={`w-14 h-14 rounded-[1.8rem] flex items-center justify-center shadow-sm border border-black/5 active:scale-90 transition-all ${item.bg} dark:bg-slate-800`}>
                        <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 text-center truncate w-full">{item.label}</span>
                </button>
            ))}
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/50 rounded-[2.5rem] p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg"><InfoIcon className="w-6 h-6" /></div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Petunjuk Cepat</h3>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Gunakan menu <b>Scan QR</b> untuk melakukan absensi harian. Siswa cukup menunjukkan <b>ID Digital</b> yang ada di menu akun. Data akan tersinkronisasi secara otomatis ke database pusat.
            </p>
        </div>
      </div>
    </div>
  );
};

const StatCardMini = ({ label, val, icon: Icon, grad, detail }: any) => (
    <div className={`relative min-w-[260px] snap-center p-6 rounded-[2.5rem] bg-gradient-to-br ${grad} text-white shadow-xl h-[160px] flex flex-col justify-between overflow-hidden`}>
        <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10"><Icon className="w-5 h-5" /></div>
            <span className="bg-white/20 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">Master</span>
        </div>
        <div>
            <h3 className="text-3xl font-black">{val}</h3>
            <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">{label} • {detail}</p>
        </div>
    </div>
);

export default Dashboard;
