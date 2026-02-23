
import React from 'react';
import { UserRole } from '../types';
import { ShieldCheckIcon, HomeIcon, LockIcon } from './Icons';

interface ProtectedRouteProps {
  children: React.ReactNode;
  userRole: UserRole;
  allowedRoles: UserRole[];
  onBack: () => void; // Usually redirects to Dashboard
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  userRole, 
  allowedRoles, 
  onBack 
}) => {
  // 1. Check if user has permission
  const isAllowed = allowedRoles.includes(userRole);

  // 2. If allowed, render the content (children)
  if (isAllowed) {
    return <>{children}</>;
  }

  // 3. If NOT allowed, render "Access Denied" screen
  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-900 transition-colors">
        {/* Simple Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm p-4 pt-8 flex items-center justify-center z-10 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                IMAM Security
                <ShieldCheckIcon className="w-5 h-5 text-indigo-500" />
            </h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50/50 dark:ring-red-900/10">
                <LockIcon className="w-10 h-10 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                Akses Ditolak
            </h1>
            
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs leading-relaxed mb-8">
                Maaf, peran Anda <strong>({userRole})</strong> tidak memiliki izin untuk mengakses halaman ini.
            </p>

            <button 
                onClick={onBack}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95"
            >
                <HomeIcon className="w-4 h-4" />
                Kembali ke Dashboard
            </button>
        </div>
    </div>
  );
};

export default ProtectedRoute;
