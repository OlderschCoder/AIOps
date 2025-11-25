# Approach for Creating Building Connectivity Visualizations

## Strategy Overview

### Phase 1: Foundation (Start Here)
Build basic building connectivity views using existing + new data

### Phase 2: Advanced Monitoring
Add OSPF, redundancy, and topology visualizations

### Phase 3: Integration & Alerts
Combine everything into comprehensive dashboards with alerting

---

## Phase 1: Foundation Visualizations

### 1. Complete Building Status Dashboard (CRITICAL - Start Here)

**Note**: This shows ALL buildings - both those with direct SNMP monitoring and those connected via core interfaces.

**Panel Type**: Table

**Query**: See `ALL_BUILDINGS_MONITORING_QUERY.md` for complete query combining:
- Buildings with IP addresses (SNMP monitoring)
- Buildings connected via core switch interfaces

---

### 1a. Building Link Status Matrix (Core Interface Connections)

**Why First**: Shows real-time up/down status - most important view

**Panel Type**: Table

**Query Approach**:
```flux
// Step 1: Get interface status for core switches (192.168.2.70, 192.168.2.71)
// Step 2: Filter to building-facing interfaces (Ethernet1/11, 1/13, 1/14, etc.)
// Step 3: Filter to only configured interfaces (ifAdminStatus == 1) - this removes interfaces that don't exist on each switch
// Step 4: Map interfaces to building names
// Step 5: Display status with color coding

from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) =>
    r._measurement == "if_status_errors" and
    (r._field == "ifAdminStatus" or r._field == "ifOperStatus") and
    (r.source == "192.168.2.70" or r.source == "192.168.2.71")
  )
  |> filter(fn: (r) => 
    r.ifDescr =~ /^Ethernet1\/(11|13|14|28|40|46|45)$/
  )
  |> group(columns: ["source", "ifDescr", "_field"])
  |> last()
  |> pivot(rowKey: ["source", "ifDescr"], columnKey: ["_field"], valueColumn: "_value")
  // Filter to only show interfaces that are actually configured (exist on the switch)
  |> filter(fn: (r) => exists r.ifAdminStatus and r.ifAdminStatus == 1)
  |> map(fn: (r) => {
    building = if r.ifDescr == "Ethernet1/11" or r.ifDescr == "Ethernet1/13" then "Humanities"
      else if r.ifDescr == "Ethernet1/14" then "Creative Arts"
      else if r.ifDescr == "Ethernet1/28" then "Sharp Building"
      else if r.ifDescr == "Ethernet1/40" or r.ifDescr == "Ethernet1/46" then "B Building"
      else if r.ifDescr == "Ethernet1/45" then "Epworth"
      else "Other"
    
    return {
      Building: building,
      Core: r.source,
      Interface: r.ifDescr,
      Status: if exists r.ifAdminStatus and exists r.ifOperStatus then
        if r.ifAdminStatus == 1 and r.ifOperStatus == 1 then "Up"
        else if r.ifAdminStatus == 1 and r.ifOperStatus != 1 then "Down"
        else "Not Configured"
      else "Unknown",
      StatusCode: if exists r.ifAdminStatus and exists r.ifOperStatus then
        if r.ifAdminStatus == 1 and r.ifOperStatus == 1 then 1.0
        else if r.ifAdminStatus == 1 and r.ifOperStatus != 1 then 2.0
        else 0.0
      else 0.0
    }
  })
  |> group(columns: ["Building"])
  |> reduce(
    identity: { Building: "", Interfaces: "", Cores: "", WorstStatusCode: 1.0, WorstStatus: "Up" },
    fn: (r, accumulator) => {
      worst = if r.StatusCode > accumulator.WorstStatusCode then r.StatusCode else accumulator.WorstStatusCode
      status = if worst == 2.0 then "Down"
        else if worst == 1.0 then "Up"
        else "Not Configured"
      
      return {
        Building: r.Building,
        Interfaces: if accumulator.Interfaces == "" then r.Interface else accumulator.Interfaces + ", " + r.Interface,
        Cores: if accumulator.Cores == "" then r.Core else accumulator.Cores + ", " + r.Core,
        WorstStatusCode: worst,
        WorstStatus: status
      }
    }
  )
  |> map(fn: (r) => ({
    Building: r.Building,
    Interfaces: r.Interfaces,
    Cores: r.Cores,
    Status: r.WorstStatus,
    StatusCode: r.WorstStatusCode
  }))
  |> sort(columns: ["Building"])
```

