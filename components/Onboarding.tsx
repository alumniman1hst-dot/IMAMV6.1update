
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import React, { useState } from 'react';
import { AppLogo, ArrowRightIcon, SparklesIcon, QrCodeIcon, RobotIcon, ShieldCheckIcon } from './Icons';

interface OnboardingProps {
  onStart: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onStart }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Digital Transformation",
      description: "Selamat datang di ekosistem digital terpadu MAN 1 Hulu Sungai Tengah. Solusi manajemen modern dalam satu genggaman.",
      icon: SparklesIcon,
      color: "from-indigo-600 to-blue-600",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Smart Presence",
      description: "Lakukan presensi mandiri dengan teknologi QR Code yang cepat dan akurat. Pantau riwayat kehadiran Anda secara realtime.",
      icon: QrCodeIcon,
      color: "from-teal-600 to-emerald-600",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "AI Powerered Education",
      description: "Manfaatkan kecerdasan buatan untuk membantu proses belajar mengajar. Personalisasi pendidikan untuk hasil maksimal.",
      icon: RobotIcon,
      color: "from-violet-600 to-purple-600",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800"
    }
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('imam_onboarding_done', 'true');
      onStart();
    }
  };

  return (
    <div className="h-full w-full bg-white dark:bg-[#020617] flex flex-col relative overflow-hidden transition-colors duration-500">
      {/* Background Ambience */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentStep.color} opacity-[0.03] transition-colors duration-700`}></div>
      
      {/* Top Section: Hero Image with Gradient Mask */}
      <div className="relative h-[55%] w-full overflow-hidden animate-in fade-in zoom-in duration-1000">
        <img 
          src={currentStep.image} 
          alt={currentStep.title} 
          className="w-full h-full object-cover scale-110 animate-pulse transition-transform duration-1000"
          style={{ animationDuration: '8s' }}
        />
        <div className={`absolute inset-0 bg-gradient-to-t from-white dark:from-[#020617] via-transparent to-black/10`}></div>
        
        {/* Logo Overlap */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20">
            <div className="w-24 h-24 p-3 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-white/20 dark:border-slate-800">
                <AppLogo className="w-full h-full" />
            </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-10 text-center pt-16 pb-12">
          <div key={step} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${currentStep.color} text-white shadow-lg mb-6`}>
                  <currentStep.icon className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                  {currentStep.title}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-10 max-w-xs">
                  {currentStep.description}
              </p>
          </div>

          {/* Stepper Dots */}
          <div className="flex gap-2 mb-10">
              {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-indigo-600' : 'w-1.5 bg-slate-200 dark:bg-slate-800'}`}
                  ></div>
              ))}
          </div>

          {/* Action Button */}
          <button 
            onClick={handleNext}
            className={`w-full max-w-xs py-4 rounded-[2rem] bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.25em] shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group`}
          >
              {step === steps.length - 1 ? 'Mulai Sekarang' : 'Lanjutkan'}
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
      </div>

      {/* Security Badge */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center opacity-30 pointer-events-none">
          <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4" />
              <span className="text-[8px] font-black uppercase tracking-widest">Enterprise Grade Security</span>
          </div>
      </div>
    </div>
  );
};

export default Onboarding;
