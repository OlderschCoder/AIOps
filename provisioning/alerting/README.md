# Grafana Alerting Configuration for SCCC Network Monitoring

This directory contains Grafana alerting configuration files that automatically provision alert rules and notification channels.

## Setup Instructions

### 1. Configure Notification Channels

#### Microsoft Teams Webhook
1. In Microsoft Teams, go to the channel where you want alerts (e.g., "IT-Ops")
2. Click the "..." menu next to the channel name
3. Select "Connectors" → "Incoming Webhook"
4. Click "Configure" and give it a name (e.g., "Network Alerts")
5. Copy the webhook URL
6. Update `provisioning/notifiers/teams-webhook.yaml`:
   - Replace `YOUR-TEAMS-WEBHOOK-URL-HERE` with your actual webhook URL

#### SMS Configuration
Choose one of these options:

**Option A: SMS via Webhook (Twilio)**
1. Sign up for Twilio (or use existing account)
2. Get your Account SID and Auth Token
3. Update `provisioning/notifiers/sms-webhook.yaml`:
   - Set `url` to your Twilio API endpoint
   - Set `username` to your Account SID
   - Set `password` to your Auth Token

**Option B: Email-to-SMS Gateway**
1. Use carrier email-to-SMS gateways:
   - AT&T: `number@txt.att.net`
   - Verizon: `number@vtext.com`
   - T-Mobile: `number@tmomail.net`
   - Sprint: `number@messaging.sprintpcs.com`
2. Update `provisioning/notifiers/email.yaml`:
   - Set `addresses` to the email-to-SMS address (e.g., `"5551234567@vtext.com"`)

**Option C: SMTP-to-SMS Service**
- Some organizations use an SMTP relay that converts emails to SMS
- Configure the email notifier with the SMTP-to-SMS gateway address

#### Email Configuration (Office 365)
1. Update `provisioning/notifiers/email.yaml`:
   - Set `addresses` to your IT operations distribution list
   - Set `user` to your service account email
   - Set `password` to the service account password (consider using environment variable)
   - Set `fromAddress` and `fromName` as desired

### 2. Review Alert Rules

The alert rules in `provisioning/alerting/device-down-rules.yaml` detect devices that:
- Haven't reported `sysUpTime` in the last 5 minutes
- Are expected to be reporting (seen in last 24 hours)

You can customize:
- `for: 2m` - Wait time before alerting (currently 2 minutes)
- `repeat_interval: 4h` - How often to repeat the alert if still active

### 3. Restart Grafana

After updating the configuration files, restart Grafana to load the new alerting rules:

```bash
docker restart grafana
```

Or if using docker-compose:
```bash
docker-compose restart grafana
```

### 4. Verify Setup

1. Log into Grafana
2. Go to **Alerting** → **Alert rules**
3. You should see the "Network Device Monitoring" group with device down alerts
4. Go to **Alerting** → **Contact points**
5. Verify your Teams, SMS, and Email contact points are configured
6. Go to **Alerting** → **Notification policies**
7. Verify routing rules are set up correctly

### 5. Test Alerts

To test the alerting system:
1. Temporarily stop SNMP collection for a test device
2. Or manually trigger an alert by adjusting thresholds
3. Verify alerts arrive via Teams, SMS, and Email

### Alert Details

**Device Down Alert:**
- **Condition**: Device hasn't reported `sysUpTime` in last 5 minutes
- **Severity**: Critical
- **Notifications**: Teams + SMS + Email
- **Repeat**: Every 4 hours if still active
- **Labels**: Includes `sysName`, `source` (IP), `severity`, `alert_type`

### Troubleshooting

**Alerts not firing:**
- Check that devices are actually reporting to InfluxDB
- Verify the Flux queries work in Grafana's query editor
- Check Grafana logs: `docker logs grafana`

**Notifications not arriving:**
- Test Teams webhook URL with a simple curl command
- Verify SMTP credentials are correct
- Check SMS webhook/service is configured correctly
- Review Grafana notification logs in the Alerting section

**Too many false positives:**
- Increase the `for` duration to wait longer before alerting
- Adjust the time range in the alert queries
- Review device polling intervals in Telegraf

### Customization

You can add more alert rules for:
- High interface utilization (>90%)
- Interface errors increasing
- Device CPU/Memory thresholds
- Link packet loss
- FortiGate intrusion events

Add new rules to `device-down-rules.yaml` following the same pattern.
