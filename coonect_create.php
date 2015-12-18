<?php

include_once 'connect_to_db.php';

if(isset($_POST['btn-Create']))
{
	$first_name = mysql_real_escape_string($_POST['first_name']);
	$last_name = mysql_real_escape_string($_POST['last_name']);
	$gender = mysql_real_escape_string($_POST['gender']);
	$year_of_birth = mysql_real_escape_string($_POST['year_of_birth']);
	$month_of_birth = mysql_real_escape_string($_POST['month_of_birth']);
	$day_of_birth = mysql_real_escape_string($_POST['day_of_birth']);
	$nationality = mysql_real_escape_string($_POST['nationality']);
	$email = mysql_real_escape_string($_POST['email']);
	$password = md5(mysql_real_escape_string($_POST['password']));
	$code = mysql_real_escape_string($_POST['code']);
	$phone = mysql_real_escape_string($_POST['phone']);
	$occupation= mysql_real_escape_string($_POST['occupation']);
	$residential_country = mysql_real_escape_string($_POST['residential_country']);
	$district = mysql_real_escape_string($_POST['district']);
	$test_answer = mysql_real_escape_string($_POST['test_answer']);
	if(mysql_query("INSERT INTO users_tbl(user_id,first_name,last_name,gender,year_of_birth,month_of_birth,day_of_birth,nationality,email,password,code,phone,occupation,residential_country,district,test_answer) VALUES('$user_id','$first_name','$last_name','$gender','$year_of_birth','$month_of_birth','$day_of_birth','$nationality','$email','$password','$code','$phone','$occupation','$residential_country','$district','$test_answer')"));
	{
		header ("Location: mail.php");
    }
	else {
		?> 
         <script>alert('Sorry !!! Check Well your details information well .');</script>
		<?php 
		}
}	
?>