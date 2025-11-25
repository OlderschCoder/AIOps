# Complete Building Monitoring Query

## Problem
Current query only shows buildings with interfaces visible on core switches. Missing many buildings that have their own IP addresses.

## Complete Building List from Infrastructure

### Buildings with IP Addresses (SNMP Monitoring)
- **Administrative**: SW-A144-1 (192.168.2.201), SW-A144-2 (192.168.2.202), SWA-AA105 (192.168.2.199)
- **Academic**: SW-B101 (192.168.2.196), SW-COS109 (192.168.2.171)
- **Student Living**: SWA-SLC151 (192.168.2.175), SWA-SLG (192.168.2.179), SWA-SLJ (192.168.2.181), SWA-SLR (192.168.2.182), SWA-SLS (192.168.2.183), SWA-SLT (192.168.2.184)
- **Additional**: SW-M201-1 (192.168.2.205), SWA-SU121 (192.168.2.200), SW-SoftBallPB (192.168.2.204)

### Buildings Connected via Core Interfaces (No Direct IP)
- **Humanities**: Connected via Ethernet1/11, Ethernet1/13
- **Creative Arts (CAH)**: Connected via Ethernet1/14
- **Sharp Building**: Connected via Ethernet1/28
- **Epworth**: Connected via Ethernet1/45

---

## Complete Building Status Query

This query combines:
1. Buildings with direct SNMP monitoring (via sysUpTime)
2. Buildings connected via core switch interfaces

