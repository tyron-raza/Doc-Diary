export interface User {
  id: string;
  username: string;
  email: string;
  role: 'doctor' | 'receptionist';
  name: string;
  specialty?: string;
  licenseNumber?: string;
  phone?: string;
  clinicName?: string;
  clinicAddress?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  // Medical Info
  allergies?: string;
  chronicDiseases?: string;
  currentMedications?: string;
  previousSurgeries?: string;
  medicalNotes?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string; // denormalized for easy listing
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  reason: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show';
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  visitDate: string; // YYYY-MM-DD
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string; // e.g. "500mg"
  instructions: string; // e.g. "Take once daily after meal"
  duration: string; // e.g. "7 days"
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  doctorSpecialty?: string;
  doctorLicense?: string;
  date: string;
  items: PrescriptionItem[];
  notes?: string;
  signatureBase64?: string;
}

export interface InvoiceItem {
  id: string;
  serviceName: string;
  amount: number;
}

export interface Invoice {
  id: string; // e.g. "INV-1001"
  patientId: string;
  patientName: string;
  date: string;
  consultationFee: number;
  additionalCharges: number;
  discount: number;
  total: number;
  status: 'Paid' | 'Unpaid';
  items: InvoiceItem[];
}

export interface UploadedReport {
  id: string;
  patientId: string;
  fileName: string;
  fileType: 'pdf' | 'jpg' | 'png' | 'other';
  fileSize: string;
  uploadDate: string;
  dataUrl?: string; // simulation of file storage
}

export interface Notification {
  id: string;
  type: 'appointment' | 'payment' | 'followup';
  title: string;
  message: string;
  date: string;
  read: boolean;
}
