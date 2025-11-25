{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": {
          "type": "grafana",
          "uid": "-- Grafana --"
        },
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "fiscalYearStartMonth": 0,
  "graphTooltip": 0,
  "id": 20,
  "links": [],
  "liveNow": false,
  "panels": [
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              },
              {
                "color": "#EAB839",
                "value": 90
              },
              {
                "color": "#6ED0E0",
                "value": 100
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 6,
        "w": 8,
        "x": 0,
        "y": 0
      },
      "id": 20,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "mode": "single",
          "sort": "none"
        }
      },
      "pluginVersion": "10.2.2",
      "targets": [
        {
          "datasource": {
            "type": "influxdb",
            "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
          },
          "query": "from(bucket: \"telegraf\")\r\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\r\n  |> filter(fn: (r) =>\r\n    r._measurement == \"snmp\" and\r\n    (r._field == \"fgSysSesCount\" or r._field == \"fgSysCpuUsage\" or r._field == \"fgSysMemUsage\")\r\n  )\r\n  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\r\n  |> keep(columns: [\"_time\",\"_value\",\"_field\"])",
          "refId": "A"
        }
      ],
      "title": "Fortigate Health",
      "type": "timeseries"
    },
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "percentage",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "semi-dark-green",
                "value": 80
              },
              {
                "color": "#EAB839",
                "value": 90
              },
              {
                "color": "#6ED0E0",
                "value": 100
              }
            ]
          },
          "unit": "none"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 6,
        "w": 5,
        "x": 8,
        "y": 0
      },
      "id": 8,
      "options": {
        "minVizHeight": 75,
        "minVizWidth": 75,
        "orientation": "vertical",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "/^uptime_days$/",
          "values": true
        },
        "showThresholdLabels": false,
        "showThresholdMarkers": true
      },
      "pluginVersion": "10.2.2",
      "targets": [
        {
          "datasource": {
            "type": "influxdb",
            "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
          },
          "query": "names_base = from(bucket: \"telegraf\")\n  |> range(start: -1h)\n  |> filter(fn: (r) => r._measurement == \"snmp\" and r._field == \"sysUpTime\" and (r.source == \"192.168.2.70\" or r.source == \"192.168.2.71\" or r.source == \"192.168.2.72\" or r.source == \"192.168.2.73\"))\n  |> group(columns: [\"source\"]) |> last()\n  |> map(fn: (r) => ({ r with name: if exists r.sysName then string(v: r.sysName) else r.source }))\n  |> keep(columns: [\"source\", \"name\"])\n\nadm_all = from(bucket: \"telegraf\")\n  |> range(start: -5m)\n  |> filter(fn: (r) => r._measurement == \"if_status_errors\" and r._field == \"ifAdminStatus\" and (r.source == \"192.168.2.70\" or r.source == \"192.168.2.71\" or r.source == \"192.168.2.72\" or r.source == \"192.168.2.73\"))\n  |> filter(fn: (r) => int(v: r._value) == 1)\n  |> group(columns: [\"source\"]) |> count()\n  |> rename(columns: {_value: \"admin_up\"})\n\nopr_all = from(bucket: \"telegraf\")\n  |> range(start: -5m)\n  |> filter(fn: (r) => r._measurement == \"if_status_errors\" and r._field == \"ifOperStatus\" and (r.source == \"192.168.2.70\" or r.source == \"192.168.2.71\" or r.source == \"192.168.2.72\" or r.source == \"192.168.2.73\"))\n  |> filter(fn: (r) => int(v: r._value) == 1)\n  |> group(columns: [\"source\"]) |> count()\n  |> rename(columns: {_value: \"oper_up\"})\n\nports = join(tables: {a: adm_all, b: opr_all}, on: [\"source\"])\n  |> map(fn: (r) => ({ r with down_ports: if float(v: r.admin_up) - float(v: r.oper_up) < 0.0 then 0.0 else float(v: r.admin_up) - float(v: r.oper_up) }))\n  |> keep(columns: [\"source\", \"admin_up\", \"oper_up\", \"down_ports\"])\n\nuptime = from(bucket: \"telegraf\")\n  |> range(start: -1h)\n  |> filter(fn: (r) => r._measurement == \"snmp\" and r._field == \"sysUpTime\" and (r.source == \"192.168.2.70\" or r.source == \"192.168.2.71\" or r.source == \"192.168.2.72\" or r.source == \"192.168.2.73\"))\n  |> group(columns: [\"source\"]) |> last()\n  |> map(fn: (r) => ({ r with uptime_days: float(v: r._value) / 100.0 / 86400.0 }))\n  |> keep(columns: [\"source\", \"uptime_days\"])\n\nbase = join(tables: {a: names_base, b: uptime}, on: [\"source\"])\nfinal = join(tables: {a: base, b: ports}, on: [\"source\"])\n  |> map(fn: (r) => ({ r with ip: r.source, name: if r.name == \"\" then r.source else r.name, health_score: if r.down_ports > 0.0 then 1.0 else 0.0, connected: true }))\n  |> keep(columns: [\"ip\", \"name\", \"uptime_days\", \"admin_up\", \"oper_up\", \"down_ports\", \"health_score\", \"connected\"])\n  |> group()\n  |> sort(columns: [\"down_ports\", \"ip\"], desc: true)\n\nfinal",
          "queryType": "flux",
          "refId": "A"
        }
      ],
      "title": "Nexus 9000 Health",
      "type": "gauge"
    },
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              }
            ]
          }
        },
        "overrides": [
          {
            "matcher": {
              "id": "byName",
              "options": "AvgUptimeDays"
            },
            "properties": [
              {
                "id": "thresholds",
                "value": {
                  "mode": "absolute",
                  "steps": [
                    {
                      "color": "green",
                      "value": null
                    },
                    {
                      "color": "red",
                      "value": 0
                    },
                    {
                      "color": "#EAB839",
                      "value": 7
                    },
                    {
                      "color": "#6ED0E0",
                      "value": 14
                    }
                  ]
                }
              }
            ]
          }
        ]
      },
      "gridPos": {
        "h": 4,
        "w": 4,
        "x": 13,
        "y": 0
      },
      "id": 21,
      "options": {
        "colorMode": "background",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "vertical",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "/^Count$/",
          "values": true
        },
        "textMode": "value_and_name",
        "wideLayout": true
      },
      "pluginVersion": "10.2.2",
      "targets": [
        {
          "datasource": {
            "type": "influxdb",
            "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
          },
          "query": "from(bucket: \"telegraf\")\r\n  |> range(start: -30m)\r\n  |> filter(fn: (r) =>\r\n    r._measurement == \"snmp\" and\r\n    r._field == \"sysUpTime\" and\r\n    r.sysName !~ /^[0-9]+$/ and\r\n    (exists r.sysDescr or exists r.sysName)\r\n  )\r\n  |> group(columns: [\"sysName\"])\r\n  |> last()\r\n  |> map(fn: (r) => ({\r\n    sysName: r.sysName,\r\n    sysDescr: if exists r.sysDescr then string(v: r.sysDescr) else \"\",\r\n    age_sec: float(v: uint(v: now()) - uint(v: r._time)) / 1000000000.0,\r\n    uptime_days: float(v: r._value) / 8640000.0\r\n  }))\r\n  |> map(fn: (r) => {\r\n    sev = if r.uptime_days < 1.0 then 2\r\n      else if r.uptime_days < 7.0 then 1\r\n      else 0\r\n    label = if r.sysDescr =~ /Aruba/ then \"Aruba Switches\"\r\n      else if r.sysDescr =~ /Cisco.*(Nexus|NX-OS)/ then \"Cisco Nexus 9K\"\r\n      else if r.sysName == \"Switch-0\" then \"Switch 0\"\r\n      else if r.sysName == \"Fortigate1-Sccc\" then \"Firewall\"\r\n      else \"Other\"\r\n    return {\r\n      Group: label,\r\n      severity: sev,\r\n      uptime_days: r.uptime_days\r\n    }\r\n  })\r\n  |> group(columns: [\"Group\"])\r\n  |> reduce(\r\n    identity: { Group: \"\", count: 0, max_sev: 0, sum_uptime: 0.0 },\r\n    fn: (r, accumulator) => ({\r\n      Group: r.Group,\r\n      count: accumulator.count + 1,\r\n      max_sev: if r.severity > accumulator.max_sev then r.severity else accumulator.max_sev,\r\n      sum_uptime: accumulator.sum_uptime + r.uptime_days\r\n    })\r\n  )\r\n  |> group(columns: [])  // ← KEY FIX: Merge all groups into one table\r\n  |> map(fn: (r) => ({\r\n    Group: r.Group,\r\n    Count: r.count,\r\n    AvgUptimeDays: if r.count > 0 then r.sum_uptime / float(v: r.count) else 0.0\r\n  }))\r\n  |> keep(columns: [\"Group\", \"Count\", \"AvgUptimeDays\"])\r\n",
          "refId": "A"
        }
      ],
      "title": "Network Appliance",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              },
              {
                "color": "#EAB839",
                "value": 90
              },
              {
                "color": "#6ED0E0",
                "value": 100
              }
            ]
          },
          "unit": "bps"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 6,
        "w": 7,
        "x": 17,
        "y": 0
      },
      "id": 7,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": false
        },
        "tooltip": {
          "mode": "single",
          "sort": "none"
        }
      },
      "targets": [
        {
          "query": "from(bucket: \"telegraf\")\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  |> filter(fn: (r) => r._measurement == \"interface\")\n  |> filter(fn: (r) => r.sysName == \"Fortigate1-Sccc\")\n  |> filter(fn: (r) => r._field == \"ifInOctets\" or r._field == \"ifOutOctets\" or r._field == \"ifHCInOctets\" or r._field == \"ifHCOutOctets\")\n  |> derivative(unit: 1s, nonNegative: true)\n  |> map(fn: (r) => ({ r with _value: r._value * 8.0, dir: if r._field == \"ifInOctets\" or r._field == \"ifHCInOctets\" then \"download\" else \"upload\" }))\n  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  |> yield(name: \"wan_bps\")",
          "queryType": "flux",
          "refId": "A"
        }
      ],
      "title": "FortiGate WAN Throughput (bps)",
      "type": "timeseries"
    },
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "max": 100,
          "min": 0,
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              },
              {
                "color": "#EAB839",
                "value": 90
              },
              {
                "color": "#6ED0E0",
                "value": 100
              }
            ]
          },
          "unit": "percent"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 3,
        "w": 4,
        "x": 13,
        "y": 4
      },
      "id": 11,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "10.2.2",
      "targets": [
        {
          "datasource": {
            "type": "influxdb",
            "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
          },
          "query": "from(bucket: \"telegraf\")\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  |> filter(fn: (r) => r._measurement == \"fortigate_healthcheck_v2\")\n  |> filter(fn: (r) => r._field == \"packet_loss_pct\")\n  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  |> group()\n  |> mean(column: \"_value\")\n  |> last()",
          "queryType": "flux",
          "refId": "A"
        }
      ],
      "title": "Internet Packet Loss (%)",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 6,
        "w": 4,
        "x": 0,
        "y": 6
      },
      "id": 17,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "mode": "single",
          "sort": "none"
        }
      },
      "targets": [
        {
          "datasource": {
            "type": "influxdb",
            "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
          },
          "query": "from(bucket: \"telegraf\")\r\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\r\n  |> filter(fn: (r) =>\r\n    r._measurement == \"snmp\" and\r\n    r._field == \"fgSysMemUsage\" and\r\n    r.sysName == \"Fortigate1-Sccc\"\r\n  )\r\n  |> map(fn: (r) => ({\r\n      r with _value:\r\n        if float(v: r._value) <= 1.0 then float(v: r._value) * 100.0 else float(v: r._value)\r\n  }))\r\n  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\r\n  |> yield(name: \"mem_percent\")\r\n",
          "refId": "A"
        }
      ],
      "title": "Fortigate Memory Utilisation",
      "type": "timeseries"
    },
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "percentage",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "orange",
                "value": 70
              },
              {
                "color": "red",
                "value": 85
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 6,
        "w": 4,
        "x": 4,
        "y": 6
      },
      "id": 16,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "mode": "single",
          "sort": "none"
        }
      },
      "pluginVersion": "10.2.2",
      "targets": [
        {
          "datasource": {
            "type": "influxdb",
            "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
          },
          "query": "from(bucket: \"telegraf\")\r\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\r\n  |> filter(fn: (r) =>\r\n    r._measurement == \"snmp\" and\r\n    r._field == \"fgSysCpuUsage\" and\r\n    r.sysName == \"Fortigate1-Sccc\"         // e.g., Fortigate1-Sccc\r\n  )\r\n  |> map(fn: (r) => ({\r\n      r with _value:\r\n        if float(v: r._value) <= 1.0 then float(v: r._value) * 100.0 else float(v: r._value)\r\n  }))\r\n  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\r\n  |> yield(name: \"cpu_percent\")\r\n\r\n",
          "refId": "A"
        }
      ],
      "title": "Fortigate CPU Utilization",
      "type": "timeseries"
    },
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "continuous-GrYlRd"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              },
              {
                "color": "#EAB839",
                "value": 90
              },
              {
                "color": "#6ED0E0",
                "value": 100
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 7,
        "w": 5,
        "x": 8,
        "y": 6
      },
      "id": 2,
      "options": {
        "displayMode": "lcd",
        "minVizHeight": 10,
        "minVizWidth": 0,
        "namePlacement": "auto",
        "orientation": "horizontal",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showUnfilled": true,
        "valueMode": "color"
      },
      "pluginVersion": "10.2.2",
      "targets": [
        {
          "datasource": {
            "type": "influxdb",
            "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
          },
          "query": "import \"math\"\n\nfrom(bucket: \"telegraf\")\n  |> range(start: -30m)\n  |> filter(fn: (r) => r._measurement == \"fortigate_healthcheck_v2\")\n  |> filter(fn: (r) => r._field == \"packet_loss_pct\" or r._field == \"latency_ms\")\n  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  |> group(columns: [\"hc_name\",\"ifName\",\"vdom\",\"_field\"])\n  |> last()\n  |> rename(columns: {hc_name:\"HealthCheck\", ifName:\"Interface\", vdom:\"VDOM\"})\n  |> map(fn: (r) => ({\n      r with _value:\n        if r._field == \"packet_loss_pct\"\n        then math.round(x: r._value * 100.0) / 100.0\n        else math.round(x: r._value)        // latency: nearest ms\n    }))\n  |> pivot(rowKey: [\"HealthCheck\",\"Interface\",\"VDOM\",\"_time\"], columnKey: [\"_field\"], valueColumn: \"_value\")\n  |> rename(columns: {packet_loss_pct:\"Packet Loss %\", latency_ms:\"Latency (ms)\"})\n  |> keep(columns: [\"_time\",\"HealthCheck\",\"Interface\",\"VDOM\",\"Packet Loss %\",\"Latency (ms)\"])\n",
          "queryType": "flux",
          "refId": "A"
        }
      ],
      "title": "Internet Latency (ms)",
      "type": "bargauge"
    },
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "continuous-GrYlRd"
          },
          "custom": {
            "fillOpacity": 80,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "lineWidth": 1
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 3,
        "w": 7,
        "x": 17,
        "y": 6
      },
      "id": 13,
      "options": {
        "bucketOffset": 0,
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": false
        }
      },
      "pluginVersion": "10.2.2",
      "targets": [
        {
          "query": "from(bucket: \"telegraf\")\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  |> filter(fn: (r) => r._measurement == \"snmp\" and r._field == \"sysUpTime\")\n  |> group(columns: [\"source\"])\n  |> last()\n  |> map(fn: (r) => ({ r with uptime_seconds: float(v: r._value) / 100.0, uptime_days: (float(v: r._value) / 100.0) / 86400.0 }))\n  |> keep(columns: [\"source\", \"sysName\", \"uptime_seconds\", \"uptime_days\"])\n  |> sort(columns: [\"sysName\", \"source\"], desc: false)",
          "queryType": "flux",
          "refId": "A"
        }
      ],
      "title": "SNMP Device Uptime",
      "type": "histogram"
    },
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "description": "",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "area"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "percentage",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              },
              {
                "color": "#EAB839",
                "value": 90
              },
              {
                "color": "#6ED0E0",
                "value": 100
              }
            ]
          },
          "unit": "bps"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 4,
        "w": 4,
        "x": 13,
        "y": 7
      },
      "id": 19,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": false
        },
        "tooltip": {
          "mode": "single",
          "sort": "none"
        }
      },
      "pluginVersion": "10.2.2",
      "targets": [
        {
          "datasource": {
            "type": "influxdb",
            "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
          },
          "query": "from(bucket: \"telegraf\")\r\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\r\n  |> filter(fn: (r) => r._measurement == \"interface\")\r\n  |> filter(fn: (r) => r._field == \"ifHCInOctets\" or r._field == \"ifHCOutOctets\")\r\n  |> filter(fn: (r) => r.ifName =~ /(?i)(port25|port9)/)\r\n  |> derivative(unit: 1s, nonNegative: true)\r\n  |> map(fn: (r) => ({ r with _value: r._value * 8.0, dir: if r._field == \"ifHCInOctets\" then \"in\" else \"out\" }))\r\n  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\r\n  |> keep(columns: [\"_time\",\"_value\",\"sysName\",\"ifName\",\"dir\"])",
          "refId": "A"
        }
      ],
      "title": "Fortigate WAN Throughput (BPS) ",
      "type": "timeseries"
    },
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "fieldConfig": {
        "defaults": {
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              },
              {
                "color": "#EAB839",
                "value": 90
              },
              {
                "color": "#6ED0E0",
                "value": 100
              }
            ]
          },
          "unit": "Bps"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 5,
        "w": 7,
        "x": 17,
        "y": 9
      },
      "id": 3,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "10.2.2",
      "targets": [
        {
          "datasource": {
            "type": "influxdb",
            "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
          },
          "query": "from(bucket: \"telegraf\")\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  |> filter(fn: (r) => r._measurement == \"interface_legacy\")\n  |> filter(fn: (r) => r._field == \"ifInOctets\" or r._field == \"ifOutOctets\")\n  |> derivative(unit: 1s, nonNegative: true)\n  |> map(fn: (r) => ({ r with _value: r._value * 8.0 }))  // bps\n  |> keep(columns: [\"_time\",\"_value\"])                    // drop all tags early\n  |> group()                                              // single group (all series)\n  |> aggregateWindow(every: 1m, fn: sum, createEmpty: false)\n  |> yield(name: \"total_bps\")",
          "queryType": "flux",
          "refId": "A"
        }
      ],
      "title": "Campus Backbone Load (bps)",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "fieldConfig": {
        "defaults": {
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "short"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 3,
        "w": 2,
        "x": 13,
        "y": 11
      },
      "id": 12,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "10.2.2",
      "targets": [
        {
          "datasource": {
            "type": "influxdb",
            "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
          },
          "query": "from(bucket: \"telegraf\")\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  |> filter(fn: (r) => r._measurement == \"snmp\")\n  |> filter(fn: (r) => r._field == \"sysUpTime\")\n  |> group(columns: [\"sysName\"])\n  |> last()\n  |> group()\n  |> count()",
          "queryType": "flux",
          "refId": "A"
        }
      ],
      "title": "# Reporting",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "fieldConfig": {
        "defaults": {
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "short"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 3,
        "w": 2,
        "x": 15,
        "y": 11
      },
      "id": 6,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "10.2.2",
      "targets": [
        {
          "datasource": {
            "type": "influxdb",
            "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
          },
          "query": "from(bucket: \"telegraf\")\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  |> filter(fn: (r) =>\n    r._measurement == \"snmp\" and\n    (r._field == \"fgSysSesCount\" or r._field == \"fgSysCpuUsage\" or r._field == \"fgSysMemUsage\")\n  )\n  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  |> keep(columns: [\"_time\",\"_value\",\"_field\"])",
          "queryType": "flux",
          "refId": "A"
        }
      ],
      "title": "FGT Health",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "fieldConfig": {
        "defaults": {
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              },
              {
                "color": "#EAB839",
                "value": 90
              },
              {
                "color": "#6ED0E0",
                "value": 100
              }
            ]
          },
          "unit": "short"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 7,
        "w": 8,
        "x": 0,
        "y": 12
      },
      "id": 4,
      "options": {
        "colorMode": "background",
        "graphMode": "none",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "10.2.2",
      "targets": [
        {
          "datasource": {
            "type": "influxdb",
            "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
          },
          "query": "from(bucket: \"telegraf\")\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  |> filter(fn: (r) => r._measurement == \"interface\")\n  |> filter(fn: (r) => r.sysName == \"Fortigate1-Sccc\")\n  |> filter(fn: (r) => r._field == \"ifOutOctets\" or r._field == \"ifHCOutOctets\")\n  |> derivative(unit: 1s, nonNegative: true)\n  |> map(fn: (r) => ({ r with _value: r._value * 8.0 }))\n  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  |> last()",
          "queryType": "flux",
          "refId": "A"
        }
      ],
      "title": "FGT WAN Upload (bps)",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "ms"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 7,
        "w": 5,
        "x": 8,
        "y": 13
      },
      "id": 10,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": false
        },
        "tooltip": {
          "mode": "single",
          "sort": "none"
        }
      },
      "pluginVersion": "10.2.2",
      "targets": [
        {
          "datasource": {
            "type": "influxdb",
            "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
          },
          "query": "from(bucket: \"telegraf\")\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  |> filter(fn: (r) => r._measurement == \"fortigate_healthcheck_v2\")\n  |> filter(fn: (r) => r._field == \"latency_ms\")\n  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  |> keep(columns: [\"_time\",\"_value\",\"hc_name\",\"ifName\",\"vdom\"])",
          "queryType": "flux",
          "refId": "A"
        }
      ],
      "title": "Internet Latency (ms) - Timeseries",
      "type": "timeseries"
    },
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "description": "",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "red",
                "value": null
              },
              {
                "color": "green",
                "value": 30
              },
              {
                "color": "purple",
                "value": 50
              },
              {
                "color": "semi-dark-blue",
                "value": 100
              }
            ]
          },
          "unit": "Kbits"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 6,
        "w": 11,
        "x": 13,
        "y": 14
      },
      "id": 18,
      "options": {
        "colorMode": "background_solid",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "10.2.2",
      "targets": [
        {
          "datasource": {
            "type": "influxdb",
            "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
          },
          "query": "from(bucket: \"telegraf\")\r\n  |> range(start: -5m)\r\n  |> filter(fn: (r) =>\r\n    r._measurement == \"interface\" and\r\n    (r._field == \"ifHCInBroadcastPkts\" or r._field == \"ifHCOutBroadcastPkts\")\r\n  )\r\n  |> derivative(unit: 1m, nonNegative: true)\r\n  |> group(columns: [\"_time\", \"source\"])\r\n  |> sum(column: \"_value\")\r\n  |> group(columns: [\"source\"])\r\n  |> last()\r\n  |> keep(columns: [\"source\", \"_value\"])\r\n  |> rename(columns: {source: \"ip\", _value: \"\"})",
          "refId": "A"
        }
      ],
      "title": "Device Total Broadcast PPS",
      "transparent": true,
      "type": "stat"
    },
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              },
              {
                "color": "#EAB839",
                "value": 90
              },
              {
                "color": "#6ED0E0",
                "value": 100
              }
            ]
          },
          "unit": "Bps"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 8,
        "x": 0,
        "y": 19
      },
      "id": 5,
      "options": {
        "minVizHeight": 75,
        "minVizWidth": 75,
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showThresholdLabels": false,
        "showThresholdMarkers": true
      },
      "pluginVersion": "10.2.2",
      "targets": [
        {
          "datasource": {
            "type": "influxdb",
            "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
          },
          "query": "from(bucket: \"telegraf\")\n  |> range(start: -30m)\n  |> filter(fn: (r) => r._measurement =~ /^(interface|interface_legacy)$/)\n  |> filter(fn: (r) => r.sysName =~ /(?i)Fortigate1-Sccc/ or r.source == \"192.168.1.1\")\n  |> filter(fn: (r) => r._field == \"ifHCInOctets\" or r._field == \"ifInOctets\")\n  |> derivative(unit: 1s, nonNegative: true)\n  |> map(fn: (r) => ({ r with _value: r._value * 8.0 }))   // bps\n  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  |> group(columns: [\"_time\"])\n  |> sum(column: \"_value\")\n  |> yield(name: \"fortigate_in_bps\")",
          "queryType": "flux",
          "refId": "A"
        }
      ],
      "title": "FGT WAN Download (bps)",
      "type": "gauge"
    },
    {
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "custom": {
            "align": "auto",
            "cellOptions": {
              "type": "auto"
            },
            "inspect": false
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              },
              {
                "color": "#EAB839",
                "value": 90
              },
              {
                "color": "#6ED0E0",
                "value": 100
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 15,
        "w": 16,
        "x": 8,
        "y": 20
      },
      "id": 15,
      "options": {
        "cellHeight": "sm",
        "footer": {
          "countRows": false,
          "fields": "",
          "reducer": [
            "sum"
          ],
          "show": false
        },
        "frameIndex": 1,
        "showHeader": true
      },
      "pluginVersion": "10.2.2",
      "targets": [
        {
          "datasource": {
            "type": "influxdb",
            "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
          },
          "query": "import \"strings\"\r\n\r\n// Aruba sources\r\naruba_src =\r\nfrom(bucket: \"telegraf\")\r\n  |> range(start: -30d)\r\n  |> filter(fn: (r) => r._measurement == \"snmp\" and (r._field == \"sysDescr\" or r._field == \"sysDescr_str\"))\r\n  |> map(fn: (r) => ({ r with _value: string(v: r._value) }))\r\n  |> group(columns: [\"source\",\"_field\"]) |> last()\r\n  |> filter(fn: (r) => strings.containsStr(v: r._value, substr: \"Aruba\"))\r\n  |> keep(columns: [\"source\"])\r\n\r\n// Description/location (pivot-safe)\r\nstrings_tbl =\r\nfrom(bucket: \"telegraf\")\r\n  |> range(start: -30d)\r\n  |> filter(fn: (r) =>\r\n    r._measurement == \"snmp\" and\r\n    (r._field == \"sysDescr\" or r._field == \"sysDescr_str\" or\r\n     r._field == \"sysLocation\" or r._field == \"syslocation\")\r\n  )\r\n  |> map(fn: (r) => ({ r with _value: string(v: r._value) }))\r\n  |> group(columns: [\"source\",\"sysName\",\"_field\"]) |> last()\r\n  |> group(columns: [\"source\",\"sysName\"])\r\n  |> pivot(rowKey: [\"sysName\",\"source\"], columnKey: [\"_field\"], valueColumn: \"_value\")\r\n  |> map(fn: (r) => ({\r\n      r with\r\n      description: if exists r.sysDescr then r.sysDescr else (if exists r.sysDescr_str then r.sysDescr_str else \"\"),\r\n      location:    if exists r.syslocation then r.syslocation else (if exists r.sysLocation then r.sysLocation else \"\")\r\n  }))\r\n  |> keep(columns: [\"sysName\",\"source\",\"description\",\"location\"])\r\n\r\n// Uptime (days) per source (no sysName dependency)\r\nuptime_tbl =\r\nfrom(bucket: \"telegraf\")\r\n  |> range(start: -30d)\r\n  |> filter(fn: (r) => r._measurement == \"snmp\" and r._field == \"sysUpTime\")\r\n  |> group(columns: [\"source\"]) |> last()\r\n  |> map(fn: (r) => ({ r with uptime_days: float(v: r._value) / 100.0 / 86400.0 }))\r\n  |> keep(columns: [\"source\",\"uptime_days\"])\r\n\r\n// Limit to Aruba, then join uptime\r\nab = join(tables: {a: strings_tbl, b: aruba_src}, on: [\"source\"])\r\nfinal =\r\njoin(tables: {a: ab, b: uptime_tbl}, on: [\"source\"])\r\n  |> rename(columns: {sysName: \"name\", source: \"ip\"})\r\n  |> keep(columns: [\"name\",\"location\",\"description\",\"ip\",\"uptime_days\"])\r\n  |> group(columns: [])\r\n  |> sort(columns: [\"name\",\"ip\"])\r\n  |> yield(name: \"devices\")",
          "refId": "A"
        }
      ],
      "title": "Devices Monitored",
      "type": "table"
    }
  ],
  "refresh": "2h",
  "schemaVersion": 38,
  "tags": [
    "LCARS",
    "Overview",
    "FortiGate",
    "Switching"
  ],
  "templating": {
    "list": [
      {
        "current": {
          "selected": false,
          "text": "All",
          "value": "$__all"
        },
        "datasource": {
          "type": "influxdb",
          "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
        },
        "definition": "",
        "hide": 0,
        "includeAll": true,
        "multi": true,
        "name": "device",
        "options": [],
        "query": "import \"influxdata/influxdb/v1\"\nv1.tagValues(bucket: \"telegraf\", tag: \"sysName\")",
        "refresh": 1,
        "regex": "",
        "skipUrlSync": false,
        "sort": 1,
        "type": "query"
      }
    ]
  },
  "time": {
    "from": "now-1h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "browser",
  "title": "A - SCCC Network Overview",
  "uid": "e7633483-9f63-4a1f-9d8e-84a516495483",
  "version": 72,
  "weekStart": ""
}