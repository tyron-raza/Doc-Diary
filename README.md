# Patient Management System (Doc Diary)

A production-ready, highly polished full-stack Patient Management System designed for medical clinics. 

This application provides a highly visual, clean, and intuitive cockpit for physicians and receptionist staff to manage patient rosters, track visit history, manage calendar schedules, draft prescriptions with printable Rx slips, and organize invoices.

---

## Technical Architecture

* **Frontend:** React (Vite), TailwindCSS, React Router, Axios, Lucide Icons.
* **Backend:** Python Flask API, SQLAlchemy ORM, JWT Token Authentication, Bcrypt Password Hashing.
* **Database:** PostgreSQL.
* **Deployment Platform:** Render (Web Services + Managed Postgres).

---

## 1. Environment Variable Configuration

Create `.env` files in your repositories with the following keys for production connection:

### Backend `.env`
```env
# PostgreSQL connection string provided by Render
DATABASE_URL="postgresql://clinix_admin:password@host/clinix_db"

# Secret key used to encrypt/decrypt JWT login tokens
JWT_SECRET="physician-security-string-xyz-123!"

# local storage folder for uploaded file attachment reports
UPLOAD_FOLDER="./uploads"

# Flask development mode flags
FLASK_ENV="production"
```

### Frontend `.env`
```env
# URL where your Flask REST API is hosted
VITE_API_URL="https://clinix-pms-backend.onrender.com"
```

---

## 2. PostgreSQL Configuration

The system uses SQLAlchemy ORM which handles table definition and relationships bindings automatically upon database initiation.

To verify your SQL schema matches perfectly:
* Verify that you configure a secure database URI in Python (`app.config['SQLALCHEMY_DATABASE_URI']`).
* Primary key indices are configured on patient ID, appointment schedules, invoice lines, and medical report references.
* Cascade deletion relationships ensure that removing an active patient securely drops associated reports, records, and billing charts.

---

## 3. Seed Data Script Documentation

To bootstrap standard development credentials and sample records, run the `/backend/seed.py` utility script:

```bash
# Locate your directory and execution path
cd backend
python seed.py
```

This populates:
1. **Physician Account:** Username `doctor`, Password `password` (Dr. Jane Doe, license keys MD-102948)
2. **Receptionist Account:** Username `reception`, Password `password` (Mark Smith)
3. **Clinical Checkups:** Sample medical patients (Robert Jenkins, Sarah Montgomery), active scheduled checkups for today, diagnostic records, and paid/unpaid invoices.

---

## 4. Database Migration Setup Procedures

To configure scalable migration tracking as your clinic grows, introduce **Flask-Migrate**:

1. **Install Flask-Migrate bindings:**
   ```bash
   pip install Flask-Migrate
   ```

2. **Configure migrate in `app.py`:**
   ```python
   from flask_migrate import Migrate
   migrate = Migrate(app, db)
   ```

3. **Inception of migrations folder:**
   ```bash
   flask db init
   ```

4. **Autogenerate migration migration scripts:**
   ```bash
   flask db migrate -m "Init medical schema layout"
   ```

5. **Upgrade production PostgreSQL:**
   ```bash
   flask db upgrade
   ```

---

## 5. Render Production Deployment Instructions

Deploying this multi-tier infrastructure takes only a few minutes utilizing our pre-packaged `render.yaml` blueprint.

### Step 1: Connect your Git Repository
1. Push this complete codebase to a secure repository on GitHub or GitLab.
2. Log into your **Render Dashboard** ([dashboard.render.com](https://dashboard.render.com)).

### Step 2: Create a Blueprint Deploy
1. Click **"New +"** in the top navigation bar.
2. Select **"Blueprint"** from the options dropdown list.
3. Select your linked project repository.
4. Render will read `/render.yaml` automatically, provisioning:
   * **Managed PostgreSQL Database** (clinix-pms-postgres)
   * **Python Web Service** (clinix-pms-backend)
   * **Static Web App** (clinix-pms-frontend)
5. Review the environmental secret keys and click **"Apply"**.

### Step 3: Seed and Verify
The backend deployment includes an automatic build phase execution trigger executing `python backend/seed.py` immediately when database tables are provisioned. 
Once successfully compiled, your frontend application is live and accessible globally!
