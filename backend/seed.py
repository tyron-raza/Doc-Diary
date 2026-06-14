from app import app, bcrypt
from models import db, User, Patient, Appointment, MedicalRecord, Prescription, PrescriptionItem, Invoice, InvoiceItem

def seed_database():
    with app.app_context():
        # Clear tables
        db.drop_all()
        db.create_all()

        print("Initializing clinical table configurations...")

        # Create Doctor
        hashed_doc_pass = bcrypt.generate_password_hash("password").decode('utf-8')
        doc = User(
            username="doctor",
            email="dr.jane@clinic.com",
            password_hash=hashed_doc_pass,
            role="doctor",
            name="Dr. Jane Doe",
            specialty="General Medicine & Cardiology",
            license_number="MD-102948",
            phone="+1 (555) 019-2834",
            clinic_name="Metro Health Cardiology",
            clinic_address="450 Medical Heights Plaza, Suite 300, Metropolis, NY 10001"
        )
        db.session.add(doc)

        # Create Receptionist
        hashed_rec_pass = bcrypt.generate_password_hash("password").decode('utf-8')
        rec = User(
            username="reception",
            email="mark.reception@clinic.com",
            password_hash=hashed_rec_pass,
            role="receptionist",
            name="Mark Smith",
            phone="+1 (555) 019-5839",
            clinic_name="Metro Health Cardiology",
            clinic_address="450 Medical Heights Plaza, Suite 300, Metropolis, NY 10001"
        )
        db.session.add(rec)

        # Seed Patients
        p1 = Patient(
            name="Robert Jenkins",
            age=58,
            dob="1968-04-12",
            gender="Male",
            phone="+1 (555) 123-4567",
            email="robert.jenkins@email.com",
            address="128 Pinecrest Lane, Queens, NY 11101",
            blood_group="A+",
            emergency_contact_name="Linda Jenkins",
            emergency_contact_phone="+1 (555) 987-6543",
            allergies="Penicillin, Shellfish",
            chronic_diseases="Hypertension, Type 2 Diabetes",
            current_medications="Lisinopril 10mg daily, Metformin 500mg daily",
            previous_surgeries="Appendectomy (1995)",
            medical_notes="Patient complains of occasional mild dizziness in the mornings. Needs regular blood pressure monitoring."
        )
        db.session.add(p1)

        p2 = Patient(
            name="Sarah Montgomery",
            age=34,
            dob="1992-09-24",
            gender="Female",
            phone="+1 (555) 234-5678",
            email="sarah.m@gmail.com",
            address="89 Broadway Apt 4B, Manhattan, NY 10012",
            blood_group="O-",
            emergency_contact_name="George Montgomery",
            emergency_contact_phone="+1 (555) 876-5432",
            allergies="None",
            chronic_diseases="Asthma",
            current_medications="Albuterol inhaler as needed",
            previous_surgeries="None",
            medical_notes="Seasonal asthma acts up during spring. Otherwise active and healthy."
        )
        db.session.add(p2)
        db.session.flush()

        # Seed Appointments
        apt1 = Appointment(
            patient_id=p1.id,
            date="2026-06-14",
            time="09:30",
            reason="Hypertension Follow-up",
            status="Scheduled"
        )
        db.session.add(apt1)

        apt2 = Appointment(
            patient_id=p2.id,
            date="2026-06-14",
            time="11:00",
            reason="Asthma checkup & prescription renewal",
            status="Scheduled"
        )
        db.session.add(apt2)

        # Seed Medical Records
        rec1 = MedicalRecord(
            patient_id=p1.id,
            visit_date="2026-05-14",
            symptoms="Patient reports mild morning headaches and fatigue over the past 2 weeks.",
            diagnosis="Mild hypertension flare-up probably due to increased stress levels.",
            treatment="Adjust lisinopril dosage. Focus on sleep hygiene and stress reduction.",
            notes="Instructed patient to keep a daily log of blood pressure readings."
        )
        db.session.add(rec1)

        # Seed Invoices
        inv1 = Invoice(
            patient_id=p1.id,
            date="2026-05-14",
            consultation_fee=150.0,
            additional_charges=50.0,
            discount=20.0,
            total=180.0,
            status="Paid"
        )
        db.session.add(inv1)
        db.session.flush()

        inv_item1 = InvoiceItem(
            invoice_id=inv1.id,
            service_name="General Consultation",
            amount=150.0
        )
        inv_item2 = InvoiceItem(
            invoice_id=inv1.id,
            service_name="Blood Sugar Screening",
            amount=50.0
        )
        db.session.add(inv_item1)
        db.session.add(inv_item2)

        db.session.commit()
        print("Database clinical logs configuration seeded successfully!")

if __name__ == '__main__':
    seed_database()
)
