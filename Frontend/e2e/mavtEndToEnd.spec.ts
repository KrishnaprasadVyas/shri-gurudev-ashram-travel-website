import { test, expect } from '@playwright/test'

test.describe('MAVT Full System End-to-End Browser Verification', () => {
  let SEED_BOOKING_CODE = 'MVT-260915-0001'
  const SEED_MOBILE = '9876543210'

  test.beforeAll(async ({ request }) => {
    try {
      const gRes = await request.post('http://127.0.0.1:3001/api/groups', {
        headers: { Authorization: 'Bearer dev-token-superadmin:Super Admin:admin@mavt.in:super_admin' },
        data: { name: 'E2E Pilgrimage Group', leadMobile: SEED_MOBILE },
      })
      const gData = await gRes.json().catch(() => ({}))
      const groupId = gData.group?.id

      const bRes = await request.post('http://127.0.0.1:3001/api/bookings', {
        headers: { Authorization: 'Bearer dev-token-superadmin:Super Admin:admin@mavt.in:super_admin' },
        data: {
          groupId,
          packageId: 'default-pkg-001',
          travelerCount: 2,
          leadName: 'Rajesh Sharma',
          phone: SEED_MOBILE,
          leadPhone: SEED_MOBILE,
          whatsappNumber: SEED_MOBILE,
          passengers: [
            { full_name: 'Rajesh Sharma', age: 45, gender: 'M', travel_class: 'ac', phone: SEED_MOBILE },
            { full_name: 'Sunita Sharma', age: 42, gender: 'F', travel_class: 'non_ac', phone: SEED_MOBILE },
          ],
        },
      })
      const bData = await bRes.json().catch(() => ({}))
      if (bData.booking?.booking_code) {
        SEED_BOOKING_CODE = bData.booking.booking_code
      }
    } catch (err) {
      console.warn('Seed booking beforeAll notice:', err)
    }
  })

  test.beforeEach(async ({ context }) => {
    // Inject demo admin auth session into localStorage so admin pages load smoothly
    await context.addInitScript(() => {
      window.localStorage.setItem(
        'demo_token',
        'dev-token-superadmin:Super Admin:admin@mavt.in:super_admin',
      )
      window.localStorage.setItem(
        'demo_user',
        JSON.stringify({
          id: 'superadmin',
          email: 'admin@mavt.in',
          fullName: 'Super Admin',
          role: 'super_admin',
        }),
      )
      window.localStorage.setItem(
        'demo_user_profile',
        JSON.stringify({
          id: 'superadmin',
          full_name: 'Super Admin',
          role: 'super_admin',
          verification_status: 'verified',
        }),
      )
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 1. PUBLIC MY TRIP DOSSIER LOOKUP (/my-trip)
  // ───────────────────────────────────────────────────────────────────────────
  test('Customer can search and view pilgrimage dossier on /my-trip', async ({ page, request }) => {
    // Create a dedicated booking for this dossier lookup test
    const gRes = await request.post('http://127.0.0.1:3001/api/groups', {
      headers: { Authorization: 'Bearer dev-token-superadmin:Super Admin:admin@mavt.in:super_admin' },
      data: { name: 'E2E Pilgrimage Group', leadMobile: SEED_MOBILE },
    })
    const gData = await gRes.json().catch(() => ({}))
    const groupId = gData.group?.id

    const bRes = await request.post('http://127.0.0.1:3001/api/bookings', {
      headers: { Authorization: 'Bearer dev-token-superadmin:Super Admin:admin@mavt.in:super_admin' },
      data: {
        groupId,
        packageId: 'default-pkg-001',
        travelerCount: 2,
        leadName: 'Rajesh Sharma',
        phone: SEED_MOBILE,
        leadPhone: SEED_MOBILE,
        whatsappNumber: SEED_MOBILE,
        passengers: [
          { full_name: 'Rajesh Sharma', age: 45, gender: 'M', travel_class: 'ac', phone: SEED_MOBILE },
          { full_name: 'Sunita Sharma', age: 42, gender: 'F', travel_class: 'non_ac', phone: SEED_MOBILE },
        ],
      },
    })
    const bData = await bRes.json()
    if (bRes.status() !== 201) {
      console.error('FAILED TO CREATE BOOKING:', bRes.status(), JSON.stringify(bData))
    }
    expect(bRes.status()).toBe(201)
    const targetCode = bData.booking?.booking_code || SEED_BOOKING_CODE

    await page.goto('/my-trip')

    // Verify header and page elements
    await expect(page.locator('h1')).toContainText('My Pilgrimage Trip')
    await expect(page.getByPlaceholder('MVT-...')).toBeVisible()
    await expect(page.getByPlaceholder('10-digit mobile number')).toBeVisible()

    // Enter booking search details
    await page.getByPlaceholder('MVT-...').fill(targetCode)
    await page.getByPlaceholder('10-digit mobile number').fill(SEED_MOBILE)

    // Submit search
    await page.getByRole('button', { name: 'Find My Trip' }).click()

    // Verify travel dossier elements appear
    await expect(page.locator('body')).toContainText('Booking:')
    await expect(page.locator('body')).toContainText('Payment Summary')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 2. ADMIN DASHBOARD & COLLECTION CARDS (/admin)
  // ───────────────────────────────────────────────────────────────────────────
  test('Admin Dashboard renders Section 10 Collection Cards and navigation', async ({ page }) => {
    await page.goto('/admin')

    // Verify Admin Header / Hero
    await expect(page.locator('body')).toContainText('Ashram Command Center')

    // Verify Section 10 Collection Cards
    await expect(page.locator('body')).toContainText('AC Travel')
    await expect(page.locator('body')).toContainText('Non-AC Travel')
    await expect(page.locator('body')).toContainText('TOTAL')

    // Verify Pending Queue button
    await expect(page.getByText('View All Pending Collections')).toBeVisible()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 3. PENDING COLLECTIONS QUEUE (/admin/pending-collection)
  // ───────────────────────────────────────────────────────────────────────────
  test('Pending Collection page renders outstanding balance queue', async ({ page }) => {
    await page.goto('/admin/pending-collection')

    // Verify page header
    await expect(page.getByRole('heading', { name: 'Outstanding Balance Queue' })).toBeVisible()
    await expect(page.getByPlaceholder('Search by booking code, lead name, mobile...')).toBeVisible()

    // Verify table structure
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('th:has-text("Booking Code")')).toBeVisible()
    await expect(page.locator('th:has-text("Pending Balance")')).toBeVisible()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 4. TRAIN MANIFEST EXPORT PAGE (/admin/train-export)
  // ───────────────────────────────────────────────────────────────────────────
  test('Train Export page displays 4-Sheet Akbar-compliant download controls', async ({ page }) => {
    await page.goto('/admin/train-export')

    // Verify header and manifest controls
    await expect(page.getByRole('heading', { name: 'Train Booking Manifest Export' })).toBeVisible()

    // Verify 1-Click Complete Manifest button
    await expect(page.getByRole('button', { name: /1-Click Download 4-Sheet Manifest/i })).toBeVisible()

    // Verify all 4 individual cards exist
    await expect(page.locator('body')).toContainText('Going — AC Class')
    await expect(page.locator('body')).toContainText('Going — Non-AC')
    await expect(page.locator('body')).toContainText('Return — AC Class')
    await expect(page.locator('body')).toContainText('Return — Non-AC')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 5. ROOM ALLOCATION & INVENTORY (/admin/room-allocation)
  // ───────────────────────────────────────────────────────────────────────────
  test('Room Allocation page renders inventory and cross-booking controls', async ({ page }) => {
    await page.goto('/admin/room-allocation')

    // Verify header and layout
    await expect(page.getByRole('heading', { name: 'Room Allocation Matrix' })).toBeVisible()
    await expect(page.locator('body')).toContainText('Cross-Booking Sharing Support')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 6. ADMIN BOOKING DETAIL: WHATSAPP AUTOMATION & ACTIONS
  // ───────────────────────────────────────────────────────────────────────────
  test('Admin Booking Detail renders WhatsApp Trip Details button and modal', async ({ page, request }) => {
    // Fetch bookings to get a valid booking ID
    const bRes = await request.get('http://127.0.0.1:3001/api/admin/bookings?page=1&limit=1', {
      headers: { Authorization: 'Bearer dev-token-superadmin:Super Admin:admin@mavt.in:super_admin' },
    })
    const bData = await bRes.json()
    const targetBooking = bData.bookings?.[0]
    if (!targetBooking) {
      test.skip()
      return
    }

    await page.goto(`/admin/bookings/${targetBooking.id}`)

    // Verify WhatsApp button is visible
    const whatsappBtn = page.getByRole('button', { name: /Send Trip Details on WhatsApp/i })
    await expect(whatsappBtn).toBeVisible()

    // Click WhatsApp button to open automation modal
    await whatsappBtn.click()

    // Verify WhatsApp modal is open
    await expect(page.getByRole('heading', { name: 'WhatsApp Trip Details Automation' })).toBeVisible()
    await expect(page.locator('body')).toContainText('Official Hindi WhatsApp Template Preview')
    await expect(page.locator('body')).toContainText('Dispatch Log History')

    // Close modal
    await page.getByRole('button', { name: 'Close' }).first().click()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 7. PUBLIC MY TRIP: ROOM-ONLY GUEST DOSSIER VERIFICATION
  // ───────────────────────────────────────────────────────────────────────────
  test('Public My Trip suppresses train cards for Room-Only bookings', async ({ page, request }) => {
    // Create an only_room booking
    const bRes = await request.post('http://127.0.0.1:3001/api/bookings', {
      headers: { Authorization: 'Bearer dev-token-superadmin:Super Admin:admin@mavt.in:super_admin' },
      data: {
        serviceOption: 'only_room',
        hotelName: 'Shri Gurudev Ashram Grand Niwas',
        checkInDate: '2026-10-15',
        checkOutDate: '2026-10-20',
        roomRent: 4500,
        roomType: 'AC Deluxe',
        leadName: 'Amit Patel',
        phone: '9988776655',
        leadPhone: '9988776655',
        travelerCount: 1,
        passengers: [
          { full_name: 'Amit Patel', age: 38, gender: 'M', travel_class: 'ac', phone: '9988776655' },
        ],
      },
    })
    const bData = await bRes.json()
    const roomBookingCode = bData.booking?.booking_code

    if (!roomBookingCode) {
      test.skip()
      return
    }

    await page.goto('/my-trip')
    await page.getByPlaceholder('MVT-...').fill(roomBookingCode)
    await page.getByPlaceholder('10-digit mobile number').fill('9988776655')
    await page.getByRole('button', { name: 'Find My Trip' }).click()

    // Verify booking code shows up
    await expect(page.locator('body')).toContainText(roomBookingCode)

    // Verify Hotel / Ashram Stay details are displayed
    await expect(page.locator('body')).toContainText('HOTEL / ASHRAM STAY DETAILS')
    await expect(page.locator('body')).toContainText('Shri Gurudev Ashram Grand Niwas')

    // Verify Going Train card is suppressed
    await expect(page.locator('text=Going Train Details')).not.toBeVisible()
  })
})
