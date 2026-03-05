# 🏗️ Shree Radhe Advertisers — Outdoor Advertising Management Platform

**A comprehensive full-stack platform for managing outdoor advertising inventory, bookings, payments, compliance, and analytics across multiple Indian states.**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Public Pages](#-public-pages)
- [Admin Panel](#-admin-panel)
- [Backend API](#-backend-api)
- [Database Architecture](#-database-architecture)
- [File Storage](#-file-storage)
- [Authentication & Authorization](#-authentication--authorization)
- [Analytics & Tracking](#-analytics--tracking)
- [License](#-license)

---

## 🔎 Overview

**Shree Radhe Advertisers (SRA)** is an outdoor advertising company operating primarily in **Chhattisgarh, India**, with expansion support for Madhya Pradesh, Odisha, Maharashtra, Uttar Pradesh and Jharkhand.

This platform serves as a complete **Outdoor Advertising Management (OAM)** system — handling everything from billboard inventory and customer bookings to payment tracking, compliance documents, maintenance scheduling, and business analytics.

### 🎯 Who Is This For?

| User | Purpose |
|------|---------|
| **Public visitors** | Browse available media locations, view details, check availability, and submit inquiries |
| **Admin / Staff** | Manage media inventory, bookings, payments, customers, maintenance, and compliance |
| **Super Admin** | Full system control including user management, audit logs, and analytics |

---

## ✨ Key Features

### 🌐 Public-Facing Website
- **Media Exploration** — Browse billboards, unipoles, hoardings, kiosks, and digital LEDs with advanced filtering (state, district, city, type, status, price range)
- **Media Detail Pages** — High-resolution images, specifications, and interactive availability calendar with booked-date visualization
- **Contact & Inquiry System** — Submit inquiries with auto-generated tracking IDs (`INQ-XXXX`)
- **Responsive Design** — Fully optimized for desktop, tablet, and mobile devices
- **Dark Mode** — System-aware theme toggle with smooth transitions

### 🛡️ Admin Panel (15+ Modules)
- **Dashboard** — Real-time KPIs with clickable drill-down cards (total media, bookings, revenue, payments, inquiries), district breakdown, expiring bookings alerts, and revenue trends
- **Media Management** — Full CRUD for billboard/hoarding inventory with image uploads, public/private visibility, and location hierarchy management
- **Booking Management** — Create, track, and manage bookings with auto-status calculation (Active/Upcoming/Completed/Cancelled), customer-grouped insights, and custom booking IDs (`SRA/{AY}/{seq}`)
- **Payment Tracking** — Record and monitor payments across multiple modes (Cash, Cheque, Online, Bank Transfer) with receipt uploads and reconciliation
- **Customer Management** — Maintain client database with group classification (Corporate, Government, Agency, Startup, Non-Profit) and spending analytics
- **Availability Calendar** — Visual calendar showing booked/available date ranges per media location
- **Analytics & Reports** — Occupancy rates, revenue trends, city-level revenue analysis, vacant site mapping, CSV/Excel exports, and printable reports
- **Compliance & Documents** — Manage tender agreements and tax records with status tracking (Active, Expiring Soon, Expired, Paid, Pending, Overdue)
- **Maintenance Scheduler** — Task management with priority levels (Low/Medium/High/Critical) and status tracking
- **Inquiry Pipeline** — Manage contact form submissions through stages (New → Contacted → Qualified → Converted → Closed)
- **User Management** — Role-based admin user control with soft-delete/deactivation
- **Activity Logs** — Complete audit trail with server-side pagination, filters, and CSV export (stored in a separate database)
- **Recycle Bin** — Soft-delete with 30-day retention and auto-purge for safe data recovery across all modules
- **Location Management** — Hierarchical location data management for 5 Indian states with database sync

### 🔧 Backend & Infrastructure
- **Dual-Database Architecture** — Separate databases for application data and audit logs to prevent log bloat from affecting performance
- **Cloud-Based Image Storage** — Optimized image uploads with eager thumbnail generation for instant grid loading
- **Automated Cron Jobs** — Nightly cleanup of expired soft-deleted records with cascading purge
- **Centralized Error Handling** — Unified middleware for file upload errors, duplicate keys, and validation errors
- **Security Hardened** — HTTP security headers, CORS whitelisting, request size limits, and cryptographic password hashing

---

## 🧰 Tech Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI component library |
| **TypeScript** | Type-safe development |
| **Vite** (SWC) | Lightning-fast build tooling |
| **React Router v6** | Client-side routing |
| **TanStack React Query v5** | Server state management and caching |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** (Radix Primitives) | Accessible, composable UI components |
| **Recharts** | Data visualization and charting |
| **Lucide Icons** | Consistent icon system |
| **React Hook Form + Zod** | Form management with schema validation |
| **Sonner** | Toast notification system |
| **date-fns** | Date manipulation and formatting |
| **react-ga4** | Google Analytics 4 integration |

### Backend

| Technology | Purpose |
|-----------|---------|
| **Node.js** (v18+) | Server runtime |
| **Express.js** | HTTP framework |
| **MongoDB Atlas** | Cloud database (dual-database setup) |
| **Mongoose** | ODM for MongoDB |
| **JSON Web Tokens** | Authentication tokens |
| **Cloudinary** | Image storage and transformation |
| **Multer** | Multipart file upload handling |
| **node-cron** | Scheduled task execution |
| **Helmet** | HTTP security headers |
| **Morgan** | HTTP request logging |
| **json2csv** | CSV export generation |

---

## 📁 Project Structure

```
SRA/
├── public/                          # Static assets
│   ├── robots.txt
│   └── .htaccess                    # SPA rewrite rules (Hostinger)
├── src/                             # Frontend source
│   ├── App.tsx                      # Route definitions
│   ├── main.tsx                     # Entry point
│   ├── index.css                    # Global styles & CSS variables
│   ├── components/
│   │   ├── admin/                   # Admin panel components (18 files)
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── BookingManagement.tsx
│   │   │   ├── CustomerManagement.tsx
│   │   │   ├── PaymentManagement.tsx
│   │   │   ├── MediaTable.tsx
│   │   │   ├── CentralRecycleBin.tsx
│   │   │   └── ...
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx   # Role-based route guard
│   │   ├── public/                  # Public page components
│   │   │   ├── HeroSection.tsx
│   │   │   ├── MediaShowcase.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   └── ...
│   │   └── ui/                      # shadcn/ui components (40+ files)
│   ├── contexts/
│   │   ├── AuthContext.tsx           # JWT auth state management
│   │   ├── LocationDataContext.tsx   # Location hierarchy (5 states)
│   │   └── RecycleBinContext.tsx     # Soft-delete management
│   ├── hooks/
│   │   ├── api/                     # TanStack Query hooks (10 files)
│   │   │   ├── useAnalytics.ts
│   │   │   ├── useBookings.ts
│   │   │   ├── useMedia.ts
│   │   │   └── ...
│   │   ├── use-mobile.tsx           # Responsive breakpoint hook
│   │   └── use-toast.ts             # Toast notification hook
│   ├── layouts/
│   │   ├── AdminLayout.tsx          # Admin shell (sidebar + header)
│   │   └── PublicLayout.tsx         # Public shell (header + footer)
│   ├── lib/
│   │   ├── api.ts                   # API client with interceptors
│   │   ├── api/
│   │   │   ├── client.ts            # Axios-like fetch wrapper
│   │   │   ├── config.ts            # API base URL config
│   │   │   └── types.ts             # Shared TypeScript interfaces
│   │   ├── analytics.ts             # GA4 event tracking
│   │   ├── data.ts                  # Static data constants
│   │   ├── utils.ts                 # Utility functions
│   │   └── services/
│   │       └── dataService.ts       # Data service layer
│   └── pages/
│       ├── Index.tsx                # Home page
│       ├── Explore.tsx              # Media gallery
│       ├── MediaDetail.tsx          # Single media view
│       ├── About.tsx                # About page
│       ├── Contact.tsx              # Contact form
│       ├── NotFound.tsx             # 404 page
│       └── admin/                   # Admin pages (15 files)
│           ├── Dashboard.tsx
│           ├── MediaManagement.tsx
│           ├── Inquiries.tsx
│           ├── Analytics.tsx
│           ├── Reports.tsx
│           └── ...
├── sra-backend/                     # Backend source
│   ├── server.js                    # Express server entry
│   ├── package.json
│   ├── scripts/
│   │   ├── reset-db.js              # Database reset utility
│   │   ├── reset-password.js        # Password reset utility
│   │   └── setup-logs-rotation.js   # Log rotation setup
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # MongoDB dual-connection setup
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT + role-based middleware
│   │   │   ├── errorHandler.js      # Centralized error handling
│   │   │   ├── upload.js            # Multer file upload config
│   │   │   └── index.js
│   │   ├── models/                  # Mongoose schemas (10 models)
│   │   │   ├── Media.js
│   │   │   ├── Booking.js
│   │   │   ├── Customer.js
│   │   │   ├── Payment.js
│   │   │   ├── Contact.js
│   │   │   ├── Maintenance.js
│   │   │   ├── Tender.js
│   │   │   ├── TaxRecord.js
│   │   │   ├── AdminUser.js
│   │   │   ├── ActivityLog.js
│   │   │   └── index.js
│   │   ├── routes/                  # API route handlers (12 groups)
│   │   │   ├── analytics.js
│   │   │   ├── auth.js
│   │   │   ├── bookings.js
│   │   │   ├── customers.js
│   │   │   ├── media.js
│   │   │   ├── payments.js
│   │   │   ├── maintenance.js
│   │   │   ├── contact.js
│   │   │   ├── compliance.js
│   │   │   ├── users.js
│   │   │   ├── recycleBin.js
│   │   │   ├── upload.js
│   │   │   └── index.js
│   │   └── services/
│   │       ├── cloudinaryService.js # Image upload & transformation
│   │       ├── cronService.js       # Scheduled cleanup tasks
│   │       └── logger.js            # Audit trail logger
│   └── temp-uploads/                # Temporary upload directory
├── components.json                  # shadcn/ui configuration
├── tailwind.config.ts               # Tailwind configuration
├── vite.config.ts                   # Vite build configuration
├── tsconfig.json                    # TypeScript configuration
├── eslint.config.js                 # ESLint configuration
└── package.json                     # Root dependencies & scripts
```

> **Note:** This is a proprietary project. Deployment documentation and environment configuration are maintained privately.

---

## 🌐 Public Pages

| Page | Route | Description |
|------|-------|-------------|
| **Home** | `/` | Hero section with company branding, featured media showcase, and call-to-action elements |
| **About** | `/about` | Company overview, mission, and services information |
| **Explore** | `/explore` | Full media gallery with multi-criteria filtering — filter by state, district, city, media type, availability status, and price range |
| **Media Detail** | `/media/:id` | Individual billboard page with high-res images, technical specifications (size, lighting, facing), location details, and an interactive availability calendar showing booked date ranges |
| **Contact** | `/contact` | Inquiry submission form with fields for name, email, phone, company, preferred media type, and message. Each submission receives a unique `INQ-XXXX` tracking ID |

---

## 🛡️ Admin Panel

Access the admin panel at `/admin/login`. The panel provides a comprehensive management interface organized into the following modules:

### 📊 Dashboard
- **KPI Cards** — Total media, available/booked/maintenance counts, active customers, gross revenue, collected revenue, pending payments, and inquiry count
- **Clickable Drill-Downs** — Every stat card opens a detailed list view for deeper analysis
- **District Breakdown** — Media distribution across districts
- **Expiring Bookings** — Alerts for bookings ending within 30 days
- **Recent Activity** — Latest bookings and payment activity

### 📋 Media Management
- Create, edit, and delete media locations (billboards, unipoles, hoardings, kiosks, digital LEDs)
- Upload images via Cloudinary with automatic thumbnail generation
- Toggle public/private visibility for each media
- Track occupancy rate and total days booked
- Location hierarchy: State → District → City → Address

### 📅 Booking Management
- Full booking lifecycle: create → active → completed/cancelled
- Auto-status calculation based on current date vs. booking dates
- Custom booking IDs in Indian financial year format: `SRA/2025-26/001`
- Customer-grouped insights showing total bookings and spending per client
- Link bookings to media locations and customers

### 💰 Payment Management
- Record payments against bookings with multiple modes (Cash, Cheque, Online, Bank Transfer)
- Track payment status: Completed, Pending, Failed, Cancelled, Partially Paid
- Upload payment receipts
- Revenue summary with collection statistics

### 👥 Customer Management
- Maintain a client database with company details and contact information
- Group classification: Corporate, Government, Agency, Startup, Non-Profit
- Track total bookings and total spent per customer
- Search across name, company, and email

### 📆 Availability Calendar
- Visual calendar interface for each media location
- View booked date ranges with color-coded indicators
- Prevent double-booking by disabling already-booked dates
- URL-based media pre-selection for quick access

### 📈 Analytics
- **Occupancy Analysis** — Media utilization rates across the inventory
- **Revenue Trends** — Monthly revenue visualization with charts
- **City-Level Revenue Loss** — Identify underperforming locations
- **Vacant Site Drill-Down** — View vacant sites per city for business development
- **State Revenue Breakdown** — Revenue distribution across states

### 📄 Reports
- Generate reports for media inventory, bookings, revenue, and customers
- Export to CSV/Excel format
- Print-optimized report layouts
- Four report tabs: Media Report, Booking Report, Revenue Report, Customer Report

### 📑 Compliance & Documents
- **Tender Agreements** — Manage tender details with document uploads, track status (Active, Expiring Soon, Expired)
- **Tax Records** — Record tax payments linked to tenders, track due dates and payment status (Paid, Pending, Overdue)

### 🔧 Maintenance
- Create and track maintenance tasks for media locations
- Priority levels: Low, Medium, High, Critical
- Status tracking: Pending → In Progress → Completed
- Scheduled date and completion date tracking

### 📬 Inquiry Management
- View all contact form submissions
- Status pipeline: New → Contacted → Qualified → Converted → Closed
- Mark inquiries as attended with timestamp
- View full inquiry details in dialog

### 👤 User Management
- Create and manage admin users
- Four roles: **Super Admin**, **Admin**, **Staff**, **Viewer**
- Soft-delete/deactivate users (reversible)
- Password management and role assignment

### 📝 Activity Logs
- Complete audit trail of all system actions
- Server-side pagination with advanced filters (user, action, module, date range)
- Action types: Login, Logout, Create, Update, Delete, Export, Restore, Upload
- CSV export for compliance and auditing
- Stored in a separate database to prevent performance impact

### 🗑️ Recycle Bin
- Centralized soft-delete management across all modules
- 30-day retention period before auto-purge
- Bulk restore and permanent delete operations
- Supported types: Media, Booking, Customer, Payment, Tender Agreement, Tax Record, Maintenance

---

## 🔌 Backend API

Base URL: `http://localhost:5000/api`

### API Route Groups

| Prefix | Description | Auth Required |
|--------|-------------|:---:|
| `/api/auth` | Authentication — login, register, verify token, change password | Partial |
| `/api/analytics` | Dashboard stats, occupancy, revenue trends, city loss, vacant sites, CSV exports | ✅ |
| `/api/media` | Media CRUD — create, read, update, soft-delete locations | ✅ (Read: Public) |
| `/api/upload` | File uploads — images (Cloudinary) and documents | ✅ |
| `/api/customers` | Customer CRUD | ✅ |
| `/api/bookings` | Booking CRUD with customer lookup | ✅ |
| `/api/payments` | Payment CRUD with stats summary | ✅ |
| `/api/maintenance` | Maintenance task CRUD | ✅ |
| `/api/contact` | Submit inquiries (public) and manage them (admin) | Partial |
| `/api/compliance` | Tenders and tax records CRUD with compliance stats | ✅ |
| `/api/users` | Admin user management | ✅ (Super Admin) |
| `/api/recycle-bin` | List, restore, and purge soft-deleted records | ✅ |
| `/api/health` | Health check — returns `{ status: 'ok' }` | No |

---

## 🗄️ Database Architecture

The application uses a **dual-database architecture** on MongoDB Atlas:

### Primary Database — Application Data

| Collection | Description | Key Fields |
|-----------|-------------|------------|
| `medias` | Billboard/hoarding inventory | name, type, state, district, city, size, lighting, status, pricePerMonth, imageUrl, bookedDates, occupancyRate |
| `bookings` | Customer bookings | mediaId, customerId, startDate, endDate, amount, amountPaid, paymentStatus, auto-calculated status |
| `customers` | Client companies | name, company, email, phone, group, totalBookings, totalSpent |
| `payments` | Payment records | bookingId, customerId, amount, mode, status, transactionId, receiptUrl |
| `contacts` | Contact form inquiries | inquiryId (auto: INQ-XXXX), name, email, phone, message, status pipeline |
| `maintenances` | Maintenance tasks | mediaId, title, priority, status, scheduledDate, completedDate, cost |
| `tenders` | Tender agreements | tenderName, tenderNumber, district, mediaIds, startDate, endDate, licenseFee, status |
| `taxrecords` | Tax payment records | tenderId, dueDate, paymentDate, amount, status, receiptUrl |
| `adminusers` | Admin user accounts | username, email, passwordHash, salt, role, active, lastLogin |

### Logs Database — Audit Trail (Separate Connection)

| Collection | Description | Key Fields |
|-----------|-------------|------------|
| `activitylogs` | Complete audit trail | user (snapshot: username, fullName, role), action, module, description, details, ipAddress, userAgent |

> **Why separate databases?** Audit logs can grow significantly over time. Isolating them prevents log volume from degrading application query performance. Cross-database references use snapshot fields instead of joins.

---

## 📂 File Storage

### Cloudinary Image Pipeline

```
User Upload → Multer (temp-uploads/) → Cloudinary → Temp Cleanup
```

- **Organization**: `ShreeRadhe/Districts/{district}/Images`
- **Master image**: Limited to 2000px width with auto quality and format
- **Thumbnails**: Eager async generation at 800×600 for instant grid loading
- **Frontend optimization**: `getOptimizedImage()` utility appends Cloudinary transformation parameters dynamically

### Upload Limits

| Setting | Value |
|---------|-------|
| Max file size | 100 MB |
| Allowed image types | JPEG, JPG, PNG, GIF, WebP |
| Allowed document types | PDF, DOC, DOCX |

---

## 🔐 Authentication & Authorization

### Authentication Flow

1. User submits credentials at `/admin/login`
2. Backend validates password using cryptographic hashing with random salt
3. On success, a **JWT** token is issued (configurable expiry)
4. All API requests include the token in the `Authorization: Bearer` header
5. Automatic session expiry with global logout on invalid tokens

### Role Hierarchy

| Role | Level | Permissions |
|------|:-----:|-------------|
| **Super Admin** | 🔴 Highest | Full system control — user management, all CRUD, audit logs, analytics |
| **Admin** | 🟠 High | All operations except user management |
| **Staff** | 🟡 Medium | Create and edit records, limited delete access |
| **Viewer** | 🟢 Low | Read-only access to all modules |

### Middleware

| Middleware | Purpose |
|-----------|---------|
| `authMiddleware` | Validates JWT token on protected routes |
| `requireRole(...roles)` | Restricts access to specified roles |
| `optionalAuth` | Extracts user info if token present (for public routes with optional personalization) |

---

## 📊 Analytics & Tracking

### Google Analytics 4
- Automatic page view tracking across all routes
- Custom event logging for user interactions
- Only active on production URLs (disabled on localhost)

### Backend Analytics Endpoints
- Dashboard aggregation queries for real-time KPIs
- Occupancy rate calculations
- Monthly revenue trend analysis
- City-level revenue loss identification
- Vacant site mapping per city
- All analytics exportable to CSV

---

## 📄 License

This project is proprietary software developed for **Shree Radhe Advertisers**. All rights reserved.