**Alternative: Show One Row Per Building (Aggregate Status)**:
```flux
// If a building has multiple interfaces, show the worst status
from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) =>
    r._measurement == "if_status_errors" and
    (r._field == "ifAdminStatus" or r._field == "ifOperStatus") and
    (r.source == "192.168.2.70" or r.source == "192.168.2.71")
  )
  |> filter(fn: (r) => 
    r.ifDescr =~ /^Ethernet1\/(11|13|14|28|40|46|45)$/
  )
  |> group(columns: ["source", "ifDescr", "_field"])
  |> last()
  |> pivot(rowKey: ["source", "ifDescr"], columnKey: ["_field"], valueColumn: "_value")
  |> filter(fn: (r) => exists r.ifAdminStatus and r.ifAdminStatus == 1)
  |> map(fn: (r) => ({
    Core: r.source,
    Interface: r.ifDescr,
    Building: if r.ifDescr == "Ethernet1/11" or r.ifDescr == "Ethernet1/13" then "Humanities"
      else if r.ifDescr == "Ethernet1/14" then "Creative Arts"
      else if r.ifDescr == "Ethernet1/28" then "Sharp Building"
      else if r.ifDescr == "Ethernet1/40" or r.ifDescr == "Ethernet1/46" then "B Building"
      else if r.ifDescr == "Ethernet1/45" then "Epworth"
      else "Other",
    StatusCode: if exists r.ifAdminStatus and exists r.ifOperStatus then
      if r.ifAdminStatus == 1 and r.ifOperStatus == 1 then 1.0
      else if r.ifAdminStatus == 1 and r.ifOperStatus != 1 then 2.0
      else 0.0
    else 0.0
  }))
  |> group(columns: ["Building"])
  |> reduce(
    identity: { Building: "", Interfaces: "", WorstStatus: 1.0, Status: "" },
    fn: (r, accumulator) => ({
      Building: r.Building,
      Interfaces: if accumulator.Interfaces == "" then r.Interface else accumulator.Interfaces + ", " + r.Interface,
      WorstStatus: if r.StatusCode > accumulator.WorstStatus then r.StatusCode else accumulator.WorstStatus,
      Status: if r.StatusCode > accumulator.WorstStatus then 
        (if r.StatusCode == 2.0 then "Down" else if r.StatusCode == 1.0 then "Up" else "Not Configured")
      else accumulator.Status
    })
  )
  |> map(fn: (r) => ({
    Building: r.Building,
    Interfaces: r.Interfaces,
    Status: r.Status,
    StatusCode: r.WorstStatus
  }))
  |> sort(columns: ["Building"])
```

**Panel Configuration**:
- **Visualization**: Table
- **Field Overrides**: 
  - StatusCode: Use "Color text" mode with thresholds (Green: 1, Yellow: 0.5, Red: 2)
  - Status: Text field
- **Transformations**: Use "Organize fields" to set column order

**Alternative: Use LLDP for Auto-Mapping** (Once LLDP data is available):
```flux
// Use LLDP to automatically discover which interfaces connect to which buildings
from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) => r._measurement == "lldp_remote")
  |> filter(fn: (r) => r.source == "192.168.2.70" or r.source == "192.168.2.71")
  |> group(columns: ["source", "lldpRemLocalPortNum", "lldpRemSysName"])
  |> last()
  |> map(fn: (r) => ({
    Core: r.source,
    Interface: r.lldpRemLocalPortNum,
    Building: r.lldpRemSysName
  }))
  // Then join with interface status
```

---

### 2. Building Uptime Dashboard

**Why Second**: Shows device health per building - critical for availability

