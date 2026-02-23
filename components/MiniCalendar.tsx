
import React from 'react';
import { ViewState } from '../types';
import { CalendarIcon, ArrowRightIcon } from './Icons';

interface MiniCalendarProps {
  onNavigate: (view: ViewState) => void;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ onNavigate }) => {
  const today = new Date();
  
  // Calculate start of week (Monday)
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  };

  const startOfWeek = getStartOfWeek(today);
  const weekDays = [];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDays.push(new Date(d));
  }

  const daysMap = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <div 
      onClick={() => onNavigate(ViewState.SCHEDULE)}
      className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer group hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
          <CalendarIcon className="w-4 h-4 text-violet-500" />
          Jadwal Minggu Ini
        </h3>
        <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
      </div>
      
      <div className="flex justify-between items-center">
        {weekDays.map((date, idx) => {
          const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
          const dayName = daysMap[date.getDay()];
          
          return (
            <div 
              key={idx} 
              className={`flex flex-col items-center justify-center w-8 h-12 rounded-xl transition-all ${
                isToday 
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-none scale-110' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="text-[9px] font-medium opacity-80 mb-0.5">{dayName}</span>
              <span className={`text-xs font-bold ${isToday ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                {date.getDate()}
              </span>
              {isToday && (
                  <div className="w-1 h-1 bg-white rounded-full mt-1"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
