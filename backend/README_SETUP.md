# Backend Setup Guide

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# MongoDB Connection
MONGO_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Email Configuration (for OTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Server Port
PORT=5000
```

### Email Setup (Gmail)

1. Enable 2-Step Verification on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Create a new app password for "Mail"
   - Use this password as `EMAIL_PASS`

### For Development (without email)

If you don't want to configure email, the system will log OTPs to the console in development mode.

## Installation

```bash
cd backend
npm install
```

## Create Admin User

```bash
npm run createadmin
# Or with custom credentials:
node createAdmin.js admin@example.com adminpassword123
```

## Create Test User

```bash
node createUser.js "John Doe" user@example.com password123
```

## API Endpoints

### User Endpoints

- `POST /api/users/signup` - Register new user (name, email, password)
- `POST /api/users/send-otp` - Send OTP to email
- `POST /api/users/verify-otp` - Verify OTP (email, otp)
- `POST /api/users/login` - Login with credentials and OTP
- `GET /api/users/check-access` - Check if user IP is approved (requires auth token)

### Admin Endpoints

- `POST /api/admin/login` - Admin login (email, password)
- `GET /api/admin/ip-requests` - Get all IP approval requests (requires admin token)
- `PUT /api/admin/ip-requests/:id` - Approve/reject IP request (requires admin token)

## How It Works

1. **User Signup**: User provides name, email, password → OTP sent to email
2. **OTP Verification**: User verifies OTP → Account activated
3. **User Login**: User provides email, password → OTP sent → User provides OTP → IP detected and sent for approval
4. **IP Approval**: Admin sees IP request with user info and country → Approves/Rejects
5. **Access Check**: User can only access the site if their IP is approved

## IP Geolocation

The system automatically detects the user's IP address and country using the ip-api.com service (free, no API key required).

## Notes

- OTP expires after 10 minutes
- IP requests are created automatically on login
- Approved IPs are stored in the user's profile
- Admin can see all exhibitions in one table (live on top)

