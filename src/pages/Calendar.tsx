import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Appointment } from '../types';
import { ChevronLeft, ChevronRight, Clock, Plus, Calendar as CalendarIcon, CheckCircle, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CalendarView() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June (0-indexed is 5)
  const [selectedDate, setSelectedDate] = useState('2026-06-14');

  useEffect(() => {
    setAppointments(db.getAppointments());
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to format leading zero
  const pad = (num: number) => num.toString().padStart(2, '0');

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Create grid days
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Check appointments on specific day
  const getDayAppointments = (day: number) => {
    const formattedDate = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    return appointments.filter(a => a.date === formattedDate);
  };

  // Hours array for daily view: 9:00 AM - 5:00 PM (17:00)
  const hours = [
    { label: '09:00 AM', value: '09:00' },
    { label: '10:00 AM', value: '10:00' },
    { label: '11:00 AM', value: '11:00' },
    { label: '12:00 PM', value: '12:00' },
    { label: '01:00 PM', value: '13:00' },
    { label: '02:00 PM', value: '14:00' },
    { label: '03:00 PM', value: '15:00' },
    { label: '04:00 PM', value: '16:00' },
    { label: '05:00 PM', value: '17:00' }
  ];

  // Get appointments for selectedDate
  const selectedDayApts = appointments.filter(a => a.date === selectedDate);

  const getAptForHour = (hourVal: string) => {
    // Find appointment that matches hour (matching HH part)
    return selectedDayApts.find(a => a.time.startsWith(hourVal.substring(0, 2)));
  };

  const handleDayClick = (day: number) => {
    const formatted = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    setSelectedDate(formatted);
  };

  const handleUpdateStatus = (id: string, state: Appointment['status']) => {
    const list = db.getAppointments();
    const match = list.find(a => a.id === id);
    if (match) {
      match.status = state;
      db.updateAppointment(match);
      setAppointments(db.getAppointments());
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[calc(100vh-8rem)]">
      
      {/* LEFT: Complete Monthly Calendar Grid (7 Columns) */}
      <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full shadow-xs">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-brand-600" />
              <span>Practice Calendar</span>
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Click any day to show clinical hour slots</p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-100 rounded-md border border-slate-200 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 min-w-28 text-center uppercase tracking-wide">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-100 rounded-md border border-slate-200 text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Day Titles */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>

        {/* Days Box */}
        <div className="grid grid-cols-7 gap-1 flex-1 min-h-[280px]">
          {calendarDays.map((day, ix) => {
            if (day === null) {
              return <div key={`empty-${ix}`} className="bg-slate-50/30 rounded-lg"></div>;
            }

            const isCurrentDateSelected = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}` === selectedDate;
            const dayApts = getDayAppointments(day);
            const urgentApts = dayApts.filter(a => a.status === 'Scheduled');

            return (
              <div
                key={`day-${day}`}
                onClick={() => handleDayClick(day)}
                className={`p-1.5 rounded-lg border flex flex-col justify-between cursor-pointer transition-all aspect-square relative ${
                  isCurrentDateSelected 
                    ? 'border-blue-500 bg-blue-50/20 text-blue-700' 
                    : 'border-slate-100 hover:bg-slate-50/45 text-slate-800'
                }`}
              >
                <span className="text-[11px] font-semibold">{day}</span>
                
                {/* Dots indicators for appointments */}
                {dayApts.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-auto">
                    {dayApts.map(a => (
                      <span 
                        key={a.id} 
                        className={`w-1.5 h-1.5 rounded-full ${
                          a.status === 'Completed' ? 'bg-emerald-500' :
                          a.status === 'Cancelled' ? 'bg-rose-400' : 'bg-amber-500'
                        }`} 
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: High-density clinical slots viewer (5 Columns) */}
      <div className="xl:col-span-5 flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-150 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hourly Schedule</h3>
            <span className="text-[10px] text-slate-500 mt-0.5">{selectedDate}</span>
          </div>
          <button
            onClick={() => navigate('/appointments')}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Space</span>
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto max-h-[500px] lg:max-h-[600px] space-y-3">
          {hours.map((hr) => {
            const apt = getAptForHour(hr.value);
            return (
              <div 
                key={hr.value} 
                className={`p-3 border rounded-xl flex items-start space-x-3 text-xs leading-normal relative ${
                  apt 
                    ? apt.status === 'Completed' 
                      ? 'border-emerald-150 bg-emerald-50/5' 
                      : apt.status === 'Cancelled'
                        ? 'border-rose-150 bg-rose-50/5'
                        : 'border-blue-150 bg-blue-50/5'
                    : 'border-dashed border-slate-200 hover:bg-slate-50/20'
                }`}
              >
                {/* Hour Label */}
                <span className="font-bold text-slate-400 text-[10px] shrink-0 w-16">{hr.label}</span>

                {/* Slot Content */}
                {apt ? (
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <span 
                        onClick={() => navigate(`/patients?id=${apt.patientId}`)}
                        className="font-bold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer"
                      >
                        {apt.patientName}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                        apt.status === 'Cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }`}>{apt.status}</span>
                    </div>
                    <p className="text-slate-500 text-[10px] truncate mt-0.5">{apt.reason}</p>
                    
                    {/* Inline Quick triggers */}
                    {apt.status === 'Scheduled' && (
                      <div className="flex space-x-1.5 mt-2.5">
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'Completed')}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold"
                        >
                          Checkout Visit
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'Cancelled')}
                          className="px-2 py-0.5 border border-slate-200 text-rose-600 hover:bg-rose-50 rounded text-[9px] font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">No scheduled patients</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