```flux
// Part 1: Buildings with direct SNMP monitoring (device uptime)
building_switches = from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) =>
    r._measurement == "snmp" and
    r._field == "sysUpTime"
  )
  |> filter(fn: (r) =>
    r.source == "192.168.2.196" or  // SW-B101-Aruba (B Building)
    r.source == "192.168.2.171" or  // SW-COS109-Aruba (Cosmetology)
    r.source == "192.168.2.175" or  // SWA-SLC151 (Student Living Center)
    r.source == "192.168.2.179" or  // SWA-SLG
    r.source == "192.168.2.181" or  // SWA-SLJ
    r.source == "192.168.2.182" or  // SWA-SLR
    r.source == "192.168.2.183" or  // SWA-SLS
    r.source == "192.168.2.184" or  // SWA-SLT
    r.source == "192.168.2.199" or  // SWA-AA105 (Hobble HR)
    r.source == "192.168.2.200" or  // SWA-SU121 (Student Union)
    r.source == "192.168.2.201" or  // SW-A144-1-aruba
    r.source == "192.168.2.202" or  // SW-A144-2-Aruba
    r.source == "192.168.2.204" or  // SW-SoftBallPB
    r.source == "192.168.2.205"     // SW-M201-1 (Maintenance)
  )
  |> group(columns: ["source", "sysName"])
  |> last()
  |> map(fn: (r) => {
    age_sec = float(v: uint(v: now()) - uint(v: r._time)) / 1000000000.0
    
    // Map IP/sysName to building name
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
      else r.sysName
    
    building_category = if building =~ /Hobble/ then "Administrative"
      else if building =~ /B Building|Cosmetology/ then "Academic"
      else if building =~ /Student Living|SLG|SLJ|SLR|SLS|SLT/ then "Student Living"
      else "Other"
    
    return {
      Building: building,
      Category: building_category,
      SwitchIP: r.source,
      SwitchName: r.sysName,
      MonitoringMethod: "SNMP",
      Status: if age_sec > 300.0 then "Offline"
        else if age_sec > 120.0 then "Warning"
        else "Online",
      StatusCode: if age_sec > 300.0 then 2.0
        else if age_sec > 120.0 then 1.0
        else 0.0,
      LastUpdateAge: age_sec
    }
  })

// Part 2: Buildings connected via core switch interfaces
core_interface_buildings = from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) =>
    r._measurement == "if_status_errors" and
    (r._field == "ifAdminStatus" or r._field == "ifOperStatus") and
    (r.source == "192.168.2.70" or r.source == "192.168.2.71")
  )
  |> filter(fn: (r) =>
    r.ifDescr =~ /^Ethernet1\/(11|13|14|28|30|40|41|42|45|46|52|53|54)$/
  )
  |> group(columns: ["source", "ifDescr", "_field"])
  |> last()
  |> pivot(rowKey: ["source", "ifDescr"], columnKey: ["_field"], valueColumn: "_value")
  |> filter(fn: (r) => exists r.ifAdminStatus and r.ifAdminStatus == 1)
  |> map(fn: (r) => {
    building = if r.source == "192.168.2.70" and (r.ifDescr == "Ethernet1/11" or r.ifDescr == "Ethernet1/13") then "Humanities"
      else if r.source == "192.168.2.71" and r.ifDescr == "Ethernet1/54" then "Humanities"
      else if r.ifDescr == "Ethernet1/14" then "Creative Arts (CAH)"
      else if r.source == "192.168.2.71" and r.ifDescr == "Ethernet1/53" then "Creative Arts (CAH)"
      else if r.ifDescr == "Ethernet1/28" then "Sharp Building"
      else if r.ifDescr == "Ethernet1/54" or (r.source == "192.168.2.71" and r.ifDescr == "Ethernet1/52") then "Tech Building T122"
      else if r.source == "192.168.2.70" and (r.ifDescr == "Ethernet1/40" or r.ifDescr == "Ethernet1/46") then "B Building (Boiler Room)"
      else if r.source == "192.168.2.71" and r.ifDescr == "Ethernet1/30" then "Student Living Center / Student Union"
      else if r.source == "192.168.2.71" and (r.ifDescr == "Ethernet1/40" or r.ifDescr == "Ethernet1/41" or r.ifDescr == "Ethernet1/42") then "Hobble Building"
      else if r.ifDescr == "Ethernet1/45" then "Epworth"
      else "Other"
    
    category = if building =~ /Hobble/ then "Administrative"
      else if building =~ /Student Living|Student Union/ then "Student Living"
      else if building =~ /Tech|B Building|Humanities|Creative Arts|Sharp|Epworth/ then "Academic"
      else "Other"
    
    return {
      Building: building,
      Category: category,
      SwitchIP: "N/A",
      SwitchName: if r.source == "192.168.2.70" then "Connected via Primary Core" else "Connected via Secondary Core",
      MonitoringMethod: "Core Interface",
      Interface: r.ifDescr,
      Status: if exists r.ifAdminStatus and exists r.ifOperStatus then
        if r.ifAdminStatus == 1 and r.ifOperStatus == 1 then "Online"
        else if r.ifAdminStatus == 1 and r.ifOperStatus != 1 then "Offline"
        else "Not Configured"
      else "Unknown",
      StatusCode: if exists r.ifAdminStatus and exists r.ifOperStatus then
        if r.ifAdminStatus == 1 and r.ifOperStatus == 1 then 0.0
        else if r.ifAdminStatus == 1 and r.ifOperStatus != 1 then 2.0
        else 1.0
      else 1.0,
      LastUpdateAge: 0.0
    }
  })
  |> filter(fn: (r) => r.Building != "Other")
  |> group(columns: ["Building"])
  |> reduce(
    identity: { Building: "", Category: "", Interfaces: "", WorstStatusCode: 0.0, WorstStatus: "Online" },
    fn: (r, accumulator) => {
      worst = if r.StatusCode > accumulator.WorstStatusCode then r.StatusCode else accumulator.WorstStatusCode
      status = if worst == 2.0 then "Offline"
        else if worst == 1.0 then "Not Configured"
        else "Online"
      
      return {
        Building: r.Building,
        Category: if accumulator.Category == "" then r.Category else accumulator.Category,
        Interfaces: if accumulator.Interfaces == "" then r.Interface else accumulator.Interfaces + ", " + r.Interface,
        WorstStatusCode: worst,
        WorstStatus: status
      }
    }
  )
  |> map(fn: (r) => ({
    Building: r.Building,
    Category: r.Category,
    SwitchIP: "N/A",
    SwitchName: "Connected via Core",
    MonitoringMethod: "Core Interface",
    Status: r.WorstStatus,
    StatusCode: r.WorstStatusCode,
    LastUpdateAge: 0.0
  }))

// Combine both datasets
union(tables: [building_switches, core_interface_buildings])
  |> group(columns: ["Building"])
  |> sort(columns: ["Category", "Building"])
```

