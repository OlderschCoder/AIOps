# Filter Fields Containing a String in Flux

## Methods to Filter "Contains Aruba"

### Method 1: Regex Match (Recommended)

**Case-sensitive:**
```flux
|> filter(fn: (r) => r.sysDescr =~ /Aruba/)
```

**Case-insensitive:**
```flux
|> filter(fn: (r) => r.sysDescr =~ /(?i)aruba/)
```

### Method 2: Using strings.containsStr()

**Import strings first:**
```flux
import "strings"

|> filter(fn: (r) => strings.containsStr(v: r.sysDescr, substr: "Aruba"))
```

**Case-insensitive with strings:**
```flux
import "strings"

|> filter(fn: (r) => strings.containsStr(v: strings.toLower(v: r.sysDescr), substr: "aruba"))
```

## Examples

### Example 1: Filter sysDescr containing "aruba" (case-insensitive)

```flux
from(bucket: "telegraf")
  |> range(start: -30m)
  |> filter(fn: (r) => r._measurement == "snmp" and r._field == "sysUpTime")
  |> filter(fn: (r) => r.sysDescr =~ /(?i)aruba/)  // Case-insensitive regex
  |> last()
```

### Example 2: Filter sysName containing "aruba" using strings

```flux
import "strings"

from(bucket: "telegraf")
  |> range(start: -30m)
  |> filter(fn: (r) => r._measurement == "snmp")
  |> filter(fn: (r) => strings.containsStr(v: strings.toLower(v: string(v: r.sysName)), substr: "aruba"))
  |> last()
```

### Example 3: Filter in map() function (for your table query)

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
  |> filter(fn: (r) => r.sysDescr =~ /(?i)aruba/)  // Filter after map
  |> map(fn: (r) => {
    sev = if r.age_sec > 300.0 then 2
      else if r.age_sec > 120.0 then 1
      else 0
    label = if r.sysDescr =~ /(?i)aruba/ then "Aruba Switches"  // Check in map
      else if r.sysDescr =~ /(?i)cisco.*(nexus|nx-os)/ then "Cisco Nexus 9K"
      else if r.sysName == "Switch-0" then "Switch 0"
      else if r.sysName =~ /(?i)fortigate/ then "Firewall"
      else "Other"
    return {
      Group: label,
      severity: sev,
      uptime_days: r.uptime_days
    }
  })
  // ... rest of query
```

### Example 4: Multiple patterns (OR condition)

```flux
// Match "aruba" OR "cisco"
|> filter(fn: (r) => r.sysDescr =~ /(?i)(aruba|cisco)/)

// Match "aruba" in sysDescr OR sysName
|> filter(fn: (r) => 
  (exists r.sysDescr and r.sysDescr =~ /(?i)aruba/) or
  (exists r.sysName and r.sysName =~ /(?i)aruba/)
)
```

## Regex Pattern Notes

- `=~` is the regex match operator
- `/(?i)aruba/` - `(?i)` makes it case-insensitive
- `/aruba/i` - Alternative syntax (but `(?i)` is more portable)
- `/Aruba|ARUBA/` - Case-sensitive OR pattern

## Which Method to Use?

**Use Regex (`=~`) when:**
- ✅ You need case-insensitive matching
- ✅ You want simple substring matching
- ✅ Performance is important (regex is faster)
- ✅ You're already using regex elsewhere

**Use strings.containsStr() when:**
- ✅ You need exact substring matching
- ✅ You want more control over string manipulation
- ✅ You're already doing other string operations

## Complete Example for Your Use Case

If you want to filter only Aruba devices in your grouped table query:

```flux
from(bucket: "telegraf")
  |> range(start: -30m)
  |> filter(fn: (r) =>
    r._measurement == "snmp" and
    r._field == "sysUpTime" and
    (exists r.sysDescr or exists r.sysName)
  )
  |> filter(fn: (r) => 
    (exists r.sysDescr and r.sysDescr =~ /(?i)aruba/) or
    (exists r.sysName and r.sysName =~ /(?i)aruba/)
  )  // ← Filter to only Aruba devices
  |> group(columns: ["sysName"])
  |> last()
  // ... rest of your query
```

Or filter after the map to only show Aruba groups:

```flux
  |> map(fn: (r) => ({
    Group: string(v: r.Group),
    Count: r.count,
    Status: string(v: if r.max_sev == 2 then "Red" else if r.max_sev == 1 then "Yellow" else "Green"),
    AvgUptimeDays: if r.count > 0 then r.sum_uptime / float(v: r.count) else 0.0
  }))
  |> filter(fn: (r) => r.Group =~ /(?i)aruba/)  // ← Filter to only "Aruba Switches" group
  |> keep(columns: ["Group", "Count", "Status", "AvgUptimeDays"])
```
