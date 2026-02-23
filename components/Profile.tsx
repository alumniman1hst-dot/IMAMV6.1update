import React, { useState, useEffect, useRef } from 'react';
import { auth, db, isMockMode } from '../services/firebase';
import { submitClaimRequest, getMyClaimRequests, cleanAcademicName } from '../services/claimService';
import Layout from './Layout';
import { 
  UserIcon, ShieldCheckIcon, LogOutIcon, PencilIcon, AcademicCapIcon, 
  UsersIcon, Loader2, PhoneIcon, EnvelopeIcon, BuildingLibraryIcon,
  CalendarDaysIcon, MapPinIcon, ImamLogo, BellIcon, ClockIcon,
  BriefcaseIcon, QrCodeIcon, SparklesIcon, CheckCircleIcon, StarIcon,
  ChartBarIcon, CameraIcon, XCircleIcon, SaveIcon, ArrowRightIcon,
  InfoIcon, IdentificationIcon
} from './Icons';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { ClaimRequest } from '../types';

interface UserProfile {
  displayName: string;
  email: string;
  role: string;
  photoURL?: string;
  nip?: string;
  nisn?: string;
  idUnik?: string;
  uid: string;
  phone?: string;
  class?: string;
  address?: string;
  createdAt?: string;
  studentId?: string;
  teacherId?: string;
  namaAyah?: string;
  namaIbu?: string;
  claimVerified?: boolean;
}

