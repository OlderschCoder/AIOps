# Fixed Building Status Query - No Syntax Errors

## Problem
The error `invalid character '\x1f'` is caused by:
1. Regex `/i` flag (not supported in Flux - regex is case-sensitive)
2. Missing string type conversions
3. Need to use `strings.containsStr` instead of case-insensitive regex

## Fixed Query (Use This One)

```flux
import "strings"

from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) =>
    r._measurement == "snmp" and
    r._field == "sysUpTime"
  )
  |> filter(fn: (r) =>
    r.source != "192.168.2.70" and
    r.source != "192.168.2.71" and
    r.source != "192.168.2.72" and
    r.source != "192.168.2.73" and
    r.source != "192.168.1.1"
  )
  |> group(columns: ["source", "sysName"])
  |> last()
  |> map(fn: (r) => {
    age_sec = float(v: uint(v: now()) - uint(v: r._time)) / 1000000000.0
    uptime_days = float(v: r._value) / 8640000.0
    sysNameStr = string(v: r.sysName)
    sysNameLower = strings.toLower(v: sysNameStr)
    sysNameUpper = strings.toUpper(v: sysNameStr)
    
    // Building name mapping
    building = if r.source == "192.168.2.196" then "B Building (Boiler Room)"
      else if r.source == "192.168.2.171" then "Cosmetology"
      else if r.source == "192.168.2.175" then "Student Living Center"
      else if r.source == "192.168.2.179" then "SLG Switch G"
      else if r.source == "192.168.2.181" then "Tech Dorms J"
      else if r.source == "192.168.2.182" then "Tech Dorm SLR"
      else if r.source == "192.168.2.183" then "Student Living SLS"
      else if r.source == "192.168.2.184" then "Student Living SLT"
      else if r.source == "192.168.2.199" then "Hobble HR AA105"
      else if r.source == "192.168.2.200" then "Student Union"
      else if r.source == "192.168.2.201" then "Hobble A144-1"
      else if r.source == "192.168.2.202" then "Hobble A144-2"
      else if r.source == "192.168.2.204" then "Softball Field"
      else if r.source == "192.168.2.205" then "Maintenance"
      // Pattern: Switches with -A or -AA are Hobble server room
      else if sysNameStr =~ /-A[0-9]/ or sysNameStr =~ /-AA[0-9]/ then "Hobble Building (Server Room)"
      // Pattern: Health center (case-insensitive using toLower)
      else if strings.containsStr(v: sysNameLower, substr: "healthcenter") or strings.containsStr(v: sysNameLower, substr: "health-center") or strings.containsStr(v: sysNameLower, substr: "health_center") then "Student Health Center"
      // Pattern: Switches with -T are tech buildings
      else if sysNameStr =~ /-T[0-9]/ or sysNameStr =~ /-TA[0-9]/ or sysNameStr =~ /-TB[0-9]/ or sysNameStr =~ /-TD[0-9]/ or sysNameStr =~ /-TT[0-9]/ then "Tech Building " + sysNameUpper
      // Other patterns (case-insensitive using containsStr)
      else if strings.containsStr(v: sysNameLower, substr: "h128") or strings.containsStr(v: sysNameLower, substr: "humanities") then "Humanities"
      else if strings.containsStr(v: sysNameLower, substr: "cah") or strings.containsStr(v: sysNameLower, substr: "creative") then "Creative Arts"
      else if strings.containsStr(v: sysNameUpper, substr: "SLG") then "SLG Switch G"
      else if strings.containsStr(v: sysNameUpper, substr: "SLJ") then "Tech Dorms J"
      else if strings.containsStr(v: sysNameUpper, substr: "SLR") then "Tech Dorm SLR"
      else if strings.containsStr(v: sysNameUpper, substr: "SLS") then "Student Living SLS"
      else if strings.containsStr(v: sysNameUpper, substr: "SLT") then "Student Living SLT"
      else if strings.containsStr(v: sysNameUpper, substr: "SLC") then "Student Living Center"
      // Default
      else sysNameStr
    
    // Category mapping (using containsStr for case-insensitive)
    building_category = if strings.containsStr(v: building, substr: "Hobble") then "Administrative"
      else if strings.containsStr(v: building, substr: "B Building") or strings.containsStr(v: building, substr: "Cosmetology") or strings.containsStr(v: building, substr: "Humanities") or strings.containsStr(v: building, substr: "Creative Arts") or strings.containsStr(v: building, substr: "Sharp") or strings.containsStr(v: building, substr: "Epworth") or strings.containsStr(v: building, substr: "Tech Building") then "Academic"
      else if strings.containsStr(v: building, substr: "Student Living") or strings.containsStr(v: building, substr: "SLG") or strings.containsStr(v: building, substr: "SLJ") or strings.containsStr(v: building, substr: "SLR") or strings.containsStr(v: building, substr: "SLS") or strings.containsStr(v: building, substr: "SLT") or strings.containsStr(v: building, substr: "SLC") or strings.containsStr(v: building, substr: "Student Health") then "Student Living"
      else "Other"
    
    return {
      Category: building_category,
      Building: building,
      SwitchIP: r.source,
      SwitchName: sysNameStr,
      UptimeDays: uptime_days,
      Status: if age_sec > 300.0 then "Offline"
        else if age_sec > 120.0 then "Warning"
        else "Online",
      StatusCode: if age_sec > 300.0 then 2.0
        else if age_sec > 120.0 then 1.0
        else 0.0,
      LastUpdateAge: age_sec
    }
  })
  |> filter(fn: (r) => 
    r.SwitchName != "sw-aa144-A48" and 
    r.SwitchName != "sw-aa144-A24" and
    r.Building != "sw-aa144-A48" and 
    r.Building != "sw-aa144-A24"
  )
  |> keep(columns: ["Category", "Building", "SwitchIP", "SwitchName", "UptimeDays", "Status", "StatusCode", "LastUpdateAge"])
  |> group(columns: [])
  |> sort(columns: ["Category", "Building"])
```

