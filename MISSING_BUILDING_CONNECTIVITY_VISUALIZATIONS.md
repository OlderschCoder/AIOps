# Missing Building-to-Building Connectivity Visualizations

## Analysis Based on SCCC Network Infrastructure Documentation

### Current State
- **Existing Dashboards**: Network Overview, Switching & Backbone, Campus Map
- **Existing Metrics**: General interface throughput, device uptime table, aggregate campus throughput
- **Missing**: Building-specific connectivity monitoring, link-level status, OSPF health

---

## Critical Missing Visualizations

### 1. **Building-to-Building Link Status Matrix** ⚠️ CRITICAL
**Purpose**: Real-time status of all building connections to core switches

**Missing Elements**:
- **Table/Matrix View**: Building name → Core Interface → Status (Up/Down) → Last Change
- **Color Coding**: Green (Up), Red (Down), Yellow (Degraded)
- **Per-Building Links**:
  - Humanities Building: Ethernet1/11, Ethernet1/13 (Core: 192.168.2.70)
  - Creative Arts (CAH): Ethernet1/14 (Core: 192.168.2.70)
  - Sharp Building: Ethernet1/28 (Core: 192.168.2.70)
  - B Building (Boiler Room): Ethernet1/40, Ethernet1/46 (Core: 192.168.2.70)
  - Epworth Building: Ethernet1/45 (Core: 192.168.2.70)
  - Student Living Center: OSPF VLAN 618
  - All other buildings with known connections

**Query Requirements**:
```flux
// Filter for core switch interfaces (192.168.2.70, 192.168.2.71)
// Filter for specific Ethernet interfaces (1/11, 1/13, 1/14, 1/28, 1/40, 1/46, 1/45)
// Get ifAdminStatus and ifOperStatus
// Map to building names
```

---

### 2. **Building Uptime Dashboard** ⚠️ CRITICAL
**Purpose**: Monitor uptime for each building's primary switch

**Missing Elements**:
- **Per-Building Uptime Table**: Building Name → Switch IP → Uptime (Days) → Status Age → Last Update
- **Uptime Trend Graph**: Historical uptime per building (shows reboots)
- **Uptime Status Cards**: Stat panels showing uptime for each building group:
  - Administrative Buildings (Hobble A144-1, A144-2, AA105)
  - Academic Buildings (Humanities, CAH, Sharp, B Building, Epworth, Cosmetology)
  - Student Living (SLC, SLG, SLJ, SLR, SLS, SLT)
  - Additional Facilities (Maintenance, Student Union, Softball)

**Current Gap**: 
- Network Overview has generic "SNMP Device Uptime" table
- **Missing**: Building name mapping, grouping by building type, uptime trends

**Query Requirements**:
```flux
// Map sysName/IP to building names
// Group by building category
// Calculate uptime in days from sysUpTime
// Calculate age of last update (for "stale data" detection)
```

---

### 3. **Building-to-Building Throughput Per Link** ⚠️ CRITICAL
**Purpose**: Monitor throughput speed for each building connection

**Missing Elements**:
- **Per-Link Throughput Graph**: Time series showing In/Out bps for each building link
- **Link Utilization Table**: Building → Interface → Current bps → Max Speed → Utilization %
- **Top Building Links by Utilization**: Identify congested links
- **Building Link Speed Summary**: Stat cards showing current throughput per building

**Current Gap**:
- Switching & Backbone has "Device Uplink Throughput" but filters by pattern, not building-specific
- **Missing**: Building name labels, per-building aggregation, utilization percentages

**Query Requirements**:
```flux
// Filter core switch (192.168.2.70, 192.168.2.71) interfaces
// Filter specific building interfaces (Ethernet1/11, 1/13, 1/14, etc.)
// Get ifHCInOctets, ifHCOutOctets, ifHighSpeed
// Calculate utilization: (current_bps / max_speed) * 100
// Map interface to building name
```

