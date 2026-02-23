
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 * Advanced Developer Console v6.7.0 - Production Grade Suite
 */

import React, { useState, useEffect, useMemo } from 'react';
import { db, auth, isMockMode } from '../services/firebase';
import Layout from './Layout';
import { 
  CommandLineIcon, ArrowPathIcon, 
  ShieldCheckIcon, XCircleIcon, Loader2, SparklesIcon,
  SignalIcon, TrashIcon, Search,
  PencilIcon, SaveIcon, PlusIcon,
  CheckCircleIcon, ArrowRightIcon
} from './Icons';
import { toast } from 'sonner';

interface DeveloperConsoleProps {
  onBack: () => void;
}

const DeveloperConsole: React.FC<DeveloperConsoleProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'explorer' | 'terminal'>('explorer');
  const [selectedCollection, setSelectedCollection] = useState<string>('users');
  const [collectionData, setCollectionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Modal & Search States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isClaimMode, setIsClaimMode] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [foundStudents, setFoundStudents] = useState<any[]>([]);
  
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // REGISTRY KOLEKSI LENGKAP
  const collections = [
    'users', 
    'students', 
    'teachers', 
    'attendance', 
    'claim_requests',
    'letters', 
    'journals', 
    'assignments', 
    'discipline_logs', 
    'violations_master',
    'classes', 
    'academic_years',
    'settings',
    'about_content',
    'login_logs',
    'audit_logs' // Arsip aksi sistem
  ];

  const addLog = (msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const prefix = { info: '>>', success: '[OK]', warn: '[!]', error: '[ERR]' }[type];
    setLogs(prev => [`${prefix} ${new Date().toLocaleTimeString()}: ${msg}`, ...prev].slice(0, 30));
  };

  const fetchCollectionData = async (colName: string) => {
    setLoading(true);
    addLog(`Sinkronisasi Koleksi: ${colName.toUpperCase()}`);
    
    if (isMockMode) {
        setTimeout(() => {
            setCollectionData([
                { id: 'mock_1', name: `DATA_${colName}_SIMULASI`, status: 'Active', updated: new Date().toISOString() }
            ]);
            setLoading(false);
        }, 400);
        return;
    }

    if (!db) return;
    try {
        const snap = await db.collection(colName).limit(100).get();
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCollectionData(data);
        addLog(`Koleksi ${colName} dimuat. Total: ${snap.size} Entri`, "success");
    } catch (e: any) {
        addLog(`Gagal memuat ${colName}: ${e.message}`, "error");
        toast.error("Security Rules: Akses ditolak");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectionData(selectedCollection);
  }, [selectedCollection]);

  // --- SAFE UPDATE ENGINE ---
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!db && !isMockMode) throw new Error("Database belum siap");

      const { id, ...dataToSave } = editingDoc || {};
      // Prioritaskan UID untuk tabel users, ID dokumen untuk lainnya
      const finalId = selectedCollection === 'users' ? (dataToSave.uid || id) : id;

      if (!finalId && !isMockMode && id !== undefined) throw new Error("ID Dokumen tidak valid");

      if (isMockMode) {
        await new Promise(r => setTimeout(r, 1000));
        addLog(`MOCK_WRITE: ${selectedCollection}/${finalId || 'new'}`, "success");
        toast.success("Simulasi Simpan Berhasil");
        setIsEditModalOpen(false);
        return;
      }

      // 1. Eksekusi Write ke Firestore
      if (finalId) {
        // Update data yang ada
        await db!.collection(selectedCollection).doc(finalId).set({
          ...dataToSave,
          updatedAt: new Date().toISOString(),
          updatedBy: auth?.currentUser?.uid || "dev_console"
        }, { merge: true });
        addLog(`UPDATED: ${selectedCollection}/${finalId}`, "success");
      } else {
        // Tambah data baru
        const newRef = await db!.collection(selectedCollection).add({
          ...dataToSave,
          createdAt: new Date().toISOString(),
          createdBy: auth?.currentUser?.uid || "dev_console"
        });
        addLog(`INJECTED: ${selectedCollection}/${newRef.id}`, "success");
      }

      // 2. Sinkronisasi Relasi (Users <-> Students)
      if (selectedCollection === 'users' && dataToSave.studentId) {
        await db!.collection('students').doc(dataToSave.studentId).update({
          accountStatus: 'Active',
          linkedUserId: finalId,
          updatedAt: new Date().toISOString()
        });
        addLog(`RELATION_SYNC: Student linked to UID ${finalId}`, "info");
      }

      // 3. Catat ke Audit Log
      await db!.collection('audit_logs').add({
        action: finalId ? 'UPDATE' : 'CREATE',
        collection: selectedCollection,
        docId: finalId || 'new',
        timestamp: new Date().toISOString(),
        actor: auth?.currentUser?.email || 'system_dev'
      });

      toast.success("Database Terupdate");
      setIsEditModalOpen(false);
      fetchCollectionData(selectedCollection);

    } catch (e: any) {
      addLog(`OPERATIONAL_FAILURE: ${e.message}`, "error");
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  // --- SAFE DELETE ENGINE (With Relation Cleanup) ---
  const handleDelete = async (row: any) => {
    if (!window.confirm(`Hapus permanen ${selectedCollection}/${row.id}?\nTindakan ini tidak dapat dibatalkan.`)) return;

    try {
      if (!db && !isMockMode) throw new Error("Database Offline");

      if (isMockMode) {
        await new Promise(r => setTimeout(r, 600));
        addLog(`MOCK_DELETE: ${row.id}`, "warn");
        toast.success("Simulasi Hapus Berhasil");
        setCollectionData(prev => prev.filter(item => item.id !== row.id));
        return;
      }

      // 1. Cleanup Relasi Jika Menghapus User
      if (selectedCollection === 'users' && row.studentId) {
        await db!.collection('students').doc(row.studentId).update({
          accountStatus: 'Unlinked',
          linkedUserId: null,
          updatedAt: new Date().toISOString()
        });
        addLog(`CLEANUP: Student link removed for ${row.studentId}`, "warn");
      }

      // 2. Hapus Dokumen Utama
      await db!.collection(selectedCollection).doc(row.id).delete();
      addLog(`DELETED: ${selectedCollection}/${row.id}`, "warn");

      // 3. Catat ke Audit Log
      await db!.collection('audit_logs').add({
        action: 'DELETE',
        collection: selectedCollection,
        docId: row.id,
        timestamp: new Date().toISOString(),
        actor: auth?.currentUser?.email || 'system_dev'
      });

      toast.success("Data Berhasil Dihapus");
      fetchCollectionData(selectedCollection);

    } catch (e: any) {
      addLog(`DELETE_ERROR: ${e.message}`, "error");
      toast.error(e.message);
    }
  };

  const searchStudentToClaim = async (query: string) => {
      if (query.length < 3) { setFoundStudents([]); return; }
      addLog(`Searching master identity: ${query.toUpperCase()}...`);
      if (isMockMode) {
          setFoundStudents([{ id: 's_01', namaLengkap: 'SIMULASI_USER', nisn: '001', tingkatRombel: 'X' }]);
          return;
      }
      try {
          const snap = await db!.collection('students').where('status', '==', 'Aktif').get();
          const matches = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((s: any) => (s.namaLengkap || '').toLowerCase().includes(query.toLowerCase()) || (s.nisn || '').includes(query));
          setFoundStudents(matches);
      } catch (e) {}
  };

  const selectStudentForClaim = (student: any) => {
      setEditingDoc({
          uid: student.nisn,
          displayName: student.namaLengkap,
          email: `${student.nisn}@madrasah.id`,
          role: 'siswa',
          idUnik: student.idUnik || student.nisn,
          studentId: student.id,
          class: student.tingkatRombel,
          status: 'Active'
      });
      setIsClaimMode(false);
      addLog(`Identitas ${student.namaLengkap} disiapkan.`, "success");
  };

  const handleOpenCreate = () => {
      setIsClaimMode(selectedCollection === 'users');
      setStudentSearchQuery('');
      setFoundStudents([]);
      
      let template: any = {};
      if (selectedCollection === 'users') {
          template = { uid: '', displayName: '', email: '', role: 'siswa', idUnik: '', status: 'Active' };
      } else if (collectionData.length > 0) {
          Object.keys(collectionData[0]).forEach(k => { if (k !== 'id') template[k] = ''; });
      } else {
          template = { name: '', description: '', status: 'Active' };
      }
      
      setEditingDoc(template);
      setIsEditModalOpen(true);
  };

  const tableHeaders = useMemo(() => {
    if (collectionData.length === 0) return ['id'];
    const keys = new Set<string>();
    // Ambil semua keys dari 10 baris pertama untuk memastikan kolom lengkap
    collectionData.slice(0, 10).forEach(item => Object.keys(item).forEach(k => keys.add(k)));
    return Array.from(keys).slice(0, 12); 
  }, [collectionData]);

  return (
    <Layout title="Dev Console" subtitle="v6.7.0 - Root Data Control" icon={CommandLineIcon} onBack={onBack}>
      <div className="p-4 lg:p-8 pb-32 space-y-6 max-w-7xl mx-auto">
        
        {/* HEADER BOARD */}
        <div className="bg-[#0F172A] rounded-[2.5rem] p-6 text-white border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12"><SignalIcon className="w-48 h-48" /></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981]"></div>
                        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-500">Kernel: {isMockMode ? 'MOCK_ENGINE' : 'LIVE_FIRESTORE'}</p>
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                        REGISTRY_{selectedCollection.toUpperCase()}
                    </h2>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleOpenCreate} className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 active:scale-95">
                        <PlusIcon className="w-5 h-5" />
                        New Entry
                    </button>
                    <button onClick={() => fetchCollectionData(selectedCollection)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all active:rotate-180 duration-500">
                        <ArrowPathIcon className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
        </div>

        {/* COLLECTION SELECTOR */}
        <div className="bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[1.8rem] flex overflow-x-auto gap-1 scrollbar-hide border border-slate-200 dark:border-slate-800 shadow-inner">
            {collections.map(col => (
                <button 
                    key={col}
                    onClick={() => setSelectedCollection(col)}
                    className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 ${selectedCollection === col ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-indigo-600'}`}
                >
                    {col.replace('_', ' ')}
                </button>
            ))}
        </div>

        {/* MAIN DATA EXPLORER */}
        <div className="animate-in fade-in duration-700">
            <div className="bg-white dark:bg-[#151E32] rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[400px]">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="excel-table">
                        <thead>
                            <tr>
                                {tableHeaders.map(h => (
                                    <th key={h} className="bg-slate-50 dark:bg-slate-800/80 text-[7.5px] py-3 px-4 font-black uppercase tracking-widest border-r border-slate-100 dark:border-slate-700">
                                        {h}
                                    </th>
                                ))}
                                <th className="text-center w-24 bg-slate-100 dark:bg-slate-800 text-[7.5px] font-black uppercase text-indigo-600">Ops</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={tableHeaders.length + 1} className="py-40 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-500 opacity-20" /></td></tr>
                            ) : collectionData.length > 0 ? (
                                collectionData.map((row, i) => (
                                    <tr key={row.id || i} className="group hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors">
                                        {tableHeaders.map(h => (
                                            <td key={h} className="truncate max-w-[150px] font-mono text-[9px] py-3.5 px-4 text-slate-500 dark:text-slate-400 border-r border-transparent">
                                                {typeof row[h] === 'object' ? '{Object}' : String(row[h] || '-')}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => { setEditingDoc({...row}); setIsEditModalOpen(true); }} className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><PencilIcon className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => handleDelete(row)} className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"><TrashIcon className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={tableHeaders.length + 1} className="py-32 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.5em] italic">No Entries Found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* LOG TERMINAL */}
        <div className="bg-[#020617] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
            <div className="bg-slate-900/50 px-6 py-4 flex items-center justify-between border-b border-white/5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                    Operational Debugger
                </span>
                <button onClick={() => setLogs([])} className="text-[9px] font-black text-indigo-400 uppercase hover:text-white transition-colors">Clear</button>
            </div>
            <div className="h-40 overflow-y-auto p-5 font-mono text-[9px] space-y-1.5 custom-scrollbar bg-black/40">
                {logs.length > 0 ? (
                    logs.map((log, i) => (
                        <p key={i} className={`leading-none ${log.includes('[ERR]') ? 'text-rose-400' : log.includes('[OK]') ? 'text-emerald-400' : log.includes('[!]') ? 'text-amber-400' : 'text-slate-500'}`}>
                            {log}
                        </p>
                    ))
                ) : (
                    <p className="text-slate-800 italic uppercase">Terminal idle...</p>
                )}
            </div>
        </div>

        {/* DATA EDITOR MODAL */}
        {isEditModalOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <div className="bg-white dark:bg-[#0B1121] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in duration-300 flex flex-col max-h-[85vh]">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0B1121]">
                        <div>
                            <h3 className="text-base font-black text-slate-800 dark:text-white uppercase leading-none italic">
                                {isClaimMode ? 'RELATION_INJECT_PROCESS' : editingDoc?.id ? 'SCHEMA_MODIFICATION' : 'NEW_ENTRY_REGISTER'}
                            </h3>
                            <p className="text-[10px] font-bold text-indigo-600 mt-2 uppercase tracking-widest">Target: {selectedCollection}</p>
                        </div>
                        <button onClick={() => setIsEditModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"><XCircleIcon className="w-8 h-8" /></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {isClaimMode ? (
                            <div className="p-8 space-y-6">
                                <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><SparklesIcon className="w-24 h-24"/></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-4">Cari Master Database:</p>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                                        <input type="text" autoFocus value={studentSearchQuery} onChange={(e) => { setStudentSearchQuery(e.target.value); searchStudentToClaim(e.target.value); }} className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder-indigo-300 outline-none focus:bg-white/20 transition-all" placeholder="Nama atau NISN..." />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {foundStudents.map(s => (
                                        <button key={s.id} onClick={() => selectStudentForClaim(s)} className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all">
                                            <div className="text-left">
                                                <h5 className="text-[11px] font-black text-slate-800 dark:text-white uppercase leading-none">{s.namaLengkap}</h5>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">ID: {s.nisn} • Rombel: {s.tingkatRombel}</p>
                                            </div>
                                            <ArrowRightIcon className="w-5 h-5 text-indigo-600 opacity-0 group-hover:opacity-100 transition-all" />
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setIsClaimMode(false)} className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Lewati & Manual Input</button>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdate} className="p-8 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {Object.keys(editingDoc || {}).filter(k => k !== 'id').map(key => (
                                        <div key={key} className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{key}</label>
                                            <input type="text" value={editingDoc[key] || ''} onChange={e => setEditingDoc({...editingDoc, [key]: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-5 text-[11px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-inner" placeholder={`Value for ${key}`} />
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-8 flex gap-4">
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all">Cancel</button>
                                    <button type="submit" disabled={saving} className="flex-[2] bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50">
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <SaveIcon className="w-5 h-5" />}
                                        <span className="text-[10px] uppercase tracking-[0.2em]">{editingDoc?.id ? 'Confirm Modification' : 'Inject Database'}</span>
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        )}

      </div>
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

export default DeveloperConsole;
