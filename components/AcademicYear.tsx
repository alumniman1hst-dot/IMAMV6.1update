
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { db, isMockMode } from '../services/firebase';
import { CalendarIcon, CheckCircleIcon, PlusIcon, TrashIcon, Loader2 } from './Icons';
import { toast } from 'sonner';

interface AcademicYearData {
    id: string;
    name: string;
    semester: 'Ganjil' | 'Genap';
    isActive: boolean;
    startDate: string;
    endDate: string;
}

const AcademicYear: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [academicYears, setAcademicYears] = useState<AcademicYearData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchYears = async () => {
    setLoading(true);
    if (isMockMode) {
        setAcademicYears([{ id: '1', name: '2023/2024', semester: 'Genap', isActive: true, startDate: '2024-01-02', endDate: '2024-06-20' }]);
        setLoading(false);
        return;
    }

    if (!db) return;
    try {
        const snapshot = await db.collection('academic_years').orderBy('name', 'desc').get();
        const years = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicYearData));
        setAcademicYears(years);
    } catch (err) {
        toast.error("Gagal memuat tahun ajaran");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const activeYear = academicYears.find(y => y.isActive);

  const handleActivate = async (id: string) => {
      if (isMockMode) return;
      if (!db) return;
      const toastId = toast.loading("Memperbarui status...");
      try {
          const batch = db.batch();
          academicYears.forEach(y => {
              batch.update(db!.collection('academic_years').doc(y.id), { isActive: false });
          });
          batch.update(db.collection('academic_years').doc(id), { isActive: true });
          await batch.commit();
          toast.success("Berhasil diaktifkan", { id: toastId });
          fetchYears();
      } catch (e) { toast.error("Gagal", { id: toastId }); }
  };

  return (
    <Layout title="Tahun Ajaran" subtitle="Manajemen Kalender" icon={CalendarIcon} onBack={onBack}>
      <div className="p-6 pb-24 space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
              <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold mb-3 border border-white/10 uppercase">
                      <CheckCircleIcon className="w-4 h-4 text-green-300" /> Aktif
                  </div>
                  <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-1">Tahun ajaran berjalan</p>
                  <h2 className="text-3xl font-black tracking-tight">{activeYear?.name || "N/A"} <span className="opacity-60 text-xl">{activeYear?.semester}</span></h2>
              </div>
          </div>

          <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Daftar Periode</h3>
              <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                  {loading ? (
                      <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-20" /></div>
                  ) : (
                      <div className="overflow-x-auto">
                        <table className="excel-table">
                            <thead>
                                <tr>
                                    <th>Nama Tahun Ajaran</th>
                                    <th className="text-center">Semester</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-center w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {academicYears.map(year => (
                                    <tr key={year.id}>
                                        <td className="font-bold text-slate-800 dark:text-white">{year.name}</td>
                                        <td className="text-center"><span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600">{year.semester}</span></td>
                                        <td className="text-center">
                                            {year.isActive ? <span className="text-emerald-500 font-bold text-[9px] uppercase">Aktif</span> : <span className="text-slate-400 text-[9px] uppercase">Nonaktif</span>}
                                        </td>
                                        <td className="text-center">
                                            {!year.isActive && <button onClick={() => handleActivate(year.id)} className="text-indigo-600 font-bold text-[9px] uppercase hover:underline">Aktifkan</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </Layout>
  );
};

export default AcademicYear;