## Key Fixes

1. ✅ **Removed `/i` regex flags** - Flux doesn't support case-insensitive regex flags
2. ✅ **Added explicit string conversions** - `string(v: r.sysName)` before using string functions
3. ✅ **Used `strings.containsStr`** for case-insensitive matching instead of regex
4. ✅ **Fixed regex patterns** - Split complex patterns into multiple conditions with `or`
5. ✅ **Proper string handling** - Convert to string first, then use string functions

## Alternative: Simpler Version (If Above Still Has Issues)

If you still get errors, try this simpler version without complex string operations:

```flux
from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) =>
    r._measurement == "snmp" and
    r._field == "sysUpTime"
  )
  |> filter(fn: (r) =>
    r.source != "192.168.2.70" and
    r.source != "192.168.2.71" and
    r.source != "192.168.2.72" and
    r.source != "192.168.2.73" and
    r.source != "192.168.1.1"
  )
  |> group(columns: ["source", "sysName"])
  |> last()
  |> map(fn: (r) => {
    age_sec = float(v: uint(v: now()) - uint(v: r._time)) / 1000000000.0
    uptime_days = float(v: r._value) / 8640000.0
    sysNameStr = string(v: r.sysName)
    
    // Building mapping - check IP first, then patterns
    building = if r.source == "192.168.2.196" then "B Building (Boiler Room)"
      else if r.source == "192.168.2.171" then "Cosmetology"
      else if r.source == "192.168.2.175" then "Student Living Center"
      else if r.source == "192.168.2.179" then "SLG Switch G"
      else if r.source == "192.168.2.181" then "Tech Dorms J"
      else if r.source == "192.168.2.182" then "Tech Dorm SLR"
      else if r.source == "192.168.2.183" then "Student Living SLS"
      else if r.source == "192.168.2.184" then "Student Living SLT"
      else if r.source == "192.168.2.199" then "Hobble HR AA105"
      else if r.source == "192.168.2.200" then "Student Union"
      else if r.source == "192.168.2.201" then "Hobble A144-1"
      else if r.source == "192.168.2.202" then "Hobble A144-2"
      else if r.source == "192.168.2.204" then "Softball Field"
      else if r.source == "192.168.2.205" then "Maintenance"
      else if sysNameStr =~ /-A[0-9]/ then "Hobble Building (Server Room)"
      else if sysNameStr =~ /-AA[0-9]/ then "Hobble Building (Server Room)"
      else if sysNameStr =~ /-T[0-9]/ then "Tech Building " + sysNameStr
      else if sysNameStr =~ /-TA[0-9]/ then "Tech Building " + sysNameStr
      else if sysNameStr =~ /-TB[0-9]/ then "Tech Building " + sysNameStr
      else if sysNameStr =~ /-TD[0-9]/ then "Tech Building " + sysNameStr
      else if sysNameStr =~ /-TT[0-9]/ then "Tech Building " + sysNameStr
      else sysNameStr
    
    // Simple category mapping
    building_category = if building =~ /Hobble/ then "Administrative"
      else if building =~ /Tech Building|B Building|Cosmetology/ then "Academic"
      else if building =~ /Student Living|SLG|SLJ|SLR|SLS|SLT|SLC/ then "Student Living"
      else "Other"
    
    return {
      Category: building_category,
      Building: building,
      SwitchIP: r.source,
      SwitchName: sysNameStr,
      UptimeDays: uptime_days,
      Status: if age_sec > 300.0 then "Offline"
        else if age_sec > 120.0 then "Warning"
        else "Online",
      StatusCode: if age_sec > 300.0 then 2.0
        else if age_sec > 120.0 then 1.0
        else 0.0,
      LastUpdateAge: age_sec
    }
  })
  |> filter(fn: (r) => 
    r.SwitchName != "sw-aa144-A48" and 
    r.SwitchName != "sw-aa144-A24"
  )
  |> keep(columns: ["Category", "Building", "SwitchIP", "SwitchName", "UptimeDays", "Status", "StatusCode", "LastUpdateAge"])
  |> group(columns: [])
  |> sort(columns: ["Category", "Building"])
```

This simpler version avoids complex string operations and should work reliably.


