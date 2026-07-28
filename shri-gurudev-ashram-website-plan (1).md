# Shri Gurudev Ashram — Complete Website Implementation Plan

> For use with Claude Sonnet in your IDE (Antigravity / Cursor / Claude Code)  
> Stack: **Vite + React 19 · TypeScript · Tailwind CSS · shadcn/ui · React Router DOM v6 · TanStack Query · Supabase Auth**

---

## What You're Working With

### Existing Backend (keep as-is)
```
Express + TypeScript server already has:
  POST  /api/bookings                    → create booking
  GET   /api/bookings                    → user's own bookings
  GET   /api/bookings/:id                → single booking
  POST  /api/payments/create-order       → create Razorpay order
  POST  /api/payments/verify             → verify payment signature
  POST  /api/webhooks/razorpay           → webhook handler
  POST  /api/users/upload-aadhaar        → upload Aadhaar image (multipart)
  POST  /api/users/upload-selfie         → upload selfie (multipart)
  POST  /api/users/verification/submit   → submit verification data

Auth: Bearer token from Supabase session
Supabase URL: https://jpvowbxojdvrpgtpxvmo.supabase.co
```

### What the Backend is Missing (you'll add these)
```
GET   /api/users/me                         → fetch own profile
GET   /api/admin/stats                      → dashboard numbers
GET   /api/admin/users                      → all users (paginated)
GET   /api/admin/users/:id                  → single user with bookings
PUT   /api/admin/users/:id/verification     → approve / reject
GET   /api/admin/bookings                   → all bookings (paginated, filtered)
GET   /api/admin/bookings/:id               → single booking detail
GET   /api/admin/packages                   → all packages (active + inactive)
POST  /api/admin/packages                   → create package
PUT   /api/admin/packages/:id               → update package
DELETE /api/admin/packages/:id              → deactivate package
```

### Database Schema (from Supabase screenshot)
```
users               id, full_name, phone, email, role, profile_image_url,
                    aadhaar_number, aadhaar_image_path, selfie_image_path,
                    verification_status (not_submitted|submitted|verified|rejected)

travel_packages     id, title, description, price, duration,
                    total_seats, remaining_seats, image_url, is_active

bookings            id, user_id, package_id, status (payment_pending|paid|cancelled|completed),
                    total_amount, traveler_count, special_notes, booking_reference,
                    full_name, phone_number, whatsapp_number, dob, address,
                    transport_type, bus_type, room_type

payments            id, booking_id, amount, payment_method, razorpay_order_id,
                    razorpay_payment_id, razorpay_signature, gateway_fee, status

razorpay_webhook_events   id, event_id, created_at
```

### Booking Rules (preserve exactly)
- `verification_status = not_submitted` → cannot book (backend returns 403)
- `submitted | verified | rejected` → can book
- `transportType` must be `'Flight'` or `'Train'`
- If `Train`: `busType` must be `'AC Train'` or `'Non-AC Train'`
- `roomType` must be `'AC Room'` or `'Non-AC Room'`
- Phone/WhatsApp: 10-digit numeric strings
- Aadhaar: exactly 12 digits

---

## Folder Structure

```
shri-gurudev-ashram-website/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── pages/
│   │   ├── public/
│   │   │   ├── HomePage.tsx
│   │   │   ├── AboutPage.tsx
│   │   │   ├── YatrasPage.tsx
│   │   │   ├── YatraDetailPage.tsx
│   │   │   ├── ContactPage.tsx
│   │   │   ├── GalleryPage.tsx
│   │   │   └── FaqPage.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   │
│   │   ├── portal/
│   │   │   ├── PortalHomePage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── VerifyPage.tsx
│   │   │   ├── BookingsPage.tsx
│   │   │   ├── BookingDetailPage.tsx
│   │   │   └── BookPage.tsx
│   │   │
│   │   └── admin/
│   │       ├── AdminDashboardPage.tsx
│   │       ├── AdminUsersPage.tsx
│   │       ├── AdminUserDetailPage.tsx
│   │       ├── AdminVerificationsPage.tsx
│   │       ├── AdminBookingsPage.tsx
│   │       ├── AdminBookingDetailPage.tsx
│   │       ├── AdminPackagesPage.tsx
│   │       ├── AdminPackageNewPage.tsx
│   │       └── AdminPackageEditPage.tsx
│   │
│   ├── components/
│   │   ├── ui/                         ← shadcn/ui components
│   │   ├── layout/
│   │   │   ├── PublicHeader.tsx
│   │   │   ├── PublicFooter.tsx
│   │   │   ├── PublicLayout.tsx        ← wraps public pages
│   │   │   ├── PortalLayout.tsx        ← wraps portal pages (sidebar)
│   │   │   ├── PortalSidebar.tsx
│   │   │   ├── AdminLayout.tsx         ← wraps admin pages (sidebar)
│   │   │   └── AdminSidebar.tsx
│   │   ├── public/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── PackageCard.tsx
│   │   │   ├── FeatureSection.tsx
│   │   │   └── ContactForm.tsx
│   │   ├── portal/
│   │   │   ├── BookingCard.tsx
│   │   │   ├── BookingForm.tsx
│   │   │   ├── VerificationForm.tsx
│   │   │   └── ProfileForm.tsx
│   │   ├── admin/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── UsersTable.tsx
│   │   │   ├── BookingsTable.tsx
│   │   │   ├── VerificationCard.tsx
│   │   │   └── PackageForm.tsx
│   │   └── shared/
│   │       ├── ProtectedRoute.tsx      ← replaces Next.js middleware
│   │       ├── AdminRoute.tsx
│   │       ├── GuestRoute.tsx
│   │       ├── LoadingState.tsx
│   │       ├── ErrorState.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── router/
│   │   └── index.tsx                   ← all React Router routes defined here
│   │
│   ├── lib/
│   │   ├── supabase.ts                 ← Supabase browser client
│   │   ├── apiClient.ts                ← axios client (attaches Bearer token)
│   │   └── queryKeys.ts                ← TanStack Query key constants
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePackages.ts
│   │   ├── useBookings.ts
│   │   ├── usePayment.ts
│   │   └── useVerification.ts
│   │
│   ├── context/
│   │   └── AuthContext.tsx             ← auth state shared across app
│   │
│   ├── types/
│   │   ├── database.types.ts
│   │   ├── travel.ts
│   │   ├── admin.ts
│   │   └── razorpay.d.ts
│   │
│   ├── App.tsx                         ← mounts router + providers
│   ├── main.tsx                        ← entry point
│   └── index.css                       ← Tailwind base + custom tokens
│
├── .env                                ← VITE_ prefixed vars
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── components.json                     ← shadcn config
```