**Panel Type**: Table + Stat Cards

**Query Approach**:
```flux
// Get uptime for all building switches, map to building names
from(bucket: "telegraf")
  |> range(start: -30m)
  |> filter(fn: (r) =>
    r._measurement == "snmp" and
    r._field == "sysUpTime"
  )
  |> group(columns: ["source", "sysName"])
  |> last()
  |> map(fn: (r) => {
    age_sec = float(v: uint(v: now()) - uint(v: r._time)) / 1000000000.0
    uptime_days = float(v: r._value) / 8640000.0
    
    // Map IP/sysName to building name
    building = if r.source == "192.168.2.196" then "B Building (Boiler Room)"
      else if r.source == "192.168.2.171" then "Cosmetology"
      else if r.source == "192.168.2.175" then "Student Living Center"
      else if r.source == "192.168.2.199" then "Hobble HR AA105"
      else if r.source == "192.168.2.201" then "Hobble A144-1"
      else if r.source == "192.168.2.202" then "Hobble A144-2"
      else if r.sysName =~ /SLG/ then "SLG Switch G"
      else if r.sysName =~ /SLJ/ then "Tech Dorms J"
      else if r.sysName =~ /SLR/ then "Tech Dorm SLR"
      else if r.sysName =~ /SLS/ then "Student Living SLS"
      else if r.sysName =~ /SLT/ then "Student Living SLT"
      else if r.sysName =~ /SU121/ then "Student Union"
      else if r.sysName =~ /SoftBall/ then "Softball Field"
      else if r.sysName =~ /M201/ then "Maintenance"
      else r.sysName
    
    building_category = if building =~ /Hobble|AA105/ then "Administrative"
      else if building =~ /B Building|Cosmetology|Humanities|Creative Arts|Sharp|Epworth/ then "Academic"
      else if building =~ /Student Living|SLG|SLJ|SLR|SLS|SLT/ then "Student Living"
      else "Other"
    
    return {
      Building: building,
      Category: building_category,
      SwitchIP: r.source,
      SwitchName: r.sysName,
      UptimeDays: uptime_days,
      LastUpdateAge: age_sec,
      Status: if age_sec > 300.0 then "Stale"
        else if age_sec > 120.0 then "Warning"
        else "Current"
    }
  })
  |> filter(fn: (r) => r.Building != "sw-aa144-A48" and r.Building != "sw-aa144-A24")  // Exclude core switches
  |> keep(columns: ["Category", "Building", "SwitchIP", "UptimeDays", "LastUpdateAge", "Status"])
  |> group(columns: [])
  |> sort(columns: ["Category", "Building"])
```

**Panel Configuration**:
- Create **Stat Cards** for each building category (Administrative, Academic, Student Living)
- Use **Table** for detailed view
- Color thresholds on `LastUpdateAge`: Green (<120s), Yellow (120-300s), Red (>300s)

---

### 3. Building-to-Building Throughput Per Link

**Why Third**: Shows actual link utilization - critical for capacity planning

**Panel Type**: Time Series Graph + Table

**Query Approach - Option 1: Core Interface Connections Only**
```flux
// Get throughput for building-facing interfaces on core switches
// (For buildings connected via core interfaces: Humanities, Creative Arts, Sharp, Epworth, B Building)
from(bucket: "telegraf")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) =>
    r._measurement == "interface" and
    (r._field == "ifHCInOctets" or r._field == "ifHCOutOctets") and
    r.source == "192.168.2.70"  // Primary core only
  )
  |> filter(fn: (r) => 
    r.ifName =~ /^Ethernet1\/(11|13|14|28|40|46|45)$/
  )
  |> derivative(unit: 1s, nonNegative: true)
  |> map(fn: (r) => ({
    r with
    _value: r._value * 8.0,  // Convert to bits per second
    direction: if r._field == "ifHCInOctets" then "In" else "Out",
    Building: if r.ifName == "Ethernet1/11" or r.ifName == "Ethernet1/13" then "Humanities"
      else if r.ifName == "Ethernet1/14" then "Creative Arts (CAH)"
      else if r.ifName == "Ethernet1/28" then "Sharp Building"
      else if r.ifName == "Ethernet1/40" or r.ifName == "Ethernet1/46" then "B Building (Boiler Room)"
      else if r.ifName == "Ethernet1/45" then "Epworth"
      else "Other"
  }))
  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
  |> group(columns: ["Building", "ifName", "direction"])
```

