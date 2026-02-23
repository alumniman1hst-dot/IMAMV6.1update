
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect, useMemo } from 'react';
import Layout from './Layout';
import { db, auth, isMockMode } from '../services/firebase';
import { 
  ClockIcon, Search, Loader2, ShieldCheckIcon, CalendarIcon, BuildingLibraryIcon, ChevronDownIcon, ArrowPathIcon
} from './Icons';
import { format } from 'date-fns';
import { ViewState, AttendanceStatus, UserRole } from '../types';

interface AttendanceHistoryProps {
  onBack: () => void;
  onNavigate: (view: ViewState) => void;
  userRole: UserRole;
}

interface AttendanceRecord {
    id: string;
    studentId: string;
    studentName: string;
    class: string;
    date: string;
    status: AttendanceStatus;
    checkIn: string | null;
    checkOut: string | null;
    duha: string | null;
    zuhur: string | null;
    ashar: string | null;
}

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ onBack, userRole }) => {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isStudent = userRole === UserRole.SISWA;

  useEffect(() => {
    if (isMockMode) { 
        setClasses(['X IPA 1', 'XI IPS 1', 'XII AGAMA']); 
    } else if (db) { 
        db.collection('classes').get().then(s => setClasses(s.docs.map(d => d.data().name).sort())); 
    }
  }, []);

  const loadAttendance = async () => {
    setLoading(true);
    if (isMockMode) {
        setTimeout(() => {
            setRecords([{ id: 'r1', studentName: 'Adelia Sri Sundari', class: 'X IPA 1', date: selectedDate, status: 'Hadir', checkIn: '07:15', checkOut: '16:00' } as any]);
            setLoading(false);
        }, 500);
        return;
    }
    if (!db || !auth.currentUser) return;

    try {
        // OPTIMASI: Gunakan .limit(50) untuk penghematan kouta
        let query = db.collection('attendance')
            .where('date', '==', selectedDate)
            .limit(50);
            
        if (isStudent) query = query.where('studentId', '==', auth.currentUser.uid);
        else if (selectedClass !== 'All') query = query.where('class', '==', selectedClass);
        
        const snap = await query.get();
        setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedDate, selectedClass]);

  const filteredRecords = useMemo(() => {
      const q = searchQuery.toLowerCase().trim();
      return records.filter(r => String(r.studentName).toLowerCase().includes(q));
  }, [records, searchQuery]);

  return (
    <Layout 
        title="Riwayat Absensi" 
        subtitle="Log Kehadiran" 
        icon={ClockIcon} 
        onBack={onBack}
        actions={
            <button onClick={loadAttendance} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        }
    >
      <div className="p-4 lg:p-8 pb-32 space-y-5 max-w-6xl mx-auto">
        <div className="bg-white dark:bg-[#151E32] p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="grid grid-cols-2 gap-3 flex-1">
                <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10.5px] font-bold outline-none" />
                </div>
                {!isStudent && (
                    <div className="relative">
                        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full pl-4 pr-8 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10.5px] font-bold outline-none appearance-none cursor-pointer">
                            <option value="All">Semua kelas</option>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                )}
            </div>
            <div className="relative flex-[1.5]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Filter hasil..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-11 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-[10.5px] font-medium outline-none shadow-inner" />
            </div>
        </div>

        <div className="bg-white dark:bg-[#151E32] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="excel-table">
                    <thead>
                        <tr>
                            <th className="text-center w-10">No</th>
                            <th>Nama Siswa</th>
                            <th className="text-center">Masuk</th>
                            <th className="text-center">Pulang</th>
                            <th className="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-20" /></td></tr>
                        ) : filteredRecords.length > 0 ? (
                            filteredRecords.map((r, i) => (
                                <tr key={r.id}>
                                    <td className="text-center font-mono text-slate-400">{i + 1}</td>
                                    <td className="font-bold text-slate-800 dark:text-slate-200 uppercase">{r.studentName}</td>
                                    <td className="text-center font-mono">{r.checkIn ? r.checkIn.substring(0,5) : '-'}</td>
                                    <td className="text-center font-mono">{r.checkOut ? r.checkOut.substring(0,5) : '-'}</td>
                                    <td className="text-center">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${r.status === 'Alpha' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{r.status}</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-medium">Log tidak ditemukan (Limit 50)</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceHistory;
