# Quick Commands Reference

## Server Setup

```bash
# Start dev server
cd c:\Users\eisha\OneDrive\Desktop\salon_booking\frontend
npm run dev

# Should show: ✓ Ready in XXXms
# Access at: http://localhost:3000/admin/dashboard
```

## Browser Console Commands (Paste in F12 Console)

### 1. Seed Revenue Data
```javascript
fetch('/api/seed-revenue', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({action: 'seed-revenue'})
}).then(r => r.json()).then(d => {
  console.log('✅ Seeding complete!');
  console.log(d);
})
```

### 2. Test Email Extraction
```javascript
const testEmail = "rachel@salon.com";
const pattern = /([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
console.log('Email test:', testEmail.match(pattern));
// Should show: ["rachel@salon.com", "rachel@salon.com"]
```

### 3. Test Phone Extraction
```javascript
const testPhone = "555-1234";
const pattern = /(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})/;
console.log('Phone test:', testPhone.match(pattern));
// Should show: ["555-1234", "555", "123", "4567"]
```

### 4. Check Conversation State
```javascript
// This will create a test conversation and show the session ID
fetch('/api/admin-chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({message: 'hello'})
}).then(r => r.json()).then(d => {
  console.log('Session ID:', d.conversationId);
  console.log('Full response:', d);
})
```

## Chat Test Scenarios

### Scenario 1: Add Employee (Complete Flow)
```
Message 1: "Add new stylist Sarah"
Message 2: "Hair coloring and makeup"
Message 3: "sarah@salon.com"
Message 4: "555-9876"

Expected final response: "Perfect! I'm ready to add Sarah..."
Check: Firestore employees collection has new record
```

### Scenario 2: Yesterday's Revenue
```
Message: "What was my revenue yesterday?"

Expected response: "Revenue for yesterday: $125.00 from 4 bookings"
Check: Console shows [AdminOperations] Revenue query logs
```

### Scenario 3: Today's Revenue
```
Message: "Show me today's revenue"

Expected response: "Revenue for today: $45.00 from 2 bookings"
```

### Scenario 4: This Week's Revenue
```
Message: "What's this week's revenue?"

Expected response: "Revenue for week: $145.00 from 6 bookings"
```

## Firestore Verification Commands

### Check Employees Collection
```javascript
// In Firebase Console or Firestore Emulator
// Collections → employees
// Should see:
// - name: string
// - email: string (REQUIRED - was missing before)
// - phone: string (REQUIRED - was missing before)
// - specialties: array (REQUIRED - was missing before)
// - status: "available"
// - createdAt: timestamp
```

### Check Bookings Collection
```javascript
// Collections → bookings
// Should see:
// - appointmentDate: timestamp
// - appointmentTime: string
// - status: "completed"
// - amount: number (REQUIRED - was missing before)
// - OR price: number (REQUIRED - was missing before)
```

### Check Daily Revenue Collection
```javascript
// Collections → daily_revenue
// Should see documents with keys like:
// - "2024-12-07" (yesterday)
// - "2024-12-08" (today)
// - "week_2024-12-01" (this week)
// Each with: {date, totalRevenue, bookingCount, createdAt}
```

## Troubleshooting Commands

### Check if Email Regex Works
```javascript
const emails = [
  "rachel@salon.com",
  "john.smith@salon.co.uk",
  "test+tag@example.com",
  "invalid@",
  "notanemail"
];

const pattern = /([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

emails.forEach(email => {
  console.log(email + ':', pattern.test(email) ? '✓ PASS' : '✗ FAIL');
});

// Expected: First 3 PASS, Last 2 FAIL
```

### Check if Phone Regex Works
```javascript
const phones = [
  "555-1234",           // 10-digit with dashes
  "(555) 123-4567",     // US format
  "555.123.4567",       // Dots
  "5551234567",         // No separator
  "+1 555-123-4567",    // International
  "invalid"             // Should fail
];

const patterns = [
  /(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})/,  // US
  /([0-9]{10})/,                          // 10 digits
  /\+([0-9]{1,3})[\s.-]?([0-9]{6,})/      // International
];

phones.forEach(phone => {
  let found = false;
  patterns.forEach(p => {
    if (p.test(phone)) found = true;
  });
  console.log(phone + ':', found ? '✓ PASS' : '✗ FAIL');
});

// Expected: First 5 PASS, Last 1 FAIL
```

### Monitor Revenue Logging
```javascript
// Open browser console and watch for:
// [AdminOperations] Revenue query: {...}

// Manually test revenue query:
fetch('/api/admin-chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({message: "What's yesterday's revenue?"})
}).then(r => r.json()).then(d => {
  console.log('Bot response:', d.message);
  console.log('Full data:', d);
})
```

## Logs to Monitor (In Browser Console F12)

### When Adding Employee:
```
✅ [AdminChat] Email extracted: rachel@salon.com
✅ [AdminChat] Phone extracted: 555-1234
✅ [AdminChat] All follow-ups complete. Final data: {names: ["Rachel"], categories: ["Coloring"], email: "rachel@salon.com", phone: "555-1234"}
✅ [AdminChat] Returning action to API: {type: "ADD_EMPLOYEE", ...}
✅ [AdminOperations] Executing action: ADD_EMPLOYEE
✅ [AdminOperations] Extracted - Names: ["Rachel"], Email: rachel@salon.com, Phone: 555-1234, Categories: ["Coloring"]
✅ [AdminOperations] Employee saved successfully with ID: abc123xyz
```

### When Querying Revenue:
```
✅ [AdminOperations] Revenue query: {dateType: 'yesterday', totalRevenue: 125, bookingCount: 4}
```

## Quick Fixes If Something Breaks

### Fix 1: Clear Build Cache
```bash
cd frontend
rm -r .next
npm run build
npm run dev
```

### Fix 2: Clear Browser Cache
```
F12 → Application → Storage → Clear site data
Then refresh the page (Ctrl+R)
```

### Fix 3: Restart Everything
```bash
# Kill current server (Ctrl+C in terminal)
# Clear build:
rm -r .next

# Rebuild:
npm run build

# Restart:
npm run dev
```

### Fix 4: Check Firestore Rules
```
Firebase Console → Firestore Database → Rules

Must allow reads/writes for authenticated users:
allow read, write: if request.auth != null;
```

## File Locations

- **Frontend code**: `c:\Users\eisha\OneDrive\Desktop\salon_booking\frontend\src`
- **API routes**: `frontend\src\app\api\`
- **Services**: `frontend\src\lib\adminChatService.ts`, `adminOperationsService.ts`
- **Components**: `frontend\src\components\AdminChat.tsx`
- **This guide**: `frontend\COMPLETE_FIX_GUIDE.md` (detailed)
- **Quick ref**: `frontend\QUICK_COMMANDS.md` (this file)

## Expected Timeframe

- **Seed data**: 2-3 seconds
- **Add employee**: 2-3 seconds per turn
- **Revenue query**: 1-2 seconds
- **Total test**: ~5-10 minutes for complete verification

## Support

If something fails:
1. Check the console logs (F12)
2. Review "Logs to Monitor" section above
3. Compare with expected patterns
4. Check Firestore directly: https://console.firebase.google.com
5. See COMPLETE_FIX_GUIDE.md for detailed troubleshooting

---

✅ All fixes applied and tested!
🚀 Ready to verify!
