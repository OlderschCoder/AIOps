# Complete Building Status Query - Improved

## Updated Query with Better Building Name Mapping

```flux
import "strings"

from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) =>
    r._measurement == "snmp" and
    r._field == "sysUpTime"
  )
  |> filter(fn: (r) =>
    // Exclude core switches
    r.source != "192.168.2.70" and
    r.source != "192.168.2.71" and
    r.source != "192.168.2.72" and
    r.source != "192.168.2.73" and
    // Exclude FortiGate
    r.source != "192.168.1.1"
  )
  |> group(columns: ["source", "sysName"])
  |> last()
  |> map(fn: (r) => {
    age_sec = float(v: uint(v: now()) - uint(v: r._time)) / 1000000000.0
    uptime_days = float(v: r._value) / 8640000.0
    
    sysNameLower = strings.toLower(v: r.sysName)
    sysNameUpper = strings.toUpper(v: r.sysName)
    
    // Building name mapping with pattern recognition
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
      // Pattern: Health Center switches
      else if sysNameLower =~ /healthcenter|health-center|health_center/ then "Student Health Center"
      // Pattern: Switches with -A or -AA are Hobble server room connections
      else if r.sysName =~ /-A[0-9]/ or r.sysName =~ /-AA[0-9]/ then "Hobble Building (Server Room)"
      // Pattern: Tech building switches
      else if r.sysName =~ /-T[0-9]/ or r.sysName =~ /-TA[0-9]/ or r.sysName =~ /-TB[0-9]/ or r.sysName =~ /-TD[0-9]/ or r.sysName =~ /-TT[0-9]/ then "Tech Building " + sysNameUpper
      // Default: use sysName
      else string(v: r.sysName)
    
    // Category mapping
    building_category = if building =~ /Hobble/ then "Administrative"
      else if building =~ /Tech Building|B Building|Cosmetology|Humanities|Creative Arts|Sharp|Epworth/ then "Academic"
      else if building =~ /Student Living|SLG|SLJ|SLR|SLS|SLT|SLC|Student Union|Student Health/ then "Student Living"
      else "Other"
    
    return {
      Category: building_category,
      Building: building,
      SwitchIP: r.source,
      SwitchName: string(v: r.sysName),
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
    // Exclude core switches by name
    r.SwitchName != "sw-aa144-A48" and 
    r.SwitchName != "sw-aa144-A24" and
    r.Building != "sw-aa144-A48" and 
    r.Building != "sw-aa144-A24"
  )
  |> keep(columns: ["Category", "Building", "SwitchIP", "SwitchName", "UptimeDays", "Status", "StatusCode", "LastUpdateAge"])
  |> group(columns: [])
  |> sort(columns: ["Category", "Building"])
```

## Pattern Matching Rules

### Hobble Building Switches
- **Pattern**: `-A[0-9]` or `-AA[0-9]` (e.g., `swa-a144`, `swa-aa105`)
- **Category**: Administrative
- **Description**: Server room to server room connections within Hobble building

### Tech Building Switches
- **Pattern**: `-T[0-9]`, `-TA[0-9]`, `-TB[0-9]`, `-TD[0-9]`, `-TT[0-9]` (e.g., `swa-t122`, `swa-ta107`, `swa-tb141`)
- **Category**: Academic
- **Description**: Tech/technical building switches

### Student Health Center
- **Pattern**: Contains `healthcenter`, `health-center`, or `health_center` (case-insensitive)
- **Category**: Student Living
- **Description**: Student Health Center switches

### Student Living Switches
- **Pattern**: Contains `SLG`, `SLJ`, `SLR`, `SLS`, `SLT`, `SLC`
- **Category**: Student Living
- **Description**: Student living/dormitory switches

## Expected Output Categories

### Administrative
- Hobble Building (Server Room) - switches with -A or -AA pattern
- Hobble A144-1
- Hobble A144-2
- Hobble HR AA105

### Academic
- B Building (Boiler Room)
- Cosmetology
- Tech Building SWA-T122
- Tech Building SWA-TA107
- Tech Building SWA-TB141
- Tech Building SWA-TD201
- Tech Building SWA-TT103
- Humanities (if has IP)
- Creative Arts (if has IP)
- Sharp Building (if has IP)
- Epworth (if has IP)

### Student Living
- Student Living Center
- SLG Switch G
- Tech Dorms J
- Tech Dorm SLR
- Student Living SLS
- Student Living SLT
- Student Health Center (if exists)

### Other
- Student Union
- Softball Field
- Maintenance
- Any unmapped switches

## Improvements Made

1. ✅ Added pattern matching for Hobble switches (`-A` and `-AA`)
2. ✅ Added pattern matching for tech buildings (`-T` variants)
3. ✅ Added pattern matching for health center
4. ✅ Improved category assignment (tech buildings → Academic)
5. ✅ Better building name formatting for tech buildings

This should now correctly categorize all your switches!

