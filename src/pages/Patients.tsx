import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { db } from '../services/db';
import { Patient, MedicalRecord, Prescription, Invoice, UploadedReport } from '../types';
import { 
  Plus, Edit2, Trash2, Search, Filter, ShieldAlert, Heart, Calendar, 
  FileText, CreditCard, ChevronRight, UserMinus, PlusCircle, Printer, X, Eye, FileDown, UploadCloud
} from 'lucide-react';

export default function Patients() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Search & Filter
  const [query, setQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [bloodFilter, setBloodFilter] = useState('all');

  // Related Patient Data
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>([]);
  const [patientRxs, setPatientRxs] = useState<Prescription[]>([]);
  const [patientInvoices, setPatientInvoices] = useState<Invoice[]>([]);
  const [patientReports, setPatientReports] = useState<UploadedReport[]>([]);

  // Modals & States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  
  // Tab control in Patient Details
  const [activeTab, setActiveTab] = useState<'info' | 'records' | 'prescriptions' | 'billing' | 'reports'>('info');

  // Form Fields - Patient Add/Edit
  const [formData, setFormData] = useState({
    name: '', age: 0, dob: '', gender: 'Male', phone: '', email: '', address: '',
    bloodGroup: 'A+', emergencyContactName: '', emergencyContactPhone: '',
    allergies: '', chronicDiseases: '', currentMedications: '', previousSurgeries: '', medicalNotes: ''
  });

  // Form Fields - Visit Record
  const [recordData, setRecordData] = useState({
    symptoms: '', diagnosis: '', treatment: '', notes: ''
  });

  // Load Patients initially
  const loadPatients = async () => {
    try {
      const list = await api.patients.list(query, bloodFilter, genderFilter);
      setPatients(list);

      // Check query param "id" to auto-select
      const pId = searchParams.get('id');
      if (pId) {
        const found = list.find(p => p.id === pId);
        if (found) {
          handleSelectPatient(found);
        }
      } else if (list.length > 0 && !selectedPatient) {
        handleSelectPatient(list[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [query, genderFilter, bloodFilter]);

  // Read direct param changes
  useEffect(() => {
    const pId = searchParams.get('id');
    if (pId && patients.length > 0) {
      const found = patients.find(p => p.id === pId);
      if (found) {
        handleSelectPatient(found);
      }
    }
  }, [searchParams, patients]);

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    try {
      // Load related items
      const records = await api.records.list(patient.id);
      const prescriptions = await api.prescriptions.list(patient.id);
      const invoices = await api.invoices.list(patient.id);
      const reports = await api.reports.list(patient.id);

      setPatientRecords(records);
      setPatientRxs(prescriptions);
      setPatientInvoices(invoices);
      setPatientReports(reports);
    } catch (e) {
      console.error(e);
    }
  };

  // CRUD handlers
  const handleOpenAdd = () => {
    setFormData({
      name: '', age: 30, dob: '1996-01-01', gender: 'Male', phone: '', email: '', address: '',
      bloodGroup: 'O+', emergencyContactName: '', emergencyContactPhone: '',
      allergies: '', chronicDiseases: '', currentMedications: '', previousSurgeries: '', medicalNotes: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = () => {
    if (!selectedPatient) return;
    setFormData({
      name: selectedPatient.name,
      age: selectedPatient.age,
      dob: selectedPatient.dob,
      gender: selectedPatient.gender,
      phone: selectedPatient.phone,
      email: selectedPatient.email,
      address: selectedPatient.address,
      bloodGroup: selectedPatient.bloodGroup,
      emergencyContactName: selectedPatient.emergencyContactName,
      emergencyContactPhone: selectedPatient.emergencyContactPhone,
      allergies: selectedPatient.allergies || '',
      chronicDiseases: selectedPatient.chronicDiseases || '',
      currentMedications: selectedPatient.currentMedications || '',
      previousSurgeries: selectedPatient.previousSurgeries || '',
      medicalNotes: selectedPatient.medicalNotes || ''
    });
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPatient = await api.patients.create(formData);
      setShowAddModal(false);
      loadPatients();
      handleSelectPatient(newPatient);
    } catch (e) {
      alert('Error creating patient records.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      const updated = await api.patients.update(selectedPatient.id, {
        ...selectedPatient,
        ...formData
      });
      setShowEditModal(false);
      loadPatients();
      handleSelectPatient(updated);
    } catch (e) {
      alert('Error updating patient records.');
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (confirm('Are you absolutely sure you want to delete this patient profile and all linked records?')) {
      try {
        await api.patients.delete(id);
        setSelectedPatient(null);
        searchParams.delete('id');
        setSearchParams(searchParams);
        loadPatients();
      } catch (e) {
        alert('Could not delete patient.');
      }
    }
  };

  // Add Visit Record CRUD
  const handleOpenAddRecord = () => {
    setRecordData({ symptoms: '', diagnosis: '', treatment: '', notes: '' });
    setShowAddRecordModal(true);
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      const rec = await api.records.create({
        patientId: selectedPatient.id,
        visitDate: new Date().toISOString().split('T')[0],
        ...recordData
      });
      setShowAddRecordModal(false);
      const recs = await api.records.list(selectedPatient.id);
      setPatientRecords(recs);
      
      db.addNotification({
        type: 'followup',
        title: 'New Visit Added',
        message: `Registered clinical check-up for ${selectedPatient.name}`,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        read: false
      });
    } catch (e) {
      alert('Error saving record');
    }
  };

  // Mock upload report handler
  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPatient || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      await api.reports.upload(selectedPatient.id, file);
      // Reload reports
      const reports = await api.reports.list(selectedPatient.id);
      setPatientReports(reports);
      alert('Medical file uploaded successfully.');
    } catch (err) {
      alert('Failed uploading report.');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (confirm('Delete this uploaded file?')) {
      await api.reports.delete(reportId);
      if (selectedPatient) {
        const reports = await api.reports.list(selectedPatient.id);
        setPatientReports(reports);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-8rem)]">
      
      {/* LEFT COLUMN: Search and Patients List (5 Columns) */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full shadow-xs">
        {/* Toolbar Header */}
        <div className="p-4 border-b border-slate-150 space-y-3 bg-slate-50/50">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900">Patients Directory</h2>
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Patient</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg border border-slate-200 bg-white text-xs placeholder-slate-400"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex space-x-2">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="flex-1 px-2.5 py-1.5 border border-slate-201 rounded-lg text-[11px] bg-white font-medium text-slate-600"
            >
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <select
              value={bloodFilter}
              onChange={(e) => setBloodFilter(e.target.value)}
              className="flex-1 px-2.5 py-1.5 border border-slate-201 rounded-lg text-[11px] bg-white font-medium text-slate-600"
            >
              <option value="all">All Blood Groups</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>
        </div>

        {/* Patients List */}
        <div className="flex-1 overflow-y-auto max-h-[500px] lg:max-h-[600px] divide-y divide-slate-100">
          {patients.length === 0 ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <PlusCircle className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-semibold text-slate-500">No patients matching filters</p>
            </div>
          ) : (
            patients.map(p => {
              const isSelected = selectedPatient?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className={`flex items-center justify-between p-4 cursor-pointer transition-all ${
                    isSelected ? 'bg-blue-50/55 border-l-4 border-blue-600' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>{p.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{p.phone} • {p.gender}, {p.age} yrs</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Patient Detailed Profile cockpit (7 Columns) */}
      <div className="lg:col-span-12 xl:col-span-7 lg:col-start-6">
        {selectedPatient ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full shadow-xs">
            {/* Header / Basic Info */}
            <div className="p-6 border-b border-slate-150 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                  {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selectedPatient.name}</h2>
                  <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">ID: {selectedPatient.id} • Registered {selectedPatient.createdAt}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleOpenEdit}
                  className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                  title="Edit Patient"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeletePatient(selectedPatient.id)}
                  className="p-1.5 border border-slate-200 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-600 transition-colors"
                  title="Delete Profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-slate-150 overflow-x-auto bg-slate-50/10 no-print">
              {[
                { id: 'info', name: 'Clinical Info', icon: Heart },
                { id: 'records', name: 'Visits Check', icon: Calendar },
                { id: 'prescriptions', name: 'Rx History', icon: FileText },
                { id: 'billing', name: 'Billing', icon: CreditCard },
                { id: 'reports', name: 'Medical Reports', icon: UploadCloud }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                      isActive 
                        ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/20' 
                        : 'border-transparent text-slate-500 hover:text-slate-950'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT PANEL */}
            <div className="p-6 flex-1 overflow-y-auto">
              {/* TAB 1: clinical checklist info */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {/* Personal Grid */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Personal Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-450 uppercase block font-medium">Age & Gender</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{selectedPatient.gender}, {selectedPatient.age} years</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-450 uppercase block font-medium">Blood Type</span>
                        <p className="font-semibold text-rose-600 mt-0.5">{selectedPatient.bloodGroup}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-450 uppercase block font-medium">Phone & Email</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{selectedPatient.phone}</p>
                        <p className="text-slate-500 mt-0.5">{selectedPatient.email || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-450 uppercase block font-medium">Emergency Contact</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{selectedPatient.emergencyContactName}</p>
                        <p className="text-slate-500 mt-0.5">{selectedPatient.emergencyContactPhone}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 sm:col-span-2">
                        <span className="text-[10px] text-slate-450 uppercase block font-medium">Residential Address</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{selectedPatient.address || 'No registered street address'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Medical Grid */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Clinical Profile</h3>
                    <div className="space-y-3 text-xs">
                      <div className="border border-amber-150 bg-amber-50/15 p-4 rounded-lg flex items-start space-x-3">
                        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Drug Allergies</p>
                          <p className="text-amber-800 mt-1 font-medium">{selectedPatient.allergies || 'No known allergies reported.'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="border border-slate-200 p-4 rounded-lg">
                          <p className="font-bold text-slate-900 text-xs text-brand-600 mb-1">Chronic Diseases</p>
                          <p className="text-slate-600 whitespace-pre-wrap">{selectedPatient.chronicDiseases || 'None registered.'}</p>
                        </div>
                        <div className="border border-slate-200 p-4 rounded-lg">
                          <p className="font-bold text-slate-900 text-xs text-brand-600 mb-1">On Medications</p>
                          <p className="text-slate-600 whitespace-pre-wrap">{selectedPatient.currentMedications || 'None.'}</p>
                        </div>
                        <div className="border border-slate-200 p-4 rounded-lg">
                          <p className="font-bold text-slate-900 text-xs text-brand-600 mb-1">Past Surgeries</p>
                          <p className="text-slate-600 whitespace-pre-wrap">{selectedPatient.previousSurgeries || 'None reported.'}</p>
                        </div>
                        <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/30">
                          <p className="font-bold text-slate-900 text-xs text-slate-450 mb-1">Internal Notes</p>
                          <p className="text-slate-600 whitespace-pre-wrap">{selectedPatient.medicalNotes || 'No notes added.'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: clinical visits records */}
              {activeTab === 'records' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medical Visit History</h3>
                    <button
                      onClick={handleOpenAddRecord}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Record Visit</span>
                    </button>
                  </div>

                  {patientRecords.length === 0 ? (
                    <p className="text-slate-460 text-xs py-12 text-center font-medium">No medical visit logs found for this patient.</p>
                  ) : (
                    <div className="space-y-4">
                      {patientRecords.map((rec) => (
                        <div key={rec.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs relative group page-break-avoid">
                          <div className="px-4 py-3 bg-slate-50 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
                            <span className="text-xs font-bold text-slate-850">Clinical Check-up: {rec.visitDate}</span>
                            <button
                              onClick={() => {
                                window.print();
                              }}
                              className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 border border-slate-200 px-2 py-1 rounded bg-white"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Print Record</span>
                            </button>
                          </div>
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="font-bold text-slate-450 uppercase text-[9px] tracking-wider">Presenting Symptoms</p>
                              <p className="text-slate-800 mt-1">{rec.symptoms}</p>
                            </div>
                            <div>
                              <p className="font-bold text-slate-450 uppercase text-[9px] tracking-wider">Clinical Diagnosis</p>
                              <p className="text-slate-800 mt-1 font-medium">{rec.diagnosis}</p>
                            </div>
                            <div className="md:col-span-2 border-t border-slate-100 pt-3">
                              <p className="font-bold text-slate-450 uppercase text-[9px] tracking-wider">Therapy & Treatment Plan</p>
                              <p className="text-slate-850 mt-1 font-semibold text-blue-800">{rec.treatment}</p>
                            </div>
                            {rec.notes && (
                              <div className="md:col-span-2 border-t border-slate-100 pt-3">
                                <p className="font-bold text-slate-450 uppercase text-[9px] tracking-wider">Differential Notes</p>
                                <p className="text-slate-650 mt-1 font-medium italic">{rec.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: prescriptions list */}
              {activeTab === 'prescriptions' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Prescribed Treatments</h3>
                  {patientRxs.length === 0 ? (
                    <p className="text-slate-460 text-xs py-12 text-center">No prescriptions written yet. Go write one in the Prescriptions module!</p>
                  ) : (
                    <div className="space-y-4">
                      {patientRxs.map((rx) => (
                        <div key={rx.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/30 text-xs">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <div>
                              <p className="font-bold text-slate-800">Rx Ref: {rx.id}</p>
                              <p className="text-[10px] text-slate-500">Date: {rx.date}</p>
                            </div>
                            <button
                              onClick={() => {
                                // Dynamic simple print rx layout popup
                                window.print();
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print Rx</span>
                            </button>
                          </div>
                          <div className="space-y-2">
                            {rx.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-slate-900">{idx + 1}. {it.medicineName} ({it.dosage})</p>
                                  <p className="text-[10px] text-slate-500 italic mt-0.5">{it.instructions}</p>
                                </div>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">{it.duration}</span>
                              </div>
                            ))}
                          </div>
                          {rx.notes && (
                            <p className="border-t border-slate-100 pt-2 text-[10px] text-slate-500 italic">Notes: {rx.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Invoices summary */}
              {activeTab === 'billing' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Invoice Ledger</h3>
                  {patientInvoices.length === 0 ? (
                    <p className="text-slate-460 text-xs py-12 text-center font-medium">No recorded payments or invoices for this patient.</p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-150">
                      {patientInvoices.map((inv) => (
                        <div key={inv.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900">{inv.id}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>{inv.status}</span>
                            </div>
                            <span className="text-[10px] text-slate-450 block mt-1">Dispensed: {inv.date} • Total Charge: ${inv.total.toFixed(2)}</span>
                          </div>
                          <button
                            onClick={() => {
                              window.print();
                            }}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Invoice Slip</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: reports list & upload */}
              {activeTab === 'reports' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medical Reports Archive</h3>
                    <div className="relative">
                      <input
                        type="file"
                        id="report-file-uploader"
                        onChange={handleReportUpload}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <label
                        htmlFor="report-file-uploader"
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload File</span>
                      </label>
                    </div>
                  </div>

                  {patientReports.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-xl py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                      <UploadCloud className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-500">No medical reports uploaded</p>
                      <span className="text-[10px] text-slate-400">PDF, JPG, PNG formatted reports safely stored</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {patientReports.map((rep) => (
                        <div key={rep.id} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors">
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-slate-900 truncate" title={rep.fileName}>{rep.fileName}</p>
                            <span className="text-[9px] text-slate-400 mt-1 block capitalize">{rep.fileType} • {rep.fileSize} • {rep.uploadDate}</span>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            {rep.dataUrl && (
                              <a 
                                href={rep.dataUrl} 
                                download={rep.fileName}
                                className="p-1 border border-slate-200 hover:bg-slate-100 rounded text-slate-600"
                                title="Download"
                              >
                                <FileDown className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteReport(rep.id)}
                              className="p-1 border border-slate-200 hover:bg-rose-50 rounded text-rose-500"
                              title="Delete"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-2 h-full shadow-xs">
            <Heart className="w-10 h-10 text-slate-300" />
            <h3 className="text-sm font-bold text-slate-700">Select Patient Profile</h3>
            <p className="text-xs text-slate-500">Pick a patient from the list, edit clinical checkups, generate reports, or schedule sessions.</p>
          </div>
        )}
      </div>

      {/* MODAL: ADD PATIENT */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl p-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Add Patient Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-5 text-xs text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Inputs Info */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Age</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Date of Birth</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Gender</label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Blood Group</label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Address</label>
                  <input
                    type="text"
                    placeholder="Street, City, State"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Emergency Contact Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Emergency Contact Phone</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  />
                </div>
              </div>

              {/* Medical Block */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="font-bold text-slate-800">Initial Medical Info</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-rose-600">Allergies (if any)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                      placeholder="e.g. Penicillin, Sulfa"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Chronic Diseases</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                      placeholder="e.g. Asthma, Diabetes"
                      value={formData.chronicDiseases}
                      onChange={(e) => setFormData({ ...formData, chronicDiseases: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700">Current Medications & Dosages</label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                      value={formData.currentMedications}
                      onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700">Previous Surgeries</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                      value={formData.previousSurgeries}
                      onChange={(e) => setFormData({ ...formData, previousSurgeries: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700">Notes / Medical Remarks</label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                      value={formData.medicalNotes}
                      onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PATIENT */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl p-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Modify Patient Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-5 text-xs text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Inputs Info */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Age</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Date of Birth</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Gender</label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Blood Group</label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Address</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Emergency Contact Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Emergency Contact Phone</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  />
                </div>
              </div>

              {/* Medical Block */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="font-bold text-slate-800">Medical Checklist</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-rose-600">Allergies (if any)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Chronic Diseases</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                      value={formData.chronicDiseases}
                      onChange={(e) => setFormData({ ...formData, chronicDiseases: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700">Current Medications & Dosages</label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                      value={formData.currentMedications}
                      onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700">Previous Surgeries</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                      value={formData.previousSurgeries}
                      onChange={(e) => setFormData({ ...formData, previousSurgeries: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700">Notes / Medical Remarks</label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                      value={formData.medicalNotes}
                      onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CLINICAL RECORD */}
      {showAddRecordModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full shadow-2xl p-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Add Clinical Visit Log</h3>
              <button onClick={() => setShowAddRecordModal(false)} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs text-left">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Presenting Symptoms</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Chest pain, elevated breathing, sore throat..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  value={recordData.symptoms}
                  onChange={(e) => setRecordData({ ...recordData, symptoms: e.target.value })}
                ></textarea>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Diagnosis</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chronic bronchitis, Hypertension flare..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                  value={recordData.diagnosis}
                  onChange={(e) => setRecordData({ ...recordData, diagnosis: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Treatment Plan</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. R.I.C.E, start Amoxicillin 500mg daily..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  value={recordData.treatment}
                  onChange={(e) => setRecordData({ ...recordData, treatment: e.target.value })}
                ></textarea>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Diagnostic Differential Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Check labs in 14 days, return immediately if swelling worsens..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  value={recordData.notes}
                  onChange={(e) => setRecordData({ ...recordData, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddRecordModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Save Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
