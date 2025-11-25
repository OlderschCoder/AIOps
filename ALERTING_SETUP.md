# Network Device Alerting System - Setup Guide

This alerting system notifies you via **Teams** and **SMS** when network devices go down.

## What Was Created

1. **Alert Rules** (`provisioning/alerting/device-down-rules.yaml`)
   - Detects devices that haven't reported SNMP data in the last 5 minutes
   - Triggers when a device's `sysUpTime` is stale

2. **Notification Channels** (Contact Points)
   - Microsoft Teams webhook
   - SMS via webhook or email-to-SMS gateway
   - Email via Office 365 SMTP

3. **Notification Policies** (`provisioning/alerting/notification-policies.yaml`)
   - Routes critical alerts to Teams + SMS + Email
   - Routes warning alerts to Email only

## Quick Setup Steps

### Step 1: Configure Teams Webhook

1. Open Microsoft Teams
2. Navigate to your IT-Ops channel (or create one)
3. Click the **"..."** menu next to the channel name
4. Go to **Connectors** → **Incoming Webhook**
5. Click **Configure**
6. Give it a name like "Network Alerts" and optionally upload an icon
7. Click **Create**
8. **Copy the webhook URL** (it will look like: `https://outlook.office.com/webhook/xxxxx...`)

9. Edit `provisioning/notifiers/teams-webhook.yaml`:
   ```yaml
   url: "https://outlook.office.com/webhook/YOUR-ACTUAL-URL-HERE"
   ```

### Step 2: Configure SMS Notifications

Choose **ONE** of these options:

#### Option A: Email-to-SMS (Easiest - No Extra Service)

1. Get the SMS email address for your phone carrier:
   - **AT&T**: `yourphonenumber@txt.att.net`
   - **Verizon**: `yourphonenumber@vtext.com`
   - **T-Mobile**: `yourphonenumber@tmomail.net`
   - **Sprint**: `yourphonenumber@messaging.sprintpcs.com`

2. Edit `provisioning/notifiers/email.yaml`:
   ```yaml
   addresses: "5551234567@vtext.com"  # Replace with your carrier's email-to-SMS
   ```

3. Update the notification policy to use email for SMS:
   - The SMS webhook won't be used
   - Alerts will go to the email-to-SMS address via SMTP

#### Option B: Twilio (Professional SMS Service)

1. Sign up for Twilio at https://www.twilio.com
2. Get your Account SID and Auth Token
3. Edit `provisioning/notifiers/sms-webhook.yaml`:
   ```yaml
   url: "https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json"
   username: "YOUR_ACCOUNT_SID"
   password: "YOUR_AUTH_TOKEN"
   ```

### Step 3: Configure Email (Office 365)

1. Create a service account in Office 365 (e.g., `alerts@sccc.edu`)
2. Set up an app password for the account (if MFA is enabled)
3. Edit `provisioning/notifiers/email.yaml`:
   ```yaml
   addresses: "it-ops@sccc.edu"  # Your IT distribution list
   user: "alerts@sccc.edu"
   password: "YOUR_APP_PASSWORD"
   fromAddress: "alerts@sccc.edu"
   ```

### Step 4: Update Notification Policies

Edit `provisioning/alerting/notification-policies.yaml`:

1. Update Teams webhook URL in the `critical-alerts` receiver
2. Update SMS webhook URL (if using Twilio) in the `critical-alerts` receiver
3. Update email addresses as needed

### Step 5: Restart Grafana

After making all configuration changes:

```bash
docker restart grafana
```

Or with docker-compose:
```bash
docker-compose restart grafana
```

### Step 6: Verify in Grafana UI

