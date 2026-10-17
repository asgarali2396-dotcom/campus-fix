# Campus Fix 🛠️
> **Campus Maintenance & Complaint Management System**  
> *DBMS Mini Project — Relational Schema, Normalization (3NF/BCNF), ACID Transactions & Interactive PWA*

[![GitHub repo](https://img.shields.io/badge/GitHub-asgarali2396--dotcom%2Fcampus--fix-blue?logo=github)](https://github.com/asgarali2396-dotcom/campus-fix)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-purple.svg)]()
[![Database](https://img.shields.io/badge/DBMS-MySQL%20%7C%20MariaDB%20%7C%20PostgreSQL-orange.svg)]()

---

## 📌 Project Overview

**Campus Fix** is a full-featured Database Management System (DBMS) Mini Project designed for educational campuses to streamline facility maintenance, infrastructure repairs, complaint tracking, and staff accountability.

It provides a modern Progressive Web App (PWA) client with simulated relational DBMS engines in IndexedDB/WebSQL/LocalStorage, complete with:
- **Relational ER Modeling** & **3NF Normalization**
- **Role-Based Access Control (RBAC)** for Admin, Staff/Technicians, and Students
- **Real-time Complaint Lifecycle Tracking** (Pending ➔ Assigned ➔ In Progress ➔ Resolved ➔ Closed)
- **Live SQL Query Studio & Visual Schema Explorer**
- **Audit Logging** and **Feedback & SLA Analytics**

---

## 👥 Project Team & Academic Guidance

- **Course:** Database Management Systems (DBMS) Mini Project
- **Guide:** Prof. P. R. Nerkar

### Team Members
1. **Sarth Santosh Pande** (Roll No. 28)
2. **Takshak Rahul Sirsat** (Roll No. 30)
3. **Manthan Vinod Dhamal** (Roll No. 35)
4. **Ali Asgar Yusuf Ali** (Roll No. 40)
5. **Rohit Sudhir Karpe** (Roll No. 53)

---

## 🏗️ Relational Database Architecture

The schema adheres to relational database standards, 3rd Normal Form (3NF), foreign key cascades, and check constraints across 8 core relational entities:

1. **`departments`** — Academic and infrastructure maintenance divisions (Electrical, Plumbing, IT & Networking, Carpentry, HVAC, Civil).
2. **`users`** — User management with Role-Based Access Control (`ADMIN`, `STAFF`, `STUDENT`).
3. **`categories`** — Issue categorization mapped to responsible departments with SLA (Service Level Agreement) hours.
4. **`complaints`** — Central ticket ledger capturing title, descriptions, geo-locations, priorities (`Low`, `Medium`, `High`, `Critical`), statuses, and photo attachments.
5. **`assignments`** — Administrator dispatch and staff work orders with instructions.
6. **`complaint_updates`** — Audit trail of chronological technician notes and state transitions.
7. **`feedback`** — Student satisfaction surveys (1 to 5 stars) enforcing strict 1:1 integrity with resolved complaints.
8. **`activity_logs`** — Immutable audit log recording all transactional operations and SQL equivalents.

---

## 📂 Repository Structure

```text
campus-fix/
├── index.html                   # Core single-page interactive application
├── manifest.webmanifest         # PWA Web App Manifest
├── sw.js                        # Progressive Web App Service Worker (offline cache)
├── favicon.ico                  # Browser Favicon
├── campus_maintenance_db_dump.sql # Complete MySQL DDL & DML Schema Script
├── presentation_script_document.html # DBMS Presentation Script & Viva Defense Guide
├── Campus_Fix_DBMS_Presentation_Script.pdf # Printable Presentation Script & Viva Defense PDF
├── css/
│   └── style.css                # Custom Responsive CSS Design System (Warm Luxury Earth Palette)
├── js/
│   ├── app.js                   # Application UI, state & event bindings
│   ├── db.js                    # Relational data layer & mock SQL execution engine
│   └── dbms-showcase.js         # Interactive schema explorer & SQL playground
├── icons/                       # App icons & PWA assets (192px, 512px, SVG)
└── assets/                      # Sample maintenance SVG media & illustrations
```

---

## 🚀 Getting Started

### 1. Running the Web Application
No build tools or heavy installations required! Simply serve the directory with any local static HTTP server:

Using Python:
```bash
python -m http.server 8000
```

Using Node (`npx serve` or `live-server`):
```bash
npx serve .
```

Then open `http://localhost:8000` in any modern web browser.

### 2. Importing the SQL Schema (MySQL / MariaDB)
To deploy the database schema to your local or cloud MySQL instance:

```bash
mysql -u root -p < campus_maintenance_db_dump.sql
```

Or import `campus_maintenance_db_dump.sql` directly via **phpMyAdmin**, **MySQL Workbench**, or **DBeaver**.

---

## ✨ Key Features

- **📱 Progressive Web App (PWA):** Installable on Android, iOS, and Desktop with offline caching via Service Worker.
- **🛡️ Role-Based Access Control:** Switch between Student, Staff/Technician, and Admin views with one click.
- **⚡ Interactive SQL Studio:** Run live `SELECT`, `JOIN`, `GROUP BY`, and aggregation queries directly in the browser.
- **📊 Visual Analytics Dashboard:** Real-time metrics on open complaints, SLA compliance, department load, and resolution times.
- **🔍 Complaint Tracker:** Instant search, status filtering, category filtering, and detailed timeline view.

---

## 📜 License
Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
