# Missing Telegraf Data Collection for Building Connectivity

## Analysis of Current telegraf.conf vs. Required Data

### ✅ Currently Collected (Good!)
- Interface status (ifAdminStatus, ifOperStatus) ✓
- Interface throughput (ifHCInOctets, ifHCOutOctets) ✓
- Interface speed (ifHighSpeed) ✓
- Interface errors (ifInErrors, ifOutErrors, ifInDiscards, ifOutDiscards) ✓
- sysUpTime ✓
- sysName, sysDescr, sysLocation ✓
- CPU and Memory (Cisco and Aruba) ✓

---

## ❌ Missing Data Collection

### 1. **OSPF Neighbor Status** ⚠️ CRITICAL
**Purpose**: Monitor OSPF routing protocol health between buildings

**Missing**: OSPF-MIB data collection

**Required SNMP Tables**:
```toml
# OSPF Neighbor Table (OSPF-MIB)
[[inputs.snmp.table]]
  name = "ospf_neighbor"
  oid  = "1.3.6.1.2.1.14.10.1"  # ospfNbrTable
  inherit_tags = ["sysName", "sysLocation"]
  
  [[inputs.snmp.table.field]]
    name   = "ospfNbrIpAddr"
    oid    = "1.3.6.1.2.1.14.10.1.1"  # Neighbor IP address
    is_tag = true
  
  [[inputs.snmp.table.field]]
    name   = "ospfNbrRtrId"
    oid    = "1.3.6.1.2.1.14.10.1.3"  # Neighbor Router ID
    is_tag = true
  
  [[inputs.snmp.table.field]]
    name = "ospfNbrState"
    oid  = "1.3.6.1.2.1.14.10.1.6"  # Neighbor state (8 = Full)
  
  [[inputs.snmp.table.field]]
    name = "ospfNbrEvents"
    oid  = "1.3.6.1.2.1.14.10.1.7"  # Number of state changes

# OSPF Area Table (optional, for VLAN mapping)
[[inputs.snmp.table]]
  name = "ospf_area"
  oid  = "1.3.6.1.2.1.14.1.1"  # ospfAreaTable
  inherit_tags = ["sysName", "sysLocation"]
  
  [[inputs.snmp.table.field]]
    name   = "ospfAreaId"
    oid    = "1.3.6.1.2.1.14.1.1.1"  # Area ID (can map to VLAN)
    is_tag = true
```

**Where to Add**: 
- Add to both Cisco Nexus SNMP input blocks (lines 415-597 and 602-783)
- Only collect from core switches (192.168.2.70, 192.168.2.71, 192.168.2.72, 192.168.2.73)

**Why Critical**: 
- OSPF VLANs (616, 618, 620, 624, 627) are used for building connectivity
- Need to monitor if OSPF neighbors are in "Full" state
- State changes indicate routing issues

---

### 2. **LACP/VPC Status** ⚠️ HIGH PRIORITY
**Purpose**: Monitor link aggregation and redundancy for building connections

**Missing**: LACP and Cisco VPC MIB data

**Required SNMP Tables**:
```toml
# LACP Aggregate Port Table (IEEE 802.3ad)
[[inputs.snmp.table]]
  name = "lacp_aggregate"
  oid  = "1.3.6.1.2.1.17.7.1.4.5.1"  # dot3adAggPortAttachedAggID
  inherit_tags = ["sysName", "sysLocation", "ifName"]
  
  [[inputs.snmp.table.field]]
    name   = "dot3adAggPortAttachedAggID"
    oid    = "1.3.6.1.2.1.17.7.1.4.5.1.3"  # Aggregation group ID
    is_tag = true
  
  [[inputs.snmp.table.field]]
    name = "dot3adAggPortActorState"
    oid  = "1.3.6.1.2.1.17.7.1.4.5.1.13"  # Actor state (bitmask)
  
  [[inputs.snmp.table.field]]
    name = "dot3adAggPortPartnerState"
    oid  = "1.3.6.1.2.1.17.7.1.4.5.1.14"  # Partner state

# Cisco VPC (Virtual Port Channel) - Nexus specific
# Note: VPC OIDs are Cisco-specific and may vary by model
# Common OID: 1.3.6.1.4.1.9.9.810.1.1.1.1.x
[[inputs.snmp.table]]
  name = "cisco_vpc"
  oid  = "1.3.6.1.4.1.9.9.810.1.1.1.1"  # cvpcVpcTable (verify OID for your model)
  inherit_tags = ["sysName", "sysLocation"]
  
  [[inputs.snmp.table.field]]
    name   = "cvpcVpcId"
    oid    = "1.3.6.1.4.1.9.9.810.1.1.1.1.1"  # VPC ID
    is_tag = true
  
  [[inputs.snmp.table.field]]
    name = "cvpcVpcState"
    oid  = "1.3.6.1.4.1.9.9.810.1.1.1.1.2"  # VPC state (1=up, 2=down)
  
  [[inputs.snmp.table.field]]
    name = "cvpcVpcPeerStatus"
    oid  = "1.3.6.1.4.1.9.9.810.1.1.1.1.3"  # Peer status
```

