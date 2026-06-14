import { 
  User, Patient, Appointment, MedicalRecord, Prescription, Invoice, UploadedReport, Notification 
} from '../types';

const SEED_USERS: User[] = [
  {
    id: 'u-1',
    username: 'doctor',
    email: 'dr.jane@clinic.com',
    role: 'doctor',
    name: 'Dr. Jane Doe',
    specialty: 'General Medicine & Cardiology',
    licenseNumber: 'MD-102948',
    phone: '+1 (555) 019-2834',
    clinicName: 'Metro Health Cardiology',
    clinicAddress: '450 Medical Heights Plaza, Suite 300, Metropolis, NY 10001'
  },
  {
    id: 'u-2',
    username: 'reception',
    email: 'mark.reception@clinic.com',
    role: 'receptionist',
    name: 'Mark Smith',
    phone: '+1 (555) 019-5839',
    clinicName: 'Metro Health Cardiology',
    clinicAddress: '450 Medical Heights Plaza, Suite 300, Metropolis, NY 10001'
  }
];

const SEED_PATIENTS: Patient[] = [
  {
    id: 'p-1',
    name: 'Robert Jenkins',
    age: 58,
    dob: '1968-04-12',
    gender: 'Male',
    phone: '+1 (555) 123-4567',
    email: 'robert.jenkins@email.com',
    address: '128 Pinecrest Lane, Queens, NY 11101',
    bloodGroup: 'A+',
    emergencyContactName: 'Linda Jenkins',
    emergencyContactPhone: '+1 (555) 987-6543',
    allergies: 'Penicillin, Shellfish',
    chronicDiseases: 'Hypertension, Type 2 Diabetes',
    currentMedications: 'Lisinopril 10mg daily, Metformin 500mg daily',
    previousSurgeries: 'Appendectomy (1995)',
    medicalNotes: 'Patient complains of occasional mild dizziness in the mornings. Needs regular blood pressure monitoring.',
    createdAt: '2026-01-15'
  },
  {
    id: 'p-2',
    name: 'Sarah Montgomery',
    age: 34,
    dob: '1992-09-24',
    gender: 'Female',
    phone: '+1 (555) 234-5678',
    email: 'sarah.m@gmail.com',
    address: '89 Broadway Apt 4B, Manhattan, NY 10012',
    bloodGroup: 'O-',
    emergencyContactName: 'George Montgomery',
    emergencyContactPhone: '+1 (555) 876-5432',
    allergies: 'None',
    chronicDiseases: 'Asthma',
    currentMedications: 'Albuterol inhaler as needed',
    previousSurgeries: 'None',
    medicalNotes: 'Seasonal asthma acts up during spring. Otherwise active and healthy.',
    createdAt: '2026-02-10'
  },
  {
    id: 'p-3',
    name: 'Marcus Vance',
    age: 26,
    dob: '2000-01-30',
    gender: 'Male',
    phone: '+1 (555) 345-6789',
    email: 'marcus.vance@yahoo.com',
    address: '320 Lakeview Dr, Brooklyn, NY 11202',
    bloodGroup: 'B+',
    emergencyContactName: 'Emily Vance',
    emergencyContactPhone: '+1 (555) 765-4321',
    allergies: 'Sulfa drugs',
    chronicDiseases: 'None',
    currentMedications: 'None',
    previousSurgeries: 'Knee arthroscopy (2020)',
    medicalNotes: 'Follow-up on minor sports injury. Active runner.',
    createdAt: '2026-03-22'
  }
];

// Generate appointment dates relative to today's date "2026-06-14"
const SEED_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-101',
    patientId: 'p-1',
    patientName: 'Robert Jenkins',
    date: '2026-06-14',
    time: '09:30',
    reason: 'Hypertension Follow-up',
    status: 'Scheduled'
  },
  {
    id: 'apt-102',
    patientId: 'p-2',
    patientName: 'Sarah Montgomery',
    date: '2026-06-14',
    time: '11:00',
    reason: 'Asthma checkup & prescription renewal',
    status: 'Scheduled'
  },
  {
    id: 'apt-103',
    patientId: 'p-3',
    patientName: 'Marcus Vance',
    date: '2026-06-14',
    time: '14:00',
    reason: 'Knee injury recovery progress',
    status: 'Completed'
  },
  {
    id: 'apt-104',
    patientId: 'p-1',
    patientName: 'Robert Jenkins',
    date: '2026-06-20',
    time: '10:00',
    reason: 'Routine Blood Panel Review',
    status: 'Scheduled'
  }
];

