import type { Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';

/**
 * Logs in as the wp-env default super-admin (admin / password).
 */
export async function loginAsAdmin( page: Page ): Promise< void > {
	await page.goto( '/wp-login.php' );
	await page.locator( '#user_login' ).fill( 'admin' );
	await page.locator( '#user_pass' ).fill( 'password' );
	await page.locator( '#wp-submit' ).click();
	await page.waitForURL( /\/wp-admin\// );
}

/**
 * Runs a wp-cli command inside the wp-env container, returning its stdout.
 *
 * Each argument is passed through individually (no shell interpolation),
 * so values with spaces or quotes don't need escaping and an unsanitised
 * value can't smuggle additional shell commands.
 *
 * @param args Arguments to append after `wp` in the container.
 */
export function wp( args: string[] ): string {
	return execFileSync(
		'npx',
		[ '--no-install', 'wp-env', 'run', 'cli', 'wp', ...args ],
		{
			stdio: [ 'ignore', 'pipe', 'inherit' ],
			cwd: process.cwd(),
		}
	)
		.toString()
		.trim();
}
