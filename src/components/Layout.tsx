import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, Calendar as CalendarIcon, FileText, CreditCard, UploadCloud, Settings, LogOut, 
  Menu, X, Bell, Search, Activity, ChevronRight, CheckCircle, ShieldAlert, BadgeInfo, Stethoscope 
} from 'lucide-react';
import { api } from '../services/api';
import { db } from '../services/db';
import { User, Notification, Patient, Appointment, Invoice } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export default function Layout({ children, user, onLogout }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  
  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    patients: Patient[];
    appointments: Appointment[];
    invoices: Invoice[];
  }>({ patients: [], appointments: [], invoices: [] });
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load notifications periodically
    const loadNotifs = () => {
      setNotifications(db.getNotifications());
    };
    loadNotifs();
    const interval = setInterval(loadNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle outside click to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update instant search results
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults({ patients: [], appointments: [], invoices: [] });
      setSearchDropdownOpen(false);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    
    // Search Patients (by name or phone)
    const allPatients = db.getPatients();
    const matchingPatients = allPatients.filter(p => 
      p.name.toLowerCase().includes(q) || p.phone.includes(q)
    );

    // Search Appointments (by ID or patientName)
    const allApts = db.getAppointments();
    const matchingApt = allApts.filter(a => 
      a.id.toLowerCase().includes(q) || a.patientName.toLowerCase().includes(q)
    );

    // Search Invoices (by ID or patientName)
    const allInvoices = db.getInvoices();
    const matchingInvoices = allInvoices.filter(i => 
      i.id.toLowerCase().includes(q) || i.patientName.toLowerCase().includes(q)
    );

    setSearchResults({
      patients: matchingPatients.slice(0, 4),
      appointments: matchingApt.slice(0, 4),
      invoices: matchingInvoices.slice(0, 4)
    });
    setSearchDropdownOpen(true);
  }, [searchQuery]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: Activity, roles: ['doctor', 'receptionist'] },
    { name: 'Patients', path: '/patients', icon: Users, roles: ['doctor', 'receptionist'] },
    { name: 'Appointments', path: '/appointments', icon: CalendarIcon, roles: ['doctor', 'receptionist'] },
    { name: 'Calendar View', path: '/calendar', icon: CalendarIcon, roles: ['doctor', 'receptionist'] },
    { name: 'Prescriptions', path: '/prescriptions', icon: FileText, roles: ['doctor'] }, // doctor only
    { name: 'Billing', path: '/billing', icon: CreditCard, roles: ['doctor', 'receptionist'] },
    { name: 'Medical Reports', path: '/reports', icon: UploadCloud, roles: ['doctor', 'receptionist'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['doctor', 'receptionist'] },
  ];

  // Filters routes based on current user role
  const allowedMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  const handleMarkAllRead = () => {
    db.markAllNotificationsRead();
    setNotifications(db.getNotifications());
  };

  const handleNotifClick = (n: Notification) => {
    db.markNotificationRead(n.id);
    setNotifications(db.getNotifications());
    setNotifDropdownOpen(false);
    
    // Route appropriately
    if (n.type === 'appointment') {
      navigate('/appointments');
    } else if (n.type === 'payment') {
      navigate('/billing');
    }
  };

  const handleResultClick = (route: string) => {
    setSearchQuery('');
    setSearchDropdownOpen(false);
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col md:flex-row relative">
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-white/60 backdrop-blur-xl border-r border-white/40 h-screen sticky top-0 shrink-0">
        {/* LOGO SECTION */}
        <div className="h-20 flex items-center px-6 border-b border-white/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Stethoscope className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-sm font-bold not-italic tracking-tight text-slate-900 leading-none h-[14px]">DocDiary</h1>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">Care Engine</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {allowedMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                  isActive 
                    ? 'bg-blue-50/85 backdrop-blur-xs text-blue-750 border-white/30 shadow-xs font-semibold' 
                    : 'text-slate-600 hover:bg-white/45 hover:text-slate-900 border-transparent hover:border-white/20'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* PROFILE CARD & LOGOUT */}
        <div className="p-4 border-t border-white/40 bg-white/25 backdrop-blur-xs">
          <div className="flex items-center space-x-3 mb-3 p-1">
            <div className="w-10 h-10 rounded-xl bg-white/80 backdrop-blur-md border border-white/40 shadow-xs flex items-center justify-center text-blue-700 font-bold text-sm">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-bold text-slate-800 truncate">{user.name}</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-white/40 hover:text-rose-700 border border-transparent hover:border-white/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 bg-white/60 backdrop-blur-xl border-b border-white/40 z-30 sticky top-0">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Stethoscope className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-900">DocDiary</span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Notification Button */}
          <button 
            onClick={() => {
              setNotifDropdownOpen(!notifDropdownOpen);
              setSearchDropdownOpen(false);
            }}
            className="p-1.5 hover:bg-white/40 rounded-lg text-slate-500 relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
            )}
          </button>
          {/* Burger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 hover:bg-white/40 rounded-lg text-slate-500"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE NAV DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-y-16 inset-x-0 bg-white/85 backdrop-blur-xl z-40 border-b border-slate-200 overflow-y-auto flex flex-col p-4 space-y-2">
          {allowedMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-white/45'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <div className="border-t border-slate-200 pt-4 mt-auto">
            <div className="flex items-center space-x-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-xs font-semibold text-slate-800">{user.name}</h2>
                <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full flex items-center space-x-2.5 px-4 py-3 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* DESKTOP TOP BAR */}
        <header className="hidden md:flex items-center justify-between px-8 h-20 bg-white/40 backdrop-blur-md border-b border-white/35 z-10">
          {/* Global Search Bar */}
          <div ref={searchRef} className="w-96 relative">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="global-search-input"
                type="text"
                placeholder="Search Patient, Phone, Invoice No, Apt ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 rounded-xl border border-white/30 bg-white/60 text-xs text-slate-800 placeholder-slate-450 transition-all placeholder:text-slate-400 shadow-xs"
              />
            </div>

            {/* Global Search Dropdown */}
            {searchDropdownOpen && (
              <div className="absolute left-0 mt-2 w-full bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg z-50 p-2 max-h-96 overflow-y-auto">
                {searchResults.patients.length === 0 && 
                 searchResults.appointments.length === 0 && 
                 searchResults.invoices.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-400">No results found for &quot;{searchQuery}&quot;</p>
                ) : (
                  <div className="space-y-4">
                    {/* Patients Category */}
                    {searchResults.patients.length > 0 && (
                      <div>
                        <h4 className="text-[100%] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider text-[10px]">Patients</h4>
                        {searchResults.patients.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => handleResultClick(`/patients?id=${p.id}`)}
                            className="flex items-center justify-between p-2 hover:bg-white/40 rounded-lg cursor-pointer transition-colors"
                          >
                            <div>
                              <p className="text-xs font-medium text-slate-800">{p.name}</p>
                              <p className="text-[10px] text-slate-500">{p.phone} • {p.gender}, {p.age} yrs</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Appointments Category */}
                    {searchResults.appointments.length > 0 && (
                      <div>
                        <h4 className="text-[100%] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider text-[10px]">Appointments</h4>
                        {searchResults.appointments.map(a => (
                          <div 
                            key={a.id}
                            onClick={() => handleResultClick(`/appointments?id=${a.id}`)}
                            className="flex items-center justify-between p-2 hover:bg-white/40 rounded-lg cursor-pointer transition-colors"
                          >
                            <div>
                              <p className="text-xs font-medium text-slate-800">{a.patientName} ({a.id})</p>
                              <p className="text-[10px] text-slate-500">{a.date} at {a.time} • <span className={`font-semibold ${a.status === 'Completed' ? 'text-teal-600' : 'text-amber-500'}`}>{a.status}</span></p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Invoices Category */}
                    {searchResults.invoices.length > 0 && (
                      <div>
                        <h4 className="text-[100%] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider text-[10px]">Invoices</h4>
                        {searchResults.invoices.map(i => (
                          <div 
                            key={i.id}
                            onClick={() => handleResultClick(`/billing?id=${i.id}`)}
                            className="flex items-center justify-between p-2 hover:bg-white/40 rounded-lg cursor-pointer transition-colors"
                          >
                            <div>
                              <p className="text-xs font-medium text-slate-800">{i.patientName} ({i.id})</p>
                              <p className="text-[10px] text-slate-500">${i.total.toFixed(2)} USD • <span className={`font-semibold ${i.status === 'Paid' ? 'text-teal-600' : 'text-amber-500'}`}>{i.status}</span></p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-4">
            {/* Notifications Dropdown Container */}
            <div ref={notifRef} className="relative">
              <button 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-1.5 hover:bg-white/40 rounded-lg text-slate-500 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {/* Notifications Popup */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-white/30 backdrop-blur-xs border-b border-white/20">
                    <span className="text-xs font-bold text-slate-800">Reminders & Alerts</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-white/20">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No recent notifications
                      </div>
                    ) : (
                      notifications.map(n => {
                        let Icon = BadgeInfo;
                        let colorClass = 'text-blue-500 bg-blue-50/50';
                        if (n.type === 'appointment') {
                          Icon = CheckCircle;
                          colorClass = 'text-emerald-500 bg-emerald-50/50';
                        } else if (n.type === 'payment') {
                          Icon = ShieldAlert;
                          colorClass = 'text-amber-500 bg-amber-50/50';
                        }
                        return (
                          <div 
                            key={n.id}
                            onClick={() => handleNotifClick(n)}
                            className={`flex space-x-3 p-3 text-left hover:bg-white/40 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/20' : ''}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs text-slate-800 leading-normal ${!n.read ? 'font-semibold' : 'font-normal'}`}>
                                {n.message}
                              </p>
                              <span className="text-[9px] text-slate-400 mt-0.5 block">{n.date}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Live Indicator */}
            <div className="flex items-center space-x-2 border-l border-white/40 pl-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-slate-600 font-medium">Session Live</span>
            </div>
          </div>
        </header>

        {/* NOTIFICATIONS CONTAINER FOR MOBILE DROPDOWN */}
        {notifDropdownOpen && (
          <div className="md:hidden bg-white/70 backdrop-blur-xl border-b border-white/25 p-2 divide-y divide-slate-100 max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 mb-1">
              <span className="text-xs font-bold text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-[10px] text-blue-600">Mark all read</button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">No notifications</p>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => handleNotifClick(n)}
                  className={`p-2 hover:bg-slate-50 text-left text-xs ${!n.read ? 'bg-blue-50/30 font-medium' : 'text-slate-600'}`}
                >
                  <p>{n.message}</p>
                  <span className="text-[9px] text-slate-400">{n.date}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
