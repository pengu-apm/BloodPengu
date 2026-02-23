# BloodPengu Usage Guide

BloodPengu is a Linux Attack path management to help Blue-Teams to closed a vulnerability, and help Adversaries to execute potential vulnerable system on Linux and Unix based system.

Here's how to run and use BloodPengu Project.

## Starting the Server

```bash
cd BloodPengu/server
go run main.go
```

Server runs on `http://localhost:6060`

## Importing Data

- Drag & Drop: Drop PyPengu JSON file anywhere on the graph
- Import Button: Click "+ Import JSON" in top-right

## Queries

_Sidebar to Attack Queries:_

- All Paths to Root
- Shortest Path to Root
- Sudo Misconfigs
- SUID Binaries
- Docker Escapes
- Writable Services/Crons
- Kernel Exploits

## Node Details

_Click any node or edge to see:_

- Properties
- Connections
- Exploit snippets (with copy button)
- GTFOBins/CVE links

## Search

_Top bar search supports:_

- Node names
- Node types
- UID/GID values

## Tips

- Use _Reset View_ to clear highlighting
- _Right panel_ slides in on node/edge click
- _Status dot_ for data loaded
- Demo data loads automatically on first visit