---

## Environment Variables

```env
# .env

VITE_SUPABASE_URL=https://jpvowbxojdvrpgtpxvmo.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

VITE_API_BASE_URL=https://api.mavt.in

VITE_RAZORPAY_KEY_ID=rzp_test_SxD6T0TWVN7G3r
```

> Note: No service role key needed — React SPA runs entirely in the browser.
> All admin operations go through the Express backend with `requireAdmin` middleware.

---

## Implementation Phases

---

## Phase 0 — Project Bootstrap

### Prompt for Claude:

```
Scaffold a new Vite + React project called "shri-gurudev-ashram-website":

  npm create vite@latest shri-gurudev-ashram-website -- --template react-ts
  cd shri-gurudev-ashram-website

Install dependencies:
  npm install react-router-dom@6
  npm install @supabase/supabase-js
  npm install @tanstack/react-query axios
  npm install lucide-react clsx tailwind-merge class-variance-authority
  npm install tailwindcss @tailwindcss/vite

Initialize shadcn/ui (choose Vite when prompted):
  npx shadcn@latest init

Add these shadcn components:
  npx shadcn@latest add button input label card badge table dialog select tabs toast skeleton alert accordion

Create this folder structure inside src/:
  src/pages/public/
  src/pages/auth/
  src/pages/portal/
  src/pages/admin/
  src/components/ui/
  src/components/layout/
  src/components/public/
  src/components/portal/
  src/components/admin/
  src/components/shared/
  src/router/
  src/lib/
  src/hooks/
  src/context/
  src/types/

Update vite.config.ts to add path alias:
  resolve: { alias: { '@': path.resolve(__dirname, './src') } }

Update tsconfig.json paths to match:
  "paths": { "@/*": ["./src/*"] }
```

---

## Phase 1 — Foundation (Types, Clients, Auth, Router)

### 1a. Types
**Prompt:**
```
Create src/types/database.types.ts with these TypeScript types matching the Supabase schema:

  UserRow: { id: string, created_at: string, updated_at: string, full_name: string,
    phone: string, email: string | null, role: string, profile_image_url: string | null,
    aadhaar_number: string | null, aadhaar_image_path: string | null,
    selfie_image_path: string | null,
    verification_status: 'not_submitted'|'submitted'|'verified'|'rejected' }

  TravelPackageRow: { id: string, created_at: string, updated_at: string, title: string,
    description: string, price: number, duration: string, total_seats: number,
    remaining_seats: number, image_url: string | null, is_active: boolean }

  BookingRow: { id: string, created_at: string, updated_at: string, user_id: string,
    package_id: string, status: 'payment_pending'|'paid'|'cancelled'|'completed',
    total_amount: number, traveler_count: number, special_notes: string | null,
    booking_reference: string, full_name: string | null, phone_number: string | null,
    whatsapp_number: string | null, dob: string | null, address: string | null,
    transport_type: string | null, bus_type: string | null, room_type: string | null,
    admin_notes: string | null }

  PaymentRow: { id: string, created_at: string, updated_at: string, booking_id: string,
    amount: number, payment_method: string, razorpay_order_id: string | null,
    razorpay_payment_id: string | null, razorpay_signature: string | null,
    gateway_fee: number | null, status: string }

Create src/types/travel.ts:
  Export TravelPackage (= TravelPackageRow), Booking (= BookingRow)
  Export CreateBookingInput: {
    packageId: string, travelerCount: number, specialNotes?: string,
    fullName: string, phoneNumber: string, whatsappNumber: string,
    dob: string, address: string, transportType: 'Flight'|'Train',
    busType?: 'AC Train'|'Non-AC Train', roomType: 'AC Room'|'Non-AC Room'
  }

Create src/types/admin.ts:
  AdminStats: { totalUsers: number, totalBookings: number, totalRevenue: number,
    pendingVerifications: number, activePackages: number }
  AdminUser: UserRow & { bookingCount: number }
  AdminBooking: BookingRow & { packageTitle: string, userName: string }

Create src/types/razorpay.d.ts:
  Declare global window.Razorpay as any so TypeScript doesn't complain
```

### 1b. Supabase Client + API Client
**Prompt:**
```
Create src/lib/supabase.ts:
  import { createClient } from '@supabase/supabase-js'
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  export const supabase = createClient(supabaseUrl, supabaseAnonKey)

Create src/lib/apiClient.ts:
  - axios instance with baseURL = import.meta.env.VITE_API_BASE_URL
  - Request interceptor: before each request, get the Supabase session with
    supabase.auth.getSession(), then set headers.Authorization = 'Bearer ' + session.access_token
  - Response interceptor: if status 401 → call supabase.auth.signOut() then redirect to /login
  - Export as default: apiClient

Create src/lib/queryKeys.ts:
  export const QUERY_KEYS = {
    packages: ['packages'] as const,
    package: (id: string) => ['packages', id] as const,
    bookings: ['bookings'] as const,
    booking: (id: string) => ['bookings', id] as const,
    profile: ['profile'] as const,
    adminStats: ['admin', 'stats'] as const,
    adminUsers: (page: number, search: string, status: string) => ['admin', 'users', page, search, status] as const,
    adminUser: (id: string) => ['admin', 'users', id] as const,
    adminBookings: (page: number, status: string) => ['admin', 'bookings', page, status] as const,
    adminBooking: (id: string) => ['admin', 'bookings', id] as const,
    adminPackages: ['admin', 'packages'] as const,
  }
```

### 1c. Auth Context + Hook
**Prompt:**
```
Create src/context/AuthContext.tsx:

  State: { user: User|null, userProfile: UserRow|null, loading: boolean }
  
  On mount: call supabase.auth.getSession() to check existing session
  On auth state change (supabase.auth.onAuthStateChange):
    - If SIGNED_IN: fetch users row from supabase.from('users').select('*').eq('id', user.id).single()
    - If SIGNED_OUT: set userProfile to null
  
  Export AuthContext and AuthProvider component
  
  Expose these functions via context:
    signIn(email, password): calls supabase.auth.signInWithPassword
    signUp(email, password, fullName, phone): calls supabase.auth.signUp with metadata
    signOut(): calls supabase.auth.signOut then navigate to /
    refreshProfile(): re-fetches the users row

Create src/hooks/useAuth.ts:
  Just re-exports: export const useAuth = () => useContext(AuthContext)
  Add a guard: if context is undefined throw error 'useAuth must be inside AuthProvider'
```

