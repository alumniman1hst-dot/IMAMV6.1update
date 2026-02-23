import React, { useState, useEffect, useMemo } from 'react';
import Layout from './Layout';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  EnvelopeIcon, 
  BanknotesIcon, 
  Loader2,
  HeartIcon
} from './Icons';
import { db, auth, isMockMode } from '../services/firebase';
import { UserRole } from '../types';

interface HistoryProps {
  onBack: () => void;
  userRole: UserRole;
}

interface HistoryItem {
    id: string;
    type: 'attendance' | 'letter' | 'payment' | 'haid';
    date: string; // ISO string
    title: string;
    subtitle: string;
    status: 'success' | 'pending' | 'warning' | 'error' | 'haid';
    amount?: string;
    meta?: any;
}

const History: React.FC<HistoryProps> = ({ onBack, userRole }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'attendance' | 'letter' | 'payment'>('all');

  // Helper untuk format Rupiah
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const uid = auth?.currentUser?.uid || (isMockMode ? 'user-1' : '');
        const isAdminOrStaff = userRole === UserRole.ADMIN || userRole === UserRole.STAF_TU || userRole === UserRole.KEPALA_MADRASAH || userRole === UserRole.GURU;

        const allItems: HistoryItem[] = [];

        // 1. MODE MOCK (DATA DUMMY)
        if (isMockMode) {
            setTimeout(() => {
                // Mock Payments
                allItems.push(
                    { id: 'pay-1', type: 'payment', date: new Date().toISOString(), title: 'SPP Bulan Mei', subtitle: 'Pembayaran Via Transfer', status: 'success', amount: 'Rp 150.000' },
                    { id: 'pay-2', type: 'payment', date: new Date(Date.now() - 86400000 * 15).toISOString(), title: 'Uang Seragam', subtitle: 'Cicilan 1', status: 'success', amount: 'Rp 300.000' }
                );
                // Mock Attendance
                allItems.push(
                    { id: 'att-1', type: 'attendance', date: new Date().toISOString(), title: 'Absensi Masuk', subtitle: '07:15 - Tepat Waktu', status: 'success' },
                    { id: 'att-h', type: 'haid', date: new Date().toISOString(), title: 'Ibadah (Mode Haid)', subtitle: 'Pencatatan Khusus Siswi', status: 'haid' },
                    { id: 'att-2', type: 'attendance', date: new Date(Date.now() - 86400000).toISOString(), title: 'Absensi Pulang', subtitle: '16:00 - Selesai', status: 'success' }
                );
                // Mock Letters
                allItems.push(
                    { id: 'let-1', type: 'letter', date: new Date(Date.now() - 86400000 * 2).toISOString(), title: 'Surat Keterangan Aktif', subtitle: 'Menunggu Persetujuan', status: 'pending' }
                );
                
                setItems(allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                setLoading(false);
            }, 800);
            return;
        }

        // 2. MODE REAL (FIRESTORE)
        if (!db) {
            setLoading(false);
            return;
        }

        try {
            const promises = [];

            // A. QUERY ATTENDANCE (Kehadiran)
            let attQuery = db.collection('attendance').orderBy('date', 'desc').limit(20);
            promises.push(attQuery.get().then(snap => {
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    // Filter sisi klien untuk keamanan sederhana di view list campuran
                    if (!isAdminOrStaff && data.studentId !== uid && data.userId !== uid) return;

                    const isHaidStatus = data.status === 'Haid';

                    allItems.push({
                        id: doc.id,
                        type: isHaidStatus ? 'haid' : 'attendance',
                        date: data.date + (data.checkIn ? 'T' + data.checkIn : ''), // Combine date+time estimate
                        title: isHaidStatus ? `Ibadah: ${data.studentName || 'Siswa'} (Haid)` : (data.status === 'Hadir' ? `Hadir: ${data.studentName || 'Siswa'}` : `${data.status}: ${data.studentName}`),
                        subtitle: isHaidStatus ? 'Tercatat dalam Mode Haid' : (data.checkIn ? `Masuk Pukul ${data.checkIn.substring(0,5)}` : 'Tidak ada data jam'),
                        status: isHaidStatus ? 'haid' : (data.status === 'Hadir' ? 'success' : data.status === 'Terlambat' ? 'warning' : 'error')
                    });
                });
            }));

            // B. QUERY LETTERS (Surat)
            let letQuery = db.collection('letters').orderBy('date', 'desc').limit(20);
            if (!isAdminOrStaff) {
                letQuery = letQuery.where('userId', '==', uid);
            }
            promises.push(letQuery.get().then(snap => {
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    let status: HistoryItem['status'] = 'pending';
                    
                    // Map LetterStatus to HistoryItem['status']
                    if (data.status === 'Signed' || data.status === 'Selesai') status = 'success';
                    else if (data.status === 'Ditolak') status = 'error';
                    else if (data.status === 'Verified' || data.status === 'Validated' || data.status === 'Diproses') status = 'warning';
                    
                    allItems.push({
                        id: doc.id,
                        type: 'letter',
                        date: data.date,
                        title: data.type,
                        subtitle: `${data.userName} • ${data.status}`,
                        status: status
                    });
                });
            }));

            // C. QUERY PAYMENTS (Pembayaran)
            let payQuery = db.collection('payments').limit(20); 
            promises.push(payQuery.get().then(snap => {
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    if (!isAdminOrStaff && auth?.currentUser?.displayName && data.studentName !== auth.currentUser.displayName) return;

                    let status: HistoryItem['status'] = 'success';
                    if (data.status === 'Belum Lunas' || data.status === 'Pending') status = 'warning';
                    if (data.status === 'Gagal') status = 'error';

                    allItems.push({
                        id: doc.id,
                        type: 'payment',
                        date: data.date || new Date().toISOString(), 
                        title: `${data.type} (${data.month || '-'})`,
                        subtitle: data.studentName,
                        status: status,
                        amount: data.amount ? formatRupiah(data.amount) : 'Rp 0'
                    });
                });
            }));

            await Promise.all(promises);

            // Sort Gabungan berdasarkan tanggal (Terbaru di atas)
            allItems.sort((a, b) => {
                const dateA = new Date(a.date).getTime() || 0;
                const dateB = new Date(b.date).getTime() || 0;
                return dateB - dateA;
            });

            setItems(allItems);

        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [userRole]);

  const filteredItems = useMemo(() => {
      if (activeTab === 'all') return items;
      // Filter attendance includes haid records for attendance tab
      if (activeTab === 'attendance') return items.filter(i => i.type === 'attendance' || i.type === 'haid');
      return items.filter(i => i.type === activeTab);
  }, [items, activeTab]);

  const getIcon = (type: string, status: string) => {
      if (status === 'haid' || type === 'haid') return <HeartIcon className="w-5 h-5 text-rose-600 fill-current" />;
      if (type === 'payment') return <BanknotesIcon className="w-5 h-5 text-emerald-600" />;
      if (type === 'letter') return <EnvelopeIcon className="w-5 h-5 text-blue-600" />;
      // Attendance
      if (status === 'success') return <CheckCircleIcon className="w-5 h-5 text-teal-600" />;
      if (status === 'warning') return <ClockIcon className="w-5 h-5 text-orange-600" />;
      return <XCircleIcon className="w-5 h-5 text-red-600" />;
  };

  const getBgColor = (type: string, status: string) => {
      if (status === 'haid' || type === 'haid') return 'bg-rose-50 dark:bg-rose-900/20';
      if (type === 'payment') return 'bg-emerald-50 dark:bg-emerald-900/20';
      if (type === 'letter') return 'bg-blue-50 dark:bg-blue-900/20';
      if (status === 'success') return 'bg-teal-50 dark:bg-teal-900/20';
      if (status === 'warning') return 'bg-orange-50 dark:bg-orange-900/20';
      return 'bg-red-50 dark:bg-red-900/20';
  };

  return (
    <Layout
      title="Riwayat Transaksi"
      subtitle="Kehadiran, Surat & Pembayaran"
      icon={ClockIcon}
      onBack={onBack}
    >
      <div className="p-4 lg:p-6 pb-24">
        
        {/* Tab Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {[
                { id: 'all', label: 'Semua' },
                { id: 'attendance', label: 'Kehadiran' },
                { id: 'payment', label: 'Pembayaran' },
                { id: 'letter', label: 'Surat & Izin' },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                        activeTab === tab.id 
                        ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900' 
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        {/* Timeline List */}
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p className="text-sm">Memuat data riwayat...</p>
            </div>
        ) : filteredItems.length > 0 ? (
            <div className="space-y-4">
                {filteredItems.map((item, index) => {
                    let dateStr = '-';
                    let timeStr = '';
                    try {
                        const dateObj = new Date(item.date);
                        if (!isNaN(dateObj.getTime())) {
                            dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                            // Only show time if strictly available in ISO string or appended
                            if (item.date.includes('T') || item.date.includes(':')) {
                                timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                            }
                        }
                    } catch (e) {}
                    
                    return (
                        <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                            {/* Icon Box */}
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getBgColor(item.type, item.status)}`}>
                                {getIcon(item.type, item.status)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1 uppercase tracking-tight">
                                        {item.title}
                                    </h4>
                                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">
                                        {dateStr}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end mt-0.5">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">
                                        {item.subtitle}
                                    </p>
                                    {timeStr && (item.type === 'attendance' || item.type === 'haid') && (
                                        <span className="text-[10px] font-mono text-slate-400">{timeStr}</span>
                                    )}
                                </div>
                                
                                {item.amount && (
                                    <div className="mt-2 inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/10 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20">
                                        {item.amount}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <ClockIcon className="w-6 h-6" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">Belum ada riwayat tercatat.</p>
            </div>
        )}

      </div>
    </Layout>
  );
};

export default History;