**Query Approach - Option 2: All Building Switches (Direct Monitoring)**
```flux
import "strings"

// Get throughput from building switches themselves
// (For buildings with their own IP addresses - aggregates all interfaces per building)
from(bucket: "telegraf")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) =>
    r._measurement == "interface" and
    (r._field == "ifHCInOctets" or r._field == "ifHCOutOctets")
  )
  |> filter(fn: (r) =>
    // Exclude core switches
    r.source != "192.168.2.70" and
    r.source != "192.168.2.71" and
    r.source != "192.168.2.72" and
    r.source != "192.168.2.73" and
    r.source != "192.168.1.1"
  )
  |> derivative(unit: 1s, nonNegative: true)
  |> map(fn: (r) => ({
    r with
    _value: r._value * 8.0,  // Convert to bits per second
    direction: if r._field == "ifHCInOctets" then "In" else "Out",
    Building: if r.source == "192.168.2.196" then "B Building (Boiler Room)"
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
      else if string(v: r.sysName) =~ /-A[0-9]/ or string(v: r.sysName) =~ /-AA[0-9]/ then "Hobble Building (Server Room)"
      else if string(v: r.sysName) =~ /-T[0-9]/ or string(v: r.sysName) =~ /-TA[0-9]/ or string(v: r.sysName) =~ /-TB[0-9]/ or string(v: r.sysName) =~ /-TD[0-9]/ or string(v: r.sysName) =~ /-TT[0-9]/ then "Tech Building " + strings.toUpper(v: string(v: r.sysName))
      else "Other"
  }))
  |> filter(fn: (r) => r.Building != "Other")  // Filter out unmapped switches
  |> aggregateWindow(every: v.windowPeriod, fn: sum, createEmpty: false)  // Sum all interfaces per building
  |> group(columns: ["Building", "direction"])
```

**Query Approach - Option 3: Combined (All Buildings)**
```flux
import "strings"

// Combine core interface throughput + building switch throughput
core_ifaces = from(bucket: "telegraf")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) =>
    r._measurement == "interface" and
    (r._field == "ifHCInOctets" or r._field == "ifHCOutOctets") and
    r.source == "192.168.2.70"
  )
  |> filter(fn: (r) => r.ifName =~ /^Ethernet1\/(11|13|14|28|40|46|45)$/)
  |> derivative(unit: 1s, nonNegative: true)
  |> map(fn: (r) => ({
    r with
    _value: r._value * 8.0,
    direction: if r._field == "ifHCInOctets" then "In" else "Out",
    Building: if r.ifName == "Ethernet1/11" or r.ifName == "Ethernet1/13" then "Humanities"
      else if r.ifName == "Ethernet1/14" then "Creative Arts (CAH)"
      else if r.ifName == "Ethernet1/28" then "Sharp Building"
      else if r.ifName == "Ethernet1/40" or r.ifName == "Ethernet1/46" then "B Building (Boiler Room)"
      else if r.ifName == "Ethernet1/45" then "Epworth"
      else "Other"
  }))
  |> filter(fn: (r) => r.Building != "Other")
  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
  |> group(columns: ["Building", "direction"])

building_switches = from(bucket: "telegraf")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) =>
    r._measurement == "interface" and
    (r._field == "ifHCInOctets" or r._field == "ifHCOutOctets") and
    r.source != "192.168.2.70" and
    r.source != "192.168.2.71" and
    r.source != "192.168.2.72" and
    r.source != "192.168.2.73" and
    r.source != "192.168.1.1"
  )
  |> derivative(unit: 1s, nonNegative: true)
  |> map(fn: (r) => ({
    r with
    _value: r._value * 8.0,
    direction: if r._field == "ifHCInOctets" then "In" else "Out",
    Building: if r.source == "192.168.2.196" then "B Building (Boiler Room)"
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
      else if string(v: r.sysName) =~ /-A[0-9]/ or string(v: r.sysName) =~ /-AA[0-9]/ then "Hobble Building (Server Room)"
      else if string(v: r.sysName) =~ /-T[0-9]/ or string(v: r.sysName) =~ /-TA[0-9]/ or string(v: r.sysName) =~ /-TB[0-9]/ or string(v: r.sysName) =~ /-TD[0-9]/ or string(v: r.sysName) =~ /-TT[0-9]/ then "Tech Building " + strings.toUpper(v: string(v: r.sysName))
      else "Other"
  }))
  |> filter(fn: (r) => r.Building != "Other")
  |> aggregateWindow(every: v.windowPeriod, fn: sum, createEmpty: false)
  |> group(columns: ["Building", "direction"])

union(tables: [core_ifaces, building_switches])
  |> group(columns: ["Building", "direction", "_time"])
  |> sum(column: "_value")
  |> group(columns: ["Building", "direction"])
```