**Where to Add**: 
- Add to both Cisco Nexus SNMP input blocks
- VPC is Nexus-specific, LACP is standard

**Why Important**: 
- B Building has redundant links (Ethernet1/40 and 1/46)
- Need to monitor if redundancy is active
- Alert if redundancy is lost

---

### 3. **Ping/ICMP Monitoring** ⚠️ CRITICAL
**Purpose**: Monitor latency and packet loss to building switches

**Missing**: Ping input plugin (currently commented as "intentionally omitted")

**Required Configuration**:
```toml
# Ping monitoring for building switches
[[inputs.ping]]
  urls = [
    # Core switches
    "192.168.2.70",  # sw-aa144-A48
    "192.168.2.71",  # sw-aa144-A24
    "192.168.2.72",  # Additional core
    "192.168.2.73",  # Additional core
    
    # Administrative Buildings
    "192.168.2.199",  # SWA-AA105
    "192.168.2.201",  # SW-A144-1-aruba
    "192.168.2.202",  # SW-A144-2-Aruba
    
    # Academic Buildings
    "192.168.2.196",  # SW-B101-Aruba (Boiler Room)
    "192.168.2.171",  # SW-COS109-Aruba (Cosmetology)
    
    # Student Living
    "192.168.2.175",  # SWA-SLC151
    "192.168.2.179",  # SWA-SLG
    "192.168.2.181",  # SWA-SLJ
    "192.168.2.182",  # SWA-SLR
    "192.168.2.183",  # SWA-SLS
    "192.168.2.184",  # SWA-SLT
    
    # Additional Facilities
    "192.168.2.200",  # SWA-SU121 (Student Union)
    "192.168.2.204",  # SW-SoftBallPB
    "192.168.2.205",  # SW-M201-1 (Maintenance)
  ]
  method = "native"  # or "exec" on Windows
  count = 5
  ping_interval = 1.0
  timeout = 3.0
  deadline = 10
  
  # Tag with building name for easier querying
  [inputs.ping.tags]
    monitoring_type = "building_connectivity"
```

**Where to Add**: 
- Add new `[[inputs.ping]]` block after line 36 (after the comment about ICMP being omitted)
- Or create separate ping blocks for different building categories

**Why Critical**: 
- Need latency metrics between core and building switches
- Packet loss indicates connectivity issues
- Currently no way to measure building-to-core latency

**Note**: The config says "ICMP/ping intentionally omitted so Internet latency/loss come from FortiGate" - but we need building-to-building latency, not just Internet latency.

---

### 4. **LLDP Neighbor Information** ⚠️ MEDIUM PRIORITY
**Purpose**: Automatically discover which interfaces connect to which buildings

**Missing**: LLDP-MIB data collection

**Required SNMP Tables**:
```toml
# LLDP Remote Table (to see what's connected to each interface)
[[inputs.snmp.table]]
  name = "lldp_remote"
  oid  = "1.0.8802.1.1.2.1.4.1.1"  # lldpRemTable
  inherit_tags = ["sysName", "sysLocation"]
  
  [[inputs.snmp.table.field]]
    name   = "lldpRemLocalPortNum"
    oid    = "1.0.8802.1.1.2.1.4.1.1.2"  # Local port (maps to ifIndex)
    is_tag = true
  
  [[inputs.snmp.table.field]]
    name   = "lldpRemChassisId"
    oid    = "1.0.8802.1.1.2.1.4.1.1.5"  # Remote chassis ID
    is_tag = true
  
  [[inputs.snmp.table.field]]
    name   = "lldpRemSysName"
    oid    = "1.0.8802.1.1.2.1.4.1.1.9"  # Remote system name (building switch name!)
    is_tag = true
  
  [[inputs.snmp.table.field]]
    name   = "lldpRemPortDesc"
    oid    = "1.0.8802.1.1.2.1.4.1.1.8"  # Remote port description
    is_tag = true
```

**Where to Add**: 
- Add to both Cisco Nexus SNMP input blocks
- Core switches should have LLDP enabled to see connected building switches

**Why Useful**: 
- Automatically maps core switch interfaces to building switch names
- Reduces manual configuration
- Can detect topology changes

---

### 5. **Interface Index (ifIndex)** ⚠️ MEDIUM PRIORITY
**Purpose**: Better data joining between interface tables

**Missing**: ifIndex as a tag in interface tables

**Current State**: 
- `if_status_errors` table has `ifDescr` as tag
- `interface` table has `ifName` as tag
- **Missing**: `ifIndex` which is the standard SNMP interface identifier

