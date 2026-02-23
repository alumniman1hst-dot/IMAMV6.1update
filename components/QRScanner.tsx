
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { recordAttendanceByScan, AttendanceSession } from '../services/attendanceService';
import Layout from './Layout';
import { 
  CheckCircleIcon, XCircleIcon, CameraIcon, 
  ClockIcon, SunIcon, ArrowPathIcon, 
  HeartIcon
} from './Icons';
import { toast } from 'sonner';

interface QRScannerProps {
  onBack: () => void;
}

interface NotificationItem {
  id: string;
  name: string;
  idUnik: string;
  className: string;
  status: 'success' | 'error' | 'warning' | 'haid';
  message: string;
}

const QRScanner: React.FC<QRScannerProps> = ({ onBack }) => {
  const getAutoSession = (): AttendanceSession => {
    const hours = new Date().getHours();
    const minutes = new Date().getMinutes();
    const timeVal = hours * 60 + minutes;
    
    if (timeVal < 450) return 'Masuk';
    if (timeVal < 660) return 'Duha';
    if (timeVal < 840) return 'Zuhur';
    if (timeVal < 960) return 'Ashar';
    return 'Pulang';
  };

  const [session, setSession] = useState<AttendanceSession>(getAutoSession());
  const [isHaidMode, setIsHaidMode] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const isPrayerSession = ['Duha', 'Zuhur', 'Ashar'].includes(session);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{id: string, time: number}>({ id: '', time: 0 });
  const isLocked = useRef(false);

  const sessionRef = useRef(session);
  const haidRef = useRef(isHaidMode);
  
  useEffect(() => {
    sessionRef.current = session;
    if (!['Duha', 'Zuhur', 'Ashar'].includes(session)) {
      setIsHaidMode(false);
    }
  }, [session]);
  useEffect(() => { haidRef.current = isHaidMode; }, [isHaidMode]);

  const playFeedback = (type: 'success' | 'error') => {
    if (navigator.vibrate) {
        navigator.vibrate(type === 'success' ? 50 : [100, 30, 100]);
    }
  };

  const handleScan = useCallback(async (decodedText: string) => {
    const now = Date.now();
    if (decodedText === lastScannedRef.current.id && (now - lastScannedRef.current.time < 1200)) return;
    if (isLocked.current) return;

    isLocked.current = true;
    lastScannedRef.current = { id: decodedText, time: now };

    try {
      const result = await recordAttendanceByScan(decodedText, sessionRef.current, haidRef.current);
      
      let determinedStatus: NotificationItem['status'] = 'error';
      if (result.success) {
          determinedStatus = haidRef.current ? 'haid' : 'success';
      } else if (result.message.includes('SUDAH TERREKAM')) {
          determinedStatus = 'warning';
      }

      if (result.message.includes('MODE HAID HANYA UNTUK PUTRI')) {
        setIsHaidMode(false);
        toast.error('Mode Haid dimatikan untuk siswa laki-laki.');
      }

      const newItem: NotificationItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: result.student?.namaLengkap || (result.success ? 'NAMA TERVERIFIKASI' : 'ID TIDAK DIKENAL'),
        idUnik: result.student?.idUnik || decodedText,
        className: result.student?.tingkatRombel || 'KELAS N/A',
        status: determinedStatus,
        message: result.message
      };

      playFeedback(determinedStatus === 'success' ? 'success' : 'error');
      setNotifications(prev => [newItem, ...prev].slice(0, 3));
      
      setTimeout(() => { isLocked.current = false; }, 500);
      setTimeout(() => {
        setNotifications(prev => prev.filter(item => item.id !== newItem.id));
      }, 3000);

    } catch (e) {
      isLocked.current = false;
    }
  }, []);

  const startScanner = async () => {
    if (isInitializing) return;
    setIsInitializing(true);
    setCameraError(null);

    if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop().catch(() => {});
    }

    try {
      const html5QrCode = new Html5Qrcode("reader-core", { 
          formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
          verbose: false 
      });
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: facingMode },
        { 
          fps: 25, // OPTIMASI: Diturunkan dari 60 ke 25 untuk efisiensi CPU & Baterai
          qrbox: (w, h) => { 
              const s = Math.min(w, h) * 0.8; 
              return { width: s, height: s }; 
          },
          aspectRatio: 1.0
        },
        handleScan,
        () => {}
      );

      setCameraActive(true);
      try {
        const track = (html5QrCode as any).getRunningTrack();
        setHasTorch(!!track?.getCapabilities()?.torch);
      } catch(e) {}
    } catch (err: any) {
      setCameraError("Akses kamera ditolak.");
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      if (scannerRef.current?.isScanning) {
          scannerRef.current.stop().catch(() => {});
      }
    };
  }, [facingMode]);

  const toggleCamera = () => {
      if (isInitializing) return;
      setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  return (
    <Layout title="IMAM Hyper Scan" subtitle={`${session} Mode • Sensor v2.1`} icon={CameraIcon} onBack={onBack}>
      <div className="flex flex-col h-full bg-black relative overflow-hidden select-none">
          
          <div className="absolute top-4 inset-x-4 z-[70] flex flex-col gap-3 pointer-events-none">
              {notifications.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white/95 dark:bg-[#0B1121]/95 backdrop-blur-2xl rounded-3xl p-5 shadow-2xl border border-white/20 flex items-center gap-5 animate-in fade-in slide-in-from-top-4 duration-500"
                  >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-white ${
                          item.status === 'error' ? 'bg-rose-600' : 
                          item.status === 'haid' ? 'bg-rose-500' :
                          item.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}>
                          {item.status === 'error' ? <XCircleIcon className="w-9 h-9" /> : 
                           item.status === 'haid' ? <HeartIcon className="w-9 h-9 fill-current" /> :
                           item.status === 'warning' ? <ClockIcon className="w-9 h-9" /> : <CheckCircleIcon className="w-9 h-9" />}
                      </div>

                      <div className="flex-1 min-w-0">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              item.status === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {item.message}
                          </span>
                          <h4 className="text-base font-black uppercase truncate leading-none mt-1 mb-2 dark:text-white">
                              {item.name}
                          </h4>
                          <div className="flex items-center gap-3">
                              <span className="text-[11px] font-mono font-black text-indigo-600 dark:text-indigo-400">{item.idUnik}</span>
                              <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                              <span className="text-[11px] font-black text-slate-500 uppercase">{item.className}</span>
                          </div>
                      </div>
                  </div>
              ))}
          </div>

          <div className="absolute top-0 inset-x-0 z-30 p-3 bg-gradient-to-b from-black/60 to-transparent pt-6">
              <div className="flex flex-col gap-3">
                  <div className="flex gap-1.5 bg-white/10 backdrop-blur-2xl p-1.5 rounded-[1.8rem] border border-white/10 w-full shadow-2xl overflow-x-auto scrollbar-hide">
                      {['Masuk', 'Duha', 'Zuhur', 'Ashar', 'Pulang'].map((s) => (
                          <button
                              key={s}
                              onClick={() => setSession(s as AttendanceSession)}
                              className={`flex-1 min-w-[75px] py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                  session === s ? 'bg-indigo-600 text-white' : 'text-white/40'
                              }`}
                          >
                              {s}
                          </button>
                      ))}
                  </div>
                  {isPrayerSession && (
                    <button
                      onClick={() => setIsHaidMode(prev => !prev)}
                      className={`self-start px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${isHaidMode ? 'bg-rose-600 text-white border-rose-400 shadow-lg animate-pulse' : 'bg-white/10 text-white border-white/20'}`}
                    >
                      <HeartIcon className="w-3.5 h-3.5 inline-block mr-1.5" />
                      {isHaidMode ? 'Mode Haid Aktif' : 'Mode Haid'}
                    </button>
                  )}
              </div>
          </div>

          <div className="flex-1 relative flex items-center justify-center bg-slate-950">
              <div id="reader-core" className="absolute inset-0 w-full h-full [&>video]:object-cover opacity-70"></div>
              
              <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
                  <div className="relative w-64 h-64 border-2 border-white/20 rounded-[2.5rem]">
                      <div className="absolute inset-x-6 h-0.5 bg-indigo-500/50 shadow-[0_0_15px_#6366f1] animate-scan-y top-0"></div>
                  </div>
                  
                  <div className="mt-12 flex flex-col items-center gap-6 pointer-events-auto">
                      <div className="px-5 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${cameraActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">{cameraActive ? 'Sensor Aktif' : 'Menghubungkan...'}</span>
                      </div>
                      <button onClick={toggleCamera} className="w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl flex items-center justify-center border border-white/20 active:scale-90 transition-transform">
                          <CameraIcon className="w-6 h-6" />
                      </button>
                  </div>
              </div>

              {cameraError && (
                  <div className="absolute inset-0 bg-slate-950 z-40 flex flex-col items-center justify-center p-10 text-center">
                      <XCircleIcon className="w-16 h-16 text-rose-500 mb-4" />
                      <p className="text-white text-sm font-black uppercase tracking-widest mb-6">Akses Kamera Terhambat</p>
                      <button onClick={() => window.location.reload()} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Muat Ulang</button>
                  </div>
              )}
          </div>
      </div>
    </Layout>
  );
};

export default QRScanner;
