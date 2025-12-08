# Quick Test Checklist - Email/Phone/Specialties Persistence

## Pre-Test Setup
- [ ] Development server running: `npm run dev`
- [ ] Admin dashboard accessible: http://localhost:3000/admin/dashboard
- [ ] Browser DevTools open: Press F12 → Console tab visible
- [ ] Firestore console ready: https://console.firebase.google.com/firestore

## Test Conversation Steps

### Message 1: Intent Recognition
**Type in chat**: `Add new stylist Rahul`

**Expected**:
- [ ] Bot responds: "Great! I'm adding Rahul to the system. What specialties can they work with?"
- [ ] Console shows: No email/phone extraction logs (correct, not asked yet)

### Message 2: Categories/Specialties
**Type in chat**: `Hair coloring, makeup`

**Expected**:
- [ ] Bot responds: "What's their email address?"
- [ ] Console shows: No email extraction log (correct, just specialties asked)

### Message 3: Email (CRITICAL TEST POINT)
**Type in chat**: `rahul@salon.com`

**Expected**:
- [ ] Bot responds: "What's their phone number?"
- **VERIFY Console shows**:
  ```
  [AdminChat] Email extracted: rahul@salon.com
  ```
  
**If missing**: ❌ Email extraction issue - Review regex pattern

### Message 4: Phone (CRITICAL TEST POINT)
**Type in chat**: `555-1234`

**Expected**:
- [ ] Bot responds: "Perfect! I'm ready to add Rahul (Specialties: Coloring, Makeup) to the system..."
- **VERIFY Console shows ALL of**:
  ```
  [AdminChat] Phone extracted: 555-1234
  [AdminChat] All follow-ups complete. Final data: { names: ["Rahul"], categories: ["Coloring", "Makeup"], email: "rahul@salon.com", phone: "555-1234" }
  [AdminChat] Returning action to API: { type: "ADD_EMPLOYEE", data: {...}, requiresFollowUp: false }
  [AdminOperations] Executing action: ADD_EMPLOYEE
  [AdminOperations] Extracted - Names: ["Rahul"], Email: rahul@salon.com, Phone: 555-1234, Categories: ["Coloring", "Makeup"]
  [AdminOperations] Employee saved successfully with ID: <document_id>
  ```

**If any log missing**: ❌ Check that specific step

## Post-Test Verification

### In Firestore Console
1. Open: https://console.firebase.google.com
2. Navigate to: salon-book-xxx → Firestore → employees collection
3. Find new document with name "Rahul"
4. **Verify ALL fields exist**:
   - [ ] name: "Rahul"
   - [ ] email: "rahul@salon.com" 
   - [ ] phone: "555-1234"
   - [ ] specialties: ["Coloring", "Makeup"]
   - [ ] status: "available"
   - [ ] createdAt: (timestamp)
   - [ ] updatedAt: (timestamp)

### In Admin Dashboard
5. Go back to: http://localhost:3000/admin/dashboard
6. Navigate to: Admin → Employees
7. **Verify new employee displays**:
   - [ ] Name: Rahul
   - [ ] Email: rahul@salon.com
   - [ ] Phone: 555-1234
   - [ ] Specialties: Coloring, Makeup

## Alternative Phone Format Tests

After main test, try these formats to verify enhanced regex:

### Test Format: US with parentheses
**Type**: `(555) 123-4567`
**Expected**: `[AdminChat] Phone extracted: (555) 123-4567`

### Test Format: 10-digit without separators
**Type**: `5551234567`
**Expected**: `[AdminChat] Phone extracted: 555-123-4567` (reformatted)

### Test Format: International
**Type**: `+1 555-123-4567`
**Expected**: `[AdminChat] Phone extracted: +1 555-123-4567`

## Troubleshooting Decision Tree

```
Did logs show ALL 8 expected console messages?
├─ YES → Continue to Firestore verification
│   ├─ Does Firestore show all 4 fields (name, email, phone, specialties)?
│   │   ├─ YES ✅ SUCCESS! Bug is fixed.
│   │   └─ NO ❌ Firestore persistence issue
│   │       → Check Firebase rules
│   │       → Check Firestore error logs
│   │       → Verify collection name is "employees"
│   │
└─ NO ❌ Data extraction issue
    ├─ Missing [AdminChat] logs?
    │   └─ Email regex not matching
    │       → Test regex in console:
    │       → /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/
    │       → or phone regex pattern
    │
    ├─ Missing [AdminChat] All follow-ups complete?
    │   └─ Follow-up handler not completing
    │       → Check currentQuestionIndex logic
    │       → Check getRequiredFollowUps() method
    │
    └─ Missing [AdminOperations] logs?
        └─ API route issue
            → Check /api/admin-chat route is receiving data
            → Check conversationId mapping works
```

## Quick Debugging Commands

### Test Email Regex (Run in browser console):
```javascript
const regex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
console.log(regex.test("rahul@salon.com")); // Should be: true
console.log("rahul@salon.com".match(regex)); // Should extract the email
```

### Test Phone Regex (Run in browser console):
```javascript
const regex = /(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})/;
console.log(regex.test("555-1234")); // Should be: true
console.log("555-1234".match(regex)); // Should show match
```

### Check Conversation Session (Run in browser console):
```javascript
// Send a test message to see conversation ID in response
fetch('/api/admin-chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({message: 'test', conversationId: ''})
}).then(r => r.json()).then(d => console.log('Conversation ID:', d.conversationId))
```

## Success Indicators

### 🟢 All Green (Bug Fixed):
- ✅ All 8 console logs appear in order
- ✅ Firestore shows new employee with ALL fields
- ✅ Admin dashboard displays employee with email/phone/specialties
- ✅ Multiple test formats (phone) all work

### 🟡 Partial Success (Partial Fix):
- ✅ Console logs show data flowing
- ❌ Firestore missing some fields (phone, email, or specialties)
- Issue: Data extraction works but Firestore schema or mapping issue

### 🔴 Failed (Bug Not Fixed):
- ❌ Console logs don't appear
- ❌ No email/phone extraction logs
- Issue: Regex patterns or follow-up handler logic problem

## Notes

- Clear browser cache if old code cached: DevTools → Application → Clear site data
- Restart dev server if needed: `Ctrl+C` then `npm run dev`
- Each new conversation gets unique sessionId in backend
- Logs are server-side: check terminal where `npm run dev` runs AND browser DevTools console

## Support Information

If tests fail at any step:
1. Note which console logs are missing
2. Note which Firestore fields are missing
3. Check that regex patterns match the input format
4. Verify Firestore rules allow writes to employees collection
5. Check that all files were updated correctly (run `npm run build`)