---

### 4. **OSPF Neighbor Status** ⚠️ HIGH PRIORITY
**Purpose**: Monitor OSPF routing protocol health between buildings

**Missing Elements**:
- **OSPF Neighbor Table**: Building → Neighbor IP → State (Full/Down) → Last Change
- **OSPF VLAN Status**: Status of OSPF VLANs (616, 618, 620, 624, 627)
- **OSPF Neighbor State Graph**: Time series showing neighbor state changes

**Current Gap**: 
- **Completely Missing**: No OSPF monitoring in any dashboard

**Query Requirements**:
```flux
// SNMP OIDs for OSPF:
// - ospfNbrIpAddr (1.3.6.1.2.1.14.10.1.1)
// - ospfNbrRtrId (1.3.6.1.2.1.14.10.1.3)
// - ospfNbrState (1.3.6.1.2.1.14.10.1.6) - 8 = Full
// - ospfNbrEvents (1.3.6.1.2.1.14.10.1.7)
// Map to building names via VLAN or IP
```

**Telegraf Configuration Needed**:
- Add OSPF MIB table to telegraf.conf for core switches

---

### 5. **Building Connectivity Health Score** ⚠️ HIGH PRIORITY
**Purpose**: Overall health status per building

**Missing Elements**:
- **Health Score Table**: Building → Link Status → Uptime Status → Error Rate → Overall Score
- **Health Score Cards**: Stat panels with color coding (Green/Yellow/Red)
- **Health Trend**: Historical health score per building

**Calculation**:
- Link Status: 100% if all links up, 0% if any down
- Uptime Status: 100% if uptime > threshold, degraded if recent reboot
- Error Rate: 100% if errors < threshold, degraded if high errors
- Overall: Weighted average

---

### 6. **Building Link Error Rates** ⚠️ HIGH PRIORITY
**Purpose**: Monitor interface errors/discards on building links

**Missing Elements**:
- **Error Rate Table**: Building → Interface → In Errors → Out Errors → In Discards → Out Discards → Error Rate (p/s)
- **Error Rate Graph**: Time series of errors per building link
- **Top Error Links**: Table showing buildings with highest error rates

**Current Gap**:
- Switching & Backbone has placeholder "Top Interfaces by Error/Discard Rate"
- **Missing**: Building name mapping, per-building aggregation, error rate trends

**Query Requirements**:
```flux
// Filter core switch interfaces for building links
// Get ifInErrors, ifOutErrors, ifInDiscards, ifOutDiscards
// Calculate error rate (derivative)
// Map to building names
```

---

### 7. **Building Link Latency** ⚠️ MEDIUM PRIORITY
**Purpose**: Monitor latency between core and building switches

**Missing Elements**:
- **Latency Table**: Building → Switch IP → Latency (ms) → Packet Loss (%)
- **Latency Graph**: Time series of latency per building
- **Latency Alerts**: Alert when latency exceeds threshold

**Current Gap**:
- Network Overview has "Internet Latency" but not building-to-building
- **Missing**: ICMP/ping monitoring to building switch IPs

**Query Requirements**:
```flux
// Ping input plugin in Telegraf
// Target: Building switch IPs (192.168.2.196, 192.168.2.171, etc.)
// Get rtt_avg, percent_packet_loss
// Map to building names
```

---

### 8. **Building Link Redundancy Status** ⚠️ MEDIUM PRIORITY
**Purpose**: Monitor LACP/VPC status for redundant links

**Missing Elements**:
- **Redundancy Status Table**: Building → Port-Channel → Member Interfaces → Status
- **LACP/VPC Status**: Active members, standby members, bundle status
- **Redundancy Health**: Alert if redundancy is lost

**Current Gap**:
- **Completely Missing**: No LACP/VPC monitoring

