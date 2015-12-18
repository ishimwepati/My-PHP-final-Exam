<?php
session_start();

if(!isset($_SESSION['user']))
{
 header("Location: mailindex.php");
}
else if(isset($_SESSION['user'])!="")
{
 header("Location: mail.php");
}

if(isset($_GET['logout']))
{
 session_destroy();
 unset($_SESSION['user']);
 header("Location: leaders.php");
}
?>