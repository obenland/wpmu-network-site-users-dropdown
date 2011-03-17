<?php 
/** wpmu-network-site-users-dropdown.php
 * 
 * Plugin Name: WPMU Network Site Users Dropdown
 * Plugin URI: http://www.obenlands.de/en/portfolio/wpmu-network-site-users-dropdown
 * Description: Replaces the input field for adding existing users to a site with a more comfortable dropdown menu.
 * Version: 1.0
 * Author: Konstantin Obenland
 * Author URI: http://www.obenlands.de
 * License: GPL2
 */

class WPMU_Network_Site_Users_Dropdown {
	
	
	/////////////////////////////////////////////////////////////////////////////
	// METHODS, PUBLIC
	/////////////////////////////////////////////////////////////////////////////
	
	/**
	 * Constructor
	 * 
	 * Adds all necessary filters
	 * 
	 * @author	Konstantin Obenland
	 * @since	1.0
	 * @access	public
	 * 
	 * @return	void
	 */
	public function __construct () {
		
		add_action( 'network_site_users_after_list_table', array(
			&$this,
			'network_site_users_after_list_table'
		));
		
		add_action(
			'show_network_site_users_add_existing_form',
			'__return_false'
		);
	}
	
	
	/**
	 * Displays the dropdown form
	 * 
	 * @author	Konstantin Obenland
	 * @since	1.0
	 * @access	public
	 * 
	 * @global	$editblog_roles
	 * @global	$id
	 * @global	$default_role
	 * 
	 * @return	void
	 */
	public function network_site_users_after_list_table () {
		global $editblog_roles, $id, $default_role;
		
		// Get all registered Users
		$all_users = get_users(array(
			'blog_id'	=> ''
		));
		
		// Weed out all users, who are allready associated with the current site
		$users = array_udiff( $all_users, get_users(), array(
			&$this,
			'addable_users_callback'
		));

		if ( current_user_can( 'promote_users' ) AND ! empty( $users ) ) : ?>
		<h4 id="add-user"><?php _e('Add User to This Site'); ?></h4>
			<?php
			if ( current_user_can( 'create_users' )
				AND apply_filters( 'show_network_site_users_add_new_form', true ) ) : ?>
		<p><?php _e( 'You may add from existing network users, or set up a new user to add to this site.' ); ?></p>
			<?php else : ?>
		<p><?php _e( 'You may add from existing network users to this site.' ); ?></p>
			<?php endif; ?>
		<h5 id="add-existing-user"><?php _e('Add Existing User') ?></h5>
		<form action="site-users.php?action=adduser" id="adduser" method="post">
			<?php wp_nonce_field( 'edit-site' ); ?>
			<input type="hidden" name="id" value="<?php echo esc_attr( $id ) ?>" />
			<table class="form-table">
				<tr>
					<th scope="row"><?php _e( 'Username' ); ?></th>
					<td>
						<select name="newuser" id="newuser">
						<?php 
						foreach( $users as $user ){
						echo "\t" . '<option value="' . esc_attr( $user->user_login ) . '">' . esc_html( $user->display_name ) . '</option>';
						}
						?>
						</select>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php _e( 'Role'); ?></th>
					<td><select name="new_role" id="new_role_0">
					<?php
					reset( $editblog_roles );
					foreach ( $editblog_roles as $role => $role_assoc ){
						$name = translate_user_role( $role_assoc['name'] );
						$selected = ( $role == $default_role ) ? ' selected="selected"' : '';
						echo '<option' . $selected . ' value="' . esc_attr( $role ) . '">' . esc_html( $name ) . '</option>';
					}
					?>
					</select></td>
				</tr>
			</table>
			<?php wp_nonce_field( 'add-user', '_wpnonce_add-user' ) ?>
			<?php submit_button( __('Add User'), 'primary', 'add-user' ); ?>
		</form>
		<?php endif;
	}
	
	
	/////////////////////////////////////////////////////////////////////////////
	// METHODS, PROTECTED
	/////////////////////////////////////////////////////////////////////////////
	
	/**
	 * Compares the objects and returns whether they match or not.
	 * 
	 * @author	Konstantin Obenland
	 * @since	1.0
	 * @access	protected
	 * 
	 * @param	stdClass	$all_users
	 * @param	stdClass	$current_users
	 * 
	 * @return	int
	 */
	protected function addable_users_callback ($all_users, $current_users) {
		if ($all_users->ID === $current_users->ID) {
			return 0;
		}
        return ($all_users->ID > $current_users->ID) ? 1 : -1;
	}
	
} // End Class WPMU_Network_Site_Users_Dropdown

if ( is_network_admin() ){
	new WPMU_Network_Site_Users_Dropdown;
}


/* End of file wpmu-network-site-users-dropdown.php */
/* Location: ./wp-content/plugins/wpmu-network-site-users-dropdown/wpmu-network-site-users-dropdown.php */