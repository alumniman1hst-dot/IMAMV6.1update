
import React from 'react';
import { ImamLogo, InfoIcon } from './Icons';
import Layout from './Layout';

interface GenericViewProps {
  title: string;
  onBack: () => void;
  description?: string;
}

const GenericView: React.FC<GenericViewProps> = ({ title, onBack, description }) => {
  return (
    <Layout 
      title={title} 
      subtitle="Modul IMAM" 
      icon={InfoIcon} 
      onBack={onBack}
    >
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center text-slate-400 dark:text-slate-500">
        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Fitur {title}</h3>
        <p className="max-w-xs mx-auto text-sm leading-relaxed mb-8">
          {description || "Halaman ini aktif dan siap untuk pengembangan lebih lanjut sesuai kebutuhan spesifik sekolah."}
        </p>
        <button onClick={onBack} className="px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
            Kembali ke Dashboard
        </button>
      </div>
    </Layout>
  );
};

export default GenericView;
