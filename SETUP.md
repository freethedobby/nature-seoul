# Time Scheduling Application Setup Guide

## 🚀 Quick Start

The application is already running at http://localhost:3000! However, to enable full functionality (authentication, database, etc.), you'll need to configure Firebase.

## 📋 Current Status

✅ **What's Working:**

- Next.js application is running
- All dependencies are installed
- UI components are functional
- Basic routing is working
- Korean beauty salon homepage is displayed

⚠️ **What Needs Configuration:**

- Firebase Authentication
- Firestore Database
- Environment Variables

## 🔥 Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "nature-scheduling")
4. Follow the setup wizard

### 2. Enable Authentication

1. In Firebase Console, go to "Authentication" → "Sign-in method"
2. Enable "Google" provider
3. Add your domain to authorized domains

### 3. Enable Firestore Database

1. Go to "Firestore Database" → "Create database"
2. Choose "Start in test mode" (for development)
3. Select a location close to your users

### 4. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → "Web"
4. Register app and copy the config

### 5. Create Environment File

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Optional: Kakao OAuth (for Korean users)
NEXT_PUBLIC_KAKAO_CLIENT_ID=your-kakao-client-id
```

### 6. Set Up Firestore Security Rules

The current rules allow all access for development. For production, update `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Admins can read/write admin data
    match /admins/{adminId} {
      allow read, write: if request.auth != null &&
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
  }
}
```

## 🎯 Application Features

### Current Features

- **Landing Page**: Beautiful Korean beauty salon homepage
- **Authentication**: Google OAuth integration
- **User Management**: Role-based access (admin/user)
- **Responsive Design**: Mobile-first approach
- **Modern UI**: Tailwind CSS + shadcn/ui components

### Planned Features

- **Booking System**: Calendar-based appointment scheduling
- **KYC Process**: Know Your Customer verification
- **Admin Dashboard**: User management and analytics
- **Payment Integration**: Secure payment processing

## 🛠 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## 📱 Pages Structure

- `/` - Landing page (Korean beauty salon)
- `/login` - Authentication page
- `/dashboard` - User dashboard
- `/admin` - Admin dashboard
- `/kyc` - KYC verification
- `/user/reserve` - Booking page

## 🔐 Authentication Flow

1. **Landing Page**: Users see the beauty salon homepage
2. **Login**: Google OAuth or email/password
3. **Role Detection**:
   - `admin@naturesemi.com` → Admin dashboard
   - Other emails → User dashboard
4. **KYC Process**: New users go through verification

## 🎨 Design System

- **Colors**: Rose/pink gradients, black accents
- **Typography**: Inter font family
- **Components**: shadcn/ui with custom styling
- **Layout**: Responsive grid system

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms

- Netlify
- Firebase Hosting
- AWS Amplify

## 🔧 Troubleshooting

### Common Issues

1. **Firebase not configured**

   - Error: "Firebase: Error (auth/invalid-api-key)"
   - Solution: Add Firebase config to `.env.local`

2. **Authentication not working**

   - Check Firebase Authentication is enabled
   - Verify authorized domains in Firebase Console

3. **Database errors**
   - Ensure Firestore is created
   - Check security rules

### Development Tips

- Use browser dev tools to check for console errors
- Firebase console shows real-time authentication logs
- Firestore console shows database operations

## 📞 Support

For issues or questions:

- Check the Firebase documentation
- Review Next.js documentation
- Check the application logs in browser console

---

**Next Steps:**

1. Set up Firebase project
2. Add environment variables
3. Test authentication
4. Configure database rules
5. Deploy to production

The application is ready to use once Firebase is configured! 🎉
