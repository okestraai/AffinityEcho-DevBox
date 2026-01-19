# Chat-Based Referral Workflow Guide

## Overview

The referral workflow has been redesigned to use a chat-based interface with persistent checklists that guide both the candidate and referrer through each step of the process. The workflow now includes explicit identity reveal warnings and confirmation steps before slot counters are updated.

## Key Features

### 1. Identity Reveal Warnings
- **Before acceptance**: Both parties see clear warnings about identity reveal
- **Automatic reveal**: On acceptance, identities are revealed immediately to both parties
- **No surprises**: Users know exactly what to expect before accepting/rejecting

### 2. Chat-Based Workflow
- **Persistent checklist**: Visible to both parties in the chat
- **Step-by-step guidance**: Clear progression through each stage
- **Real-time updates**: Checklist updates as actions are completed
- **Role-specific actions**: Each user sees only their relevant actions

### 3. Three-Step Process
1. **Step 1**: Candidate uploads resume and shares LinkedIn
2. **Step 2**: Referrer reviews info and marks as "Referral Sent"
3. **Step 3**: Candidate confirms receipt of referral

### 4. Slot Management
- **Slots only decrease after candidate confirmation**
- **Prevents premature slot updates**
- **Ensures accountability from both parties**

## Navigation Structure

The referral workflow is now integrated into the **Messages** page under the **Referrals** tab:

- **Messages page**: `/dashboard/messages`
  - **Messages tab**: Regular conversations
  - **Mentorship tab**: Mentorship requests
  - **Referrals tab**: Connection requests (pending, sent, accepted)

When you accept a connection request, you're automatically redirected to a chat view with the workflow checklist.

## Complete E2E Workflow

### Phase 1: Connection Request (Pending)

**As Candidate (User B):**
1. Browse referral posts and find a suitable offer
2. Click "Connect" and send a message explaining interest
3. Go to Messages → Referrals tab → "Sent" sub-tab
4. See a blue notification: "If your request is accepted, your identity will be revealed..."

**UI Elements:**
```
┌─────────────────────────────────────────────┐
│  Pending Approval                            │
│  ℹ️ If your request is accepted, your      │
│  identity will be revealed to the referrer, │
│  and you'll gain access to a private chat   │
│  with a workflow checklist to complete the  │
│  referral process.                           │
└─────────────────────────────────────────────┘
```

**What happens:**
- Connection created with status 'pending'
- Identity remains hidden (anonymous)
- Referrer receives notification

### Phase 2: Connection Acceptance

**As Referrer (User A):**
1. Receive notification about new connection request
2. Go to Messages → Referrals tab → "Received" sub-tab
3. See the pending request from an anonymous user
4. Read the identity reveal warning:

```
┌─────────────────────────────────────────────┐
│  Identity Reveal Notice                      │
│  ⚠️ By accepting this request, your         │
│  identity (name, profile details) will be   │
│  revealed to the candidate, and their       │
│  identity will be revealed to you. You'll   │
│  both be redirected to a private chat with  │
│  a workflow checklist to complete the       │
│  referral process.                           │
└─────────────────────────────────────────────┘

[Accept & Reveal Identity]  [Reject]
```

4. Click "Accept & Reveal Identity"

**What happens automatically:**
1. Connection status changes to 'accepted'
2. Identity is revealed to both parties
3. A conversation is created
4. A workflow entry is created with status 'awaiting_info'
5. Candidate receives notification
6. **Both users are redirected to the chat with the workflow checklist**

### Phase 3: Chat with Workflow Checklist

**Initial Chat View (Both Users):**

```
┌──────────────────────────────────────────────────────┐
│  ← Back    👤 Alex Johnson                           │
│             Microsoft • Senior Product Manager        │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │  ✓ Referral Workflow                           │ │
│  │  Complete these steps to finish the referral   │ │
│  │  process                                        │ │
│  │                                                 │ │
│  │  ○ Step 1: Candidate Shares Information        │ │
│  │     Upload your resume and share your LinkedIn │ │
│  │     profile                                     │ │
│  │                                                 │ │
│  │     [Resume Link Input]                         │ │
│  │     [LinkedIn URL Input]                        │ │
│  │     [Submit Information]                        │ │
│  │                                                 │ │
│  │  ○ Step 2: Referrer Submits to Company         │ │
│  │     (Locked until Step 1 is complete)           │ │
│  │                                                 │ │
│  │  ○ Step 3: Candidate Confirms Receipt          │ │
│  │     (Locked until Step 2 is complete)           │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  Original Message:                                    │
│  "Hi! I have 5 years of SWE experience..."           │
│                                                       │
│  [Type a message...] [Send]                          │
└──────────────────────────────────────────────────────┘
```

