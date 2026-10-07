import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests',testMatch:'*.spec.ts',timeout:90000,expect:{timeout:20000},workers:1,fullyParallel:false,
  reporter:[['list'],['./scripts/evidence-test-reporter.cjs']],use:{baseURL:'http://127.0.0.1:4173',viewport:{width:1280,height:900},trace:'retain-on-failure'},
  projects:[{name:'chromium',use:{browserName:'chromium',channel:process.env.CI?undefined:'chromium',headless:!!process.env.CI,launchOptions:{args:process.env.CI?[]:['--use-angle=metal']}}},{name:'firefox',use:{browserName:'firefox',headless:!!process.env.CI}},...(process.env.BANO_WEBKIT?[{name:'webkit',testMatch:/lightmaps\.spec\.ts|window\.spec\.ts/,use:{browserName:'webkit' as const,headless:!!process.env.CI}}]:[])],
  webServer:{command:'npm run preview',port:4173,reuseExistingServer:!process.env.CI,timeout:15000}
});
