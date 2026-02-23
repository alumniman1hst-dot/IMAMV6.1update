
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { db, auth, isMockMode } from '../services/firebase';
import { 
  ShieldCheckIcon, StarIcon, ArrowTrendingUpIcon, 
  Search, InfoIcon, ClockIcon, CheckCircleIcon,
  XCircleIcon, Loader2, PlusIcon, UserIcon,
  PencilIcon, TrashIcon, SaveIcon, ChevronDownIcon
} from './Icons';
import { ViewState, UserRole, ViolationMaster, DisciplineLog, Student } from '../types';
import { toast } from 'sonner';

const PointsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.SISWA);
  const [activeTab, setActiveTab] = useState<'status' | 'rules' | 'management'>('status');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Student Data
  const [currentPoints, setCurrentPoints] = useState(100);
  const [logs, setLogs] = useState<DisciplineLog[]>([]);

  // Master Data
  const [rules, setRules] = useState<ViolationMaster[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
      studentId: '',
      ruleId: '',
      type: 'Violation' as 'Violation' | 'Reward',
      note: ''
  });

  const isStaff = userRole === UserRole.STAF_TU || userRole === UserRole.ADMIN || userRole === UserRole.DEVELOPER;
  const isGuru = userRole === UserRole.GURU || userRole === UserRole.WALI_KELAS;
  const isKamad = userRole === UserRole.KEPALA_MADRASAH;
  // Added fixed isStudent variable definition
  const isStudent = userRole === UserRole.SISWA;

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        if (isMockMode) {
            setTimeout(() => {
                setUserRole(UserRole.ADMIN); // Change for testing roles
                setRules([
                    { id: 'R1', category: 'Kedisiplinan', description: 'Terlambat datang ke sekolah (> 15 menit)', points: 5 },
                    { id: 'R2', category: 'Kerapihan', description: 'Berambut panjang/tidak rapi (Laki-laki)', points: 10 },
                    { id: 'R3', category: 'Pelanggaran Berat', description: 'Membawa rokok atau merokok di sekolah', points: 100 },
                    { id: 'R4', category: 'Kedisiplinan', description: 'Atribut seragam tidak lengkap', points: 5 },
                ]);
                setLogs([
                    { id: '1', studentId: 's1', studentName: 'Ahmad Dahlan', type: 'Violation', ruleId: 'R1', ruleDescription: 'Terlambat Masuk', points: -5, date: '2024-05-20', recordedBy: 'Admin', status: 'Approved' }
                ]);
                setStudents([
                    { id: 's1', namaLengkap: 'Ahmad Dahlan', tingkatRombel: 'X IPA 1', nisn: '123' } as any
                ]);
                setLoading(false);
            }, 500);
            return;
        }

        if (auth.currentUser && db) {
            const userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
            const role = userDoc.data()?.role as UserRole;
            setUserRole(role);

            // Fetch Rules
            const rulesSnap = await db.collection('violations_master').get();
            setRules(rulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ViolationMaster)));

            if (role === UserRole.SISWA) {
                const myLogs = await db.collection('discipline_logs').where('studentId', '==', auth.currentUser.uid).orderBy('date', 'desc').get();
                setLogs(myLogs.docs.map(doc => ({ id: doc.id, ...doc.data() } as DisciplineLog)));
                setCurrentPoints(userDoc.data()?.disciplinePoints || 100);
            } else {
                const allLogs = await db.collection('discipline_logs').orderBy('date', 'desc').limit(50).get();
                setLogs(allLogs.docs.map(doc => ({ id: doc.id, ...doc.data() } as DisciplineLog)));
                const studentsSnap = await db.collection('students').where('status', '==', 'Aktif').get();
                setStudents(studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
            }
        }
        setLoading(false);
    };
    init();
  }, []);

  const handleLogViolation = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.studentId || !formData.ruleId) {
          toast.error("Mohon pilih siswa dan jenis pelanggaran.");
          return;
      }

      const toastId = toast.loading("Mencatat poin...");
      try {
          const student = students.find(s => s.id === formData.studentId);
          const rule = rules.find(r => r.id === formData.ruleId);
          
          if (!student || !rule) throw new Error("Data invalid");

          const logData: Omit<DisciplineLog, 'id'> = {
              studentId: student.id!,
              studentName: student.namaLengkap,
              type: formData.type,
              ruleId: rule.id,
              ruleDescription: rule.description,
              points: formData.type === 'Violation' ? -rule.points : rule.points,
              date: new Date().toISOString(),
              recordedBy: auth.currentUser?.displayName || 'Guru',
              status: rule.points >= 50 ? 'Pending' : 'Approved',
              note: formData.note
          };

          if (isMockMode) {
              await new Promise(r => setTimeout(r, 800));
              setLogs(prev => [{ id: Date.now().toString(), ...logData } as DisciplineLog, ...prev]);
          } else if (db) {
              const ref = await db.collection('discipline_logs').add(logData);
              // Update student point sum
              if (logData.status === 'Approved') {
                  const currentScore = student.disciplinePoints || 100;
                  await db.collection('users').doc(student.linkedUserId || student.id).update({
                      disciplinePoints: currentScore + logData.points
                  });
              }
          }
          
          toast.success("Pelanggaran berhasil dicatat!", { id: toastId });
          setIsModalOpen(false);
          setFormData({ studentId: '', ruleId: '', type: 'Violation', note: '' });
      } catch (e) {
          toast.error("Gagal mencatat data.", { id: toastId });
      }
  };

  const getStatusText = (points: number) => {
    if (points >= 90) return { label: 'Sangat Baik', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
    if (points >= 75) return { label: 'Baik', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' };
    if (points >= 60) return { label: 'Cukup', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' };
    return { label: 'Perlu Pembinaan', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' };
  };

  const filteredRules = rules.filter(r => 
    r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Disiplin & Poin" subtitle="Karakter & Ketertiban" icon={ShieldCheckIcon} onBack={onBack}>
      <div className="p-4 lg:p-8 pb-32 space-y-6 max-w-5xl mx-auto w-full">
        
        {/* Navigation Tabs */}
        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit mx-auto border border-slate-200 dark:border-slate-700 shadow-inner">
          <button 
            onClick={() => setActiveTab('status')}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'status' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5' : 'text-slate-400'}`}
          >
            {userRole === UserRole.SISWA ? 'Status Saya' : 'Daftar Log'}
          </button>
          <button 
            onClick={() => setActiveTab('rules')}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'rules' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5' : 'text-slate-400'}`}
          >
            Daftar Aturan
          </button>
          {(isStaff || isGuru) && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className={`ml-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all`}
              >
                <PlusIcon className="w-4 h-4" /> Input
              </button>
          )}
        </div>

        {loading ? (
           <div className="py-20 text-center flex flex-col items-center gap-3">
               <Loader2 className="w-10 h-10 animate-spin text-indigo-500 opacity-20" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sinkronisasi Data Disiplin...</p>
           </div>
        ) : activeTab === 'status' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Summary Grid for Staff/Kamad */}
            {!isStudent && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox label="Total Kasus" value={logs.length} icon={ShieldCheckIcon} color="text-indigo-600" bg="bg-indigo-50" />
                    <StatBox label="Pelanggaran" value={logs.filter(l => l.type === 'Violation').length} icon={XCircleIcon} color="text-rose-600" bg="bg-rose-50" />
                    <StatBox label="Prestasi/Reward" value={logs.filter(l => l.type === 'Reward').length} icon={StarIcon} color="text-emerald-600" bg="bg-emerald-50" />
                    <StatBox label="Sanksi Berat" value={logs.filter(l => Math.abs(l.points) >= 50).length} icon={InfoIcon} color="text-amber-600" bg="bg-amber-50" />
                </div>
            )}

            {/* Score Card for Student */}
            {isStudent && (
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><StarIcon className="w-40 h-40" /></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-70 mb-2">Skor Kredit Disiplin</p>
                            <h2 className="text-5xl font-black">{currentPoints} <span className="text-xl opacity-50 font-medium">/ 100</span></h2>
                            <div className={`mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border border-white/10 ${getStatusText(currentPoints).bg} ${getStatusText(currentPoints).color} font-black text-[10px] uppercase tracking-widest`}>
                                <CheckCircleIcon className="w-4 h-4" /> {getStatusText(currentPoints).label}
                            </div>
                        </div>
                        <div className="w-full md:w-48 space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-70">
                                <span>Health Bar</span>
                                <span>{currentPoints}%</span>
                            </div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white transition-all duration-1000" style={{ width: `${currentPoints}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Logs List */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Riwayat Pencatatan Terkini</h3>
                <div className="grid grid-cols-1 gap-3">
                    {logs.map(log => (
                        <div key={log.id} className="bg-white dark:bg-[#151E32] p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-all hover:border-indigo-200">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${log.type === 'Reward' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                    {log.type === 'Reward' ? <StarIcon className="w-6 h-6" /> : <XCircleIcon className="w-6 h-6" />}
                                </div>
                                <div className="min-w-0 pr-4">
                                    <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight truncate max-w-[200px] sm:max-w-md">{log.ruleDescription}</h4>
                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                        {!isStudent && <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{log.studentName}</span>}
                                        <span className="text-slate-200 dark:text-slate-800">•</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                        <span className="text-slate-200 dark:text-slate-800">•</span>
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${log.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{log.status}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={`text-sm font-black shrink-0 ${log.points > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {log.points > 0 ? '+' : ''}{log.points}
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                            <InfoIcon className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum ada catatan aktivitas.</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Rules Section */}
            <div className="bg-white dark:bg-[#151E32] p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12"><ShieldCheckIcon className="w-32 h-32"/></div>
                <div className="relative z-10 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="CARI PASAL TATA TERTIB..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-black focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-800 dark:text-white outline-none shadow-inner" 
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRules.map(rule => (
                    <div key={rule.id} className="bg-white dark:bg-[#151E32] p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between min-h-[140px]">
                        <div className="mb-4">
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest ${rule.points >= 20 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {rule.category}
                                </span>
                                <span className="text-[10px] font-black text-slate-300">#{rule.id}</span>
                            </div>
                            <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-relaxed group-hover:text-indigo-600 transition-colors">{rule.description}</h4>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50">
                            <div className="flex items-center gap-1.5">
                                <ShieldCheckIcon className="w-3.5 h-3.5 text-slate-300" />
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Aturan Resmi MAN 1 HST</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-rose-600">{rule.points}</span>
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Poin</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* Informational Footer */}
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-relaxed">
                Skor awal kredit disiplin adalah 100 poin. <br/>
                Pelanggaran mengurangi skor, sementara prestasi dan ketaatan ibadah menambah skor. <br/>
                Ambang batas sanksi: 75 (SP I), 50 (SP II), 25 (SP III).
            </p>
        </div>
      </div>

      {/* INPUT MODAL */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <div className="bg-white dark:bg-[#0B1121] w-full max-w-lg rounded-[3rem] p-8 shadow-2xl animate-in zoom-in duration-300 border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><ShieldCheckIcon className="w-40 h-40"/></div>
                  <div className="flex justify-between items-center mb-8 relative z-10">
                      <div>
                          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase leading-none">Input Disiplin</h3>
                          <p className="text-[9px] font-bold text-indigo-500 uppercase mt-2">Pelanggaran & Penghargaan</p>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><XCircleIcon className="w-8 h-8 text-slate-400" /></button>
                  </div>
                  
                  <form onSubmit={handleLogViolation} className="space-y-6 relative z-10">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Siswa</label>
                        <div className="relative">
                            <select 
                                required value={formData.studentId}
                                onChange={e => setFormData({...formData, studentId: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-5 text-xs font-bold outline-none appearance-none cursor-pointer"
                            >
                                <option value="">-- CARI NAMA SISWA --</option>
                                {students.map(s => <option key={s.id} value={s.id!}>{s.namaLengkap} ({s.tingkatRombel})</option>)}
                            </select>
                            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Input</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                type="button" 
                                onClick={() => setFormData({...formData, type: 'Violation'})}
                                className={`py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${formData.type === 'Violation' ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 text-slate-400'}`}
                            >Pelanggaran</button>
                            <button 
                                type="button" 
                                onClick={() => setFormData({...formData, type: 'Reward'})}
                                className={`py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${formData.type === 'Reward' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 text-slate-400'}`}
                            >Prestasi</button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Aturan/Reward</label>
                        <div className="relative">
                            <select 
                                required value={formData.ruleId}
                                onChange={e => setFormData({...formData, ruleId: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-5 text-xs font-bold outline-none appearance-none cursor-pointer"
                            >
                                <option value="">-- PILIH DESKRIPSI --</option>
                                {rules.filter(r => (formData.type === 'Violation' ? r.points > 0 : r.points < 0)).map(r => (
                                    <option key={r.id} value={r.id}>{r.description} ({Math.abs(r.points)} Poin)</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-[2rem] text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                          <SaveIcon className="w-5 h-5" /> Simpan Catatan Disiplin
                      </button>
                  </form>
              </div>
          </div>
      )}
    </Layout>
  );
};

const StatBox = ({ label, value, icon: Icon, color, bg }: any) => (
    <div className={`p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[120px] ${bg}/20`}>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${bg} ${color} mb-3 shadow-sm`}><Icon className="w-5 h-5" /></div>
        <div>
            <h4 className="text-2xl font-black text-slate-800 dark:text-white leading-none">{value}</h4>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{label}</p>
        </div>
    </div>
);

export default PointsView;
