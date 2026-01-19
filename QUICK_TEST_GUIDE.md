# Quick Test Guide - Referral Workflow

## Prerequisites

1. Seed the database by clicking "Seed Sample Data" button
2. Have multiple browser windows/profiles ready for testing different users

## Navigation Path

**All referral workflow activity is in:**
```
Messages → Referrals Tab → (Received/Sent sub-tabs)
```

## Quick Test Scenarios

### Test 1: Accept Connection (2 minutes)

**User:** Rachel (ID: `00000000-0000-0000-0000-000000000009`)

**Steps:**
1. Login as Rachel
2. Go to **Messages → Referrals → Received**
3. You should see a pending connection request with amber warning box
4. Read warning: "By accepting, your identity will be revealed..."
5. Click **"Accept & Reveal Identity"**
6. ✅ You should be redirected to chat with checklist visible

**Expected Result:**
- Automatic redirect to chat
- Workflow checklist appears
- Step 1 is active (waiting for candidate)
- Can see candidate's name and profile (identity revealed)

---

### Test 2: Candidate Submits Info (2 minutes)

**User:** Sarah (ID: `00000000-0000-0000-0000-000000000001`)

**Steps:**
1. Login as Sarah
2. Go to **Messages → Referrals → Sent**
3. Find accepted connection
4. Click **"Send Message"**
5. In chat, verify Step 1 is active
6. Enter resume URL: `https://drive.google.com/file/d/test-resume`
7. Enter LinkedIn URL: `https://linkedin.com/in/test-profile`
8. Click **"Submit Information"**
9. ✅ Step 1 should show green checkmark
10. ✅ Step 2 should become active for referrer

**Expected Result:**
- Step 1 marked as complete
- Green border and checkmark appear
- Step 2 unlocks (but locked for you as candidate)

---

### Test 3: Referrer Marks Sent (2 minutes)

**User:** Kevin (ID: `00000000-0000-0000-0000-000000000006`)

**Steps:**
1. Login as Kevin
2. Go to **Messages → Referrals → Received**
3. Find connection with "info_submitted" status
4. Click **"Send Message"**
5. In chat, verify Step 2 is active
6. Click **"View Resume"** - opens in new tab
7. Click **"View LinkedIn Profile"** - opens in new tab
8. Click **"Mark as Referral Sent"**
9. ✅ Step 2 should show green checkmark
10. ✅ Step 3 should become active for candidate

**Expected Result:**
- Step 2 marked as complete
- Links open correctly
- Step 3 unlocks for candidate

---

### Test 4: Candidate Confirms Receipt (2 minutes)

**User:** Maya (ID: `00000000-0000-0000-0000-000000000003`)

**Steps:**
1. Login as Maya
2. Go to **Messages → Referrals → Sent**
3. Find connection where referrer marked as sent
4. Click **"Send Message"**
5. In chat, verify Step 3 is active
6. Read confirmation notice carefully
7. Click **"Confirm Referral Received"**
8. ✅ Success message appears: "Referral Process Complete!"
9. ✅ Go to Referrals page and verify slot decreased by 1

**Expected Result:**
- All steps show green checkmarks
- Completion banner appears
- Referral post's available_slots decreased by 1

---

### Test 5: Navigation Flow (1 minute)

**Steps:**
1. From chat, click **back arrow** (←)
2. ✅ Should return to Messages page (Referrals tab)
3. Click **"Send Message"** again
4. ✅ Should return to same chat with checklist
5. Copy URL from browser: `/dashboard/messages?conversation=<uuid>`
6. Open in new tab
7. ✅ Should load directly to chat

**Expected Result:**
- Back navigation works
- Can re-open chat from accepted connections
- Deep linking works

---

### Test 6: Identity Warnings (1 minute)

**View as Receiver (Pending Request):**
1. Login as any user with pending received request
2. Go to Messages → Referrals → Received
3. ✅ Should see amber warning box
4. ✅ Button says "Accept & Reveal Identity"

**View as Sender (Pending Request):**
1. Login as any user with pending sent request
2. Go to Messages → Referrals → Sent
3. ✅ Should see blue info box
4. ✅ No action buttons (waiting state)

**Expected Result:**
- Different colored warnings for different roles
- Clear explanation of what will happen
- Explicit button text

---

## Test User Quick Reference

| Name | User ID | Has Connection At Stage |
|------|---------|-------------------------|
| Sarah | `00...001` | awaiting_info |
| Maya | `00...003` | info_submitted |
| Kevin | `00...006` | Referrer (can review) |
| Rachel | `00...009` | pending (can accept) |

## Common Test Failures

### Checklist Doesn't Appear
- Check browser console for errors
- Verify workflow record exists in database
- Ensure conversation has connection_id

### Step Not Activating
- Verify previous step completed
- Check workflow.status in database
- Look for failed database updates

### Slot Not Decrementing
- Ensure reached 'referral_confirmed' status
- Check trigger exists: `trigger_decrement_slots`
- Verify available_slots > 0

### Navigation Not Working
- Clear browser cache
- Check URL parameter is correct
- Verify conversation ID is valid

## Quick Database Checks

```sql
-- Check workflow state
SELECT id, status,
       candidate_resume_uploaded,
       candidate_linkedin_shared,
       referrer_marked_sent,
       candidate_confirmed_receipt
FROM referral_workflow
WHERE connection_id = '<connection_id>';

-- Check connection state
SELECT status, identity_revealed
FROM referral_connections
WHERE id = '<connection_id>';

-- Check available slots
SELECT available_slots
FROM referral_posts
WHERE id = '<post_id>';
```

## Success Criteria

All tests pass if:
- ✅ Identity warnings appear before acceptance
- ✅ Automatic redirect to chat after acceptance
- ✅ Checklist visible and functional
- ✅ All three steps can be completed
- ✅ Slot decrements only after final confirmation
- ✅ Navigation works in all directions
- ✅ Works consistently across all test users

## Time Estimate

- Complete all 6 tests: ~10 minutes
- Single E2E flow (Tests 1-4): ~8 minutes
- Quick smoke test (Test 1 + 6): ~3 minutes
