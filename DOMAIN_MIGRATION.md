# 🌐 Domain Migration Guide: natureseoul.com

## Overview

This guide covers all the configurations needed to migrate your application from the Vercel preview domain to your custom domain `natureseoul.com`.

## ✅ Domain Status

- ✅ Domain: natureseoul.com
- ✅ Vercel DNS: Configured
- ✅ SSL Certificate: Active (or pending)

## 🔧 Required Configuration Updates

### 1. Firebase Authentication Domains

#### 1.1 Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add these domains:
   ```
   natureseoul.com
   www.natureseoul.com
   ```
5. Remove any old Vercel preview domains if no longer needed

#### 1.2 Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Add to **Authorized JavaScript origins**:
   ```
   https://natureseoul.com
   https://www.natureseoul.com
   ```
6. Add to **Authorized redirect URIs**:
   ```
   https://natureseoul.com
   https://natureseoul.com/
   https://www.natureseoul.com
   https://www.natureseoul.com/
   ```

### 2. Vercel Environment Variables

#### 2.1 Update Production Environment

In Vercel dashboard → Settings → Environment Variables:

```bash
# Firebase Configuration (verify these are correct)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Admin Configuration
ADMIN_EMAILS=admin@natureseoul.com,your_admin_emails

# Domain Configuration
NEXT_PUBLIC_SITE_URL=https://natureseoul.com
```

### 3. Email Configuration

#### 3.1 Update Email Templates

If you're using email notifications, update all email templates to use the new domain:

```typescript
// Update email links from:
https://your-vercel-domain.vercel.app

// To:
https://natureseoul.com
```

#### 3.2 Email Provider Configuration

- Update any email service configurations
- Update sender addresses to use @natureseoul.com domain
- Update webhook URLs if using email webhooks

### 4. Third-Party Services

#### 4.1 Google Analytics

1. Go to [Google Analytics](https://analytics.google.com)
2. Update property settings
3. Add new domain to tracking
4. Update goals and conversions

#### 4.2 Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add new property: `https://natureseoul.com`
3. Verify ownership
4. Submit sitemap

#### 4.3 Social Media

Update all social media profiles and links to point to the new domain.

### 5. Application Code Updates

#### 5.1 Update Hardcoded URLs

Search your codebase for any hardcoded URLs and update them:

```typescript
// Old
const baseUrl = "https://your-vercel-domain.vercel.app";

// New
const baseUrl = "https://natureseoul.com";
```

#### 5.2 Update API Routes

Ensure all API routes work with the new domain:

```typescript
// Check these files for domain-specific configurations:
// - src/app/api/**/*.ts
// - src/lib/admin-client.ts
// - src/contexts/AuthContext.tsx
```

### 6. SEO and Meta Tags

#### 6.1 Update Meta Tags

Already configured in `src/app/layout.tsx`:

- ✅ Title: "Nature Seoul - 당신의 눈썹을 더 아름답게"
- ✅ Description: Updated for new domain
- ✅ Open Graph: Configured for natureseoul.com
- ✅ Canonical URLs: Set to natureseoul.com

#### 6.2 Sitemap

Create/update sitemap.xml to include new domain structure.

### 7. Security Headers

#### 7.1 Content Security Policy

Update CSP headers if you have any to include new domain:

```typescript
// In next.config.ts or vercel.json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self' https://natureseoul.com"
}
```

### 8. Testing Checklist

#### 8.1 Authentication Testing

- [ ] User registration with Google OAuth
- [ ] User login with email/password
- [ ] Admin login and access
- [ ] Password reset functionality
- [ ] Email verification

#### 8.2 Core Features Testing

- [ ] KYC submission and approval
- [ ] Reservation system
- [ ] Notification system
- [ ] Admin dashboard
- [ ] Mobile responsiveness

#### 8.3 Performance Testing

- [ ] Page load speeds
- [ ] Image optimization
- [ ] API response times
- [ ] Mobile performance

### 9. Monitoring Setup

#### 9.1 Uptime Monitoring

- Set up monitoring for natureseoul.com
- Monitor response times
- Set up alerts for downtime

#### 9.2 Error Tracking

- Configure error tracking for new domain
- Set up alerts for critical errors

### 10. Backup and Rollback Plan

#### 10.1 Backup Current Configuration

- Document all current settings
- Save configuration files
- Note any custom configurations

#### 10.2 Rollback Plan

- Keep old Vercel domain as backup
- Document rollback procedures
- Test rollback process

## 🚀 Deployment Steps

### Step 1: Update Firebase

1. Add natureseoul.com to authorized domains
2. Update Google OAuth settings
3. Test authentication

### Step 2: Update Vercel

1. Verify environment variables
2. Deploy latest changes
3. Test all features

### Step 3: Update Third-Party Services

1. Update Google Analytics
2. Configure Search Console
3. Update social media links

### Step 4: Testing

1. Run full feature test suite
2. Test on multiple devices
3. Verify performance metrics

### Step 5: Go Live

1. Announce new domain
2. Update all external links
3. Monitor for issues

## 🔍 Troubleshooting

### Common Issues

#### Authentication Not Working

- Check Firebase authorized domains
- Verify Google OAuth settings
- Check environment variables

#### Images Not Loading

- Verify image domains in next.config.ts
- Check storage bucket permissions
- Clear browser cache

#### API Errors

- Check API route configurations
- Verify CORS settings
- Check environment variables

#### Performance Issues

- Check Vercel deployment logs
- Monitor Core Web Vitals
- Optimize images and assets

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify Firebase console settings
3. Test with browser developer tools
4. Check environment variables
5. Contact support if needed

## ✅ Completion Checklist

- [ ] Firebase domains updated
- [ ] Google OAuth configured
- [ ] Environment variables set
- [ ] Email templates updated
- [ ] Third-party services configured
- [ ] Code updated for new domain
- [ ] SEO meta tags updated
- [ ] Security headers configured
- [ ] Full testing completed
- [ ] Monitoring set up
- [ ] Backup plan in place

**Your natureseoul.com domain is now ready for production!** 🌐✨