**Required Addition**:
```toml
# In if_status_errors table, add:
[[inputs.snmp.table.field]]
  name   = "ifIndex"
  oid    = "1.3.6.1.2.1.2.2.1.1"  # Interface index
  is_tag = true

# In interface table (ifXTable), add:
[[inputs.snmp.table.field]]
  name   = "ifIndex"
  oid    = "1.3.6.1.2.1.2.2.1.1"  # Same OID, but need to join via ifName
  is_tag = true
```

**Why Important**: 
- `ifIndex` is the standard way to join interface data
- `ifDescr` and `ifName` can differ or be inconsistent
- Better for correlating status with throughput data

**Note**: ifXTable doesn't directly include ifIndex, but we can get it from ifTable and join. Alternatively, use ifName consistently.

---

### 6. **Port-Channel / Aggregate Interface Status** ⚠️ MEDIUM PRIORITY
**Purpose**: Monitor port-channel interfaces (used for redundancy)

**Missing**: Port-channel interface status and member status

**Current State**: 
- We collect individual interface status
- **Missing**: Port-channel (aggregate) interface status
- **Missing**: Which physical interfaces are members of port-channels

**Required Addition**:
```toml
# This is partially covered by LACP, but we also need:
# - Port-channel interface operational status
# - Member interface status within port-channels
# - Port-channel throughput (aggregate of members)

# Port-channel interfaces show up in ifTable/ifXTable with ifType = 161 (ieee8023adLag)
# We can filter for these, but need to also track members

# For Cisco, use:
# - Port-channel interface status (already in if_status_errors if port-channel exists)
# - Member mapping (via LACP or Cisco-specific MIBs)
```

**Why Important**: 
- B Building uses redundant links (Ethernet1/40, 1/46) - likely in a port-channel
- Need to monitor if port-channel is up and which members are active

---

### 7. **Interface Last Change Time** ⚠️ LOW PRIORITY
**Purpose**: Track when interfaces last changed state

**Missing**: ifLastChange (time since interface last changed state)

**Required Addition**:
```toml
# In if_status_errors table, add:
[[inputs.snmp.table.field]]
  name = "ifLastChange"
  oid  = "1.3.6.1.2.1.2.2.1.9"  # Time since last state change (sysUpTime format)
```

**Why Useful**: 
- Know when an interface last went down/up
- Useful for "Last Change" column in link status matrix
- Helps identify flapping interfaces

---

## Summary: Priority Order for Implementation

### 🔴 Critical (Implement First)
1. **Ping/ICMP Monitoring** - Needed for latency/packet loss metrics
2. **OSPF Neighbor Status** - Critical for routing health monitoring

### 🟡 High Priority (Implement Soon)
3. **LACP/VPC Status** - Needed for redundancy monitoring
4. **Interface Index (ifIndex)** - Improves data correlation

### 🟢 Medium Priority (Nice to Have)
5. **LLDP Neighbor Information** - Auto-discovery of topology
6. **Port-Channel Status** - Monitor aggregate interfaces

### ⚪ Low Priority (Future Enhancement)
7. **Interface Last Change Time** - Additional metadata

---

## Implementation Notes

### OSPF MIB Availability
- **Standard OSPF-MIB**: Should be available on all routers/switches running OSPF
- **Verify OIDs**: Some devices may use different OIDs or require SNMP view configuration
- **Test First**: Use `snmpwalk` to verify OIDs before adding to telegraf.conf

### LACP/VPC MIB Availability
- **LACP (IEEE 802.3ad)**: Standard, should be available
- **Cisco VPC**: Nexus-specific, OIDs may vary by model/version
- **Verify**: Check Cisco documentation for your specific Nexus model

### Ping Plugin Considerations
- **Windows vs Linux**: Method may differ (`native` vs `exec`)
- **Permissions**: May require elevated permissions on some systems
- **Firewall**: Ensure ICMP is allowed between Telegraf server and target switches
- **Frequency**: Consider ping interval (1s may be too aggressive for 20+ targets)

### LLDP Considerations
- **Enable LLDP**: Ensure LLDP is enabled on core switches
- **Remote Devices**: Building switches must also support LLDP for remote info
- **Aruba Switches**: May use proprietary discovery protocols instead of LLDP

---

## Quick Start: Minimal Implementation

For immediate building connectivity monitoring, add these three items:

1. **Ping Plugin** (5 minutes)
   - Copy the ping configuration above
   - Add to telegraf.conf
   - Restart Telegraf

2. **OSPF Neighbor Table** (15 minutes)
   - Add OSPF table to Cisco Nexus SNMP blocks
   - Verify OIDs with snmpwalk first
   - Restart Telegraf

3. **ifIndex to if_status_errors** (5 minutes)
   - Add ifIndex field to if_status_errors table
   - Restart Telegraf

This gives you:
- ✅ Building switch latency/packet loss
- ✅ OSPF neighbor health
- ✅ Better interface data correlation

Then add LACP/VPC and LLDP as time permits.

