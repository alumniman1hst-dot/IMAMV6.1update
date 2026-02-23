
import React, { useState } from 'react';
import { ArrowRightIcon, ArrowTrendingUpIcon, CheckCircleIcon } from './Icons';

interface ClassPromotionProps {
  onBack: () => void;
}

const ClassPromotion: React.FC<ClassPromotionProps> = ({ onBack }) => {
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handlePromote = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setCompleted(true);
    }, 2000);
  };

  if (completed) {
    return (
      <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-900 items-center justify-center p-8 transition-colors">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <CheckCircleIcon className="w-12 h-12 text-green-600 dark:text-green-400 animate-checkmark" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-2">Proses Berhasil!</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-8">Semua siswa yang memenuhi syarat telah dinaikkan ke tingkat berikutnya.</p>
        <button 
          onClick={onBack}
          className="w-full bg-slate-900 dark:bg-slate-700 text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-900 transition-colors">
      <div className="bg-white dark:bg-slate-800 shadow-sm p-4 pt-8 flex items-center gap-4 z-10 sticky top-0 border-b border-slate-100 dark:border-slate-700">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
        </button>
        <div>
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Kenaikan Kelas <ArrowTrendingUpIcon className="w-5 h-5 text-fuchsia-500" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Tahun Ajaran 2023/2024</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 border border-fuchsia-100 dark:border-fuchsia-900/30 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-fuchsia-800 dark:text-fuchsia-300 text-lg mb-2">Ringkasan Kenaikan</h3>
          <div className="space-y-3">
             <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Total Siswa</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">842</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Memenuhi Syarat</span>
                <span className="font-bold text-green-600 dark:text-green-400">810</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Perlu Tinjauan</span>
                <span className="font-bold text-orange-500 dark:text-orange-400">32</span>
             </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
           <h3 className="font-bold text-slate-700 dark:text-slate-300">Aksi Massal</h3>
           <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-colors">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                 <span className="font-bold text-slate-500 dark:text-slate-400">X</span>
              </div>
              <div className="flex-1">
                 <div className="font-bold text-slate-800 dark:text-slate-200">Kelas X &rarr; XI</div>
                 <div className="text-xs text-slate-500 dark:text-slate-400">280 Siswa</div>
              </div>
              <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>
           </div>
           <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-colors">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                 <span className="font-bold text-slate-500 dark:text-slate-400">XI</span>
              </div>
              <div className="flex-1">
                 <div className="font-bold text-slate-800 dark:text-slate-200">Kelas XI &rarr; XII</div>
                 <div className="text-xs text-slate-500 dark:text-slate-400">275 Siswa</div>
              </div>
              <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>
           </div>
        </div>

        <button 
          onClick={handlePromote}
          disabled={processing}
          className="w-full bg-fuchsia-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-fuchsia-200 dark:shadow-none hover:bg-fuchsia-700 transition-all flex items-center justify-center"
        >
          {processing ? (
             <span className="flex items-center gap-2">
               <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
               Memproses...
             </span>
          ) : (
             <span className="flex items-center">
               Proses Kenaikan Kelas <ArrowRightIcon className="w-5 h-5 ml-2" />
             </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ClassPromotion;
