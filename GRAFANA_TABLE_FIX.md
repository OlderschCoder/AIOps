# Fix: Grafana Table Dynamic Columns/Dropdowns Issue

## Problem

Grafana is creating dynamic columns and dropdowns instead of showing a simple static table. This happens because:

1. **`reduce()` with groups creates multiple tables** - Grafana treats each group as a separate series
2. **Grafana auto-detects label columns** - Some columns are treated as labels/filters
3. **Panel field configuration** - Columns may be set to "Auto" mode which detects types dynamically

## Solution

### 1. Fix the Flux Query

The key changes:
- Use `group(columns: [])` **after** `reduce()` to merge all groups into one table
- Use `keep()` to explicitly specify only the columns you want
- Ensure all columns are fields, not tags/labels

### Corrected Query:

```flux
from(bucket: "telegraf")
  |> range(start: -30m)
  |> filter(fn: (r) =>
    r._measurement == "snmp" and
    r._field == "sysUpTime" and
    (exists r.sysDescr or exists r.sysName)
  )
  |> group(columns: ["sysName"])
  |> last()
  |> map(fn: (r) => ({
    sysName: r.sysName,
    sysDescr: if exists r.sysDescr then string(v: r.sysDescr) else "",
    age_sec: float(v: uint(v: now()) - uint(v: r._time)) / 1000000000.0,
    uptime_days: float(v: r._value) / 8640000.0
  }))
  |> map(fn: (r) => {
    sev = if r.age_sec > 300.0 then 2
      else if r.age_sec > 120.0 then 1
      else 0
    label = if r.sysDescr =~ /Aruba/ then "Aruba Switches"
      else if r.sysDescr =~ /Cisco.*(Nexus|NX-OS)/ then "Cisco Nexus 9K"
      else if r.sysName == "Switch-0" then "Switch 0"
      else if r.sysName =~ /FortiGate/ then "Firewall"
      else "Other"
    return {
      Group: label,
      severity: sev,
      uptime_days: r.uptime_days
    }
  })
  |> group(columns: ["Group"])
  |> reduce(
    identity: { Group: "", count: 0, max_sev: 0, sum_uptime: 0.0 },
    fn: (r, accumulator) => ({
      Group: r.Group,
      count: accumulator.count + 1,
      max_sev: if r.severity > accumulator.max_sev then r.severity else accumulator.max_sev,
      sum_uptime: accumulator.sum_uptime + r.uptime_days
    })
  )
  |> group(columns: [])  // ← KEY: Merge all groups into one table
  |> map(fn: (r) => ({
    Group: string(v: r.Group),
    Count: r.count,
    Status: string(v: if r.max_sev == 2 then "Red" else if r.max_sev == 1 then "Yellow" else "Green"),
    AvgUptimeDays: if r.count > 0 then r.sum_uptime / float(v: r.count) else 0.0
  }))
  |> keep(columns: ["Group", "Count", "Status", "AvgUptimeDays"])  // ← Explicitly keep only these columns
```

### 2. Configure Panel Settings

In Grafana panel settings:

1. **Panel Settings → Transformations**:
   - Remove any "Organize fields" or "Group by" transformations
   - Use "No transformations" or "None"

2. **Panel Settings → Field Configuration**:
   - For each column, set:
     - **Display name**: Custom name (e.g., "Group", "Count", "Status", "Avg Uptime Days")
     - **Type**: "String" for text, "Number" for numeric
     - **Unit**: Appropriate unit (e.g., "d" for days)
     - **Custom**: Set "Cell display mode" to "Auto" or "Color text" for Status

3. **Panel Options**:
   - **Show header**: ON
   - **Cell display mode**: Auto (or specific mode)
   - **Footer**: OFF (unless you need totals)

### 3. Prevent Alphabetical Column Reordering

**The Problem:** Grafana automatically sorts columns alphabetically by default.

**Solution 1: Use "Organize fields" Transformation (Recommended)**

1. In your panel, go to **Transformations** tab
2. Click **Add transformation**
3. Select **"Organize fields"**
4. For each field, drag them to your desired order:
   - Group (position 1)
   - Count (position 2)
   - Status (position 3)
   - AvgUptimeDays (position 4)
