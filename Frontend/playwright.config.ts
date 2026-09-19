import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../Backend',
      url: 'http://127.0.0.1:3001/api/health',
      reuseExistingServer: true,
      timeout: 60000,
      env: {
        NODE_ENV: 'test',
        USE_LOCAL_DB: 'true',
        PORT: '3001',
      },
    },
    {
      command: 'npx vite --port 5173 --host 127.0.0.1',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: true,
      timeout: 60000,
      env: {
        VITE_API_BASE_URL: 'http://127.0.0.1:3001',
        VITE_DEMO_AUTH: 'true',
      },
    },
  ],
})
