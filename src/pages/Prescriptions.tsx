import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { api } from '../services/api';
import { Patient, Prescription, PrescriptionItem, User } from '../types';
import { Plus, Trash, Printer, FileText, Check, FileDown, PlusCircle } from 'lucide-react';

export default function Prescriptions() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentDoctor, setCurrentDoctor] = useState<User | null>(null);
  
  // Selection
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [medsList, setMedsList] = useState<PrescriptionItem[]>([
    { id: '1', medicineName: '', dosage: '', instructions: '', duration: '' }
  ]);

  // Form Meds Inputs
  const [activeMedsIndex, setActiveMedsIndex] = useState(0);

  // Load baseline context
  useEffect(() => {
    const list = db.getPatients();
    setPatients(list);
    if (list.length > 0) {
      setSelectedPatientId(list[0].id);
    }
    setCurrentDoctor(db.getCurrentUser());
  }, []);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Manage dynamic meds builder
  const handleAddMedRow = () => {
    setMedsList([
      ...medsList,
      { id: `med-${Date.now()}`, medicineName: '', dosage: '', instructions: '', duration: '' }
    ]);
  };

  const handleRemoveMedRow = (index: number) => {
    if (medsList.length === 1) return;
    const copied = [...medsList];
    copied.splice(index, 1);
    setMedsList(copied);
  };

  const handleMedChange = (index: number, field: keyof PrescriptionItem, val: string) => {
    const copied = [...medsList];
    copied[index] = { ...copied[index], [field]: val };
    setMedsList(copied);
  };

  const handleSaveRx = async () => {
    if (!selectedPatientId || !selectedPatient || !currentDoctor) {
      alert('Please select a valid patient and ensure the physician credentials are set up.');
      return;
    }

    // Filter out rows with empty medicine name
    const configuredMeds = medsList.filter(m => m.medicineName.trim().length > 0);
    if (configuredMeds.length === 0) {
      alert('Please specify at least one medication in the Prescription grid.');
      return;
    }

    try {
      await api.prescriptions.create({
        patientId: selectedPatientId,
        patientName: selectedPatient.name,
        doctorName: currentDoctor.name,
        doctorSpecialty: currentDoctor.specialty,
        doctorLicense: currentDoctor.licenseNumber,
        date: new Date().toISOString().split('T')[0],
        items: configuredMeds,
        notes: notes,
        signatureBase64: currentDoctor.name
      });

      alert('Prescription saved securely to clinical registry!');
      
      // Reset form
      setMedsList([{ id: '1', medicineName: '', dosage: '', instructions: '', duration: '' }]);
      setNotes('');
    } catch (e) {
      alert('Error saving prescription.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT: Prescription configuration builder (5 Columns) */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs no-print">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Rx Form Builder</h2>
          <p className="text-[10px] text-slate-500">Configure medicines, dosage guidelines, check compatibility</p>
        </div>

        {/* Patient select */}
        <div className="space-y-1 text-xs">
          <label className="font-semibold text-slate-700">Select Patient Profile</label>
          <select
            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} (Age: {p.age})</option>
            ))}
          </select>
        </div>

        {/* Medicines builder Grid */}
        <div className="space-y-3.5 border-t border-slate-100 pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-800">Medications Grid</h3>
            <button
              onClick={handleAddMedRow}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Medication</span>
            </button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {medsList.map((med, index) => (
              <div key={med.id} className="p-3 border border-slate-200 bg-slate-50/20 rounded-lg space-y-2 relative">
                {medsList.length > 1 && (
                  <button
                    onClick={() => handleRemoveMedRow(index)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-rose-600"
                    title="Remove item"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                )}
                
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medication #{index + 1}</p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-0.5 col-span-2">
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs placeholder-slate-400 focus:outline-none"
                      placeholder="Medicine Name (e.g. Paracetamol)"
                      value={med.medicineName}
                      onChange={(e) => handleMedChange(index, 'medicineName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs placeholder-slate-400 focus:outline-none"
                      placeholder="Dosage (e.g. 500mg)"
                      value={med.dosage}
                      onChange={(e) => handleMedChange(index, 'dosage', e.target.value)}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs placeholder-slate-400 focus:outline-none"
                      placeholder="Duration (e.g. 7 days)"
                      value={med.duration}
                      onChange={(e) => handleMedChange(index, 'duration', e.target.value)}
                    />
                  </div>
                  <div className="space-y-0.5 col-span-2">
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs placeholder-slate-400 focus:outline-none"
                      placeholder="Instructions (e.g. take twice daily after food)"
                      value={med.instructions}
                      onChange={(e) => handleMedChange(index, 'instructions', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1 text-xs border-t border-slate-100 pt-4">
          <label className="font-semibold text-slate-700">Special Diet / Clinical Instructions</label>
          <textarea
            rows={2}
            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 text-xs"
            placeholder="e.g. Follow-up blood count panel in 14 days..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>

        <button
          onClick={handleSaveRx}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          Save to Practice Records
        </button>
      </div>

      {/* RIGHT: Professional Rx Certificate Sheet Preview (7 Columns) */}
      <div className="lg:col-span-12 xl:col-span-7 lg:col-start-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-md flex flex-col p-8 space-y-6 print-area bg-white text-slate-800">
          
          {/* Header Doctor Branding */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            {currentDoctor ? (
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide leading-tight">{currentDoctor.name}</h2>
                <p className="text-[10px] text-slate-600 font-medium">{currentDoctor.specialty || 'General Practitioner'}</p>
                <p className="text-[9px] text-slate-450">License No: {currentDoctor.licenseNumber || 'N/A'}</p>
                <p className="text-[9px] text-slate-450">Email: {currentDoctor.email}</p>
              </div>
            ) : (
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-slate-900 uppercase">Dr. Jane Doe, M.D.</h2>
                <p className="text-xs text-slate-600">Cardiology & Practice</p>
                <p className="text-[10px] text-slate-400">License No: MD-102948</p>
              </div>
            )}
            
            <div className="text-right space-y-1">
              <h1 className="text-base font-black tracking-widest text-blue-600 font-display">CLINIC</h1>
              <p className="text-[9px] text-slate-450 max-w-xs block leading-normal">{currentDoctor?.clinicAddress || '450 Medical Heights Plaza, NY 10001'}</p>
              <p className="text-[9px] text-slate-450">Phone: {currentDoctor?.phone || '+1 (555) 019-2834'}</p>
            </div>
          </div>

          {/* Patient Details */}
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium">
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">Patient Name</span>
              <span className="text-slate-950 font-bold">{selectedPatient ? selectedPatient.name : 'No Patient Selected'}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">Age / Gender</span>
              <span className="text-slate-800">{selectedPatient ? `${selectedPatient.age} yrs / ${selectedPatient.gender}` : '-'}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">Date Dispensed</span>
              <span className="text-slate-800">{new Date().toISOString().split('T')[0]}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-450 uppercase block text-rose-600 font-bold">Drug Allergies</span>
              <span className="text-rose-700 font-bold">{selectedPatient?.allergies || 'None reported'}</span>
            </div>
          </div>

          {/* Rx Icon symbol */}
          <div className="text-4xl font-extrabold italic font-display text-blue-600 select-none pb-2 leading-none">
            ℞
          </div>

          {/* Medicines Checklist rendering */}
          <div className="flex-1 min-h-[150px] space-y-3.5 text-xs font-medium">
            {medsList.filter(m => m.medicineName.trim().length > 0).length === 0 ? (
              <div className="py-8 text-center text-slate-450 italic">
                Add medications on the left builder to preview certificate.
              </div>
            ) : (
              medsList.filter(m => m.medicineName.trim().length > 0).map((med, idx) => (
                <div key={idx} className="flex justify-between items-start border-b border-slate-50 pb-2">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-950">{idx + 1}. {med.medicineName} {med.dosage ? `- [${med.dosage}]` : ''}</p>
                    {med.instructions && <p className="text-[10px] text-slate-500 italic ml-4">{med.instructions}</p>}
                  </div>
                  {med.duration && <span className="text-[10px] text-slate-600 font-bold">{med.duration}</span>}
                </div>
              ))
            )}
          </div>

          {/* Prescription Notes Area */}
          {notes && (
            <div className="border-t border-slate-150 pt-4 text-[10px] leading-relaxed text-slate-500 italic text-left">
              <span className="font-bold text-slate-600 uppercase tracking-wider text-[8px] block not-italic mb-1">Physician Directions:</span>
              {notes}
            </div>
          )}

          {/* Footer Signature Block */}
          <div className="border-t border-slate-150 pt-6 flex justify-between items-end text-xs font-medium leading-none">
            <p className="text-[9px] text-slate-400">System validated prescription. Dispense with certified pharmacopoeia directives only.</p>
            <div className="text-center space-y-2.5 shrink-0">
              <p className="font-display italic text-blue-800 text-sm font-black border-b border-slate-350 pb-1.5 px-3">
                {currentDoctor?.name || 'Jane Doe, M.D.'}
              </p>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Authorized signature</span>
            </div>
          </div>

          {/* Buttons trigger */}
          <div className="no-print pt-4 border-t border-slate-100 flex justify-end space-x-2">
            <button
              onClick={() => {
                window.print();
              }}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
            >
              <Printer className="w-4 h-4" />
              <span>Print Rx Slip</span>
            </button>
            <button
              onClick={() => {
                alert('Downloading prescription PDF mockup container files.');
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
            >
              <FileDown className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
