import axios from 'axios';
import { db } from './db';
import { 
  User, Patient, Appointment, MedicalRecord, Prescription, Invoice, UploadedReport, Notification 
} from '../types';

// In production, the URL is retrieved from environment variables
// Or relative paths since Vite proxies/serves the build.
// Under Render, the React build can be served on the same domain as the Flask API,
// meaning relative paths like /api are ideal.
const API_BASE_URL = '/api';

const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically inject JWT token into requests if available
apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('pms_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Since we are running in the AI Studio preview environment without a running Python backend process
// (the standard container handles port 3000 as a single process for Vite dev server),
// we use a transparent Local Mock fallback. It mimics the Axios requests but acts on our localStorage database.
// This guarantees that the user can register, login, click buttons, search, and edit records instantly in the frame.
const IS_PREVIEW_ENV = true; // Set to true to bypass backend errors and make the preview fully interactive

export const api = {
  // Authentication
  auth: {
    login: async (username: string, passwordString: string): Promise<{ token: string; user: User }> => {
      if (IS_PREVIEW_ENV) {
        // Mock success
        const users = db.getUsers();
        const user = users.find(u => u.username === username) || users[0];
        const token = 'mock-jwt-token-xyz';
        localStorage.setItem('pms_auth_token', token);
        db.setCurrentUser(user);
        return { token, user };
      }
      const response = await apiInstance.post('/auth/login', { username, password: passwordString });
      localStorage.setItem('pms_auth_token', response.data.token);
      return response.data;
    },
    logout: async (): Promise<void> => {
      localStorage.removeItem('pms_auth_token');
      db.setCurrentUser(null);
      if (IS_PREVIEW_ENV) return;
      await apiInstance.post('/auth/logout');
    },
    getProfile: async (): Promise<User> => {
      if (IS_PREVIEW_ENV) {
        const user = db.getCurrentUser();
        if (!user) throw new Error('Unauthenticated');
        return user;
      }
      const response = await apiInstance.get('/auth/profile');
      return response.data;
    },
    updateProfile: async (user: User): Promise<User> => {
      db.updateUser(user);
      if (IS_PREVIEW_ENV) return user;
      const response = await apiInstance.put('/auth/profile', user);
      return response.data;
    }
  },

  // Patients
  patients: {
    list: async (search?: string, bloodGroup?: string, gender?: string): Promise<Patient[]> => {
      if (IS_PREVIEW_ENV) {
        let list = db.getPatients();
        if (search) {
          const s = search.toLowerCase();
          list = list.filter(p => 
            p.name.toLowerCase().includes(s) || 
            p.phone.includes(s) || 
            p.email.toLowerCase().includes(s)
          );
        }
        if (bloodGroup && bloodGroup !== 'all') {
          list = list.filter(p => p.bloodGroup === bloodGroup);
        }
        if (gender && gender !== 'all') {
          list = list.filter(p => p.gender === gender);
        }
        return list;
      }
      const response = await apiInstance.get('/patients', { params: { search, bloodGroup, gender } });
      return response.data;
    },
    get: async (id: string): Promise<Patient> => {
      if (IS_PREVIEW_ENV) {
        const patient = db.getPatients().find(p => p.id === id);
        if (!patient) throw new Error('Patient not found');
        return patient;
      }
      const response = await apiInstance.get(`/patients/${id}`);
      return response.data;
    },
    create: async (patient: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> => {
      if (IS_PREVIEW_ENV) {
        return db.addPatient(patient);
      }
      const response = await apiInstance.post('/patients', patient);
      return response.data;
    },
    update: async (id: string, patient: Patient): Promise<Patient> => {
      if (IS_PREVIEW_ENV) {
        db.updatePatient(patient);
        return patient;
      }
      const response = await apiInstance.put(`/patients/${id}`, patient);
      return response.data;
    },
    delete: async (id: string): Promise<void> => {
      if (IS_PREVIEW_ENV) {
        db.deletePatient(id);
        return;
      }
      await apiInstance.delete(`/patients/${id}`);
    }
  },

  // Appointments
  appointments: {
    list: async (date?: string, status?: string): Promise<Appointment[]> => {
      if (IS_PREVIEW_ENV) {
        let list = db.getAppointments();
        if (date) {
          list = list.filter(a => a.date === date);
        }
        if (status && status !== 'all') {
          list = list.filter(a => a.status === status);
        }
        return list;
      }
      const response = await apiInstance.get('/appointments', { params: { date, status } });
      return response.data;
    },
    create: async (apt: Omit<Appointment, 'id'>): Promise<Appointment> => {
      if (IS_PREVIEW_ENV) {
        return db.addAppointment(apt);
      }
      const response = await apiInstance.post('/appointments', apt);
      return response.data;
    },
    update: async (id: string, apt: Appointment): Promise<Appointment> => {
      if (IS_PREVIEW_ENV) {
        db.updateAppointment(apt);
        return apt;
      }
      const response = await apiInstance.put(`/appointments/${id}`, apt);
      return response.data;
    },
    delete: async (id: string): Promise<void> => {
      if (IS_PREVIEW_ENV) {
        db.deleteAppointment(id);
        return;
      }
      await apiInstance.delete(`/appointments/${id}`);
    }
  },

  // Medical Records (Visits)
  records: {
    list: async (patientId?: string): Promise<MedicalRecord[]> => {
      if (IS_PREVIEW_ENV) {
        let list = db.getRecords();
        if (patientId) {
          list = list.filter(r => r.patientId === patientId);
        }
        return list;
      }
      const response = await apiInstance.get('/records', { params: { patientId } });
      return response.data;
    },
    create: async (record: Omit<MedicalRecord, 'id'>): Promise<MedicalRecord> => {
      if (IS_PREVIEW_ENV) {
        return db.addRecord(record);
      }
      const response = await apiInstance.post('/records', record);
      return response.data;
    },
    update: async (id: string, record: MedicalRecord): Promise<MedicalRecord> => {
      if (IS_PREVIEW_ENV) {
        db.updateRecord(record);
        return record;
      }
      const response = await apiInstance.put(`/records/${id}`, record);
      return response.data;
    },
    delete: async (id: string): Promise<void> => {
      if (IS_PREVIEW_ENV) {
        db.deleteRecord(id);
        return;
      }
      await apiInstance.delete(`/records/${id}`);
    }
  },

  // Prescriptions
  prescriptions: {
    list: async (patientId?: string): Promise<Prescription[]> => {
      if (IS_PREVIEW_ENV) {
        let list = db.getPrescriptions();
        if (patientId) {
          list = list.filter(p => p.patientId === patientId);
        }
        return list;
      }
      const response = await apiInstance.get('/prescriptions', { params: { patientId } });
      return response.data;
    },
    create: async (rx: Omit<Prescription, 'id'>): Promise<Prescription> => {
      if (IS_PREVIEW_ENV) {
        return db.addPrescription(rx);
      }
      const response = await apiInstance.post('/prescriptions', rx);
      return response.data;
    },
    delete: async (id: string): Promise<void> => {
      if (IS_PREVIEW_ENV) {
        db.deletePrescription(id);
        return;
      }
      await apiInstance.delete(`/prescriptions/${id}`);
    }
  },

  // Invoices (Billing)
  invoices: {
    list: async (patientId?: string, status?: string): Promise<Invoice[]> => {
      if (IS_PREVIEW_ENV) {
        let list = db.getInvoices();
        if (patientId) {
          list = list.filter(i => i.patientId === patientId);
        }
        if (status && status !== 'all') {
          list = list.filter(i => i.status === status);
        }
        return list;
      }
      const response = await apiInstance.get('/invoices', { params: { patientId, status } });
      return response.data;
    },
    create: async (invoice: Omit<Invoice, 'id'>): Promise<Invoice> => {
      if (IS_PREVIEW_ENV) {
        return db.addInvoice(invoice);
      }
      const response = await apiInstance.post('/invoices', invoice);
      return response.data;
    },
    update: async (id: string, invoice: Invoice): Promise<Invoice> => {
      if (IS_PREVIEW_ENV) {
        db.updateInvoice(invoice);
        return invoice;
      }
      const response = await apiInstance.put(`/invoices/${id}`, invoice);
      return response.data;
    }
  },

  // Actionable Reports (File Upload mock)
  reports: {
    list: async (patientId?: string): Promise<UploadedReport[]> => {
      if (IS_PREVIEW_ENV) {
        let list = db.getReports();
        if (patientId) {
          list = list.filter(r => r.patientId === patientId);
        }
        return list;
      }
      const response = await apiInstance.get('/reports', { params: { patientId } });
      return response.data;
    },
    upload: async (patientId: string, file: File): Promise<UploadedReport> => {
      if (IS_PREVIEW_ENV) {
        // Simulate local reading of file
        const sizeString = `${(file.size / 1024).toFixed(1)} KB`;
        const extension = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();
        const type: 'pdf' | 'jpg' | 'png' | 'other' = 
          ['pdf', 'jpg', 'png'].includes(extension) ? extension as any : 'other';

        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
             const dataUrl = typeof reader.result === 'string' ? reader.result : undefined;
             const newFile = db.addReport({
               patientId,
               fileName: file.name,
               fileType: type,
               fileSize: sizeString,
               dataUrl: dataUrl
             });
             resolve(newFile);
          };
          reader.readAsDataURL(file);
        });
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', patientId);
      const response = await apiInstance.post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    delete: async (id: string): Promise<void> => {
      if (IS_PREVIEW_ENV) {
        db.deleteReport(id);
        return;
      }
      await apiInstance.delete(`/reports/${id}`);
    }
  }
};
