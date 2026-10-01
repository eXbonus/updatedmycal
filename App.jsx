import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Menu, ChevronLeft, ChevronRight, Download, Calendar as CalendarIcon, 
  Check, X, FileText, Sun, Moon, Bell, BellOff, X as CloseIcon 
} from 'lucide-react';

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_OF_WEEK_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const getTodayString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

export default function App() {
  // Application State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [theme, setTheme] = useState('light');
  const [marks, setMarks] = useState({});
  const [toast, setToast] = useState(null);

  // Modals & Drawers State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isYearViewOpen, setIsYearViewOpen] = useState(false);
  
  // Entry Modal State
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [modalData, setModalData] = useState({
    amount: 60,
    note: '',
    time: '',
    alarmEnabled: false,
  });

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Load initial data
  useEffect(() => {
    const savedData = localStorage.getItem('premiumCalData');
    if (savedData) setMarks(JSON.parse(savedData));

    const savedTheme = localStorage.getItem('premiumCalTheme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem('premiumCalData', JSON.stringify(marks));
  }, [marks]);

  // Save theme on change
  useEffect(() => {
    localStorage.setItem('premiumCalTheme', theme);
  }, [theme]);

  // Custom Alarm Checker (replaces setInterval alert)
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      const currentTimeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
      
      const todayRecord = marks[todayKey];
      
      if (todayRecord && todayRecord.alarmEnabled && todayRecord.time === currentTimeStr) {
        // Trigger Toast instead of alert()
        setToast({ title: "Reminder", message: todayRecord.note || "You have an event right now!" });
        
        // Disable alarm so it doesn't keep triggering this minute
        setMarks(prev => ({
          ...prev,
          [todayKey]: { ...prev[todayKey], alarmEnabled: false }
        }));
      }
    };

    const intervalId = setInterval(checkAlarms, 30000); // Check every 30s
    return () => clearInterval(intervalId);
  }, [marks]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const jumpToToday = () => {
    setCurrentDate(new Date());
  };

  const openEntryModal = (day) => {
    const dateKey = `${currentYear}-${currentMonth + 1}-${day}`;
    setSelectedDateKey(dateKey);
    const existing = marks[dateKey] || {};
    setModalData({
      amount: existing.amount || 60,
      note: existing.note || '',
      time: existing.time || '',
      alarmEnabled: existing.alarmEnabled || false,
    });
  };

  const closeEntryModal = () => {
    setSelectedDateKey(null);
  };

  const saveEntry = (status) => {
    setMarks(prev => ({
      ...prev,
      [selectedDateKey]: {
        status,
        amount: status === 'tick' ? Number(modalData.amount) || 0 : 0,
        note: modalData.note,
        time: modalData.time,
        alarmEnabled: modalData.alarmEnabled
      }
    }));
    closeEntryModal();
  };

  const clearEntry = () => {
    setMarks(prev => {
      const copy = { ...prev };
      delete copy[selectedDateKey];
      return copy;
    });
    closeEntryModal();
  };

  const exportCSV = () => {
    let csv = "Date,Status,Amount,Time,Alarm,Note\n";
    Object.keys(marks).sort().forEach(date => {
      const r = marks[date];
      csv += `${date},${r.status},${r.amount},${r.time || ""},${r.alarmEnabled ? "Yes" : "No"},"${(r.note || "").replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "My_Calendar_Premium.csv";
    link.click();
  };

  const { totalDays, totalAmount } = useMemo(() => {
    let days = 0;
    let amount = 0;
    Object.entries(marks).forEach(([key, record]) => {
      const [yearStr, monthStr] = key.split('-');
      if (Number(yearStr) === currentYear && Number(monthStr) === (currentMonth + 1)) {
        if (record.status === 'tick') {
          days++;
          amount += record.amount;
        }
      }
    });
    return { totalDays: days, totalAmount: amount };
  }, [marks, currentYear, currentMonth]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const blankDays = Array(firstDay).fill(null);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const todayKeyStr = getTodayString();

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 overflow-x-hidden ${theme === 'dark' ? 'bg-zinc-950 text-white dark' : 'bg-slate-50 text-zinc-900'}`}>
      
      {/* Toast Notification */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-in-out ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
        <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4">
          <Bell className="w-6 h-6 animate-pulse" />
          <div>
            <h4 className="font-bold">{toast?.title}</h4>
            <p className="text-emerald-100 text-sm">{toast?.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="ml-4 p-1 hover:bg-emerald-700 rounded-full transition-colors">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`max-w-3xl mx-auto p-4 sm:p-6 transition-transform duration-500 ease-out ${isSidebarOpen ? 'translate-x-64 sm:translate-x-80' : 'translate-x-0'}`}>
        
        {}
        <header className="flex items-center justify-between mb-8 pt-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`p-3 rounded-2xl shadow-sm transition-all active:scale-95 ${theme === 'dark' ? 'bg-zinc-900 shadow-black/50 hover:bg-zinc-800' : 'bg-white hover:bg-gray-50'}`}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className={`flex items-center px-4 sm:px-6 py-3 rounded-2xl shadow-sm ${theme === 'dark' ? 'bg-zinc-900 shadow-black/50' : 'bg-white'}`}>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Calendar</h1>
            </div>
          </div>
          <button 
            onClick={jumpToToday}
            className={`px-4 py-3 rounded-2xl font-semibold shadow-sm transition-all active:scale-95 text-sm sm:text-base ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-slate-200 hover:bg-slate-300'}`}
          >
            Today
          </button>
        </header>

        {}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setIsYearViewOpen(true)} className="flex items-center gap-2 group">
            <h2 className="text-3xl font-extrabold tracking-tight group-hover:text-blue-500 transition-colors">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <CalendarIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </button>
          <div className="flex gap-2">
            <button onClick={handlePrevMonth} className={`p-3 rounded-xl transition-all active:scale-90 ${theme === 'dark' ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-white shadow-sm hover:bg-gray-50'}`}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={handleNextMonth} className={`p-3 rounded-xl transition-all active:scale-90 ${theme === 'dark' ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-white shadow-sm hover:bg-gray-50'}`}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {}
        <div className={`rounded-3xl p-4 sm:p-6 shadow-xl transition-colors duration-500 ${theme === 'dark' ? 'bg-zinc-900/50 shadow-black/40 border border-white/5' : 'bg-white shadow-gray-200/50 border border-gray-100'}`}>
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {DAYS_OF_WEEK.map((day, i) => (
              <div key={day} className={`text-center font-bold text-xs sm:text-sm tracking-wider uppercase ${i === 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {window.innerWidth < 640 ? DAYS_OF_WEEK_SHORT[i] : day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {blankDays.map((_, i) => <div key={`blank-${i}`} className="aspect-square" />)}
            
            {monthDays.map(day => {
              const dateKey = `${currentYear}-${currentMonth + 1}-${day}`;
              const record = marks[dateKey];
              const isToday = dateKey === todayKeyStr;
              const isSunday = new Date(currentYear, currentMonth, day).getDay() === 0;
              
              let cellBg = theme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-slate-100';
              let borderClass = 'border-transparent';
              
              if (record) {
                if (record.status === 'tick') {
                  cellBg = theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-50';
                  borderClass = 'border-emerald-500/50';
                } else if (record.status === 'cross') {
                  cellBg = theme === 'dark' ? 'bg-rose-500/20' : 'bg-rose-50';
                  borderClass = 'border-rose-500/50';
                } else if (record.status === 'note') {
                  cellBg = theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-50';
                  borderClass = 'border-blue-500/50';
                }
              }

              if (isToday) {
                borderClass = 'border-yellow-400';
              }

              return (
                <button
                  key={day}
                  onClick={() => openEntryModal(day)}
                  className={`relative flex flex-col items-center justify-start py-2 sm:py-3 rounded-2xl aspect-square border-2 transition-all duration-200 active:scale-90 overflow-hidden ${cellBg} ${borderClass}`}
                >
                  <span className={`text-sm sm:text-lg font-bold z-10 ${
                    isToday ? (theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600') : 
                    isSunday && !record ? 'text-red-500' : ''
                  }`}>
                    {day}
                  </span>
                  
                  {/* Status Icons */}
                  <div className="mt-auto z-10 w-full flex justify-center pb-1">
                    {record?.status === 'tick' && <Check className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 drop-shadow-md" strokeWidth={3} />}
                    {record?.status === 'cross' && <X className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 drop-shadow-md" strokeWidth={3} />}
                    {record?.status === 'note' && <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 drop-shadow-md" strokeWidth={2.5} />}
                  </div>

                  {/* Indicators */}
                  {record?.alarmEnabled && (
                    <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2">
                      <Bell className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-400" />
                    </div>
                  )}
                  {record?.note && record.status !== 'note' && (
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.8)]" />
                  )}
                  
                  {/* Today Highlight Background Glow */}
                  {isToday && (
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-amber-500/5 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {}
        <div className={`mt-8 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg transition-colors duration-500 ${theme === 'dark' ? 'bg-gradient-to-br from-zinc-900 to-zinc-800 shadow-black/50' : 'bg-gradient-to-br from-white to-slate-50 shadow-gray-200/50 border border-gray-100'}`}>
          <div className="flex gap-8 w-full sm:w-auto justify-around sm:justify-start">
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1">Ticked Days</p>
              <p className="text-4xl font-black text-emerald-500 drop-shadow-sm">{totalDays}</p>
            </div>
            <div className="w-px bg-gray-200 dark:bg-zinc-700" />
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1">Amount</p>
              <p className="text-4xl font-black drop-shadow-sm">
                <span className="text-xl text-gray-400 mr-1">₹</span>
                {totalAmount}
              </p>
            </div>
          </div>
          
          <button 
            onClick={exportCSV}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-xl hover:shadow-2xl"
          >
            <Download className="w-5 h-5" />
            Export Data
          </button>
        </div>
      </div>

      {}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsSidebarOpen(false)}
      />
      <div className={`fixed top-0 left-0 h-full w-64 sm:w-80 shadow-2xl z-50 transform transition-transform duration-500 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${theme === 'dark' ? 'bg-zinc-950 border-r border-white/10' : 'bg-slate-50'}`}>
        <div className="p-8">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
            <button onClick={() => setIsSidebarOpen(false)} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-gray-200 hover:bg-gray-300'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className={`p-4 rounded-2xl flex items-center justify-between ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white shadow-sm'}`}>
            <span className="font-semibold text-lg">Appearance</span>
            <button 
              onClick={toggleTheme}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'} flex items-center justify-center shadow-md`}>
                {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-blue-500" /> : <Sun className="w-3.5 h-3.5 text-yellow-500" />}
              </span>
            </button>
          </div>
        </div>
      </div>

      {}
      <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 transition-all duration-400 ${selectedDateKey ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        {/* Glassmorphism backdrop */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={closeEntryModal} />
        
        <div className={`relative w-full max-w-md p-6 sm:p-8 rounded-[2rem] shadow-2xl transform transition-all duration-400 delay-75 ${selectedDateKey ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-20 scale-95 opacity-0'} ${theme === 'dark' ? 'bg-zinc-900/95 border border-white/10' : 'bg-white/95 border border-gray-100'}`}>
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full mx-auto mb-6 sm:hidden" />
          
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black">
              {selectedDateKey && new Date(selectedDateKey).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
            </h3>
            <button onClick={closeEntryModal} className="p-2 rounded-full bg-gray-200/50 dark:bg-zinc-800 hover:scale-95 transition-transform">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Amount (₹)</label>
              <input 
                type="number" 
                value={modalData.amount}
                onChange={(e) => setModalData({...modalData, amount: e.target.value})}
                className={`w-full px-5 py-4 rounded-2xl text-xl font-bold outline-none transition-all focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-slate-100 text-zinc-900'}`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Reminder Time</label>
              <div className={`flex items-center gap-3 p-2 rounded-2xl ${theme === 'dark' ? 'bg-zinc-950' : 'bg-slate-100'}`}>
                <input 
                  type="time" 
                  value={modalData.time}
                  onChange={(e) => setModalData({...modalData, time: e.target.value})}
                  className={`flex-1 bg-transparent px-3 py-2 outline-none font-medium ${theme === 'dark' ? 'text-white style-color-scheme-dark' : 'text-zinc-900'}`}
                />
                <button 
                  onClick={() => setModalData({...modalData, alarmEnabled: !modalData.alarmEnabled})}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-colors ${modalData.alarmEnabled ? 'bg-orange-500 text-white' : theme === 'dark' ? 'bg-zinc-800 text-gray-400' : 'bg-gray-200 text-gray-500'}`}
                >
                  {modalData.alarmEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  {modalData.alarmEnabled ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Note</label>
              <textarea 
                placeholder="Write a note..."
                value={modalData.note}
                onChange={(e) => setModalData({...modalData, note: e.target.value})}
                rows="3"
                className={`w-full px-5 py-4 rounded-2xl outline-none transition-all focus:ring-2 focus:ring-blue-500 resize-none ${theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-slate-100 text-zinc-900'}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-8">
            <button onClick={() => saveEntry('tick')} className="flex justify-center items-center py-4 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-sm">
              <Check className="w-8 h-8" strokeWidth={3} />
            </button>
            <button onClick={() => saveEntry('cross')} className="flex justify-center items-center py-4 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm">
              <X className="w-8 h-8" strokeWidth={3} />
            </button>
            <button onClick={() => saveEntry('note')} className="flex justify-center items-center py-4 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-sm">
              <FileText className="w-7 h-7" strokeWidth={2.5} />
            </button>
          </div>

          {marks[selectedDateKey] && (
            <button onClick={clearEntry} className={`w-full mt-4 py-4 rounded-2xl font-bold transition-all active:scale-95 ${theme === 'dark' ? 'bg-zinc-800 text-rose-400 hover:bg-zinc-700' : 'bg-gray-100 text-rose-500 hover:bg-gray-200'}`}>
              Clear Entry
            </button>
          )}
        </div>
      </div>

      {}
      <div className={`fixed inset-0 z-[100] transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isYearViewOpen ? 'translate-y-0' : 'translate-y-full'} ${theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-zinc-900'}`}>
        {isYearViewOpen && (
          <div className="h-full flex flex-col p-4 sm:p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-black">{currentYear}</h2>
              <button 
                onClick={() => setIsYearViewOpen(false)}
                className={`p-3 rounded-full transition-transform hover:rotate-90 active:scale-90 ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white shadow-sm'}`}
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pb-10 scrollbar-hide">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                {MONTH_NAMES_SHORT.map((monthStr, mIndex) => {
                  const mDays = getDaysInMonth(currentYear, mIndex);
                  const mFirstDay = getFirstDayOfMonth(currentYear, mIndex);
                  const isCurrentMonth = mIndex === new Date().getMonth() && currentYear === new Date().getFullYear();
                  
                  return (
                    <button 
                      key={monthStr}
                      onClick={() => {
                        setCurrentDate(new Date(currentYear, mIndex, 1));
                        setIsYearViewOpen(false);
                      }}
                      className={`text-left p-4 sm:p-5 rounded-3xl transition-all hover:scale-[1.02] active:scale-95 ${theme === 'dark' ? 'bg-zinc-900 shadow-black/40' : 'bg-white shadow-xl shadow-gray-200/40'}`}
                    >
                      <h4 className={`font-bold text-lg mb-3 ${isCurrentMonth ? 'text-blue-500' : ''}`}>{monthStr}</h4>
                      <div className="grid grid-cols-7 gap-1">
                        {DAYS_OF_WEEK_SHORT.map((d, i) => (
                          <div key={d+i} className="text-[9px] font-bold text-center text-gray-400">{d}</div>
                        ))}
                        {Array(mFirstDay).fill(null).map((_, i) => <div key={`mb-${i}`} />)}
                        {Array.from({ length: mDays }).map((_, d) => {
                          const dayNum = d + 1;
                          const k = `${currentYear}-${mIndex + 1}-${dayNum}`;
                          const rec = marks[k];
                          const isTodayCell = k === getTodayString();
                          
                          let bg = 'bg-transparent';
                          let text = theme === 'dark' ? 'text-zinc-400' : 'text-gray-500';
                          
                          if (isTodayCell) {
                            bg = 'bg-yellow-400';
                            text = 'text-black font-bold';
                          } else if (rec?.status === 'tick') {
                            bg = 'bg-emerald-500';
                            text = 'text-white';
                          } else if (rec?.status === 'cross') {
                            bg = 'bg-rose-500';
                            text = 'text-white';
                          } else if (rec?.status === 'note') {
                            bg = 'bg-blue-500';
                            text = 'text-white';
                          }

                          return (
                            <div key={d} className={`aspect-square flex items-center justify-center rounded-full text-[10px] ${bg} ${text}`}>
                              {rec ? '' : dayNum}
                            </div>
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}