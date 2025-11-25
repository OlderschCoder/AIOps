# Building Link Status Queries - Fixed Versions

## Problem
Buildings connected to both core switches show duplicate rows (one Up, one Down).

## Solution Options

### Option 1: Show Only Primary Core Switch (192.168.2.70)
**Use this if**: You only want to see the primary connection

```flux
from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) =>
    r._measurement == "if_status_errors" and
    (r._field == "ifAdminStatus" or r._field == "ifOperStatus") and
    r.source == "192.168.2.70"  // ← Only primary core switch
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
  }))
  |> keep(columns: ["Building", "Interface", "Core", "Status", "StatusCode"])
  |> group(columns: [])
  |> sort(columns: ["Building", "Interface"])
```

---

### Option 2: Aggregate to Show Worst Status Per Building
**Use this if**: You want one row per building showing the worst status (alerts if ANY link is down)

```flux
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
      StatusCode: if exists r.ifAdminStatus and exists r.ifOperStatus then
        if r.ifAdminStatus == 1 and r.ifOperStatus == 1 then 1.0
        else if r.ifAdminStatus == 1 and r.ifOperStatus != 1 then 2.0
        else 0.0
      else 0.0
    }
  })
  |> group(columns: ["Building"])
  |> reduce(
    identity: { Building: "", Cores: "", Interfaces: "", WorstStatusCode: 1.0, WorstStatus: "Up", AllUp: true },
    fn: (r, accumulator) => {
      worst = if r.StatusCode > accumulator.WorstStatusCode then r.StatusCode else accumulator.WorstStatusCode
      status = if worst == 2.0 then "Down"
        else if worst == 1.0 then "Up"
        else "Not Configured"
      
      return {
        Building: r.Building,
        Cores: if accumulator.Cores == "" then r.Core else accumulator.Cores + ", " + r.Core,
        Interfaces: if accumulator.Interfaces == "" then r.Interface else accumulator.Interfaces + ", " + r.Interface,
        WorstStatusCode: worst,
        WorstStatus: status,
        AllUp: accumulator.AllUp and r.StatusCode == 1.0
      }
    }
  )
  |> map(fn: (r) => ({
    Building: r.Building,
    Interfaces: r.Interfaces,
    Cores: r.Cores,
    Status: r.WorstStatus,
    StatusCode: r.WorstStatusCode,
    AllLinksUp: r.AllUp
  }))
  |> sort(columns: ["Building"])
```

---

### Option 3: Show All Links But Group by Building (Recommended for Redundancy Monitoring)
**Use this if**: You want to see redundancy status (shows which core switch each building uses)

```flux
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
  |> keep(columns: ["Building", "Interface", "Core", "Status", "StatusCode"])
  |> group(columns: ["Building"])  // Group by building to see all links per building together
  |> sort(columns: ["Building", "Core", "Interface"])
```

**This will show**:
```
Building        Interface      Core           Status    StatusCode
Epworth         Ethernet1/45   192.168.2.70   Up        1
Epworth         Ethernet1/45   192.168.2.71   Down      2
```

This is actually **useful** because it shows redundancy status - you can see if a building has a backup link and whether it's up or down.

---

### Option 4: Use LLDP to Auto-Discover Active Connections
**Use this if**: You want to automatically determine which core switch each building is actually using

```flux
// First, get LLDP data to see which interfaces are actually connected
lldp_data = from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) => 
    r._measurement == "lldp_remote" and
    (r.source == "192.168.2.70" or r.source == "192.168.2.71")
  )
  |> filter(fn: (r) => 
    r.lldpRemLocalPortNum =~ /^Ethernet1\/(11|13|14|28|40|46|45)$/
  )
  |> group(columns: ["source", "lldpRemLocalPortNum"])
  |> last()
  |> map(fn: (r) => ({
    Core: r.source,
    Interface: r.lldpRemLocalPortNum,
    Building: r.lldpRemSysName,
    Connected: true
  }))

// Then get interface status
status_data = from(bucket: "telegraf")
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
  }))

// Join to show only interfaces that have LLDP neighbors (actually connected)
join(tables: {status: status_data, lldp: lldp_data}, on: ["Core", "Interface"])
  |> map(fn: (r) => ({
    Building: r.lldp_Building,  // Use building name from LLDP
    Interface: r.Interface,
    Core: r.Core,
    Status: r.Status,
    StatusCode: r.StatusCode
  }))
  |> keep(columns: ["Building", "Interface", "Core", "Status", "StatusCode"])
  |> group(columns: [])
  |> sort(columns: ["Building", "Interface"])
```

---

## Recommended Solution

**For a clean single-status view**: Use **Option 1** (Primary Core Only)

**For redundancy monitoring**: Use **Option 3** (Show All Links Grouped)

**For automatic discovery**: Use **Option 4** (LLDP-based) - but requires LLDP data to be collected

The fact that you're seeing both Up and Down suggests Epworth might have redundant links (one to each core switch), which is actually good to monitor! Option 3 lets you see this redundancy.


