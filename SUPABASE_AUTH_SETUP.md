# Supabase Authentication Setup

## Required Configuration

For the OTP email verification flow to work properly, you need to configure Supabase email settings.

### Step 1: Enable Email Confirmation

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings**
3. Scroll to **Email Auth**
4. Enable **Confirm email** toggle
5. Click **Save**

### Step 2: Configure Email Templates (Optional)

1. Navigate to **Authentication** → **Email Templates**
2. Customize the **Confirm signup** template
3. Use the following variables:
   - `{{ .ConfirmationURL }}` - The confirmation link
   - `{{ .Token }}` - The 6-digit OTP code
   - `{{ .SiteURL }}` - Your site URL

### Step 3: Email Provider Setup

By default, Supabase uses their email service which has rate limits:

- **Development**: 3 emails per hour
- **Production**: Use a custom SMTP provider

#### Setting up Custom SMTP (Recommended for Production)

1. Navigate to **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Configure your SMTP provider (e.g., SendGrid, Mailgun, AWS SES)
4. Test the configuration

### Step 4: Environment Variables

The following environment variables are already configured in `.env`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Authentication Flow

### Sign Up Flow:
```
1. User fills sign-up form
   ↓
2. Supabase creates user with unconfirmed email
   ↓
3. User redirected to /verify-otp page
   ↓
4. User receives email with 6-digit OTP
   ↓
5. User enters OTP code
   ↓
6. Supabase verifies OTP and confirms email
   ↓
7. User redirected to /onboarding
   ↓
8. User completes "Tell us about yourself"
   ↓
9. User redirected to /dashboard
```

### Important Notes:

1. **Email Confirmation Required**: Users cannot access the app until they verify their email with the OTP code.

2. **OTP Expiration**: OTP codes expire after a certain time (configurable in Supabase settings).

3. **Rate Limits**: Be aware of email sending rate limits, especially in development.

4. **Testing**:
   - In development, you can check Supabase logs to see the OTP codes
   - Navigate to **Authentication** → **Users** to see user email confirmation status
   - You can manually confirm emails from the dashboard for testing

## Troubleshooting

### OTP Page Not Showing
- Ensure email confirmation is enabled in Supabase settings
- Check browser console for errors
- Verify the redirect URL in the signup function

### Not Receiving Emails
- Check Supabase email rate limits
- Verify SMTP configuration (if using custom SMTP)
- Check spam folder
- View logs in Supabase dashboard under **Authentication** → **Logs**

### Auto-Login After Signup
- This happens when email confirmation is disabled
- Enable email confirmation in Supabase settings
- Users should not be authenticated until OTP is verified

## Development vs Production

### Development
- Supabase provides email service with rate limits
- You can see OTP codes in Supabase logs
- Can manually confirm users in dashboard

### Production
- **Must** use custom SMTP provider
- Configure proper email templates with branding
- Set up email monitoring and error handling
- Consider implementing retry logic for failed emails