**Query Requirements**:
```flux
// SNMP OIDs for LACP:
// - dot3adAggPortAttachedAggID (1.3.6.1.2.1.17.7.1.4.5.1.3)
// - dot3adAggPortActorOperKey (1.3.6.1.2.1.17.7.1.4.5.1.4)
// - dot3adAggPortActorState (1.3.6.1.2.1.17.7.1.4.5.1.13)
// For Nexus VPC:
// - vpcPeerStatus (Cisco-specific OID)
```

**Telegraf Configuration Needed**:
- Add LACP/VPC MIB tables to telegraf.conf

---

### 9. **Building Connectivity Historical Trends** ⚠️ MEDIUM PRIORITY
**Purpose**: Long-term trends for capacity planning

**Missing Elements**:
- **Throughput Trends**: 30/90/365 day trends per building link
- **Uptime Trends**: Historical uptime showing reboots/maintenance
- **Utilization Trends**: Peak utilization over time
- **Error Trend Analysis**: Error rate trends over time

**Current Gap**:
- Dashboards show current/24h data
- **Missing**: Long-term trend analysis, capacity planning views

---

### 10. **Building-to-Building Connectivity Map** ⚠️ MEDIUM PRIORITY
**Purpose**: Visual representation of building connectivity

**Missing Elements**:
- **Network Diagram**: Visual map showing core → building connections
- **Interactive Map**: Click building to see details
- **Status Overlay**: Color-coded links (Green/Yellow/Red)
- **Tooltip Details**: Hover to see throughput, uptime, errors

**Current Gap**:
- Campus Map Overlay exists but focuses on building status, not connectivity
- **Missing**: Network topology visualization, link status overlay

---

## Summary of Missing Visualizations

### Critical (Must Have)
1. ✅ **Building-to-Building Link Status Matrix** - Real-time link up/down status
2. ✅ **Building Uptime Dashboard** - Per-building uptime with trends
3. ✅ **Building-to-Building Throughput Per Link** - Speed monitoring per building connection

### High Priority (Should Have)
4. ✅ **OSPF Neighbor Status** - Routing protocol health
5. ✅ **Building Connectivity Health Score** - Overall building health
6. ✅ **Building Link Error Rates** - Interface error monitoring

### Medium Priority (Nice to Have)
7. ✅ **Building Link Latency** - Latency monitoring between buildings
8. ✅ **Building Link Redundancy Status** - LACP/VPC monitoring
9. ✅ **Building Connectivity Historical Trends** - Long-term analysis
10. ✅ **Building-to-Building Connectivity Map** - Visual topology

---

## Required Telegraf Configuration Additions

### 1. OSPF MIB Collection
```toml
[[inputs.snmp.table]]
  name = "ospf_neighbor"
  oid = "1.3.6.1.2.1.14.10.1"
  inherit_tags = ["sysName", "source"]
  
  [[inputs.snmp.table.field]]
    name = "ospfNbrIpAddr"
    oid = "1.3.6.1.2.1.14.10.1.1"
    is_tag = true
  
  [[inputs.snmp.table.field]]
    name = "ospfNbrState"
    oid = "1.3.6.1.2.1.14.10.1.6"
  
  [[inputs.snmp.table.field]]
    name = "ospfNbrEvents"
    oid = "1.3.6.1.2.1.14.10.1.7"
```

### 2. LACP/VPC Collection
```toml
[[inputs.snmp.table]]
  name = "lacp_aggregate"
  oid = "1.3.6.1.2.1.17.7.1.4.5.1"
  inherit_tags = ["sysName", "source"]
  
  [[inputs.snmp.table.field]]
    name = "dot3adAggPortAttachedAggID"
    oid = "1.3.6.1.2.1.17.7.1.4.5.1.3"
  
  [[inputs.snmp.table.field]]
    name = "dot3adAggPortActorState"
    oid = "1.3.6.1.2.1.17.7.1.4.5.1.13"
```

