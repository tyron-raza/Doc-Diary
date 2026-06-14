import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { db } from '../services/db';
import { Appointment, Patient } from '../types';
import { Plus, Edit2, Calendar, Clock, Heart, Search, X, Trash2, CheckCircle, Ban, AlertTriangle } from 'lucide-react';

export default function Appointments() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    patientId: '',
    date: '2026-06-14',
    time: '10:00',
    reason: '',
    status: 'Scheduled' as Appointment['status']
  });

  const loadAppointments = async () => {
    try {
      const all = await api.appointments.list(dateFilter, statusFilter);
      setAppointments(all);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    // Load patients for the dropdown selection
    const fetchPatients = async () => {
      const list = await api.patients.list();
      setPatients(list);
    };
    fetchPatients();
  }, []);

  // Sync param highlights
  useEffect(() => {
    const aptId = searchParams.get('id');
    if (aptId && appointments.length > 0) {
      const match = appointments.find(a => a.id === aptId);
      if (match) {
        setSelectedApt(match);
        setFormData({
          patientId: match.patientId,
          date: match.date,
          time: match.time,
          reason: match.reason,
          status: match.status
        });
        setShowEditModal(true);
      }
    }
  }, [searchParams, appointments]);

  const handleOpenAdd = () => {
    setFormData({
      patientId: patients[0]?.id || '',
      date: '2026-06-14',
      time: '12:00',
      reason: '',
      status: 'Scheduled'
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (apt: Appointment) => {
    setSelectedApt(apt);
    setFormData({
      patientId: apt.patientId,
      date: apt.date,
      time: apt.time,
      reason: apt.reason,
      status: apt.status
    });
    setShowEditModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pat = patients.find(p => p.id === formData.patientId);
      if (!pat) throw new Error();
      await api.appointments.create({
        patientId: formData.patientId,
        patientName: pat.name,
        date: formData.date,
        time: formData.time,
        reason: formData.reason,
        status: 'Scheduled'
      });
      setShowAddModal(false);
      loadAppointments();
    } catch (e) {
      alert('Error scheduling session.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApt) return;
    try {
      const pat = patients.find(p => p.id === formData.patientId);
      await api.appointments.update(selectedApt.id, {
        id: selectedApt.id,
        patientId: formData.patientId,
        patientName: pat ? pat.name : selectedApt.patientName,
        date: formData.date,
        time: formData.time,
        reason: formData.reason,
        status: formData.status
      });
      setShowEditModal(false);
      loadAppointments();
    } catch (e) {
      alert('Error rescheduling session.');
    }
  };

  const handleDeleteApt = async (id: string) => {
    if (confirm('Permanently remove this appointment record?')) {
      await api.appointments.delete(id);
      loadAppointments();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Appointments Directory</h1>
          <p className="text-xs text-slate-500">Log new visits and schedule checkups</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4 items-center shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Date Picker */}
          <div className="relative w-full sm:w-44 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Filter Date</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none"
            />
          </div>

          {/* Status filter */}
          <div className="w-full sm:w-48 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Filter Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md bg-white capitalize focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No Show">No Show</option>
            </select>
          </div>
        </div>

        {/* Calendar redirect */}
        <button 
          onClick={() => navigate('/calendar')}
          className="flex items-center space-x-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 text-slate-600 bg-white"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Show Calendar View</span>
        </button>
      </div>

      {/* APPOINTMENTS TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {appointments.length === 0 ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-semibold text-slate-500">No appointments scheduled</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-100/50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-3">Apt Ref ID</th>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Schedule Date</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Indication/Reason</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-slate-400 text-[10px]">{apt.id}</td>
                    <td className="px-6 py-3.5">
                      <span 
                        onClick={() => navigate(`/patients?id=${apt.patientId}`)}
                        className="font-bold text-slate-900 cursor-pointer hover:text-blue-600 hover:underline"
                      >
                        {apt.patientName}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-700">{apt.date}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-750">{apt.time}</td>
                    <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate">{apt.reason}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                        apt.status === 'Cancelled' ? 'bg-rose-50 text-rose-700' :
                        apt.status === 'No Show' ? 'bg-slate-100 text-slate-500' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(apt)}
                          className="p-1 border border-slate-200 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                          title="Reschedule / Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteApt(apt.id)}
                          className="p-1 border border-slate-200 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-600 transition-colors"
                          title="Delete Appointment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: BOOK APPOINTMENT */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl p-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Book Patient Appointment</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs text-left">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Patient</label>
                <select
                  required
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                  ))}
                </select>
                {patients.length === 0 && (
                  <p className="text-[10px] text-rose-600 font-semibold">* You must register a patient first in the Patients section!</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Time</label>
                  <input
                    type="time"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Reason for Visit</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Chronic asthma check, heart blood panel follow up..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-405"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={patients.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESCHEDULE / EDIT */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl p-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Configure Appointment</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs text-left">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Patient</label>
                <select
                  required
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white bg-slate-50 focus:outline-none"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  disabled
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Time</label>
                  <input
                    type="time"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Treatment Status</label>
                <select
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No Show">No Show</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Reason for Visit</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
