import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { api } from '../services/api';
import { Patient, UploadedReport } from '../types';
import { UploadCloud, FileText, Trash2, Search, Eye, Download, Info, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<UploadedReport[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // States
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    loadContext();
  }, []);

  const loadContext = () => {
    setReports(db.getReports());
    const list = db.getPatients();
    setPatients(list);
    if (list.length > 0) {
      setSelectedPatientId(list[0].id);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPatientId || !event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    try {
      await api.reports.upload(selectedPatientId, file);
      loadContext();
      alert('Report archived securely.');
    } catch (e) {
      alert('Error uploading document file.');
    }
  };

  // Drag and Drop simulation
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!selectedPatientId || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    const file = e.dataTransfer.files[0];
    
    // Validate types
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file format. Please upload PDF, JPG, or PNG files only.');
      return;
    }

    try {
      await api.reports.upload(selectedPatientId, file);
      loadContext();
      alert('Report archived securely.');
    } catch (err) {
      alert('Upload failed.');
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this patient report?')) {
      await api.reports.delete(id);
      loadContext();
    }
  };

  // Filter reports by patient search
  const filteredReports = reports.filter(rep => {
    const pObj = patients.find(p => p.id === rep.patientId);
    if (!pObj) return false;
    return pObj.name.toLowerCase().includes(patientSearchQuery.toLowerCase());
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT PANEL: Upload form widget (5 Columns) */}
      <div className="lg:col-span-12 xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Archive Patient Document</h2>
          <p className="text-[10px] text-slate-500">Store clinical reports, ECG charts, or scans safely under the patient timeline</p>
        </div>

        {/* Form selecting Patient for file binding */}
        <div className="space-y-1 text-xs">
          <label className="font-semibold text-slate-700">Bind Report To Patient</label>
          <select
            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
            ))}
          </select>
        </div>

        {/* Drag and Drop Container Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-2.5 transition-all text-xs cursor-pointer relative ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50/15 text-blue-700' 
              : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
          }`}
        >
          <input
            type="file"
            id="file-archive-selector"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileUpload}
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <UploadCloud className={`w-9 h-9 ${isDragOver ? 'text-blue-600' : 'text-slate-400'}`} />
          <div>
            <p className="font-bold text-slate-800">Drag file here or click to select</p>
            <p className="text-[10px] text-slate-400 mt-1">Supports PDF, JPG, PNG formats up to 10MB</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-lg flex items-start space-x-2 text-[10px] text-slate-500 leading-normal">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>Documents uploaded are automatically tied to the Patient&apos;s history log. You can review them directly under their Patient History sheet dynamically.</span>
        </div>
      </div>

      {/* RIGHT PANEL: Archives directories listing (7 Columns) */}
      <div className="lg:col-span-12 xl:col-span-7 lg:col-start-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col min-h-[400px]">
        
        {/* Directories Search toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Archived Documents Directory</h3>
            <span className="text-[10px] text-slate-500">Filtered cloud file repository</span>
          </div>
          
          <div className="relative w-full sm:w-48 text-xs shrink-0">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient files..."
              value={patientSearchQuery}
              onChange={(e) => setPatientSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Live List elements */}
        <div className="flex-1 overflow-y-auto max-h-[460px] divide-y divide-slate-100">
          {filteredReports.length === 0 ? (
            <div className="py-20 text-center text-slate-405 flex flex-col items-center justify-center space-y-2.5">
              <FileText className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-semibold text-slate-500">No scanned reports archived</p>
            </div>
          ) : (
            filteredReports.map((it) => {
              const matchedPat = patients.find(p => p.id === it.patientId);
              return (
                <div key={it.id} className="py-3.5 flex items-center justify-between text-xs hover:bg-slate-50/20 transition-colors">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-800 truncate" title={it.fileName}>{it.fileName}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-none">
                      Attached to:{' '}
                      <span 
                        onClick={() => navigate(`/patients?id=${it.patientId}`)}
                        className="text-blue-600 hover:underline cursor-pointer"
                      >
                        {matchedPat ? matchedPat.name : 'Unknown Patient'}
                      </span>{' '}
                      • {it.fileType.toUpperCase()} ({it.fileSize})
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {it.dataUrl && (
                      <a
                        href={it.dataUrl}
                        download={it.fileName}
                        className="p-1 border border-slate-200 hover:bg-slate-100 rounded text-slate-600"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteReport(it.id)}
                      className="p-1 border border-slate-200 hover:bg-rose-50 rounded text-rose-500"
                      title="Dispose File"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
