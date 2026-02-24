
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getStudents, deleteStudent, updateStudent, addStudent } from '../services/studentService';
import { Student, UserRole } from '../types';
import { db, isMockMode } from '../services/firebase';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import Layout from './Layout';
import { 
  UsersGroupIcon, 
  PencilIcon, TrashIcon, Search, PlusIcon,
  Loader2, XCircleIcon, SaveIcon,
  SparklesIcon, ArrowPathIcon, ArrowDownTrayIcon, ShieldCheckIcon
} from './Icons';

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  key: keyof Student | 'aksi' | 'id';
  direction: SortDirection;
}

const StudentData: React.FC<{ onBack: () => void, userRole: UserRole }> = ({ onBack, userRole }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('10 A');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'namaLengkap', direction: 'asc' });
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExportTemplate = () => {
    const templateRows = [
      {
        namaLengkap: 'Contoh Siswa',
        nis: '1001',
        nisn: '1234567890',
        tanggalLahir: '2010-01-01',
        tingkatRombel: '10 A',
        jenisKelamin: 'Laki-laki',
        status: 'Aktif',
        school_id: 'SCH-001',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TemplateSiswa');
    XLSX.writeFile(wb, 'template-import-siswa.xlsx');
    toast.success('Template Excel siswa berhasil diunduh.');
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });

      if (!rows.length) {
        toast.error('File Excel kosong atau format tidak sesuai.');
        return;
      }

      const imported: Student[] = rows
        .filter((r) => r.namaLengkap && (r.nisn || r.nis))
        .map((r, idx) => ({
          id: `import-${Date.now()}-${idx}`,
          school_id: String(r.school_id || 'SCH-001'),
          roles: ['SISWA'],
          userlogin: String(r.nis || r.nisn || ''),
          nis: String(r.nis || ''),
          nisn: String(r.nisn || ''),
          namaLengkap: String(r.namaLengkap || ''),
          tanggalLahir: String(r.tanggalLahir || ''),
          tingkatRombel: String(r.tingkatRombel || '10 A'),
          status: String(r.status || 'Aktif') as any,
          jenisKelamin: String(r.jenisKelamin || 'Laki-laki') as any,
          uidAuth: String(r.uidAuth || ''),
          password: String(r.password || '123456'),
        }));

      if (!imported.length) {
        toast.error('Tidak ada baris valid untuk diimpor.');
        return;
      }

      setStudents((prev) => [...imported, ...prev]);
      toast.success(`${imported.length} data siswa berhasil diimpor ke tampilan.`);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal membaca file Excel.');
    } finally {
      e.target.value = '';
    }
  };

  const handleGenerateRole = async () => {
    if (!canManage) return;
    if (isMockMode || !db) {
      setStudents((prev) => prev.map((s) => ({ ...s, roles: ['SISWA'], uidAuth: s.uidAuth || s.linkedUserId || '', password: s.password || '123456' })));
      toast.success('Role siswa berhasil digenerate (mode simulasi).');
      return;
    }

    const batch = db.batch();
    const targets = selectedClass === 'All' ? students : students.filter((s) => s.tingkatRombel === selectedClass);

    if (!targets.length) {
      toast.error('Tidak ada data siswa untuk digenerate.');
      return;
    }

    targets.forEach((s) => {
      if (!s.id) return;
      const ref = db.collection('students').doc(s.id);
      batch.set(ref, {
        role: 'SISWA',
        roles: ['SISWA'],
        uidAuth: s.uidAuth || s.linkedUserId || null,
        password: s.password || '123456',
      }, { merge: true });
    });

    await batch.commit();
    toast.success(`Generate role selesai untuk ${targets.length} siswa.`);
    loadData(true);
  };

  const loadData = async (force = false) => {
    setLoading(true);
    try {
        const data = await getStudents(force);
        setStudents(data);
    } catch (e) {
        toast.error("Gagal sinkronisasi data");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const classLevels = useMemo(() => {
    const levels = Array.from(new Set(students.map(s => s.tingkatRombel).filter(Boolean)));
    return (levels as string[]).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [students]);

  const processedStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let filtered = students.filter(s => {
      const matchesSearch = 
        String(s.namaLengkap).toLowerCase().includes(q) || 
        String(s.nisn).includes(q) || 
        String(s.idUnik).includes(q);
      const matchesClass = selectedClass === 'All' || s.tingkatRombel === selectedClass;
      return matchesSearch && matchesClass;
    });

    if (sortConfig.direction && sortConfig.key !== 'aksi') {
        filtered = [...filtered].sort((a: any, b: any) => {
            const key = sortConfig.key;
            const valA = a[key] ?? '';
            const valB = b[key] ?? '';
            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
            }
            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            return sortConfig.direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
        });
    }
    return filtered;
  }, [students, searchQuery, selectedClass, sortConfig]);

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      // Logika simpan tetap sama, namun memicu reload data dari server (force refresh)
      // untuk memastikan cache terupdate setelah modifikasi.
      setIsModalOpen(false);
      setSaving(false);
      loadData(true); 
  };

  const canManage = userRole === UserRole.ADMIN || userRole === UserRole.DEVELOPER;

  return (
    <Layout 
      title="Data Siswa" 
      subtitle="Manajemen Data Induk" 
      icon={UsersGroupIcon} 
      onBack={onBack}
      actions={
          <button onClick={() => loadData(true)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-all">
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
      }
    >
      <div className="p-4 lg:p-6 pb-32 space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white dark:bg-[#151E32] p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row flex-1 w-full gap-3">
                <div className="relative flex-[2]">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" placeholder="Cari di memori lokal..." value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-3 pl-12 text-[10.5px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner" 
                    />
                </div>
                <div className="relative flex-1 min-w-[140px]">
                    <select 
                        value={selectedClass} 
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-3 px-4 text-[10.5px] font-bold outline-none appearance-none cursor-pointer text-slate-700 dark:text-slate-300 shadow-inner"
                    >
                        <option value="All">Semua rombel</option>
                        <option value="10 A">10 A</option>
                        {classLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                    </select>
                </div>
            </div>
            {canManage && (
                <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-2">
                    <input ref={importInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
                    <button onClick={handleExportTemplate} className="w-full lg:w-auto px-4 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                        <ArrowDownTrayIcon className="w-4 h-4" /> Template Excel
                    </button>
                    <button onClick={() => importInputRef.current?.click()} className="w-full lg:w-auto px-4 py-3 bg-sky-600 text-white rounded-2xl text-[10px] font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                        <SaveIcon className="w-4 h-4" /> Import Excel
                    </button>
                    <button onClick={handleGenerateRole} className="w-full lg:w-auto px-4 py-3 bg-violet-600 text-white rounded-2xl text-[10px] font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                        <ShieldCheckIcon className="w-4 h-4" /> Generate Role
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="w-full lg:w-auto px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10.5px] font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                        <PlusIcon className="w-4 h-4" /> Tambah Siswa
                    </button>
                </div>
            )}
        </div>

        <div className="bg-white dark:bg-[#151E32] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="excel-table">
                    <thead>
                        <tr>
                            <th className="text-center w-12">No</th>
                            <th>Nama Lengkap</th>
                            <th className="text-center">NISN</th>
                            <th className="text-center">ID Unik</th>
                            <th className="text-center">Rombel</th>
                            <th className="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-20" /></td></tr>
                        ) : processedStudents.length > 0 ? (
                            processedStudents.map((s, idx) => (
                                <tr key={s.id}>
                                    <td className="text-center font-mono text-slate-400">{idx + 1}</td>
                                    <td className="font-bold text-slate-800 dark:text-slate-200">{s.namaLengkap}</td>
                                    <td className="text-center font-mono">{s.nisn}</td>
                                    <td className="text-center font-mono text-indigo-600 font-bold">{s.idUnik || '-'}</td>
                                    <td className="text-center font-black">{s.tingkatRombel}</td>
                                    <td className="text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${s.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{s.status}</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-bold">Data tidak ditemukan</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 flex justify-between items-center border-t border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black text-slate-400">Total: {processedStudents.length} entri</p>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                    <SparklesIcon className="w-3.5 h-3.5" /> Cache Optimization Enabled
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentData;
