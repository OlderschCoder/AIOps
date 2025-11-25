# Telegraf Configuration Changes Summary

## Changes Made to telegraf.conf

### 1. ✅ Fixed Content Encoding Typo
- **Line 58**: Changed `content_encoding = "gziop"` to `content_encoding = "gzip"`

### 2. ✅ Added Ping/ICMP Monitoring
- **Lines 67-111**: Added `[[inputs.ping]]` block
- Monitors 20 building switches for latency and packet loss
- Includes core switches and all building distribution switches
- Tagged with `monitoring_type = "building_connectivity"`

### 3. ✅ Made sysLocation a Tag
- **Aruba SNMP block** (line 206): Added `is_tag = true` to sysLocation
- **Cisco Nexus block 1** (line 797): Added `is_tag = true` to sysLocation
- **Cisco Nexus block 2** (line 1087): Added `is_tag = true` to sysLocation
- Allows filtering by building location in Grafana queries

### 4. ✅ Added sysLocation to inherit_tags
- Updated all interface tables to inherit `sysLocation` tag
- Aruba: interface_legacy, interface
- Cisco: interface, if_status_errors, cisco_cpu, cisco_memory_pool
- Enables building-based filtering in all interface metrics

### 5. ✅ Added ifDescr and ifIndex to if_status_errors
- **Both Cisco Nexus blocks**: Added ifIndex and ifDescr as tags
- **ifIndex** (line ~851 and ~1141): OID 1.3.6.1.2.1.2.2.1.1, is_tag = true
- **ifDescr** (line ~859 and ~1149): OID 1.3.6.1.2.1.2.2.1.2, is_tag = true
- Enables better interface identification and data correlation

### 6. ✅ Added ifLastChange Field
- **Both Cisco Nexus blocks**: Added ifLastChange field (OID 1.3.6.1.2.1.2.2.1.9)
- Tracks time since last interface state change
- Useful for identifying flapping interfaces

### 7. ✅ Added OSPF Neighbor Monitoring
- **Both Cisco Nexus blocks**: Added `ospf_neighbor` table
- **OID**: 1.3.6.1.2.1.14.10.1 (OSPF-MIB ospfNbrTable)
- **Fields collected**:
  - ospfNbrIpAddr (tag) - Neighbor IP address
  - ospfNbrRtrId (tag) - Neighbor Router ID
  - ospfNbrState - Neighbor state (8 = Full)
  - ospfNbrEvents - Number of state changes
- **Purpose**: Monitor OSPF routing protocol health between buildings

### 8. ✅ Added LACP Aggregate Port Monitoring
- **Both Cisco Nexus blocks**: Added `lacp_aggregate` table
- **OID**: 1.3.6.1.2.1.17.7.1.4.5.1 (IEEE 802.3ad)
- **Fields collected**:
  - dot3adAggPortAttachedAggID (tag) - Aggregation group ID
  - dot3adAggPortActorState - Actor state (bitmask)
  - dot3adAggPortPartnerState - Partner state
- **Purpose**: Monitor link aggregation and redundancy status

### 9. ✅ Added LLDP Remote Table
- **Both Cisco Nexus blocks**: Added `lldp_remote` table
- **OID**: 1.0.8802.1.1.2.1.4.1.1 (LLDP-MIB lldpRemTable)
- **Fields collected**:
  - lldpRemLocalPortNum (tag) - Local port (maps to ifIndex)
  - lldpRemChassisId (tag) - Remote chassis ID
  - lldpRemSysName (tag) - Remote system name (building switch name!)
  - lldpRemPortDesc (tag) - Remote port description
- **Purpose**: Auto-discover which interfaces connect to which building switches

### 10. ✅ Added Cisco VPC Monitoring
- **Both Cisco Nexus blocks**: Added `cisco_vpc` table
- **OID**: 1.3.6.1.4.1.9.9.810.1.1.1.1 (Cisco VPC MIB)
- **Fields collected**:
  - cvpcVpcId (tag) - VPC ID
  - cvpcVpcState - VPC state (1=up, 2=down)
  - cvpcVpcPeerStatus - Peer status
- **Purpose**: Monitor Nexus VPC (Virtual Port Channel) redundancy
- **Note**: OIDs may need verification for your specific Nexus model/version

---

## New Data Available for Building Connectivity Dashboards

### Ping Data
- **Measurement**: `ping`
- **Fields**: `average_response_ms`, `percent_packet_loss`, `packets_transmitted`, `packets_received`
- **Tags**: `url` (IP address), `monitoring_type` (building_connectivity)
- **Use**: Building-to-core latency and packet loss monitoring

### OSPF Neighbor Data
- **Measurement**: `ospf_neighbor`
- **Fields**: `ospfNbrState`, `ospfNbrEvents`
- **Tags**: `source`, `sysName`, `sysLocation`, `ospfNbrIpAddr`, `ospfNbrRtrId`
- **Use**: OSPF routing health, neighbor state monitoring

