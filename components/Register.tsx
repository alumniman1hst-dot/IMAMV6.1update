import React, { useState, useEffect } from 'react';
import { auth, db, isMockMode } from '../services/firebase';
import { 
  ArrowRightIcon, ShieldCheckIcon, AcademicCapIcon, UserIcon, 
  LockIcon, Loader2, SparklesIcon, CalendarIcon, QrCodeIcon, 
  CheckCircleIcon, AppLogo, InfoIcon, XCircleIcon, IdentificationIcon,
  Search, EnvelopeIcon
} from './Icons';
import { UserRole } from '../types';
import { toast } from 'sonner';
import { cleanAcademicName } from '../services/claimService';

interface RegisterProps {
  onLogin: (role: UserRole) => void;
  onLoginClick: () => void;
}

const Register: React.FC<RegisterProps> = ({ onLogin, onLoginClick }) => {
  const [regMode, setRegMode] = useState<'student' | 'staff'>('student');
  const [step, setStep] = useState<1 | 2>(1); 

  const [nisn, setNisn] = useState('');
  const [siswaId, setSiswaId] = useState(''); 
  const [nip, setNip] = useState(''); 
  const [name, setName] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Realtime States
  const [dbMatch, setDbMatch] = useState<{ found: boolean, data: any | null, checking: boolean }>({ found: false, data: null, checking: false });
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation Helpers
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const isPasswordValid = password.length >= 6;
  const isConfirmValid = confirmPassword === password && password !== '';

  // Effect: Realtime DB Lookup
  useEffect(() => {
    const targetId = regMode === 'student' ? nisn.trim() : nip.trim();
    const minLength = regMode === 'student' ? 10 : 8;

    if (targetId.length < minLength) {
        setDbMatch({ found: false, data: null, checking: false });
        return;
    }

    const checkDatabase = async () => {
        setDbMatch(prev => ({ ...prev, checking: true }));
        try {
            if (isMockMode) {
                await new Promise(r => setTimeout(r, 600));
                setDbMatch({ 
                    found: true, 
                    data: regMode === 'student' 
                        ? { namaLengkap: 'SISWA SIMULASI MASTER', idUnik: '1234', isClaimed: false }
                        : { name: 'GURU SIMULASI MASTER', isClaimed: false }, 
                    checking: false 
                });
                return;
            }
            
            const collection = regMode === 'student' ? 'students' : 'teachers';
            const doc = await db!.collection(collection).doc(targetId).get();
            
            if (doc.exists && !doc.data()?.isClaimed) {
                setDbMatch({ found: true, data: doc.data(), checking: false });
            } else {
                setDbMatch({ found: false, data: null, checking: false });
            }
        } catch (e) {
            setDbMatch({ found: false, data: null, checking: false });
        }
    };

    const timeoutId = setTimeout(checkDatabase, 500);
    return () => clearTimeout(timeoutId);
  }, [nisn, nip, regMode]);

  const getInputClass = (isValid: boolean) => {
    return `w-full border rounded-2xl py-4 px-5 text-sm font-bold shadow-inner outline-none transition-all duration-300 ${
      isValid 
      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 focus:ring-4 focus:ring-emerald-500/10' 
      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-indigo-500/5'
    }`;
  };

  const handleVerify = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!dbMatch.found) {
          setError(`Data ${regMode === 'student' ? 'NISN' : 'NIP'} tidak valid.`);
          return;
      }
      
      if (regMode === 'student' && String(dbMatch.data?.idUnik) !== siswaId) {
          setError("Siswa ID tidak cocok.");
          return;
      }

      setVerifiedData({ id: regMode === 'student' ? nisn : nip, ...dbMatch.data });
      setName(dbMatch.data?.namaLengkap || dbMatch.data?.name);
      setStep(2);
      toast.success("Identitas Terverifikasi!");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isConfirmValid) {
        setError('Sandi tidak cocok.');
        setLoading(false);
        return;
    }
    
    const finalRole = regMode === 'student' ? UserRole.SISWA : UserRole.GURU;
    
    try {
        if (isMockMode) {
            await new Promise(r => setTimeout(r, 1000));
            onLogin(finalRole);
            return;
        }

        const userCredential = await auth!.createUserWithEmailAndPassword(email.trim(), password);
        if (userCredential.user) {
            const uid = userCredential.user.uid;
            await userCredential.user.updateProfile({ displayName: name });
            
            const userData: any = {
                uid, displayName: name, email: email.trim(), 
                role: finalRole, 
                createdAt: new Date().toISOString(),
                claimVerified: true
            };

            if (regMode === 'student') {
                userData.studentId = verifiedData.id;
                userData.idUnik = verifiedData.idUnik;
                userData.nisn = verifiedData.nisn;
                userData.class = verifiedData.tingkatRombel;
            } else {
                userData.teacherId = verifiedData.id;
                userData.nip = verifiedData.nip;
            }

            await db!.collection('users').doc(uid).set(userData);
            await db!.collection(regMode === 'student' ? 'students' : 'teachers').doc(verifiedData.id).update({
                isClaimed: true, linkedUserId: uid
            });

            onLogin(finalRole);
            toast.success("Pendaftaran berhasil!");
        }
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f8fafc] dark:bg-[#020617] relative overflow-hidden font-sans">
      <div className="flex-1 flex flex-col justify-center px-6 z-10 relative">
        <div className="w-full max-w-md mx-auto bg-white/95 dark:bg-[#0B1121]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[3rem] p-8 shadow-2xl overflow-hidden">
            
            <div className="mb-8 text-center">
                <AppLogo className="w-16 h-16 mx-auto mb-4" />
                <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Pendaftaran</h1>
                
                <div className="flex justify-center gap-2 mt-6 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl">
                    <button onClick={() => { setRegMode('student'); setStep(1); setDbMatch({found:false,data:null,checking:false}); }} className={`flex-1 text-[10px] font-black px-6 py-3 rounded-xl transition-all uppercase tracking-widest ${regMode === 'student' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-400'}`}>Siswa</button>
                    <button onClick={() => { setRegMode('staff'); setStep(1); setDbMatch({found:false,data:null,checking:false}); }} className={`flex-1 text-[10px] font-black px-6 py-3 rounded-xl transition-all uppercase tracking-widest ${regMode === 'staff' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-400'}`}>Guru/GTK</button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 flex items-start gap-3">
                    <XCircleIcon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold leading-relaxed">{error}</p>
                </div>
            )}

            {step === 1 ? (
                <form onSubmit={handleVerify} className="space-y-5">
                    <div className="space-y-1.5 relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{regMode === 'student' ? 'Nomor NISN' : 'NIP / NIK'}</label>
                        <div className="relative">
                            <input required type="text" value={regMode === 'student' ? nisn : nip} onChange={e => regMode === 'student' ? setNisn(e.target.value) : setNip(e.target.value)} className={getInputClass(dbMatch.found)} placeholder={regMode === 'student' ? '10 Digit NISN' : 'Nomor NIP'} />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                {dbMatch.checking && <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />}
                                {dbMatch.found && <CheckCircleIcon className="w-5 h-5 text-emerald-500 animate-checkmark" />}
                            </div>
                        </div>
                        {dbMatch.found && (
                            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl mt-2 border border-emerald-100 flex items-center gap-3">
                                <UserIcon className="w-4 h-4 text-emerald-600" />
                                <span className="text-[10px] font-black text-emerald-700 uppercase truncate">✓ {dbMatch.data?.namaLengkap || dbMatch.data?.name}</span>
                            </div>
                        )}
                    </div>
                    {regMode === 'student' && (
                        <div className="space-y-1.5 relative">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Siswa ID (Kunci)</label>
                            <input required type="text" value={siswaId} onChange={e => setSiswaId(e.target.value)} className={getInputClass(siswaId.length > 3)} placeholder="ID Lokal di Rapor" />
                        </div>
                    )}
                    <button type="submit" disabled={!dbMatch.found || (regMode === 'student' && siswaId.length < 3)} className={`w-full py-4.5 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all ${dbMatch.found ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                        Lanjutkan Registrasi <ArrowRightIcon className="w-4 h-4" />
                    </button>
                </form>
            ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-3xl border border-emerald-100 flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg"><CheckCircleIcon className="w-6 h-6" /></div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase leading-none mb-1">Terverifikasi</p>
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold truncate">{verifiedData?.namaLengkap || verifiedData?.name}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-1.5 relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email Aktif</label>
                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={getInputClass(isValidEmail(email))} placeholder="email@contoh.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className={getInputClass(isPasswordValid)} placeholder="Sandi" />
                        <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={getInputClass(isConfirmValid && isPasswordValid)} placeholder="Ulang" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-4.5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Selesaikan Pendaftaran"}
                    </button>
                    <button type="button" onClick={() => setStep(1)} className="w-full py-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors mt-2">Ganti Identitas</button>
                </form>
            )}
            
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-slate-500 text-[11px] font-bold">Sudah memiliki akun? <button onClick={onLoginClick} className="text-indigo-600 font-black hover:underline ml-1">Masuk Sekarang</button></p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Register;