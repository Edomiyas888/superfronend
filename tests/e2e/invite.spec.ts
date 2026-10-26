import { test, expect, type Page } from '@playwright/test';

const summary = {
  phoneVerified: true,
  code: 'AB3K9XQ',
  link: 'https://t.me/SuperBetBot?start=ref_AB3K9XQ',
  rewardPercent: 10,
  earned: 30,
  counts: { joined: 5, rewarded: 3, waiting: 2, held: 0 },
  milestones: [
    { level: 5, bonus: 100, goldenSpins: 1, reached: false },
    { level: 10, bonus: 250, goldenSpins: 2, reached: false },
    { level: 25, bonus: 1000, goldenSpins: 0, reached: false },
  ],
  goldenSpins: 1,
  friends: [
    { id: 'r1', name: '09*****613', status: 'rewarded', joinedAt: new Date().toISOString(), phoneVerified: true, deposited: 100, reward: 10 },
    { id: 'r2', name: 'ab***e', status: 'joined', joinedAt: new Date().toISOString(), phoneVerified: false, deposited: 0, reward: 0 },
    { id: 'r3', name: '09*****777', status: 'joined', joinedAt: new Date().toISOString(), phoneVerified: true, deposited: 40, reward: 0 },
  ],
};

async function signIn(page: Page, flags: { phoneVerified: boolean; referred: boolean }, me = summary) {
  await page.addInitScript(() => {
    localStorage.setItem('superbet_token', 'test-token');
    localStorage.setItem('username', 'tester');
  });
  await page.route('**/v1/auth/me', (r) => r.fulfill({ json: { user: { username: 'tester', phone: '', ...flags } } }));
  await page.route('**/v1/wallet/balance', (r) => r.fulfill({ json: { balance: 500, currency: 'ETB' } }));
  await page.route('**/v1/promo/spins', (r) => r.fulfill({ status: 404, json: {} }));
  await page.route('**/v1/referrals/me', (r) => r.fulfill({ json: me }));
  await page.route('**/v1/referrals/leaderboard', (r) =>
    r.fulfill({ json: { items: [{ rank: 1, player: '09*****111', friends: 12 }] } })
  );
}

test('invite page shows the link, Golden 5 progress and each friend\'s status', async ({ page }) => {
  await signIn(page, { phoneVerified: true, referred: false });
  await page.goto('/invite');
  await expect(page.getByText('t.me/SuperBetBot?start=ref_AB3K9XQ')).toBeVisible();
  await expect(page.getByText('2 ተጨማሪ ጓደኞች ብቻ', { exact: false })).toBeVisible();
  await expect(page.getByText('+10 ብር ✓')).toBeVisible();
  await expect(page.getByText('ስልክ ይቀረዋል · Needs phone')).toBeVisible();
  await expect(page.getByText('40/100 ብር')).toBeVisible();
  await expect(page.getByText('12 ጓደኞች')).toBeVisible();
});

test('the Golden Wheel pays the prize the server picked', async ({ page }) => {
  await signIn(page, { phoneVerified: true, referred: false });
  await page.route('**/v1/referrals/golden-spin', (r) => r.fulfill({ json: { prizeId: 'golden250', goldenSpins: 0 } }));
  await page.goto('/invite');
  await page.getByRole('button', { name: 'Spin the Golden Wheel' }).click();
  await expect(page.getByRole('dialog').getByText('+250 ETB')).toBeVisible({ timeout: 12_000 });
});

test('an inviter without a verified phone is asked for it before getting a link', async ({ page }) => {
  await signIn(page, { phoneVerified: false, referred: false }, { ...summary, phoneVerified: false, code: null, link: null });
  await page.goto('/invite');
  await expect(page.getByText('መጀመሪያ ስልክዎን ያረጋግጡ')).toBeVisible();
  await expect(page.getByText('t.me/SuperBetBot')).toHaveCount(0);
});

test('an invited player with no verified phone is asked for it on the home page', async ({ page }) => {
  await signIn(page, { phoneVerified: false, referred: true });
  await page.goto('/');
  await expect(page.getByText('ስልክ ቁጥርዎን ያረጋግጡ')).toBeVisible();
});
