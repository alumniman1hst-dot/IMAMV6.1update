
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 * Reporting Engine v6.3 - Daily, Monthly & Individual Support
 */

import React, { useState, useEffect, useMemo } from 'react';
import Layout from './Layout';
import { 
  ChartBarIcon, Loader2, 
  PrinterIcon, ArrowRightIcon, FileSpreadsheet,
  ArrowLeftIcon, CalendarIcon, BuildingLibraryIcon,
  SparklesIcon, XCircleIcon, ArrowDownTrayIcon,
  UserIcon, CheckCircleIcon, ClockIcon, Search
} from './Icons';
import { db, isMockMode } from '../services/firebase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { id as localeID } from 'date-fns/locale/id'; 
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Student, MadrasahData } from '../types';

type ReportType = 'menu' | 'daily' | 'monthly' | 'individual';

interface AttendanceRecord {
    id?: string;
    studentId: string;
    studentName: string;
    idUnik: string;
    jenisKelamin: string;
    class: string;
    date: string;
    status: string;
    checkIn: string | null;
    duha: string | null;
    zuhur: string | null;
    ashar: string | null;
    checkOut: string | null;
}

const Reports: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [activeReport, setActiveReport] = useState<ReportType>('menu');
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
    const [selectedClass, setSelectedClass] = useState<string>('All');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [studentSearch, setStudentSearch] = useState('');
    
    // Data States
    const [classes, setClasses] = useState<any[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [madrasahInfo, setMadrasahInfo] = useState<MadrasahData | null>(null);

    // PDF Preview
    const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

    useEffect(() => {
        const loadInitial = async () => {
            setLoading(true);
            if (isMockMode) {
                setClasses([{ name: 'X IPA 1' }, { name: 'XII AGAMA' }]);
                setAllStudents([
                    { id: 's1', namaLengkap: 'ADELIA SRI SUNDARI', idUnik: '25002', tingkatRombel: 'X IPA 1', jenisKelamin: 'Perempuan' } as any,
                    { id: 's2', namaLengkap: 'AHMAD MUZAKI', idUnik: '25003', tingkatRombel: 'X IPA 1', jenisKelamin: 'Laki-laki' } as any
                ]);
                setMadrasahInfo({ nama: 'MAN 1 HST', kepalaNama: 'H. Someran, S.Pd.,MM', kepalaNip: '196703021996031001' } as any);
                setLoading(false);
                return;
            }
            if (db) {
                const [classSnap, studentSnap, infoSnap] = await Promise.all([
                    db.collection('classes').get(),
                    db.collection('students').where('status', '==', 'Aktif').get(),
                    db.collection('settings').doc('madrasahInfo').get()
                ]);
                setClasses(classSnap.docs.map(d => d.data()));
                setAllStudents(studentSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
                if (infoSnap.exists) setMadrasahInfo(infoSnap.data() as MadrasahData);
                setLoading(false);
            }
        };
        loadInitial();
    }, []);

    // Fetch data based on report type
    useEffect(() => {
        if (activeReport === 'menu') return;
        const fetchData = async () => {
            setLoading(true);
            try {
                if (isMockMode) {
                    setAttendanceRecords([{ studentId: 's1', studentName: 'ADELIA', status: 'Hadir', date: selectedDate, checkIn: '07:10' } as any]);
                } else if (db) {
                    let query = db.collection('attendance');
                    if (activeReport === 'daily') {
                        query = query.where('date', '==', selectedDate);
                    } else if (activeReport === 'monthly' || activeReport === 'individual') {
                        const start = format(startOfMonth(new Date(selectedMonth)), 'yyyy-MM-dd');
                        const end = format(endOfMonth(new Date(selectedMonth)), 'yyyy-MM-dd');
                        query = query.where('date', '>=', start).where('date', '<=', end);
                    }
                    const snap = await query.get();
                    setAttendanceRecords(snap.docs.map(d => d.data() as AttendanceRecord));
                }
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        fetchData();
    }, [selectedDate, selectedMonth, activeReport]);

    const filteredStudentsForSelection = useMemo(() => {
        const q = studentSearch.toLowerCase();
        return allStudents.filter(s => s.namaLengkap.toLowerCase().includes(q)).slice(0, 5);
    }, [allStudents, studentSearch]);

    // Formatters
    const formatTime = (t: any) => {
        if (!t) return '-';
        const value = String(t);
        if (value.endsWith(' H')) return value;
        return value.substring(0, 5);
    };
    const toTitleCase = (str: string) => str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    // --- PDF ENGINE ---
    const generatePDF = async (download = false) => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'legal' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;

        // Header Logic
        const drawHeader = (title: string, subtitle: string) => {
            doc.setFont("helvetica", "bold"); doc.setFontSize(11);
            doc.text(title, centerX, 10, { align: 'center' });
            doc.setFontSize(9);
            doc.text(madrasahInfo?.nama || "MADRASAH ALIYAH NEGERI 1 HST", centerX, 15, { align: 'center' });
            doc.setLineWidth(0.3); doc.line(10, 17, pageWidth - 10, 17);
            doc.setFont("helvetica", "normal"); doc.setFontSize(8);
            doc.text(subtitle, 10, 22);
        };

        if (activeReport === 'daily') {
            const clsList = selectedClass === 'All' ? classes.map(c => c.name) : [selectedClass];
            clsList.forEach((clsName, idx) => {
                if (idx > 0) doc.addPage();
                drawHeader(`LAPORAN HARIAN KEHADIRAN SISWA`, `Tanggal: ${format(new Date(selectedDate), 'dd MMMM yyyy', { locale: localeID })} | Kelas: ${clsName}`);
                
                const rows = allStudents.filter(s => s.tingkatRombel === clsName).map((s, i) => {
                    const r = attendanceRecords.find(rec => rec.studentId === s.id);
                    return [i + 1, s.idUnik, toTitleCase(s.namaLengkap), formatTime(r?.checkIn), formatTime(r?.duha), formatTime(r?.zuhur), formatTime(r?.ashar), formatTime(r?.checkOut), r?.status || 'Alpha'];
                });

                autoTable(doc, {
                    startY: 25,
                    head: [['No', 'ID', 'Nama Siswa', 'Masuk', 'Duha', 'Zuhur', 'Ashar', 'Pulang', 'Ket']],
                    body: rows,
                    theme: 'grid',
                    styles: { fontSize: 7, cellPadding: 1.5 },
                    headStyles: { fillColor: [63, 81, 181] }
                });
            });
        }

        if (activeReport === 'monthly') {
            drawHeader(`REKAPITULASI BULANAN PRESENSI`, `Bulan: ${format(new Date(selectedMonth), 'MMMM yyyy', { locale: localeID })} | Kelas: ${selectedClass}`);
            const studentsInClass = allStudents.filter(s => selectedClass === 'All' || s.tingkatRombel === selectedClass);
            
            const rows = studentsInClass.map((s, i) => {
                const sRecs = attendanceRecords.filter(r => r.studentId === s.id);
                const counts = { H: 0, T: 0, S: 0, I: 0, A: 0, HD: 0 };
                sRecs.forEach(r => {
                    if (r.status === 'Hadir') counts.H++;
                    else if (r.status === 'Terlambat') counts.T++;
                    else if (r.status === 'Sakit') counts.S++;
                    else if (r.status === 'Izin') counts.I++;
                    else if (r.status === 'Alpha') counts.A++;
                    else if (r.status === 'Haid') counts.HD++;
                });
                const totalDays = Object.values(counts).reduce((a, b) => a + b, 0);
                const perc = totalDays > 0 ? ((counts.H + counts.T + counts.HD) / totalDays * 100).toFixed(0) : '0';
                return [i + 1, s.idUnik, toTitleCase(s.namaLengkap), s.tingkatRombel, counts.H, counts.T, counts.S, counts.I, counts.A, counts.HD, `${perc}%` ];
            });

            autoTable(doc, {
                startY: 25,
                head: [['No', 'ID', 'Nama Siswa', 'Kelas', 'H', 'T', 'S', 'I', 'A', 'HD', '%']],
                body: rows,
                theme: 'striped',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [16, 185, 129] }
            });
        }

        if (activeReport === 'individual') {
            const s = allStudents.find(st => st.id === selectedStudentId);
            if (!s) return toast.error("Pilih siswa terlebih dahulu");
            
            drawHeader(`LAPORAN INDIVIDU PESERTA DIDIK`, `Nama: ${s.namaLengkap} | ID: ${s.idUnik} | Bulan: ${format(new Date(selectedMonth), 'MMMM yyyy', { locale: localeID })}`);
            
            const sRecs = attendanceRecords.filter(r => r.studentId === s.id);
            const rows = sRecs.sort((a,b) => a.date.localeCompare(b.date)).map((r, i) => [
                i+1, format(new Date(r.date), 'dd/MM/yyyy'), r.status, formatTime(r.checkIn), formatTime(r.checkOut)
            ]);

            autoTable(doc, {
                startY: 35,
                head: [['No', 'Tanggal', 'Status', 'Jam Masuk', 'Jam Pulang']],
                body: rows,
                theme: 'grid',
                styles: { fontSize: 9 }
            });
        }

        if (download) {
            doc.save(`Laporan_${activeReport}_${Date.now()}.pdf`);
        } else {
            setPreviewPdfUrl(URL.createObjectURL(doc.output('blob')));
            setIsPreviewModalOpen(true);
        }
    };

    return (
        <Layout title="Pusat Laporan" subtitle="Arsip Digital Madrasah" icon={ChartBarIcon} onBack={onBack}>
            <div className="p-4 lg:p-8 pb-32 max-w-5xl mx-auto space-y-6">
                
                {activeReport === 'menu' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <ReportCard 
                            title="Laporan Harian" 
                            desc="Detail presensi harian per kelas/sesi." 
                            icon={CalendarIcon} 
                            color="indigo" 
                            onClick={() => setActiveReport('daily')} 
                        />
                        <ReportCard 
                            title="Rekap Bulanan" 
                            desc="Statistik kehadiran bulanan kolektif." 
                            icon={ChartBarIcon} 
                            color="emerald" 
                            onClick={() => setActiveReport('monthly')} 
                        />
                        <ReportCard 
                            title="Laporan Individu" 
                            desc="Riwayat kehadiran per siswa." 
                            icon={UserIcon} 
                            color="amber" 
                            onClick={() => setActiveReport('individual')} 
                        />
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <button onClick={() => setActiveReport('menu')} className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                            <ArrowLeftIcon className="w-4 h-4" /> Kembali ke menu
                        </button>

                        <div className="bg-white dark:bg-[#151E32] p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {activeReport === 'daily' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Tanggal</label>
                                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold" />
                                    </div>
                                )}
                                
                                {(activeReport === 'monthly' || activeReport === 'individual') && (
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Bulan</label>
                                        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold" />
                                    </div>
                                )}

                                {activeReport !== 'individual' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Filter Kelas</label>
                                        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold appearance-none">
                                            <option value="All">Semua Kelas</option>
                                            {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                {activeReport === 'individual' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cari Siswa</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="Nama siswa..." 
                                                value={studentSearch} 
                                                onChange={e => setStudentSearch(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold"
                                            />
                                            {studentSearch && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden">
                                                    {filteredStudentsForSelection.map(s => (
                                                        <button 
                                                            key={s.id} 
                                                            onClick={() => { setSelectedStudentId(s.id!); setStudentSearch(s.namaLengkap); }}
                                                            className={`w-full text-left px-4 py-2.5 text-[10px] font-bold hover:bg-indigo-50 border-b border-slate-50 last:border-0 ${selectedStudentId === s.id ? 'bg-indigo-50 text-indigo-600' : ''}`}
                                                        >
                                                            {s.namaLengkap} ({s.idUnik})
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => generatePDF(false)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95">
                                    <PrinterIcon className="w-4 h-4" /> Pratinjau PDF
                                </button>
                                <button className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all">
                                    <FileSpreadsheet className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Quick View Table */}
                        <div className="bg-white dark:bg-[#151E32] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pratinjau Data Cepat</span>
                                {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="excel-table text-[10.5px] min-w-[780px]">
                                    <colgroup>
                                        <col className="w-[44px]" />
                                        <col className="w-[88px]" />
                                        <col className="w-[220px]" />
                                        <col className="w-[96px]" />
                                        <col className="w-[68px]" />
                                        <col className="w-[68px]" />
                                        <col className="w-[68px]" />
                                        <col className="w-[68px]" />
                                        <col className="w-[68px]" />
                                        <col className="w-[92px]" />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th className="text-[10px] font-black tracking-wide">No</th>
                                            <th className="text-[10px] font-black tracking-wide">ID Unik</th>
                                            <th className="text-[10px] font-black tracking-wide">Nama Lengkap Siswa</th>
                                            <th className="text-[10px] font-black tracking-wide">Kelas</th>
                                            <th className="text-[10px] font-black tracking-wide text-center">Masuk</th>
                                            <th className="text-[10px] font-black tracking-wide text-center">Duha</th>
                                            <th className="text-[10px] font-black tracking-wide text-center">Zuhur</th>
                                            <th className="text-[10px] font-black tracking-wide text-center">Ashar</th>
                                            <th className="text-[10px] font-black tracking-wide text-center">Pulang</th>
                                            <th className="text-[10px] font-black tracking-wide text-center">Ket</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceRecords.slice(0, 10).map((r, i) => (
                                            <tr key={i}>
                                                <td className="font-semibold text-center">{i + 1}</td>
                                                <td className="font-mono">{r.idUnik || '-'}</td>
                                                <td className="font-semibold">{toTitleCase(r.studentName)}</td>
                                                <td>{r.class || '-'}</td>
                                                <td className="text-center font-mono">{formatTime(r.checkIn)}</td>
                                                <td className="text-center font-mono">{formatTime(r.duha)}</td>
                                                <td className="text-center font-mono">{formatTime(r.zuhur)}</td>
                                                <td className="text-center font-mono">{formatTime(r.ashar)}</td>
                                                <td className="text-center font-mono">{formatTime(r.checkOut)}</td>
                                                <td className="text-center"><span className="px-2 py-0.5 rounded text-[9px] font-black bg-indigo-50 text-indigo-600">{r.status || '-'}</span></td>
                                            </tr>
                                        ))}
                                        {attendanceRecords.length === 0 && !loading && (
                                            <tr><td colSpan={10} className="py-12 text-center text-slate-400 text-[10px] font-bold">Data tidak ditemukan untuk kriteria ini.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL PREVIEW */}
            {isPreviewModalOpen && (
                <div className="fixed inset-0 z-[1000] flex flex-col bg-slate-950">
                    <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-white/5 safe-pt">
                        <div className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center"><PrinterIcon className="w-5 h-5"/></div>
                            <h4 className="text-[11px] font-black uppercase">Pratinjau Dokumen</h4>
                        </div>
                        <button onClick={() => setIsPreviewModalOpen(false)} className="p-2 text-slate-400"><XCircleIcon className="w-8 h-8"/></button>
                    </div>
                    <div className="flex-1 bg-slate-800">
                        <iframe src={previewPdfUrl!} className="w-full h-full border-none" />
                    </div>
                    <div className="p-6 bg-slate-900 flex gap-4 safe-pb">
                         <button onClick={() => generatePDF(true)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                            <ArrowDownTrayIcon className="w-4 h-4" /> Unduh Laporan Resmi
                         </button>
                    </div>
                </div>
            )}
        </Layout>
    );
};

const ReportCard = ({ title, desc, icon: Icon, color, onClick }: any) => {
    const colors: any = {
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30'
    };
    return (
        <button onClick={onClick} className="bg-white dark:bg-[#151E32] p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm text-left group hover:scale-[1.02] transition-all active:scale-95">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${colors[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{title}</h3>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed font-medium">{desc}</p>
        </button>
    );
};

export default Reports;
