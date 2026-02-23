
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 * Pusat Kendali Klaim Identitas v2.2
 */

import React, { useState, useEffect, useMemo } from 'react';
import Layout from './Layout';
import { 
    getClaimsByStatus, approveClaim, rejectClaim, setClaimToReview 
} from '../services/claimService';
import { db } from '../services/firebase';
import { ClaimRequest } from '../types';
import { 
    ShieldCheckIcon, CheckCircleIcon, XCircleIcon, 
    Loader2, UserIcon, IdentificationIcon,
    ClockIcon, ArrowPathIcon, EyeIcon, ClipboardDocumentCheckIcon,
    SparklesIcon, ShieldExclamationIcon,
    UsersGroupIcon, BriefcaseIcon, BuildingLibraryIcon,
    InfoIcon
} from './Icons';
import { toast } from 'sonner';

type ClaimTab = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'log';

const ClaimManagement: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<ClaimTab>('pending');
    const [requests, setRequests] = useState<ClaimRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    
    // State Audit Detail
    const [selectedClaim, setSelectedClaim] = useState<ClaimRequest | null>(null);
    const [masterData, setMasterData] = useState<any | null>(null);
    const [auditLoading, setAuditLoading] = useState(false);
    
    // Modal & Alasan
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const statusToFetch = activeTab === 'log' ? 'all' : activeTab;
            const data = await getClaimsByStatus(statusToFetch as any);
            setRequests(data);
        } catch (e) {
            toast.error("Gagal sinkronisasi data klaim.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [activeTab]);

    const handleOpenReview = async (claim: ClaimRequest) => {
        setSelectedClaim(claim);
        setAuditLoading(true);
        setMasterData(null);
        
        try {
            if (claim.status === 'pending') {
                await setClaimToReview(claim.id);
            }

            if (db) {
                const collection = claim.type === 'siswa' ? 'students' : 'teachers';
                const docId = claim.targetId;
                const doc = await db.collection(collection).doc(docId).get();
                if (doc.exists) {
                    setMasterData(doc.data());
                }
            }
        } catch (e) {
            toast.error("Gagal memproses validasi otomatis.");
        } finally {
            setAuditLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedClaim || !window.confirm(`Sahkan identitas digital untuk ${selectedClaim.userName}?`)) return;
        
        setProcessingId(selectedClaim.id);
        try {
            await approveClaim(selectedClaim);
            toast.success("Klaim Disetujui. Hak akses user ditingkatkan.");
            setSelectedClaim(null);
            fetchRequests();
        } catch (e: any) {
            toast.error(e.message || "Gagal memproses persetujuan.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectSubmit = async () => {
        if (!selectedClaim || !rejectReason) return;
        
        setProcessingId(selectedClaim.id);
        try {
            await rejectClaim(selectedClaim.id, rejectReason);
            toast.info("Pengajuan telah ditolak.");
            setIsRejectModalOpen(false);
            setRejectReason('');
            setSelectedClaim(null);
            fetchRequests();
        } catch (e) {
            toast.error("Gagal mengirim keputusan penolakan.");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <Layout title="Manajemen Klaim" subtitle="Otoritas Identitas Digital" icon={ShieldCheckIcon} onBack={onBack}>
            <div className="p-4 lg:p-8 pb-32 max-w-7xl mx-auto space-y-6">
                
                {/* Dashboard Statistik Mini */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-700">
                    <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl">
                        <h4 className="text-3xl font-black">{requests.filter(r => r.status === 'pending').length}</h4>
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mt-1">Pending Request</p>
                    </div>
                    <div className="bg-white dark:bg-[#151E32] rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h4 className="text-3xl font-black text-amber-500">{requests.filter(r => r.status === 'reviewing').length}</h4>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Sedang Ditinjau</p>
                    </div>
                    <div className="bg-white dark:bg-[#151E32] rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm md:col-span-2 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CheckCircleIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status Autentikasi</p>
                                <h4 className="text-sm font-black text-emerald-600 uppercase mt-1">Sistem Aktif</h4>
                            </div>
                        </div>
                        <button onClick={fetchRequests} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-indigo-50 transition-all border border-slate-100 dark:border-slate-700">
                            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[1.8rem] flex overflow-x-auto gap-1 border border-slate-200 dark:border-slate-800 shadow-inner scrollbar-hide">
                    {[
                        { id: 'pending', label: 'Menunggu', icon: ClockIcon },
                        { id: 'reviewing', label: 'Ditinjau', icon: EyeIcon },
                        { id: 'approved', label: 'Disetujui', icon: CheckCircleIcon },
                        { id: 'rejected', label: 'Ditolak', icon: XCircleIcon },
                        { id: 'log', label: 'Log Aktivitas', icon: ClipboardDocumentCheckIcon },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as ClaimTab)}
                            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tabel Data */}
                <div className="bg-white dark:bg-[#151E32] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="excel-table">
                            <thead>
                                <tr>
                                    <th className="text-center w-12">No</th>
                                    <th>Nama Akun</th>
                                    <th className="text-center">Tipe</th>
                                    <th className="text-center">ID Tujuan</th>
                                    <th className="text-center">Tgl Masuk</th>
                                    <th className="text-center w-32">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="py-32 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500 opacity-20" /></td></tr>
                                ) : requests.length > 0 ? (
                                    requests.map((r, i) => (
                                        <tr key={r.id} className="group hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10">
                                            <td className="text-center font-mono text-slate-400 font-bold">{i + 1}</td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{r.userName}</span>
                                                    <span className="text-[9px] text-slate-400 font-medium">{r.userEmail}</span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${r.type === 'siswa' ? 'bg-teal-50 text-teal-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                    {r.type === 'siswa' ? <UsersGroupIcon className="w-3 h-3" /> : <BriefcaseIcon className="w-3 h-3" />}
                                                    {r.type}
                                                </div>
                                            </td>
                                            <td className="text-center font-mono font-black text-indigo-600 dark:text-indigo-400">{r.targetId}</td>
                                            <td className="text-center text-[10px] text-slate-400 font-bold">{new Date(r.createdAt).toLocaleDateString('id-ID')}</td>
                                            <td className="text-center">
                                                <button 
                                                    onClick={() => handleOpenReview(r)}
                                                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all border border-slate-100 dark:border-slate-700"
                                                >
                                                    <EyeIcon className="w-4.5 h-4.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={6} className="py-32 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Tidak ada pengajuan dalam daftar</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL AUDIT (WITH SOP) */}
                {selectedClaim && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <div className="bg-white dark:bg-[#0B1121] w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                            
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0B1121]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                                        <ClipboardDocumentCheckIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-800 dark:text-white uppercase leading-none">Audit Identitas Digital</h3>
                                        <p className="text-[10px] font-bold text-indigo-600 mt-2 uppercase tracking-widest">ID: {selectedClaim.targetId}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedClaim(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><XCircleIcon className="w-8 h-8" /></button>
                            </div>

                            {/* SOP CARDS FOR ADMIN */}
                            <div className="px-8 py-4 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30 flex items-center gap-4">
                                <InfoIcon className="w-5 h-5 text-amber-600 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest leading-none">Instruksi Verifikasi (SOP):</p>
                                    <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-1 font-medium">Bandingkan Nama di Akun (Kiri) dengan Nama Terdaftar di Database (Kanan). Pastikan status profil belum diklaim orang lain.</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {auditLoading ? (
                                    <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Kiri: Data Pengaju */}
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><UserIcon className="w-4 h-4" /> 1. Identitas Akun User</h4>
                                            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4 shadow-inner">
                                                <AuditField label="Nama Pengguna" value={selectedClaim.userName} />
                                                <AuditField label="Alamat Email" value={selectedClaim.userEmail} />
                                                <AuditField label="Auth UID" value={selectedClaim.userId} isMono />
                                            </div>
                                        </div>

                                        {/* Kanan: Data Master Database */}
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BuildingLibraryIcon className="w-4 h-4" /> 2. Referensi Database Sekolah</h4>
                                            {masterData ? (
                                                <div className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/50 space-y-4 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4"><SparklesIcon className="w-12 h-12 text-emerald-500 opacity-20" /></div>
                                                    <AuditField label="Nama Di Database" value={masterData.namaLengkap || masterData.name} highlight={selectedClaim.userName.toLowerCase() === (masterData.namaLengkap || masterData.name).toLowerCase()} />
                                                    <AuditField label="Status Kepemilikan" value={masterData.isClaimed ? 'SUDAH TERKUNCI' : 'TERSEDIA UNTUK KLAIM'} warning={masterData.isClaimed} />
                                                    
                                                    {masterData.isClaimed && (
                                                        <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 rounded-2xl flex items-start gap-3">
                                                            <ShieldExclamationIcon className="w-5 h-5 text-rose-600 mt-0.5" />
                                                            <div className="flex-1">
                                                                <p className="text-[9px] font-bold text-rose-700 uppercase">Perhatian: Profil ini sudah dimiliki akun lain!</p>
                                                                <p className="text-[8px] font-mono text-rose-600 mt-1 break-all">Linked AuthUID: {masterData.authUid || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="p-10 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] border border-rose-100 text-center flex flex-col items-center gap-3">
                                                    <XCircleIcon className="w-12 h-12 text-rose-500 opacity-30" />
                                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest italic">ID Tidak Ditemukan di Master</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Toolbar Aksi */}
                            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1121] flex flex-col md:flex-row gap-4 items-center">
                                <div className="flex-1 w-full flex gap-3">
                                    <button 
                                        disabled={!!processingId}
                                        onClick={() => setIsRejectModalOpen(true)}
                                        className="flex-1 py-4.5 bg-white dark:bg-slate-800 text-rose-600 font-black rounded-[2rem] border border-rose-100 text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        <XCircleIcon className="w-5 h-5" /> Tolak Pengajuan
                                    </button>
                                    <button 
                                        disabled={!!processingId || !masterData || masterData.isClaimed}
                                        onClick={handleApprove}
                                        className="flex-[1.5] py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-[2rem] text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {processingId === selectedClaim.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircleIcon className="w-5 h-5" />}
                                        Validasi & Hubungkan Akun
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL ALASAN TOLAK */}
                {isRejectModalOpen && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <div className="bg-white dark:bg-[#0B1121] w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-in zoom-in duration-300 border border-white/10">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-2">Alasan Penolakan</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6">Pesan ini akan dikirim ke user melalui sistem</p>
                            <textarea 
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Contoh: Nama tidak sesuai dengan data NISN..."
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-[1.8rem] p-5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none h-32 resize-none shadow-inner"
                            />
                            <div className="flex gap-3 mt-8">
                                <button onClick={() => setIsRejectModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest">Batal</button>
                                <button onClick={handleRejectSubmit} className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-500/20">Kirim Penolakan</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

const AuditField = ({ label, value, isMono = false, highlight = false, warning = false }: any) => (
    <div className="space-y-1.5">
        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <div className={`px-4 py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-between ${
            highlight ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
            warning ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse' :
            'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm'
        }`}>
            <span className={isMono ? 'font-mono' : ''}>{value}</span>
            {highlight && <CheckCircleIcon className="w-3.5 h-3.5" />}
            {warning && <ShieldExclamationIcon className="w-3.5 h-3.5" />}
        </div>
    </div>
);

export default ClaimManagement;
