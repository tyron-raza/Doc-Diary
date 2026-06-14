import os
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from werkzeug.utils import secure_filename

from models import db, User, Patient, Appointment, MedicalRecord, Prescription, PrescriptionItem, Invoice, InvoiceItem, UploadedReport

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# Configuration keys
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://localhost/clinix_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('JWT_SECRET', 'super-secure-physician-key-9988!')
app.config['UPLOAD_FOLDER'] = os.environ.get('UPLOAD_FOLDER', './uploads')

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db.init_app(app)

# --- AUTHORIZATION GUIDES ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Access token is missing!'}), 401
            
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'User session expired or invalid.'}), 401
        except Exception as e:
            return jsonify({'message': f'Token decode failed: {str(e)}'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

def doctor_only(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'doctor':
            return jsonify({'message': 'Unauthorized action. Physician qualifications required.'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

# --- AUTH API ENDPOINTS ---
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'message': 'Please provide username and password'}), 400
        
    user = User.query.filter_by(username=data['username']).first()
    if user and bcrypt.check_password_hash(user.password_hash, data['password']):
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({'token': token, 'user': user.to_dict()})
        
    return jsonify({'message': 'Invalid clinic credentials.'}), 401

@app.route('/api/auth/profile', methods=['GET', 'PUT'])
@token_required
def profile(current_user):
    if request.method == 'GET':
        return jsonify(current_user.to_dict())
    
    data = request.json
    if not data:
        return jsonify({'message': 'Payload required'}), 400
        
    current_user.name = data.get('name', current_user.name)
    current_user.email = data.get('email', current_user.email)
    current_user.phone = data.get('phone', current_user.phone)
    current_user.clinic_name = data.get('clinicName', current_user.clinic_name)
    current_user.clinic_address = data.get('clinicAddress', current_user.clinic_address)
    
    # Doctors can customize their specialized license keys
    if current_user.role == 'doctor':
        current_user.specialty = data.get('specialty', current_user.specialty)
        current_user.license_number = data.get('licenseNumber', current_user.license_number)
        
    db.session.commit()
    return jsonify(current_user.to_dict())

# --- PATIENTS API ENDPOINTS (CRUD) ---
@app.route('/api/patients', methods=['GET', 'POST'])
@token_required
def patients_api(current_user):
    if request.method == 'GET':
        query = Patient.query
        search = request.args.get('search')
        gender = request.args.get('gender')
        blood = request.args.get('bloodGroup')
        
        if search:
            query = query.filter(Patient.name.ilike(f'%{search}%') | Patient.phone.like(f'%{search}%'))
        if gender and gender != 'all':
            query = query.filter_by(gender=gender)
        if blood and blood != 'all':
            query = query.filter_by(blood_group=blood)
            
        patients_list = query.all()
        return jsonify([p.to_dict() for p in patients_list])

    # POST - Create patient
    data = request.json
    if not data:
        return jsonify({'message': 'Missing body!'}), 400
        
    new_p = Patient(
        name=data['name'], age=int(data['age']), dob=data['dob'], gender=data['gender'],
        phone=data['phone'], email=data.get('email'), address=data.get('address'),
        blood_group=data['bloodGroup'], emergency_contact_name=data['emergencyContactName'],
        emergency_contact_phone=data['emergencyContactPhone'], allergies=data.get('allergies'),
        chronic_diseases=data.get('chronicDiseases'), current_medications=data.get('currentMedications'),
        previous_surgeries=data.get('previousSurgeries'), medical_notes=data.get('medicalNotes')
    )
    db.session.add(new_p)
    db.session.commit()
    return jsonify(new_p.to_dict()), 201

@app.route('/api/patients/<int:pid>', methods=['GET', 'PUT', 'DELETE'])
@token_required
def patient_detail_api(current_user, pid):
    patient = Patient.query.get_or_404(pid)
    
    if request.method == 'GET':
        return jsonify(patient.to_dict())
        
    if request.method == 'PUT':
        data = request.json
        patient.name = data.get('name', patient.name)
        patient.age = int(data.get('age', patient.age))
        patient.dob = data.get('dob', patient.dob)
        patient.gender = data.get('gender', patient.gender)
        patient.phone = data.get('phone', patient.phone)
        patient.email = data.get('email', patient.email)
        patient.address = data.get('address', patient.address)
        patient.blood_group = data.get('bloodGroup', patient.blood_group)
        patient.emergency_contact_name = data.get('emergencyContactName', patient.emergency_contact_name)
        patient.emergency_contact_phone = data.get('emergencyContactPhone', patient.emergency_contact_phone)
        patient.allergies = data.get('allergies', patient.allergies)
        patient.chronic_diseases = data.get('chronicDiseases', patient.chronic_diseases)
        patient.current_medications = data.get('currentMedications', patient.current_medications)
        patient.previous_surgeries = data.get('previousSurgeries', patient.previous_surgeries)
        patient.medical_notes = data.get('medicalNotes', patient.medical_notes)
        
        db.session.commit()
        return jsonify(patient.to_dict())

    if request.method == 'DELETE':
        db.session.delete(patient)
        db.session.commit()
        return jsonify({'message': 'Patient records dropped.'})

# --- APPOINTMENTS API ---
@app.route('/api/appointments', methods=['GET', 'POST'])
@token_required
def appointments_api(current_user):
    if request.method == 'GET':
        query = Appointment.query
        date = request.args.get('date')
        status = request.args.get('status')
        if date:
            query = query.filter_by(date=date)
        if status and status != 'all':
            query = query.filter_by(status=status)
        return jsonify([apt.to_dict() for apt in query.all()])
        
    data = request.json
    new_apt = Appointment(
        patient_id=int(data['patientId']), date=data['date'], time=data['time'],
        reason=data['reason'], status=data.get('status', 'Scheduled')
    )
    db.session.add(new_apt)
    db.session.commit()
    return jsonify(new_apt.to_dict()), 201

@app.route('/api/appointments/<int:aid>', methods=['PUT', 'DELETE'])
@token_required
def appointment_detail(current_user, aid):
    apt = Appointment.query.get_or_404(aid)
    if request.method == 'PUT':
        data = request.json
        apt.date = data.get('date', apt.date)
        apt.time = data.get('time', apt.time)
        apt.reason = data.get('reason', apt.reason)
        apt.status = data.get('status', apt.status)
        db.session.commit()
        return jsonify(apt.to_dict())
    else:
        db.session.delete(apt)
        db.session.commit()
        return jsonify({'message': 'Appointment removed.'})

# --- MEDICAL RECORDS (VISITIONS) ---
@app.route('/api/records', methods=['GET', 'POST'])
@token_required
def records_api(current_user):
    if request.method == 'GET':
        pat_id = request.args.get('patientId')
        query = MedicalRecord.query
        if pat_id:
            query = query.filter_by(patient_id=int(pat_id))
        return jsonify([rec.to_dict() for rec in query.all()])
        
    data = request.json
    new_rec = MedicalRecord(
        patient_id=int(data['patientId']), visit_date=data['visitDate'],
        symptoms=data['symptoms'], diagnosis=data['diagnosis'],
        treatment=data['treatment'], notes=data.get('notes')
    )
    db.session.add(new_rec)
    db.session.commit()
    return jsonify(new_rec.to_dict()), 201

# --- PRESCRIPTIONS API (DOCTOR ONLY) ---
@app.route('/api/prescriptions', methods=['GET', 'POST'])
@token_required
@doctor_only
def prescriptions_api(current_user):
    if request.method == 'GET':
        pat_id = request.args.get('patientId')
        query = Prescription.query
        if pat_id:
            query = query.filter_by(patient_id=int(pat_id))
        return jsonify([rx.to_dict() for rx in query.all()])
        
    data = request.json
    new_rx = Prescription(
        patient_id=int(data['patientId']), doctor_name=data['doctorName'],
        doctor_specialty=data.get('doctorSpecialty'), doctor_license=data.get('doctorLicense'),
        date=data['date'], notes=data.get('notes'), signature_base64=data.get('signatureBase64')
    )
    db.session.add(new_rx)
    db.session.flush() # get prescription ID
    
    for item in data.get('items', []):
        it = PrescriptionItem(
            prescription_id=new_rx.id, medicine_name=item['medicineName'],
            dosage=item['dosage'], instructions=item['instructions'], duration=item['duration']
        )
        db.session.add(it)
        
    db.session.commit()
    return jsonify(new_rx.to_dict()), 201

# --- INVOICES (BILLING) ---
@app.route('/api/invoices', methods=['GET', 'POST'])
@token_required
def invoices_api(current_user):
    if request.method == 'GET':
        pat_id = request.args.get('patientId')
        status = request.args.get('status')
        query = Invoice.query
        if pat_id:
            query = query.filter_by(patient_id=int(pat_id))
        if status and status != 'all':
            query = query.filter_by(status=status)
        return jsonify([inv.to_dict() for inv in query.all()])
        
    data = request.json
    new_inv = Invoice(
        patient_id=int(data['patientId']), date=data['date'],
        consultation_fee=float(data['consultationFee']),
        additional_charges=float(data.get('additionalCharges', 0)),
        discount=float(data.get('discount', 0)), total=float(data['total']),
        status=data.get('status', 'Unpaid')
    )
    db.session.add(new_inv)
    db.session.flush()
    
    for item in data.get('items', []):
        it = InvoiceItem(invoice_id=new_inv.id, service_name=item['serviceName'], amount=float(item['amount']))
        db.session.add(it)
        
    db.session.commit()
    return jsonify(new_inv.to_dict()), 201

@app.route('/api/invoices/<int:iid>', methods=['PUT'])
@token_required
def invoice_detail(current_user, iid):
    invoice = Invoice.query.get_or_404(iid)
    data = request.json
    invoice.status = data.get('status', invoice.status)
    db.session.commit()
    return jsonify(invoice.to_dict())

# --- FILE ARCHIVES (REPORTS) ---
@app.route('/api/reports/upload', methods=['POST'])
@token_required
def upload_report(current_user):
    if 'file' not in request.files:
         return jsonify({'error': 'No file segment found'}), 400
    file = request.files['file']
    pid = request.form.get('patientId')
    if not file or not pid:
         return jsonify({'error': 'Missing file or patient identification'}), 400
         
    filename = secure_filename(file.filename)
    # Validate extension files
    extension = filename.split('.')[-1].lower() if '.' in filename else ''
    if extension not in ['pdf', 'jpg', 'jpeg', 'png']:
        return jsonify({'error': 'Permitted file endings are PDF, JPG, or PNG only.'}), 400
        
    full_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(full_path)
    
    size_string = f"{(os.path.getsize(full_path) / 1024):.1f} KB"
    
    new_rep = UploadedReport(
         patient_id=int(pid), file_name=filename, file_type=extension,
         file_size=size_string, file_path=full_path, upload_date=datetime.utcnow().strftime('%Y-%m-%d')
    )
    db.session.add(new_rep)
    db.session.commit()
    return jsonify(new_rep.to_dict()), 201

@app.route('/api/reports/<int:rid>', methods=['DELETE'])
@token_required
def delete_report(current_user, rid):
    report = UploadedReport.query.get_or_404(rid)
    # Physically tear down local file securely if exists
    if os.path.exists(report.file_path):
        os.remove(report.file_path)
    db.session.delete(report)
    db.session.commit()
    return jsonify({'message': 'Medical file destroyed.'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
