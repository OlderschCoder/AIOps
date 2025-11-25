network data

- Hostname: sw-aa144-A48 (Primary Core)

  - IP: 192.168.2.70
  - Location: Hobble AA144
  - Version: 10.2(6)
  - Role: Primary Core Switch
  - Status: Monitored via SNMP v3
  - Core Features: OSPF, PIM, LACP, DHCP, VPC, LLDP
- Hostname: sw-aa144-A24 (Secondary Core)

  - IP: 192.168.2.71
  - Location: Hobble AA144
  - Role: Secondary Core Switch
  - Status: Monitored via SNMP v3

### Administration Buildings

- SW-A144-1-aruba (192.168.2.201)

  - Location: Hobble A144
  - Uptime: 180 days
  - Connected to: sw-aa144-A48
- SWA-AA105 (192.168.2.199)

  - Location: Hobble HR AA105
  - Uptime: 51.1 days
  - Connected to: sw-aa144-A48

### Humanities Building

- SW-H128-TEST
- SW-H128-PRIM
  - Connected via: Ethernet1/11 and 1/13
  - VLANs: 200-204, 304, 351-353, 375, 402-405

### Creative Arts (CAH)

- SW-CAH144
  - Connected via: Ethernet1/14
  - VLANs: 200-204, 322, 350-353, 375, 402

### Sharp Building

- Connected via: Ethernet1/28
- OSPF VLAN: 624

### B Building

- SW-B101-Aruba (192.168.2.196)
  - Location: Boiler Room B101
  - Uptime: 86.5 days
  - Connected via: Ethernet1/40 and 1/46
  - OSPF VLAN: 620

### Epworth Building

- Connected via: Ethernet1/45
- OSPF VLAN: 616
- VLANs: 772-775

### Student Living Center

- SWA-SLC151 (192.168.2.175)
  - Location: SLC SLC151
  - Uptime: 18.7 days
  - OSPF VLAN: 618
  - VLANs: 200-204

### Cosmetology Building

- SW-COS109-Aruba (192.168.2.171)
  - Location: Cosmo COS109
  - Uptime: 91.0 days
  - OSPF VLAN: 627

### Student Living Buildings

- SWA-SLG (192.168.2.179)

  - Location: SLG Switch G
  - Uptime: 91.8 days
- SWA-SLJ (192.168.2.181)

  - Location: Tech Dorms J
  - Uptime: 91.7 days
- SWA-SLR (192.168.2.182)

  - Location: Tech Dorm SLR
  - Uptime: 91.7 days
- SWA-SLS (192.168.2.183)

  - Location: Student Living SLS
  - Uptime: 91.7 days
- SWA-SLT (192.168.2.184)

  - Location: Student Living SLT
  - Uptime: 91.1 days\

### FortiGate Firewall

- Hostname: Fortigate1-sccc
- IP: 192.168.1.1
- Monitoring: SNMP v3
- Metrics: Sessions, CPU, Memory, Interface Stats

### SNMP Settings

- Version: SNMPv3
- Auth Protocol: SHA
- Priv Protocol: AES
- Collection Interval: 60s
- Metrics:
  - Interface Status
  - CPU/Memory Usage
  - Error Counters
  - Traffic Statistics
  - System Information

Aruba
description

location

ip

name

uptime_days
"Aruba 6300 AA148"
"Hobble AA148"
192.168.2.40
6100
55.8
"Aruba 6300 Hobble A144"
"Hobble A144 "
192.168.2.201
SW-A144-1-aruba
180
"Aruba 6300 A144 Switch 2"
"Hobble A144 Switch 2"
192.168.2.202
SW-A144-2-Aruba
181
"Aruba 6300 Boiler Room"
"Boiler Room B101"
192.168.2.196
SW-B101-Aruba
86.5
"Aruba 6300 Switch Cosmo"
"Cosmo COS109"
192.168.2.171
SW-COS109-Aruba
91.0
"Aruba 6300 Maintenance M-201"
"Maintenance M-201"
192.168.2.205
SW-M201-1
37.8
"Aruba 6300 Softball"
"Softball Field"
192.168.2.204
SW-SoftBallPB
163
"Aruba 6300 HR AA105"
"Hobble HR AA105"
192.168.2.199
SWA-AA105
51.1
"Aruba 6300 Switch 0"
"Hobble AA152 Switch 0"
192.168.2.1
SWA-AA144-Access
103
"Aruba 6300 SLC151"
"SLC SLC151"
192.168.2.175
SWA-SLC151
18.7
"Aruba 6300 SWA-SLG G"
"SLG Switch G"
192.168.2.179
SWA-SLG
91.8
"Aruba 6300 Dorm J"
"Tech Dorms J Aruba"
192.168.2.181
SWA-SLJ
91.7
"Aruba 6300 SLR"
"Tech Dorm SLR"
192.168.2.182
SWA-SLR
91.7
"Aruba 6300 SLS"
"Student Living SLS"
192.168.2.183
SWA-SLS
91.7
"Aruba 6300 SLT"
"Student Living SLT"
192.168.2.184
SWA-SLT
91.1
"Aruba 6300 SW 121"
"Student Union SW121"
192.168.2.200
SWA-SU121
353

Cisco Nexus 9000 Fiber
"udp://192.168.2.71:161" swa-aa144-A24.sccc.edu
"udp://192.168.2.70:161" swa-aa144-A48.sccc.edu

Located Hobble

Firewall
sysname Fortigate1-sccc
IP "udp://192.168.1.1:161"
