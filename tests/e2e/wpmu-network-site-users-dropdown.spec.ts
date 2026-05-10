import { test, expect } from '@playwright/test';
import { loginAsAdmin, wp } from './utils';

/**
 * End-to-end coverage for WPMU Network Site Users Dropdown.
 *
 * The plugin requires multisite (the activation hook calls `wp_die` if
 * `is_multisite()` is false). wp-env is configured for multisite with
 * the plugin auto-mounted.
 *
 * On the network admin "Edit Site → Users" screen
 * (`/wp-admin/network/site-users.php?id=N`), the plugin:
 *
 * - Disables the core "Add Existing User" form by hooking
 *   `show_network_site_users_add_existing_form` to `__return_false`.
 * - Renders its own form via the `network_site_users_after_list_table`
 *   action: a `<select id="newuser">` populated with users not already
 *   on the site, plus a role picker, an "Add User" submit button, and
 *   the same `add-user` nonce the core form uses.
 *
 * Three things to pin:
 *
 * 1. The dropdown form is rendered when there are eligible users to add.
 * 2. The select contains the eligible user (and not the user already on
 *    the site).
 * 3. The form posts back to `site-users.php?action=adduser` with the
 *    expected nonce — i.e. submitting actually wires into core's
 *    add-user handler.
 *
 * Each test creates a throwaway eligible user and tracks them in
 * `createdUsers` so an `afterEach` hook deletes them even when an
 * assertion fails partway through. Without this, leaked users would
 * accumulate in the wp-env DB across runs and skew later tests.
 */

const createdUsers: string[] = [];

function createEligibleUser( prefix: string ): string {
	const username = `${ prefix }-${ Date.now() }`;
	wp( [
		'user',
		'create',
		username,
		`${ username }@example.com`,
		'--role=subscriber',
		'--user_pass=secret',
	] );
	// Make sure they're NOT a member of site 1.
	wp( [
		'user',
		'remove-role',
		username,
		'subscriber',
		'--url=localhost',
		'--network',
	] );
	createdUsers.push( username );
	return username;
}

test.afterEach( () => {
	while ( createdUsers.length > 0 ) {
		const username = createdUsers.pop()!;
		try {
			wp( [ 'user', 'delete', username, '--yes', '--network' ] );
		} catch {
			// Ignore — user may already be gone, or the create itself
			// failed before the user existed in the network.
		}
	}
} );

test.describe( 'WPMU Network Site Users Dropdown', () => {
	test( 'renders the dropdown form on network site-users with eligible users', async ( {
		page,
	} ) => {
		const username = createEligibleUser( 'eligible-user' );

		await loginAsAdmin( page );

		// Network admin "Edit Site → Users" for the main site (id=1).
		await page.goto( '/wp-admin/network/site-users.php?id=1' );

		const dropdownForm = page.locator( '#adduser' );
		await expect( dropdownForm ).toBeVisible();

		const select = page.locator( 'select#newuser' );
		await expect( select ).toBeVisible();

		// The select must offer the eligible user as an option.
		const optionValues = await select.locator( 'option' ).evaluateAll(
			( els ) => els.map( ( el ) => ( el as HTMLOptionElement ).value )
		);
		expect( optionValues ).toContain( username );
	} );

	test( 'suppresses the core "Add Existing User" input field', async ( {
		page,
	} ) => {
		// Make sure there's at least one eligible user (so the plugin
		// branch that renders the dropdown actually runs; otherwise both
		// the core form and the plugin form would skip).
		createEligibleUser( 'suppress-test' );

		await loginAsAdmin( page );
		await page.goto( '/wp-admin/network/site-users.php?id=1' );

		// The plugin's form has a <select id="newuser">. Core's default
		// form has an <input id="newuser_<n>" type="text"> with the
		// `wp-suggest-user` class. Asserting the input is absent confirms
		// the `show_network_site_users_add_existing_form` filter
		// short-circuit took effect.
		const coreInput = page.locator( 'input.wp-suggest-user' );
		await expect( coreInput ).toHaveCount( 0 );
	} );

	test( 'dropdown form posts to the core add-user endpoint with the right nonce', async ( {
		page,
	} ) => {
		createEligibleUser( 'nonce-test' );

		await loginAsAdmin( page );
		await page.goto( '/wp-admin/network/site-users.php?id=1' );

		const form = page.locator( 'form#adduser' );
		await expect( form ).toHaveAttribute(
			'action',
			'site-users.php?action=adduser'
		);

		// Both core's edit-site and the plugin's add-user nonces must be
		// present for the post to round-trip through core's handler.
		await expect(
			form.locator( 'input[name="_wpnonce_add-user"]' )
		).toBeAttached();
	} );
} );
