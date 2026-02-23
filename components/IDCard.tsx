
import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { db, auth, isMockMode } from '../services/firebase';
import { UserIcon, ArrowPathIcon, QrCodeIcon, ImamLogo } from './Icons';

interface IDCardProps {
  onBack: () => void;
}

interface StudentCardData {
  nama: string;
  nisn: string;
  idUnik?: string; 
  rombel: string;
  ttl: string;
  alamat: string;
  foto?: string;
}

const IDCard: React.FC<IDCardProps> = ({ onBack }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentCardData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        if (isMockMode) {
            setTimeout(() => {
                setData({
                    nama: "DIENDE ADELLYA AQILLA",
                    nisn: "0086806447",
                    idUnik: "15012", 
                    rombel: "XII A",
                    ttl: "HST, 30 Mei 2008",
                    alamat: "Jl. Perintis Kemerdekaan"
                });
                setLoading(false);
            }, 800);
            return;
        }

        if (auth && auth.currentUser && db) {
            try {
                const userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    setData({
                        nama: userData?.displayName || auth.currentUser.displayName || "Siswa",
                        nisn: userData?.nisn || "-",
                        idUnik: userData?.idUnik || "00000", // Hanya gunakan idUnik tanpa cadangan NISN
                        rombel: userData?.tingkatRombel || userData?.class || "-",
                        ttl: "-", 
                        alamat: userData?.address || "-"
                    });
                }
            } catch (e) { console.error(e); }
        }
        setLoading(false);
    };
    fetchData();
  }, []);

  const cardContainerStyle = {
      perspective: '1200px',
  };

  const innerStyle = {
      transformStyle: 'preserve-3d' as const,
      transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  };

  const sideStyle = {
      backfaceVisibility: 'hidden' as const,
      WebkitBackfaceVisibility: 'hidden' as const,
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
  };

  // Hanya gunakan idUnik untuk QR Code
  const qrValue = data?.idUnik || "0";

  return (
    <Layout title="ID Digital" subtitle="Kartu Identitas Terintegrasi" icon={QrCodeIcon} onBack={onBack}>
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-slate-100 dark:bg-slate-950 min-h-full">
        
        {/* Scale Wrapper for Small Screens */}
        <div className="w-full max-w-[420px] scale-[0.85] xs:scale-100 transition-transform origin-center" style={cardContainerStyle}>
            <div 
                className="relative w-full aspect-[1.586/1] cursor-pointer drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
                style={innerStyle}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                {/* FRONT SIDE */}
                <div className="bg-white rounded-[1.5rem] overflow-hidden flex flex-col border border-white/40 shadow-inner" style={sideStyle}>
                    <div className="h-[26%] bg-indigo-700 relative overflow-hidden flex items-center px-5 gap-3">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" style={{ backgroundSize: '12px 12px' }}></div>
                        <div className="text-white z-10">
                            <h3 className="text-[8px] font-black tracking-[0.3em] uppercase opacity-70 leading-none mb-1">Madrasah Aliyah Negeri 1</h3>
                            <h1 className="text-[11px] font-black leading-none uppercase tracking-wider">Hulu Sungai Tengah</h1>
                        </div>
                    </div>

                    <div className="flex-1 p-5 flex gap-5 relative bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-white">
                        {/* Profile Picture */}
                        <div className="w-[30%] aspect-[3/4] bg-slate-100 rounded-2xl border border-slate-200/50 flex items-center justify-center shrink-0 overflow-hidden relative self-center shadow-xl ring-4 ring-white">
                            {data?.foto ? (
                                <img src={data.foto} alt="Foto" className="w-full h-full object-cover" />
                            ) : (
                                <div className="bg-slate-50 w-full h-full flex items-center justify-center"><UserIcon className="w-14 h-14 text-slate-200" /></div>
                            )}
                            <div className="absolute bottom-0 w-full bg-indigo-600/95 text-white text-[7px] font-black text-center py-1.5 tracking-[0.2em] uppercase">SISWA</div>
                        </div>

                        {/* Student Details */}
                        <div className="flex-1 flex flex-col justify-center gap-2 min-w-0">
                            {loading ? (
                                <div className="space-y-2 animate-pulse"><div className="h-4 bg-slate-100 rounded w-full"></div><div className="h-3 bg-slate-50 rounded w-2/3"></div></div>
                            ) : (
                                <>
                                    <div className="mb-1">
                                        <p className="text-[7px] text-indigo-500 uppercase font-black tracking-widest leading-none mb-1">Nama Lengkap</p>
                                        <h2 className="text-[13px] font-black text-slate-800 leading-tight uppercase truncate">{data?.nama}</h2>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/50">
                                            <p className="text-[6px] text-indigo-400 uppercase font-black tracking-widest leading-none mb-1">ID Lokal</p>
                                            <p className="text-[12px] font-mono font-black text-indigo-700 leading-none">{data?.idUnik}</p>
                                        </div>
                                        <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                                            <p className="text-[6px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">Rombel</p>
                                            <p className="text-[12px] font-black text-slate-700 leading-none tracking-tight">{data?.rombel}</p>
                                        </div>
                                    </div>
                                    <div className="mt-auto flex justify-between items-end">
                                        <div className="text-[6px] text-slate-400 font-bold uppercase tracking-widest italic opacity-60">Digital Integrated Student ID</div>
                                        <div className="bg-white p-1 rounded-xl shadow-lg border border-slate-100 transform hover:scale-110 transition-transform">
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrValue}`} className="w-12 h-12 mix-blend-multiply opacity-80" alt="QR" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="h-1.5 bg-indigo-600 w-full shadow-[0_-2px_10px_rgba(79,70,229,0.2)]"></div>
                </div>

                {/* BACK SIDE */}
                <div className="bg-white rounded-[1.5rem] overflow-hidden flex flex-col border border-white/40 p-6" style={{ ...sideStyle, transform: 'rotateY(180deg)' }}>
                    <div className="flex flex-col items-center flex-1">
                        <div className="w-12 h-12 mb-4 opacity-10"><ImamLogo className="w-full h-full text-slate-900" /></div>
                        <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.3em] mb-4">Ketentuan Penggunaan</h3>
                        <ul className="text-[8px] text-slate-500 list-disc ml-5 space-y-2.5 font-bold uppercase tracking-wider leading-relaxed">
                            <li>Wajib ditunjukkan saat presensi mandiri.</li>
                            <li>ID Lokal bersifat unik dan permanen.</li>
                            <li>Penyalahgunaan data dikenakan sanksi akademik.</li>
                            <li>Gunakan kartu untuk akses fasilitas perpustakaan.</li>
                        </ul>
                    </div>
                    <div className="mt-6 flex flex-col items-center">
                        <div className="w-24 border-b border-slate-100 mb-2"></div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sekretariat MAN 1 HST</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-12 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full border border-black/5 dark:border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status: Aktif</span>
            </div>
            <button 
                onClick={() => setIsFlipped(!isFlipped)}
                className="flex items-center justify-center gap-3 mx-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all font-black text-[10px] uppercase tracking-[0.3em] active:scale-95"
            >
                <ArrowPathIcon className="w-4 h-4" /> Balik Kartu
            </button>
        </div>

      </div>
    </Layout>
  );
};

export default IDCard;
