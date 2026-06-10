import { expect, test } from '@playwright/test'

test('core flow: intro → quiz → results → claim link & email capture', async ({ page }) => {
  await page.goto('/')

  // Intro
  await expect(page).toHaveTitle(/The Vault/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('money locked up')
  await page.getByRole('button', { name: 'Open the vault' }).click()

  // Quiz: age → student → community → state → interests
  await expect(page.getByText('How old are you?')).toBeVisible()
  await page.getByRole('button', { name: '21–24' }).click()

  await expect(page.getByText('Are you a student?')).toBeVisible()
  await page.getByRole('button', { name: 'College student' }).click()

  await expect(page.getByText('Any of these communities?')).toBeVisible()
  await page.getByRole('button', { name: 'None of these — continue' }).click()

  await page.getByLabel('State').selectOption('NJ')
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('button', { name: 'AI tools' }).click()
  await page.getByRole('button', { name: 'Open my vault' }).click()

  // Results
  await expect(page.getByText('Value on the table*')).toBeVisible()
  await expect(page.getByText('Spotify Premium Student')).toBeVisible()

  // Category filter narrows the list
  await page.getByRole('button', { name: /^Student \(/ }).click()
  await expect(page.getByText('Free Weekly Credit Reports')).toBeHidden()
  await page.getByRole('button', { name: /^All \(/ }).click()

  // Claim links open the official source in a new tab
  const firstClaim = page.getByRole('link', { name: 'How to claim →' }).first()
  await expect(firstClaim).toHaveAttribute('href', /^https:\/\//)
  await expect(firstClaim).toHaveAttribute('target', '_blank')

  // Email capture succeeds
  await page.getByLabel('Email address').fill('vault-e2e@example.com')
  await page.getByRole('button', { name: 'Flag me' }).click()
  await expect(page.getByText("You're on the list.")).toBeVisible()
})

test('under-21 in a legal state never sees sportsbook offers', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open the vault' }).click()
  await page.getByRole('button', { name: '18–20' }).click()
  await page.getByRole('button', { name: 'College student' }).click()
  await page.getByRole('button', { name: 'None of these — continue' }).click()
  await page.getByLabel('State').selectOption('NJ')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Sports betting' }).click()
  await page.getByRole('button', { name: 'Open my vault' }).click()

  await expect(page.getByText('Value on the table*')).toBeVisible()
  await expect(page.getByText(/DraftKings/)).toHaveCount(0)
  await expect(page.getByText(/FanDuel/)).toHaveCount(0)
  await expect(page.getByText(/BetMGM/)).toHaveCount(0)
})