### 1d. Protected Route Components
**Prompt:**
```
In React + React Router, route protection is done with wrapper components, not middleware.

Create src/components/shared/ProtectedRoute.tsx:
  - Import useAuth
  - If loading: show a full-screen spinner (use Loader2 from lucide-react)
  - If !user: return <Navigate to="/login" state={{ from: location }} replace />
  - Otherwise: return <Outlet />

Create src/components/shared/AdminRoute.tsx:
  - If loading: full-screen spinner
  - If !user: <Navigate to="/login" replace />
  - If user but userProfile?.role !== 'admin': <Navigate to="/portal" replace />
  - Otherwise: <Outlet />

Create src/components/shared/GuestRoute.tsx:
  - If loading: full-screen spinner
  - If user is logged in: <Navigate to="/portal" replace />
  - Otherwise: <Outlet />

These will be used to wrap route groups in the router.
```

### 1e. Router
**Prompt:**
```
Create src/router/index.tsx with all routes using createBrowserRouter:

Structure:
  / and public pages        → wrapped in PublicLayout (no auth required)
  /login, /signup, etc.     → wrapped in GuestRoute + AuthLayout
  /portal/*                 → wrapped in ProtectedRoute + PortalLayout
  /admin/*                  → wrapped in AdminRoute + AdminLayout

Full route tree:
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'yatras', element: <YatrasPage /> },
      { path: 'yatras/:id', element: <YatraDetailPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'gallery', element: <GalleryPage /> },
      { path: 'faq', element: <FaqPage /> },
    ]
  },
  {
    element: <GuestRoute />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ]
  },
  {
    path: 'portal',
    element: <ProtectedRoute />,
    children: [
      {
        element: <PortalLayout />,
        children: [
          { index: true, element: <PortalHomePage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'verify', element: <VerifyPage /> },
          { path: 'bookings', element: <BookingsPage /> },
          { path: 'bookings/:id', element: <BookingDetailPage /> },
          { path: 'book/:packageId', element: <BookPage /> },
        ]
      }
    ]
  },
  {
    path: 'admin',
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'users/:id', element: <AdminUserDetailPage /> },
          { path: 'verifications', element: <AdminVerificationsPage /> },
          { path: 'bookings', element: <AdminBookingsPage /> },
          { path: 'bookings/:id', element: <AdminBookingDetailPage /> },
          { path: 'packages', element: <AdminPackagesPage /> },
          { path: 'packages/new', element: <AdminPackageNewPage /> },
          { path: 'packages/:id/edit', element: <AdminPackageEditPage /> },
        ]
      }
    ]
  },
  { path: '*', element: <Navigate to="/" replace /> }

Update src/App.tsx:
  import { RouterProvider } from 'react-router-dom'
  import { router } from '@/router'
  export default function App() { return <RouterProvider router={router} /> }

Update src/main.tsx:
  Wrap App with AuthProvider + QueryClientProvider + Toaster
```

---

## Phase 2 — Backend: Add Missing Admin Routes

> Open the existing Express backend project (separate from the website)

### 2a. Add GET /api/users/me
**Prompt:**
```
In backend/src/routes/users.ts, add:

  router.get('/me', requireAuth, async (req, res) => {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .single()
    if (error || !user) return res.status(404).json({ error: 'User not found' })
    return res.json({ user })
  })
```

### 2b. Admin Role Middleware
**Prompt:**
```
Create backend/src/middleware/adminAuth.ts:

  export const requireAdmin = async (req, res, next) => {
    // First run requireAuth logic (or call requireAuth internally)
    // Then check users table for role
    const { data: user } = await supabaseAdmin
      .from('users').select('role').eq('id', req.userId).single()
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }
    next()
  }
  
  The middleware should compose with requireAuth:
  use both: router.get('/route', requireAuth, requireAdmin, handler)
  Or combine them into one middleware that does auth + admin check in sequence.
```

### 2c. Add Admin Routes
**Prompt:**
```
Create backend/src/routes/admin.ts — all routes use requireAuth + requireAdmin:

GET /stats
  Returns AdminStats:
    totalUsers: COUNT from users
    totalBookings: COUNT from bookings
    totalRevenue: SUM(total_amount) from bookings where status='paid'
    pendingVerifications: COUNT from users where verification_status='submitted'
    activePackages: COUNT from travel_packages where is_active=true

GET /users?page=1&limit=20&search=&status=
  - Query users table, paginated
  - If search: filter by full_name ILIKE, phone ILIKE, or email ILIKE
  - If status: filter by verification_status
  - For each user, include a bookingCount (subquery or separate count query)
  - Returns { users, total, page, limit }

GET /users/:id
  - Fetch user row + all their bookings (join with travel_packages for title)
  - Returns { user, bookings }

PUT /users/:id/verification
  Body: { status: 'verified'|'rejected', notes?: string }
  - Update users.verification_status
  - If notes: optionally store in a separate field or log
  - Returns { user }

GET /bookings?page=1&limit=20&status=&packageId=
  - All bookings, paginated
  - Join: get full_name from users, title from travel_packages
  - Optional filters: status, packageId
  - Returns { bookings, total, page, limit }

GET /bookings/:id
  - Single booking + related user + package + payment records
  - Returns { booking, user, package, payments }

GET /packages
  - All packages (active and inactive), ordered by created_at desc
  - Returns { packages }

POST /packages
  Body: { title, description, price, duration, total_seats, remaining_seats, image_url?, is_active }
  - Insert into travel_packages
  - Returns { package }

PUT /packages/:id
  Body: partial PackageInput
  - Update travel_packages where id = :id
  - Returns { package }

DELETE /packages/:id
  - Set is_active = false (never hard delete)
  - Returns { package }

Register in backend/src/app.ts:
  import { adminRouter } from './routes/admin'
  app.use('/api/admin', adminRouter)
```

### 2d. CORS Update for React Dev Server
**Prompt:**
```
In backend/src/app.ts update CORS config:
  npm install cors @types/cors (if not already installed)

  app.use(cors({
    origin: [
      process.env.FRONTEND_URL || 'https://mavt.in'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }))
```

---

## Phase 3 — Public Website Pages

### 3a. Layouts
**Prompt:**
```
Create src/components/layout/PublicHeader.tsx:
  - Left: "Shri Gurudev Ashram" text with Flower2 icon from lucide-react
  - Center: Nav links (NavLink from react-router-dom): Home, About, Yatras, Gallery, Contact
    Use NavLink's className isActive prop to highlight current page
  - Right: if user logged in → "My Portal" button (→ /portal), else → Login + Sign Up buttons
  - Mobile: hamburger menu using shadcn Sheet or a simple state toggle
  - Sticky top with subtle shadow on scroll

Create src/components/layout/PublicFooter.tsx:
  - Three columns: About Ashram, Quick Links, Contact Us
  - Bottom bar: copyright + "Made with ❤️ for devotees"
  - Saffron/orange accent color

Create src/components/layout/PublicLayout.tsx:
  - Renders PublicHeader + <Outlet /> + PublicFooter
  - Scroll to top on route change (use useEffect + useLocation)
```