### Phase 4: Candidate Submits Information (Step 1)

**As Candidate (User B):**
1. In the chat, fill out the Step 1 form:
   - Resume Link (required): `https://drive.google.com/file/d/my-resume`
   - LinkedIn Profile (required): `https://linkedin.com/in/myprofile`
2. Click "Submit Information"

**What happens:**
```javascript
// Database updates:
workflow.candidate_resume_uploaded = true
workflow.candidate_linkedin_shared = true
workflow.status = 'info_submitted'
workflow.candidate_info_submitted_at = now()
```

**Updated Checklist View:**
```
✓ Step 1: Candidate Shares Information
   ✓ Information submitted successfully

○ Step 2: Referrer Submits to Company
   Review the candidate's information and submit
   the referral

   📄 View Resume
   💼 View LinkedIn Profile

   [Mark as Referral Sent]

○ Step 3: Candidate Confirms Receipt
   (Locked until Step 2 is complete)
```

**Notifications:**
- Referrer receives: "Candidate has submitted their information"

### Phase 5: Referrer Reviews and Marks Sent (Step 2)

**As Referrer (User A):**
1. See Step 2 is now active
2. Click links to review:
   - View Resume (opens in new tab)
   - View LinkedIn Profile (opens in new tab)
3. Click "Mark as Referral Sent"

**What happens:**
```javascript
// Database updates:
workflow.referrer_marked_sent = true
workflow.status = 'referral_sent'
workflow.referrer_sent_at = now()
```

**Updated Checklist View:**
```
✓ Step 1: Candidate Shares Information
   ✓ Information submitted successfully

✓ Step 2: Referrer Submits to Company
   ✓ Referral submitted to company

○ Step 3: Candidate Confirms Receipt
   Confirm that you've received the referral
   notification

   ⚠️ By confirming, you acknowledge that the
   referrer has submitted your application. This
   will update their available referral slots.

   [Confirm Referral Received]
```

**Notifications:**
- Candidate receives: "Your referral has been submitted!"

### Phase 6: Candidate Confirms Receipt (Step 3)

**As Candidate (User B):**
1. See Step 3 is now active
2. Read the confirmation notice
3. Click "Confirm Referral Received"

**What happens:**
```javascript
// Database updates:
workflow.candidate_confirmed_receipt = true
workflow.status = 'referral_confirmed'
workflow.candidate_confirmed_at = now()

// TRIGGER: Slot counter decrements
referral_post.available_slots -= 1
```

**Final Checklist View:**
```
┌────────────────────────────────────────────┐
│  ✓ Referral Process Complete!              │
│                                             │
│  All steps have been completed. The         │
│  referral slot has been updated.            │
└────────────────────────────────────────────┘
```

**Notifications:**
- Referrer receives: "Candidate confirmed receipt. Slot updated."
- Candidate sees: "Thank you for confirming! The referral slot has been updated."

## Workflow States

### Status Progression
```
pending
  ↓ (acceptance)
awaiting_info
  ↓ (candidate submits)
info_submitted
  ↓ (referrer marks sent)
referral_sent
  ↓ (candidate confirms)
referral_confirmed
  ↓ (optional)
completed
```

### Database Schema

**referral_workflow table:**
```sql
- id: uuid
- connection_id: uuid (FK)
- status: text
- resume_url: text
- linkedin_url: text
- portfolio_url: text
- additional_notes: text

-- Checklist tracking (new):
- candidate_resume_uploaded: boolean
- candidate_linkedin_shared: boolean
- referrer_marked_sent: boolean
- candidate_confirmed_receipt: boolean

-- Timestamps (new):
- candidate_info_submitted_at: timestamptz
- referrer_sent_at: timestamptz
- candidate_confirmed_at: timestamptz
```

## Testing the Workflow

### Quick Test Scenario

1. **Seed the database:**
   - Click "Seed Sample Data" button
   - Creates pre-configured connections at different stages

2. **Test pending → accepted:**
   - Log in as User ID: `00000000-0000-0000-0000-000000000009` (Rachel)
   - Go to Messages → Referrals tab → "Received" sub-tab
   - See pending request with identity reveal warning
   - Click "Accept & Reveal Identity"
   - Get redirected to chat with checklist

