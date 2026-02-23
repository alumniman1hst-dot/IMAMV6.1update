
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import React from 'react';
import Layout from './Layout';
import { 
  BuildingLibraryIcon,
  PusakaIcon, RdmIcon, Emis40Icon, EmisIcon,
  SimsdmIcon, AbsensiKemenagIcon, PintarIcon, AsnDigitalIcon,
  // Added ShieldCheckIcon for the footer
  ShieldCheckIcon
} from './Icons';

// --- DATA DEFINITION ---
interface ServiceItem {
  label: string;
  icon: React.ElementType;
  url: string;
}

const KEMENAG_SERVICES: ServiceItem[] = [
  { label: 'Pusaka Kemenag', icon: PusakaIcon, url: 'https://pusaka-v3.kemenag.go.id/' },
  { label: 'RDM', icon: RdmIcon, url: 'https://hdmadrasah.id/login/auth' },
  { label: 'Emis 4.0', icon: Emis40Icon, url: 'https://emis.kemenag.go.id/' },
  { label: 'Emis GTK', icon: EmisIcon, url: 'https://emisgtk.kemenag.go.id/' },
  { label: 'SIMSDM', icon: SimsdmIcon, url: 'https://simpeg5.kemenag.go.id/' },
  { label: 'Absensi Kemenag', icon: AbsensiKemenagIcon, url: 'https://sso.kemenag.go.id/auth/signin?appid=42095eeec431ac23eb12d2b772c94be0' },
  { label: 'Pintar', icon: PintarIcon, url: 'https://pintar.kemenag.go.id/' },
  { label: 'ASN Digital', icon: AsnDigitalIcon, url: 'https://asndigital.bkn.go.id/' }
];

// --- SUB-COMPONENTS ---

/**
 * Komponen kartu layanan individu (Truly Frameless)
 */
const ServiceCard: React.FC<{ service: ServiceItem }> = ({ service }) => {
  const Icon = service.icon;
  
  return (
    <button 
      onClick={() => window.open(service.url, '_blank')}
      className="flex flex-col items-center gap-3 p-4 transition-all active:scale-90 group"
    >
      {/* Logo - Frameless & No Background */}
      <div className="w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-full h-full object-contain filter drop-shadow-sm group-hover:drop-shadow-md transition-all" />
      </div>
      
      {/* Service Name */}
      <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter text-center leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {service.label}
      </span>
    </button>
  );
};

/**
 * Fix for Error on line 80: Defined missing HubFooter component
 */
const HubFooter: React.FC = () => (
  <div className="mt-12 text-center opacity-30 pointer-events-none">
    <div className="flex items-center justify-center gap-2">
      <ShieldCheckIcon className="w-4 h-4" />
      <span className="text-[8px] font-black uppercase tracking-widest">Akses Layanan Eksternal Terverifikasi</span>
    </div>
  </div>
);


// --- MAIN PAGE COMPONENT ---

const KemenagHub: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <Layout 
      title="Layanan Kemenag" 
      subtitle="Hub Layanan Terpadu" 
      icon={BuildingLibraryIcon} 
      onBack={onBack}
    >
      <div className="p-6 lg:p-10 space-y-12 pb-40 max-w-5xl mx-auto">
        
        {/* Main Grid Container - Reduced gaps for a tighter look */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-4 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {KEMENAG_SERVICES.map((item, idx) => (
            <ServiceCard key={idx} service={item} />
          ))}
        </div>

        {/* Modular Footer */}
        <HubFooter />
      </div>
    </Layout>
  );
};

export default KemenagHub;