### 3. Ping Monitoring for Building Switches
```toml
[[inputs.ping]]
  urls = [
    "192.168.2.196",  # SW-B101-Aruba
    "192.168.2.171",  # SW-COS109-Aruba
    "192.168.2.175",  # SWA-SLC151
    "192.168.2.179",  # SWA-SLG
    "192.168.2.181",  # SWA-SLJ
    "192.168.2.182",  # SWA-SLR
    "192.168.2.183",  # SWA-SLS
    "192.168.2.184",  # SWA-SLT
    "192.168.2.200",  # SWA-SU121
    "192.168.2.201",  # SW-A144-1-aruba
    "192.168.2.202",  # SW-A144-2-Aruba
    "192.168.2.204",  # SW-SoftBallPB
    "192.168.2.205",  # SW-M201-1
  ]
  method = "native"
  count = 5
  ping_interval = 1.0
  timeout = 3.0
```

---

## Building Name Mapping Reference

### Core Switches
- `sw-aa144-A48` (192.168.2.70) - Primary Core
- `sw-aa144-A24` (192.168.2.71) - Secondary Core

### Administrative Buildings
- `SW-A144-1-aruba` (192.168.2.201) - Hobble A144
- `SW-A144-2-Aruba` (192.168.2.202) - Hobble A144 Switch 2
- `SWA-AA105` (192.168.2.199) - Hobble HR AA105

### Academic Buildings
- `SW-H128-TEST`, `SW-H128-PRIM` - Humanities Building (Ethernet1/11, 1/13)
- `SW-CAH144` - Creative Arts (Ethernet1/14)
- Sharp Building (Ethernet1/28)
- `SW-B101-Aruba` (192.168.2.196) - Boiler Room (Ethernet1/40, 1/46)
- Epworth Building (Ethernet1/45)
- `SW-COS109-Aruba` (192.168.2.171) - Cosmetology

### Student Living
- `SWA-SLC151` (192.168.2.175) - Student Living Center
- `SWA-SLG` (192.168.2.179) - SLG Switch G
- `SWA-SLJ` (192.168.2.181) - Tech Dorms J
- `SWA-SLR` (192.168.2.182) - Tech Dorm SLR
- `SWA-SLS` (192.168.2.183) - Student Living SLS
- `SWA-SLT` (192.168.2.184) - Student Living SLT

### Additional Facilities
- `SW-M201-1` (192.168.2.205) - Maintenance
- `SWA-SU121` (192.168.2.200) - Student Union
- `SW-SoftBallPB` (192.168.2.204) - Softball Field

---

## Recommended Dashboard Structure

### New Dashboard: "Building Connectivity"

**Row 1: Overview Stats**
- Total Buildings Connected
- Buildings with Issues
- Total Building Links
- Links Down

**Row 2: Building Link Status Matrix**
- Table: Building → Core Interface → Status → Last Change → Throughput

**Row 3: Building Uptime**
- Stat Cards: Uptime per building category
- Table: Detailed uptime per building

**Row 4: Building Throughput**
- Time Series: Throughput per building link
- Table: Current utilization per building

**Row 5: OSPF Status**
- Table: OSPF neighbor status per building
- Graph: OSPF state changes over time

**Row 6: Error Rates**
- Table: Error rates per building link
- Graph: Error trends

**Row 7: Health Scores**
- Stat Cards: Health score per building
- Table: Detailed health metrics

---

## Next Steps

1. **Immediate**: Create Building Link Status Matrix visualization
2. **Immediate**: Enhance Building Uptime dashboard with building name mapping
3. **Immediate**: Create Building Throughput Per Link visualization
4. **Short-term**: Add OSPF MIB collection to Telegraf
5. **Short-term**: Add ping monitoring for building switches
6. **Medium-term**: Create Building Connectivity Health Score
7. **Medium-term**: Add LACP/VPC monitoring
8. **Long-term**: Create visual network topology map

