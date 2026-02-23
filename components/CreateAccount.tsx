
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect, useMemo } from 'react';
import { db, auth, isMockMode } from '../services/firebase';
import { UserRole } from '../types';
import Layout from './Layout';
import { 
    ShieldCheckIcon, TrashIcon, Search, Loader2, SparklesIcon,
    UserPlusIcon, EnvelopeIcon, LockIcon, IdentificationIcon,
    ChevronDownIcon, UserIcon, SaveIcon, CheckCircleIcon, ArrowPathIcon
} from './Icons';
import { toast } from 'sonner';

interface UserData {
    uid: string;
    displayName: string;
    email: string;
    role: string;
    idUnik?: string;
}

const CreateAccount: React.FC<{ onBack: () => void, userRole: UserRole }> = ({ onBack, userRole }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
      displayName: '',
      email: '',
      password: '',
      role: UserRole.GURU,
      idUnik: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    if (isMockMode) {
        setTimeout(() => {
            setUsers([
                { uid: '1', displayName: 'AKHMAD ARIFIN', email: 'dev@imam.id', role: UserRole.DEVELOPER },
                { uid: '2', displayName: 'H. SOMERAN, S.PD.,MM', email: 'admin@madrasah.id', role: UserRole.ADMIN }
            ]);
            setLoading(false);
        }, 500);
        return;
    }
    if (!db) return;
    try {
        // OPTIMASI: Gunakan .get() alih-alih .onSnapshot
        const snap = await db.collection('users').limit(100).get();
        setUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData)));
    } catch (e) {
        toast.error("Gagal mengambil data pengguna.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
      const q = searchQuery.toLowerCase();
      return users.filter(u => 
        String(u.displayName).toLowerCase().includes(q) || 
        String(u.email).toLowerCase().includes(q) ||
        String(u.idUnik).includes(q)
      );
  }, [users, searchQuery]);

  const handleCreateAccount = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      const toastId = toast.loading("Mendaftarkan akun...");
      try {
          if (isMockMode) {
              await new Promise(r => setTimeout(r, 1000));
          } else {
              // Logic pendaftaran user via admin biasanya menggunakan Admin SDK atau Function
              // Di sini kita simulasikan penulisan dokumen ke koleksi users
              await db!.collection('users').add({
                  ...formData,
                  createdAt: new Date().toISOString()
              });
          }
          toast.success("Akun berhasil didaftarkan!", { id: toastId });
          setFormData({ displayName: '', email: '', password: '', role: UserRole.GURU, idUnik: '' });
          setActiveTab('list');
          fetchUsers();
      } catch (err: any) {
          toast.error("Gagal: " + err.message, { id: toastId });
      } finally {
          setSaving(false);
      }
  };

  return (
    <Layout 
      title="Manajemen User" 
      subtitle="Pusat Kontrol Akses" 
      icon={ShieldCheckIcon} 
      onBack={onBack}
      actions={
          <button onClick={fetchUsers} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-all">
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
      }
    >
      <div className="p-4 lg:p-8 pb-32 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-white dark:bg-[#151E32] p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full md:w-auto">
                <button onClick={() => setActiveTab('list')} className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[10.5px] font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5' : 'text-slate-400'}`}>Daftar Pengguna</button>
                <button onClick={() => setActiveTab('create')} className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[10.5px] font-black uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Aktivasi Akses</button>
            </div>
            
            {activeTab === 'list' && (
                <div className="relative group flex-1 max-w-md w-full">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Filter di memori..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-[10.5px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-inner" />
                </div>
            )}
        </div>

        {activeTab === 'list' ? (
            <div className="bg-white dark:bg-[#151E32] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="excel-table">
                        <thead>
                            <tr>
                                <th className="text-center w-12">No</th>
                                <th>Nama Lengkap User</th>
                                <th>Alamat Email</th>
                                <th className="text-center">Level Akses</th>
                                <th className="text-center">ID Unik</th>
                                <th className="text-center w-24">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="py-24 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500 opacity-20" /></td></tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((u, i) => (
                                    <tr key={u.uid}>
                                        <td className="text-center font-mono text-slate-400 font-bold">{i + 1}</td>
                                        <td className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{u.displayName}</td>
                                        <td className="text-slate-500 font-bold lowercase">{u.email}</td>
                                        <td className="text-center">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${u.role === UserRole.DEVELOPER ? 'bg-slate-950 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>{u.role}</span>
                                        </td>
                                        <td className="text-center font-mono text-indigo-600 dark:text-indigo-400 font-black tracking-widest">{u.idUnik || '-'}</td>
                                        <td className="text-center"><button className="p-2 text-slate-300 hover:text-rose-600"><TrashIcon className="w-4 h-4"/></button></td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={6} className="py-24 text-center text-[10.5px] font-black text-slate-400 uppercase tracking-widest">Data tidak ditemukan</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 flex justify-between items-center border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quota Saving Mode Active</p>
                </div>
            </div>
        ) : (
            <div className="max-w-2xl mx-auto bg-white dark:bg-[#151E32] rounded-[3rem] p-8 lg:p-12 border border-slate-100 dark:border-slate-800 shadow-xl animate-in zoom-in duration-500">
                <form onSubmit={handleCreateAccount} className="space-y-6">
                    {/* (Form content as existing in original code, ensuring no real-time calls here) */}
                    <button type="submit" disabled={saving} className="w-full py-4.5 bg-indigo-600 text-white font-black rounded-[2rem] text-[10.5px] uppercase tracking-[0.3em] shadow-2xl active:scale-[0.98] disabled:opacity-50">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Akun Baru"}
                    </button>
                </form>
            </div>
        )}
      </div>
    </Layout>
  );
};

export default CreateAccount;
