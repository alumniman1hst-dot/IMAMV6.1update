
import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { BookOpenIcon, PlusIcon, CalendarIcon, UserIcon, ClockIcon, BuildingLibraryIcon } from './Icons';
import { UserRole, JournalEntry } from '../types';
import { getJournals, addJournal } from '../services/academicService';
import { auth, isMockMode } from '../services/firebase';
import { toast } from 'sonner';

interface TeachingJournalProps {
  onBack: () => void;
  userRole: UserRole;
}

const TeachingJournal: React.FC<TeachingJournalProps> = ({ onBack, userRole }) => {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'create'>('history');

  // Form State
  const [formData, setFormData] = useState({
      className: 'X IPA 1',
      subject: 'Matematika',
      date: new Date().toISOString().split('T')[0],
      jamKe: '1-2',
      materi: '',
      catatan: ''
  });

  const isTeacher = userRole === UserRole.GURU || userRole === UserRole.ADMIN;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
        // If Admin, fetch all. If Teacher, fetch own.
        const uid = auth?.currentUser?.uid;
        // In mock mode or real mode, service handles filtering logic if needed.
        // For simplicity in this demo, teacher sees all mock journals in mock mode.
        const data = await getJournals(userRole === UserRole.ADMIN ? undefined : (uid || 'mock-teacher-1'));
        setJournals(data);
    } catch (error) {
        toast.error("Gagal memuat jurnal.");
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.materi) {
          toast.error("Materi harus diisi");
          return;
      }

      const toastId = toast.loading("Menyimpan jurnal...");
      try {
          const user = auth?.currentUser;
          const teacherName = user?.displayName || (isMockMode ? 'Budi Santoso, S.Pd' : 'Guru');
          const teacherId = user?.uid || 'mock-teacher-1';

          await addJournal({
              teacherId,
              teacherName,
              className: formData.className,
              subject: formData.subject,
              date: formData.date,
              jamKe: formData.jamKe,
              materi: formData.materi,
              catatan: formData.catatan || 'Nihil'
          });

          toast.success("Jurnal berhasil disimpan", { id: toastId });
          setFormData({ ...formData, materi: '', catatan: '' }); // Reset partial
          setActiveTab('history');
          fetchData();
      } catch (error) {
          console.error(error);
          toast.error("Gagal menyimpan jurnal", { id: toastId });
      }
  };

  return (
    <Layout
      title="Jurnal Mengajar"
      subtitle="Catatan Aktivitas Kelas"
      icon={BookOpenIcon}
      onBack={onBack}
      actions={
          isTeacher && (
            <button 
                onClick={() => setActiveTab(activeTab === 'create' ? 'history' : 'create')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${activeTab === 'create' ? 'bg-slate-200 text-slate-700' : 'bg-indigo-600 text-white shadow-lg'}`}
            >
                {activeTab === 'create' ? 'Lihat Riwayat' : <><PlusIcon className="w-4 h-4" /> Input Jurnal</>}
            </button>
          )
      }
    >
      <div className="p-4 lg:p-6 pb-24">
          
          {activeTab === 'create' ? (
              <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                      <BookOpenIcon className="w-5 h-5 text-indigo-500" /> Form Jurnal Harian
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Tanggal</label>
                              <input 
                                type="date" 
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Jam Ke-</label>
                              <input 
                                type="text" 
                                value={formData.jamKe}
                                onChange={(e) => setFormData({...formData, jamKe: e.target.value})}
                                placeholder="1-2"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Kelas</label>
                              <select 
                                value={formData.className}
                                onChange={(e) => setFormData({...formData, className: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                              >
                                  <option>X IPA 1</option>
                                  <option>X IPA 2</option>
                                  <option>XI IPS 1</option>
                                  <option>XII AGAMA</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Mata Pelajaran</label>
                              <input 
                                type="text" 
                                value={formData.subject}
                                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Materi / Pokok Bahasan</label>
                          <textarea 
                            rows={3}
                            value={formData.materi}
                            onChange={(e) => setFormData({...formData, materi: e.target.value})}
                            placeholder="Jelaskan materi yang diajarkan..."
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                          />
                      </div>

                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Catatan Kejadian (Opsional)</label>
                          <textarea 
                            rows={2}
                            value={formData.catatan}
                            onChange={(e) => setFormData({...formData, catatan: e.target.value})}
                            placeholder="Siswa sakit, izin, atau kejadian khusus..."
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                          />
                      </div>

                      <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95">
                          Simpan Jurnal
                      </button>
                  </form>
              </div>
          ) : (
              <div className="space-y-4">
                  {loading ? (
                      <p className="text-center text-slate-400 py-10">Memuat jurnal...</p>
                  ) : journals.length > 0 ? (
                      journals.map((journal) => (
                          <div key={journal.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-3">
                                  <div>
                                      <h4 className="font-bold text-slate-800 dark:text-white text-base">{journal.subject}</h4>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                          <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {new Date(journal.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                          <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> Jam ke-{journal.jamKe}</span>
                                          <span className="flex items-center gap-1"><BuildingLibraryIcon className="w-3 h-3" /> {journal.className}</span>
                                      </div>
                                  </div>
                                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                      <BookOpenIcon className="w-5 h-5" />
                                  </div>
                              </div>
                              
                              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 mb-3">
                                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Materi</p>
                                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{journal.materi}</p>
                              </div>

                              {journal.catatan && (
                                  <div className="flex items-start gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10 p-2 rounded-lg">
                                      <span className="font-bold shrink-0">Catatan:</span>
                                      <span>{journal.catatan}</span>
                                  </div>
                              )}
                              
                              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs text-slate-400">
                                  <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {journal.teacherName}</span>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                          <p className="text-slate-500">Belum ada jurnal mengajar.</p>
                      </div>
                  )}
              </div>
          )}
      </div>
    </Layout>
  );
};

export default TeachingJournal;
