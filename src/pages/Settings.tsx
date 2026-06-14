import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { api } from '../services/api';
import { User } from '../types';
import { Settings as SettingsIcon, Save, Heart, Shield, RefreshCw, UserCheck } from 'lucide-react';

interface SettingsProps {
  currentUser: User;
  onProfileUpdate: (updatedUser: User) => void;
}

export default function Settings({ currentUser, onProfileUpdate }: SettingsProps) {
  // Doctor/Profile Form states
  const [profileForm, setProfileForm] = useState<User>({ ...currentUser });

  useEffect(() => {
    setProfileForm({ ...currentUser });
  }, [currentUser]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.auth.updateProfile(profileForm);
      onProfileUpdate(updated);
      alert('Practice and system settings saved successfully!');
    } catch (err) {
      alert('Error saving settings profile.');
    }
  };

  // Switch role internally to test permissions
  const handleToggleSandboxRole = () => {
    const nextRole = currentUser.role === 'doctor' ? 'receptionist' : 'doctor';
    
    // Pick the seed profile reflecting the respective role
    const users = db.getUsers();
    const found = users.find(u => u.role === nextRole) || users[0];
    
    db.setCurrentUser(found);
    onProfileUpdate(found);
    alert(`Switched sandbox viewport to role: [${nextRole.toUpperCase()}]`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-brand-650" />
          <span>System Settings & Profile</span>
        </h1>
        <p className="text-xs text-slate-500">Configure clinic defaults, doctor licensing registers, and access control</p>
      </div>

      {/* SANDBOX ROLE PRIVILEGE PANEL */}
      <div className="bg-amber-50/15 border border-amber-100 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-semibold">
        <div className="space-y-1">
          <h3 className="text-amber-850 font-bold flex items-center space-x-1.5 leading-none">
            <UserCheck className="w-4 h-4 text-amber-500" />
            <span>Sandbox Multi-Role Engine</span>
          </h3>
          <p className="text-slate-550 font-medium leading-normal max-w-lg">
            Toggle permissions immediately. Switching to Representative/Receptionist mode restricts prescription controls and clinical edits.
          </p>
        </div>

        <button
          onClick={handleToggleSandboxRole}
          className="px-4.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm text-xs transition-colors shrink-0 font-bold"
        >
          Act as {currentUser.role === 'doctor' ? 'Receptionist' : 'Doctor (Admin)'}
        </button>
      </div>

      {/* SETTINGS CARD FOR PRACTICE INFO */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Physician Register</h2>
        
        <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs text-left">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <label className="font-semibold text-slate-700">Physician Name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-0.5">
              <label className="font-semibold text-slate-700">Licensing Registry ID</label>
              <input
                type="text"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none bg-slate-50"
                value={profileForm.licenseNumber || ''}
                onChange={(e) => setProfileForm({ ...profileForm, licenseNumber: e.target.value })}
                disabled={currentUser.role !== 'doctor'}
              />
            </div>

            <div className="space-y-0.5">
              <label className="font-semibold text-slate-700">Medical Specialty</label>
              <input
                type="text"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none bg-slate-50"
                value={profileForm.specialty || ''}
                onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                disabled={currentUser.role !== 'doctor'}
              />
            </div>

            <div className="space-y-0.5">
              <label className="font-semibold text-slate-700">Practice Contact Email</label>
              <input
                type="email"
                required
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
            </div>

            <div className="space-y-0.5">
              <label className="font-semibold text-slate-700">Contact Phone</label>
              <input
                type="text"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                value={profileForm.phone || ''}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>

            <div className="space-y-0.5">
              <label className="font-semibold text-slate-700">Registered Practice Name</label>
              <input
                type="text"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                value={profileForm.clinicName || ''}
                onChange={(e) => setProfileForm({ ...profileForm, clinicName: e.target.value })}
              />
            </div>

            <div className="space-y-0.5 sm:col-span-2">
              <label className="font-semibold text-slate-700">Practice Physical Address</label>
              <input
                type="text"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                value={profileForm.clinicAddress || ''}
                onChange={(e) => setProfileForm({ ...profileForm, clinicAddress: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs font-semibold"
            >
              <Save className="w-4 h-4" />
              <span>Save Practice Info</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
