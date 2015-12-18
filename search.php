<?php
session_start();
include_once 'connect_to_db.php';

if(isset($_POST['btn-search']))
{
	
	$question = mysql_real_escape_string($_POST['question']);
	$res=mysql_query("SELECT * FROM search_tbl WHERE question='$question'");
	$row=mysql_fetch_array($res);
	
	if($row['question']==($question))
	{
		
		header("Location: mailindex.php");
	}
	else
	{
		?>
        <script>alert('Please check well yours details! And Login !!!');</script>
        <?php
	}
	
}
?>
