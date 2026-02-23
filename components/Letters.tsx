
import React, { useState, useEffect, useMemo } from 'react';
import firebase from 'firebase/compat/app';
import { createLetterRequest, updateLetterStatus, deleteLetter } from '../services/letterService';
import { LetterRequest, LetterStatus, UserRole } from '../types';
import { auth, db, isMockMode } from '../services/firebase';
import { toast } from 'sonner';
import Layout from './Layout';
import { QRCodeSVG } from 'qrcode.react';
import { 
  EnvelopeIcon, PlusIcon, CheckCircleIcon, ClockIcon, XCircleIcon, 
  ArrowPathIcon, FileText, TrashIcon, UserIcon, ArrowRightIcon,
  ShieldCheckIcon, BriefcaseIcon, SparklesIcon, PrinterIcon,
  // Fix: Added missing Loader2 import
  Loader2
} from './Icons';

interface LettersProps {
  onBack: () => void;
  userRole: UserRole;
}

const Letters: React.FC<LettersProps> = ({ onBack, userRole }) => {
  const [letters, setLetters] = useState<LetterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<LetterStatus | 'All'>('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'create' | 'detail'>('create');
  const [selectedLetter, setSelectedLetter] = useState<LetterRequest | null>(null);

  // Form State
  const [formData, setFormData] = useState({
      type: 'Surat Keterangan Aktif',
      description: ''
  });
  
  // Admin/TU Action State
  const [adminNote, setAdminNote] = useState('');
  const [letterNumber, setLetterNumber] = useState('');

  // --- ROLE DEFINITIONS (Workflow Actors) ---
  const isApplicant = [UserRole.SISWA, UserRole.GURU, UserRole.ORANG_TUA, UserRole.STAF_TU, UserRole.WALI_KELAS, UserRole.KETUA_KELAS].includes(userRole);
  
  // TU: Tata Usaha (Staf / Admin) - Verifikasi Awal
  const isTU = userRole === UserRole.STAF_TU || userRole === UserRole.ADMIN || userRole === UserRole.DEVELOPER;
  
  // Validator: Waka / Admin (Sementara Admin handle role Waka jika belum ada role khusus)
  const isValidator = userRole === UserRole.ADMIN || userRole === UserRole.DEVELOPER;
  
  // Signer: Kepala Madrasah
  const isSigner = userRole === UserRole.KEPALA_MADRASAH || userRole === UserRole.DEVELOPER;

  // Viewing permissions: TU, Validator, and Signer see ALL letters. Applicant sees OWN.
  const canViewAll = isTU || isValidator || isSigner;

  // Real-time Fetch
  useEffect(() => {
    setLoading(true);

    if (isMockMode) {
        setTimeout(() => {
            setLetters([
                { 
                    id: '1', 
                    userId: 'mock', 
                    userName: 'Ahmad Dahlan', 
                    userRole: UserRole.SISWA, 
                    type: 'Surat Keterangan Aktif', 
                    description: 'Untuk persyaratan beasiswa prestasi daerah.', 
                    date: new Date().toISOString(), 
                    status: 'Verified',
                    letterNumber: '421/105/MAN1/2024',
                    verifiedBy: 'Staf TU',
                    verifiedAt: new Date().toISOString()
                }
            ]);
            setLoading(false);
        }, 500);
        return;
    }

    if (!db) {
        setLoading(false);
        return;
    }

    let query: firebase.firestore.Query<firebase.firestore.DocumentData> = db.collection('letters').orderBy('date', 'desc');

    if (!canViewAll && auth?.currentUser) {
        query = query.where('userId', '==', auth.currentUser.uid);
    }

    const unsubscribe = query.onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LetterRequest));
        setLetters(data);
        setLoading(false);
    }, err => {
        console.error("Error fetching letters:", err);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [canViewAll]);

  const filteredLetters = useMemo(() => {
      if (filterStatus === 'All') return letters;
      return letters.filter(l => l.status === filterStatus);
  }, [letters, filterStatus]);

  const handleCreate = () => {
      setFormData({ type: 'Surat Keterangan Aktif', description: '' });
      setViewMode('create');
      setIsModalOpen(true);
  };

  const handleView = (letter: LetterRequest) => {
      setSelectedLetter(letter);
      setAdminNote(letter.adminNote || '');
      setLetterNumber(letter.letterNumber || '');
      setViewMode('detail');
      setIsModalOpen(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.description) {
          toast.error("Mohon isi keterangan keperluan.");
          return;
      }

      const toastId = toast.loading("Mengirim permohonan...");
      try {
          const user = auth?.currentUser;
          const userName = user?.displayName || (isMockMode ? 'User Simulasi' : 'Pengguna');
          const uid = user?.uid || (isMockMode ? 'user-1' : 'unknown');

          await createLetterRequest({
              userId: uid,
              userName: userName,
              userRole: userRole,
              type: formData.type,
              description: formData.description,
              date: new Date().toISOString(),
              status: 'Pending'
          });
          
          toast.success("Permohonan berhasil dikirim!", { id: toastId });
          setIsModalOpen(false);
      } catch (e) {
          console.error(e);
          toast.error("Gagal mengirim permohonan.", { id: toastId });
      }
  };

  const handleUpdateStatus = async (newStatus: LetterStatus) => {
      if (!selectedLetter) return;
      
      if (newStatus === 'Verified' && !letterNumber) {
          toast.error("Nomor surat wajib diisi oleh Tata Usaha.");
          return;
      }

      const toastId = toast.loading("Memperbarui status surat...");
      try {
          const updatePayload: Partial<LetterRequest> = {
              status: newStatus,
              adminNote: adminNote 
          };

          const user = auth?.currentUser;
          const actorName = user?.displayName || 'System';

          if (newStatus === 'Verified') {
              updatePayload.letterNumber = letterNumber;
              updatePayload.verifiedBy = actorName;
              updatePayload.verifiedAt = new Date().toISOString();
          } else if (newStatus === 'Validated') {
              updatePayload.validatedBy = actorName;
              updatePayload.validatedAt = new Date().toISOString();
          } else if (newStatus === 'Signed') {
              updatePayload.signedBy = actorName;
              updatePayload.signedAt = new Date().toISOString();
              updatePayload.digitalSignatureHash = `SIGNED-${selectedLetter.id}-${Date.now()}`; 
          }

          await updateLetterStatus(selectedLetter.id!, newStatus, updatePayload);
          
          toast.success(`Status berhasil diubah: ${newStatus}`, { id: toastId });
          setIsModalOpen(false);
      } catch (e) {
          toast.error("Gagal memperbarui status.", { id: toastId });
      }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("Hapus permohonan ini?")) {
          try {
              await deleteLetter(id);
              toast.success("Permohonan dihapus.");
              if (isModalOpen) setIsModalOpen(false);
          } catch(e) {
              toast.error("Gagal menghapus.");
          }
      }
  };

  const getStatusBadge = (status: LetterStatus) => {
      switch(status) {
          case 'Pending': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
          case 'Verified': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
          case 'Validated': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
          case 'Signed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
          case 'Ditolak': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
          default: return 'bg-slate-100 text-slate-700';
      }
  };

  const getStatusIcon = (status: LetterStatus) => {
      switch(status) {
          case 'Pending': return <ClockIcon className="w-3.5 h-3.5" />;
          case 'Verified': return <FileText className="w-3.5 h-3.5" />; 
          case 'Validated': return <ShieldCheckIcon className="w-3.5 h-3.5" />; 
          case 'Signed': return <CheckCircleIcon className="w-3.5 h-3.5" />; 
          case 'Ditolak': return <XCircleIcon className="w-3.5 h-3.5" />;
      }
  };

  const TimelineItem = ({ label, active, completed, date, actor }: { label: string, active: boolean, completed: boolean, date?: string, actor?: string }) => (
      <div className="flex gap-4 min-h-[60px]">
          <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 ${
                  completed ? 'bg-indigo-600 border-indigo-600 text-white' : 
                  active ? 'bg-white border-indigo-600 text-indigo-600 animate-pulse' : 
                  'bg-slate-50 border-slate-200 text-slate-300'
              }`}>
                  {completed ? <CheckCircleIcon className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current"></div>}
              </div>
              <div className={`w-0.5 flex-1 ${completed ? 'bg-indigo-600' : 'bg-slate-200'} my-1`}></div>
          </div>
          <div className={`pb-6 ${completed || active ? 'opacity-100' : 'opacity-50'}`}>
              <p className="text-xs font-bold uppercase tracking-wider">{label}</p>
              {completed && actor && <p className="text-[10px] text-slate-500">Oleh: {actor}</p>}
              {completed && date && <p className="text-[9px] text-slate-400">{new Date(date).toLocaleDateString()} {new Date(date).toLocaleTimeString().slice(0,5)}</p>}
          </div>
      </div>
  );

  return (
    <Layout
      title="Layanan Surat"
      subtitle="Sistem Terpadu PTSP"
      icon={EnvelopeIcon}
      onBack={onBack}
      actions={
          <button 
              onClick={handleCreate}
              disabled={loading}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${loading ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700'}`}
          >
              <PlusIcon className="w-4 h-4" /> Ajukan
          </button>
      }
    >
      <div className="p-4 lg:p-6 pb-24 space-y-6">
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['All', 'Pending', 'Verified', 'Validated', 'Signed', 'Ditolak'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                        filterStatus === status 
                        ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900' 
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                      {status === 'All' ? 'Semua' : status === 'Signed' ? 'Selesai' : status}
                  </button>
              ))}
          </div>

          {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sinkronisasi PTSP...</p>
              </div>
          ) : filteredLetters.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                  {filteredLetters.map((letter) => (
                      <div 
                        key={letter.id} 
                        onClick={() => handleView(letter)}
                        className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
                      >
                          <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      letter.type.includes('Keterangan') ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                                      letter.type.includes('Izin') ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                                      'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                                  }`}>
                                      <FileText className="w-5 h-5" />
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-slate-800 dark:text-white text-sm">{letter.type}</h3>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{letter.description}</p>
                                  </div>
                              </div>
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 ${getStatusBadge(letter.status)}`}>
                                  {getStatusIcon(letter.status)}
                                  {letter.status === 'Signed' ? 'Selesai' : letter.status}
                              </span>
                          </div>
                          
                          <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-700/50">
                              <div className="flex items-center gap-2">
                                  {canViewAll && (
                                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                                          <UserIcon className="w-3 h-3 text-slate-400" />
                                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{letter.userName}</span>
                                          <span className="text-[9px] text-slate-400">({letter.userRole})</span>
                                      </div>
                                  )}
                                  <span className="text-[10px] text-slate-400">
                                      {new Date(letter.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                              </div>
                              <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                  <EnvelopeIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Belum ada permohonan surat.</p>
                  <button onClick={handleCreate} className="mt-4 text-indigo-600 font-bold text-xs hover:underline">
                      Buat Permohonan Baru
                  </button>
              </div>
          )}

          {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                      
                      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
                          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                              {viewMode === 'create' ? <PlusIcon className="w-5 h-5 text-indigo-500"/> : <FileText className="w-5 h-5 text-indigo-500"/>}
                              {viewMode === 'create' ? 'Buat Permohonan' : 'Detail Surat'}
                          </h3>
                          <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600">
                              <XCircleIcon className="w-6 h-6" />
                          </button>
                      </div>
                      
                      <div className="p-6 overflow-y-auto">
                          {viewMode === 'create' ? (
                              <form id="createForm" onSubmit={handleSubmitRequest} className="space-y-5">
                                  <div>
                                      <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Jenis Surat</label>
                                      <select 
                                          value={formData.type}
                                          onChange={(e) => setFormData({...formData, type: e.target.value})}
                                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                      >
                                          <option>Surat Keterangan Aktif Siswa</option>
                                          <option>Surat Izin Penelitian</option>
                                          <option>Surat Permohonan Pindah/Mutasi</option>
                                          <option>Surat Tugas Guru</option>
                                          <option>Surat Cuti Pegawai</option>
                                          <option>Legalisir Ijazah/Rapor</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Keperluan / Keterangan</label>
                                      <textarea 
                                          rows={4}
                                          value={formData.description}
                                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                          placeholder="Contoh: Untuk persyaratan administrasi beasiswa..."
                                      />
                                  </div>
                              </form>
                          ) : selectedLetter ? (
                              <div className="space-y-6">
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <h4 className="font-bold text-slate-800 dark:text-white text-base">{selectedLetter.type}</h4>
                                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedLetter.description}</p>
                                          <div className="flex items-center gap-2 mt-2">
                                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">
                                                  {new Date(selectedLetter.date).toLocaleDateString()}
                                              </span>
                                              {selectedLetter.letterNumber && (
                                                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-2 py-1 rounded font-mono font-bold border border-indigo-100 dark:border-indigo-800">
                                                      {selectedLetter.letterNumber}
                                                  </span>
                                              )}
                                          </div>
                                      </div>
                                      {selectedLetter.status === 'Signed' && (
                                          <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                              <QRCodeSVG value={`IMAM-VALID-${selectedLetter.digitalSignatureHash}`} size={64} />
                                          </div>
                                      )}
                                  </div>

                                  <div className="border-t border-b border-slate-100 dark:border-slate-800 py-6">
                                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Status Workflow</h5>
                                      <div className="relative">
                                          <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800 -z-10"></div>
                                          
                                          <TimelineItem 
                                              label="Pengajuan Masuk" 
                                              active={false} 
                                              completed={true} 
                                              date={selectedLetter.date}
                                              actor={selectedLetter.userName}
                                          />
                                          <TimelineItem 
                                              label="Verifikasi Tata Usaha" 
                                              active={selectedLetter.status === 'Pending'} 
                                              completed={['Verified', 'Validated', 'Signed'].includes(selectedLetter.status)} 
                                              date={selectedLetter.verifiedAt}
                                              actor={selectedLetter.verifiedBy || (isTU ? 'Menunggu Anda' : 'Staf TU')}
                                          />
                                          <TimelineItem 
                                              label="Validasi Pimpinan (Waka)" 
                                              active={selectedLetter.status === 'Verified'} 
                                              completed={['Validated', 'Signed'].includes(selectedLetter.status)}
                                              date={selectedLetter.validatedAt}
                                              actor={selectedLetter.validatedBy || (isValidator ? 'Menunggu Anda' : 'Waka Bidang')}
                                          />
                                          <TimelineItem 
                                              label="Tanda Tangan Kepala" 
                                              active={selectedLetter.status === 'Validated'} 
                                              completed={selectedLetter.status === 'Signed'}
                                              date={selectedLetter.signedAt}
                                              actor={selectedLetter.signedBy || (isSigner ? 'Menunggu Anda' : 'Kepala Madrasah')}
                                          />
                                      </div>
                                  </div>

                                  {isTU && selectedLetter.status === 'Pending' && (
                                      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800">
                                          <h5 className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase mb-3 flex items-center gap-2">
                                              <BriefcaseIcon className="w-4 h-4"/> Tindakan Tata Usaha
                                          </h5>
                                          <div className="space-y-3">
                                              <input 
                                                  type="text" 
                                                  value={letterNumber}
                                                  onChange={(e) => setLetterNumber(e.target.value)}
                                                  placeholder="Input Nomor Surat Resmi (Wajib)"
                                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                                              />
                                              <div className="flex gap-2">
                                                  <button onClick={() => handleUpdateStatus('Verified')} className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-orange-700">
                                                      Verifikasi & Teruskan
                                                  </button>
                                                  <button onClick={() => handleUpdateStatus('Ditolak')} className="px-4 bg-red-100 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-200">
                                                      Tolak
                                                  </button>
                                              </div>
                                          </div>
                                      </div>
                                  )}

                                  {isValidator && selectedLetter.status === 'Verified' && (
                                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                          <h5 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-3 flex items-center gap-2">
                                              <ShieldCheckIcon className="w-4 h-4"/> Validasi Teknis
                                          </h5>
                                          <p className="text-xs text-blue-600/80 mb-3">Pastikan isi surat sesuai dengan ketentuan madrasah.</p>
                                          <div className="flex gap-2">
                                              <button onClick={() => handleUpdateStatus('Validated')} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700">
                                                  Validasi Surat
                                              </button>
                                              <button onClick={() => handleUpdateStatus('Ditolak')} className="px-4 bg-red-100 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-200">
                                                  Kembalikan
                                              </button>
                                          </div>
                                      </div>
                                  )}

                                  {isSigner && selectedLetter.status === 'Validated' && (
                                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                          <h5 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-3 flex items-center gap-2">
                                              <SparklesIcon className="w-4 h-4"/> Pengesahan Akhir
                                          </h5>
                                          <p className="text-xs text-emerald-600/80 mb-3">Bubuhkan tanda tangan digital (QR Code) untuk mengesahkan.</p>
                                          <div className="flex gap-2">
                                              <button onClick={() => handleUpdateStatus('Signed')} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none">
                                                  Tanda Tangani Digital
                                              </button>
                                              <button onClick={() => handleUpdateStatus('Ditolak')} className="px-4 bg-red-100 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-200">
                                                  Tolak
                                              </button>
                                          </div>
                                      </div>
                                  )}

                                  {selectedLetter.status === 'Signed' && (
                                      <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none">
                                          <PrinterIcon className="w-4 h-4" /> Download Dokumen Sah
                                      </button>
                                  )}

                                  {selectedLetter.status === 'Ditolak' && (
                                      <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm font-bold border border-red-100">
                                          Permohonan Ditolak
                                      </div>
                                  )}

                              </div>
                          ) : null}
                      </div>

                      <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-white dark:bg-slate-900 z-10">
                          {viewMode === 'create' ? (
                              <>
                                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm">
                                      Batal
                                  </button>
                                  <button onClick={handleSubmitRequest} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700">
                                      Kirim
                                  </button>
                              </>
                          ) : (
                              <>
                                  {selectedLetter?.status === 'Pending' && isApplicant && (
                                      <button 
                                          onClick={() => handleDelete(selectedLetter.id!)}
                                          className="px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                                      >
                                          <TrashIcon className="w-4 h-4" /> Batalkan
                                      </button>
                                  )}
                                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-200">
                                      Tutup
                                  </button>
                              </>
                          )}
                      </div>
                  </div>
              </div>
          )}

      </div>
    </Layout>
  );
};

export default Letters;