### LACP Data
- **Measurement**: `lacp_aggregate`
- **Fields**: `dot3adAggPortActorState`, `dot3adAggPortPartnerState`
- **Tags**: `source`, `sysName`, `sysLocation`, `dot3adAggPortAttachedAggID`
- **Use**: Link aggregation status, redundancy monitoring

### LLDP Data
- **Measurement**: `lldp_remote`
- **Fields**: (none, all tags)
- **Tags**: `source`, `sysName`, `sysLocation`, `lldpRemLocalPortNum`, `lldpRemChassisId`, `lldpRemSysName`, `lldpRemPortDesc`
- **Use**: Topology discovery, mapping interfaces to building switches

### Cisco VPC Data
- **Measurement**: `cisco_vpc`
- **Fields**: `cvpcVpcState`, `cvpcVpcPeerStatus`
- **Tags**: `source`, `sysName`, `sysLocation`, `cvpcVpcId`
- **Use**: VPC redundancy status monitoring

### Enhanced Interface Data
- **if_status_errors**: Now includes `ifIndex`, `ifDescr` (as tags), and `ifLastChange`
- **All tables**: Now inherit `sysLocation` tag for building-based filtering

---

## Next Steps

### 1. Restart Telegraf
```bash
# Test configuration first
telegraf --config telegraf.conf --test

# If test passes, restart Telegraf service
systemctl restart telegraf
# or
docker restart telegraf
```

### 2. Verify Data Collection
Check that new measurements are being written to InfluxDB:

```flux
// Check ping data
from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) => r._measurement == "ping")
  |> limit(n: 10)

// Check OSPF neighbor data
from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) => r._measurement == "ospf_neighbor")
  |> limit(n: 10)

// Check LLDP data
from(bucket: "telegraf")
  |> range(start: -5m)
  |> filter(fn: (r) => r._measurement == "lldp_remote")
  |> limit(n: 10)
```

### 3. Verify OIDs (If No Data)
Some OIDs may need verification for your specific hardware:

```bash
# Check OSPF OIDs
snmpwalk -v3 -l authPriv -u MonitorUser -a SHA -A "StrongAuthPass@32456##" -x AES -X "StrongPrivPass@32456##" 192.168.2.70 1.3.6.1.2.1.14.10.1

# Check LACP OIDs
snmpwalk -v3 -l authPriv -u MonitorUser -a SHA -A "StrongAuthPass@32456##" -x AES -X "StrongPrivPass@32456##" 192.168.2.70 1.3.6.1.2.1.17.7.1.4.5.1

# Check LLDP OIDs
snmpwalk -v3 -l authPriv -u MonitorUser -a SHA -A "StrongAuthPass@32456##" -x AES -X "StrongPrivPass@32456##" 192.168.2.70 1.0.8802.1.1.2.1.4.1.1

# Check VPC OIDs (Nexus specific)
snmpwalk -v3 -l authPriv -u MonitorUser -a SHA -A "StrongAuthPass@32456##" -x AES -X "StrongPrivPass@32456##" 192.168.2.70 1.3.6.1.4.1.9.9.810
```

### 4. Update Grafana Dashboards
Now you can create visualizations for:
- Building-to-building link status (using if_status_errors with ifDescr)
- Building uptime (using sysUpTime with sysLocation)
- Building throughput (using interface with sysLocation)
- OSPF neighbor status (using ospf_neighbor)
- Building latency (using ping)
- Link redundancy (using lacp_aggregate or cisco_vpc)
- Topology map (using lldp_remote)

---

## Potential Issues & Solutions

### Issue: Ping plugin requires elevated permissions
**Solution**: Run Telegraf with appropriate permissions or use `method = "exec"` on Windows

### Issue: OSPF/LACP/LLDP OIDs not returning data
**Possible causes**:
- OSPF not running on switches
- LACP not configured
- LLDP not enabled
- OIDs incorrect for your hardware version
**Solution**: Verify with snmpwalk commands above

### Issue: VPC OIDs not working
**Solution**: VPC OIDs vary by Nexus model. Check Cisco documentation for your specific model or use snmpwalk to discover correct OIDs.

### Issue: Too much data being collected
**Solution**: Consider increasing collection interval or filtering specific devices in ping/SNMP blocks.

---

## Summary

All critical missing data collection has been added:
- ✅ Ping monitoring for building switches
- ✅ OSPF neighbor status
- ✅ LACP/VPC status
- ✅ LLDP topology discovery
- ✅ Enhanced interface identification (ifDescr, ifIndex)
- ✅ Building location tags (sysLocation)

The configuration is now ready to support comprehensive building-to-building connectivity monitoring dashboards.

