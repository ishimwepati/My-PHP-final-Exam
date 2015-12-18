<?php

include_once 'connect_to_db.php';

if(isset($_POST['btn-Send']))
{
	$email = mysql_real_escape_string($_POST['email']);
	$names = mysql_real_escape_string($_POST['names']);
	$company = mysql_real_escape_string($_POST['company']);
	$website = mysql_real_escape_string($_POST['website']);
	$comment = mysql_real_escape_string($_POST['comment']);
	if(mysql_query("INSERT INTO contact_tbl(users_id,email,names,company,website,comment) VALUES('$users_id','$email','$names','$company','$website','$comment')"))
	{
		?> 
         <script>alert('Thank you your request has been sent successfully .');</script>
         
		<?php 
    }
	else {
		?> 
         <script>alert('Sorry !!! Check Well your details information well .');</script>
		<?php 
		}
}	
?>