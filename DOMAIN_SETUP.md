# 🌐 natureseoul.com Domain Setup Guide

## Overview

This guide will help you set up your custom domain `natureseoul.com` with your Vercel deployment.

## Step 1: Vercel Dashboard Configuration

### 1.1 Add Domain to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your `nature_seoul` project
3. Go to **Settings** → **Domains**
4. Click **"Add Domain"**
5. Enter `natureseoul.com`
6. Click **"Add"**

### 1.2 Configure Domain Settings

- **Primary Domain**: Set `natureseoul.com` as your primary domain
- **Redirects**: Enable automatic redirect from `www.natureseoul.com` to `natureseoul.com`

## Step 2: DNS Configuration

### 2.1 Where to Configure DNS

- Go to your domain registrar (where you purchased natureseoul.com)
- Find the DNS management section
- Add the following records:

### 2.2 Required DNS Records

#### For Root Domain (natureseoul.com)

```
Type: A
Name: @
Value: 76.76.19.36
TTL: 3600 (or default)
```

#### For www Subdomain (www.natureseoul.com)

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600 (or default)
```

#### Optional: Email Records (if using custom email)

```
Type: MX
Name: @
Value: your-email-provider.com
Priority: 10
TTL: 3600
```

## Step 3: Environment Variables

### 3.1 Production Environment

In your Vercel dashboard, go to **Settings** → **Environment Variables** and ensure these are set:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Admin Configuration
ADMIN_EMAILS=admin1@natureseoul.com,admin2@natureseoul.com
```

## Step 4: SSL Certificate

### 4.1 Automatic SSL

- Vercel automatically provisions SSL certificates
- This happens within 24-48 hours after DNS propagation
- You'll see a green lock icon in the browser

### 4.2 Force HTTPS

- Vercel automatically redirects HTTP to HTTPS
- No additional configuration needed

## Step 5: Testing Your Domain

### 5.1 Basic Functionality

1. Visit `https://natureseoul.com`
2. Test all main features:
   - User registration/login
   - KYC submission
   - Reservation system
   - Admin panel

### 5.2 Performance Testing

1. Use [PageSpeed Insights](https://pagespeed.web.dev/)
2. Test mobile and desktop performance
3. Check Core Web Vitals

## Step 6: SEO Optimization

### 6.1 Meta Tags

Update your `src/app/layout.tsx` with proper meta tags:

```tsx
export const metadata = {
  title: "Nature Seoul - 당신의 눈썹을 더 아름답게",
  description: "개인 맞춤형 디자인으로 당신만의 완벽한 눈썹을 만들어드립니다.",
  keywords: "눈썹, 반영구, 서울, 용산, nature seoul",
  openGraph: {
    title: "Nature Seoul",
    description: "당신의 눈썹을 더 아름답게",
    url: "https://natureseoul.com",
    siteName: "Nature Seoul",
    images: [
      {
        url: "https://natureseoul.com/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### 6.2 Google Analytics

1. Create a Google Analytics 4 property
2. Add the tracking code to your layout
3. Set up conversion tracking for reservations

## Step 7: Monitoring & Maintenance

### 7.1 Uptime Monitoring

- Set up uptime monitoring with services like UptimeRobot
- Monitor response times and availability

### 7.2 Error Tracking

- Configure error tracking with Sentry or similar
- Monitor for JavaScript errors and API failures

### 7.3 Performance Monitoring

- Use Vercel Analytics for performance insights
- Monitor Core Web Vitals

## Troubleshooting

### Common Issues

#### DNS Not Propagating

- Wait 24-48 hours for full propagation
- Use [whatsmydns.net](https://www.whatsmydns.net/) to check propagation

#### SSL Certificate Issues

- Wait up to 24 hours for automatic SSL provisioning
- Check DNS records are correct

#### Domain Not Loading

- Verify DNS records are pointing to Vercel
- Check Vercel deployment status
- Ensure environment variables are set correctly

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify DNS configuration
3. Contact your domain registrar for DNS issues
4. Check Vercel documentation for domain setup

## Next Steps

After domain setup:

1. Set up email hosting (if needed)
2. Configure Google Search Console
3. Set up Google Analytics
4. Create social media accounts
5. Plan marketing strategy
