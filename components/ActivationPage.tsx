import React, { useState } from 'react';
import { Loader2, CheckCircleIcon, ShieldCheckIcon } from './Icons';
import { auth, db } from '../services/firebase';
import { toast } from 'sonner';

const ActivationPage: React.FC = () => {
  const [activateMode, setActivateMode] = useState<'student' | 'teacher'>('student');
  const [activationEmail, setActivationEmail] = useState('');
  const [activationPassword, setActivationPassword] = useState('');
  const [activationConfirmPassword, setActivationConfirmPassword] = useState('');
  const [activationIdUnik, setActivationIdUnik] = useState('');
  const [activationRefId, setActivationRefId] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');
  const [activatedProfile, setActivatedProfile] = useState<any | null>(null);

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

      toast.success('Aktivasi berhasil. Silakan login.');
    } catch (err: any) {
      setError(err.message || 'Aktivasi gagal.');
      if (auth?.currentUser) await auth.signOut().catch(() => null);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc] dark:bg-[#020617] p-6">
      <div className="w-full max-w-sm space-y-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase text-center mb-4">Aktivasi Akun</h2>
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
  );
};

export default ActivationPage;
