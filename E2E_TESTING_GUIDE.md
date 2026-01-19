# E2E Testing Guide - Complete Referral Workflow

## Overview

This guide demonstrates the complete end-to-end workflow for referral connections with automatic identity reveal, document exchange, and referral completion tracking.

## Test Scenario Setup

The seed data includes several pre-configured scenarios to test the complete workflow:

### Test Users

1. **TechSeeker_Sarah** (ID: ...0001) - Seeking referrals
2. **Microsoft_Insider_Alex** (ID: ...0002) - Offering Microsoft referrals
3. **DataScience_Maya** (ID: ...0003) - Seeking data science roles
4. **Google_SWE_Kevin** (ID: ...0006) - Offering Google referrals
5. **DevOps_Chris** (ID: ...0008) - Seeking SRE roles
6. **Amazon_PM_Rachel** (ID: ...0009) - Offering Amazon PM referrals

### Pre-configured Connections

1. **Connection 1** (Sarah → Alex):
   - Status: Accepted
   - Identity: Revealed
   - Workflow: Awaiting Information
   - Use case: Test information submission flow

2. **Connection 2** (Maya → Kevin):
   - Status: Accepted
   - Identity: Revealed
   - Workflow: Information Submitted
   - Use case: Test referral submission flow

3. **Connection 3** (Chris → Rachel):
   - Status: Pending
   - Use case: Test connection acceptance flow

## Complete E2E Workflow Test

### Phase 1: Connection Request (Pending State)

**As Chris (DevOps Engineer):**
1. Browse referral posts
2. Find Rachel's Amazon PM referral offer
3. Click "Connect" and send a message
4. Wait for acceptance

**What happens:**
- Connection request is created with status 'pending'
- Identity remains hidden (anonymous)
- Rachel receives a notification

**To Test:**
- Log in as Chris (User ID: ...0008)
- Go to "Connection Requests" → "Sent" tab
- See the pending request to Rachel

### Phase 2: Connection Acceptance (Auto Identity Reveal)

**As Rachel (Amazon PM):**
1. Go to "Connection Requests" → "Received" tab
2. See Chris's pending request (shows as "Anonymous User")
3. Click "Accept" button

**What happens automatically:**
- Connection status changes to 'accepted'
- **Identity is immediately revealed** (no separate approval needed)
- A conversation is created between both users
- A workflow entry is created with status 'awaiting_info'
- Chris receives a notification
- The workflow panel expands automatically showing next steps

**To Test:**
- Log in as Rachel (User ID: ...0009)
- Go to "Connection Requests" → "Received" tab
- Click "Accept" on Chris's request
- Watch the UI update:
  - Status badge changes to "Connected"
  - Identity badge appears showing "Identity Revealed"
  - Workflow badge shows "Awaiting Information"
  - Workflow panel expands automatically
  - User's real name and details are now visible

### Phase 3: Information Submission

**As Sarah (or any accepted sender):**
1. Go to "Connection Requests" → "Sent" tab
2. Find the accepted connection
3. See workflow panel with status "Awaiting Information"
4. Click "Show Details" to expand
5. Fill in the form:
   - Resume Link (required): `https://drive.google.com/file/d/my-resume`
   - LinkedIn Profile (required): `https://linkedin.com/in/myprofile`
   - Portfolio (optional): `https://myportfolio.com`
   - Additional Notes (optional): Any relevant information
6. Click "Submit Information"

**What happens:**
- Workflow status changes to 'info_submitted'
- Resume and LinkedIn URLs are saved
- Alex (referrer) receives a notification
- Panel refreshes and shows "Under Review" status

**To Test:**
- Log in as Sarah (User ID: ...0001)
- Go to "Connection Requests" → "Sent" tab
- Find connection to Alex (Microsoft)
- Expand the workflow details
- Submit information with dummy URLs
- See status update to "Information Submitted"

### Phase 4: Referral Review & Submission

**As Alex (or any receiver with info_submitted status):**
1. Go to "Connection Requests" → "Received" tab
2. Find the connection with "Information Submitted" badge
3. Click "Show Details" to expand workflow
4. Review candidate information:
   - Click "View Resume" link
   - Click "View LinkedIn Profile" link
   - Click "View Portfolio" link (if provided)
   - Read additional notes
5. Add optional referral notes
6. Click "Submit Referral to Company"

**What happens:**
- Workflow status changes to 'referral_submitted'
- Submission timestamp is recorded
- **Available slots decrease by 1** on the original post
- Sarah receives a notification
- Panel shows success message with submission date

**To Test:**
- Log in as Kevin (User ID: ...0006)
- Go to "Connection Requests" → "Received" tab
- Find connection from Maya (already has info submitted)
- Expand workflow details
- Review her information (links work)
- Add optional notes
- Click "Submit Referral to Company"
- See confirmation alert and status update

