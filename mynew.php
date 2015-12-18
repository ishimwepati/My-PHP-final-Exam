<?php
session_start();
include_once 'connect_to_db.php';

if(!isset($_SESSION['user']))
{
	header("Location: mail.php");
}
$res=mysql_query("SELECT * FROM users_tbl WHERE user_id=".$_SESSION['user']);
$userRow=mysql_fetch_array($res);
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>My New | Patient FARDC</title>
<style type="text/css">
a:link {
	color: #063;
	text-decoration: none;
}
a:visited {
	text-decoration: none;
	color: #063;
}
a:hover {
	text-decoration: none;
	color: #063;
}
a:active {
	text-decoration: none;
	color: #063;
}
a {
	font-family: Arial, Helvetica, sans-serif;
	color: #063;
}
.style23 {font-size: 16px;
	font-weight: bold;
	color: #000099;
	font-style: italic;
}
</style>
</head>

<body >
<table width="1142" height="627" border="0" align="center" bgcolor="#FFFFFF">
  <tr>
    <td height="27" colspan="7" bgcolor="#006633"><table width="261" border="0" align="right" bgcolor="#FFFFFF">
      <tr>
        <td width="255">Today is
          <?php  echo date("l"); echo date('j F Y');?>
          &nbsp;</td>
      </tr>
    </table>
      <table width="303" border="0" align="left" bgcolor="#FFFFFF">
      <tr>
        <td width="46" height="21"><a href="index.php">Home </a></td>
        <td width="25"><img src="328dd1759b1aa40ee77afe32a47c0fde2af14149.png" width="23" height="19" alt="s" /></td>
        <td width="65"><a href="about.php">About us </a></td>
        <td width="29"><img src="328dd1759b1aa40ee77afe32a47c0fde2af14149.png" width="23" height="19" alt="s" /></td>
        <td width="33"><a href="join.php"> Join </a></td>
        <td width="26"><img src="328dd1759b1aa40ee77afe32a47c0fde2af14149.png" width="23" height="19" alt="s" /></td>
        <td width="37"><a href="mail.php">Mail </a></td>
        <td width="10">&nbsp;</td>
      </tr>
  </table></td>
  </tr>
  <tr>
    <td width="117" height="42" rowspan="2">&nbsp;</td>
    <td colspan="2" rowspan="2"><table width="742" border="0">
      <tr>
        <td width="355" height="42" rowspan="2"><div align="center"><img src="fardc.PNG" width="229" height="47" alt="farcd" /></div></td>
        <td width="371"><table width="207" border="0" align="right">
          <tr>
            <td width="144"><label for="Search"></label>
              <input type="text" name="Search" id="Search" /></td>
            <td width="53"><input type="submit" name="Search2" id="Search2" value="Search" /></td>
          </tr>
        </table></td>
      </tr>
      <tr>
        <td height="21"><div align="right">Follow us on : </div></td>
      </tr>
    </table></td>
    <td height="21" colspan="4"> <div align="center"><a href="mail.php"><em>Mail</em></a></div></td>
  </tr>
  <tr>
    <td width="60" height="37"><a href="http://www.facebook.com"><img src="fa.PNG" width="56" height="28" alt="facebook" /></a></td>
    <td width="73"><a href="http://www.yahoo.com"><img src="yahoo.jpeg" width="69" height="31" alt="facebook" /></a></td>
    <td width="68"><a href="http://www.twitter.com"><img src="tweeter.png" width="64" height="28" alt="facebook" /></a></td>
    <td width="56"><a href="http://www.instagram.com"><img src="instagram.jpeg" width="52" height="31" alt="facebook" /></a></td>
  </tr>
  <tr>
    <td height="5" rowspan="3"><table width="117" border="0" align="right">
      <tr>
        <td width="111"><div align="center">FARDC :</div></td>
      </tr>
      <tr>
        <td><a href="contact.php">~ Contact us</a></td>
      </tr>
      <tr>
        <td><a href="equipement.php">~ Equipements</a></td>
      </tr>
      <tr>
        <td><a href="new.php">~ News</a></td>
      </tr>
      <tr>
        <td><a href="leaders.php">~ Leaders</a></td>
      </tr>
      <tr>
        <td>~ <a href="mail.php">Mail</a></td>
      </tr>
      <tr>
        <td><a href="training.php">~ Training</a></td>
      </tr>
    </table></td>
    <td height="10" colspan="2"><h3 align="center">Your News Are here :</h3></td>
    <td height="21" colspan="2"><span class="style23"><strong><?php echo $userRow['first_name']; ?>'s News</strong></span></td>
    <td height="21" colspan="2"><div align="right"><a href="singout.php?logout">Log Out</a>&nbsp;</div></td>
  </tr>
  <tr>
    <td height="27" colspan="2"><table width="299" border="0" align="center">
      <tr>
        <td width="108"><div align="center"><a href="joinform.php">Join Form</a></div></td>
        <td width="67"><div align="center"><a href="mynew.php">My new</a></div></td>
        <td width="110"><div align="center"><a href="myprofile.php">My Profile</a></div></td>
      </tr>
    </table></td>
    <td height="27" colspan="4">&nbsp;</td>
  </tr>
  <tr>
    <td width="346" height="28"><img src="Patient/The United States Army   Service Opportunities_files/national_guard.jpg" width="346" height="111" alt="hjd" /></td>
    <td width="393" rowspan="2"><p><img src="training/jnhjm.jpg" width="392" height="229" alt="e" /></p></td>
    <td height="72" colspan="4" rowspan="3">&nbsp;</td>
  </tr>
  <tr>
    <td height="116">&nbsp;</td>
    <td height="116">The Army offers abundant opportunities for challenging and rewarding civilian employment in virtually all career fields and in all parts of the world. Whether you are a student, a recent graduate, a veteran, a current Federal employee, or a U.S. citizen without federal experience, the Army has a job for you. </td>
  </tr>
  <tr>
    <td height="11">&nbsp;</td>
    <td height="11" colspan="2"><h4 align="center"><strong>Military of the Democratic Republic of the Congo</strong></h4></td>
  </tr>
  <tr>
    <td height="135">&nbsp;</td>
    <td height="135"><img src="training/jm.jpg" width="346" height="134" alt="hgd" /></td>
    <td height="135">The National Guard is an elite group of warriors who dedicate a portion of their time to serving their nation. Each state has its own Guard, as required by the Constitution; in fact, it is the only branch of the military whose existence is actually required by the Constitution. Visit 1800GOGUARD.COM to learn how to go about joining in different capacities, Army life, benefits, pay, and assignments information. </td>
    <td height="135" colspan="4">&nbsp;</td>
  </tr>
  <tr>
    <td height="21">&nbsp;</td>
    <td height="21" colspan="2">The <strong>Armed Forces of the Democratic Republic of Congo</strong> (<a href="https://en.wikipedia.org/wiki/French_language" title="French language">French</a>: <span lang="fr" xml:lang="fr"><em><strong>Forces Armées de la République Démocratique du Congo</strong></em> or <em><strong>FARDC</strong></em></span>)</td>
    <td height="21" colspan="4">&nbsp;</td>
  </tr>
  <tr>
    <td height="27" colspan="7"><table width="680" height="25" border="0" align="center" bgcolor="#FFFFFF">
      <tr>
        <td width="46" height="21"><em><a href="index.php">Home </a></em></td>
        <td width="59"><em><a href="contact.php">Contact us</a></em></td>
        <td width="49"><em><a href="about.php">About us </a></em></td>
        <td width="58"><em><a href="leaders.php">Leaders</a></em></td>
        <td width="33"><em><a href="join.php"> Join </a></em></td>
        <td width="38"><em><a href="new.php">News</a></em></td>
        <td width="33"><em><a href="mail.php">Mail </a></em></td>
        <td width="42"><em><a href="training.php">Training</a></em></td>
      </tr>
    </table></td>
  </tr>
  <tr>
    <td height="21" colspan="7" bgcolor="#006600"><div align="center"><span class="style16">Copy right &copy; 2015, All rights reserved to The </span>Force Armée de la République Démocratique du Congo En RDC!!!    <span class="style16">. </span></div></td>
  </tr>
</table>
</body>
</html>