**For Utilization % Table (Core Interfaces Only)**:
```flux
// Join throughput with interface speed to get utilization %
throughput = from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) =>
    r._measurement == "interface" and
    (r._field == "ifHCInOctets" or r._field == "ifHCOutOctets") and
    r.source == "192.168.2.70"  // Primary core only
  )
  |> filter(fn: (r) => r.ifName =~ /^Ethernet1\/(11|13|14|28|40|46|45)$/)
  |> derivative(unit: 1s, nonNegative: true)
  |> map(fn: (r) => ({ r with _value: r._value * 8.0 }))
  |> group(columns: ["source", "ifName", "_field"])
  |> last()
  |> pivot(rowKey: ["source", "ifName"], columnKey: ["_field"], valueColumn: "_value")
  |> map(fn: (r) => ({
    source: r.source,
    ifName: r.ifName,
    current_bps: max(x: if exists r.ifHCInOctets then r.ifHCInOctets else 0.0, 
                     y: if exists r.ifHCOutOctets then r.ifHCOutOctets else 0.0)
  }))

speed = from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) =>
    r._measurement == "interface" and
    r._field == "ifHighSpeed" and
    r.source == "192.168.2.70"  // Primary core only
  )
  |> filter(fn: (r) => r.ifName =~ /^Ethernet1\/(11|13|14|28|40|46|45)$/)
  |> group(columns: ["source", "ifName"])
  |> last()
  |> map(fn: (r) => ({
    source: r.source,
    ifName: r.ifName,
    max_speed_mbps: float(v: r._value),
    max_speed_bps: float(v: r._value) * 1000000.0
  }))

join(tables: {t: throughput, s: speed}, on: ["source", "ifName"])
  |> map(fn: (r) => ({
    Building: if r.ifName == "Ethernet1/11" or r.ifName == "Ethernet1/13" then "Humanities"
      else if r.ifName == "Ethernet1/14" then "Creative Arts (CAH)"
      else if r.ifName == "Ethernet1/28" then "Sharp Building"
      else if r.ifName == "Ethernet1/40" or r.ifName == "Ethernet1/46" then "B Building (Boiler Room)"
      else if r.ifName == "Ethernet1/45" then "Epworth"
      else "Other",
    Interface: r.ifName,
    CurrentBps: r.current_bps,
    MaxSpeedMbps: r.max_speed_mbps,
    UtilizationPct: if r.max_speed_bps > 0.0 then (r.current_bps / r.max_speed_bps) * 100.0 else 0.0
  }))
  |> filter(fn: (r) => r.Building != "Other")
  |> keep(columns: ["Building", "Interface", "CurrentBps", "MaxSpeedMbps", "UtilizationPct"])
  |> group(columns: [])
  |> sort(columns: ["UtilizationPct"], desc: true)
```

**Panel Configuration**:
- **Time Series**: Show throughput over time, grouped by building
- **Table**: Show current utilization with color coding (Green <50%, Yellow 50-80%, Red >80%)

