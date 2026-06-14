from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='doctor', nullable=False)  # 'doctor' or 'receptionist'
    name = db.Column(db.String(100), nullable=False)
    specialty = db.Column(db.String(150), nullable=True)
    license_number = db.Column(db.String(50), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    clinic_name = db.Column(db.String(150), nullable=True)
    clinic_address = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "name": self.name,
            "specialty": self.specialty,
            "licenseNumber": self.license_number,
            "phone": self.phone,
            "clinicName": self.clinic_name,
            "clinicAddress": self.clinic_address
        }

class Patient(db.Model):
    __tablename__ = 'patients'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    dob = db.Column(db.String(20), nullable=False)  # YYYY-MM-DD
    gender = db.Column(db.String(20), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), nullable=True)
    address = db.Column(db.Text, nullable=True)
    blood_group = db.Column(db.String(10), nullable=False)
    emergency_contact_name = db.Column(db.String(100), nullable=False)
    emergency_contact_phone = db.Column(db.String(50), nullable=False)
    
    # Medical Checklist
    allergies = db.Column(db.Text, nullable=True)
    chronic_diseases = db.Column(db.Text, nullable=True)
    current_medications = db.Column(db.Text, nullable=True)
    previous_surgeries = db.Column(db.Text, nullable=True)
    medical_notes = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    appointments = db.relationship('Appointment', backref='patient', cascade="all, delete-orphan", lazy=True)
    records = db.relationship('MedicalRecord', backref='patient', cascade="all, delete-orphan", lazy=True)
    prescriptions = db.relationship('Prescription', backref='patient', cascade="all, delete-orphan", lazy=True)
    invoices = db.relationship('Invoice', backref='patient', cascade="all, delete-orphan", lazy=True)
    reports = db.relationship('UploadedReport', backref='patient', cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "age": self.age,
            "dob": self.dob,
            "gender": self.gender,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "bloodGroup": self.blood_group,
            "emergencyContactName": self.emergency_contact_name,
            "emergencyContactPhone": self.emergency_contact_phone,
            "allergies": self.allergies,
            "chronicDiseases": self.chronic_diseases,
            "currentMedications": self.current_medications,
            "previousSurgeries": self.previous_surgeries,
            "medicalNotes": self.medical_notes,
            "createdAt": self.created_at.strftime('%Y-%m-%d') if self.created_at else None
        }

class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    date = db.Column(db.String(20), nullable=False)  # YYYY-MM-DD
    time = db.Column(db.String(20), nullable=False)  # HH:MM
    reason = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(30), default='Scheduled', nullable=False)  # Scheduled, Completed, Cancelled, No Show

    def to_dict(self):
        return {
            "id": f"apt-{self.id}",
            "patientId": str(self.patient_id),
            "patientName": self.patient.name if self.patient else "Unknown",
            "date": self.date,
            "time": self.time,
            "reason": self.reason,
            "status": self.status
        }

class MedicalRecord(db.Model):
    __tablename__ = 'medical_records'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    visit_date = db.Column(db.String(20), nullable=False)  # YYYY-MM-DD
    symptoms = db.Column(db.Text, nullable=False)
    diagnosis = db.Column(db.Text, nullable=False)
    treatment = db.Column(db.Text, nullable=False)
    notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "patientId": str(self.patient_id),
            "visitDate": self.visit_date,
            "symptoms": self.symptoms,
            "diagnosis": self.diagnosis,
            "treatment": self.treatment,
            "notes": self.notes
        }

class Prescription(db.Model):
    __tablename__ = 'prescriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    doctor_name = db.Column(db.String(100), nullable=False)
    doctor_specialty = db.Column(db.String(150), nullable=True)
    doctor_license = db.Column(db.String(50), nullable=True)
    date = db.Column(db.String(20), nullable=False)  # YYYY-MM-DD
    notes = db.Column(db.Text, nullable=True)
    signature_base64 = db.Column(db.Text, nullable=True)

    items = db.relationship('PrescriptionItem', backref='prescription', cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        return {
            "id": f"rx-{self.id}",
            "patientId": str(self.patient_id),
            "patientName": self.patient.name if self.patient else "Unknown",
            "doctorName": self.doctor_name,
            "doctorSpecialty": self.doctor_specialty,
            "doctorLicense": self.doctor_license,
            "date": self.date,
            "notes": self.notes,
            "signatureBase64": self.signature_base64,
            "items": [item.to_dict() for item in self.items]
        }

class PrescriptionItem(db.Model):
    __tablename__ = 'prescription_items'
    
    id = db.Column(db.Integer, primary_key=True)
    prescription_id = db.Column(db.Integer, db.ForeignKey('prescriptions.id'), nullable=False)
    medicine_name = db.Column(db.String(150), nullable=False)
    dosage = db.Column(db.String(50), nullable=False)
    instructions = db.Column(db.Text, nullable=False)
    duration = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            "id": str(self.id),
            "medicineName": self.medicine_name,
            "dosage": self.dosage,
            "instructions": self.instructions,
            "duration": self.duration
        }

class Invoice(db.Model):
    __tablename__ = 'invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    date = db.Column(db.String(20), nullable=False)  # YYYY-MM-DD
    consultation_fee = db.Column(db.Float, default=150.0, nullable=False)
    additional_charges = db.Column(db.Float, default=0.0, nullable=False)
    discount = db.Column(db.Float, default=0.0, nullable=False)
    total = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='Unpaid', nullable=False)  # Paid, Unpaid

    items = db.relationship('InvoiceItem', backref='invoice', cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        return {
            "id": f"INV-{self.id}",
            "patientId": str(self.patient_id),
            "patientName": self.patient.name if self.patient else "Unknown",
            "date": self.date,
            "consultationFee": self.consultation_fee,
            "additionalCharges": self.additional_charges,
            "discount": self.discount,
            "total": self.total,
            "status": self.status,
            "items": [item.to_dict() for item in self.items]
        }

class InvoiceItem(db.Model):
    __tablename__ = 'invoice_items'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'), nullable=False)
    service_name = db.Column(db.String(150), nullable=False)
    amount = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            "id": str(self.id),
            "serviceName": self.service_name,
            "amount": self.amount
        }

class UploadedReport(db.Model):
    __tablename__ = 'uploaded_reports'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(30), nullable=False)  # pdf, jpg, png
    file_size = db.Column(db.String(30), nullable=False)
    file_path = db.Column(db.Text, nullable=False)  # secure storage path
    upload_date = db.Column(db.String(20), nullable=False)  # YYYY-MM-DD

    def to_dict(self):
        return {
            "id": str(self.id),
            "patientId": str(self.patient_id),
            "fileName": self.file_name,
            "fileType": self.file_type,
            "fileSize": self.file_size,
            "uploadDate": self.upload_date
        }