### 3b. Home Page
**Prompt:**
```
Create src/pages/public/HomePage.tsx

Fetch active packages: useQuery(QUERY_KEYS.packages, () =>
  supabase.from('travel_packages').select('*').eq('is_active', true).limit(3).then(r => r.data))

Sections:
1. Hero
   Full-width section with saffron gradient background (#E97B22 → #C4611A)
   Large heading: "Embark on a Sacred Journey"
   Subtext: "Join thousands of devotees on divine Yatras guided by Shri Gurudev"
   Two CTA buttons: "View Upcoming Yatras" (→ /yatras), "Register Now" (→ /signup)
   Decorative lotus/mandala SVG or pattern overlay

2. Stats row (4 cards)
   "5000+ Devotees", "50+ Yatras Completed", "20+ Years", "15+ Destinations"
   Simple counter with IntersectionObserver animation

3. Upcoming Yatras
   Heading: "Upcoming Sacred Journeys"
   Grid of PackageCard components (3 packages from query)
   Loading state: 3 skeleton cards
   "View All Yatras →" link

4. Why Choose Us (3 features)
   ShieldCheck: "Expert Guidance"
   Star: "Complete Arrangements"
   Heart: "Spiritual Community"

5. Testimonials (static, 3 cards)
   Make up believable devotee names, cities, and short quotes about yatra experience

6. CTA Banner
   Saffron gradient, "Begin Your Sacred Journey Today", Register button

Color tokens to use throughout:
  primary: #E97B22
  primary-dark: #C4611A
  bg: #FDF8F3
  text: #1A1A1A
  muted: #6B7280
```

### 3c. Package Card Component
**Prompt:**
```
Create src/components/public/PackageCard.tsx:
  Props: { package: TravelPackage, showBookButton?: boolean }

  Card with rounded-2xl shadow-sm hover:shadow-md transition:
    Top: image (package.image_url) or gradient placeholder (saffron if no image)
    Remaining seats badge: top-right corner
      green if remaining_seats > 10
      yellow if 1-10
      red if 0 (show "Sold Out")
    Body:
      Title (font-semibold text-lg)
      Duration with Clock icon
      Price: "₹{price.toLocaleString('en-IN')}" with IndianRupee icon
    Footer:
      "View Details" link → /yatras/[id]
      "Book Now" button → if user logged in go to /portal/book/[id],
        else navigate to /login with state { redirectTo: /portal/book/[id] }
```

### 3d. Yatras Page + Detail
**Prompt:**
```
Create src/pages/public/YatrasPage.tsx:
  Fetch all active packages from Supabase (no auth needed)
  useQuery(QUERY_KEYS.packages, () =>
    supabase.from('travel_packages').select('*').eq('is_active', true).order('created_at', { ascending: false }))
  
  Page header with breadcrumb
  Grid: lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6
  PackageCard for each result
  Loading: 6 skeleton cards
  Empty: EmptyState component with "No upcoming yatras" message

Create src/pages/public/YatraDetailPage.tsx:
  Use useParams() to get id
  Fetch: supabase.from('travel_packages').select('*').eq('id', id).single()
  
  Layout:
    Left (2/3): large hero image/gradient, full description
    Right (1/3): sticky booking card with price, seats, duration, "Book Now" button
  
  If package not found: navigate to /yatras
  Update document.title = package.title + " — Shri Gurudev Ashram"
```

### 3e. About, Contact, Gallery, FAQ
**Prompt:**
```
Create src/pages/public/AboutPage.tsx:
  Static content about the ashram
  Sections: Our Story, Our Gurudev (with placeholder bio), Our Mission, Our Values
  Warm devotional copy. No external data needed.

Create src/pages/public/ContactPage.tsx:
  Left: Contact form (Name, Email, Phone, Message fields)
    On submit: use mailto: link or just show toast "We'll be in touch soon!"
    Do not build a backend contact endpoint — out of scope for now
  Right: Contact info (Address, Phone, Email) + Google Maps iframe for Nashik

Create src/pages/public/GalleryPage.tsx:
  Masonry grid of 12+ placeholder images
  Use Unsplash URLs with Indian temple keywords:
    https://images.unsplash.com/photo-[id]?w=400
  Click any image → open in shadcn Dialog as lightbox with prev/next navigation

Create src/pages/public/FaqPage.tsx:
  Use shadcn Accordion component
  10+ FAQs covering: registration, verification, booking, payment, cancellation,
  transport options, room types, refunds, contact
```

---

## Phase 4 — Auth Pages

**Prompt:**
```
All auth pages are wrapped by GuestRoute (redirect to /portal if already logged in)
Create a simple centered card layout for all auth pages (no separate AuthLayout component needed,
just use a div with min-h-screen flex items-center justify-center bg-[#FDF8F3])

Create src/pages/auth/LoginPage.tsx:
  Card with Ashram logo + "Welcome Back"
  Fields: Email, Password (with show/hide toggle)
  "Sign In" button — calls signIn from useAuth()
  On success: navigate to location.state?.from?.pathname || '/portal'
  Error: show error message below form
  Links: "Forgot Password?" → /forgot-password, "Create Account" → /signup

Create src/pages/auth/SignupPage.tsx:
  Card with "Join Our Community"
  Fields: Full Name, Phone (10 digits), Email, Password, Confirm Password
  Validation: phone /^\d{10}$/, password match, all required
  Calls signUp from useAuth()
  On success: navigate to /portal with success toast
    "Account created! Submit your verification to book Yatras."

Create src/pages/auth/ForgotPasswordPage.tsx:
  Single field: Email
  Calls: supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })
  Show success message after submit (don't navigate away)

Create src/pages/auth/ResetPasswordPage.tsx:
  Fields: New Password, Confirm Password
  On mount: check supabase.auth.getSession() — Supabase sets session from URL hash on this page
  Calls: supabase.auth.updateUser({ password: newPassword })
  On success: navigate to /login with toast "Password updated, please log in"
```

---

## Phase 5 — User Portal

