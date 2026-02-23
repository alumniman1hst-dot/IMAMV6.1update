
import React, { useState, useRef } from 'react';
import { getEduContent } from '../services/geminiService';
import { 
  RobotIcon, CheckCircleIcon, SparklesIcon, BookOpenIcon, 
  StarIcon, MegaphoneIcon, ClipboardDocumentListIcon, ArrowPathIcon,
  HandThumbUpIcon, HandThumbDownIcon
} from './Icons';
import { toast } from 'sonner';

interface ContentGenerationProps {
  onBack: () => void;
}

type ToolType = 'rpp' | 'quiz' | 'announcement';

// Utility for formatting bold text and basic markdown
const formatText = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;
        
        // Headers
        if (trimmed.startsWith('###')) return <h3 key={idx} className="text-lg font-bold text-slate-800 dark:text-white mt-4">{trimmed.replace(/#/g, '')}</h3>;
        if (trimmed.startsWith('##')) return <h2 key={idx} className="text-xl font-bold text-slate-800 dark:text-white mt-5 border-b border-slate-200 dark:border-slate-700 pb-2">{trimmed.replace(/#/g, '')}</h2>;
        
        // Bold parsing function
        const parseBold = (str: string) => {
          const parts = str.split(/(\*\*.*?\*\*)/g);
          return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="font-bold text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>;
            }
            return part;
          });
        };

        // Lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
           return (
             <div key={idx} className="flex gap-2.5 ml-1">
               <div className="min-w-[6px] h-[6px] rounded-full bg-indigo-500 mt-2 shrink-0"></div>
               <div className="text-slate-700 dark:text-slate-300 leading-relaxed">{parseBold(trimmed.substring(1).trim())}</div>
             </div>
           );
        }
        
        // Numbered Lists (Simple check)
        if (/^\d+\./.test(trimmed)) {
            const number = trimmed.match(/^\d+\./)?.[0];
            const content = trimmed.replace(/^\d+\./, '').trim();
            return (
                 <div key={idx} className="flex gap-2.5 ml-1">
                   <div className="font-bold text-indigo-600 dark:text-indigo-400 min-w-[1.5rem]">{number}</div>
                   <div className="text-slate-700 dark:text-slate-300 leading-relaxed">{parseBold(content)}</div>
                 </div>
            );
        }

        return <div key={idx} className="text-slate-700 dark:text-slate-300 leading-relaxed">{parseBold(trimmed)}</div>;
      })}
    </div>
  );
};

