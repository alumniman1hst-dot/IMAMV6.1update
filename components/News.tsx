import React, { useState } from 'react';
import Layout from './Layout';
import { MegaphoneIcon, CalendarIcon, ArrowRightIcon, UserIcon, StarIcon, Squares2x2Icon, RectangleStackIcon } from './Icons';

interface NewsProps {
  onBack: () => void;
}

const News: React.FC<NewsProps> = ({ onBack }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Data Berita Simulasi
  const newsItems = [
    {
      id: 1,
      title: "Penerimaan Peserta Didik Baru (PPDB) 2024",
      date: "20 Mei 2024",
      author: "Panitia PPDB",
      category: "Pengumuman",
      summary: "Informasi lengkap mengenai jadwal, syarat, dan jalur pendaftaran siswa baru tahun ajaran 2024/2025. Segera persiapkan berkas Anda.",
      color: "bg-blue-500"
    },
    {
      id: 2,
      title: "Prestasi Gemilang Tim Olimpiade Fisika",
      date: "15 Mei 2024",
      author: "Kesiswaan",
      category: "Prestasi",
      summary: "Selamat kepada tim Olimpiade Fisika MAN 1 HST yang berhasil meraih medali perak di tingkat provinsi dan melaju ke nasional.",
      color: "bg-yellow-500"
    },
    {
      id: 3,
      title: "Jadwal Ujian Akhir Semester Genap",
      date: "10 Mei 2024",
      author: "Kurikulum",
      category: "Akademik",
      summary: "Pelaksanaan UAS akan dimulai pada tanggal 3 Juni 2024. Siswa diharapkan menyelesaikan seluruh tugas sebelum masa tenang.",
      color: "bg-emerald-500"
    },
    {
      id: 4,
      title: "Kegiatan Pesantren Kilat Ramadhan",
      date: "1 April 2024",
      author: "Humas",
      category: "Kegiatan",
      summary: "Dokumentasi kegiatan pesantren kilat yang diikuti seluruh siswa selama bulan suci Ramadhan untuk memperdalam ilmu agama.",
      color: "bg-purple-500"
    }
  ];

  return (
    <Layout
      title="Berita Sekolah"
      subtitle="Informasi & Pengumuman Terkini"
      icon={MegaphoneIcon}
      onBack={onBack}
    >
      <div className="p-4 lg:p-6 pb-24 space-y-8">
        
        {/* Featured Card (Berita Utama) */}
        <div className="relative overflow-hidden rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 group cursor-pointer transform transition-all duration-500 hover:scale-[1.01]">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-fuchsia-500/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
            
            <div className="relative p-6 lg:p-8 z-10">
                <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold border border-white/10 shadow-sm">
                        <StarIcon className="w-3 h-3 text-yellow-300" />
                        Sorotan Utama
                    </span>
                    <span className="text-xs font-medium text-indigo-100 opacity-80">Baru saja diterbitkan</span>
                </div>
                
                <h2 className="text-2xl lg:text-3xl font-bold mb-3 leading-tight tracking-tight">
                    Peluncuran Sistem Manajemen Sekolah Digital "IMAM" v2.0
                </h2>
                
                <p className="text-indigo-100 text-sm lg:text-base mb-8 max-w-xl leading-relaxed opacity-90">
                    Transformasi digital MAN 1 Hulu Sungai Tengah dimulai hari ini. Aplikasi terintegrasi untuk guru, siswa, dan wali murid kini hadir dengan fitur AI canggih.
                </p>
                
                <button className="flex items-center gap-2 text-sm font-bold bg-white text-indigo-600 px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg active:scale-95 group-hover:shadow-white/20">
                    Baca Selengkapnya <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>

        {/* News List Section */}
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                    <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                    Berita Terbaru
                </h3>

                {/* View Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        <Squares2x2Icon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        <RectangleStackIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-5" : "flex flex-col gap-3"}>
                {newsItems.map((item) => (
                    <div 
                        key={item.id}
                        className={`news-card rounded-[1.5rem] border shadow-sm group transition-all duration-300 ease-out cursor-pointer relative overflow-hidden ${viewMode === 'list' ? 'flex items-center p-3 hover:-translate-x-1' : 'p-5 hover:-translate-y-1.5'}`}
                    >
                        {/* Side Color Bar */}
                        <div className={`absolute top-0 left-0 ${viewMode === 'list' ? 'w-1 h-full' : 'w-1.5 h-full'} ${item.color}`}></div>
                        
                        {viewMode === 'grid' ? (
                            /* --- GRID LAYOUT --- */
                            <>
                                {/* Header: Category & Date */}
                                <div className="flex justify-between items-start mb-3 pl-3">
                                    <span className="news-card-badge text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide">
                                        {item.category}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                                        <CalendarIcon className="w-3 h-3" /> {item.date}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="pl-3">
                                    <h4 className="news-card-title text-base font-bold mb-2 transition-colors line-clamp-2 leading-snug">
                                        {item.title}
                                    </h4>
                                    
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">
                                        {item.summary}
                                    </p>

                                    {/* Footer: Author & Action */}
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-700/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-600">
                                                <UserIcon className="w-3 h-3" />
                                            </div>
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{item.author}</span>
                                        </div>
                                        <div className="news-card-action w-8 h-8 rounded-full flex items-center justify-center transition-all">
                                            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* --- LIST LAYOUT --- */
                            <div className="flex-1 flex items-center justify-between pl-3 pr-2 gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="news-card-badge text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                            {item.category}
                                        </span>
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            • {item.date}
                                        </span>
                                    </div>
                                    <h4 className="news-card-title text-sm font-bold transition-colors truncate">
                                        {item.title}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                        Oleh: {item.author}
                                    </p>
                                </div>
                                <div className="news-card-action w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0">
                                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default News;