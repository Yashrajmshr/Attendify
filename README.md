# Geolocation-Based Attendance Management System

A production-ready, full-stack attendance system with QR code scanning and geolocation verification.

## Features

- **Role-Based Access**: Secure Faculty and Student portals.
- **Geolocation Verification**: Attendance is only marked if the student is within a faculty-defined radius of the classroom.
- **QR Code Attendance**: Dynamic QR codes containing session security tokens.
- **Faculty Dashboard**: 
  - Create Sessions (Subject, Section, Radius).
  - View Live Active Sessions.
  - Manage Students (Bulk Upload via Excel).
  - Export Attendance Reports (CSV).
- **Student Dashboard**:
  - Scan QR Code with Camera.
  - Real-time Location Validation.
  - View Attendance History.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Html5-Qrcode.
- **Backend**: Node.js, Express.js.
- **Database**: SQLite (Sequelize) - Zero config required!
- **Security**: JWT Authentication, BCrypt Password Hashing.

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)

### 1. Backend Setup

Open a terminal and navigate to the `backend` folder:

```bash
cd backend
npm install
npm start
```

The server will run on `http://localhost:5000`. 
A `database.sqlite` file will be automatically created in the `backend` folder.

### 2. Frontend Setup

Open a new terminal and navigate to the `frontend` folder:

```bash
cd frontend
npm install
npm run dev
```

Access the application at `http://localhost:5173`.

## Usage Guide

### Faculty
1. **Signup/Login** as Faculty.
2. **Create Session**: Go to "Create Session" tab. Click "Get Current Location" to set the center point. Enter Subject, Section, and Radius (e.g., 50 meters). Click Create.
3. **Show QR**: Go to "Active Sessions" tab. A QR code will be displayed. Project this on the screen.
4. **Manage Students**: Use the "Manage Students" tab to upload a student list (Excel) or view registered students.
5. **Reports**: Go to "Reports" to view and export attendance data.

### Student
1. **Signup/Login** as Student.
2. **Scan QR**: Go to "Scan QR" tab. Allow camera and location permissions.
3. **Mark Attendance**: Scan the Faculty's QR code. If you are within the radius and the session is active, attendance will be marked.
4. **History**: View your past attendance records.

## Project Structure

```
/backend
  /config      - DB connection (Sequelize)
  /controllers - Business logic
  /models      - Database Models (SQLite)
  /routes      - API Endpoints
  /utils       - Helper functions (Distance Calc)
  server.js    - Entry point

/frontend
  /src
    /api       - Axios setup
    /components- Dashboard widgets
    /context   - Auth state
    /pages     - Main views
```
