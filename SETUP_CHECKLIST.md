# PMN ERP Platform - Setup Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment

- [ ] Have Google Workspace admin access
- [ ] Have a credit card for Google Cloud billing
- [ ] Downloaded authenticator app on phone
- [ ] Read through INSTRUCTIONS.txt completely

---

## GitHub Setup

- [ ] Created GitHub account
- [ ] Created repository: `pmn-erp-platform`
- [ ] Uploaded application code
- [ ] Added secret: `DATABASE_URL`
- [ ] Added secret: `JWT_SECRET`
- [ ] Added secret: `GCP_PROJECT_ID`
- [ ] Added secret: `GCP_SA_KEY`

**My GitHub Repository URL:**
```
https://github.com/___________________/pmn-erp-platform
```

---

## Google Cloud Setup

- [ ] Created Google Cloud account
- [ ] Created project: `pmn-erp-platform`
- [ ] Enabled billing
- [ ] Enabled Cloud Run API
- [ ] Enabled Cloud SQL Admin API
- [ ] Enabled Cloud Build API
- [ ] Enabled Secret Manager API
- [ ] Enabled Container Registry API

**My Project ID:**
```
_______________________________________
```

---

## Database Setup

- [ ] Created Cloud SQL instance: `pmn-erp-db`
- [ ] Created database: `pmn_erp`
- [ ] Noted database password
- [ ] Noted public IP address
- [ ] Added authorized network for connections
- [ ] Updated DATABASE_URL in GitHub secrets

**My Database Details:**
```
IP Address: _______________________________________
Password: _______________________________________ (store securely!)
```

**My DATABASE_URL:**
```
postgresql://postgres:PASSWORD@IP_ADDRESS:5432/pmn_erp
```

---

## Deployment

- [ ] Opened Cloud Shell
- [ ] Cloned repository
- [ ] Built Docker container
- [ ] Deployed to Cloud Run
- [ ] Ran database migrations
- [ ] Seeded admin user

**My Cloud Run URL:**
```
https://pmn-erp-_____________________.run.app
```

---

## Domain Configuration

- [ ] Verified domain in Cloud Run
- [ ] Added DNS CNAME record
- [ ] Mapped domain to service
- [ ] SSL certificate provisioned

**My Final URL:**
```
https://erp.pmn.edu.in
```

---

## Post-Deployment

- [ ] Logged in successfully
- [ ] Changed admin password
- [ ] Enabled 2FA for admin
- [ ] Saved backup codes
- [ ] Created first team member
- [ ] Tested creating a lead
- [ ] Tested creating a task

---

## Security Hardening

- [ ] Changed all default passwords
- [ ] Enabled 2FA for all admins
- [ ] Restricted database network access
- [ ] Enabled Cloud SQL backups
- [ ] Reviewed Cloud Run permissions

---

## Documentation

- [ ] Saved this checklist
- [ ] Stored credentials securely
- [ ] Shared login info with team
- [ ] Trained team on system usage

---

## Emergency Information

**In case of emergency, contact:**

Developer: ______________________________________

Google Cloud Support: https://cloud.google.com/support

**Recovery codes stored at:**
(Do not write actual codes here - just note the location)
_________________________________________________

---

## Notes

Use this space for any additional notes:

```
_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________
```

---

**Deployment completed on:** ____________________

**Deployed by:** ________________________________

**Verified by:** ________________________________