### 5a. Portal Layout & Sidebar
**Prompt:**
```
Create src/components/layout/PortalSidebar.tsx:
  Nav links using NavLink:
    Home (/portal) — Home icon
    My Bookings (/portal/bookings) — BookOpen icon
    Book a Yatra (/portal/yatras, goes to public yatras page) — Map icon
    My Profile (/portal/profile) — User icon
    Verify Identity (/portal/verify) — ShieldCheck icon

  Bottom of sidebar:
    User avatar (initials if no photo), name, verification status badge
    Sign Out button

  Verification status badge colors:
    not_submitted → gray "Not Verified"
    submitted → yellow "Under Review"
    verified → green "Verified"
    rejected → red "Rejected"

  If verification_status is not_submitted or rejected:
    Show orange banner at top of sidebar:
    "⚠️ Verify your identity to book Yatras" with link to /portal/verify

Create src/components/layout/PortalLayout.tsx:
  Desktop: sidebar (fixed left 240px) + main content area
  Mobile: bottom navigation tabs (Home, Bookings, Profile, Verify)
  Renders <Outlet /> in the main content area

Create src/pages/portal/PortalHomePage.tsx:
  If user has bookings: redirect to /portal/bookings
  Otherwise: welcome screen
    "Welcome, {name}!"
    If not verified: verification CTA card
    "Browse upcoming Yatras" → link to /yatras
```

### 5b. Profile Page
**Prompt:**
```
Create src/pages/portal/ProfilePage.tsx:

  useQuery(QUERY_KEYS.profile, () => apiClient.get('/api/users/me').then(r => r.data.user))

  Two sections:

  Section 1 — Edit Profile
    Pre-filled form: Full Name, Phone
    Submit: supabase.from('users').update({ full_name, phone }).eq('id', user.id)
    On success: invalidateQueries(QUERY_KEYS.profile) + toast "Profile updated"

  Section 2 — Verification Status
    Show current status with icon and badge
    not_submitted: gray badge + "Verify Now" button → /portal/verify
    submitted: yellow badge "Under Review — we'll notify you"
    verified: green badge with CheckCircle icon
    rejected: red badge + "Resubmit" button → /portal/verify
      Show any rejection notes if available
```

### 5c. Verification Page
**Prompt:**
```
Create src/pages/portal/VerifyPage.tsx:

  If verification_status === 'submitted': show "Verification Under Review" message
  If verification_status === 'verified': show "Already Verified" message

  Otherwise show a 4-step wizard:

  Step indicator at top (1 → 2 → 3 → 4), saffron color for active/completed

  Step 1 — Aadhaar Number
    Input: 12-digit Aadhaar number
    Validation: /^\d{12}$/ — show error if invalid
    "Continue" button

  Step 2 — Upload Aadhaar Image
    File input (accept="image/*")
    Preview thumbnail after selection
    On click "Upload": POST to /api/users/upload-aadhaar (FormData with field aadhaarImage)
      Use apiClient (Bearer token is auto-attached)
      Show upload progress or spinner
      On success: store path in state, show green checkmark
    "Continue" button (disabled until uploaded)

  Step 3 — Upload Selfie
    Same as Step 2 but: POST to /api/users/upload-selfie (field: selfieImage)
    Store selfie path in state

  Step 4 — Review & Submit
    Show: Aadhaar number (masked: XXXX XXXX 1234), Aadhaar image preview, Selfie preview
    "Submit for Verification" button
      POST to /api/users/verification/submit
      Body: { aadhaarNumber, aadhaarImagePath, selfieImagePath }
      On success: navigate to /portal/profile + toast "Verification submitted!"
```

### 5d. Bookings List
**Prompt:**
```
Create src/hooks/useBookings.ts:
  useMyBookings(): useQuery(QUERY_KEYS.bookings, () =>
    apiClient.get('/api/bookings').then(r => r.data.bookings))

Create src/components/portal/BookingCard.tsx:
  Props: { booking: BookingRow & { packageTitle?: string } }
  Card showing: booking_reference, package title, status badge, traveler_count,
  total_amount (₹ formatted), created_at date
  "View Details" button → /portal/bookings/[id]
  
  Status badge colors:
    payment_pending → yellow, text "Payment Pending"
    paid → green, text "Confirmed"
    cancelled → red, text "Cancelled"
    completed → blue, text "Completed"

Create src/pages/portal/BookingsPage.tsx:
  Use useMyBookings hook
  For each booking, also fetch package title:
    Either join in the API (backend /api/bookings should join travel_packages.title)
    Or fetch packages separately and match by package_id
  Loading: 3 skeleton BookingCards
  Empty state: EmptyState with "No bookings yet" + "Browse Yatras" button → /yatras
```

### 5e. Booking Detail + Payment
**Prompt:**
```
Create src/pages/portal/BookingDetailPage.tsx:
  useParams() to get id
  useQuery(QUERY_KEYS.booking(id), () => apiClient.get('/api/bookings/' + id).then(r => r.data))

  Show full booking details in a card:
    Package name, booking reference, status badge
    Traveler info: name, phone, WhatsApp, DOB, address
    Travel preferences: transport type, bus type (if train), room type
    Number of travelers, special notes
    Total amount (₹ formatted)
    Created date

  If status === 'payment_pending':
    Yellow info banner: "Payment required to confirm your booking"
    "Pay Now" button — triggers Razorpay flow:

      1. POST /api/payments/create-order { bookingId }
         → returns { order: { id, amount, currency } }
      
      2. Load Razorpay script dynamically if not already loaded:
         const script = document.createElement('script')
         script.src = 'https://checkout.razorpay.com/v1/checkout.js'
         document.body.appendChild(script)
      
      3. Open checkout:
         const rzp = new window.Razorpay({
           key: import.meta.env.VITE_RAZORPAY_KEY_ID,
           amount: order.amount,
           currency: order.currency,
           name: 'Shri Gurudev Ashram',
           description: 'Yatra Booking - ' + booking.bookingReference,
           order_id: order.id,
           handler: async (response) => {
             await apiClient.post('/api/payments/verify', {
               bookingId, ...response
             })
             invalidateQueries(QUERY_KEYS.booking(id))
             toast success "Payment successful! Booking confirmed."
           },
           theme: { color: '#E97B22' }
         })
         rzp.open()

  If status === 'paid': green banner "Booking Confirmed ✓"
  If status === 'cancelled': red banner "This booking was cancelled"
```

