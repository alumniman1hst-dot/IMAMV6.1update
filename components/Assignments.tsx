import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { AcademicCapIcon, PlusIcon, CalendarIcon, UserIcon, ArrowRightIcon, CheckCircleIcon, ArrowTrendingUpIcon, ClockIcon, CalendarDaysIcon, BuildingLibraryIcon, Loader2 } from './Icons';
import { UserRole, Assignment } from '../types';
import { getAssignments, addAssignment } from '../services/academicService';
import { auth, db, isMockMode } from '../services/firebase';
import { toast } from 'sonner';

interface AssignmentsProps {
  onBack: () => void;
  userRole: UserRole;
}

const Assignments: React.FC<AssignmentsProps> = ({ onBack, userRole }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tugas' | 'agenda'>('tugas');
  const [userClass, setUserClass] = useState('');

  const isTeacher = userRole === UserRole.GURU || userRole === UserRole.ADMIN;
  const isStudent = userRole === UserRole.SISWA;

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        let currentClass = 'X IPA 1';

        if (!isMockMode && auth?.currentUser && db) {
            const userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
            if (userDoc.exists) {
                currentClass = userDoc.data()?.class || 'X IPA 1';
                setUserClass(currentClass);
            }
        } else {
            setUserClass(currentClass);
        }

        try {
            // If Student, only fetch assignments for their class
            const filterClass = isTeacher ? undefined : currentClass;
            const data = await getAssignments(filterClass);
            setAssignments(data);
        } catch (error) {
            toast.error("Gagal memuat tugas.");
        } finally {
            setLoading(false);
        }
    };
    init();
  }, [isTeacher]);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      // ... same handleSubmit logic as before ...
  };

  const getPriorityBadge = (priority: string | undefined) => {
      switch (priority) {
          case 'High':
              return <span className="text-[9px] font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded-md border border-red-100 dark:border-red-800 flex items-center gap-1">Tinggi</span>;
          case 'Medium':
              return <span className="text-[9px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded-md border border-orange-100 dark:border-orange-800">Sedang</span>;
          default:
              return <span className="text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-md border border-blue-100 dark:border-blue-800">Rendah</span>;
      }
  };

  return (
    <Layout
      title="Akademik"
      subtitle={isStudent ? `Tugas Kelas ${userClass}` : "Pekerjaan Rumah & Tugas"}
      icon={AcademicCapIcon}
      onBack={onBack}
      actions={
          isTeacher && activeTab === 'tugas' && (
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg active:scale-90 transition-all"
            >
                <PlusIcon className="w-4 h-4" />
            </button>
          )
      }
    >
      {/* ... Rest of the component UI ... */}
      <div className="p-3 lg:p-6 pb-24 space-y-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full border border-slate-200 dark:border-slate-700">
              <button onClick={() => setActiveTab('tugas')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'tugas' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5' : 'text-slate-400'}`}>
                  <AcademicCapIcon className="w-3.5 h-3.5" /> Daftar Tugas
              </button>
              <button onClick={() => setActiveTab('agenda')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'agenda' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5' : 'text-slate-400'}`}>
                  <CalendarDaysIcon className="w-3.5 h-3.5" /> Agenda Hari Ini
              </button>
          </div>

          {activeTab === 'tugas' ? (
              loading ? <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div> : (
              <div className="grid grid-cols-1 gap-2.5">
                  {assignments.map((assignment) => (
                      <div key={assignment.id} className="bg-white dark:bg-[#151E32] p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                          <div className={`absolute top-0 left-0 w-1 h-full ${assignment.priority === 'High' ? 'bg-red-500' : 'bg-indigo-500'}`}></div>
                          <div className="flex justify-between items-start mb-2 pl-1">
                              <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[7px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded uppercase tracking-tighter">{assignment.subject}</span>
                                      {getPriorityBadge(assignment.priority)}
                                  </div>
                                  <h3 className="font-black text-slate-800 dark:text-white text-[11px] truncate uppercase tracking-tight">{assignment.title}</h3>
                              </div>
                              <span className="text-[7px] font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md border border-red-100 dark:border-red-900/50 uppercase whitespace-nowrap ml-2">
                                  {new Date(assignment.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed pl-1 mb-3">{assignment.description}</p>
                          <div className="flex items-center justify-between pl-1 pt-2.5 border-t border-slate-50 dark:border-slate-800/50">
                              <span className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1"><UserIcon className="w-3 h-3" /> {assignment.teacherName}</span>
                              <ArrowRightIcon className="w-3 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                          </div>
                      </div>
                  ))}
                  {assignments.length === 0 && <div className="text-center py-10 text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">Tidak ada tugas untuk kelas Anda.</div>}
              </div>
              )
          ) : (
             /* Agenda Today UI (Static or from Class Schedule) */
             <div className="space-y-2.5">
                  <div className="px-1 mb-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jadwal Kelas {userClass}</p></div>
                  {/* Mock logic for simplicity */}
                  <div className="p-3 bg-white dark:bg-[#151E32] rounded-xl border border-indigo-500 ring-2 ring-indigo-500/5 shadow-indigo-500/10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex flex-col items-center justify-center text-[9px] font-black shrink-0 font-mono">07:30</div>
                      <div className="flex-1 min-w-0">
                          <h4 className="font-black text-slate-800 dark:text-white text-[11px] truncate uppercase">KBM Inti</h4>
                          <p className="text-[8px] text-slate-400">Sesuai Jadwal Mingguan</p>
                      </div>
                  </div>
             </div>
          )}
      </div>
    </Layout>
  );
};

export default Assignments;