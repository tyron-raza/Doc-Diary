import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { api } from '../services/api';
import { Patient, Appointment, Invoice, Notification } from '../types';
import { 
  Users, Calendar as CalendarIcon, DollarSign, Clock, CheckCircle2, ChevronRight, 
  TrendingUp, ArrowUpRight, Activity, AlertCircle, RefreshCw 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [patientsCount, setPatientsCount] = useState(0);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [todayApts, setTodayApts] = useState<Appointment[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [activities, setActivities] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const todayDateStr = '2026-06-14'; // Sync with sandbox time

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    setLoading(true);
    try {
      const allPatients = db.getPatients();
      const allApts = db.getAppointments();
      const allInvoices = db.getInvoices();
      const allNotifs = db.getNotifications();

      setPatientsCount(allPatients.length);
      setAppointmentsCount(allApts.filter(a => a.status === 'Scheduled').length);
      
      // Today is 2026-06-14 in our system metadata
      const filteredToday = allApts.filter(a => a.date === todayDateStr);
      setTodayApts(filteredToday);

      // Revenue: Paid invoices
      const paidSum = allInvoices
        .filter(i => i.status === 'Paid')
        .reduce((sum, inv) => sum + inv.total, 0);
      setRevenue(paidSum);

      // Unpaid invoices
      const unpaid = allInvoices.filter(i => i.status === 'Unpaid').length;
      setUnpaidCount(unpaid);

      // Activities: latest notifications
      setActivities(allNotifs.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: Appointment['status']) => {
    const apts = db.getAppointments();
    const target = apts.find(a => a.id === id);
    if (target) {
      target.status = newStatus;
      db.updateAppointment(target);
      loadDashboardData();
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinic Overview</h1>
          <span className="text-xs text-slate-500 font-semibold">Reporting metrics for {new Date(todayDateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <button 
          onClick={loadDashboardData}
          className="flex items-center space-x-1.5 px-3 py-1.5 border border-white/40 rounded-xl text-xs hover:bg-white/55 text-slate-700 bg-white/40 backdrop-blur-xs shadow-xs transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync State</span>
        </button>
      </div>

      {/* METRICS Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-5 hover:bg-white/70 hover:shadow-md transition-all duration-200 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Patients</p>
            <h3 className="text-2xl font-bold font-display text-slate-900">{patientsCount}</h3>
            <span className="inline-flex items-center text-[9px] text-emerald-700 font-bold bg-emerald-100/50 px-1.5 py-0.5 rounded-lg border border-emerald-200/35">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12% vs last month
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/80 border border-white/50 backdrop-blur-xs flex items-center justify-center text-blue-650 shadow-xs shrink-0">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-5 hover:bg-white/70 hover:shadow-md transition-all duration-200 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pending Appointments</p>
            <h3 className="text-2xl font-bold font-display text-slate-900">{appointmentsCount}</h3>
            <span className="inline-flex items-center text-[9px] text-blue-700 font-bold bg-blue-100/50 px-1.5 py-0.5 rounded-lg border border-blue-200/35">
              Scheduled
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/80 border border-white/50 backdrop-blur-xs flex items-center justify-center text-amber-650 shadow-xs shrink-0">
            <CalendarIcon className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-5 hover:bg-white/70 hover:shadow-md transition-all duration-200 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Monthly Revenue</p>
            <h3 className="text-2xl font-bold font-display text-slate-900">${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span className="inline-flex items-center text-[9px] text-emerald-700 font-bold bg-emerald-100/50 px-1.5 py-0.5 rounded-lg border border-emerald-200/35">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8.5% growth
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/80 border border-white/50 backdrop-blur-xs flex items-center justify-center text-emerald-650 shadow-xs shrink-0">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-5 hover:bg-white/70 hover:shadow-md transition-all duration-200 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Unpaid Invoices</p>
            <h3 className="text-2xl font-bold font-display text-slate-900">{unpaidCount}</h3>
            {unpaidCount > 0 ? (
              <span className="inline-flex items-center text-[9px] text-rose-700 font-bold bg-rose-100/50 px-1.5 py-0.5 rounded-lg border border-rose-200/35">
                Requires follow-up
              </span>
            ) : (
              <span className="inline-flex items-center text-[9px] text-emerald-700 font-bold bg-emerald-100/50 px-1.5 py-0.5 rounded-lg border border-emerald-200/35">
                All settled
              </span>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/80 border border-white/50 backdrop-blur-xs flex items-center justify-center text-violet-650 shadow-xs shrink-0">
            <Clock className="w-5 h-5 text-violet-600" />
          </div>
        </div>
      </div>

      {/* THREE-COLUMN GRAPH AND NOTIFS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule (2 Columns Wide on desktop) */}
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl overflow-hidden flex flex-col shadow-sm">
          <div className="px-5 py-4 border-b border-white/40 flex items-center justify-between bg-white/20 backdrop-blur-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today&apos;s Appointments</h2>
              <p className="text-[10px] text-slate-500 font-medium">Live treatment list</p>
            </div>
            <button 
              onClick={() => navigate('/appointments')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-0.5"
            >
              <span>Manage List</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {todayApts.length === 0 ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                <CalendarIcon className="w-8 h-8 text-slate-350" />
                <p className="text-xs font-semibold text-slate-500">No appointments scheduled for today</p>
                <button 
                  onClick={() => navigate('/appointments')}
                  className="mt-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl font-bold transition-all"
                >
                  Schedule Appointment
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/30 bg-white/10 text-slate-500 font-bold">
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">Reason</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                  {todayApts.map((a) => (
                    <tr key={a.id} className="hover:bg-white/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <span 
                          onClick={() => navigate(`/patients?id=${a.patientId}`)}
                          className="font-bold text-slate-900 cursor-pointer hover:text-blue-600 hover:underline animate-none"
                        >
                          {a.patientName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">{a.time}</td>
                      <td className="px-5 py-3.5 text-slate-500 truncate max-w-xs">{a.reason}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          a.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          a.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          a.status === 'No Show' ? 'bg-slate-50 text-slate-500 border border-slate-100' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right w-36">
                        {a.status === 'Scheduled' ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleUpdateStatus(a.id, 'Completed')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shift-xs transition-all shadow-xs"
                            >
                              Check-out
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(a.id, 'Cancelled')}
                              className="px-2 py-1 border border-white/40 bg-white/20 text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-bold transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">Session Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Activity Logs */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl overflow-hidden flex flex-col shadow-sm">
          <div className="px-5 py-4 border-b border-white/40 bg-white/20 backdrop-blur-xs">
            <h2 className="text-sm font-bold text-slate-900">Recent Medical Log</h2>
            <p className="text-[10px] text-slate-500 font-medium">Live operational events</p>
          </div>
          <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-96">
            {activities.length === 0 ? (
              <p className="text-center text-xs text-slate-450 py-10">No recent transactions recorded</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex space-x-3 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    act.type === 'appointment' ? 'bg-emerald-500' :
                    act.type === 'payment' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-slate-800 leading-normal font-semibold">{act.message}</p>
                    <span className="text-[9px] text-slate-400 font-medium">{act.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS PANEL (BENTO DRAWER) */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Quick Patient Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <button 
            onClick={() => navigate('/patients')}
            className="flex flex-col items-start p-4 hover:bg-white/60 border border-white/50 rounded-xl text-left transition-all cursor-pointer group bg-white/25 shadow-xs"
          >
            <Users className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-105 transition-transform" />
            <span className="text-xs font-bold text-slate-800">Register Patient</span>
            <span className="text-[10px] text-slate-450 mt-0.5">Add to practice</span>
          </button>

          <button 
            onClick={() => navigate('/appointments')}
            className="flex flex-col items-start p-4 hover:bg-white/60 border border-white/50 rounded-xl text-left transition-all cursor-pointer group bg-white/25 shadow-xs"
          >
            <CalendarIcon className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-105 transition-transform" />
            <span className="text-xs font-bold text-slate-800">Book Session</span>
            <span className="text-[10px] text-slate-450 mt-0.5">Assign appointment date</span>
          </button>

          <button 
            onClick={() => navigate('/prescriptions')}
            className="flex flex-col items-start p-4 hover:bg-white/60 border border-white/50 rounded-xl text-left transition-all cursor-pointer group bg-white/25 shadow-xs"
          >
            <Activity className="w-5 h-5 text-violet-600 mb-2 group-hover:scale-105 transition-transform" />
            <span className="text-xs font-bold text-slate-800">Write Prescription</span>
            <span className="text-[10px] text-slate-450 mt-0.5">Generate Rx slip</span>
          </button>

          <button 
            onClick={() => navigate('/billing')}
            className="flex flex-col items-start p-4 hover:bg-white/60 border border-white/50 rounded-xl text-left transition-all cursor-pointer group bg-white/25 shadow-xs"
          >
            <DollarSign className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-105 transition-transform" />
            <span className="text-xs font-bold text-slate-800">Create Invoice</span>
            <span className="text-[10px] text-slate-450 mt-0.5">Collect billing and charge</span>
          </button>
        </div>
      </div>
    </div>
  );
}
