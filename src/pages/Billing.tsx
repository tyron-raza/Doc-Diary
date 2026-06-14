import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { api } from '../services/api';
import { Invoice, Patient, InvoiceItem, User } from '../types';
import { Plus, Printer, X, CreditCard, ChevronRight, CheckCircle2, Ticket, Settings, ArrowDownRight } from 'lucide-react';

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentDoctor, setCurrentDoctor] = useState<User | null>(null);

  // Filters
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals & States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Form Fields
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [consultationFee, setConsultationFee] = useState(150);
  const [discount, setDiscount] = useState(0);
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([]);
  
  // Custom single item inputs
  const [serviceNameInput, setServiceNameInput] = useState('');
  const [serviceAmountInput, setServiceAmountInput] = useState(0);

  const loadInvoices = async () => {
    try {
      const all = await api.invoices.list(undefined, statusFilter);
      setInvoices(all);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  useEffect(() => {
    const list = db.getPatients();
    setPatients(list);
    if (list.length > 0) {
      setSelectedPatientId(list[0].id);
    }
    setCurrentDoctor(db.getCurrentUser());
  }, []);

  // Sync Global Search ID highlights
  useEffect(() => {
    const invId = searchParams.get('id');
    if (invId && invoices.length > 0) {
      const match = invoices.find(i => i.id === invId);
      if (match) {
        setSelectedInvoice(match);
      }
    }
  }, [searchParams, invoices]);

  // Calculations
  const calculatedItemsTotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const calculatedGrandTotal = Math.max(0, consultationFee + calculatedItemsTotal - discount);

  const handleAddLineItem = () => {
    if (serviceNameInput && serviceAmountInput >= 0) {
      setLineItems([
        ...lineItems,
        { id: `ivi-${Date.now()}`, serviceName: serviceNameInput, amount: Number(serviceAmountInput) }
      ]);
      setServiceNameInput('');
      setServiceAmountInput(0);
    }
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(lineItems.filter(i => i.id !== id));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const patientObj = patients.find(p => p.id === selectedPatientId);
    if (!patientObj) return;

    try {
      await api.invoices.create({
        patientId: selectedPatientId,
        patientName: patientObj.name,
        date: new Date().toISOString().split('T')[0],
        consultationFee: consultationFee,
        additionalCharges: calculatedItemsTotal,
        discount: discount,
        total: calculatedGrandTotal,
        status: 'Unpaid',
        items: lineItems
      });

      setShowCreateModal(false);
      // Reset
      setLineItems([]);
      setConsultationFee(150);
      setDiscount(0);
      loadInvoices();
    } catch (e) {
      alert('Error dispensing invoice');
    }
  };

  const handleToggleStatus = (inv: Invoice) => {
    const newStatus = inv.status === 'Paid' ? 'Unpaid' : 'Paid';
    const updated = { ...inv, status: newStatus as any };
    api.invoices.update(inv.id, updated).then(() => {
      setSelectedInvoice(updated);
      loadInvoices();
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ledger & Invoice Registry</h1>
          <p className="text-xs text-slate-500">Dispense clinical consultation service fees and track payments</p>
        </div>
        <button
          onClick={() => {
            setLineItems([]);
            setConsultationFee(120);
            setDiscount(0);
            setShowCreateModal(true);
          }}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* BODY GRID: Left side invoice lists, right side active sheet (8+4 or 7+5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Ledger Invoices (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
          {/* Filters header */}
          <div className="p-4 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold text-slate-800">Invoices Directory</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-600 font-medium"
            >
              <option value="all">All Ledgers</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            {invoices.length === 0 ? (
              <p className="py-20 text-center text-slate-400 text-xs font-semibold">No invoices issued</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/30 border-b border-slate-100 text-slate-500 font-semibold tracking-wider text-[10px]">
                    <th className="px-5 py-3">Invoice ID</th>
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3">Issued Date</th>
                    <th className="px-5 py-3">Total Due</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => {
                    const isSelected = selectedInvoice?.id === inv.id;
                    return (
                      <tr 
                        key={inv.id} 
                        onClick={() => setSelectedInvoice(inv)}
                        className={`cursor-pointer hover:bg-slate-50/40 transition-colors ${
                          isSelected ? 'bg-blue-50/35 border-l-4 border-blue-650' : ''
                        }`}
                      >
                        <td className="px-5 py-3.5 font-bold text-slate-900">{inv.id}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{inv.patientName}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-500">{inv.date}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">${inv.total.toFixed(2)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>{inv.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Invoice Certificate Sheet Preview (5 Columns) */}
        <div className="lg:col-span-12 xl:col-span-5 lg:col-start-8">
          {selectedInvoice ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-md p-6 space-y-5 bg-white text-slate-800">
              {/* Doctor Details */}
              <div className="flex justify-between items-start border-b border-slate-150 pb-3">
                <div>
                  <h2 className="text-xs font-black tracking-widest text-blue-600 font-display">CLINIX BILLING</h2>
                  <p className="text-[10px] text-slate-550 leading-relaxed font-semibold">{currentDoctor?.clinicName || 'Metro Cardiology Practice'}</p>
                  <p className="text-[9px] text-slate-400 font-medium">{currentDoctor?.clinicAddress || '450 Medical Heights Plaza, NY'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold text-slate-950">{selectedInvoice.id}</p>
                  <p className="text-[9px] text-slate-400 mt-1">Date: {selectedInvoice.date}</p>
                </div>
              </div>

              {/* Patient info */}
              <div className="text-xs font-semibold text-slate-800">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Billed To:</span>
                <p 
                  onClick={() => navigate(`/patients?id=${selectedInvoice.patientId}`)}
                  className="font-extrabold text-slate-950 hover:text-blue-600 hover:underline cursor-pointer"
                >
                  {selectedInvoice.patientName}
                </p>
                <p className="text-[10px] text-slate-500 font-normal mt-0.5">Patient ID: {selectedInvoice.patientId}</p>
              </div>

              {/* Ledger ledger checklist breakdown */}
              <div className="space-y-2 border-t border-b border-slate-100 py-3 text-xs">
                {/* Consultation line */}
                <div className="flex justify-between items-center text-slate-700 font-semibold">
                  <span>General Doctor Consultation Fee</span>
                  <span>${selectedInvoice.consultationFee.toFixed(2)}</span>
                </div>

                {/* Services lines */}
                {selectedInvoice.items?.map((it, ix) => (
                  <div key={ix} className="flex justify-between items-center text-slate-600 font-medium pl-2 bg-slate-50/15 py-0.5">
                    <span>+ {it.serviceName}</span>
                    <span>${it.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Calculations ledger */}
              <div className="space-y-1.5 text-xs font-medium text-right bg-slate-50 p-3 rounded-lg">
                <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                  <span>Basic Consultation</span>
                  <span>${selectedInvoice.consultationFee.toFixed(2)}</span>
                </div>
                {selectedInvoice.additionalCharges > 0 && (
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                    <span>Clinical Charges</span>
                    <span>${selectedInvoice.additionalCharges.toFixed(2)}</span>
                  </div>
                )}
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-[10px] text-rose-600 font-bold">
                    <span>Discount Allowed</span>
                    <span>-${selectedInvoice.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-950 font-black border-t border-slate-200 pt-2.5">
                  <span>GRAND TOTAL DUE</span>
                  <span>${selectedInvoice.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Status control toggle */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 gap-2">
                <button
                  onClick={() => handleToggleStatus(selectedInvoice)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer ${
                    selectedInvoice.status === 'Paid' 
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800' 
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                >
                  Mark {selectedInvoice.status === 'Paid' ? 'Unpaid' : 'Paid'}
                </button>

                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-slate-400 h-full flex flex-col items-center justify-center space-y-2.5 shadow-xs">
              <CreditCard className="w-9 h-9 text-slate-300 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-700">Audit Invoice Sheet</h3>
              <p className="text-xs text-slate-500 max-w-xs leading-normal">Select an item from the issued directory to review, toggle paid stats, and download local slips.</p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE INVOICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full shadow-2xl p-6 flex flex-col max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Dispense Patient Invoice</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs text-left text-slate-800">
              {/* Select Patient */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Patient</label>
                <select
                  required
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                  ))}
                </select>
              </div>

              {/* Fee Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Consultation Basic Fee ($)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-xs"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-rose-600">Discount Allowed ($)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-xs"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Dynamic Service Lines Addition */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="font-bold text-slate-800">Clinical Add-on Services</h4>
                
                {/* Addition controls */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Service Name</label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none placeholder-slate-400"
                      placeholder="e.g. Cardiogram ECG, Labs report"
                      value={serviceNameInput}
                      onChange={(e) => setServiceNameInput(e.target.value)}
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Amount ($)</label>
                    <input
                      type="number"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                      value={serviceAmountInput}
                      onChange={(e) => setServiceAmountInput(Number(e.target.value))}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 font-bold rounded-lg"
                  >
                    Add
                  </button>
                </div>

                {/* Items List representation */}
                {lineItems.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30 divide-y divide-slate-150 max-h-28 overflow-y-auto">
                    {lineItems.map(it => (
                      <div key={it.id} className="flex justify-between items-center p-2 text-[11px] font-medium text-slate-700">
                        <span>{it.serviceName}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">${it.amount.toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(it.id)}
                            className="text-rose-500 hover:text-rose-700 font-bold text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic calculations list */}
              <div className="bg-slate-100 p-3.5 rounded-lg text-right text-xs mt-3.5 font-bold space-y-1">
                <p className="text-slate-500 font-medium">Add-ons total: ${calculatedItemsTotal.toFixed(2)}</p>
                <p className="text-slate-905 text-sm font-black text-blue-800">Grand Total: ${calculatedGrandTotal.toFixed(2)} USD</p>
              </div>

              {/* Actions submit */}
              <div className="flex justify-end space-x-2 border-t border-slate-150 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Dispense Invoice
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