1. Log into Grafana (http://localhost:3000)
2. Go to **Alerting** → **Alert rules**
   - You should see "Network Device Monitoring" group
   - Check that the alert rule shows up
3. Go to **Alerting** → **Contact points**
   - Verify Teams, SMS, and Email contact points appear
   - Test each one using the "Test" button
4. Go to **Alerting** → **Notification policies**
   - Verify routing rules are configured

## Testing the Alert System

### Test Method 1: Temporary Device Disconnect

1. Physically disconnect a test device from the network
2. Wait 2-3 minutes
3. Check that alerts arrive:
   - Teams message in your channel
   - SMS on your phone
   - Email in your inbox

### Test Method 2: Manual Alert Test

1. In Grafana, go to **Alerting** → **Contact points**
2. Click **Test** on each contact point
3. Verify you receive test notifications

### Test Method 3: Modify Alert Threshold (Temporarily)

1. Go to **Alerting** → **Alert rules**
2. Edit the "Network Device Down" rule
3. Temporarily change the threshold from 5 minutes to 1 minute
4. Wait 2 minutes - alerts should fire for all devices
5. **Change it back to 5 minutes** after testing

## How It Works

### Alert Detection

The system monitors SNMP `sysUpTime` for all devices:
- Telegraf polls devices every 60 seconds
- The alert checks if the last `sysUpTime` update is older than 5 minutes
- If yes → Device is considered down → Alert fires

### Alert Flow

```
Device Down Detected
    ↓
Alert Rule Triggers (severity: critical)
    ↓
Notification Policy Routes to "critical-alerts"
    ↓
Alerts Sent to:
    ├─ Teams (IT-Ops channel)
    ├─ SMS (On-call phone)
    └─ Email (IT-Ops distribution list)
```

### Alert Details

Each alert includes:
- **Device Name** (`sysName` tag)
- **IP Address** (`source` tag)
- **Time Since Last Report** (in minutes)
- **Severity**: Critical
- **Alert Type**: Device availability

## Customization

### Adjust Alert Timing

Edit `provisioning/alerting/device-down-rules.yaml`:

```yaml
for: 2m  # Wait 2 minutes before alerting (reduce false positives)

# In the query, change:
- 5  # Alert if age > 5 minutes (change to 3, 7, 10, etc.)
```

### Change Alert Frequency

Edit `provisioning/alerting/notification-policies.yaml`:

```yaml
repeat_interval: 4h  # How often to repeat if still down (change to 2h, 8h, etc.)
```

### Add More Alert Rules

Add to `provisioning/alerting/device-down-rules.yaml`:

```yaml
- uid: high-cpu-alert
  title: "Device CPU High"
  # ... (follow the same pattern)
```

## Troubleshooting

### Alerts Not Firing

1. **Check device data in InfluxDB**:
   ```flux
   from(bucket: "telegraf")
     |> range(start: -10m)
     |> filter(fn: (r) => r._measurement == "snmp" and r._field == "sysUpTime")
     |> last()
   ```

2. **Check Grafana logs**:
   ```bash
   docker logs grafana | grep -i alert
   ```

3. **Verify alert rule is enabled** in Grafana UI

### Notifications Not Arriving

1. **Test Teams webhook**:
   ```bash
   curl -X POST "YOUR_TEAMS_WEBHOOK_URL" -H "Content-Type: application/json" -d '{"text":"Test"}'
   ```

2. **Check SMTP credentials** in email.yaml

3. **Verify contact points** are enabled in Grafana UI

4. **Check notification logs** in Grafana:
   - Go to **Alerting** → **Notification history**

### Too Many False Positives

1. Increase `for: 2m` to `for: 5m` (wait longer before alerting)
2. Increase threshold from 5 minutes to 7-10 minutes
3. Check if devices are actually polling (Telegraf logs)

## Files Created

```
provisioning/
├── alerting/
│   ├── device-down-rules.yaml      # Alert rule definitions
│   ├── notification-policies.yaml  # Routing rules
│   └── README.md                   # Detailed documentation
└── notifiers/
    ├── teams-webhook.yaml          # Teams contact point
    ├── sms-webhook.yaml            # SMS contact point
    └── email.yaml                  # Email contact point
```

## Next Steps

1. ✅ Complete the setup steps above
2. ✅ Test the alerting system
3. ✅ Verify all notifications work
4. 📝 Document your Teams channel and phone numbers
5. 🔧 Tune thresholds based on your network behavior
6. 📊 Monitor alert frequency and adjust as needed

## Support

If you encounter issues:
1. Check Grafana logs: `docker logs grafana`
2. Check Telegraf logs: `docker logs telegraf`
3. Review the README in `provisioning/alerting/README.md`
4. Verify InfluxDB has data: Check dashboards in Grafana
