# PMN ERP Platform - User Guide

## Getting Started

### First Login

1. Open the application in your browser
2. Enter your email and password
3. If 2FA is enabled, enter the 6-digit code from your authenticator app
4. You'll be redirected to the CRM Dashboard

### Default Login Credentials

**Administrator:**
- Email: `admin@pmn.edu.in`
- Password: `PMN@Admin123!`

**⚠️ Important:** Change your password immediately after first login!

---

## Dashboard Overview

The dashboard shows key metrics at a glance:

### Statistics Cards
- **Total Leads** - All leads in the system
- **Conversion Rate** - Percentage of leads converted to admissions
- **Pending Tasks** - Tasks awaiting completion
- **Today's Follow-ups** - Scheduled follow-ups for today

### Lead Funnel
Shows the distribution of leads across different stages:
- New → Assigned → Contacted → Qualified → Counselling → Admission Ready → Converted

### Lead Sources
Visual breakdown of where your leads are coming from.

### Quick Actions
- View recent leads
- Check today's tasks
- See overdue follow-ups

---

## Managing Leads

### Adding a New Lead

1. Click **"Add Lead"** button
2. Fill in the required information:
   - **Full Name** (required)
   - **Mobile Number** (required)
   - **Lead Source** (required)
   - Other fields are optional
3. Click **"Create Lead"**

### Lead Stages

Leads progress through 4 stages of data collection:

#### Stage 1: Lead Capture
Basic contact information collected during initial inquiry.

#### Stage 2: Qualification
Educational background and course preferences.

#### Stage 3: Career Details
Career goals and decision-making information.

#### Stage 4: Admission Readiness
Documents, fee discussion, and enrollment readiness.

### Lead Status Flow

```
NEW → ASSIGNED → CONTACTED → QUALIFIED → COUNSELLING → ADMISSION READY → CONVERTED
                                    ↓                                        ↓
                                FOLLOW-UP                                   LOST
```

### Updating Lead Status

1. Open the lead details
2. Click the status dropdown
3. Select the new status
4. If marking as "Lost", enter the reason
5. Save changes

### Assigning Leads

1. Open the lead details
2. Click "Assign" or use the dropdown
3. Select a team member
4. The lead status will change to "Assigned"

---

## Tasks Management

### Creating Tasks

1. Go to **Tasks** section
2. Click **"Add Task"**
3. Fill in:
   - **Title** (required)
   - **Type** (Call, Email, Meeting, etc.)
   - **Priority** (Low, Normal, High, Urgent)
   - **Due Date**
   - **Assign To** (optional)
   - **Related Lead** (optional)
4. Click **"Create Task"**

### Task Types

- **Call** - Phone call to make
- **Email** - Email to send
- **Meeting** - In-person or virtual meeting
- **Follow-up** - General follow-up action
- **Document** - Collect or send documents
- **Other** - Miscellaneous tasks

### Completing Tasks

1. Find the task in your list
2. Click the checkmark or "Complete" button
3. The task moves to completed status

---

## Follow-ups

### Scheduling Follow-ups

1. Open a lead's details
2. Click **"Schedule Follow-up"**
3. Select date and time
4. Choose type (Call, Email, Meeting)
5. Add notes about the purpose
6. Save

### Managing Follow-ups

- **Today's Follow-ups** - Shown on dashboard
- **Overdue Follow-ups** - Highlighted in red
- **Complete** - Mark done and record outcome

---

## Communication Log

### Logging Communications

Every interaction with a lead should be logged:

1. Open the lead
2. Go to **Communications** tab
3. Click **"Log Communication"**
4. Select:
   - **Type** (Call, Email, SMS, WhatsApp, Meeting)
   - **Direction** (Inbound/Outbound)
   - **Duration** (for calls)
   - **Outcome**
5. Add notes
6. Save

### Communication Types

- **Call** - Phone conversation
- **Email** - Email exchange
- **SMS** - Text message
- **WhatsApp** - WhatsApp message
- **Meeting** - In-person meeting
- **Note** - Internal note (not visible to lead)

---

## Search and Filters

### Quick Search

Use the search bar to find leads by:
- Name
- Phone number
- Email
- City

### Advanced Filters

Filter leads by:
- **Status** - New, Contacted, Qualified, etc.
- **Source** - Website, Facebook, Referral, etc.
- **Assigned To** - Specific team member
- **Date Range** - Created date
- **Course Interest** - Specific courses

---

## Reports and Analytics

### Available Reports

1. **Lead Summary** - Overview of all leads
2. **Conversion Report** - Conversion rates and trends
3. **Source Analysis** - Performance by lead source
4. **Team Performance** - Individual counsellor metrics
5. **Follow-up Report** - Follow-up completion rates

### Exporting Data

1. Apply any filters needed
2. Click **"Export"**
3. Choose format (CSV or Excel)
4. Download file

---

## Settings

### Profile Settings

- Update your name and avatar
- Change password
- Set up 2FA

### Two-Factor Authentication (2FA)

#### Setting Up 2FA

1. Go to **Settings** → **Security**
2. Click **"Enable 2FA"**
3. Scan QR code with authenticator app:
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
4. Enter the 6-digit code
5. **Save your backup codes!**

#### Using 2FA

After entering password, you'll be prompted for:
- 6-digit code from authenticator app
- OR a backup code (one-time use)

### Notification Settings

Configure which notifications you receive:
- Email notifications
- In-app notifications
- Task reminders
- Follow-up alerts

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + K | Quick search |
| Ctrl/Cmd + N | New lead |
| Ctrl/Cmd + T | New task |
| Esc | Close modal |

---

## Best Practices

### Lead Management

1. **Respond quickly** - Contact new leads within 24 hours
2. **Log everything** - Record all communications
3. **Set follow-ups** - Never leave a lead without next action
4. **Update stages** - Keep lead information current
5. **Use tags** - Organize leads for easy filtering

### Task Management

1. **Prioritize properly** - Use urgent only when necessary
2. **Set realistic due dates** - Don't overcommit
3. **Complete tasks daily** - Don't let them pile up
4. **Add context** - Include relevant notes

### Data Quality

1. **Verify phone numbers** - Ensure correct format
2. **Avoid duplicates** - Search before creating
3. **Complete profiles** - Collect information progressively
4. **Update regularly** - Keep information current

---

## Getting Help

### In-App Help

- Hover over icons for tooltips
- Click "?" for contextual help

### Support

- Email: support@pmn.edu.in
- Phone: Contact your administrator
- Documentation: This guide

---

## FAQ

**Q: How do I reset my password?**
A: Contact your administrator to reset your password.

**Q: Why can't I see certain leads?**
A: You may only have access to leads assigned to you. Contact your manager for broader access.

**Q: How do I merge duplicate leads?**
A: Currently, contact an administrator. Merge feature coming soon.

**Q: Can I delete a lead?**
A: Only administrators can delete leads. You can archive leads instead.

**Q: What happens when a lead is converted?**
A: The lead is marked as converted and will be transferred to the Student Management module (coming soon).
