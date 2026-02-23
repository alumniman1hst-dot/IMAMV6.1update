import React, { useState, useEffect, useMemo } from 'react';
import Layout from './Layout';
import { UserRole, StudentGrade } from '../types';
import { 
  AcademicCapIcon, ArrowDownTrayIcon, 
  ChevronDownIcon, PrinterIcon, SaveIcon, Loader2 
} from './Icons';
import { toast } from 'sonner';
import { getStudents } from '../services/studentService';
import { getSubjects, getGradesBySubject, saveStudentGrade, getGradesByStudent, Subject } from '../services/gradeService';
import { auth, db, isMockMode } from '../services/firebase';

interface GradesProps {
  onBack: () => void;
  userRole: UserRole;
}

// --- SUB-COMPONENTS ---

const GuruInputNilai: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [gradesData, setGradesData] = useState<StudentGrade[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const initData = async () => {
            try {
                const [fetchedSubjects, fetchedStudents] = await Promise.all([
                    getSubjects(),
                    getStudents()
                ]);
                setSubjects(fetchedSubjects);
                if (fetchedSubjects.length > 0) setSelectedSubject(fetchedSubjects[0].id);
                setStudents(fetchedStudents);
            } catch (error) {
                toast.error("Gagal memuat data awal.");
            } finally {
                setLoading(false);
            }
        };
        initData();
    }, []);

    useEffect(() => {
        if (!selectedSubject || students.length === 0) return;
        const loadGrades = async () => {
            setLoading(true);
            try {
                const existingGrades = await getGradesBySubject(selectedSubject);
                const mappedGrades: StudentGrade[] = students.map(student => {
                    const found = existingGrades.find(g => g.studentId === student.id);
                    return found || {
                        subjectId: selectedSubject,
                        studentId: student.id || '',
                        nilaiHarian: 0, nilaiUTS: 0, nilaiUAS: 0, nilaiAkhir: 0
                    };
                });
                setGradesData(mappedGrades);
            } finally {
                setLoading(false);
            }
        };
        loadGrades();
    }, [selectedSubject, students]);

    const handleGradeChange = (index: number, field: keyof StudentGrade, value: number) => {
        const val = Math.max(0, Math.min(100, value));
        const newGrades = [...gradesData];
        const currentGrade = { ...newGrades[index], [field]: val };
        currentGrade.nilaiAkhir = parseFloat(((currentGrade.nilaiHarian + currentGrade.nilaiUTS + currentGrade.nilaiUAS) / 3).toFixed(1));
        newGrades[index] = currentGrade;
        setGradesData(newGrades);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all(gradesData.map(grade => saveStudentGrade(grade)));
            toast.success("Semua nilai berhasil disimpan");
        } catch (error) {
            toast.error("Gagal menyimpan nilai");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-[#151E32] p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mata Pelajaran</label>
                <div className="relative">
                    <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-indigo-600 outline-none appearance-none cursor-pointer">
                        {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                    </select>
                    <ChevronDownIcon className="absolute right-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>

            <div className="bg-white dark:bg-[#151E32] rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3">Nama Siswa</th>
                                <th className="px-4 py-3 text-center">Harian</th>
                                <th className="px-4 py-3 text-center">UTS</th>
                                <th className="px-4 py-3 text-center">UAS</th>
                                <th className="px-4 py-3 text-center">Akhir</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></td></tr>
                            ) : gradesData.map((grade, index) => (
                                <tr key={grade.studentId} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-white text-[11px] uppercase tracking-tight">
                                        {students.find(s => s.id === grade.studentId)?.namaLengkap || 'Unknown'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <input type="number" value={grade.nilaiHarian || ''} onChange={(e) => handleGradeChange(index, 'nilaiHarian', parseFloat(e.target.value) || 0)} className="w-12 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 text-xs font-bold outline-none" />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <input type="number" value={grade.nilaiUTS || ''} onChange={(e) => handleGradeChange(index, 'nilaiUTS', parseFloat(e.target.value) || 0)} className="w-12 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 text-xs font-bold outline-none" />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <input type="number" value={grade.nilaiUAS || ''} onChange={(e) => handleGradeChange(index, 'nilaiUAS', parseFloat(e.target.value) || 0)} className="w-12 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 text-xs font-bold outline-none" />
                                    </td>
                                    <td className="px-4 py-3 text-center font-black text-indigo-600">{grade.nilaiAkhir.toFixed(0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="flex justify-end pt-2">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <SaveIcon className="w-4 h-4" />} Simpan Nilai
                </button>
            </div>
        </div>
    );
};

const SiswaLihatRapor: React.FC = () => {
    const [grades, setGrades] = useState<StudentGrade[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const user = auth?.currentUser;
            if (isMockMode) {
                const [fs, fg] = await Promise.all([getSubjects(), getGradesByStudent('mock-student-id')]);
                setSubjects(fs); setGrades(fg);
            } else if (user && db) {
                try {
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    if (userDoc.exists && userDoc.data()?.studentId) {
                        const sid = userDoc.data()!.studentId;
                        const [fs, fg] = await Promise.all([getSubjects(), getGradesByStudent(sid)]);
                        setSubjects(fs); setGrades(fg);
                    }
                } catch (e) { toast.error("Gagal memuat transkrip nilai."); }
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>;

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-[#151E32] p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><AcademicCapIcon className="w-32 h-32" /></div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div>
                        <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">Transkrip Nilai</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Semester Ganjil 2024/2025</p>
                    </div>
                    <button className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl"><PrinterIcon className="w-5 h-5"/></button>
                </div>
                
                <div className="space-y-2.5 relative z-10">
                    {grades.map((grade, index) => {
                        const sub = subjects.find(s => s.id === grade.subjectId)?.name || 'Mata Pelajaran';
                        const isLulus = grade.nilaiAkhir >= 75;
                        return (
                            <div key={index} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase truncate pr-4">{sub}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${isLulus ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                                            {isLulus ? 'Tuntas' : 'Remedial'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">KKM: 75</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-slate-900 dark:text-white leading-none">{grade.nilaiAkhir.toFixed(0)}</div>
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">NILAI AKHIR</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-800 text-center">
                    <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.15em] leading-relaxed italic">
                        "Nilai di atas merupakan data realtime dan belum merupakan hasil rapor akhir resmi madrasah."
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const Grades: React.FC<GradesProps> = ({ onBack, userRole }) => {
    const isTeacher = userRole === UserRole.GURU || userRole === UserRole.ADMIN || userRole === UserRole.STAF_TU;
    return (
        <Layout title="Nilai & Rapor" subtitle={isTeacher ? "Manajemen Penilaian" : "Hasil Akademik Saya"} icon={AcademicCapIcon} onBack={onBack}>
            <div className="p-4 lg:p-6 pb-24">
                {isTeacher ? <GuruInputNilai /> : <SiswaLihatRapor />}
            </div>
        </Layout>
    );
};

export default Grades;