---

### 4. Building Latency Monitoring

**Why Fourth**: Shows connectivity quality between core and buildings

**Panel Type**: Time Series + Stat Cards

**Query Approach**:
```flux
// Get ping latency to building switches
from(bucket: "telegraf")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => 
    r._measurement == "ping" and
    r._field == "average_response_ms" and
    r.monitoring_type == "building_connectivity"
  )
  |> map(fn: (r) => ({
    r with
    Building: if r.url == "192.168.2.196" then "B Building"
      else if r.url == "192.168.2.171" then "Cosmetology"
      else if r.url == "192.168.2.175" then "Student Living Center"
      else if r.url == "192.168.2.199" then "Hobble HR AA105"
      else if r.url == "192.168.2.201" then "Hobble A144-1"
      else if r.url == "192.168.2.202" then "Hobble A144-2"
      else if r.url == "192.168.2.179" then "SLG"
      else if r.url == "192.168.2.181" then "SLJ"
      else if r.url == "192.168.2.182" then "SLR"
      else if r.url == "192.168.2.183" then "SLS"
      else if r.url == "192.168.2.184" then "SLT"
      else if r.url == "192.168.2.200" then "Student Union"
      else if r.url == "192.168.2.204" then "Softball Field"
      else if r.url == "192.168.2.205" then "Maintenance"
      else r.url
  }))
  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
  |> group(columns: ["Building", "url"])
```

**For Packet Loss**:
```flux
from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) => 
    r._measurement == "ping" and
    r._field == "percent_packet_loss" and
    r.monitoring_type == "building_connectivity"
  )
  |> group(columns: ["url"])
  |> last()
  // Map to building names same as above
```

**Panel Configuration**:
- **Time Series**: Latency over time
- **Stat Cards**: Current latency per building
- **Thresholds**: Green (<5ms), Yellow (5-10ms), Red (>10ms)

---

## Phase 2: Advanced Monitoring

### 5. OSPF Neighbor Status

**Query Approach**:
```flux
from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) => 
    r._measurement == "ospf_neighbor" and
    r._field == "ospfNbrState"
  )
  |> group(columns: ["source", "ospfNbrIpAddr", "ospfNbrRtrId"])
  |> last()
  |> map(fn: (r) => ({
    Core: r.source,
    NeighborIP: r.ospfNbrIpAddr,
    NeighborRouterID: r.ospfNbrRtrId,
    State: if r._value == 8 then "Full"
      else if r._value == 7 then "Loading"
      else if r._value == 6 then "Exchange"
      else if r._value == 5 then "ExStart"
      else if r._value == 4 then "2-Way"
      else if r._value == 3 then "Init"
      else if r._value == 2 then "Attempt"
      else if r._value == 1 then "Down"
      else string(v: r._value),
    StateCode: r._value
  }))
  |> keep(columns: ["Core", "NeighborIP", "NeighborRouterID", "State", "StateCode"])
  |> group(columns: [])
  |> sort(columns: ["Core", "NeighborIP"])
```

**Panel Configuration**:
- **Table**: Show neighbor status
- **Color Coding**: Green (StateCode == 8), Red (StateCode < 8)

---

### 6. Link Redundancy Status (LACP/VPC)

