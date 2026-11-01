import { test, expect, type Page } from '@playwright/test';

const hour = 3_600_000;
const event = {
  startsAt: new Date(Date.now() - hour).toISOString(),
  endsAt: new Date(Date.now() + 5 * hour).toISOString(),
  claimUntil: new Date(Date.now() + 5 * hour).toISOString(),
  live: true,
};
const ready = { event, price: 50, earned: 2, used: 0, available: 2, deposited: 600, pending: 0 };

async function signIn(page: Page, spins: object | null) {
  await page.addInitScript(() => {
    localStorage.setItem('superbet_token', 'test-token');
    localStorage.setItem('username', 'tester');
  });
  await page.route('**/v1/auth/me', (r) => r.fulfill({ json: { user: { username: 'tester', phone: '' } } }));
  await page.route('**/v1/wallet/balance', (r) => r.fulfill({ json: { balance: 500, currency: 'ETB' } }));
  await page.route('**/v1/promo/spins', (r) =>
    spins ? r.fulfill({ json: spins }) : r.fulfill({ status: 404, json: { error: 'Not found' } })
  );
  await page.route('**/v1/promo/spins/winners', (r) =>
    r.fulfill({ json: { items: [{ id: 'w1', player: '09*****613', prizeId: 'bonus250', at: new Date().toISOString() }] } })
  );
}

test.describe('spin & win', () => {
  test('spins the wheel and reveals the prize the server picked', async ({ page }) => {
    await signIn(page, ready);
    await page.route('**/v1/promo/spins/spin', (r) =>
      r.fulfill({ json: { prizeId: 'bonus20', status: { ...ready, used: 1, available: 1 } } })
    );

    await page.goto('/spin');
    await expect(page.getByText('09*****613')).toBeVisible();
    await expect(page.getByText('won 250 ETB bonus')).toBeVisible();
    await expect(page.getByText('Deposit 400 ETB more today to earn free spin #3')).toBeVisible();

    await page.getByRole('button', { name: 'Spin the wheel' }).click();
    const dialog = page.getByRole('dialog', { name: '20 ETB bonus' });
    await expect(dialog).toBeVisible({ timeout: 12_000 });
    await expect(dialog.getByText('+20 ETB')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Spin again · 1 spin left' })).toBeVisible();
  });

  test('home banner shows ready spins, and the menu links to the wheel', async ({ page }) => {
    await signIn(page, ready);
    await page.goto('/');
    await expect(page.getByText('You have 2 spins ready')).toBeVisible();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('navigation', { name: 'App sections' }).getByRole('link', { name: 'Spin & Win' }).click();
    await expect(page).toHaveURL(/\/spin$/);
  });

  test('daily banner counts down and asks for a deposit when no spins are earned yet', async ({ page }) => {
    await signIn(page, { ...ready, earned: 0, available: 0, deposited: 0 });
    await page.goto('/');
    await expect(page.getByText(/Daily · resets in/)).toBeVisible();
    await expect(page.getByText('Deposit 200 ETB or more today for up to 3 free spins')).toBeVisible();
  });

  test('once today\'s free spins are used, the banner offers one to buy', async ({ page }) => {
    await signIn(page, { ...ready, earned: 3, used: 3, available: 0, deposited: 1200 });
    await page.goto('/');
    await expect(page.getByText('Buy a spin for 50 ETB')).toBeVisible();
  });

  test('buys a spin for 50 ETB and offers another', async ({ page }) => {
    await signIn(page, { ...ready, earned: 0, available: 0, deposited: 0 });
    let bought = 0;
    await page.route('**/v1/promo/spins/buy', (r) => {
      bought += 1;
      return r.fulfill({ json: { prizeId: 'bonus15', paid: true, status: { ...ready, earned: 0, available: 0, deposited: 0 } } });
    });
    await page.goto('/spin');
    await page.locator('summary', { hasText: 'Rules' }).click();
    await expect(page.getByRole('row', { name: '50,000 ETB cash 1 in 100,000' })).toBeVisible();
    await page.getByRole('button', { name: 'Buy a spin · 50 ETB' }).click();
    const dialog = page.getByRole('dialog', { name: '15 ETB bonus' });
    await expect(dialog).toBeVisible({ timeout: 12_000 });
    await expect(dialog.getByRole('button', { name: 'Buy another spin · 50 ETB' })).toBeVisible();
    expect(bought).toBe(1);
  });

  test('a failed purchase shows why', async ({ page }) => {
    await signIn(page, { ...ready, earned: 0, available: 0, deposited: 0 });
    await page.route('**/v1/promo/spins/buy', (r) =>
      r.fulfill({ status: 402, json: { error: 'You need 50 ETB in your cash balance to buy a spin.' } })
    );
    await page.goto('/spin');
    await page.getByRole('button', { name: 'Buy a spin · 50 ETB' }).click();
    await expect(page.getByRole('alert')).toHaveText('You need 50 ETB in your cash balance to buy a spin.');
  });

  test('stays hidden when the API has no Spin & Win', async ({ page }) => {
    await signIn(page, null);
    await page.goto('/spin');
    await expect(page.getByText(/isn.t available right now/)).toBeVisible();
    await page.goto('/');
    await expect(page.getByText('Spin & win up to')).toHaveCount(0);
    await expect(page.getByText('spins ready')).toHaveCount(0);
  });
});

test('a Keno prize sends the player to Fast Keno', async ({ page }) => {
  await signIn(page, { ...ready, available: 1 });
  await page.route('**/v1/promo/spins/spin', (r) =>
    r.fulfill({ json: { prizeId: 'keno5', status: { ...ready, used: 1, available: 0 } } })
  );
  await page.goto('/spin');
  await page.getByRole('button', { name: 'SPIN, 1 left' }).click();
  const dialog = page.getByRole('dialog', { name: '5 free Keno tickets' });
  await expect(dialog).toBeVisible({ timeout: 12_000 });
  await expect(dialog.getByRole('link', { name: 'Play Fast Keno' })).toHaveAttribute('href', '/keno');
});

test('a prize the server could not pay yet says it is on its way', async ({ page }) => {
  await signIn(page, { ...ready, available: 1 });
  await page.route('**/v1/promo/spins/spin', (r) =>
    r.fulfill({ json: { prizeId: 'bonus50', paid: false, status: { ...ready, used: 1, available: 0 } } })
  );
  await page.goto('/spin');
  await page.getByRole('button', { name: 'SPIN, 1 left' }).click();
  const dialog = page.getByRole('dialog', { name: '50 ETB bonus' });
  await expect(dialog).toBeVisible({ timeout: 12_000 });
  await expect(dialog.getByText(/Your prize is on its way/)).toBeVisible();
});
