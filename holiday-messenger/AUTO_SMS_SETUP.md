# Holiday Messenger Auto SMS Setup

The public website never stores your Twilio auth token. Automatic SMS uses the Supabase Edge Function in `supabase/functions/send-holiday-sms`.

## 1. Set Supabase secrets

Use your real Twilio values and choose your own private passcode:

```powershell
supabase secrets set TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
supabase secrets set TWILIO_AUTH_TOKEN="your_twilio_auth_token"
supabase secrets set TWILIO_FROM_NUMBER="+15551234567"
supabase secrets set HOLIDAY_MESSENGER_SEND_KEY="choose-a-private-passcode"
supabase secrets set HOLIDAY_ALLOWED_TO_NUMBERS="+15551234567,+15557654321"
```

`HOLIDAY_ALLOWED_TO_NUMBERS` is optional, but it is safer while testing. With a Twilio trial, recipients also need to be verified in Twilio.

## 2. Deploy the database and function

```powershell
supabase db push
supabase functions deploy send-holiday-sms
```

## 3. Add the GitHub cron secret

Add this repository secret in GitHub:

```text
HOLIDAY_MESSENGER_SEND_KEY
```

Use the same passcode from Supabase. The workflow `.github/workflows/holiday-sms-cron.yml` calls the function every 10 minutes to send due scheduled texts.

## 4. Use the website

Open Holiday Messenger, enter the same passcode in Automatic SMS setup, turn on auto-send, and schedule a text with `Auto-send with Twilio`.
