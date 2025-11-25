{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": {
          "type": "datasource",
          "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
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
  "id": null,
  "links": [],
  "liveNow": false,
  "panels": [
    {
      "type": "fruther-image-panel",
      "datasource": {
        "type": "influxdb",
        "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183"
      },
      "gridPos": {
        "h": 20,
        "w": 24,
        "x": 0,
        "y": 0
      },
      "id": 1,
      "options": {
        "elements": [
          {
            "color": "#e0b400",
            "displayName": "Aruba CPU - HALE",
            "element": {
              "options": {
                "content": "<div style=\"font-size:12px; font-weight:bold;\">CPU: {{value_cpu}}%</div><div style=\"font-size:10px;\">Throughput: {{value_if}} Gbps</div>",
                "displayMode": "html",
                "htmlMode": "markdown",
                "link": "/d/your_aruba_switch_dashboard?var-sysName=${ArubaSwitch}&from=$__from&to=$__to",
                "linkTarget": "_blank",
                "pointerEvents": true
              },
              "type": "Text"
            },
            "name": "aruba_hale_cpu_throughput",
            "position": {
              "x": 25,
              "y": 20
            },
            "style": {
              "backgroundColor": "rgba(30, 30, 30, 0.8)",
              "border": "1px solid rgba(0, 255, 0, 0.7)",
              "borderRadius": "5px",
              "padding": "5px",
              "width": "150px",
              "height": "auto"
            },
            "valueMapping": {
              "queries": [
                {
                  "query": "from(bucket: \"telegraf\") |> range(start: v.timeRange.start, stop: v.timeRange.stop) |> filter(fn: (r) => r._measurement == \"aruba_cpu\" and r.sysName == \"${ArubaSwitch}\") |> mean() |> yield(name:\"cpu\")",
                  "refId": "A"
                },
                {
                  "query": "from(bucket: \"telegraf\") |> range(start: v.timeRange.start, stop: v.timeRange.stop) |> filter(fn: (r) => r._measurement == \"interface\" and r.sysName == \"${ArubaSwitch}\" and r.ifName =~ /^(1\/1\/1|1\/1\/2)$/) |> derivative(unit: 1s, nonNegative: true, columns: [\"ifHCInOctets\", \"ifHCOutOctets\"]) |> map(fn: (r) => ({_time: r._time, _value: (float(r.ifHCInOctets) + float(r.ifHCOutOctets)) * 8.0 / 1000000000.0})) |> aggregateWindow(every: v.timeRange.interval, fn: mean) |> yield(name:\"if\")",
                  "refId": "B"
                }
              ],
              "template": "{ \"value_cpu\": \"{{A}}\", \"value_if\": \"{{B}}\" }"
            }
          },
          {
            "color": "#e0b400",
            "displayName": "Aruba CPU - COS",
            "element": {
              "options": {
                "content": "<div style=\"font-size:12px; font-weight:bold;\">CPU: {{value_cpu}}%</div><div style=\"font-size:10px;\">Throughput: {{value_if}} Gbps</div>",
                "displayMode": "html",
                "htmlMode": "markdown",
                "link": "/d/your_aruba_switch_dashboard?var-sysName=${ArubaSwitch2}&from=$__from&to=$__to",
                "linkTarget": "_blank",
                "pointerEvents": true
              },
              "type": "Text"
            },
            "name": "aruba_cos_cpu_throughput",
            "position": {
              "x": 30,
              "y": 30
            },
            "style": {
              "backgroundColor": "rgba(30, 30, 30, 0.8)",
              "border": "1px solid rgba(0, 255, 0, 0.7)",
              "borderRadius": "5px",
              "padding": "5px",
              "width": "150px",
              "height": "auto"
            },
            "valueMapping": {
              "queries": [
                {
                  "query": "from(bucket: \"telegraf\") |> range(start: v.timeRange.start, stop: v.timeRange.stop) |> filter(fn: (r) => r._measurement == \"aruba_cpu\" and r.sysName == \"${ArubaSwitch2}\") |> mean() |> yield(name:\"cpu\")",
                  "refId": "A"
                },
                {
                  "query": "from(bucket: \"telegraf\") |> range(start: v.timeRange.start, stop: v.timeRange.stop) |> filter(fn: (r) => r._measurement == \"interface\" and r.sysName == \"${ArubaSwitch2}\" and r.ifName =~ /^(1\/1\/1|1\/1\/2)$/) |> derivative(unit: 1s, nonNegative: true, columns: [\"ifHCInOctets\", \"ifHCOutOctets\"]) |> map(fn: (r) => ({_time: r._time, _value: (float(r.ifHCInOctets) + float(r.ifHCOutOctets)) * 8.0 / 1000000000.0})) |> aggregateWindow(every: v.timeRange.interval, fn: mean) |> yield(name:\"if\")",
                  "refId": "B"
                }
              ],
              "template": "{ \"value_cpu\": \"{{A}}\", \"value_if\": \"{{B}}\" }"
            }
          },
          {
            "color": "#e0b400",
            "displayName": "Cisco CPU - CoreSW",
            "element": {
              "options": {
                "content": "<div style=\"font-size:12px; font-weight:bold;\">CPU: {{value_cpu}}%</div><div style=\"font-size:10px;\">Memory: {{value_mem}}%</div>",
                "displayMode": "html",
                "htmlMode": "markdown",
                "link": "/d/your_cisco_switch_dashboard?var-sysName=${CiscoSwitch}&from=$__from&to=$__to",
                "linkTarget": "_blank",
                "pointerEvents": true
              },
              "type": "Text"
            },
            "name": "cisco_coresw_cpu_mem",
            "position": {
              "x": 60,
              "y": 45
            },
            "style": {
              "backgroundColor": "rgba(30, 30, 30, 0.8)",
              "border": "1px solid rgba(0, 255, 0, 0.7)",
              "borderRadius": "5px",
              "padding": "5px",
              "width": "150px",
              "height": "auto"
            },
            "valueMapping": {
              "queries": [
                {
                  "query": "from(bucket: \"telegraf\") |> range(start: v.timeRange.start, stop: v.timeRange.stop) |> filter(fn: (r) => r._measurement == \"cisco_cpu\" and r.sysName == \"${CiscoSwitch}\") |> mean() |> yield(name:\"cpu\")",
                  "refId": "A"
                },
                {
                  "query": "from(bucket: \"telegraf\") |> range(start: v.timeRange.start, stop: v.timeRange.stop) |> filter(fn: (r) => r._measurement == \"cisco_memory_pool\" and r.sysName == \"${CiscoSwitch}\" and r.ciscoMemoryPoolName == \"Processor\") |> map(fn: (r) => ({_time: r._time, _value: (float(r.ciscoMemoryPoolUsed) / (float(r.ciscoMemoryPoolUsed) + float(r.ciscoMemoryPoolFree))) * 100.0})) |> aggregateWindow(every: v.timeRange.interval, fn: mean) |> yield(name:\"mem\")",
                  "refId": "B"
                }
              ],
              "template": "{ \"value_cpu\": \"{{A}}\", \"value_mem\": \"{{B}}\" }"
            }
          }
          // Add more elements here for each device, copying the structure above
          // You will need to manually adjust 'position.x' and 'position.y' for each element
          // and update 'sysName' filter to match your actual switch names.
          // Example for a graphical mini-panel:
          /*
          {
            "color": "#e0b400",
            "displayName": "Aruba CPU Graph - HALE",
            "element": {
              "options": {
                "content": null,
                "displayMode": "graph",
                "graphPanel": {
                  "id": 2, // Must be unique if you copy/paste
                  "gridPos": { "h": 5, "w": 10 },
                  "type": "timeseries",
                  "targets": [
                    {
                      "datasource": { "type": "influxdb", "uid": "your_influxdb_uid" },
                      "query": "from(bucket: \"telegraf\") |> range(start: v.timeRange.start, stop: v.timeRange.stop) |> filter(fn: (r) => r._measurement == \"aruba_cpu\" and r.sysName == \"${ArubaSwitch}\") |> mean() |> yield(name:\"cpu\")",
                      "refId": "A"
                    }
                  ],
                  "options": {
                    "legend": { "displayMode": "hidden" },
                    "tooltip": { "mode": "single" },
                    "graph_draw_mode": "line"
                  }
                },
                "link": "/d/your_aruba_switch_dashboard?var-sysName=${ArubaSwitch}&from=$__from&to=$__to",
                "linkTarget": "_blank",
                "pointerEvents": true
              },
              "type": "GrafanaPanel"
            },
            "name": "aruba_hale_cpu_graph",
            "position": {
              "x": 25,
              "y": 25
            },
            "style": {
              "width": "150px",
              "height": "80px",
              "backgroundColor": "rgba(30, 30, 30, 0.8)",
              "border": "1px solid rgba(0, 255, 0, 0.7)",
              "borderRadius": "5px"
            }
          }
          */
        ],
        "image": {
          "url": "YOUR_CAMPUS_MAP_IMAGE_URL_HERE" // <-- **IMPORTANT: Replace with your image URL**
        },
        "mode": "dynamic",
        "scale": "fixed"
      },
      "pluginVersion": "8.0.0",
      "title": "Campus Network Overview Map"
    }
  ],
  "schemaVersion": 38,
  "style": "dark",
  "tags": ["network", "overview", "campus", "snmp"],
  "templating": {
    "list": [
      {
        "current": {
          "text": "All",
          "value": [
            "$__all"
          ]
        },
        "hide": 0,
        "includeAll": true,
        "multi": true,
        "name": "ArubaSwitch",
        "options": [],
        "query": "import \"influxdata/influxdb/schema\"\n\nfrom(bucket: \"telegraf\")\n  |> range(start: v.timeRange.start)\n  |> filter(fn: (r) => r._measurement == \"aruba_cpu\")\n  |> keep(columns: [\"sysName\"])\n  |> distinct(column: \"sysName\")\n  |> sort()",
        "refresh": 1,
        "regex": "",
        "skipUrlSync": false,
        "type": "query"
      },
      {
        "current": {
          "text": "All",
          "value": [
            "$__all"
          ]
        },
        "hide": 0,
        "includeAll": true,
        "multi": true,
        "name": "ArubaSwitch2",
        "options": [],
        "query": "import \"influxdata/influxdb/schema\"\n\nfrom(bucket: \"telegraf\")\n  |> range(start: v.timeRange.start)\n  |> filter(fn: (r) => r._measurement == \"aruba_cpu\")\n  |> keep(columns: [\"sysName\"])\n  |> distinct(column: \"sysName\")\n  |> sort()",
        "refresh": 1,
        "regex": "",
        "skipUrlSync": false,
        "type": "query"
      },
      {
        "current": {
          "text": "All",
          "value": [
            "$__all"
          ]
        },
        "hide": 0,
        "includeAll": true,
        "multi": true,
        "name": "CiscoSwitch",
        "options": [],
        "query": "import \"influxdata/influxdb/schema\"\n\nfrom(bucket: \"telegraf\")\n  |> range(start: v.timeRange.start)\n  |> filter(fn: (r) => r._measurement == \"cisco_cpu\")\n  |> keep(columns: [\"sysName\"])\n  |> distinct(column: \"sysName\")\n  |> sort()",
        "refresh": 1,
        "regex": "",
        "skipUrlSync": false,
        "type": "query"
      }
    ]
  },
  "time": {
    "from": "now-1h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "Campus Network Overview - Map View",
  "uid": "your_unique_dashboard_uid",
  "version": 1
}