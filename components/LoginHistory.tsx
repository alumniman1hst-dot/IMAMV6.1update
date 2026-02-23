
import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { ShieldCheckIcon, ClockIcon, Loader2, CommandLineIcon } from './Icons';
import { getLoginHistory } from '../services/historyService';
import { auth, isMockMode } from '../services/firebase';
import { LoginHistoryEntry } from '../types';

interface LoginHistoryProps {
  onBack: () => void;
}

const LoginHistory: React.FC<LoginHistoryProps> = ({ onBack }) => {
  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      let uid = 'mock-user-123';
      if (!isMockMode && auth?.currentUser) {
        uid = auth.currentUser.uid;
      }
      
      const data = await getLoginHistory(uid);
      setHistory(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <Layout
      title="Riwayat Login"
      subtitle="Aktivitas Masuk Akun"
      icon={ShieldCheckIcon}
      onBack={onBack}
    >
      <div className="p-4 lg:p-6 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm font-medium">Memuat riwayat...</p>
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-4 flex gap-3 items-start">
               <ShieldCheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
               <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                 Berikut adalah daftar aktivitas login terakhir ke akun Anda. Jika Anda melihat perangkat yang tidak dikenal, segera ubah kata sandi Anda.
               </p>
            </div>

            {history.map((entry) => (
              <div 
                key={entry.id} 
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${entry.status === 'Success' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                    <CommandLineIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                        {entry.device}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {entry.ip || 'IP Hidden'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500">
                            {entry.status}
                        </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-end gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {formatDate(entry.timestamp).split(',')[1]}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatDate(entry.timestamp).split(',')[0]}
                    </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <ShieldCheckIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">Belum ada riwayat login tercatat.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LoginHistory;