const SEED_RECORDS: MedicalRecord[] = [
  {
    id: 'rec-1',
    patientId: 'p-1',
    visitDate: '2026-05-14',
    symptoms: 'Patient reports mild morning headaches and fatigue over the past 2 weeks.',
    diagnosis: 'Mild hypertension flare-up probably due to increased stress levels.',
    treatment: 'Adjust lisinopril dosage. Focus on sleep hygiene and stress reduction.',
    notes: 'Instructed patient to keep a daily log of blood pressure readings.'
  },
  {
    id: 'rec-2',
    patientId: 'p-3',
    visitDate: '2026-06-14',
    symptoms: 'Knee soreness after light runs. Slight swelling near the patella.',
    diagnosis: 'Patellar tendinitis, post-op soreness.',
    treatment: 'R.I.C.E protocol after running, physical therapy 2x a week.',
    notes: 'Prescribed minor NSAID for inflammation control.'
  }
];

const SEED_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-201',
    patientId: 'p-1',
    patientName: 'Robert Jenkins',
    doctorName: 'Dr. Jane Doe',
    doctorSpecialty: 'General Medicine & Cardiology',
    doctorLicense: 'MD-102948',
    date: '2026-05-14',
    items: [
      {
        id: 'rxi-1',
        medicineName: 'Lisinopril',
        dosage: '15mg',
        instructions: 'Take 1 tablet by mouth daily in the morning',
        duration: '30 days'
      },
      {
        id: 'rxi-2',
        medicineName: 'Metformin HCl',
        dosage: '500mg',
        instructions: 'Take 1 tablet with evening meal twice daily',
        duration: '90 days'
      }
    ],
    notes: 'Monitor blood sugar levels twice daily. Return for lab review in 4 weeks.',
    signatureBase64: 'Jane Doe, M.D.'
  }
];

const SEED_INVOICES: Invoice[] = [
  {
    id: 'INV-1001',
    patientId: 'p-1',
    patientName: 'Robert Jenkins',
    date: '2026-05-14',
    consultationFee: 150,
    additionalCharges: 50,
    discount: 20,
    total: 180,
    status: 'Paid',
    items: [
      { id: 'ivi-1', serviceName: 'General Consultation', amount: 150 },
      { id: 'ivi-2', serviceName: 'Blood Sugar Screening', amount: 50 }
    ]
  },
  {
    id: 'INV-1002',
    patientId: 'p-3',
    patientName: 'Marcus Vance',
    date: '2026-06-14',
    consultationFee: 120,
    additionalCharges: 0,
    discount: 0,
    total: 120,
    status: 'Unpaid',
    items: [
      { id: 'ivi-3', serviceName: 'Physical Therapy Assessment', amount: 120 }
    ]
  }
];

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-1',
    type: 'appointment',
    title: 'Upcoming Appointment',
    message: 'Robert Jenkins - Today at 09:30 AM (Hypertension Follow-up)',
    date: '2026-06-14 08:00',
    read: false
  },
  {
    id: 'n-2',
    type: 'payment',
    title: 'Pending Invoice',
    message: 'Invoice INV-1002 for Marcus Vance ($120.00) is marked as unpaid.',
    date: '2026-06-14 14:15',
    read: false
  },
  {
    id: 'n-3',
    type: 'followup',
    title: 'Patient Follow-up',
    message: 'Sarah Montgomery requires asthma follow-up visit scheduled next week.',
    date: '2026-06-13 16:30',
    read: true
  }
];

