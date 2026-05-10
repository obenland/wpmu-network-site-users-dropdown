import type { Page } from '@playwright/test';
import { execSync } from 'node:child_process';

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
 * @param args Arguments to append after `wp` in the container.
 */
export function wp( args: string ): string {
	return execSync( `npx wp-env run cli wp ${ args }`, {
		stdio: [ 'ignore', 'pipe', 'inherit' ],
		cwd: process.cwd(),
	} )
		.toString()
		.trim();
}