5. Make sure **"Keep all fields"** is selected (or uncheck fields you don't want)
6. Click **Apply**

**Solution 2: Use Field Configuration Overrides**

1. In panel settings, go to **Field** tab
2. Click on each field (column) in the order you want them displayed
3. In **Field Configuration**, set:
   - **Display name**: Keep your desired name
   - Under **Overrides**, you can't directly set order, but you can ensure fields are explicitly configured

**Solution 3: Control Column Order via Query (Flux)**

If you want to ensure columns appear in a specific order from the query itself, you can't directly control this in Flux, but you can use field names that start with numbers or use consistent naming. However, **Solution 1 (Organize fields)** is the proper way.

**Solution 4: Use Display Name Prefixes (Workaround)**

A workaround is to prefix display names with numbers in the order you want:

1. In **Field Configuration**, set display names:
   - `1. Group`
   - `2. Count`
   - `3. Status`
   - `4. Avg Uptime Days`

This forces alphabetical order to match your desired order (but shows numbers in headers).

**Best Practice:** Use the **"Organize fields"** transformation - it's the cleanest solution and explicitly controls column order.

### 4. Alternative: Use Table Transform (Simpler Query)

If the above doesn't work, use a simpler approach without `reduce()`:

```flux
from(bucket: "telegraf")
  |> range(start: -30m)
  |> filter(fn: (r) =>
    r._measurement == "snmp" and
    r._field == "sysUpTime" and
    (exists r.sysDescr or exists r.sysName)
  )
  |> group(columns: ["sysName"])
  |> last()
  |> map(fn: (r) => ({
    sysName: string(v: r.sysName),
    sysDescr: if exists r.sysDescr then string(v: r.sysDescr) else "",
    age_sec: float(v: uint(v: now()) - uint(v: r._time)) / 1000000000.0,
    uptime_days: float(v: r._value) / 8640000.0,
    Group: if r.sysDescr =~ /Aruba/ then "Aruba Switches"
      else if r.sysDescr =~ /Cisco.*(Nexus|NX-OS)/ then "Cisco Nexus 9K"
      else if r.sysName == "Switch-0" then "Switch 0"
      else if r.sysName =~ /FortiGate/ then "Firewall"
      else "Other",
    Status: if (float(v: uint(v: now()) - uint(v: r._time)) / 1000000000.0) > 300.0 then "Red"
      else if (float(v: uint(v: now()) - uint(v: r._time)) / 1000000000.0) > 120.0 then "Yellow"
      else "Green"
  }))
  |> keep(columns: ["Group", "sysName", "Status", "uptime_days"])
  |> group(columns: [])  // Merge all rows
```

Then use Grafana's built-in **Transformations**:
- Add "Group by" transformation: Group by "Group"
- Add "Aggregations" transformation:
  - Count (for number of devices)
  - Last (for Status)
  - Mean (for AvgUptimeDays)
- Add "Organize fields" to set column order

## Panel Settings Checklist

✅ **Visualization**: Table (not Time series, Stat, etc.)

✅ **Panel Options**:
- Show header: ON
- Cell display mode: Auto
- Footer: OFF

✅ **Field Configuration**:
- Each column should have explicit configuration
- No columns set to "Auto" if they're causing issues

✅ **Transformations**: 
- Add **"Organize fields"** transformation to control column order
- Remove any "Organize fields" that auto-detects
- Use explicit transformations only

✅ **Query Options**:
- Format: Table (not Time series)

## Debugging

1. **Check what Grafana sees**:
   - Click the query in the panel
   - Look at "Table" view in the query results
   - See if columns are there or if it's creating labels

2. **Check panel JSON** (Advanced → Panel JSON):
   - Look for `"transformations"` array
   - Look for `"fieldConfig"` with auto-detection
   - Check if `"organize"` transformation exists with field order

3. **Test query separately**:
   - Go to Explore
   - Run the query
   - Check "Table" format
   - If it works in Explore but not panel, it's a panel configuration issue

## Quick Fix Summary

1. **Fix dynamic columns**: Add **`|> group(columns: [])`** after `reduce()` to merge all grouped results into a single table, then use **`keep()`** to explicitly control which columns appear.

2. **Fix column order**: Add **"Organize fields"** transformation to explicitly set the column display order (prevents alphabetical sorting).
