# Case Study: BGMI Tournament Control Center (TCC)

> **Platform**: Web Dashboard  
> **Tech Stack**: Next.js App Router, Prisma ORM, PapaParse, Recharts, Lucide

---

## 1. System Overview

BGMI TCC is an operations dashboard built for Battlegrounds Mobile India tournaments, where 16 to 25+ squads compete simultaneously in a single battle royale lobby across large maps (Erangel, Miramar, Sanhok).

---

## 2. Key Architectural Decisions

- **7-Step Guided Tournament Wizard**: Walks organizers through formats, squad limits, map rotations, dispute windows, and scoring presets (BGIS 10-point, BMPS 15-point, PMCO 20-point).
- **Bulk CSV / Excel Import Engine**: Onboards dozens of squads in seconds while validating numeric Character IDs (UIDs) to prevent duplicate player entries.
- **Vectorized Lobby Scoring**: Calculates overall leaderboards, tiebreakers, and placement multipliers in a single pass without UI stutter.

---

## 3. What Was Learned

- **Battle Royale Scale vs. 1v1 Brackets**: Traditional tournament software assumes two teams per match. Battle royale operations require managing 25 squads simultaneously across complex scoring matrices.
- **Roster Validation at the Ingestion Boundary**: Catching duplicate player IDs during CSV upload prevents score disputes from halting live matches later.