---

## Simplified Version: All Buildings Status

For a cleaner view showing ALL buildings in one table:

```flux
// Get all building switches via SNMP
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
    
    // Map to building names with improved patterns
    sysNameLower = strings.toLower(v: r.sysName)
    
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
      // Pattern matching for building identification
      else if r.sysName =~ /-A[0-9]|-AA[0-9]/ then "Hobble Building (Server Room)"
      else if r.sysName =~ /healthcenter|health-center|health_center/i then "Student Health Center"
      else if r.sysName =~ /-T[0-9]|-TA[0-9]|-TB[0-9]|-TD[0-9]|-TT[0-9]/ then "Tech Building " + strings.toUpper(v: r.sysName)
      else if r.sysName =~ /H128|Humanities/i then "Humanities"
      else if r.sysName =~ /CAH|Creative/i then "Creative Arts"
      else if r.sysName =~ /SLG/i then "SLG Switch G"
      else if r.sysName =~ /SLJ/i then "Tech Dorms J"
      else if r.sysName =~ /SLR/i then "Tech Dorm SLR"
      else if r.sysName =~ /SLS/i then "Student Living SLS"
      else if r.sysName =~ /SLT/i then "Student Living SLT"
      else if r.sysName =~ /SLC/i then "Student Living Center"
      else r.sysName  // Use sysName if not mapped
    
    building_category = if building =~ /Hobble/ then "Administrative"
      else if building =~ /B Building|Cosmetology|Humanities|Creative Arts|Sharp|Epworth|Tech Building/ then "Academic"
      else if building =~ /Student Living|SLG|SLJ|SLR|SLS|SLT|SLC|Student Health/ then "Student Living"
      else "Other"
    
    return {
      Building: building,
      Category: building_category,
      SwitchIP: r.source,
      SwitchName: r.sysName,
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
  |> filter(fn: (r) => r.Building != "sw-aa144-A48" and r.Building != "sw-aa144-A24")  // Exclude core switches by name too
  |> keep(columns: ["Category", "Building", "SwitchIP", "SwitchName", "UptimeDays", "Status", "StatusCode", "LastUpdateAge"])
  |> group(columns: [])
  |> sort(columns: ["Category", "Building"])
```

---

## Complete Building List Summary

### Currently Missing from Your Query:
1. **Hobble A144-1** (192.168.2.201)
2. **Hobble A144-2** (192.168.2.202)
3. **Hobble HR AA105** (192.168.2.199)
4. **Student Living Center** (192.168.2.175)
5. **SLG Switch G** (192.168.2.179)
6. **Tech Dorms J** (192.168.2.181)
7. **Tech Dorm SLR** (192.168.2.182)
8. **Student Living SLS** (192.168.2.183)
9. **Student Living SLT** (192.168.2.184)
10. **Student Union** (192.168.2.200)
11. **Softball Field** (192.168.2.204)
12. **Maintenance** (192.168.2.205)
13. **Cosmetology** (192.168.2.171) - You have B Building but not Cosmetology

### Currently Showing (Core Interface Connections):
- B Building (Ethernet1/40, 1/46)
- Creative Arts (Ethernet1/14)
- Epworth (Ethernet1/45)
- Humanities (Ethernet1/11, 1/13)
- Sharp Building (Ethernet1/28)

---

## Recommended Approach

Create **TWO separate panels**:

1. **Panel 1: Building Switches (Direct SNMP Monitoring)**
   - Shows all buildings with their own IP addresses
   - Uses sysUpTime to determine if device is online

2. **Panel 2: Core Interface Connections**
   - Shows buildings connected via core switch interfaces
   - Uses interface status (ifOperStatus)

Then combine them in a single dashboard for complete visibility.

