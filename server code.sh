 ps aux | grep telegraf
 sudo kill -TERM 289



 


 docker exec -e INFLUX_TOKEN=FJyv2E4WC_xNxF41zPvWCB4bYHEHD_lZ3R1sKv4Gfzc1HcPAMz-UQGkcMMD4-_mriZvDXNVAz-ERPcJfjBXXIA== influxdb influx delete --org SCCC --bucket telegraf  --start 1970-01-01T00:00:00Z --stop 2100-01-01T00:00:00Z  --predicate '_measurement="snmp"' AND _field="sysDescr"'



 docker exec -e INFLUX_TOKEN='YOUR_TOKEN' influxdb \
      influx delete --org SCCC --bucket telegraf \
      --start 1970-01-01T00:00:00Z --stop 2100-01-01T00:00:00Z \
      --predicate '_measurement="snmp" AND _field="sysDescr"'


BWHHN-6FFK2-6YCKK-K8CTY-K79XT