import React, { useState } from 'react';
import { auth, db, isMockMode } from '../services/firebase';
import {
  ArrowRightIcon,
  UserIcon,
  LockIcon,
  Loader2,
  CheckCircleIcon,
  AppLogo,
  XCircleIcon,
} from './Icons';
import { UserRole } from '../types';
import { toast } from 'sonner';

interface RegisterProps {
  onLogin: (role: UserRole) => void;
  onLoginClick: () => void;
}

const Register: React.FC<RegisterProps> = ({ onLogin, onLoginClick }) => {
  const [regMode, setRegMode] = useState<'student' | 'staff'>('student');
  const [step, setStep] = useState<1 | 2>(1);

  // Identity fields
  const [nis, setNis] = useState('');
  const [nisn, setNisn] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [nip, setNip] = useState('');

  // Account fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const isPasswordValid = password.length >= 6;
  const isConfirmValid = confirmPassword === password && password !== '';

  const getInputClass = (isValid: boolean) => {
    return `w-full border rounded-2xl py-4 px-5 text-sm font-bold shadow-inner outline-none transition-all duration-300 ${
      isValid
        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 focus:ring-4 focus:ring-emerald-500/10'
        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-indigo-500/5'
    }`;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setChecking(true);

    try {
      if (isMockMode) {
        const mock =
          regMode === 'student'
            ? {
                id: 'student-mock-1',
                namaLengkap: 'SISWA SIMULASI MASTER',
                nis,
                nisn,
                tanggalLahir,
                school_id: 'SIM-SCHOOL',
                accountStatus: 'unclaimed',
              }
            : {
                id: nip,
                name: 'GURU SIMULASI MASTER',
                nip,
                school_id: 'SIM-SCHOOL',
              };
        setVerifiedData(mock);
        setName(mock.namaLengkap || mock.name);
        setStep(2);
        toast.success('Identitas Terverifikasi!');
        return;
      }

      if (!db) throw new Error('Database tidak tersedia.');

      if (regMode === 'student') {
        const snap = await db
          .collection('students')
          .where('nis', '==', nis.trim())
          .where('nisn', '==', nisn.trim())
          .where('tanggalLahir', '==', tanggalLahir)
          .limit(1)
          .get();

        if (snap.empty) {
          throw new Error('Data tidak cocok dengan database sekolah.');
        }

        const doc = snap.docs[0];
        const data = doc.data() as any;

        if (data?.linkedUserId) {
          throw new Error('Akun siswa sudah pernah diklaim.');
        }

        if (data?.accountStatus === 'active' || data?.isClaimed) {
          throw new Error('Akun siswa sudah aktif.');
        }

        const payload = {
          id: doc.id,
          ...data,
          nis: nis.trim(),
          nisn: nisn.trim(),
          tanggalLahir,
        };

        setVerifiedData(payload);
        setName(data?.namaLengkap || 'Siswa');
      } else {
        const teacherDoc = await db.collection('teachers').doc(nip.trim()).get();
        if (!teacherDoc.exists) {
          throw new Error('Data NIP tidak ditemukan.');
        }

        const data = teacherDoc.data() as any;
        if (data?.linkedUserId || data?.isClaimed) {
          throw new Error('Akun guru sudah pernah diklaim.');
        }

        const payload = { id: teacherDoc.id, ...data, nip: nip.trim() };
        setVerifiedData(payload);
        setName(data?.name || 'Guru');
      }

      setStep(2);
      toast.success('Identitas Terverifikasi!');
    } catch (err: any) {
      setError(err.message || 'Verifikasi gagal.');
    } finally {
      setChecking(false);
    }
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
        await new Promise((r) => setTimeout(r, 1000));
        onLogin(finalRole);
        return;
      }

      if (!auth || !db) throw new Error('Layanan auth/database tidak tersedia.');

      const userCredential = await auth.createUserWithEmailAndPassword(email.trim(), password);
      if (!userCredential.user) throw new Error('Gagal membuat akun.');

      const uid = userCredential.user.uid;
      await userCredential.user.updateProfile({ displayName: name });
      await userCredential.user.sendEmailVerification().catch(() => {
        console.warn('Email verification gagal dikirim.');
      });

      if (regMode === 'student') {
        const schoolId = verifiedData?.school_id || verifiedData?.schoolId;
        if (!schoolId) throw new Error('Data siswa belum memiliki school_id. Hubungi admin.');

        await db.collection('students').doc(verifiedData.id).update({
          linkedUserId: uid,
          accountStatus: 'active',
          userlogin: nis.trim(),
          isClaimed: true,
          roles: ['SISWA'],
        });

        await db.collection('users').doc(uid).set({
          uid,
          name: verifiedData?.namaLengkap || name,
          displayName: verifiedData?.namaLengkap || name,
          email: email.trim(),
          role: 'SISWA',
          roles: ['SISWA'],
          school_id: schoolId,
          status: 'active',
          loginId: nis.trim(),
          studentId: verifiedData.id,
          nis: nis.trim(),
          nisn: nisn.trim(),
          tanggalLahir,
          createdAt: new Date().toISOString(),
          claimVerified: true,
        });
      } else {
        const schoolId = verifiedData?.school_id || verifiedData?.schoolId;
        if (!schoolId) throw new Error('Data guru belum memiliki school_id. Hubungi admin.');

        await db.collection('teachers').doc(verifiedData.id).update({
          linkedUserId: uid,
          isClaimed: true,
        });

        await db.collection('users').doc(uid).set({
          uid,
          name: verifiedData?.name || name,
          displayName: verifiedData?.name || name,
          email: email.trim(),
          role: 'GURU',
          roles: ['GURU'],
          school_id: schoolId,
          status: 'active',
          loginId: nip.trim(),
          teacherId: verifiedData.id,
          nip: nip.trim(),
          createdAt: new Date().toISOString(),
          claimVerified: true,
        });
      }

      onLogin(finalRole);
      toast.success('Pendaftaran berhasil! Silakan verifikasi email Anda.');
    } catch (err: any) {
      setError(err.message || 'Pendaftaran gagal.');
      if (auth?.currentUser) {
        await auth.signOut().catch(() => null);
      }
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
              <button onClick={() => { setRegMode('student'); setStep(1); setError(null); }} className={`flex-1 text-[10px] font-black px-6 py-3 rounded-xl transition-all uppercase tracking-widest ${regMode === 'student' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-400'}`}>Siswa</button>
              <button onClick={() => { setRegMode('staff'); setStep(1); setError(null); }} className={`flex-1 text-[10px] font-black px-6 py-3 rounded-xl transition-all uppercase tracking-widest ${regMode === 'staff' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-400'}`}>Guru/GTK</button>
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
              {regMode === 'student' ? (
                <>
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIS Lokal</label>
                    <input required type="text" value={nis} onChange={(e) => setNis(e.target.value)} className={getInputClass(nis.trim().length >= 3)} placeholder="NIS Lokal" />
                  </div>
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor NISN</label>
                    <input required type="text" value={nisn} onChange={(e) => setNisn(e.target.value)} className={getInputClass(nisn.trim().length >= 10)} placeholder="10 Digit NISN" />
                  </div>
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Lahir</label>
                    <input required type="date" value={tanggalLahir} onChange={(e) => setTanggalLahir(e.target.value)} className={getInputClass(!!tanggalLahir)} />
                  </div>
                </>
              ) : (
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIP / NIK</label>
                  <input required type="text" value={nip} onChange={(e) => setNip(e.target.value)} className={getInputClass(nip.trim().length >= 8)} placeholder="Nomor NIP" />
                </div>
              )}

              <button type="submit" disabled={checking} className="w-full py-4.5 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all bg-indigo-600 text-white shadow-indigo-500/20">
                {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verifikasi Data <ArrowRightIcon className="w-4 h-4" /></>}
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Selesaikan Pendaftaran'}
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
