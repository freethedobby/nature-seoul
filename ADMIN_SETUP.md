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

### For Local Development

Add these to your `.env.local` file:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----"
```

## 🔄 After Setting Environment Variables

1. **Redeploy your Vercel app** (it will happen automatically when you push)
2. **Test adding an admin** - it should work now
3. **Check Firebase Console** - you should see admins in the `admins` collection

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