### 5f. Booking Form
**Prompt:**
```
Create src/pages/portal/BookPage.tsx:
  useParams() to get packageId
  Fetch package: supabase.from('travel_packages').select('*').eq('id', packageId).single()
  
  First check: if userProfile?.verification_status === 'not_submitted':
    Show full-page blocker:
      ShieldX icon
      "Identity Verification Required"
      "You must submit your Aadhaar and selfie before booking a Yatra"
      "Verify My Identity" button → /portal/verify

  Otherwise show the booking form:

  Top: Package summary card (read-only)
    Title, price per person, remaining seats, duration
    If remaining_seats === 0: "Sold Out" badge, disable form

  Form sections:

  1. Personal Information
     Full Name (text, required)
     Phone Number (text, pattern \d{10}, required)
     WhatsApp Number (text, pattern \d{10}, required)
     Date of Birth (date input, required)
     Address (textarea, required)

  2. Travel Preferences
     Transport Type (radio group): Flight | Train
     If Train selected → show Bus Type (radio group): AC Train | Non-AC Train
     Room Type (radio group): AC Room | Non-AC Room

  3. Booking Details
     Number of Travelers (number input, min 1, max remaining_seats)
     Special Notes (textarea, optional)

  4. Price Summary (live calculation)
     Per person: ₹{price}
     Travelers: × {travelerCount}
     Total: ₹{price × travelerCount}
     (Show in a highlighted box)

  Submit: "Proceed to Payment" button
    Calls POST /api/bookings with CreateBookingInput
    On success: navigate to /portal/bookings/[newBooking.id] + toast "Booking created!"
    The booking starts as payment_pending — payment happens on the detail page

  Pre-fill Full Name and Phone from userProfile for convenience
```

---

## Phase 6 — Admin Dashboard

### 6a. Admin Layout & Sidebar
**Prompt:**
```
Create src/components/layout/AdminSidebar.tsx:
  Nav links with NavLink (highlight active):
    Dashboard (/admin) — LayoutDashboard icon
    Users (/admin/users) — Users icon
    Verifications (/admin/verifications) — ShieldCheck icon + pending count badge
    Bookings (/admin/bookings) — BookOpen icon
    Packages (/admin/packages) — Map icon
  Bottom: admin user name + logout button

Create src/components/layout/AdminLayout.tsx:
  Desktop: 240px fixed sidebar + full main area
  Mobile: hamburger menu triggers a slide-out drawer
  Top header bar: page title (derive from current route) + admin user info
  Renders <Outlet /> for page content

  The verification badge count: fetch from QUERY_KEYS.adminStats on layout mount,
  use data.pendingVerifications as the badge number. Refetch every 60 seconds.
```

### 6b. Dashboard
**Prompt:**
```
Create src/components/admin/StatsCard.tsx:
  Props: { title, value, icon: LucideIcon, color: string, onClick?: () => void }
  Card with icon on right, large number, title below, subtle colored background

Create src/pages/admin/AdminDashboardPage.tsx:
  useQuery(QUERY_KEYS.adminStats, () => apiClient.get('/api/admin/stats').then(r => r.data),
    { refetchInterval: 30000 })

  5 StatsCards:
    Total Users (Users, blue)
    Total Bookings (BookOpen, orange)
    Total Revenue (IndianRupee, green) — format ₹ with en-IN locale
    Pending Verifications (ShieldAlert, yellow) — onClick → navigate to /admin/verifications
    Active Packages (Map, purple)

  Below cards, two panels side by side:
  Left: Recent Bookings table (fetch /api/admin/bookings?limit=5&page=1)
    Columns: Ref, User, Amount, Status, Date
    "View All" → /admin/bookings

  Right: Quick Stats or pending verifications prompt
    If pendingVerifications > 0: orange alert "X verifications need review" + button
```

### 6c. User Management
**Prompt:**
```
Create src/pages/admin/AdminUsersPage.tsx:
  State: page (default 1), search (debounced 300ms), statusFilter

  useQuery(QUERY_KEYS.adminUsers(page, search, statusFilter), () =>
    apiClient.get('/api/admin/users', { params: { page, limit: 20, search, status: statusFilter } })
    .then(r => r.data))

  Above table: search input + status filter dropdown (All, Not Submitted, Submitted, Verified, Rejected)
  
  Table columns: Name, Email, Phone, Verification Status, Role, Registered, Actions
  Status badge with colors
  Actions: "View" button → /admin/users/[id]
  Pagination controls below table (Previous / Next / page numbers)

Create src/pages/admin/AdminUserDetailPage.tsx:
  useParams id
  useQuery(QUERY_KEYS.adminUser(id), () => apiClient.get('/api/admin/users/' + id).then(r => r.data))
  
  Layout: two columns

  Left panel — User Profile:
    Name, email, phone, role, registration date
    Verification Status section:
      If aadhaar_image_path: show image (get public URL from Supabase storage)
      If selfie_image_path: show image
      Aadhaar number (full, not masked — admin can see it)
    
    If status === 'submitted': two action buttons side by side:
      "Approve Verification" (green) — PUT /api/admin/users/:id/verification { status: 'verified' }
      "Reject Verification" (red) — PUT /api/admin/users/:id/verification { status: 'rejected' }
      Both buttons call invalidateQueries on success

  Right panel — User's Bookings:
    Table of all bookings for this user
    Columns: Booking Ref, Package, Amount, Status, Date
    Each row links to /admin/bookings/[id]
```

### 6d. Verification Queue
**Prompt:**
```
Create src/pages/admin/AdminVerificationsPage.tsx:
  Fetch: apiClient.get('/api/admin/users', { params: { status: 'submitted', limit: 50 } })
  useQuery(QUERY_KEYS.adminUsers(1, '', 'submitted'), ...)

  If empty: EmptyState "No pending verifications 🎉" with ShieldCheck icon (green)

  Grid of VerificationCard components (2-3 per row)

Create src/components/admin/VerificationCard.tsx:
  Props: { user: AdminUser }
  Card showing:
    User name, email, phone
    Submitted date (created_at or updated_at)
    Small preview of aadhaar image (thumbnail)
    "Review" button → /admin/users/[user.id]
  Orange border to signal urgency
```

### 6e. Booking Management
**Prompt:**
```
Create src/pages/admin/AdminBookingsPage.tsx:
  State: page, statusFilter (default: all)

  useQuery(QUERY_KEYS.adminBookings(page, statusFilter), () =>
    apiClient.get('/api/admin/bookings', { params: { page, limit: 20, status: statusFilter } })
    .then(r => r.data))

  Filters bar: Status tabs (All | Payment Pending | Paid | Cancelled | Completed)
  Export CSV button (see below)
  
  Table: Booking Ref, User Name, Package, Travelers, Amount, Status, Date, Actions
  "View" → /admin/bookings/[id]

  CSV Export:
    Fetch all bookings matching current filter (no pagination, high limit like 1000)
    Build CSV string from: booking_reference, full_name, phone_number, whatsapp_number,
    dob, address, transport_type, bus_type, room_type, traveler_count, total_amount, status, created_at
    Trigger download: create blob URL, click anchor, revoke
    Filename: bookings-[status]-[YYYY-MM-DD].csv

Create src/pages/admin/AdminBookingDetailPage.tsx:
  Full booking details layout:
    Section 1: Traveler Information (all fields in a readable grid)
    Section 2: Package Info (title, duration, price)
    Section 3: Payment Info (from payments array in response)
    Section 4: Status history / timeline (simplified)
    Admin Notes: textarea that saves on blur → PUT or PATCH to update admin_notes
```

