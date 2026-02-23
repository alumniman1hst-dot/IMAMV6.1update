/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 * Developed by: Akhmad Arifin (Lead Developer & System Architect)
 * NIP: 19901004 202521 1012
 * Role: Fullstack & UI/UX Engineer
 * Description: Mengembangkan solusi teknologi pendidikan untuk efisiensi dan transparansi manajemen madrasah.
 * Copyright (c) 2025 MAN 1 Hulu Sungai Tengah. All rights reserved.
 */

import React from 'react';
import Layout from './Layout';
import { 
  SparklesIcon, CheckCircleIcon, XCircleIcon, 
  PhoneIcon, RobotIcon, CloudIcon, ShieldCheckIcon, 
  BanknotesIcon 
} from './Icons';
import { toast } from 'sonner';

interface PremiumProps {
  onBack: () => void;
}

const Premium: React.FC<PremiumProps> = ({ onBack }) => {
  const handleSubscribe = (plan: string) => {
    toast.success(`Permintaan langganan paket ${plan} terkirim! Tim sales akan menghubungi Anda.`);
  };

  const features = [
    {
      title: "Notifikasi WhatsApp",
      desc: "Kirim info kehadiran dan pengumuman langsung ke WA Wali Murid secara otomatis.",
      icon: PhoneIcon,
      color: "bg-green-500",
      premium: true
    },
    {
      title: "AI Assistant Unlimited",
      desc: "Generate RPP, Soal Ujian, dan Analisis Data tanpa batas kuota harian.",
      icon: RobotIcon,
      color: "bg-rose-500",
      premium: true
    },
    {
      title: "Cloud Backup Harian",
      desc: "Data sekolah aman dengan backup otomatis setiap hari ke server cloud.",
      icon: CloudIcon, 
      color: "bg-blue-500",
      premium: true
    },
    {
      title: "Custom Branding",
      desc: "Ganti logo aplikasi, warna tema, dan domain sesuai identitas sekolah.",
      icon: SparklesIcon,
      color: "bg-purple-500",
      premium: true
    },
    {
      title: "Prioritas Support 24/7",
      desc: "Jalur khusus bantuan teknis via WhatsApp dan Telepon.",
      icon: ShieldCheckIcon,
      color: "bg-orange-500",
      premium: true
    }
  ];

  const CloudIconLocal = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
    </svg>
  );

  return (
    <Layout
      title="Layanan Premium"
      subtitle="Upgrade Fitur Sekolah Digital"
      icon={SparklesIcon}
      onBack={onBack}
    >
      <div className="p-4 lg:p-6 pb-24 space-y-8">
        
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>
            
            <div className="relative p-8 z-10 text-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                    <SparklesIcon className="w-8 h-8 text-yellow-400" />
                </div>
                <h2 className="text-2xl font-black mb-2 tracking-tight">IMAM <span className="text-yellow-400">PRO</span></h2>
                <p className="text-indigo-200 text-sm max-w-sm mx-auto leading-relaxed">
                    Buka potensi penuh sekolah Anda dengan fitur canggih untuk efisiensi maksimal.
                </p>
            </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Basic Plan */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Starter</h3>
                <div className="flex items-baseline gap-1 mt-2 mb-4">
                    <span className="text-3xl font-black text-slate-800 dark:text-white">Gratis</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 min-h-[40px]">
                    Fitur dasar untuk manajemen sekolah kecil dan menengah.
                </p>
                <div className="space-y-3 mb-8">
                    {['Data Siswa & Guru', 'Presensi QR Code', 'Laporan Dasar', 'Manajemen Kelas'].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <CheckCircleIcon className="w-4 h-4 text-green-500" /> {item}
                        </div>
                    ))}
                    {['Notifikasi WhatsApp', 'AI Unlimited', 'Custom Branding'].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-600">
                            <XCircleIcon className="w-4 h-4" /> {item}
                        </div>
                    ))}
                </div>
                <button className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm cursor-default">
                    Paket Saat Ini
                </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-indigo-500 relative overflow-hidden shadow-lg shadow-indigo-500/10">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                    Paling Laris
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                    Professional <SparklesIcon className="w-4 h-4 text-yellow-500" />
                </h3>
                
                {/* Price section removed as requested */}
                <div className="mt-2 mb-4 h-[44px] flex items-center">
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Premium Access</p>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 min-h-[40px]">
                    Solusi lengkap untuk sekolah modern dengan integrasi WA & AI.
                </p>
                <div className="space-y-3 mb-8">
                    {['Semua Fitur Starter', 'Notifikasi WhatsApp Ortu', 'AI Asisten Unlimited', 'Export Laporan Lengkap', 'Prioritas Support'].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 font-medium">
                            <CheckCircleIcon className="w-4 h-4 text-indigo-500" /> {item}
                        </div>
                    ))}
                </div>
                <button 
                    onClick={() => handleSubscribe('Professional')}
                    className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 flex items-center justify-center gap-2"
                >
                    <BanknotesIcon className="w-4 h-4" /> Langganan Sekarang
                </button>
            </div>

        </div>

        {/* Features Detail */}
        <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Fitur Unggulan</h3>
            <div className="grid grid-cols-1 gap-3">
                {features.map((feat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 ${feat.color} shadow-md`}>
                            {feat.title === "Cloud Backup Harian" ? <CloudIconLocal className="w-6 h-6" /> : <feat.icon className="w-6 h-6" />}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                {feat.title}
                                {feat.premium && <span className="text-[9px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-1.5 py-0.5 rounded uppercase font-bold">Pro</span>}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                {feat.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </Layout>
  );
};

export default Premium;