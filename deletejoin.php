<?php
include ("connect_to_db.php");

$strquery="DELETE from join_tbl where user_id = '" . $_GET['user_id'] . "' ";

if($results=mysql_query ($strquery))
{
header ('location: deletesuccess.php');
}
else {
	echo 'Not deleted';
}
?>