### 6f. Package Management
**Prompt:**
```
Create src/pages/admin/AdminPackagesPage.tsx:
  useQuery(QUERY_KEYS.adminPackages, () => apiClient.get('/api/admin/packages').then(r => r.data.packages))

  "Add New Package" button → navigate to /admin/packages/new
  
  Table: Title, Price (₹), Duration, Total Seats, Remaining, Status (Active/Inactive), Actions
  Actions per row:
    Edit (pencil icon) → /admin/packages/[id]/edit
    Deactivate (toggle) → DELETE /api/admin/packages/:id (sets is_active=false)
    Reactivate → PUT /api/admin/packages/:id { is_active: true }
  Confirm deactivate with a shadcn AlertDialog

Create src/components/admin/PackageForm.tsx:
  Props: { initialData?: TravelPackageRow, onSubmit: (data) => Promise<void>, submitLabel: string }
  
  Fields:
    Title (text, required)
    Description (textarea, required, min 50 chars)
    Price in INR (number, required, min 1)
    Duration (text, required, placeholder "7 Days / 6 Nights")
    Total Seats (number, required, min 1)
    Remaining Seats (number, required, must be ≤ total_seats)
    Image URL (text, optional, show preview if valid URL)
    Is Active (shadcn Switch/toggle)
  
  Submit button shows loading spinner while submitting
  Validation: all required fields, price > 0, remaining ≤ total

Create src/pages/admin/AdminPackageNewPage.tsx:
  <PackageForm submitLabel="Create Package"
    onSubmit={data => apiClient.post('/api/admin/packages', data)
      .then(() => { navigate('/admin/packages'); toast.success('Package created') })} />

Create src/pages/admin/AdminPackageEditPage.tsx:
  Fetch package by id: apiClient.get('/api/admin/packages') then find by id (or add GET /api/admin/packages/:id)
  <PackageForm initialData={package} submitLabel="Save Changes"
    onSubmit={data => apiClient.put('/api/admin/packages/' + id, data)
      .then(() => { navigate('/admin/packages'); toast.success('Package updated') })} />
```

---

## Phase 7 — Polish & Production Readiness

### 7a. Shared UI Components
**Prompt:**
```
Create src/components/shared/LoadingState.tsx:
  Props: { variant: 'cards' | 'table' | 'detail' | 'full-page' }
  'cards': grid of 3-6 skeleton cards
  'table': skeleton table with 5 rows
  'detail': skeleton for a detail page (header + two columns)
  'full-page': centered spinner (Loader2 from lucide, animate-spin, saffron color)

Create src/components/shared/ErrorState.tsx:
  Props: { message?: string, onRetry?: () => void }
  Centered card with AlertCircle icon, error message, optional Retry button

Create src/components/shared/EmptyState.tsx:
  Props: { icon?: LucideIcon, title: string, description?: string, action?: { label: string, href: string } }
  Centered layout with icon, title, description, optional CTA button
```

### 7b. Toast Setup
**Prompt:**
```
shadcn Toaster should already be in main.tsx from Phase 1.

Create src/hooks/useToast.ts:
  import { toast } from 'sonner' (or use shadcn toast hook)
  export const useAppToast = () => ({
    success: (msg: string) => toast.success(msg),
    error: (msg: string) => toast.error(msg),
    info: (msg: string) => toast.info(msg),
    loading: (msg: string) => toast.loading(msg),
  })

Standard toast messages to use across the app:
  success: "Profile updated", "Booking created", "Payment successful", "Verification submitted",
           "Package created", "Verification approved", "Verification rejected"
  error: show error.response?.data?.error or "Something went wrong, please try again"
  info: "Redirecting to payment...", "Submitting verification..."
```

### 7c. Page Titles
**Prompt:**
```
Since this is a React SPA (no Next.js generateMetadata), manage page titles with useEffect:

Create src/hooks/usePageTitle.ts:
  export const usePageTitle = (title: string) => {
    useEffect(() => {
      document.title = title + ' — Shri Gurudev Ashram'
      return () => { document.title = 'Shri Gurudev Ashram' }
    }, [title])
  }

Use it at the top of each page component:
  usePageTitle('Home')
  usePageTitle('Upcoming Yatras')
  usePageTitle(package?.title ?? 'Yatra Detail')
  usePageTitle('My Bookings')
  usePageTitle('Admin Dashboard')
  etc.
```

### 7d. SPA Routing Fix for Deployment
**Prompt:**
```
Since this is a Vite SPA, all routes must serve index.html.

Create public/_redirects (for Netlify):
  /*  /index.html  200

Create vercel.json (for Vercel):
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }

Update vite.config.ts to set base: '/' (already default but be explicit)
```

---

## Phase 8 — Deployment

### Frontend (Netlify — recommended for Vite SPA)
```
1. Push website repo to GitHub
2. Connect to Netlify → New site from Git
3. Build command: npm run build
4. Publish directory: dist
5. Add environment variables in Netlify dashboard:
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_API_BASE_URL      ← production backend URL
   VITE_RAZORPAY_KEY_ID
6. Netlify auto-detects _redirects from public/ folder — no extra config needed
7. Update backend CORS origin with the Netlify URL
```

### Frontend (Vercel — also works)
```
1. Push to GitHub → connect to Vercel
2. Framework preset: Vite
3. Add the same VITE_* environment variables
4. vercel.json handles SPA routing rewrites
```

### Backend (Railway)
```
1. Push backend to GitHub
2. New Railway project → Deploy from GitHub repo
3. Environment variables:
   PORT=3000
   SUPABASE_URL=https://jpvowbxojdvrpgtpxvmo.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=...
   RAZORPAY_KEY_ID=rzp_live_...
   RAZORPAY_KEY_SECRET=...
   RAZORPAY_WEBHOOK_SECRET=...
4. Start command: node dist/server.js
5. Railway gives you a URL like https://xxx.railway.app
6. Update VITE_API_BASE_URL in frontend to this URL
7. Update CORS in backend to allow the Netlify/Vercel domain
8. Update Razorpay webhook URL in the Razorpay dashboard
```

---

## Complete API Contract Reference

All calls from website → Express backend require `Authorization: Bearer <supabase_jwt>`

