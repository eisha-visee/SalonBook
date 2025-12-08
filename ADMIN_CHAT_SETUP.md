# Admin Chat System - Implementation Guide

## Overview
This system enables natural language processing for admin tasks in your salon booking application. Admins can communicate with an AI assistant that understands context and executes database operations.

## Architecture

### Components

1. **AdminChatService** (`adminChatService.ts`)
   - Uses Groq LLM for intent recognition
   - Maintains conversation history
   - Parses AI responses to extract actionable data
   - Supports multi-turn conversations

2. **AdminOperationsService** (`adminOperationsService.ts`)
   - Executes database operations
   - Supports actions:
     - `ADD_EMPLOYEE`: Register new stylists
     - `EMPLOYEE_LEAVE`: Mark employee unavailable
     - `REASSIGN_APPOINTMENTS`: Move bookings to different employee
     - `GET_REVENUE`: Query revenue data
     - `GET_ANALYTICS`: Retrieve dashboard metrics
   - Maintains audit logs of all actions

3. **API Route** (`/api/admin-chat`)
   - Middleware between frontend and services
   - Processes chat messages
   - Executes admin actions
   - Returns structured responses

4. **UI Component** (`AdminChat.tsx`)
   - Real-time chat interface
   - Message history display
   - Typing indicators
   - Follow-up suggestion buttons

## Firestore Collections Required

### 1. `employees`
```typescript
{
  name: string;
  email: string;
  phone: string;
  categories: string[]; // e.g., ["Hair Styling", "Coloring", "Treatments"]
  isOnLeave: boolean;
  leaveStartDate: Timestamp | null;
  leaveEndDate: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2. `bookings`
```typescript
{
  clientId: string;
  employeeId: string;
  salonId: string;
  serviceId: string;
  appointmentDate: Timestamp;
  appointmentTime: string;
  status: "confirmed" | "cancelled" | "completed";
  amount: number; // Revenue amount
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3. `admin_actions_log` (Audit Trail)
```typescript
{
  actionType: string;
  actionData: Record<string, any>;
  timestamp: Timestamp;
}
```

## Usage Examples

### Adding a New Employee
**User:** "New stylist Rahul joining today"

**System Flow:**
1. LLM detects intent: `ADD_EMPLOYEE`
2. AI asks: "Tell me categories where he can work?"
3. User: "Hair styling and coloring"
4. AI asks for email and phone
5. User provides information
6. System saves to Firestore
7. Confirmation: "Successfully added employee Rahul"

### Marking Employee on Leave
**User:** "Rahul is on leave today reassign his appointments"

**System Flow:**
1. LLM detects intent: `EMPLOYEE_LEAVE`
2. System queries all of Rahul's appointments for today
3. AI asks: "Who should I reassign these appointments to?"
4. Shows available employees
5. User selects replacement
6. System updates all appointments
7. Confirmation: "Reassigned 3 appointments"

### Querying Revenue
**User:** "What was my revenue yesterday?"

**System Flow:**
1. LLM detects intent: `GET_REVENUE`
2. System queries completed bookings from yesterday
3. Returns: "Revenue for yesterday: $450.00 from 6 bookings"

## Installation & Setup

### 1. Update Environment Variables
Add to your `.env.local`:
```
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key
```

### 2. Firestore Setup
Ensure these collections exist in Firebase Console:
- `employees`
- `bookings`
- `admin_actions_log`

### 3. Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Only authenticated admins can modify employees
    match /employees/{document=**} {
      allow read, write: if request.auth != null && request.auth.token.role == 'admin';
    }

    // Only authenticated admins can read bookings
    match /bookings/{document=**} {
      allow read, write: if request.auth != null && request.auth.token.role == 'admin';
    }

    // Only authenticated admins can write action logs
    match /admin_actions_log/{document=**} {
      allow read, write: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}
```

## Advanced Customization

### Adding New Intent Types

1. **Update AdminAction enum** in `adminChatService.ts`:
```typescript
export interface AdminAction {
  type: 'ADD_EMPLOYEE' | 'EMPLOYEE_LEAVE' | 'NEW_ACTION_TYPE' | ... ;
  // ...
}
```

2. **Add system prompt instruction** in `ADMIN_SYSTEM_PROMPT`

3. **Implement handler** in `AdminOperationsService`:
```typescript
case 'NEW_ACTION_TYPE':
  return await this.handleNewAction(action.data);
```

### Integration with Notifications

Send notifications when actions complete:
```typescript
if (actionResult.success) {
  await notificationService.sendToAdmins(
    `Action completed: ${action.type}`
  );
}
```

## Best Practices

1. **Always confirm critical actions** - AI asks for confirmation before executing destructive operations
2. **Maintain audit logs** - All admin actions are logged to Firestore
3. **Use follow-ups** - AI asks clarifying questions when information is incomplete
4. **Rate limiting** - Implement rate limiting on the API route for production
5. **Error handling** - Gracefully handle edge cases (employee not found, invalid date ranges, etc.)

## Troubleshooting

### Issue: AI not recognizing intent
- **Solution**: Rephrase in simpler terms or check Groq API quota

### Issue: Firestore operations failing
- **Solution**: Verify Firebase authentication and security rules

### Issue: Follow-up not working
- **Solution**: Ensure message includes JSON with `followUpQuestion` field

## Performance Considerations

- **Chat latency**: ~1-2 seconds per message (Groq API + Firestore ops)
- **Concurrent users**: Implement connection pooling for production
- **Database**: Add indexes on `appointmentDate` and `employeeId` for better query performance

## Security Considerations

- ✅ All operations require Firebase authentication
- ✅ All admin actions are audited
- ✅ Sensitive operations (delete) should require additional confirmation
- ✅ Implement rate limiting to prevent abuse
- ✅ Validate all user inputs server-side

## Future Enhancements

1. **Multi-language support** - Add language preference to admin profile
2. **Voice commands** - Integrate speech-to-text
3. **Scheduled tasks** - "Remind me on Friday about payroll"
4. **Integration with external APIs** - Sync with accounting software
5. **Advanced analytics** - Predictive insights and recommendations
