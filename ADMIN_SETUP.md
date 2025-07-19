# 🔧 Admin Setup Guide

## The Problem

You're getting "Internal server error" when trying to add new admins because Firebase Admin SDK environment variables are missing.

## ✅ Solution Applied

I've updated the admin functions to use Firestore instead of Realtime Database, but you need to set up the environment variables.

## 🔑 Required Environment Variables

### For Vercel (Production)

Add these to your Vercel project settings:

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```env
# Firebase Admin SDK (for server-side operations)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----"

# Email Configuration (for automated notifications)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
```

### How to Get Firebase Admin SDK Credentials

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**
3. **Go to Project Settings** (gear icon)
4. **Go to Service Accounts tab**
5. **Click "Generate new private key"**
6. **Download the JSON file**
7. **Extract the values**:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

### How to Set Up Email Notifications

1. **Gmail Account Setup**:

   - Use a Gmail account for sending emails
   - Enable 2-factor authentication
   - Generate an App Password (not your regular password)

2. **Generate App Password**:

   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `EMAIL_PASS`

3. **Environment Variables**:
   - `EMAIL_USER`: Your Gmail address
   - `EMAIL_PASS`: The app password (not your regular Gmail password)

### For Local Development

Add these to your `.env.local` file:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----"

# Email Configuration (for automated notifications)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
```

## 🔄 After Setting Environment Variables

1. **Redeploy your Vercel app** (it will happen automatically when you push)
2. **Test adding an admin** - it should work now
3. **Check Firebase Console** - you should see admins in the `admins` collection
4. **Test email notifications** - update a user's KYC or reservation status to trigger email

## 📧 Email Notification Features

### **Automated Email Triggers**:

- **KYC Status Changes**: pending → approved/rejected
- **Reservation Status Changes**: none → scheduled/completed/cancelled

### **Email Templates**:

- **Professional Design**: Branded with 네이처서울 logo and colors
- **Status-Specific Content**: Different messages for each status change
- **Contact Information**: Includes business contact details
- **Responsive Design**: Works well on mobile and desktop

### **Email Content**:

- **KYC Approved**: Congratulations message with next steps
- **KYC Rejected**: Information about what to do next
- **Reservation Scheduled**: Confirmation with visit instructions
- **Reservation Completed**: Thank you message
- **Reservation Cancelled**: Information about rebooking

## 🧪 Testing

1. Go to admin page: `/admin/admins`
2. Try adding a new admin email
3. Check if it appears in the admin list
4. Verify in Firebase Console under `admins` collection

## 🔍 Troubleshooting

### If still getting errors:

1. Check Vercel logs for specific error messages
2. Verify environment variables are set correctly
3. Make sure the service account has proper permissions
4. Check if the `admins` collection exists in Firestore

### Common Issues:

- **Private key format**: Make sure to include the `\n` characters
- **Project ID**: Should match your Firebase project
- **Permissions**: Service account needs Firestore read/write access
