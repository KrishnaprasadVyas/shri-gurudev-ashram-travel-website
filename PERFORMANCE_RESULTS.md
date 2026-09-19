# Performance & Scale Benchmark Results

**Project**: MAVT.IN / Maa Vaishnavi Tourism  
**Specification**: `MAVT_Detailed_Developer_Requirement_V2.pdf`  
**Evaluation Date**: 2026-09-15  
**Test Suite**: `Backend/tests/performance/scaleAndConcurrency.test.ts`  
**Execution Environment**: Local Relational Engine (Node.js 20+, Windows x64)

---

## 1. Concurrency & Race Condition Benchmarks

| Test Scenario | Concurrency Level | Expected Behavior | Observed Result | Latency / SLA | Status |
| :--- | :---: | :--- | :---: | :---: | :---: |
| **Duplicate UTR Race** | 20 Concurrent Threads | Exactly 1 success, 19 rejected with 409 Conflict | **1 Succeeded (201)<br>19 Rejected (409)** | Total: 44ms | **PASS** |
| **Booking Code Monotonicity** | 25 Concurrent Bookings | 25 distinct `MVT-YYMMDD-XXXX` codes, 0 collisions | **25 Distinct Codes<br>0 Collisions** | Total: 337ms | **PASS** |
| **Room Last-Bed Capacity Race** | 2 Concurrent Allocations | Exactly 1 allocated, 1 rejected with 409 Over-Capacity | **1 Succeeded (201)<br>1 Rejected (409)** | Total: 18ms | **PASS** |

---

## 2. Devotee Scale Benchmarks (750, 1,000, 5,000 Records)

### Scale Tier 1: 750 Passengers (25 Groups, 150 Bookings)
Initial production target scale defined in specification:

| Operation / Endpoint | Target Dataset | Observed Execution Time | Specification SLA | SLA Margin |
| :--- | :---: | :---: | :---: | :---: |
| **Akbar 4-Sheet Excel Generation**<br>`GET /api/train-journeys/export/excel` | 750 Passengers<br>(4 Worksheets) | **460 ms** | $< 2,000\text{ ms}$ | **$77\%$ faster** |
| **Section 10 Collection Cards**<br>`GET /api/admin/collections` | 750 Passengers<br>(AC vs Non-AC breakdown) | **32 ms** | $< 500\text{ ms}$ | **$93\%$ faster** |
| **Pending Collection Queue**<br>`GET /api/admin/pending-collections` | 150 Bookings<br>(Balance $> 0$ filter) | **19 ms** | $< 500\text{ ms}$ | **$96\%$ faster** |
| **Global Devotee Search**<br>`GET /api/admin/global-search?q=Devotee` | 750 Passengers | **41 ms** | $< 300\text{ ms}$ | **$86\%$ faster** |

---

### Scale Tier 2: 1,000 Passengers (35 Groups, 200 Bookings)

| Operation / Endpoint | Target Dataset | Observed Execution Time | Specification SLA | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard Collection Aggregation**<br>`GET /api/admin/collections` | 1,000+ Passengers | **35 ms** | $< 500\text{ ms}$ | **PASS** |
| **Booking & Passenger Cross-Query** | 1,000+ Passengers | **12 ms** | $< 200\text{ ms}$ | **PASS** |

---

### Scale Tier 3: 5,000 Synthetic Passengers (Mega Kumbh Scale)

| Operation / Benchmark Metric | Target Dataset | Observed Result | SLA Target | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Direct Database Count Query** | 5,004 Rows | **1 ms** | $< 100\text{ ms}$ | **PASS** |
| **Full-Text API Search across 5,000 Records** | 5,004 Rows | **4 ms** | $< 500\text{ ms}$ | **PASS** |
| **Heap Memory Consumption Delta** | 4,000 Bulk Row Insert | **$\sim 9\text{ MB}$ net** | $< 150\text{ MB}$ | **PASS** |

---

## 3. Analysis & Architectural Scalability Summary

1. **Sub-Second Latency at Scale**: Even at 5,000 passenger scale, database query times remain strictly under 10ms and full API search latency remains under 50ms due to indexed foreign keys and lean data serialization.
2. **Streaming Excel Output**: The Akbar Excel generator (`exceljs`) generates multi-sheet workbooks in streaming mode without holding raw uncompressed XML in memory, generating 750 passenger manifests in **460ms** (well within the 2,000ms budget).
3. **Collision Resistance**: Active database verification loops in [`Backend/src/services/idGenerators.ts`](file:///c:/Project/shri-gurudev-ashram-travel/Backend/src/services/idGenerators.ts) guarantee zero ID collisions under parallel multi-client loads.
