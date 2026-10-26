import { test, expect, type Page } from '@playwright/test';

const hour = 3_600_000;
const event = {
  startsAt: new Date(Date.now() - 60_000).toISOString(),
  endsAt: new Date(Date.now() + hour).toISOString(),
  claimUntil: new Date(Date.now() + 25 * hour).toISOString(),
  live: true,
};
const ready = { event, earned: 2, used: 0, available: 2, deposited: 600, pending: 0 };

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
    await expect(page.getByText('Deposit 400 ETB more this hour to earn spin #3')).toBeVisible();

    await page.getByRole('button', { name: 'Spin the wheel' }).click();
    const dialog = page.getByRole('dialog', { name: '20 ETB bonus' });
    await expect(dialog).toBeVisible({ timeout: 12_000 });
    await expect(dialog.getByText('+20 ETB')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Spin again · 1 spin left' })).toBeVisible();
  });

  test('home banner shows ready spins, and the bottom nav links to the wheel', async ({ page }) => {
    await signIn(page, ready);
    await page.goto('/');
    await expect(page.getByText('You have 2 spins ready')).toBeVisible();
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Spin' }).click();
    await expect(page).toHaveURL(/\/spin$/);
  });

  test('live banner counts down and asks for a deposit when no spins are earned yet', async ({ page }) => {
    await signIn(page, { ...ready, earned: 0, available: 0, deposited: 0 });
    await page.goto('/');
    await expect(page.getByText(/Live · ends in/)).toBeVisible();
    await expect(page.getByText('Deposit 100 ETB or more during the hour to earn up to 3 spins')).toBeVisible();
  });

  test('stays hidden when no event is running', async ({ page }) => {
    await signIn(page, null);
    await page.goto('/spin');
    await expect(page.getByText(/isn.t running right now/)).toBeVisible();
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
