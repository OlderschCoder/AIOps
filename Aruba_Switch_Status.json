{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": { "type": "-- Grafana --", "uid": "grafana" },
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
  "links": [],
  "liveNow": false,
  "panels": [
    {
      "type": "table",
      "title": "Aruba Switch Health",
      "gridPos": { "x": 0, "y": 0, "w": 24, "h": 10 },
      "id": 1,
      "datasource": { "type": "influxdb", "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183" },
      "targets": [
        {
          "refId": "A",
          "queryType": "flux",
          "query": "import \"strings\"\n\n// Aruba list (by source)\naruba =\nfrom(bucket: \"telegraf\")\n  |> range(start: -30d)\n  |> filter(fn: (r) => r._measurement == \"snmp\" and r._field == \"sysDescr\")\n  |> map(fn: (r) => ({ r with _value: string(v: r._value) }))\n  |> group(columns: [\"source\"]) |> last()\n  |> filter(fn: (r) => strings.containsStr(v: r._value, substr: \"Aruba\"))\n  |> keep(columns: [\"source\"]) \n\n// Names via sysUpTime rows (sysName tag)\nnames_base =\nfrom(bucket: \"telegraf\")\n  |> range(start: -30d)\n  |> filter(fn: (r) => r._measurement == \"snmp\" and r._field == \"sysUpTime\")\n  |> group(columns: [\"source\",\"sysName\"]) |> last()\n  |> map(fn: (r) => ({ r with name: string(v: r.sysName) }))\n  |> keep(columns: [\"source\",\"name\"])\n\nnames = join(tables: {a: names_base, b: aruba}, on: [\"source\"], method: \"inner\")\n\n// Admin/Oper UP counts (Aruba interfaces)\nadm_all =\nfrom(bucket: \"telegraf\")\n  |> range(start: -5m)\n  |> filter(fn: (r) => r._measurement == \"interface_legacy\" and r._field == \"ifAdminStatus\")\n  |> group(columns: [\"source\",\"ifDescr\"]) |> last()\n  |> filter(fn: (r) => int(v: r._value) == 1)\n  |> group(columns: [\"source\"]) |> count()\n  |> rename(columns: {_value: \"admin_up\"})\n\nopr_all =\nfrom(bucket: \"telegraf\")\n  |> range(start: -5m)\n  |> filter(fn: (r) => r._measurement == \"interface_legacy\" and r._field == \"ifOperStatus\")\n  |> group(columns: [\"source\",\"ifDescr\"]) |> last()\n  |> filter(fn: (r) => int(v: r._value) == 1)\n  |> group(columns: [\"source\"]) |> count()\n  |> rename(columns: {_value: \"oper_up\"})\n\nadm = join(tables: {a: adm_all, b: aruba}, on: [\"source\"], method: \"inner\")\nopr = join(tables: {a: opr_all, b: aruba}, on: [\"source\"], method: \"inner\")\n\nports = join(tables: {a: adm, b: opr}, on: [\"source\"], method: \"inner\")\n  |> map(fn: (r) => ({ r with down_ports: max(x: float(v: r.admin_up) - float(v: r.oper_up), y: 0.0) }))\n  |> keep(columns: [\"source\",\"admin_up\",\"oper_up\",\"down_ports\"])\n\n// Uptime (days) per device\nuptime =\nfrom(bucket: \"telegraf\")\n  |> range(start: -30d)\n  |> filter(fn: (r) => r._measurement == \"snmp\" and r._field == \"sysUpTime\")\n  |> group(columns: [\"source\"]) |> last()\n  |> map(fn: (r) => ({ r with uptime_days: float(v: r._value) / 100.0 / 86400.0 }))\n  |> keep(columns: [\"source\",\"uptime_days\"])\n\nbase = join(tables: {a: names, b: uptime}, on: [\"source\"], method: \"left\")\nfinal = join(tables: {a: base, b: ports}, on: [\"source\"], method: \"inner\")\n  |> map(fn: (r) => ({ r with ip: r.source, name: if r.name == \"\" then r.source else r.name,\n                       health_score: if r.down_ports > 0.0 then 1.0 else 0.0 }))\n  |> keep(columns: [\"ip\",\"name\",\"uptime_days\",\"admin_up\",\"oper_up\",\"down_ports\",\"health_score\"])\n  |> group()\n  |> sort(columns: [\"down_ports\",\"ip\"], desc: true)\n\nfinal"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "custom": { "align": "auto" },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              { "color": "green", "value": null },
              { "color": "yellow", "value": 1 }
            ]
          }
        },
        "overrides": [
          {
            "matcher": { "id": "byName", "options": "health_score" },
            "properties": [
              { "id": "custom.cellOptions", "value": { "type": "color-background" } }
            ]
          }
        ]
      },
      "options": { "showHeader": true, "cellHeight": "sm" }
    },
    {
      "type": "table",
      "title": "Aruba Interface Status (${ip})",
      "gridPos": { "x": 0, "y": 10, "w": 24, "h": 10 },
      "id": 2,
      "datasource": { "type": "influxdb", "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183" },
      "targets": [
        {
          "refId": "A",
          "queryType": "flux",
          "query": "ipFilter = \"${ip}\"\npassAll  = ipFilter == \"\" or ipFilter == \"*\"\n\nfrom(bucket: \"telegraf\")\n  |> range(start: -5m)\n  |> filter(fn: (r) =>\n    r._measurement == \"interface_legacy\" and\n    (r._field == \"ifAdminStatus\" or r._field == \"ifOperStatus\") and\n    (passAll or r.source == ipFilter)\n  )\n  |> group(columns: [\"source\",\"ifDescr\"]) |> last()\n  |> pivot(rowKey: [\"source\",\"ifDescr\"], columnKey: [\"_field\"], valueColumn: \"_value\")\n  |> map(fn: (r) => ({\n      r with iface: string(v: r.ifDescr),\n      admin: if exists r.ifAdminStatus then int(v: r.ifAdminStatus) else 0,\n      oper:  if exists r.ifOperStatus then int(v: r.ifOperStatus) else 0\n  }))\n  |> map(fn: (r) => ({\n      r with status:\n        if r.admin == 1 and r.oper == 1 then \"up\"\n        else if r.admin == 1 and r.oper != 1 then \"issue\"\n        else \"not_configured\"\n  }))\n  |> keep(columns: [\"source\",\"iface\",\"status\",\"admin\",\"oper\"]) \n  |> sort(columns: [\"iface\"])"
        }
      ],
      "fieldConfig": {
        "defaults": { "custom": { "align": "auto" } },
        "overrides": []
      },
      "options": { "showHeader": true, "cellHeight": "sm" }
    }
  ],
  "schemaVersion": 37,
  "style": "dark",
  "tags": ["influx", "aruba", "switch"],
  "templating": {
    "list": [
      {
        "type": "query",
        "name": "ip",
        "label": "Aruba IP",
        "hide": 0,
        "datasource": { "type": "influxdb", "uid": "a52e8ae9-7f83-4e83-bc5d-b97ed5f7e183" },
        "query": "import \"strings\"\nfrom(bucket: \"telegraf\")\n  |> range(start: -30d)\n  |> filter(fn: (r) => r._measurement == \"snmp\" and r._field == \"sysDescr\")\n  |> map(fn: (r) => ({ r with _value: string(v: r._value) }))\n  |> group(columns: [\"source\"]) |> last()\n  |> filter(fn: (r) => strings.containsStr(v: r._value, substr: \"Aruba\"))\n  |> keep(columns: [\"source\"]) |> group() |> distinct(column: \"source\")\n  |> rename(columns: {source: \"_value\"})",
        "refresh": 2,
        "includeAll": false,
        "multi": false,
        "sort": 1
      }
    ]
  },
  "time": { "from": "now-6h", "to": "now" },
  "timepicker": {},
  "timezone": "",
  "title": "Aruba Status (InfluxDB)",
  "version": 1,
  "weekStart": ""
}