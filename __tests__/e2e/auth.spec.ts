import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('allows a user to sign up, log in, and access protected pages', async ({ page }) => {
        // 1. Visit the homepage
        await page.goto('/');

        // 2. Navigate to sign-up page
        await page.getByRole('link', { name: /sign up/i }).click();

        // 3. Fill out the registration form
        const uniqueEmail = `test-${Date.now()}@example.com`;
        await page.getByLabel(/name/i).fill('Test User');
        await page.getByLabel(/email/i).fill(uniqueEmail);
        await page.getByLabel(/password/i).fill('Password123!');
        await page.getByLabel(/confirm password/i).fill('Password123!');

        // 4. Submit the form
        await page.getByRole('button', { name: /sign up/i }).click();

        // 5. Expect to be redirected to the sign-in page
        await expect(page).toHaveURL(/.*\/auth\/signin/);

        // 6. Sign in with the newly created account
        await page.getByLabel(/email/i).fill(uniqueEmail);
        await page.getByLabel(/password/i).fill('Password123!');
        await page.getByRole('button', { name: /sign in/i }).click();

        // 7. Expect to be redirected to the dashboard
        await expect(page).toHaveURL(/.*\/dashboard/);

        // 8. Verify user-specific content is visible
        await expect(page.getByText(/welcome, test user/i)).toBeVisible();

        // 9. Try accessing protected routes
        await page.goto('/symptom-checker');
        await expect(page.getByText(/symptom checker/i)).toBeVisible();

        // 10. Sign out
        await page.getByRole('button', { name: /sign out/i }).click();

        // 11. Verify redirect to homepage after logout
        await expect(page).toHaveURL(/.*\//);

        // 12. Verify protected routes are no longer accessible
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/.*\/auth\/signin/); // Should redirect to sign-in
    });

    test('displays validation errors on invalid registration', async ({ page }) => {
        // Go to the sign-up page
        await page.goto('/auth/signup');

        // Submit empty form
        await page.getByRole('button', { name: /sign up/i }).click();

        // Check for validation errors
        await expect(page.getByText(/name is required/i)).toBeVisible();
        await expect(page.getByText(/email is required/i)).toBeVisible();
        await expect(page.getByText(/password is required/i)).toBeVisible();

        // Fill with invalid data
        await page.getByLabel(/name/i).fill('T');
        await page.getByLabel(/email/i).fill('invalid-email');
        await page.getByLabel(/password/i).fill('short');
        await page.getByLabel(/confirm password/i).fill('different');

        // Submit the form
        await page.getByRole('button', { name: /sign up/i }).click();

        // Check for more specific validation errors
        await expect(page.getByText(/name must be at least/i)).toBeVisible();
        await expect(page.getByText(/email must be valid/i)).toBeVisible();
        await expect(page.getByText(/password must be at least/i)).toBeVisible();
        await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });

    test('displays error message on invalid login', async ({ page }) => {
        // Go to the sign-in page
        await page.goto('/auth/signin');

        // Attempt to login with invalid credentials
        await page.getByLabel(/email/i).fill('nonexistent@example.com');
        await page.getByLabel(/password/i).fill('WrongPassword123!');
        await page.getByRole('button', { name: /sign in/i }).click();

        // Check for error message
        await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    });
});
