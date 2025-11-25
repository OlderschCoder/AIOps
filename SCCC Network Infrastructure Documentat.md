# SCCC Network Infrastructure Documentation

> References:
> 1. Network Configuration Guide v2.1
> 2. SNMP Monitoring Standards 2025

## 1. Core Network Infrastructure

### 1.1 Core Switches (Hobble Building)

#### Primary Core Switch
| Component | Value |
|-----------|--------|
| Hostname | sw-aa144-A48 |
| IP Address | 192.168.2.70 |
| Location | Hobble AA144 |
| Version | 10.2(6) |
| Features | OSPF, PIM, LACP, DHCP, VPC, LLDP |
| Monitoring | SNMP v3 |

#### Secondary Core Switch
| Component | Value |
|-----------|--------|
| Hostname | sw-aa144-A24 |
| IP Address | 192.168.2.71 |
| Location | Hobble AA144 |
| Monitoring | SNMP v3 |

## 2. Distribution Layer

### 2.1 Administrative Buildings

#### Hobble Building Switches
1. **SW-A144-1-aruba**
   - IP: 192.168.2.201
   - Location: Hobble A144
   - Uptime: 180 days
   - Connected to: sw-aa144-A48

2. **SW-A144-2-Aruba**
   - IP: 192.168.2.202
   - Location: Hobble A144 Switch 2
   - Uptime: 181 days

3. **SWA-AA105**
   - IP: 192.168.2.199
   - Location: Hobble HR AA105
   - Uptime: 51.1 days
   - Connected to: sw-aa144-A48

### 2.2 Academic Buildings

#### Humanities Building
- **SW-H128-TEST & SW-H128-PRIM**
  - Connectivity: Ethernet1/11 and 1/13
  - VLANs: 200-204, 304, 351-353, 375, 402-405

#### Creative Arts (CAH)
- **SW-CAH144**
  - Connectivity: Ethernet1/14
  - VLANs: 200-204, 322, 350-353, 375, 402

#### Sharp Building
- Connectivity: Ethernet1/28
- OSPF VLAN: 624

#### B Building (Boiler Room)
- **SW-B101-Aruba**
  - IP: 192.168.2.196
  - Location: Boiler Room B101
  - Uptime: 86.5 days
  - Connectivity: Ethernet1/40 and 1/46
  - OSPF VLAN: 620

#### Epworth Building
- Connectivity: Ethernet1/45
- OSPF VLAN: 616
- VLANs: 772-775

#### Cosmetology Building
- **SW-COS109-Aruba**
  - IP: 192.168.2.171
  - Location: Cosmo COS109
  - Uptime: 91.0 days
  - OSPF VLAN: 627

## 3. Student Living Infrastructure

### 3.1 Student Living Center
- **SWA-SLC151**
  - IP: 192.168.2.175
  - Location: SLC SLC151
  - Uptime: 18.7 days
  - OSPF VLAN: 618
  - VLANs: 200-204

### 3.2 Residential Buildings
| Switch Name | IP Address | Location | Uptime (days) |
|-------------|------------|-----------|---------------|
| SWA-SLG | 192.168.2.179 | SLG Switch G | 91.8 |
| SWA-SLJ | 192.168.2.181 | Tech Dorms J | 91.7 |
| SWA-SLR | 192.168.2.182 | Tech Dorm SLR | 91.7 |
| SWA-SLS | 192.168.2.183 | Student Living SLS | 91.7 |
| SWA-SLT | 192.168.2.184 | Student Living SLT | 91.1 |

## 4. Additional Facilities

### 4.1 Maintenance Building
- **SW-M201-1**
  - IP: 192.168.2.205
  - Location: Maintenance M-201
  - Uptime: 37.8 days

### 4.2 Student Union
- **SWA-SU121**
  - IP: 192.168.2.200
  - Location: Student Union SW121
  - Uptime: 353 days

### 4.3 Athletic Facilities
- **SW-SoftBallPB**
  - IP: 192.168.2.204
  - Location: Softball Field
  - Uptime: 163 days

## 5. Security Infrastructure

### 5.1 FortiGate Firewall
| Component | Value |
|-----------|--------|
| Hostname | Fortigate1-sccc |
| IP Address | 192.168.1.1 |
| Monitoring | SNMP v3 |
| Metrics | Sessions, CPU, Memory, Interface Stats |

## 6. Network Monitoring Configuration

### 6.1 SNMP Settings
| Setting | Value |
|---------|--------|
| Version | SNMPv3 |
| Auth Protocol | SHA |
| Priv Protocol | AES |
| Collection Interval | 60s |

### 6.2 Monitored Metrics
- Interface Status
- CPU/Memory Usage
- Error Counters
- Traffic Statistics
- System Information