**Query Approach**:
```flux
// LACP Status
from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) => 
    r._measurement == "lacp_aggregate" and
    (r._field == "dot3adAggPortActorState" or r._field == "dot3adAggPortPartnerState")
  )
  |> group(columns: ["source", "dot3adAggPortAttachedAggID", "_field"])
  |> last()
  |> pivot(rowKey: ["source", "dot3adAggPortAttachedAggID"], 
           columnKey: ["_field"], 
           valueColumn: "_value")
  |> map(fn: (r) => ({
    Core: r.source,
    AggregateID: r.dot3adAggPortAttachedAggID,
    ActorState: if exists r.dot3adAggPortActorState then r.dot3adAggPortActorState else 0,
    PartnerState: if exists r.dot3adAggPortPartnerState then r.dot3adAggPortPartnerState else 0,
    // Bit 0 = LACP Activity (1=Active, 0=Passive)
    // Bit 1 = LACP Timeout (1=Short, 0=Long)
    // Bit 2 = Aggregation (1=Aggregatable, 0=Individual)
    // Bit 3 = Synchronization (1=In sync, 0=Out of sync)
    // Bit 4 = Collecting (1=Collecting, 0=Not collecting)
    // Bit 5 = Distributing (1=Distributing, 0=Not distributing)
    // Bit 6 = Defaulted (1=Defaulted, 0=Expired)
    // Bit 7 = Expired (1=Expired, 0=Current)
    Status: if exists r.dot3adAggPortActorState and exists r.dot3adAggPortPartnerState then
      if (uint(v: r.dot3adAggPortActorState) & 0x3C) == 0x3C and 
         (uint(v: r.dot3adAggPortPartnerState) & 0x3C) == 0x3C then "Active"
      else "Inactive"
    else "Unknown"
  }))
```

**For VPC Status**:
```flux
from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) => 
    r._measurement == "cisco_vpc" and
    (r._field == "cvpcVpcState" or r._field == "cvpcVpcPeerStatus")
  )
  |> group(columns: ["source", "cvpcVpcId", "_field"])
  |> last()
  |> pivot(rowKey: ["source", "cvpcVpcId"], 
           columnKey: ["_field"], 
           valueColumn: "_value")
  |> map(fn: (r) => ({
    Core: r.source,
    VPCID: r.cvpcVpcId,
    VPCState: if exists r.cvpcVpcState then (if r.cvpcVpcState == 1 then "Up" else "Down") else "Unknown",
    PeerStatus: if exists r.cvpcVpcPeerStatus then string(v: r.cvpcVpcPeerStatus) else "Unknown"
  }))
```

---

### 7. Topology Discovery (LLDP)

**Query Approach**:
```flux
// Map core switch interfaces to connected building switches
from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) => 
    r._measurement == "lldp_remote" and
    (r.source == "192.168.2.70" or r.source == "192.168.2.71")
  )
  |> group(columns: ["source", "lldpRemLocalPortNum", "lldpRemSysName"])
  |> last()
  |> map(fn: (r) => ({
    Core: r.source,
    LocalInterface: r.lldpRemLocalPortNum,
    RemoteDevice: r.lldpRemSysName,
    RemotePort: if exists r.lldpRemPortDesc then r.lldpRemPortDesc else "Unknown",
    RemoteChassisID: r.lldpRemChassisId
  }))
  |> keep(columns: ["Core", "LocalInterface", "RemoteDevice", "RemotePort"])
  |> group(columns: [])
  |> sort(columns: ["Core", "LocalInterface"])
```

**Use Case**: 
- Auto-populate building name mapping for other visualizations
- Create network topology diagrams
- Verify expected connections

---

## Phase 3: Integration & Alerts

### 8. Building Connectivity Health Score

**Query Approach**:
```flux
// Combine multiple metrics into a health score
link_status = from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) =>
    r._measurement == "if_status_errors" and
    r._field == "ifOperStatus" and
    (r.source == "192.168.2.70" or r.source == "192.168.2.71")
  )
  |> filter(fn: (r) => r.ifDescr =~ /^Ethernet1\/(11|13|14|28|40|46|45)$/)
  |> group(columns: ["ifDescr"])
  |> last()
  |> map(fn: (r) => ({
    Building: if r.ifDescr == "Ethernet1/11" or r.ifDescr == "Ethernet1/13" then "Humanities"
      else if r.ifDescr == "Ethernet1/14" then "Creative Arts"
      else if r.ifDescr == "Ethernet1/28" then "Sharp Building"
      else if r.ifDescr == "Ethernet1/40" or r.ifDescr == "Ethernet1/46" then "B Building"
      else if r.ifDescr == "Ethernet1/45" then "Epworth"
      else "Other",
    LinkUp: if r._value == 1 then 1.0 else 0.0
  }))
  |> group(columns: ["Building"])
  |> sum(column: "LinkUp")

latency = from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) => 
    r._measurement == "ping" and
    r._field == "average_response_ms" and
    r.monitoring_type == "building_connectivity"
  )
  |> group(columns: ["url"])
  |> last()
  |> map(fn: (r) => ({
    Building: // Map URL to building (same as previous examples)
    LatencyOK: if r._value < 10.0 then 1.0 else 0.0
  }))
  |> group(columns: ["Building"])
  |> mean(column: "LatencyOK")

// Join and calculate health score
join(tables: {links: link_status, lat: latency}, on: ["Building"])
  |> map(fn: (r) => ({
    Building: r.Building,
    LinkScore: r.LinkUp / 2.0 * 100.0,  // Assuming 2 links per building max
    LatencyScore: r.LatencyOK * 100.0,
    HealthScore: ((r.LinkUp / 2.0) + r.LatencyOK) / 2.0 * 100.0
  }))
```