| Method | Endpoint | Auth | Body / Params | Returns |
|--------|----------|------|---------------|---------|
| GET | /api/users/me | User | — | `{ user }` |
| POST | /api/users/upload-aadhaar | User | multipart: `aadhaarImage` | `{ path }` |
| POST | /api/users/upload-selfie | User | multipart: `selfieImage` | `{ path }` |
| POST | /api/users/verification/submit | User | `{ aadhaarNumber, aadhaarImagePath, selfieImagePath }` | `{ user }` |
| POST | /api/bookings | User | CreateBookingInput | `{ booking }` |
| GET | /api/bookings | User | — | `{ bookings[] }` |
| GET | /api/bookings/:id | User | — | `{ booking }` |
| POST | /api/payments/create-order | User | `{ bookingId }` | `{ order, booking }` |
| POST | /api/payments/verify | User | `{ bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature }` | `{}` |
| GET | /api/admin/stats | Admin | — | `AdminStats` |
| GET | /api/admin/users | Admin | `?page&limit&search&status` | `{ users[], total }` |
| GET | /api/admin/users/:id | Admin | — | `{ user, bookings[] }` |
| PUT | /api/admin/users/:id/verification | Admin | `{ status, notes? }` | `{ user }` |
| GET | /api/admin/bookings | Admin | `?page&limit&status&packageId` | `{ bookings[], total }` |
| GET | /api/admin/bookings/:id | Admin | — | `{ booking, user, package, payments[] }` |
| GET | /api/admin/packages | Admin | — | `{ packages[] }` |
| POST | /api/admin/packages | Admin | PackageInput | `{ package }` |
| PUT | /api/admin/packages/:id | Admin | PackageInput (partial) | `{ package }` |
| DELETE | /api/admin/packages/:id | Admin | — | `{ package }` (is_active=false) |

Supabase direct (anon key, no backend):
- `travel_packages` — public SELECT (set RLS: allow select for all)
- `users` — SELECT own row only (RLS: id = auth.uid())
- Auth: signIn, signUp, signOut, resetPasswordForEmail, updateUser

---

## Recommended Build Order (For Antigravity Sessions)

Run these as separate agentic sessions, one at a time:

```
Session 1:  Phase 0 — Bootstrap project, install all deps, folder structure
Session 2:  Phase 1a-1b — Types + Supabase client + apiClient + queryKeys
Session 3:  Phase 1c-1d — AuthContext + useAuth + ProtectedRoute/AdminRoute/GuestRoute
Session 4:  Phase 1e — Full router setup (all routes, all layouts as empty shells)
Session 5:  Phase 2 — Backend admin routes (in the Express backend project)
Session 6:  Phase 3a — PublicLayout + PublicHeader + PublicFooter
Session 7:  Phase 3b-3c — HomePage + PackageCard
Session 8:  Phase 3d — YatrasPage + YatraDetailPage
Session 9:  Phase 3e — About + Contact + Gallery + FAQ pages
Session 10: Phase 4 — All auth pages (Login, Signup, Forgot, Reset)
Session 11: Phase 5a — PortalLayout + PortalSidebar + PortalHomePage
Session 12: Phase 5b-5c — ProfilePage + VerifyPage
Session 13: Phase 5d-5e — BookingsPage + BookingDetailPage + Razorpay payment
Session 14: Phase 5f — BookPage (booking form)
Session 15: Phase 6a-6b — AdminLayout + AdminSidebar + AdminDashboardPage
Session 16: Phase 6c-6d — AdminUsersPage + AdminUserDetailPage + AdminVerificationsPage
Session 17: Phase 6e — AdminBookingsPage + AdminBookingDetailPage + CSV export
Session 18: Phase 6f — AdminPackagesPage + PackageForm + New/Edit pages
Session 19: Phase 7 — Loading/Error/Empty states + Toast + Page titles
Session 20: Phase 8 — Deployment config files + final CORS update
```

---

## CLAUDE.md / AGENTS.md for the Website Project

Put this file at the root of the website repo. Every new Antigravity session reads it automatically.

```markdown
# Shri Gurudev Ashram Website

## Stack
- Vite + React 19 + TypeScript (strict mode)
- React Router DOM v6 (createBrowserRouter)
- Tailwind CSS + shadcn/ui
- TanStack Query v5 for all server state
- @supabase/supabase-js (browser client, no SSR)
- Axios apiClient in src/lib/apiClient.ts (auto-attaches Bearer token)

## Key Conventions
- ALL authenticated API calls go through src/lib/apiClient.ts
- Public Supabase reads (travel_packages) use src/lib/supabase.ts directly
- Route protection uses wrapper components: ProtectedRoute, AdminRoute, GuestRoute
- All routes defined in src/router/index.tsx — add new routes there only
- Auth state lives in src/context/AuthContext.tsx — consume via useAuth() hook
- TanStack Query key constants in src/lib/queryKeys.ts
- usePageTitle() hook for document.title on every page

## Env Variables (VITE_ prefix, not NEXT_PUBLIC_)
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_API_BASE_URL
- VITE_RAZORPAY_KEY_ID

## Color Tokens
- Primary: #E97B22 (saffron)
- Primary Dark: #C4611A
- Background: #FDF8F3 (cream)
- Text: #1A1A1A
- Muted: #6B7280

## Booking Rules — DO NOT CHANGE
- verification_status = 'not_submitted' → cannot book
- transportType: 'Flight' | 'Train' (only)
- busType required only when transportType = 'Train': 'AC Train' | 'Non-AC Train'
- roomType: 'AC Room' | 'Non-AC Room' (only)
- phoneNumber + whatsappNumber: /^\d{10}$/
- aadhaarNumber: /^\d{12}$/

## Admin vs User
- Admin users have role = 'admin' in the users table
- Admin routes protected by AdminRoute component (checks userProfile.role)
- All admin data goes through /api/admin/* Express routes (backend enforces requireAdmin)
- No Supabase service role key on the frontend — ever
```

---

## Security Checklist

Before going live, verify:

- [ ] No secrets in VITE_* vars (only public anon key + Razorpay key ID are safe)
- [ ] ProtectedRoute correctly redirects unauthenticated users from /portal/*
- [ ] AdminRoute correctly redirects non-admin users from /admin/*
- [ ] Backend requireAdmin middleware is on all /api/admin/* routes (not just requireAuth)
- [ ] File upload paths in backend are scoped to user ID
- [ ] Razorpay signature verification happens on the backend (already done)
- [ ] Webhook endpoint validates secret (already done in backend)
- [ ] No /api/bookings endpoint without requireAuth
- [ ] Production backend uses HTTPS
- [ ] Razorpay key switched to rzp_live_* before launch
- [ ] Supabase RLS:
      travel_packages → allow public SELECT
      bookings → allow SELECT/INSERT for own rows only (auth.uid() = user_id)
      users → allow SELECT/UPDATE for own row only (auth.uid() = id)
- [ ] CORS on backend allows only your specific frontend domain (not *)
```
