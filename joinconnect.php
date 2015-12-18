<?php

include_once 'connect_to_db.php';

if(isset($_POST['btn-Agree']))
{
	$names = mysql_real_escape_string($_POST['names']);
	$father_name = mysql_real_escape_string($_POST['father_name']);
	$mother_name = mysql_real_escape_string($_POST['mother_name']);
	$address = mysql_real_escape_string($_POST['address']);
	$centre = mysql_real_escape_string($_POST['centre']);
	$year_of_birth = mysql_real_escape_string($_POST['year_of_birth']);
	$month_of_birth = mysql_real_escape_string($_POST['month_of_birth']);
	$day_of_birth = mysql_real_escape_string($_POST['day_of_birth']);
	$gender = mysql_real_escape_string($_POST['gender']);
	$qualification = mysql_real_escape_string($_POST['qualification']);
	$education = mysql_real_escape_string($_POST['education']);
	$nationality = mysql_real_escape_string($_POST['nationality']);
	$marital = mysql_real_escape_string($_POST['marital']);
	$next_kin = mysql_real_escape_string($_POST['next_kin']);
	$kin_name = mysql_real_escape_string($_POST['kin_name']);
	if(mysql_query("INSERT INTO join_tbl(user_id,names,father_name,mother_name,address,centre,year_of_birth,month_of_birth,day_of_birth,gender,qualification,education,nationality,marital,next_kin,kin_name) VALUES('$user_id','$names','$father_name','$mother_name','$address','$centre','$year_of_birth','$month_of_birth','$day_of_birth','$gender','$qualification','$education','$nationality','$marital','$next_kin','$kin_name')"))
	{
		header ("Location: mailindex.php");
    }
	else {
		?> 
         <script>alert('You have enter wrong values !!!.');</script>
		<?php 
		}
}	
?>
</body>
</html>