class LocalDatabase {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    try {
      return JSON.parse(data);
    } catch {
      return defaultValue;
    }
  }

  private setStorageItem<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Getters
  getUsers(): User[] {
    return this.getStorageItem<User[]>('pms_users', SEED_USERS);
  }

  getCurrentUser(): User | null {
    const defaultUser = this.getUsers()[0] || null;
    return this.getStorageItem<User | null>('pms_current_user', defaultUser);
  }

  setCurrentUser(user: User | null): void {
    this.setStorageItem<User | null>('pms_current_user', user);
  }

  getPatients(): Patient[] {
    return this.getStorageItem<Patient[]>('pms_patients', SEED_PATIENTS);
  }

  getAppointments(): Appointment[] {
    return this.getStorageItem<Appointment[]>('pms_appointments', SEED_APPOINTMENTS);
  }

  getRecords(): MedicalRecord[] {
    return this.getStorageItem<MedicalRecord[]>('pms_records', SEED_RECORDS);
  }

  getPrescriptions(): Prescription[] {
    return this.getStorageItem<Prescription[]>('pms_prescriptions', SEED_PRESCRIPTIONS);
  }

  getInvoices(): Invoice[] {
    return this.getStorageItem<Invoice[]>('pms_invoices', SEED_INVOICES);
  }

  getReports(): UploadedReport[] {
    return this.getStorageItem<UploadedReport[]>('pms_reports', []);
  }

  getNotifications(): Notification[] {
    return this.getStorageItem<Notification[]>('pms_notifications', SEED_NOTIFICATIONS);
  }

  // Mutators - User
  updateUser(updatedUser: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      this.setStorageItem('pms_users', users);
      // If updating current user, sync current user too
      const current = this.getCurrentUser();
      if (current && current.id === updatedUser.id) {
        this.setCurrentUser(updatedUser);
      }
    }
  }

  // Mutators - Patients
  addPatient(patient: Omit<Patient, 'id' | 'createdAt'>): Patient {
    const patients = this.getPatients();
    const newPatient: Patient = {
      ...patient,
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    patients.push(newPatient);
    this.setStorageItem('pms_patients', patients);
    return newPatient;
  }

  updatePatient(updatedPatient: Patient): void {
    const patients = this.getPatients();
    const index = patients.findIndex(p => p.id === updatedPatient.id);
    if (index !== -1) {
      patients[index] = updatedPatient;
      this.setStorageItem('pms_patients', patients);
      
      // Update appointments denormalized patientName if name changes
      const appointments = this.getAppointments();
      let changed = false;
      appointments.forEach(apt => {
        if (apt.patientId === updatedPatient.id && apt.patientName !== updatedPatient.name) {
          apt.patientName = updatedPatient.name;
          changed = true;
        }
      });
      if (changed) {
        this.setStorageItem('pms_appointments', appointments);
      }
    }
  }

  deletePatient(id: string): void {
    let patients = this.getPatients();
    patients = patients.filter(p => p.id !== id);
    this.setStorageItem('pms_patients', patients);

    // Cascade delete or clear related records if you want, but simple filter represents standard UI mock
    let appts = this.getAppointments();
    appts = appts.filter(a => a.patientId !== id);
    this.setStorageItem('pms_appointments', appts);
  }

  // Mutators - Appointments
  addAppointment(apt: Omit<Appointment, 'id'>): Appointment {
    const appointments = this.getAppointments();
    const newApt: Appointment = {
      ...apt,
      id: `apt-${Date.now()}`
    };
    appointments.push(newApt);
    this.setStorageItem('pms_appointments', appointments);

    // Also add notification for scheduled appointment
    if (newApt.status === 'Scheduled') {
      this.addNotification({
        type: 'appointment',
        title: 'New Appointment Scheduled',
        message: `${newApt.patientName} - Scheduled on ${newApt.date} at ${newApt.time}`,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        read: false
      });
    }

    return newApt;
  }

  updateAppointment(updatedApt: Appointment): void {
    const appointments = this.getAppointments();
    const index = appointments.findIndex(a => a.id === updatedApt.id);
    if (index !== -1) {
      const oldApt = appointments[index];
      appointments[index] = updatedApt;
      this.setStorageItem('pms_appointments', appointments);

      // Add notification for change or completion
      if (oldApt.status !== updatedApt.status) {
        let msg = '';
        if (updatedApt.status === 'Completed') {
          msg = `Appointment for ${updatedApt.patientName} marked completed.`;
        } else if (updatedApt.status === 'Cancelled') {
          msg = `Appointment for ${updatedApt.patientName} cancelled.`;
        }
        if (msg) {
          this.addNotification({
            type: 'appointment',
            title: `Appointment Update`,
            message: msg,
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
            read: false
          });
        }
      }
    }
  }

  deleteAppointment(id: string): void {
    let appointments = this.getAppointments();
    appointments = appointments.filter(a => a.id !== id);
    this.setStorageItem('pms_appointments', appointments);
  }

  // Mutators - Medical Records
  addRecord(record: Omit<MedicalRecord, 'id'>): MedicalRecord {
    const records = this.getRecords();
    const newRecord: MedicalRecord = {
      ...record,
      id: `rec-${Date.now()}`
    };
    records.push(newRecord);
    this.setStorageItem('pms_records', records);
    return newRecord;
  }

  updateRecord(updatedRecord: MedicalRecord): void {
    const records = this.getRecords();
    const index = records.findIndex(r => r.id === updatedRecord.id);
    if (index !== -1) {
      records[index] = updatedRecord;
      this.setStorageItem('pms_records', records);
    }
  }

  deleteRecord(id: string): void {
    let records = this.getRecords();
    records = records.filter(r => r.id !== id);
    this.setStorageItem('pms_records', records);
  }

  // Mutators - Prescriptions
  addPrescription(rx: Omit<Prescription, 'id'>): Prescription {
    const prescriptions = this.getPrescriptions();
    const newRx: Prescription = {
      ...rx,
      id: `rx-${Date.now()}`
    };
    prescriptions.push(newRx);
    this.setStorageItem('pms_prescriptions', prescriptions);
    return newRx;
  }

  deletePrescription(id: string): void {
    let prescriptions = this.getPrescriptions();
    prescriptions = prescriptions.filter(r => r.id !== id);
    this.setStorageItem('pms_prescriptions', prescriptions);
  }

  // Mutators - Invoices
  addInvoice(invoice: Omit<Invoice, 'id'>): Invoice {
    const invoices = this.getInvoices();
    const nextNum = 1000 + invoices.length + 1;
    const newInvoice: Invoice = {
      ...invoice,
      id: `INV-${nextNum}`
    };
    invoices.push(newInvoice);
    this.setStorageItem('pms_invoices', invoices);

    if (newInvoice.status === 'Unpaid') {
      this.addNotification({
        type: 'payment',
        title: 'New Unpaid Invoice',
        message: `Invoice ${newInvoice.id} created for ${newInvoice.patientName} (${newInvoice.total.toFixed(2)} USD)`,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        read: false
      });
    }

    return newInvoice;
  }

  updateInvoice(updatedInvoice: Invoice): void {
    const invoices = this.getInvoices();
    const index = invoices.findIndex(i => i.id === updatedInvoice.id);
    if (index !== -1) {
      invoices[index] = updatedInvoice;
      this.setStorageItem('pms_invoices', invoices);
    }
  }

  // Reports
  addReport(report: Omit<UploadedReport, 'id' | 'uploadDate'>): UploadedReport {
    const reports = this.getReports();
    const newReport: UploadedReport = {
      ...report,
      id: `rep-${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0]
    };
    reports.push(newReport);
    this.setStorageItem('pms_reports', reports);
    return newReport;
  }

  deleteReport(id: string): void {
    let reports = this.getReports();
    reports = reports.filter(r => r.id !== id);
    this.setStorageItem('pms_reports', reports);
  }

  // Notifications
  addNotification(notif: Omit<Notification, 'id'>): Notification {
    const notifications = this.getNotifications();
    const newNotif: Notification = {
      ...notif,
      id: `not-${Date.now()}`
    };
    notifications.unshift(newNotif); // latest first
    this.setStorageItem('pms_notifications', notifications);
    return newNotif;
  }

  markNotificationRead(id: string): void {
    const notifications = this.getNotifications();
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].read = true;
      this.setStorageItem('pms_notifications', notifications);
    }
  }

  markAllNotificationsRead(): void {
    const notifications = this.getNotifications();
    notifications.forEach(n => n.read = true);
    this.setStorageItem('pms_notifications', notifications);
  }

  clearNotifications(): void {
    this.setStorageItem('pms_notifications', []);
  }
}

export const db = new LocalDatabase();
