
import React, { useState, useRef, useEffect } from 'react';
import Layout from './Layout';
import { ViewState, UserRole } from '../types';
import { 
  CogIcon, 
  InfoIcon, 
  PencilIcon, 
  MoonIcon, 
  SunIcon, 
  LogOutIcon, 
  ChevronRight,
  ShieldCheckIcon,
  CommandLineIcon,
  AppLogo,
  CameraIcon,
  TrashIcon,
  SparklesIcon,
  MegaphoneIcon,
  ArrowPathIcon,
  UserIcon,
  ChartBarIcon,
  Squares2x2Icon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  XCircleIcon
} from './Icons';
import { toast } from 'sonner';

interface SettingsProps {
  onBack: () => void;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  userRole: UserRole;
}

type WidgetId = 'metrics' | 'quickActions' | 'trend' | 'agenda';

const Settings: React.FC<SettingsProps> = ({ 
  onBack, 
  onNavigate, 
  onLogout, 
  isDarkMode, 
  onToggleTheme,
  userRole
}) => {
  
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Widget Configuration State
  const [visibleWidgets, setVisibleWidgets] = useState<Record<WidgetId, boolean>>({
    metrics: true,
    quickActions: true,
    trend: true,
    agenda: true
  });

  // News Card Theme Configuration State
  const [themeConfig, setThemeConfig] = useState({
    bg: isDarkMode ? '#1e293b' : '#ffffff',
    primary: isDarkMode ? '#818cf8' : '#4f46e5',
    secondary: isDarkMode ? '#312e81' : '#e0e7ff',
    border: isDarkMode ? '#334155' : '#f1f5f9'
  });

  const canCustomize = userRole === UserRole.ADMIN || userRole === UserRole.DEVELOPER;

  useEffect(() => {
    // Load existing logo
    const savedLogo = localStorage.getItem('custom_app_logo');
    if (savedLogo) setCustomLogo(savedLogo);

    // Load News Card Theme
    const savedTheme = localStorage.getItem('news_card_theme');
    if (savedTheme) setThemeConfig(JSON.parse(savedTheme));

    // Load Widget Prefs
    const savedWidgets = localStorage.getItem('dashboard_widgets');
    if (savedWidgets) {
        try {
            setVisibleWidgets(JSON.parse(savedWidgets));
        } catch (e) {
            console.error("Failed to parse widgets");
        }
    }
  }, []);

  const toggleWidget = (id: WidgetId) => {
    const newVisible = { ...visibleWidgets, [id]: !visibleWidgets[id] };
    setVisibleWidgets(newVisible);
    localStorage.setItem('dashboard_widgets', JSON.stringify(newVisible));
    toast.info(`Widget ${id} ${newVisible[id] ? 'ditampilkan' : 'disembunyikan'}`);
  };

  const handleResetTheme = () => {
    const defaults = {
        bg: isDarkMode ? '#1e293b' : '#ffffff',
        primary: isDarkMode ? '#818cf8' : '#4f46e5',
        secondary: isDarkMode ? '#312e81' : '#e0e7ff',
        border: isDarkMode ? '#334155' : '#f1f5f9'
    };
    setThemeConfig(defaults);
    toast.success("Tema berita diatur ulang ke default");
  };

  const menuItems = [
    {
      label: 'Edit Data Profil',
      icon: PencilIcon,
      action: () => onNavigate(ViewState.PROFILE),
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      desc: 'Perbarui informasi pribadi Anda'
    },
    {
      label: 'Riwayat Login',
      icon: ShieldCheckIcon,
      action: () => onNavigate(ViewState.LOGIN_HISTORY),
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      desc: 'Pantau aktivitas masuk akun'
    },
    {
      label: 'Tentang Aplikasi',
      icon: InfoIcon,
      action: () => onNavigate(ViewState.ABOUT),
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      desc: 'Versi, pengembang, dan info sekolah'
    }
  ];

  if (userRole === UserRole.DEVELOPER) {
      menuItems.splice(1, 0, {
          label: 'Developer Console',
          icon: CommandLineIcon,
          action: () => onNavigate(ViewState.DEVELOPER),
          color: 'text-slate-600',
          bg: 'bg-slate-50 dark:bg-slate-700',
          desc: 'Alat teknis & database'
      });
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran file terlalu besar (Maks 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        localStorage.setItem('custom_app_logo', result);
        setCustomLogo(result);
        toast.success("Logo aplikasi berhasil diperbarui");
        window.dispatchEvent(new Event('storage'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    if (window.confirm("Kembalikan ke logo default IMAM?")) {
      localStorage.removeItem('custom_app_logo');
      setCustomLogo(null);
      toast.success("Logo dikembalikan ke default");
      window.dispatchEvent(new Event('storage'));
    }
  };

  return (
    <Layout
      title="Pengaturan"
      subtitle="Konfigurasi Aplikasi"
      icon={CogIcon}
      onBack={onBack}
    >
      <div className="p-4 lg:p-6 space-y-8 max-w-2xl mx-auto w-full pb-32">
        
        {/* Dashboard Customization Section */}
        <div className="space-y-3">
             <div className="flex items-center gap-2 ml-2">
                <Squares2x2Icon className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tampilan Beranda</h3>
             </div>
             
             <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-2 shadow-sm">
                {[
                  { id: 'metrics', label: 'Statistik Utama', icon: ChartBarIcon, desc: 'Ringkasan data harian' },
                  { id: 'quickActions', label: 'Menu Navigasi', icon: Squares2x2Icon, desc: 'Akses cepat fitur' },
                  { id: 'trend', label: 'Grafik Tren', icon: ArrowTrendingUpIcon, desc: 'Visualisasi kehadiran' },
                  { id: 'agenda', label: 'Agenda Hari Ini', icon: CalendarIcon, desc: 'Jadwal mapel harian' }
                ].map((item, idx, arr) => (
                  <div key={item.id}>
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${visibleWidgets[item.id as WidgetId] ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'bg-slate-50 dark:bg-slate-900 text-slate-300'}`}>
                           <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white">{item.label}</h4>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{item.desc}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleWidget(item.id as WidgetId)}
                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${visibleWidgets[item.id as WidgetId] ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${visibleWidgets[item.id as WidgetId] ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                    {idx < arr.length - 1 && <hr className="border-slate-50 dark:border-slate-700 mx-4" />}
                  </div>
                ))}
             </div>
        </div>

        {/* Branding Section */}
        {canCustomize && (
          <div className="space-y-3">
             <div className="flex items-center gap-2 ml-2">
                <SparklesIcon className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Branding Sekolah</h3>
             </div>
             
             <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
                <div className="flex items-center gap-6">
                   <div className="relative group shrink-0">
                      <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative">
                          {customLogo ? (
                            <img src={customLogo} alt="Logo Sekolah" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 text-indigo-600 dark:text-indigo-400">
                               <AppLogo />
                            </div>
                          )}
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                             <CameraIcon className="w-6 h-6 text-white" />
                          </div>
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                   </div>
                   <div className="flex-1">
                      <h4 className="font-bold text-slate-800 dark:text-white">Logo Instansi</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Ganti logo default dengan logo sekolah Anda. Format: PNG/JPG.
                      </p>
                      <div className="flex gap-3 mt-3">
                        <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm">Upload</button>
                        {customLogo && (
                          <button onClick={handleResetLogo} className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"><TrashIcon className="w-3 h-3" /> Hapus</button>
                        )}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Appearance Group */}
        <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Tampilan Sistem</h3>
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                <button onClick={onToggleTheme} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                        {isDarkMode ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">Mode Tema</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{isDarkMode ? 'Mode Gelap Aktif' : 'Mode Terang Aktif'}</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </button>
            </div>
        </div>

        {/* Main Menu Group */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Akun & Sistem</h3>
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
            {menuItems.map((item, idx) => (
              <div key={idx}>
                <button onClick={item.action} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{item.label}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                </button>
                {idx < menuItems.length - 1 && <hr className="border-slate-100 dark:border-slate-700 mx-4" />}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4">
            <button onClick={onLogout} className="w-full bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-100 transition-colors">
                <LogOutIcon className="w-5 h-5" /> Keluar Aplikasi
            </button>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
