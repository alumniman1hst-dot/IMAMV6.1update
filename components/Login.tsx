import React, { useState } from 'react';
import { LockIcon, ArrowRightIcon, Loader2, ShieldCheckIcon, AppLogo, EnvelopeIcon, CheckCircleIcon } from './Icons';
import { UserRole } from '../types';
import { normalizeRole } from '../src/auth/roles';
import { auth, db, isMockMode } from '../services/firebase';
import { toast } from 'sonner';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

type ActivationMode = 'student' | 'teacher';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showActivation, setShowActivation] = useState(false);

  const [activateMode, setActivateMode] = useState<ActivationMode>('student');
  const [activationEmail, setActivationEmail] = useState('');
  const [activationPassword, setActivationPassword] = useState('');
  const [activationConfirmPassword, setActivationConfirmPassword] = useState('');
  const [activationIdUnik, setActivationIdUnik] = useState('');
  const [activationRefId, setActivationRefId] = useState('');
  const [activating, setActivating] = useState(false);
  const [activatedProfile, setActivatedProfile] = useState<any | null>(null);

  const resolveLoginEmail = async (loginInput: string): Promise<string> => {
    if (!db) throw new Error('Layanan database tidak tersedia.');

    if (loginInput.includes('@')) return loginInput.toLowerCase();

    const lookups = [
      db.collection('users').where('nisn', '==', loginInput).limit(1).get(),
      db.collection('users').where('nip', '==', loginInput).limit(1).get(),
      db.collection('users').where('userlogin', '==', loginInput).limit(1).get(),
    ];

    for (const query of lookups) {
      const snap = await query;
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const foundEmail = (data?.email || '').toString().trim().toLowerCase();
        if (foundEmail) return foundEmail;
      }
    }

    throw new Error('Data login tidak ditemukan. Periksa Email / NISN / NIP.');
  };

  const handleLogin = async (e: React.FormEvent, forceMock = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    const u = identifier.trim();
    const p = password.trim();

    if (isMockMode || forceMock) {
      setTimeout(() => {
        const lower = u.toLowerCase();
        const role = lower.includes('admin') ? UserRole.ADMIN : lower.includes('guru') ? UserRole.GURU : UserRole.SISWA;
        onLogin(role);
        toast.success(`Mode Simulasi: Masuk sebagai ${role}`);
        setLoading(false);
      }, 700);
      return;
    }

    try {
      if (!auth || !db) throw new Error('Layanan Firebase tidak dapat dihubungi.');
      const emailToSignIn = await resolveLoginEmail(u);
      const cred = await auth.signInWithEmailAndPassword(emailToSignIn, p);

      const userDoc = await db.collection('users').doc(cred.user.uid).get();
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
        throw new Error('Akun belum aktif. Silakan aktivasi akun.');
      }
      if (!data?.role || role === UserRole.TAMU) {
        await auth.signOut();
        throw new Error('Role akun belum disetel. Hubungi admin.');
      }
      if (!schoolId && role !== UserRole.DEVELOPER) {
        await auth.signOut();
        throw new Error('Akun belum memiliki school_id. Hubungi admin.');
      }

      onLogin(role);
      toast.success(`Selamat datang, ${cred.user.displayName || data?.nama || 'Pengguna'}`);
    } catch (err: any) {
      setError(err.message || 'Identitas atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      if (!auth) throw new Error('Auth tidak tersedia.');
      if (!identifier.trim()) throw new Error('Isi dulu Email / NISN / NIP.');
      const email = await resolveLoginEmail(identifier.trim());
      await auth.sendPasswordResetEmail(email);
      toast.success('Link reset password telah dikirim ke email akun.');
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim reset password.');
    }
  };

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setActivating(true);
    setActivatedProfile(null);

    try {
      if (!auth || !db) throw new Error('Firebase belum siap.');
      if (!activationEmail.includes('@')) throw new Error('Email tidak valid.');
      if (activationPassword.length < 6) throw new Error('Password minimal 6 karakter.');
      if (activationPassword !== activationConfirmPassword) throw new Error('Konfirmasi password tidak cocok.');

      const cred = await auth.createUserWithEmailAndPassword(activationEmail.trim(), activationPassword);
      const uid = cred.user?.uid;
      if (!uid || !cred.user) throw new Error('Gagal membuat akun auth.');

      const collection = activateMode === 'student' ? 'students' : 'teachers';
      const idField = activateMode === 'student' ? 'nisn' : 'nip';
      const roleValue = activateMode === 'student' ? 'SISWA' : 'GURU';

      const snap = await db.collection(collection)
        .where(idField, '==', activationRefId.trim())
        .where('idUnik', '==', activationIdUnik.trim())
        .limit(1)
        .get();

      if (snap.empty) {
        await cred.user.delete();
        throw new Error('Data verifikasi tidak ditemukan (ID Unik + NISN/NIP tidak cocok).');
      }

      const doc = snap.docs[0];
      const person = doc.data() as any;
      if (person?.uidAuth || person?.linkedUserId) {
        await cred.user.delete();
        throw new Error('Data sudah terhubung ke akun lain.');
      }

      await db.collection(collection).doc(doc.id).set({
        email: activationEmail.trim().toLowerCase(),
        password: activationPassword,
        uidAuth: uid,
        linkedUserId: uid,
        role: roleValue,
        roles: [roleValue],
        accountStatus: 'active',
        status: 'active',
      }, { merge: true });

      await db.collection('users').doc(uid).set({
        uid,
        email: activationEmail.trim().toLowerCase(),
        displayName: person?.namaLengkap || person?.name || 'Pengguna',
        name: person?.namaLengkap || person?.name || 'Pengguna',
        role: roleValue,
        roles: [roleValue],
        school_id: person?.school_id || person?.schoolId || '',
        status: 'active',
        loginId: activationRefId.trim(),
        idUnik: activationIdUnik.trim(),
        nisn: activateMode === 'student' ? activationRefId.trim() : undefined,
        nip: activateMode === 'teacher' ? activationRefId.trim() : undefined,
        createdAt: new Date().toISOString(),
      }, { merge: true });

      setActivatedProfile({
        nama: person?.namaLengkap || person?.name || '-',
        idUnik: person?.idUnik || activationIdUnik,
        identitas: activationRefId,
        role: roleValue,
        rombel: person?.tingkatRombel || '-',
        email: activationEmail.trim(),
      });

      setIdentifier(activationEmail.trim());
      setPassword(activationPassword);
      setShowActivation(false);
      toast.success('Aktivasi berhasil. Silakan login.');
    } catch (err: any) {
      setError(err.message || 'Aktivasi gagal.');
      if (auth?.currentUser) await auth.signOut().catch(() => null);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] dark:bg-[#020617] transition-colors duration-500 relative overflow-hidden">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-700 via-blue-600 to-indigo-900 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 text-center max-w-lg">
          <AppLogo className="w-32 h-32 mx-auto mb-8" />
          <h1 className="text-5xl font-black text-white mb-6 leading-tight tracking-tight">IMAM <br />Digital Hub</h1>
          <p className="text-indigo-100 text-lg opacity-80 font-medium">Sistem Terintegrasi MAN 1 Hulu Sungai Tengah.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative h-full overflow-y-auto">
        <div className="w-full max-w-sm z-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Login</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Email / NISN / NIP</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Identifier (Email / NISN / NIP)</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"><EnvelopeIcon className="w-5 h-5" /></div>
                <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white text-sm font-bold shadow-sm" placeholder="Email / NISN / NIP" required />
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"><LockIcon className="w-5 h-5" /></div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white text-sm font-bold shadow-sm" placeholder="••••••••" required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="uppercase tracking-[0.2em] text-xs">Login</span>}
              {!loading && <ArrowRightIcon className="w-5 h-5" />}
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] font-bold">
            <button type="button" onClick={() => setShowActivation((v) => !v)} className="text-indigo-600 hover:underline">
              {showActivation ? 'Tutup Aktivasi Akun' : 'Link Aktivasi Akun'}
            </button>
            <button type="button" onClick={handleForgotPassword} className="text-slate-500 hover:text-indigo-600 hover:underline">
              Lupa Password
            </button>
          </div>

          {showActivation && (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 p-4 bg-white/80 dark:bg-slate-900/50 space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aktivasi Akun</p>
              <form onSubmit={handleActivation} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setActivateMode('student')} className={`py-2 rounded-xl text-[10px] font-black ${activateMode === 'student' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>Siswa</button>
                  <button type="button" onClick={() => setActivateMode('teacher')} className={`py-2 rounded-xl text-[10px] font-black ${activateMode === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>Guru</button>
                </div>

                <input value={activationEmail} onChange={(e) => setActivationEmail(e.target.value)} type="email" placeholder="Email aktivasi" className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800" required />
                <div className="grid grid-cols-2 gap-2">
                  <input value={activationPassword} onChange={(e) => setActivationPassword(e.target.value)} type="password" placeholder="Password" className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800" required />
                  <input value={activationConfirmPassword} onChange={(e) => setActivationConfirmPassword(e.target.value)} type="password" placeholder="Konfirmasi" className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800" required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={activationIdUnik} onChange={(e) => setActivationIdUnik(e.target.value)} type="text" placeholder="ID Unik" className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800" required />
                  <input value={activationRefId} onChange={(e) => setActivationRefId(e.target.value)} type="text" placeholder={activateMode === 'student' ? 'NISN' : 'NIP'} className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800" required />
                </div>

                <button type="submit" disabled={activating} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircleIcon className="w-4 h-4" /> Verifikasi & Aktivasi</>}
                </button>
              </form>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
              <ShieldCheckIcon className="w-4 h-4" /> <span>{error}</span>
            </div>
          )}

          {activatedProfile && (
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 p-3 text-[10px] space-y-1">
              <p className="font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Data Pribadi Ditemukan</p>
              <p><b>Nama:</b> {activatedProfile.nama}</p>
              <p><b>ID Unik:</b> {activatedProfile.idUnik}</p>
              <p><b>{activateMode === 'student' ? 'NISN' : 'NIP'}:</b> {activatedProfile.identitas}</p>
              <p><b>Role:</b> {activatedProfile.role}</p>
              <p><b>Rombel:</b> {activatedProfile.rombel}</p>
              <p><b>Email:</b> {activatedProfile.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
