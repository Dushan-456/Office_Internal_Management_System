# OIMS — Office Internal Management System

![Modern Management](https://img.shields.io/badge/Status-Operational-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-MERN-blue?style=for-the-badge)
![UI](https://img.shields.io/badge/UI-Premium_Glassmorphism-purple?style=for-the-badge)

OIMS is a high-performance, full-stack internal management portal designed for modern organizations. Built with a focus on visual excellence and robust automation, it streamlines the complex lifecycle of employee leaves, notifications, and administrative workflows.

---

## ✨ Core Highlights

- **💎 Elite UI/UX**: A premium glassmorphic interface built with React and Material UI, featuring ambient lighting, smooth transitions, and high-impact layouts.
- **📅 Leave Intelligence**: A multi-stage leave management engine with acting officer protocols, dynamic balance tracking, and interactive calendar views.
- **🚀 Automated Briefings**: A scheduled notification engine that dispatches daily departmental briefings and personalized acting officer reminders.
- **⚙️ Dynamic Admin Control**: Fully configurable system settings including dynamic departments, leave types, timezone management, and a granular email notification matrix.
- **👤 Identity & Security**: Secure JWT-based authentication with comprehensive employee profiling and automated password recovery.

---

## 🛠 Technology Stack

### Backend (The Core)
- **Node.js & Express**: High-efficiency ESM-based server.
- **MongoDB & Mongoose**: Flexible document storage for organizational data.
- **Nodemailer**: Enterprise email dispatch via secure SMTP.

### Frontend (The Shell)
- **React (Vite)**: Modern, blazing-fast reactive UI.
- **Material UI**: Premium component library with custom theme tokens.
- **Framer Motion**: Sophisticated animations and interactive states.
- **FullCalendar**: Pro-grade scheduling integration.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Gmail SMTP credentials (for notifications)

### 2. Environment Configuration
Create a `.env` file in the `OIMS Backend` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_specific_password
FRONTEND_URL=http://localhost:5173
```

### 3. Installation
```bash
# Backend Setup
cd "OIMS Backend"
npm install
npm run dev

# Frontend Setup
cd "OIMS Frontend"
npm install
npm run dev
```

---

## 📖 Documentation
For deeper technical insights and user manuals, please refer to our specialized documentation:

- [**Feature Guide**](./docs/FEATURES.md) — Detailed breakdown of all functional modules.
- [**API Reference**](./docs/API.md) — Technical routing, role permissions, and data models.

---

## 📋 License
Built for internal organizational use. Proprietary and Confidential.


