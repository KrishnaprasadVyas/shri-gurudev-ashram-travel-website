# Requirement Traceability Matrix (V2 Specification to Architecture)

**Project**: MAVT.IN / Maa Vaishnavi Tourism  
**Specification Source**: `MAVT_Detailed_Developer_Requirement_V2.pdf`  
**Evaluation Date**: 2026-09-15  

---

## Architecture Traceability Map

| Spec Section | Feature Area | Backend File(s) | Frontend Component / Page | Database Entity | Verification Suite |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Section 1** | Monotonic Booking IDs (`MVT-YYMMDD-XXXX`) | `Backend/src/services/idGenerators.ts`<br>`Backend/src/routes/bookings.ts` | `Frontend/src/pages/portal/BookPage.tsx`<br>`BookingCard.tsx` | `bookings.booking_code` | `idGenerators.test.ts`<br>`apiIntegration.test.ts` |
| **Section 2** | Group Code Assignment (`GRP-xxxx`) | `Backend/src/services/idGenerators.ts`<br>`Backend/src/routes/groups.ts` | `Frontend/src/pages/admin/AdminGroupsPage.tsx` | `groups.group_code` | `idGenerators.test.ts`<br>`apiIntegration.test.ts` |
| **Section 3** | Devotee Codes (`P-xxxxxx`) | `Backend/src/services/idGenerators.ts`<br>`Backend/src/routes/passengers.ts` | `Frontend/src/pages/admin/AdminPassengersPage.tsx` | `passengers.passenger_code` | `idGenerators.test.ts`<br>`apiIntegration.test.ts` |
| **Section 4-7** | Group Management & Late Linking | `Backend/src/routes/groups.ts` | `Frontend/src/pages/admin/AdminGroupDetailPage.tsx` | `groups`<br>`bookings.group_id` | `acceptanceScenarios.test.ts`<br>`apiIntegration.test.ts` |
| **Section 8** | Payment ID (`PAY-xxxxxx`) & Modes | `Backend/src/services/idGenerators.ts`<br>`Backend/src/routes/payments.ts` | `Frontend/src/pages/admin/AdminPaymentsPage.tsx` | `payments.payment_code` | `idGenerators.test.ts`<br>`paymentSecurity.test.ts` |
| **Section 9** | Mixed AC vs Non-AC Pricing | `Backend/src/services/pricingEngine.ts`<br>`Backend/src/routes/bookings.ts` | `Frontend/src/pages/portal/BookPage.tsx` | `travel_packages`<br>`bookings.total_amount` | `pricingAndUtr.test.ts`<br>`apiIntegration.test.ts` |
| **Section 10** | Duplicate UTR Guard & 409 Conflict | `Backend/src/services/pricingEngine.ts`<br>`Backend/src/routes/payments.ts` | `Frontend/src/pages/admin/AdminPaymentsPage.tsx` | `payments.utr_number (UNIQUE)` | `paymentSecurity.test.ts`<br>`scaleAndConcurrency.test.ts` |
| **Section 11** | UTR Whitespace/Case Sanitization | `Backend/src/services/pricingEngine.ts` | `Frontend/src/pages/admin/AdminPaymentsPage.tsx` | `uidx_payments_utr` | `paymentSecurity.test.ts` |
| **Section 12** | Multi-Installment Reconcile | `Backend/src/services/pricingEngine.ts`<br>`Backend/src/routes/payments.ts` | `Frontend/src/pages/portal/BookingDetailPage.tsx` | `bookings.total_paid`<br>`bookings.pending_balance` | `pricingAndUtr.test.ts`<br>`paymentSecurity.test.ts` |
| **Section 13** | Super Admin UTR Correction | `Backend/src/routes/payments.ts` | `Frontend/src/pages/admin/AdminPaymentsPage.tsx` | `payments.utr_number`<br>`audit_logs` | `paymentSecurity.test.ts` |
| **Section 14** | Razorpay HMAC & Idempotency | `Backend/src/routes/razorpayWebhook.ts` | `Frontend/src/lib/apiClient.ts` | `razorpay_webhook_events` | `paymentSecurity.test.ts` |
| **Section 15** | Section 10 Collection Cards | `Backend/src/routes/admin.ts` | `Frontend/src/pages/admin/AdminDashboardPage.tsx` | `bookings`<br>`passengers` | `apiIntegration.test.ts`<br>`mavtEndToEnd.spec.ts` |
| **Section 16** | Pending Collections Queue | `Backend/src/routes/admin.ts`<br>`Backend/src/routes/reports.ts` | `Frontend/src/pages/admin/AdminPendingCollectionPage.tsx` | `bookings.pending_balance > 0` | `apiIntegration.test.ts`<br>`mavtEndToEnd.spec.ts` |
| **Section 17-21**| Akbar 4-Sheet Manifest Generator | `Backend/src/services/excelExporter.ts`<br>`Backend/src/routes/trainJourneys.ts` | `Frontend/src/pages/admin/AdminTrainExportPage.tsx` | `passengers`<br>`train_journeys` | `excelExportFormatting.test.ts`<br>`scaleAndConcurrency.test.ts` |
| **Section 22-27**| Ticket PDF Upload & Mapping | `Backend/src/services/pdfParser.ts`<br>`Backend/src/routes/trainJourneys.ts` | `Frontend/src/pages/admin/AdminTicketUploadPage.tsx` | `ticket_pdfs`<br>`ticket_passenger_mappings` | `ticketPdfPipeline.test.ts` |
| **Section 28-33**| Room Master & Allocations | `Backend/src/routes/rooms.ts` | `Frontend/src/pages/admin/AdminRoomsPage.tsx`<br>`AdminRoomAllocationPage.tsx` | `rooms`<br>`room_allocations` | `roomManagement.test.ts` |
| **Section 34-37**| Customer My Trip Dossier & IDOR | `Backend/src/routes/myTrip.ts` | `Frontend/src/pages/public/MyTripPage.tsx` | `bookings`<br>`passengers`<br>`payments` | `customerMyTripSecurity.test.ts`<br>`mavtEndToEnd.spec.ts` |
| **Section 38** | Granular 5-Role RBAC Matrix | `Backend/src/middleware/rbac.ts`<br>`Backend/src/middleware/adminAuth.ts` | `Frontend/src/components/shared/AdminRoute.tsx` | `users.role` | `rbacMatrix.test.ts` |
| **Section 39** | Immutable Audit Log Trail | `Backend/src/services/auditLogger.ts`<br>`Backend/src/routes/admin.ts` | `Frontend/src/pages/admin/AdminAuditLogsPage.tsx` | `audit_logs` | `auditLogIntegrity.test.ts` |
| **Section 40** | All 11 Operational Reports | `Backend/src/routes/reports.ts` | `Frontend/src/pages/admin/AdminDashboardPage.tsx` | Dynamic Aggregations | `allReports.test.ts` |
| **Section 41** | Centralized PostgreSQL Database | `Backend/src/services/supabaseAdmin.ts`<br>`Backend/migrations/000_mavt_v2_schema.sql` | Full Application Stack | Supabase PostgreSQL Engine | `DATABASE_VERIFICATION.md` |
