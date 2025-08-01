# 🧪 Local Test Environment Guide

## 🎯 **Purpose**

The local test environment allows you to safely test all features without affecting your production database. This is perfect for:

- Testing the double booking fix
- Trying new features
- Training team members
- Debugging issues

## 🚀 **Quick Start**

### **1. Install Firebase CLI (if not already installed)**

```bash
npm install -g firebase-tools
```

### **2. Start the Test Environment**

```bash
# Terminal 1: Start Firebase Emulator
npm run test:emulator

# Terminal 2: Start Next.js Development Server
npm run dev
```

### **3. Access Test Mode**

Open your browser and go to:

```
http://localhost:3000?test=true
```

You'll see a **"개발자 도구"** panel in the bottom-right corner!

## 🔧 **Test Mode Features**

### **🎮 Developer Tool Panel**

The floating panel in the bottom-right provides:

- **Environment Toggle**: Switch between test and production modes
- **Seed Data**: Generate test users, slots, and reservations
- **Clear Data**: Remove all test data
- **Status Indicators**: Visual feedback for all actions

### **🛡️ Restrictions Bypassed in Test Mode**

When test mode is active:

- ✅ **KYC Open Period**: Always open (ignore time restrictions)
- ✅ **Reservation Open Period**: Always open
- ✅ **Month Range Limits**: Can book any month
- ✅ **User Approval**: Can test without KYC approval
- ✅ **All Time-based Restrictions**: Completely bypassed

### **🗄️ Isolated Database**

Test mode uses Firebase Emulator:

- **Completely separate** from production data
- **No risk** of affecting live users
- **Real-time updates** like production
- **Data persists** during session
- **Easy cleanup** with one click

## 🎭 **Testing Scenarios**

### **🚨 Double Booking Test**

1. **Enable Test Mode**: Use the toggle in developer panel
2. **Seed Data**: Click "시드 데이터" to create test slots
3. **Open Multiple Tabs**: `localhost:3000?test=true`
4. **Simulate Concurrent Booking**:
   - Tab 1: Navigate to reservation, select same time slot
   - Tab 2: Navigate to reservation, select same time slot
   - Tab 1: Click "Reserve" → "Confirm"
   - Tab 2: Click "Reserve" → "Confirm" (should get error)
5. **Expected Result**: Second user gets "이미 예약된 슬롯입니다" error

### **🕒 Reservation Open Period Test**

1. **Admin Panel**: Go to `/admin/slots`
2. **Set Closed Period**: Configure past or future times
3. **User View**: Try to make reservation
4. **Test Mode**: Should bypass restrictions
5. **Production Mode**: Should show closed message

### **📅 KYC Testing**

1. **Seed Users**: Different KYC statuses (pending, approved, rejected, scar)
2. **Test Flows**: Login as different users
3. **Admin Actions**: Approve/reject KYC applications
4. **Status Updates**: Real-time status changes

## 🎛️ **Developer Panel Controls**

### **Environment Toggle**

- **Red Badge**: 프로덕션 모드 (Production - uses real database)
- **Orange Badge**: 테스트 모드 (Test - uses emulator)
- **Click to Switch**: Automatically reloads page

### **Test Data Management**

- **🌱 시드 데이터**: Creates sample users, slots, reservations
- **🗑️ 데이터 삭제**: Removes all test data from emulator
- **Status Messages**: Green (success), Red (error), Blue (info)

### **Active Features Badge**

Shows what test features are enabled:

- **🧪 더블 부킹 테스트**: Race condition testing
- **⚙️ 모든 제한 우회**: Time/approval bypasses
- **💾 독립 DB**: Separate database

## 📊 **Firebase Emulator UI**

Access the Firebase Emulator interface at:

```
http://localhost:4000
```

### **Available Services**

- **Firestore**: View/edit collections and documents
- **Authentication**: Manage test users
- **Real-time Updates**: See changes as they happen

### **Useful Emulator Features**

- **Data Inspector**: Browse collections like users, slots, reservations
- **Import/Export**: Save/restore test datasets
- **Clear All Data**: Reset emulator to empty state

## 🔍 **Testing Specific Features**

### **Double Booking Prevention**

```javascript
// Test scenario:
1. Two users click "Reserve" simultaneously
2. First user: Success
3. Second user: Gets atomic transaction error
4. Only one reservation created in database
```

### **Admin Functions**

```javascript
// Test admin actions in test mode:
- Create/delete slots
- Approve/reject KYC
- Manage reservations
- Update user statuses
```

### **Time-based Features**

```javascript
// Test with different time settings:
- Past reservation dates
- Future month limits
- Open/close periods
- Deadline countdowns
```

## 📝 **Package.json Scripts**

The setup added these convenient scripts:

```json
{
  "test:emulator": "firebase emulators:start --project=test-time-scheduling",
  "test:seed": "node scripts/seed-test-data.js",
  "test:clear": "node scripts/clear-test-data.js"
}
```

## 🔧 **Troubleshooting**

### **Emulator Won't Start**

```bash
# Check if Firebase CLI is installed
firebase --version

# Install if missing
npm install -g firebase-tools

# Login to Firebase (if needed)
firebase login
```

### **Test Mode Not Working**

1. Check URL includes `?test=true`
2. Verify localhost address
3. Clear browser localStorage
4. Refresh page

### **Data Not Updating**

1. Check Firebase emulator is running (port 8080)
2. Open emulator UI at localhost:4000
3. Verify test mode is active (orange badge)

### **Developer Panel Missing**

1. Only shows on localhost
2. Requires test mode activation
3. Check browser console for errors

## 🔒 **Safety Features**

### **Production Protection**

- **Never shows on production domain**
- **Requires localhost environment**
- **Visual indicators** for current mode
- **Separate Firebase project ID**

### **Data Isolation**

- **Emulator-only storage**
- **No production API calls**
- **Independent user sessions**
- **Sandbox environment**

## ⚡ **Quick Reference**

| Action            | Command                 | URL                        |
| ----------------- | ----------------------- | -------------------------- |
| Start Emulator    | `npm run test:emulator` | `localhost:4000`           |
| Start Dev Server  | `npm run dev`           | `localhost:3000`           |
| Enable Test Mode  | Visit                   | `localhost:3000?test=true` |
| Admin Panel       | Navigate                | `/admin/kyc`               |
| User Reservations | Navigate                | `/user/reserve`            |

## 🎉 **Benefits**

### **For Developers**

- ✅ **Safe testing environment**
- ✅ **No production data risk**
- ✅ **Fast iteration cycles**
- ✅ **Real-time debugging**

### **For Testing**

- ✅ **Simulate edge cases**
- ✅ **Test race conditions**
- ✅ **Validate user flows**
- ✅ **Verify admin functions**

### **For Training**

- ✅ **Risk-free exploration**
- ✅ **Hands-on learning**
- ✅ **Feature demonstration**
- ✅ **Process validation**

---

## 🚀 **Ready to Test!**

Your test environment is now fully configured and ready for safe testing of all features, including the double booking fix!

🧪 **Start Testing**: `npm run test:emulator` + `npm run dev` + visit `localhost:3000?test=true`
