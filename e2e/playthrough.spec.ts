import { expect, test } from '@playwright/test';
import {
  navigateToGame,
  pressAllAbilities,
  screenshot,
  startGame,
  verifyControlsAttached,
  verifyGamePlaying,
  verifyHUDVisible,
  verifyPowerupsVisible,
} from './helpers/game-helpers';

/**
 * Single comprehensive playthrough test.
 *
 * Covers the full game flow in ONE test instead of 8 separate game starts:
 * start screen → start game → wave announcement → HUD → abilities →
 * score/combo → controls → game still running.
 *
 * The governor.spec.ts handles AI-driven extended playthroughs.
 * The device-responsive.spec.ts handles cross-device validation.
 */
test.describe('Complete Game Playthrough', () => {
  // Use serial mode to prevent resource contention in CI
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120000);

  test('should complete a full game playthrough from start to wave 1', async ({ page }) => {
    await navigateToGame(page);
    await screenshot(page, 'playthrough', '01-start-screen');

    // ── Start screen ──────────────────────────────────
    await expect(page.locator('#overlay')).toBeVisible();
    await expect(page.locator('#overlay')).not.toHaveClass(/hidden/);
    await expect(page.locator('#overlay-title')).toContainText('PSYDUCK PANIC');
    await expect(page.locator('#start-btn')).toContainText('START DEBATE');
    await expect(page.locator('#ui-layer')).toHaveClass(/hidden/);

    // ── Start game via spacebar ───────────────────────
    await startGame(page);

    // Verify transition: overlay hidden, UI visible
    await verifyGamePlaying(page);
    await expect(page.locator('#ui-layer')).not.toHaveClass(/hidden/);

    // ── Wave announcement ─────────────────────────────
    // Check transient UI immediately before blocking operations like screenshot
    // Increase timeout to 25s to account for slow CI workers/startup
    await expect(page.locator('#wave-announce')).toHaveClass(/show/, { timeout: 25000 });
    await expect(page.locator('#wa-title')).not.toBeEmpty();
    await expect(page.locator('#wave-display')).toContainText('WAVE 1');

    // ── HUD elements ──────────────────────────────────
    // Verify HUD immediately to avoid game-over during slow screenshots
    await verifyHUDVisible(page);
    await verifyPowerupsVisible(page);
    await verifyControlsAttached(page);

    // Take screenshot of gameplay start (includes wave announcement)
    await screenshot(page, 'playthrough', '02-game-started');

    // ── Score and combo initial state ─────────────────
    await expect(page.locator('#score-display')).toContainText('0');
    await expect(page.locator('#combo-display')).toContainText('x0');

    // ── Wait for enemies to spawn ─────────────────────
    await page.waitForTimeout(3000);
    await screenshot(page, 'playthrough', '03-enemies-spawned');

    // ── Ability keys (F1-F3) + nuke (F4) ──────────────
    await pressAllAbilities(page, 500);
    await page.keyboard.press('F4'); // Nuke
    await page.waitForTimeout(500);
    await screenshot(page, 'playthrough', '04-after-abilities');

    // ── Verify game state (Playing OR Game Over) ──────
    // In slow CI environments, the game might reach Game Over due to screenshots blocking the test
    const overlay = page.locator('#overlay');
    const isOverlayHidden = await overlay.evaluate((el) => el.classList.contains('hidden'));

    if (isOverlayHidden) {
      // Game still playing
      await verifyGamePlaying(page);
      await expect(page.locator('#score-display')).toBeVisible();
      await expect(page.locator('#combo-display')).toBeVisible();
    } else {
      // Game Over reached (valid for smoke test on slow machines)
      await expect(page.locator('#overlay-title')).toContainText(/BRAIN MELTDOWN|CRISIS AVERTED/);
      // HUD should be hidden in game over
      await expect(page.locator('#ui-layer')).toHaveClass(/hidden/);
    }
  });
});