---

## Best Practices

### 1. **Start with Tables, Then Add Graphs**
- Tables show current state (most important)
- Graphs show trends over time

### 2. **Use Transformations for Complex Queries**
- Break complex logic into multiple query steps
- Use Grafana Transformations for joins/aggregations when possible

### 3. **Create Reusable Variables**
- Create dashboard variables for:
  - Building list
  - Core switch IPs
  - Interface patterns
  - Time ranges

### 4. **Use Consistent Color Coding**
- Green: Healthy/Up
- Yellow: Warning/Degraded
- Red: Critical/Down
- Grey: Not Configured/Unknown

### 5. **Build Incrementally**
- Start with one building/interface
- Verify query works
- Expand to all buildings
- Add refinements

### 6. **Test with Real Data**
- Wait for Telegraf to collect data
- Verify measurements exist in InfluxDB
- Check data quality before building complex queries

---

## Recommended Dashboard Structure

### Row 1: Overview Stats
- Total Buildings Connected
- Buildings with Issues
- Total Links
- Links Down

### Row 2: Building Link Status Matrix
- Table showing all building connections

### Row 3: Building Uptime
- Stat cards per category
- Detailed table

### Row 4: Building Throughput
- Time series graph
- Utilization table

### Row 5: Building Latency
- Time series graph
- Current latency stat cards

### Row 6: OSPF Status
- Neighbor status table
- State change graph

### Row 7: Redundancy Status
- LACP/VPC status table

### Row 8: Topology
- LLDP discovered connections

---

## Quick Start Checklist

- [ ] Verify Telegraf is collecting new data (ping, ospf_neighbor, lldp_remote)
- [ ] Test simple queries in Grafana Explore
- [ ] Create Building Link Status Matrix (Priority 1)
- [ ] Create Building Uptime Dashboard (Priority 2)
- [ ] Create Building Throughput visualization (Priority 3)
- [ ] Add Building Latency monitoring (Priority 4)
- [ ] Add OSPF monitoring (Priority 5)
- [ ] Add redundancy monitoring (Priority 6)
- [ ] Create comprehensive Building Connectivity dashboard
- [ ] Set up alerts based on new metrics

---

## Troubleshooting

### No Data Appearing?
1. Check Telegraf logs: `docker logs telegraf` or `journalctl -u telegraf`
2. Verify data in InfluxDB: Use Explore to query measurements
3. Check OIDs: Use `snmpwalk` to verify OSPF/LACP/LLDP OIDs work
4. Verify ping permissions: May need elevated permissions

### Queries Too Slow?
1. Reduce time range
2. Use `aggregateWindow` to downsample
3. Filter more aggressively (specific devices/interfaces)
4. Consider using continuous queries in InfluxDB

### Building Names Not Mapping?
1. Use LLDP data for auto-discovery
2. Create lookup table in Grafana variables
3. Use regex patterns to match switch names
4. Configure sysLocation on switches for automatic mapping

---

This approach gives you a systematic way to build comprehensive building connectivity visualizations, starting with the most critical views and expanding to advanced monitoring.

