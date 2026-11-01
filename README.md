# Mushroom Logbook — Cordyceps Militaris (Agripie F43) HAOS Lab Console

A Home Assistant-friendly, local-first lab operations console and ISO/GMP SOP register suite for managing a commercial *Cordyceps militaris* (Strain: Agripie F43) cultivation workflow.

## Key Capabilities
- **SOP-CM-F43-V3 Calculator & Master Scaling**: Seed Culture (Liquid Spawn) scaling table (900 mL – 4800 mL + custom volume scaler), LSFM Broth scaling (1.0 L, 2.5 L, 5.0 L), and 400 mL Jar calculator (20 g dry rice : 30 mL LSFM broth : 10 mL filtered spore-dominant spawn).
- **SOP-CML-PD-01 (Petri Dish & Enriched PDA Register)**: Tracks `#AGAR-` batches, antibiotic additives, P1/P2/P3 transfers, Day 3/7/10 morphology checks, and QR stickers.
- **SOP-CML-LC-01 (Liquid Culture & Mandatory SS304 Sieve Filtration Gate)**: Tracks `#LC-` broth prep, rotary shaker RPM, Day 3/7 QC checks, and enforces the 200–1000 um SS304 mesh filtration gate to prevent early yellow-coat stroma inhibition.
- **SOP-CML-LOG-02 (Daily Autoclave & Next-Morning Inoculation Log)**: Logs 3 autoclave cycles/day (`#MB-`), next-morning inoculation (`#INOC-`), cleanroom checklist, 5-stage environmental milestones, and wet/dry Biological Efficiency (BE%).
- **58mm Thermal QR Label Generator & HA Sensor Integration**: Generates deterministic SVG QR codes formatted for 58mm thermal printers and captures live Home Assistant sensor snapshots (Temp, RH, CO2, Lux) with every logged activity.

## Repository Layout
```text
.
├── repository.yaml                  # HAOS Add-on Store repository descriptor
├── README.md
├── CHANGELOG.md
└── cordyceps_lab_console/           # Active Home Assistant Add-on
    ├── config.yaml                  # HAOS Add-on configuration (Ingress + HA API)
    ├── Dockerfile                   # Container build definition
    ├── run.sh                       # Container startup & Prisma SQLite migration
    ├── DOCS.md                      # Add-on documentation tab
    ├── package.json
    ├── prisma/
    │   └── schema.prisma            # SQLite data model
    ├── server/
    │   └── index.ts                 # Express + Zod API + HA Supervisor polling
    └── src/
        ├── App.tsx                  # Full F43 Operations Dashboard & SOP Suite
        ├── main.tsx
        └── index.css
```

## Installing on Home Assistant OS (HAOS)
1. Push this repository to `https://github.com/aman0069/mushroom-logbook`.
2. In Home Assistant, navigate to **Settings -> Add-ons -> Add-on Store -> Repositories (top-right menu)**.
3. Add `https://github.com/aman0069/mushroom-logbook` and install **Cordyceps Lab Console**.
4. Toggle **Start on boot**, **Watchdog**, and **Show in sidebar**, then click **Start**.

## Release
- Current version: 1.3.0
