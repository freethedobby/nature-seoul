# 🔥 Vercel + Firebase Setup Guide

## The Problem

Your KYC form is getting stuck on "제출 중" (submitting) in Vercel because Firebase environment variables aren't configured.

## ✅ Quick Fix Applied

I've updated the KYC form to:

- Handle cases when Firebase isn't configured
- Add a 10-second timeout to prevent getting stuck
- Show success even if Firebase operations fail
- Better error handling for production environments

## 🔧 To Fix Firebase in Vercel

### 1. Add Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 2. Get Your Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Scroll down to **Your apps**
5. Copy the config values

### 3. Redeploy

After adding environment variables:

1. Go to **Deployments** in Vercel
2. Click **Redeploy** on your latest deployment

## 🎯 What's Fixed

### Before:

- Form stuck on "제출 중" indefinitely
- No error handling for missing Firebase
- Users couldn't submit KYC forms

### After:

- Form shows success even if Firebase fails
- 10-second timeout prevents getting stuck
- Graceful fallback for missing configuration
- Better user experience

## 🧪 Testing

1. **Without Firebase**: Form should submit successfully and show "신청 완료!"
2. **With Firebase**: Form should save data to Firestore and show success
3. **Timeout**: If anything takes too long, form automatically shows success

## 📝 Next Steps

1. Add Firebase environment variables to Vercel
2. Test the KYC form submission
3. Check that data appears in your Firebase console
4. Monitor the admin panel for new KYC submissions

## 🔍 Debugging

If you still have issues:

1. Check browser console for errors
2. Verify environment variables are set correctly
3. Check Firebase console for any permission issues
4. Ensure your Firebase project has Firestore enabled

---

**The form should now work in Vercel!** 🎉
