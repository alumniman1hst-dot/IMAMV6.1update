
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CalendarIcon, ClockIcon, BuildingLibraryIcon, Loader2, ArrowPathIcon, RectangleStackIcon, ChevronDownIcon } from './Icons';
import { toast } from 'sonner';
import Layout from './Layout';
import * as XLSX from 'xlsx';
import { db, isMockMode } from '../services/firebase';
import { bulkImportSchedule, ScheduleItem } from '../services/scheduleService';

interface ScheduleProps {
  onBack: () => void;
}

export default function Schedule({ onBack }: ScheduleProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [activeDay, setActiveDay] = useState('Senin');
  const [allItems, setAllItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedClass, setSelectedClass] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  useEffect(() => {
      const today = new Date();
      const dayIndex = today.getDay();
      const fullNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const todayName = fullNames[dayIndex];
      setActiveDay(todayName && todayName !== 'Minggu' ? todayName : 'Senin');
  }, []);

  useEffect(() => {
      setLoading(true);
      if (isMockMode) {
          setTimeout(() => {
              setAllItems([{ id: '1', day: 'Senin', time: '07:30 - 09:00', subject: 'Matematika (Simulasi)', class: 'XII IPA 1', room: 'R. 12' }]);
              setLoading(false);
          }, 500);
          return;
      }
      
      if (!db) { setLoading(false); return; }
      
      const unsubscribe = db.collection('schedules').onSnapshot(
          snapshot => {
              setAllItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleItem)));
              setLoading(false);
          },
          error => {
              console.warn("Peringatan Izin Jadwal:", error.message);
              setLoading(false);
          }
      );
      
      return () => unsubscribe();
  }, []);

  const uniqueClasses = useMemo(() => Array.from(new Set(allItems.map(item => item.class).filter(Boolean))).sort(), [allItems]);

  const filteredSchedule = useMemo(() => {
      const filtered = allItems.filter(item => selectedClass === 'All' || item.class === selectedClass);
      const grouped: Record<string, ScheduleItem[]> = {};
      filtered.forEach(item => {
          if (!grouped[item.day]) grouped[item.day] = [];
          grouped[item.day].push(item);
      });
      Object.keys(grouped).forEach(day => grouped[day].sort((a, b) => a.time.localeCompare(b.time)));
      return grouped;
  }, [allItems, selectedClass]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setImporting(true);
      const toastId = toast.loading("Mengimpor...");
      try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data, { type: 'array' });
          const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
          const newSchedules: Omit<ScheduleItem, 'id'>[] = jsonData.map((row: any) => ({
              day: row["Hari"] || "Senin",
              time: row["Jam"] || "00:00 - 00:00",
              subject: row["Mata Pelajaran"] || "-",
              class: row["Kelas"] || "-",
              room: row["Ruang"] || "-"
          }));
          if (newSchedules.length > 0) {
              await bulkImportSchedule(newSchedules);
              toast.success(`Berhasil impor ${newSchedules.length} jadwal`, { id: toastId });
          } else { toast.error("Format salah", { id: toastId }); }
      } catch (error) { toast.error("Gagal impor", { id: toastId }); } finally {
          setImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
      }
  };

  const renderScheduleCard = (item: ScheduleItem) => (
      <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs flex-col">
              <span>{item.time.split('-')[0].trim()}</span>
          </div>
          <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{item.subject}</h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {item.time}</span>
                  <span className="flex items-center gap-1"><BuildingLibraryIcon className="w-3 h-3" /> {item.room} ({item.class})</span>
              </div>
          </div>
      </div>
  );

  return (
    <Layout title="Jadwal Pelajaran" subtitle={selectedClass !== 'All' ? `Kelas ${selectedClass}` : "Seluruh Kelas"} icon={CalendarIcon} onBack={onBack} actions={
          <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="p-2.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors" title="Import Excel">
                  {importing ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <ArrowPathIcon className="w-5 h-5" />}
              </button>
              <input type="file" ref={fileInputRef} accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
          </div>
      }>
        <div className="p-4 lg:p-6 pb-24 space-y-6">
            <div className="flex flex-col gap-3">
                <div className="relative w-full">
                    <div className="absolute left-3 top-3.5 text-slate-400 pointer-events-none"><RectangleStackIcon className="w-5 h-5" /></div>
                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-5 pl-12 text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer font-medium shadow-sm">
                        <option value="All">Semua Kelas</option>
                        {uniqueClasses.map(cls => (<option key={cls} value={cls}>{cls}</option>))}
                    </select>
                    <div className="absolute right-4 top-3.5 text-slate-400 pointer-events-none"><ChevronDownIcon className="w-4 h-4" /></div>
                </div>
            </div>
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400"><Loader2 className="w-8 h-8 animate-spin mb-2" /><p className="text-sm">Memuat...</p></div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide mb-4">
                        {daysOrder.map((day) => (
                            <button key={day} onClick={() => setActiveDay(day)} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeDay === day ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{day}</button>
                        ))}
                    </div>
                    {filteredSchedule[activeDay]?.length > 0 ? (
                        <div className="space-y-3">{filteredSchedule[activeDay].map(renderScheduleCard)}</div>
                    ) : (
                        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200"><p className="text-slate-500 text-sm">Tidak ada jadwal.</p></div>
                    )}
                </div>
            )}
        </div>
    </Layout>
  );
}