3. **Test Step 1 (Info Submission):**
   - Log in as User ID: `00000000-0000-0000-0000-000000000001` (Sarah)
   - Already has accepted connection
   - Go to the chat
   - See Step 1 active
   - Fill in resume and LinkedIn URLs
   - Click "Submit Information"
   - See Step 1 marked complete, Step 2 activated

4. **Test Step 2 (Referrer Marks Sent):**
   - Log in as User ID: `00000000-0000-0000-0000-000000000006` (Kevin)
   - Has connection with info already submitted
   - Go to the chat
   - See Step 2 active with clickable links
   - Click "Mark as Referral Sent"
   - See Step 2 marked complete, Step 3 activated

5. **Test Step 3 (Candidate Confirms):**
   - Stay as User ID: `00000000-0000-0000-0000-000000000003` (Maya)
   - Or switch after completing Step 2
   - See Step 3 active
   - Click "Confirm Referral Received"
   - See complete success message
   - Check referral post - available_slots decreased by 1

### Test Data

The seed data includes:

**Connection 1** (Sarah → Alex):
- Status: accepted
- Workflow: awaiting_info
- Use: Test Step 1 (candidate info submission)

**Connection 2** (Maya → Kevin):
- Status: accepted
- Workflow: info_submitted (resume + LinkedIn already provided)
- Use: Test Step 2 (referrer marks sent)

**Connection 3** (Chris → Rachel):
- Status: pending
- Use: Test acceptance flow with identity reveal

## Key Implementation Details

### 1. Automatic Redirection

When a connection is accepted, both users are automatically redirected to the chat:

```typescript
// In ConnectionRequestsView.tsx
const handleAcceptConnection = async (connectionId: string) => {
  // Accept connection
  await supabase
    .from('referral_connections')
    .update({ status: 'accepted' })
    .eq('id', connectionId);

  // Get conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('connection_id', connectionId)
    .maybeSingle();

  // Redirect to chat
  if (conversation) {
    window.location.href = `/dashboard/messages?conversation=${conversation.id}`;
  }
};
```

### 2. Persistent Checklist Component

The `ReferralWorkflowChecklist` component:
- Fetches workflow state from database
- Determines which steps are active based on status
- Shows different UI for sender vs receiver
- Automatically updates on user actions
- Provides real-time feedback

### 3. Slot Counter Trigger

Slots are decremented automatically via database trigger:

```sql
CREATE TRIGGER trigger_decrement_slots
  AFTER UPDATE ON referral_workflow
  FOR EACH ROW
  WHEN (NEW.status = 'referral_confirmed')
  EXECUTE FUNCTION decrement_referral_slots();
```

**Important**: Slots only decrease when status becomes 'referral_confirmed', which requires:
1. Candidate uploaded resume ✓
2. Candidate shared LinkedIn ✓
3. Referrer marked as sent ✓
4. Candidate confirmed receipt ✓

## Benefits of This Approach

### For Candidates (User B)
1. Clear visibility into process status
2. Know exactly when referral is submitted
3. Can confirm receipt before slot is used
4. Persistent record in chat

### For Referrers (User A)
1. Get all needed information upfront
2. Easy access to resume/LinkedIn
3. Confirmation that candidate received notification
4. Slot only decreases after full completion

### For the Platform
1. Accountability on both sides
2. Prevents premature slot usage
3. Complete audit trail
4. Better data for analytics

## Troubleshooting

### Checklist not showing
- Check that conversation has a valid connection_id
- Verify workflow was created (should be automatic on acceptance)
- Check browser console for errors

### Step not activating
- Ensure previous step is completed
- Check workflow.status in database
- Verify checklist booleans are set correctly

### Slot not decrementing
- Confirm workflow.status = 'referral_confirmed'
- Check trigger exists: `trigger_decrement_slots`
- Verify referral_post.available_slots > 0

### Can't access chat
- Ensure conversation exists in database
- Check URL parameter: `?conversation=<uuid>`
- Verify user has permission (is sender or receiver)

## Future Enhancements

1. **Chat Messages**: Full messaging functionality within the workflow
2. **File Upload**: Direct resume upload instead of URL
3. **Progress Bar**: Visual progress indicator
4. **Reminders**: Automated reminders for pending steps
5. **Edit Information**: Allow candidates to update their info
6. **Withdrawal**: Cancel connection at any stage
7. **Status History**: Timeline view of all status changes
8. **Custom Notes**: Allow both parties to add notes at each step
