# PMN ERP Platform - CRM Module

## 🎯 Overview

**PMN ERP Platform** is a modular Enterprise Resource Planning system built for **Paramount Merchant Navy**. This is **Phase 1** which includes the **CRM (Customer Relationship Management)** module - the foundation for managing leads from initial inquiry to admission.

### ⚠️ Important Note About Billing

**This ERP does NOT include billing/payment processing.**

- Billing and payments are handled separately through **Razorpay**
- Fee details in this CRM are for **reference only** (manually entered by counsellors)
- Future: A Razorpay integration module may be added as a plugin
- The CRM tracks fee discussions and amounts for counselling purposes only

---

## What This System Does

The CRM module helps your team:

| Feature | Description |
|---------|-------------|
| **Capture Leads** | Collect student inquiries from website, social media, walk-ins |
| **Track Progress** | Follow each lead through the admission journey |
| **Manage Follow-ups** | Never miss a callback or meeting |
| **Assign Tasks** | Distribute work among team members |
| **Log Communications** | Record all calls, emails, WhatsApp messages |
| **Monitor Performance** | View dashboards and reports |
| **Progressive Data Collection** | Gather information in stages |
| **Manual Fee Entry** | Counsellors enter fee details for reference |

### What This System Does NOT Do

| Not Included | Use Instead |
|--------------|-------------|
| Payment Processing | Razorpay |
| Invoice Generation | Razorpay |
| Payment Reminders | Razorpay |
| Receipt Generation | Razorpay |
| Student Management | Future Module |
| Academics | Future Module |

---

## 🚀 Quick Start

After deployment, follow these steps:

### Step 1: Login
1. Open `https://erp.pmn.edu.in` in browser
2. Enter email: `admin@pmn.edu.in`
3. Enter password: `PMN@Admin123!`
4. Click "Sign In"

### Step 2: Change Password (IMPORTANT!)
1. Click your name (top-right corner)
2. Click "Settings"
3. Click "Security" tab
4. Click "Change Password"
5. Enter current: `PMN@Admin123!`
6. Enter new password (12+ characters, mix of letters/numbers/symbols)
7. Click "Update"

### Step 3: Enable 2FA
1. Stay in Settings > Security
2. Click "Enable Two-Factor Authentication"
3. Open Google Authenticator on your phone
4. Tap "+" then "Scan QR Code"
5. Point camera at QR code on screen
6. Enter 6-digit code shown in app
7. Click "Verify"
8. **SAVE YOUR BACKUP CODES!**

### Step 4: Add Your First Lead
1. Click "Leads" in sidebar
2. Click "Add Lead" button
3. Fill in:
   - Full Name: Student's name
   - Mobile: 10-digit number
   - Source: Where they came from
   - Course: What they're interested in
4. Click "Create Lead"

---

## 📁 Project Structure

```
pmn-erp/
│
├── 📄 README.md                    ← You are here
├── 📄 INSTRUCTIONS.txt             ← Deployment guide (MAIN GUIDE)
├── 📄 SETUP_CHECKLIST.md           ← Track your progress
├── 📄 Dockerfile                   ← For cloud deployment
├── 📄 package.json                 ← Project dependencies
│
├── 📁 src/                         ← Application code
│   ├── 📁 app/                     ← Pages and API routes
│   │   ├── 📁 api/                 ← Backend API
│   │   │   ├── 📁 auth/            ← Login/logout/2FA
│   │   │   └── 📁 crm/             ← CRM features
│   │   ├── 📁 crm/                 ← CRM pages
│   │   └── 📁 login/               ← Login page
│   │
│   ├── 📁 components/              ← UI components
│   ├── 📁 db/                      ← Database setup
│   ├── 📁 kernel/                  ← Core system
│   ├── 📁 modules/                 ← Feature modules
│   └── 📁 lib/                     ← Utilities
│
├── 📁 docs/                        ← Documentation
│   ├── 📄 API.md                   ← API reference
│   ├── 📄 DEPLOYMENT.md            ← Deployment options
│   └── 📄 USER_GUIDE.md            ← How to use
│
└── 📁 .github/                     ← Auto-deployment
    └── 📁 workflows/
        └── 📄 deploy.yml           ← GitHub Actions
```

---

## 🗄️ Database Tables

### What Data is Stored

| Table | What It Stores |
|-------|---------------|
| `users` | Staff accounts (admins, counsellors) |
| `leads` | Student inquiries and prospects |
| `tasks` | To-do items for staff |
| `follow_ups` | Scheduled callbacks/meetings |
| `lead_communications` | Call/email/message logs |
| `lead_notes` | Internal notes on leads |
| `lead_activities` | Timeline of all actions |

### Lead Information Collected

**Stage 1 - Initial Inquiry (30 seconds)**
- Full Name
- Mobile Number
- Lead Source (website, Facebook, etc.)
- Interested Course
- City

**Stage 2 - Qualification Call**
- Education qualification
- PCM background (yes/no)
- Passing year
- Preferred batch
- Online/Offline preference
- Budget range (MANUAL ENTRY - for reference only)

**Stage 3 - Counselling**
- Career goals
- Passport status
- Previous attempts
- Decision maker (self/parents)

**Stage 4 - Admission Ready**
- Documents available
- Fee discussion done (yes/no)
- Fee amount discussed (MANUAL ENTRY - for reference only)
- Parent counselling done
- Admission probability (0-100%)
- Expected joining month

---

