<?php
session_start();
include_once 'connect_to_db.php';

if(isset($_POST['btn-login']))
{
	$username = mysql_real_escape_string($_POST['username']);
	$password = mysql_real_escape_string($_POST['password']);
	$res=mysql_query("SELECT * FROM admin_tbl WHERE username='$username'");
	$row=mysql_fetch_array($res);
	
	if($row['password']==md5($password))
	{
		$_SESSION['user'] = $row['user_id'];
		header("Location: adminwelcome.php");
	}
	else
	{
		?>
        <script>alert('You are not an admin!!!');</script>
        <?php
	}
	
}
?>
