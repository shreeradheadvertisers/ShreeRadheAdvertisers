



1. **`README.md`**: Professional documentation for your backend repository.
2. **The "Master Prompt"**: A single, powerful instruction block to paste into Lovable (or Cursor/Windsurf) that will generate your complete, production-ready backend code.

---

### Part 1: The README.md

*Create a file named `README.md` in your new backend folder and paste this content.*

```markdown
# 🚀 Shree Radhe Backend API

A high-performance Node.js/Express backend built on a **Zero-Cost Hybrid Architecture**.
This API serves the React frontend, manages MongoDB for data, and offloads heavy media storage to Hostinger via FTP.

## 🏗 Architecture (The "Hybrid" Model)

To maximize performance and eliminate storage costs, we separate concerns:
1.  **Compute:** Render (Node.js/Express) - Handles API requests.
2.  **Database:** MongoDB Atlas (M0 Free Tier) - Stores text data (Users, Media Metadata, Booking Info).
3.  **Object Storage:** Hostinger (via FTP) - Stores physical image files.
    * *Workflow:* Upload API receives file -> Bridges to Hostinger FTP -> Saves URL to MongoDB.

## 🛠 Tech Stack
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (Mongoose ODM)
* **Storage Bridge:** basic-ftp
* **Security:** Helmet, CORS, JWT Auth
* **Email:** Nodemailer (SMTP)

## ⚙️ Environment Variables
Create a `.env` file in the root directory:

```env
# Server Config
PORT=5000
NODE_ENV=production

# Database (MongoDB Atlas)
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/adtconnect?retryWrites=true&w=majority

# Security
JWT_SECRET=your_super_secret_jwt_key_here
CORS_ORIGIN=

# The "Bridge" - Hostinger FTP Details
FTP_HOST=ftp://shreeradheadvertisers.com
FTP_USER=u292422516
FTP_PASS=your_ftp_password
FTP_SECURE=false


```

## 🚀 API Endpoints

### 1. Media Management

* `GET /api/media` - Get all media locations (with filters).
* `GET /api/media/:id` - Get details.
* `POST /api/media` - Create new media (Admin only).
* `PUT /api/media/:id` - Update status/details.
* `DELETE /api/media/:id` - Remove media.

### 2. The "Bridge" (File Upload)

* `POST /api/upload` - Accepts `multipart/form-data`. Uploads to Hostinger FTP and returns the public URL.

### 3. Bookings

* `GET /api/bookings` - Get all bookings.
* `POST /api/bookings` - Create a booking inquiry.

### 4. Admin Auth

* `POST /api/auth/login` - Admin login.
* `POST /api/contact` - Public contact form submission.

## 📦 Installation & Setup

1. **Install Dependencies:**
```bash
npm install

```


2. **Run Development Server:**
```bash
npm run dev

```


3. **Build for Production:**
```bash
npm start

```



```

---