### Phase 5: Completion

**As the Referrer (Kevin):**
1. After referral is submitted, see "Referral Submitted" status
2. When appropriate, click "Mark as Completed"

**What happens:**
- Workflow status changes to 'completed'
- Process is officially closed
- Both parties can still view the conversation history

**To Test:**
- After submitting referral in Phase 4
- Click "Mark as Completed" button
- See final "Process Completed" status

## Testing All Workflow States

### State 1: Awaiting Information
- **Who sees it:** Sender (candidate)
- **Action required:** Submit resume, LinkedIn, portfolio
- **Test with:** Sarah → Alex connection

### State 2: Information Submitted
- **Who sees it:** Both parties
- **Sender sees:** "Under Review" message
- **Receiver sees:** Review panel with links and submit button
- **Action required:** Referrer submits to company
- **Test with:** Maya → Kevin connection

### State 3: Referral Submitted
- **Who sees it:** Both parties
- **Shows:** Success message, submission date, optional notes
- **Receiver action:** Can mark as completed
- **Test by:** Completing Phase 4 workflow

### State 4: Completed
- **Shows:** Final completion status
- **No further actions required**

## Key Features to Verify

### 1. Automatic Identity Reveal
- ✓ Identities hidden in pending state
- ✓ Identities automatically revealed on acceptance
- ✓ No separate approval step needed
- ✓ Real names and details immediately visible

### 2. Workflow Progression
- ✓ Each step flows to the next automatically
- ✓ Status badges update in real-time
- ✓ Panels expand to show relevant information
- ✓ Loading states show during transitions

### 3. Data Validation
- ✓ Resume and LinkedIn are required fields
- ✓ Portfolio and notes are optional
- ✓ URLs are validated (basic format check)
- ✓ Submit buttons disabled when invalid

### 4. Slot Management
- ✓ Available slots decrease when referral submitted
- ✓ Slot count visible on original post
- ✓ Cannot submit if no slots available (future enhancement)

### 5. Notifications
- ✓ Connection acceptance notification
- ✓ Information submitted notification
- ✓ Referral submitted notification
- ✓ Process completion notification

### 6. Messaging Integration
- ✓ Conversation created on acceptance
- ✓ "Send Message" button appears when connected
- ✓ Can message at any workflow stage

## Quick Test Checklist

**As a candidate (sender):**
- [ ] Send connection request
- [ ] Receive acceptance notification
- [ ] See identity revealed automatically
- [ ] Submit resume and LinkedIn
- [ ] See "Information Submitted" status
- [ ] Receive "Referral Submitted" notification
- [ ] View final completion status

**As a referrer (receiver):**
- [ ] Receive connection request (anonymous)
- [ ] Accept request
- [ ] See identity revealed
- [ ] See workflow created
- [ ] Receive information submission notification
- [ ] Review candidate documents
- [ ] Submit referral to company
- [ ] See slots decrease
- [ ] Mark as completed

## Common Testing Scenarios

### Scenario 1: Happy Path
1. User sends request → Accepted → Info submitted → Referral submitted → Completed
2. All steps complete successfully
3. Both parties satisfied

### Scenario 2: Request Rejection
1. User sends request → Rejected
2. No workflow created
3. Identity remains hidden

### Scenario 3: Information Pending
1. Request accepted → Workflow created → Days pass
2. Reminder system (future enhancement)
3. Eventually candidate submits info

### Scenario 4: Multiple Requests
1. Referrer accepts multiple requests
2. Each has independent workflow
3. Slots decrease with each submission
4. Workflows tracked separately

## Browser Console Testing

To verify backend operations:

```javascript
// Check connection status
const { data } = await supabase
  .from('referral_connections')
  .select('*, workflow:referral_workflow(*)')
  .eq('id', 'CONNECTION_ID');
console.log(data);

// Verify slot decrease
const { data: post } = await supabase
  .from('referral_posts')
  .select('available_slots, total_slots')
  .eq('id', 'POST_ID')
  .single();
console.log('Slots:', post);
```

## Performance Expectations

- Connection acceptance: < 1 second
- Identity reveal: Instant (same operation)
- Workflow creation: Automatic via trigger
- Information submission: < 1 second
- Referral submission: < 1 second + notification
- UI updates: Smooth animations with 500ms delay

## Known Limitations (Current Version)

1. No email notifications (in-app only)
2. No file upload (URLs only)
3. No edit functionality after submission
4. No cancellation after submission
5. No dispute resolution system

## Future Enhancements

1. File upload for resumes
2. Edit submitted information
3. Withdraw connection requests
4. Set reminder notifications
5. Add referral outcome tracking
6. Analytics dashboard for referrers
7. Bulk referral management
8. Template messages for common scenarios
