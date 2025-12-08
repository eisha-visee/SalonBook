# Admin Chat System - Quick Start

## What You Get

An intelligent chat interface where admins can manage the salon through natural conversation:

```
Admin: "New stylist Rahul joining today"
Bot: "Great! What categories can Rahul work in?" 
Admin: "Hair styling and coloring"
Bot: "Perfect! What's his email?"
Admin: "rahul@salon.com"
Bot: "And phone number?"
Admin: "555-1234"
Bot: "Successfully added employee Rahul" ✓ [Saved to Firestore]
```

## Getting Started (5 Minutes)

### Step 1: Set Environment Variable
```bash
# In .env.local
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
```
Get your free Groq API key from: https://console.groq.com

### Step 2: Verify Firestore Collections Exist
In Firebase Console, create these collections:
- `employees`
- `bookings`
- `admin_actions_log`

### Step 3: Test It
1. Run: `npm run dev`
2. Go to `/admin/dashboard`
3. You should see a chat window on the right side
4. Try: "Add new employee John"

## What It Can Do

| Command | Example | Result |
|---------|---------|--------|
| **Add Employee** | "New stylist Rahul joining today" | Creates employee record in Firestore |
| **Mark Leave** | "Rahul is on leave today" | Updates status & asks about reassignment |
| **Reassign Jobs** | "Move his appointments to Priya" | Updates all bookings in Firestore |
| **Revenue Query** | "What was my revenue yesterday?" | Calculates from completed bookings |
| **Analytics** | "How many bookings this week?" | Returns dashboard metrics |

## Files Created

```
src/
├── lib/
│   ├── adminChatService.ts          # AI intent recognition
│   └── adminOperationsService.ts    # Firestore operations
├── app/
│   └── api/
│       └── admin-chat/
│           └── route.ts             # API endpoint
├── components/
│   ├── AdminChat.tsx                # Chat UI
│   └── AdminChat.module.css         # Styling
└── app/admin/dashboard/
    └── page.tsx                     # Updated with chat
```

## How It Works (Technical)

```
User Message
    ↓
AdminChatService (Groq LLM)
    ↓ Analyzes intent
Intent Recognition
    ↓ Extract data
AdminOperationsService
    ↓ Firestore operations
Database Updated ✓
    ↓
Response to User
```

## Supported Intents

- `ADD_EMPLOYEE` - Register new stylist
- `EMPLOYEE_LEAVE` - Mark unavailable
- `REASSIGN_APPOINTMENTS` - Move bookings
- `GET_REVENUE` - Query earnings
- `GET_ANALYTICS` - Dashboard stats
- `NONE` - Conversation/clarification

## Database Schema

### employees collection
```typescript
{
  name: "Rahul",
  email: "rahul@salon.com",
  phone: "+1-555-1234",
  categories: ["Hair Styling", "Coloring"],
  isOnLeave: false,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### bookings collection
```typescript
{
  employeeId: "rahul123",
  appointmentDate: Timestamp,
  status: "confirmed",
  amount: 50.00,
  // ... other fields
}
```

## Advanced: Adding Custom Intents

1. Add to `AdminAction.type` in `adminChatService.ts`
2. Update system prompt with instructions
3. Add handler in `AdminOperationsService.executeAdminAction()`

Example - Send SMS notification:
```typescript
case 'SEND_NOTIFICATION':
  return await this.sendSMSToEmployee(action.data);
```

## Security

✅ Requires Firebase authentication  
✅ All actions logged to `admin_actions_log`  
✅ Role-based access (admin only)  
✅ Server-side validation  

## Testing Commands

Try these in the chat:

1. **Add employee:**
   - "Add new stylist named Alex"
   - "Create employee: Maya, specialist in bridal makeup"

2. **Leave management:**
   - "John is on leave today"
   - "Mark Sarah unavailable this weekend"

3. **Revenue:**
   - "What's my revenue yesterday?"
   - "Revenue for this week?"

4. **Analytics:**
   - "How many bookings do I have?"
   - "Show me analytics"

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Chat not appearing | Check `/admin/dashboard` page loads |
| "Unknown error" | Verify Groq API key in `.env.local` |
| Database errors | Ensure Firestore collections exist |
| AI not responding | Check Groq API quota/status |

## Next Steps

1. ✅ Test basic commands
2. Customize system prompt for your salon specifics
3. Add more intent types for your workflows
4. Deploy to Vercel
5. Set up notification system (email/SMS)
6. Implement analytics dashboard sync

## API Endpoint

**POST** `/api/admin-chat`

Request:
```json
{
  "message": "Add new stylist Rahul"
}
```

Response:
```json
{
  "message": "What categories can he work in?",
  "action": {
    "type": "ADD_EMPLOYEE",
    "data": {
      "name": "Rahul"
    },
    "requiresFollowUp": true
  },
  "followUpQuestions": [...]
}
```

## Conversation Flow

The AI maintains context across messages:

```
1. User: "Add stylist Rahul"
   AI: "What categories?"
   
2. User: "Hair and coloring"
   AI: "Email?"
   
3. User: "rahul@salon.com"
   AI: "Phone?"
   
4. User: "555-1234"
   AI: "Adding to database..." ✓
```

Perfect! Your AI admin assistant is ready to use! 🚀
