
import React, { useState } from 'react';
import { LockIcon, ArrowRightIcon, Loader2, ShieldCheckIcon, AppLogo, EnvelopeIcon, ArrowPathIcon, WifiIcon } from './Icons';
import { UserRole, ViewState } from '../types';
import { normalizeRole } from '../src/auth/roles';
import { auth, db, isMockMode } from '../services/firebase';
import { toast } from 'sonner';

interface LoginProps {
  onLogin: (role: UserRole) => void;
  onNavigateRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigateRegister }) => {
  const [identifier, setIdentifier] = useState('dgt.3652@gmail.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [networkError, setNetworkError] = useState(false);

  const resolveLoginEmail = async (loginInput: string): Promise<string> => {
    if (!db) throw new Error('Layanan database tidak tersedia.');

    if (loginInput.includes('@')) return loginInput.toLowerCase();

    const lookups = [
      db.collection('users').where('nisn', '==', loginInput).limit(1).get(),
      db.collection('users').where('nip', '==', loginInput).limit(1).get(),
      db.collection('users').where('userlogin', '==', loginInput).limit(1).get()
    ];

    for (const query of lookups) {
      const snap = await query;
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const foundEmail = (data?.email || '').toString().trim().toLowerCase();
        if (foundEmail) return foundEmail;
        throw new Error('Akun ditemukan, namun email login belum disetel oleh admin.');
      }
    }

    throw new Error('NISN/NIP tidak ditemukan. Hubungi admin sekolah.');
  };

  const handleLogin = async (e: React.FormEvent, forceMock: boolean = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setNetworkError(false);

    const u = identifier.trim();
    const p = password.trim();

    if (isMockMode || forceMock) {
      if (forceMock) {
        localStorage.setItem('imam_force_mock', 'true');
        toast.info("Mengaktifkan Mode Simulasi...");
        setTimeout(() => window.location.reload(), 800);
        return;
      }
      
      setTimeout(() => {
        const lowerU = u.toLowerCase();
        let detectedRole = UserRole.GURU;
        if (lowerU.includes('admin')) detectedRole = UserRole.ADMIN;
        else if (lowerU.includes('siswa')) detectedRole = UserRole.SISWA;
        else if (lowerU.includes('dev')) detectedRole = UserRole.DEVELOPER;
        else if (lowerU.includes('tamu')) detectedRole = UserRole.TAMU;
        
        onLogin(detectedRole);
        toast.success(`Mode Simulasi: Masuk sebagai ${detectedRole}`);
        setLoading(false);
      }, 1200);
      return;
    }

    try {
        if (!auth || !db) {
           setNetworkError(true);
           throw new Error("Layanan Firebase tidak dapat dihubungi.");
        }
        
        const emailToSignIn = await resolveLoginEmail(u);
        const userCredential = await auth.signInWithEmailAndPassword(emailToSignIn, p);
        const user = userCredential.user;

        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists) {
                await auth.signOut();
                throw new Error('Akun belum terdaftar di sistem sekolah.');
            }

            const data = userDoc.data();
            const role = normalizeRole(data?.role, UserRole.TAMU);
            const schoolId = data?.schoolId || data?.school_id;
            const status = String(data?.status || '').toLowerCase();

            if (status !== 'active') {
                await auth.signOut();
                throw new Error('Akun belum aktif. Selesaikan proses claim/aktivasi terlebih dahulu.');
            }

            if (!data?.role || role === UserRole.TAMU) {
                await auth.signOut();
                throw new Error('Akun belum diaktifkan oleh sekolah (role belum disetel).');
            }

            if (!schoolId && role !== UserRole.DEVELOPER) {
                await auth.signOut();
                throw new Error('Akun belum memiliki school_id. Hubungi admin sekolah.');
            }

            onLogin(role);
            toast.success(`Selamat datang, ${user.displayName || data?.nama || 'Pengguna'}`);
        }
    } catch (err: any) {
        setLoading(false);
        if (err.code === 'auth/network-request-failed') {
            setNetworkError(true);
            setError('Gagal menghubungi server. Periksa internet Anda.');
        } else {
            setError(err.message || 'NISN/NIP/Email atau Password salah.');
        }
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] dark:bg-[#020617] transition-colors duration-500 relative overflow-hidden">
      
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-700 via-blue-600 to-indigo-900 relative items-center justify-center p-12 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="relative z-10 text-center max-w-lg">
              <AppLogo className="w-32 h-32 mx-auto mb-8" />
              <h1 className="text-5xl font-black text-white mb-6 leading-tight tracking-tight">IMAM <br/>Digital Hub</h1>
              <p className="text-indigo-100 text-lg opacity-80 font-medium">Sistem Terintegrasi MAN 1 Hulu Sungai Tengah.</p>
          </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative h-full">
        <div className="w-full max-w-sm z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center lg:text-left">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Masuk Sistem</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Gunakan Akun Anda yang Terdaftar</p>
            </div>

            <form onSubmit={(e) => handleLogin(e)} className="space-y-5">
                <div className="space-y-4">
                    <div className="group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">NISN / NIP / Email</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                                <EnvelopeIcon className="w-5 h-5" />
                            </div>
                            <input 
                                type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white text-sm font-bold shadow-sm"
                                placeholder="NISN / NIP / Email" required
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                                <LockIcon className="w-5 h-5" />
                            </div>
                            <input 
                                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white text-sm font-bold shadow-sm"
                                placeholder="••••••••" required
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                        <ShieldCheckIcon className="w-4 h-4" /> <span>{error}</span>
                    </div>
                )}

                <button 
                    type="submit" disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="uppercase tracking-[0.2em] text-xs">Aktivasi Sesi</span>}
                    {!loading && <ArrowRightIcon className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />}
                </button>
            </form>
            
            <div className="text-center pt-4 space-y-3">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Belum memiliki akun? <button onClick={onNavigateRegister} className="text-indigo-600 dark:text-indigo-400 hover:underline">Daftar Akun Baru (Tamu)</button>
              </p>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">IMAM v6.2 • MADRASAH DIGITAL</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