## 📊 Lead Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                      LEAD JOURNEY                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────┐                                                    │
│  │ NEW │ ← Lead just captured (website/call/walk-in)        │
│  └──┬──┘                                                    │
│     ↓                                                       │
│  ┌──────────┐                                               │
│  │ ASSIGNED │ ← Assigned to a counsellor                    │
│  └────┬─────┘                                               │
│       ↓                                                     │
│  ┌───────────┐                                              │
│  │ CONTACTED │ ← First call/message made                    │
│  └─────┬─────┘                                              │
│        ↓                                                    │
│  ┌───────────┐                                              │
│  │ QUALIFIED │ ← Student meets basic criteria               │
│  └─────┬─────┘                                              │
│        ↓                                                    │
│  ┌─────────────┐                                            │
│  │ COUNSELLING │ ← Detailed counselling session             │
│  └──────┬──────┘                                            │
│         ↓                                                   │
│  ┌───────────┐                                              │
│  │ FOLLOW-UP │ ← Needs more time/info                       │
│  └─────┬─────┘                                              │
│        ↓                                                    │
│  ┌─────────────────┐                                        │
│  │ ADMISSION READY │ ← Ready to pay and join                │
│  └────────┬────────┘                                        │
│           ↓                                                 │
│     ┌─────┴─────┐                                           │
│     ↓           ↓                                           │
│ ┌───────────┐ ┌──────┐                                      │
│ │ CONVERTED │ │ LOST │                                      │
│ └───────────┘ └──────┘                                      │
│  (Enrolled!)   (Did not join)                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

After CONVERTED: Student info goes to Razorpay for payment
                 (Done manually - not automated)
```

---

## 👥 User Roles

| Role | What They Can Do |
|------|-----------------|
| **Administrator** | Everything - full control |
| **Manager** | View all leads, assign leads, view reports |
| **Counsellor** | Manage assigned leads, create tasks, log calls |
| **Telecaller** | View own leads only, log calls |

---

## 💰 Fee Information (Manual Entry)

Since billing is handled by **Razorpay separately**, fee details in this CRM are:

### What Counsellors Enter (For Reference Only)

| Field | Purpose |
|-------|---------|
| Budget Range | What student/family can afford |
| Fee Discussed | Amount discussed during counselling |
| Fee Discussion Done | Checkbox - yes/no |
| Scholarship Interest | If student needs financial aid |

### What Happens After Lead is Converted

1. Counsellor marks lead as "CONVERTED"
2. Counsellor manually creates invoice in **Razorpay Dashboard**
3. Razorpay sends payment link to student
4. Student pays through Razorpay
5. Razorpay handles receipt and confirmation

### Future Integration (Planned)

A Razorpay plugin module may be added later to:
- Auto-create Razorpay customers
- Sync payment status back to CRM
- Show payment history in lead profile

---

## 🔐 Security Features

| Feature | Description |
|---------|-------------|
| Password Hashing | Passwords stored encrypted (bcrypt) |
| Two-Factor Auth | 6-digit code from phone app |
| Session Tokens | Auto-expire after 24 hours |
| HTTPS | All data encrypted in transit |
| Audit Logs | Track who did what and when |

---

## 📱 How to Use (Quick Reference)

### Adding a Lead

```
1. Click "Leads" in sidebar
2. Click "Add Lead" (blue button)
3. Fill required fields:
   - Full Name
   - Mobile Number
   - Lead Source
4. Click "Create Lead"
```

### Logging a Call

```
1. Open the lead
2. Click "Communications" tab
3. Click "Log Communication"
4. Select Type: Call
5. Select Direction: Outbound
6. Enter duration (in seconds, e.g., 300 = 5 mins)
7. Write what was discussed
8. Click "Save"
```

### Scheduling a Follow-up

```
1. Open the lead
2. Click "Follow-ups" tab
3. Click "Schedule Follow-up"
4. Select date and time
5. Select type (Call/Meeting/Email)
6. Add notes about purpose
7. Click "Save"
```

### Updating Lead Status

```
1. Open the lead
2. Find the status dropdown
3. Select new status
4. If "Lost", enter reason
5. Click "Save"
```

### Creating a Task

```
1. Click "Tasks" in sidebar
2. Click "Add Task"
3. Enter title (what to do)
4. Select priority (Normal/High/Urgent)
5. Set due date
6. Assign to someone (optional)
7. Link to a lead (optional)
8. Click "Create Task"
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't login | Check caps lock, clear browser cache |
| 2FA not working | Check phone time is correct |
| Page not loading | Refresh, check internet |
| Data not saving | Check all required fields filled |
| Forgot password | Contact administrator |

---

## 📞 Support

| Type | Contact |
|------|---------|
| Technical Issues | Your developer |
| User Help | This README + USER_GUIDE.md |
| Google Cloud | cloud.google.com/support |

---

## 📋 Version Info

| Item | Value |
|------|-------|
| Version | 1.0.0 |
| Phase | 1 - CRM |
| Status | Production Ready |

---

## 🗺️ Future Modules (Planned)

| Module | Description | Status |
|--------|-------------|--------|
| CRM | Lead management | ✅ Done |
| Razorpay Plugin | Payment sync | 🔜 Planned |
| Academics | Course management | 🔜 Planned |
| Students | Enrolled students | 🔜 Planned |
| HR | Staff management | 🔜 Planned |

---

© 2024 Paramount Merchant Navy. All rights reserved.