const ContentGeneration: React.FC<ContentGenerationProps> = ({ onBack }) => {
  const [activeTool, setActiveTool] = useState<ToolType>('rpp');
  const [topic, setTopic] = useState('');
  const [detail, setDetail] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  const loadingSteps = [
      "Menganalisis topik dan konteks...",
      "Menghubungkan ke model pengetahuan...",
      "Menyusun kerangka konten...",
      "Menulis draf awal...",
      "Menyempurnakan tata bahasa...",
      "Finalisasi hasil..."
  ];

  const tools = [
    { id: 'rpp', label: 'RPP', icon: BookOpenIcon, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'quiz', label: 'Kuis', icon: StarIcon, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'announcement', label: 'Pengumuman', icon: MegaphoneIcon, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setResult('');
    setCopied(false);
    setFeedback(null);
    
    let step = 0;
    setLoadingMessage(loadingSteps[0]);
    
    const intervalId = setInterval(() => {
        step = (step + 1) % loadingSteps.length;
        setLoadingMessage(loadingSteps[step]);
    }, 1500);
    
    let prompt = "";
    if (activeTool === 'rpp') {
        prompt = `Buatkan Rencana Pelaksanaan Pembelajaran (RPP) singkat dan padat untuk Mata Pelajaran/Topik: ${topic}. Target Siswa: ${detail || 'Umum'}. Format dengan struktur: Tujuan Pembelajaran, Kegiatan Inti, dan Penilaian. Gunakan Bahasa Indonesia yang formal.`;
    } else if (activeTool === 'quiz') {
        prompt = `Buatkan 5 soal kuis pilihan ganda tentang: ${topic}. Tingkat Kesulitan: ${detail || 'Menengah'}. Sertakan kunci jawaban di akhir. Gunakan Bahasa Indonesia.`;
    } else {
        prompt = `Buatkan teks pengumuman sekolah resmi tentang: ${topic}. Target Audiens: ${detail || 'Seluruh Warga Sekolah'}. Gunakan gaya bahasa yang sopan, jelas, dan menarik. Gunakan Bahasa Indonesia.`;
    }

    try {
        const generatedText = await getEduContent(prompt, activeTool);
        setResult(generatedText);
        // Auto scroll to result
        setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    } catch (error) {
        console.error("Error generating content:", error);
        setResult("Maaf, terjadi kesalahan saat menghubungi layanan AI. Silakan coba lagi.");
    } finally {
        clearInterval(intervalId);
        setLoading(false);
    }
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    toast.success("Terima kasih atas masukan Anda!");
    // Ideally log this to analytics
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-900 transition-colors">
      {/* Header */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm p-4 pt-8 flex items-center gap-4 z-20 sticky top-0 border-b border-slate-100 dark:border-slate-800">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
        </button>
        <div>
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Asisten Akademik <RobotIcon className="w-5 h-5 text-indigo-500" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Gemini AI</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-32 max-w-3xl mx-auto w-full">
         
         {/* Welcome Banner */}
         <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-[2rem] p-6 mb-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-5 translate-y-5"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>
            
            <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-semibold mb-3">
                    <SparklesIcon className="w-3 h-3 text-yellow-300" />
                    <span>AI Content Generator</span>
                </div>
                <h1 className="text-xl lg:text-2xl font-bold mb-2 leading-tight">Buat Konten Pembelajaran <br/>Dalam Hitungan Detik</h1>
                <p className="text-indigo-100 text-sm opacity-90 max-w-md mt-2 leading-relaxed">
                    Gunakan kecerdasan buatan untuk membantu menyusun RPP, Kuis, atau Pengumuman sekolah dengan mudah dan cepat.
                </p>
            </div>
         </div>

         {/* Tool Selection */}
         <div className="grid grid-cols-3 gap-3 mb-6">
            {tools.map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id as ToolType)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                        activeTool === tool.id 
                        ? 'bg-white dark:bg-slate-800 border-indigo-500 dark:border-indigo-400 shadow-lg ring-2 ring-indigo-500/20 scale-[1.02]' 
                        : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm opacity-80 hover:opacity-100 hover:-translate-y-1'
                    }`}
                >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tool.bg} ${tool.color} transition-colors mb-1`}>
                        <tool.icon className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-bold ${activeTool === tool.id ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                        {tool.label}
                    </span>
                    {activeTool === tool.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-b-2xl"></div>
                    )}
                </button>
            ))}
         </div>

         {/* Input Section */}
         <div className="bg-white dark:bg-slate-800 rounded-3xl p-1 shadow-sm border border-slate-100 dark:border-slate-700 mb-6 transition-all">
            <div className="p-6">
                <h3 className="font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                        <SparklesIcon className="w-3.5 h-3.5" />
                    </div>
                    Detail Konten
                </h3>
                
                <div className="space-y-5">
                    <div className="group">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider group-focus-within:text-indigo-500 transition-colors ml-1">
                            {activeTool === 'announcement' ? 'Topik Pengumuman' : 'Topik / Mata Pelajaran'}
                        </label>
                        <input 
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder={activeTool === 'quiz' ? 'Misal: Hukum Newton' : activeTool === 'announcement' ? 'Misal: Libur Awal Puasa' : 'Misal: Sistem Pernapasan Manusia'}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-white placeholder-slate-400 font-medium"
                        />
                    </div>
                    
                    <div className="group">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider group-focus-within:text-indigo-500 transition-colors ml-1">
                            {activeTool === 'announcement' ? 'Target Audiens' : activeTool === 'quiz' ? 'Tingkat Kesulitan' : 'Kelas / Semester'}
                        </label>
                        <textarea 
                            rows={2}
                            value={detail}
                            onChange={(e) => setDetail(e.target.value)}
                            placeholder={activeTool === 'announcement' ? 'Misal: Orang Tua Siswa' : activeTool === 'quiz' ? 'Misal: Sulit (HOTS)' : 'Misal: Kelas XI Semester 2'}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-white placeholder-slate-400 font-medium resize-none"
                        />
                    </div>
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={loading || !topic}
                    className="w-full mt-8 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                    {loading ? (
                        <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Sedang Menyusun...
                        </>
                    ) : (
                        <>
                        <SparklesIcon className="w-5 h-5" />
                        Mulai Generate
                        </>
                    )}
                </button>
            </div>
         </div>

         {/* Loading State */}
         {loading && (
             <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 text-center animate-in fade-in zoom-in duration-300">
                 <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                     <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-800 rounded-full"></div>
                     <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-indigo-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                     <RobotIcon className="w-8 h-8 text-indigo-500" />
                 </div>
                 <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2">{loadingMessage}</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-sm">Mohon tunggu sebentar...</p>
             </div>
         )}

         {/* Result Section */}
         {result && !loading && (
             <div ref={resultRef} className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                 <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden">
                     {/* Result Toolbar */}
                     <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-4 flex justify-between items-center">
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                             <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Hasil Generate</span>
                         </div>
                         <div className="flex gap-2">
                             <button 
                                onClick={handleCopy}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-300 ${
                                    copied 
                                    ? 'bg-green-50 border-green-200 text-green-600' 
                                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                                }`}
                             >
                                 {copied ? <CheckCircleIcon className="w-4 h-4 animate-checkmark" /> : <ClipboardDocumentListIcon className="w-4 h-4" />}
                                 {copied ? 'Tersalin!' : 'Salin Teks'}
                             </button>
                         </div>
                     </div>
                     
                     {/* Content */}
                     <div className="p-6 lg:p-8">
                         {formatText(result)}
                     </div>

                     {/* Feedback Section */}
                     <div className="border-t border-slate-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Apakah hasil ini membantu?</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleFeedback('up')}
                                disabled={feedback !== null}
                                className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold ${feedback === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                            >
                                <HandThumbUpIcon className="w-4 h-4" />
                                {feedback === 'up' && <span>Membantu</span>}
                            </button>
                            <button 
                                onClick={() => handleFeedback('down')}
                                disabled={feedback !== null}
                                className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold ${feedback === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                            >
                                <HandThumbDownIcon className="w-4 h-4" />
                                {feedback === 'down' && <span>Kurang Pas</span>}
                            </button>
                        </div>
                     </div>
                 </div>
                 
                 <div className="text-center mt-8 pb-4">
                    <button 
                        onClick={() => {
                             setResult('');
                             window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-4 py-2 hover:bg-white dark:hover:bg-slate-800 rounded-full"
                    >
                        <ArrowPathIcon className="w-4 h-4" />
                        Buat Konten Baru
                    </button>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};

export default ContentGeneration;