const Profile: React.FC<{ onBack: () => void, onLogout: () => void }> = ({ onBack, onLogout }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [myClaims, setMyClaims] = useState<ClaimRequest[]>([]);
  
  // Claim Logic
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimType, setClaimType] = useState<'siswa' | 'guru'>('siswa');
  const [targetId, setTargetId] = useState(''); 
  const [secondaryId, setSecondaryId] = useState(''); 
  const [claiming, setClaiming] = useState(false);

  // Realtime Matching
  const [dbMatch, setDbMatch] = useState<{ found: boolean, data: any | null, checking: boolean }>({ found: false, data: null, checking: false });

  useEffect(() => {
      const minLen = claimType === 'siswa' ? 10 : 8;
      if (targetId.length < minLen) {
          setDbMatch({ found: false, data: null, checking: false });
          return;
      }

      const lookup = async () => {
          setDbMatch(prev => ({ ...prev, checking: true }));
          try {
              if (isMockMode) {
                  await new Promise(r => setTimeout(r, 600));
                  setDbMatch({ found: true, data: { name: 'DATA MASTER DITEMUKAN', idUnik: '999' }, checking: false });
                  return;
              }
              const collection = claimType === 'siswa' ? 'students' : 'teachers';
              const doc = await db!.collection(collection).doc(targetId.trim()).get();
              if (doc.exists && !doc.data()?.isClaimed) {
                  setDbMatch({ found: true, data: doc.data(), checking: false });
              } else {
                  setDbMatch({ found: false, data: null, checking: false });
              }
          } catch (e) {
              setDbMatch({ found: false, data: null, checking: false });
          }
      };

      const timer = setTimeout(lookup, 500);
      return () => clearTimeout(timer);
  }, [targetId, claimType]);

  const getInputClass = (isValid: boolean) => {
    return `w-full bg-slate-50 dark:bg-slate-900 border rounded-2xl py-4 px-6 text-sm font-bold outline-none transition-all duration-300 ${
      isValid 
      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 focus:ring-4 focus:ring-emerald-500/10' 
      : 'border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-indigo-500/10'
    }`;
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    if (isMockMode) {
      setTimeout(() => {
        setProfile({
          uid: 'mock-user-123', displayName: 'User Simulasi', email: 'user@imam.sch.id',
          role: 'Tamu', phone: '081234567890', address: 'Jl. Merdeka, Barabai',
          createdAt: new Date().toISOString(), claimVerified: false
        });
        setLoading(false);
      }, 800);
      return;
    }

    if (auth?.currentUser) {
      const user = auth.currentUser;
      try {
        if (db) {
          const doc = await db.collection('users').doc(user.uid).get();
          if (doc.exists) {
            const data = doc.data();
            const claims = await getMyClaimRequests();
            setMyClaims(claims);
            setProfile({
              uid: user.uid, displayName: data?.displayName || user.displayName || 'Pengguna',
              email: user.email || '', role: data?.role || 'Tamu',
              photoURL: user.photoURL || undefined, claimVerified: data?.claimVerified || false,
              ...data
            } as UserProfile);
          }
        }
      } catch (e) { console.error(e); }
    }
    setLoading(false);
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbMatch.found) return;

    setClaiming(true);
    try {
        const finalSecondaryId = claimType === 'guru' ? cleanAcademicName(secondaryId).toUpperCase() : secondaryId.trim();
        await submitClaimRequest(claimType, targetId.trim(), finalSecondaryId);
        toast.success("Pengajuan terkirim! Admin akan memvalidasi data Anda.");
        setIsClaimModalOpen(false);
        fetchProfile();
    } catch (e: any) {
        toast.error(e.message || "Gagal mengirim pengajuan.");
    } finally { setClaiming(false); }
  };

  const theme = getRoleTheme(profile?.role || 'Tamu');

  function getRoleTheme(role: string) {
    const normalized = String(role || 'Tamu').toUpperCase();
    switch (normalized) {
        case 'ADMIN': return { label: 'Administrator', icon: ShieldCheckIcon, gradient: 'from-rose-500 to-red-600', bgLight: 'bg-rose-50', text: 'text-rose-600' };
        case 'SISWA': return { label: 'Siswa Terverifikasi', icon: AcademicCapIcon, gradient: 'from-teal-400 to-emerald-600', bgLight: 'bg-teal-50', text: 'text-teal-600' };
        case 'GURU': return { label: 'Guru / GTK', icon: BriefcaseIcon, gradient: 'from-indigo-500 to-blue-600', bgLight: 'bg-indigo-50', text: 'text-indigo-600' };
        default: return { label: 'Tamu (Guest)', icon: UserIcon, gradient: 'from-slate-400 to-slate-600', bgLight: 'bg-slate-50', text: 'text-slate-600' };
    }
  }

  return (
    <Layout title="Profil Saya" subtitle="Identitas & Kontrol Akses" icon={UserIcon} onBack={onBack}>
      <div className="p-4 lg:p-8 pb-32 max-w-4xl mx-auto w-full space-y-6">
        {loading ? <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div> : profile && (
          <>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700">
                <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-r ${theme.gradient}`}></div>
                <div className="relative pt-16 px-6 pb-6 flex flex-col md:flex-row items-center md:items-end gap-6">
                    <div className="w-28 h-28 rounded-full p-1 bg-white dark:bg-slate-800 shadow-xl relative -mt-4 overflow-hidden">
                        <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            {profile.photoURL ? <img src={profile.photoURL} className="w-full h-full object-cover" /> : <span className="text-3xl font-black text-slate-300">{profile.displayName[0]}</span>}
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{profile.displayName}</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profile.email}</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${theme.bgLight} ${theme.text}`}>{theme.label}</div>
                </div>
            </div>

            {!profile.claimVerified && (
                <div className="space-y-4">
                    <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><ShieldCheckIcon className="w-32 h-32" /></div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-2 flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-yellow-300" /> Aktifkan Akun Madrasah</h3>
                            <p className="text-xs text-indigo-100 leading-relaxed mb-6 opacity-90">Akun Anda saat ini memiliki akses terbatas. Hubungkan dengan database resmi madrasah untuk membuka seluruh fitur.</p>
                            
                            {myClaims.find(c => c.status === 'pending' || c.status === 'reviewing') ? (
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-3">
                                    <ClockIcon className="w-5 h-5 text-yellow-300 animate-pulse" />
                                    <p className="text-[10px] font-black text-yellow-300 uppercase tracking-widest">Menunggu Validasi Admin...</p>
                                </div>
                            ) : (
                                <button onClick={() => setIsClaimModalOpen(true)} className="px-8 py-3.5 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center gap-3">Mulai Klaim Sekarang <ArrowRightIcon className="w-4 h-4" /></button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Informasi Akun</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <IdentificationIcon className="w-4 h-4 text-slate-400" />
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">ID: {profile.idUnik || '-'}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <MapPinIcon className="w-4 h-4 text-slate-400" />
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{profile.address || 'Alamat belum diatur'}</span>
                        </div>
                    </div>
                </div>
                {profile.claimVerified && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center shadow-sm">
                        <div className="p-3 bg-white rounded-2xl shadow-md mb-3"><QRCodeSVG value={profile.idUnik || '000'} size={90} /></div>
                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">ID Akses: {profile.idUnik}</p>
                    </div>
                )}
            </div>

            <button onClick={onLogout} className="w-full py-4 rounded-2xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-[0.3em] border border-rose-100 active:scale-95 transition-all">Keluar Aplikasi</button>
          </>
        )}

        {/* MODAL KLAIM */}
        {isClaimModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <div className="bg-white dark:bg-[#0B1121] w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-in zoom-in duration-300 border border-white/10 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">Klaim Identitas</h3>
                        <button onClick={() => setIsClaimModalOpen(false)} className="p-2 text-slate-400"><XCircleIcon className="w-8 h-8" /></button>
                    </div>

                    <form onSubmit={handleClaimSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => setClaimType('siswa')} className={`py-4 rounded-2xl border font-black text-[10px] uppercase transition-all ${claimType === 'siswa' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Siswa</button>
                            <button type="button" onClick={() => setClaimType('guru')} className={`py-4 rounded-2xl border font-black text-[10px] uppercase transition-all ${claimType === 'guru' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Guru/Staf</button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-1.5 relative">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{claimType === 'siswa' ? 'Nomor NISN' : 'NIP / NIK Resmi'}</label>
                                <div className="relative">
                                    <input required type="text" value={targetId} onChange={e => setTargetId(e.target.value)} className={getInputClass(dbMatch.found)} placeholder={claimType === 'siswa' ? '10 Digit NISN' : 'Nomor NIP'} />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        {dbMatch.checking && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
                                        {dbMatch.found && <CheckCircleIcon className="w-5 h-5 text-emerald-500" />}
                                    </div>
                                </div>
                                {dbMatch.found && <p className="text-[9px] font-black text-emerald-600 uppercase mt-2 ml-1 flex items-center gap-1.5"><CheckCircleIcon className="w-3 h-3"/> Ditemukan: {dbMatch.data?.namaLengkap || dbMatch.data?.name}</p>}
                            </div>
                            <div className="space-y-1.5 relative">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{claimType === 'siswa' ? 'Siswa ID (Kunci)' : 'Nama Lengkap (Konfirmasi)'}</label>
                                <input required type="text" value={secondaryId} onChange={e => setSecondaryId(e.target.value)} className={getInputClass(secondaryId.length > 3)} placeholder={claimType === 'siswa' ? 'Cek di Rapor' : 'Nama Lengkap Anda'} />
                            </div>
                        </div>

                        <button type="submit" disabled={claiming || !dbMatch.found} className={`w-full py-4.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all ${dbMatch.found ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                            {claiming ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ajukan Klaim Sekarang"}
                        </button>
                    </form>
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;