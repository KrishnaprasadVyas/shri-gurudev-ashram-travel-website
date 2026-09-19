# End-to-End & Multi-Tier Test Execution Results

**Project**: MAVT.IN / Maa Vaishnavi Tourism  
**Specification**: `MAVT_Detailed_Developer_Requirement_V2.pdf`  
**Execution Date**: 2026-09-15  
**Total Automated Tests**: **121 Tests Executed**  
**Overall Automated Result**: **121 Passed, 0 Failed (100% Automated Execution Pass)**

---

## 1. Multi-Tier Test Hierarchy & Execution Summary

```
========================================================================================================
Test Suite                                  Testing Tier        Total   Passed  Failed  Duration  Status
========================================================================================================
pricingAndUtr.test.ts                       Unit                5       5       0       5ms       PASS
idGenerators.test.ts                        Unit                4       4       0       6ms       PASS
excelExportFormatting.test.ts               Unit / Formatting   3       3       0       13ms      PASS
backupRestore.test.ts                       Disaster Recovery   3       3       0       147ms     PASS
acceptanceScenarios.test.ts                 Acceptance Flow     11      11      0       11ms      PASS
roomManagement.test.ts                      Integration         6       6       0       375ms     PASS
auditLogIntegrity.test.ts                   Security / Audit    4       4       0       167ms     PASS
customerMyTripSecurity.test.ts              Security / IDOR     8       8       0       235ms     PASS
rbacMatrix.test.ts                          Security / RBAC     18      18      0       256ms     PASS
allReports.test.ts                          Integration         11      11      0       221ms     PASS
ticketPdfPipeline.test.ts                   Pipeline / Storage  6       6       0       269ms     PASS
paymentSecurity.test.ts                     Security / Payment  9       9       0       314ms     PASS
apiIntegration.test.ts                      HTTP Integration    19      19      0       475ms     PASS
scaleAndConcurrency.test.ts                 Scale & Race Cond.  9       9       0       1029ms    PASS
mavtEndToEnd.spec.ts                        Playwright E2E      5       5       0       9.8s      PASS
--------------------------------------------------------------------------------------------------------
TOTAL EXECUTION                                                 121     121     0       16.3s     100% PASS
========================================================================================================
```

---

## 2. Playwright Browser E2E Suite (`mavtEndToEnd.spec.ts`)

Executed with headless Chromium browser instances against local Vite development server:

| Spec / Test Case | User Flow / Verification | Observed Duration | Result |
| :--- | :--- | :---: | :---: |
| `Customer My Trip Dossier` | Devotee enters Booking ID + Lead Phone on `/my-trip`, views detailed journey itinerary, financial balance card, and passenger roster | 814 ms | **PASS** |
| `Admin Section 10 Collection Cards` | Super Admin logs in, views `/admin` dashboard, confirms AC Travel (₹14,500), Non-AC Travel (₹9,500), and Total Collection cards render | 479 ms | **PASS** |
| `Pending Collection Queue` | Payment staff views `/admin/pending-collection`, asserts balance queue lists only groups with outstanding balances $> 0$ | 1,000 ms | **PASS** |
| `Akbar Train Export Controls` | Train staff accesses `/admin/train-export`, triggers 4-sheet Akbar train manifest download with proper content disposition | 380 ms | **PASS** |
| `Room Allocation Matrix` | Room staff navigates to `/admin/room-allocation`, checks hotel/room inventory and cross-booking room allocation matrix | 335 ms | **PASS** |

---

## 3. TypeScript Compilation Checks

### Backend TypeScript Compilation (`npm run build`)
```
> shri-gurudev-ashram-backend@1.0.0 build
> tsc

Exit Code: 0 (0 compilation errors, 0 warnings)
```

### Frontend Production Build (`npm run build`)
```
> ashram-admin@0.0.0 build
> tsc -b && vite build

vite v8.0.16 building client environment for production...
transforming...✓ 2434 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                          1.01 kB │ gzip:   0.58 kB
dist/assets/index-CpFs9rsc.css         149.85 kB │ gzip:  22.73 kB
dist/assets/index-Do_fabUT.js        1,673.92 kB │ gzip: 420.54 kB
✓ built in 911ms

Exit Code: 0 (0 build errors)
```
