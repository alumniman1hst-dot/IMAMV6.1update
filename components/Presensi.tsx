
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect, useMemo } from 'react';
import { db, isMockMode } from '../services/firebase';
import { getStudents } from '../services/studentService';
import { Student, ViewState } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
    Loader2, ChevronLeft, ChevronRight, 
    Search, ArrowLeftIcon, 
    CameraIcon, ClockIcon,
    HeartIcon, PrinterIcon
} from './Icons';

interface AttendanceRecord {
    id: string;
    studentId: string;
    studentName: string;
    class: string;
    date: string;
    status: 'Hadir' | 'Terlambat' | 'Sakit' | 'Izin' | 'Alpha' | 'Haid';
    checkIn: string | null;
    checkOut: string | null;
    duha: string | null;
    zuhur: string | null;
    ashar: string | null;
}

const Presensi: React.FC<{ onBack: () => void, onNavigate: (v: ViewState) => void }> = ({ onBack, onNavigate }) => {
  const [date, setDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [attendanceSnapshot, setAttendanceSnapshot] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHaidMode, setIsHaidMode] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            const dateStr = format(date, "yyyy-MM-dd");
            
            // OPTIMASI KUOTA: Ambil siswa dari service yang memiliki CACHE
            const studentData = await getStudents();
            setAllStudents(studentData.filter(s => s.status === 'Aktif'));

            if (!isMockMode && db) {
                // onSnapshot hanya digunakan pada data kehadiran hari yang dipilih saja
                const unsubAtt = db.collection("attendance").where("date", "==", dateStr).onSnapshot(s => {
                    setAttendanceSnapshot(s.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord)));
                    setLoading(false);
                }, () => setLoading(false));
                return () => unsubAtt();
            } else {
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };
    loadData();
  }, [date]);

  const displayData = useMemo(() => {
    const q = searchTerm.toLowerCase();
    const filtered = allStudents.filter(s => String(s.namaLengkap).toLowerCase().includes(q));
    const attMap = new Map(attendanceSnapshot.map(r => [r.studentId, r]));
    return filtered.map(s => attMap.get(s.id!) || {
        id: `${s.id}_${format(date, "yyyy-MM-dd")}`,
        studentId: s.id!, studentName: s.namaLengkap, class: s.tingkatRombel, status: 'Alpha',
        checkIn: null, checkOut: null, duha: null, zuhur: null, ashar: null
    } as any);
  }, [allStudents, attendanceSnapshot, searchTerm, date]);

  const formatTime = (time: string | null) => {
      if (!time) return '-';
      if (time.endsWith(' H')) return time;
      if (time.startsWith('Haid')) return 'Haid';
      return time.substring(0, 5);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#020617] overflow-hidden">
      <div className="bg-white/80 dark:bg-[#0B1121]/90 backdrop-blur-xl px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 safe-pt z-40">
          <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700"><ArrowLeftIcon className="w-5 h-5" /></button>
              <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-[10.5px] leading-none uppercase tracking-widest">Presensi harian</h2>
                  <p className="text-[10px] font-medium text-indigo-600 mt-1.5">Spreadsheet View</p>
              </div>
          </div>
          <div className="flex gap-2">
              <button className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl"><PrinterIcon className="w-5 h-5" /></button>
              <button onClick={() => onNavigate(ViewState.SCANNER)} className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg"><CameraIcon className="w-5 h-5" /></button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 lg:p-6 space-y-6 pb-32">
              <div className="bg-white dark:bg-[#151E32] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl shadow-inner">
                      <button onClick={() => setDate(new Date(date.getTime() - 86400000))} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronLeft className="w-4 h-4 text-slate-400"/></button>
                      <div className="px-2 text-center min-w-[100px]">
                          <h3 className="text-[10.5px] font-bold text-slate-800 dark:text-white">{format(date, "dd MMM yyyy")}</h3>
                      </div>
                      <button onClick={() => setDate(new Date(date.getTime() + 86400000))} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronRight className="w-4 h-4 text-slate-400"/></button>
                  </div>
                  <div className="relative flex-1 group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                          type="text" placeholder="Filter nama siswa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                          className="w-full pl-11 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-[10.5px] font-medium focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
                      />
                  </div>
                  <button onClick={() => setIsHaidMode(!isHaidMode)} className={`px-5 py-3 rounded-xl text-[10.5px] font-bold border transition-all ${isHaidMode ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400'}`}>
                      <HeartIcon className="w-4 h-4 inline-block mr-2" /> Quick haid
                  </button>
              </div>

              <div className="bg-white dark:bg-[#151E32] rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                  <div className="overflow-x-auto custom-scrollbar">
                      <table className="excel-table">
                          <thead>
                              <tr>
                                  <th className="text-center w-10">No</th>
                                  <th>Nama lengkap</th>
                                  <th className="text-center">Kelas</th>
                                  <th className="text-center">Masuk</th>
                                  <th className="text-center">Duha</th>
                                  <th className="text-center">Pulang</th>
                                  <th className="text-center w-20">Status</th>
                              </tr>
                          </thead>
                          <tbody>
                              {loading ? (
                                  <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-20" /></td></tr>
                              ) : displayData.length > 0 ? (
                                  displayData.map((r, i) => (
                                      <tr key={r.id}>
                                          <td className="text-center font-mono text-slate-400">{i + 1}</td>
                                          <td className="font-bold capitalize">{r.studentName}</td>
                                          <td className="text-center font-medium text-slate-500">{r.class}</td>
                                          <td className="text-center font-mono">{formatTime(r.checkIn)}</td>
                                          <td className="text-center font-mono">{formatTime(r.duha)}</td>
                                          <td className="text-center font-mono">{formatTime(r.checkOut)}</td>
                                          <td className="text-center">
                                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${r.status === 'Alpha' ? 'bg-red-50 text-red-600' : r.status === 'Haid' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                  {r.status}
                                              </span>
                                          </td>
                                      </tr>
                                  ))
                              ) : (
                                  <tr><td colSpan={7} className="py-20 text-center text-slate-400 font-medium">Tidak ada data siswa untuk ditampilkan</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Total: {displayData.length} records</span>
                      <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Cache Sync Active</span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}

export default Presensi;
