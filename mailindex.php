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
<title>My account | Patient FARDC</title>
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
<table width="1142" height="668" border="0" align="center" bgcolor="#FFFFFF">
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
    <td width="190" height="42" rowspan="2">&nbsp;</td>
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
    <td colspan="4"> <div align="center"><a href="mail.php"><em>Mail</em></a></div></td>
  </tr>
  <tr>
    <td width="87" height="21"><a href="http://www.facebook.com"><img src="fa.PNG" width="56" height="28" alt="facebook" /></a></td>
    <td width="105"><a href="http://www.yahoo.com"><img src="yahoo.jpeg" width="69" height="31" alt="facebook" /></a></td>
    <td width="98"><a href="http://www.twitter.com"><img src="tweeter.png" width="64" height="28" alt="facebook" /></a></td>
    <td width="82"><a href="http://www.instagram.com"><img src="instagram.jpeg" width="52" height="31" alt="facebook" /></a></td>
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
    <td height="10" colspan="2"><h3 align="center">WELCOME TO INTO YOUR ACCOUNT</h3></td>
    <td height="21" colspan="2">Hi Dear <span class="style23"><strong><?php echo $userRow['first_name']; ?></strong></span></td>
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
    <td width="335" height="28">Army officers<br />
    We all started here. Captains, Majors, Colonels, Generals. 44 weeks turns men and women into leaders. We lead a life of challenge. With heart. With mind.</td>
    <td width="403" rowspan="2"><h2><a href="http://www.army.mod.uk/join/The-Army-Reserve.aspx" target="_blank" title="This link will open in a new window">The Army Reserve</a></h2>
      <p>Looking for a new challenge? Want to do something different but keep your day job? As a Reservist, you get to travel, learn new skills and get paid for it.</p>
    <p>Reservists meet in the evenings and at weekends so you can fit training around your civilian job or studies. You’ll serve with either your local detachment or a national unit.</p></td>
    <td height="72" colspan="4" rowspan="3">&nbsp;</td>
  </tr>
  <tr>
    <td height="31">&nbsp;</td>
    <td height="31"><img src="Other arrow.jpeg" width="333" height="74" alt="df" /></td>
  </tr>
  <tr>
    <td height="11">&nbsp;</td>
    <td height="11" colspan="2"><div>
      <div> 
        <div align="center">There are over 200 roles in the Army. All come with full training and development, on going support and excellent pay and benefits. Take a look around to discover a career that will take you places.</div>
      </div>
    </div></td>
  </tr>
  <tr>
    <td height="21">&nbsp;</td>
    <td height="21"><img src="Equipement/download.jpg" width="343" height="194" alt="s" /></td>
    <td height="21"><img src="Equipement/hhghkgh.jpg" width="399" height="193" alt="jds" /></td>
    <td height="21" colspan="4">&nbsp;</td>
  </tr>
  <tr>
    <td height="40">&nbsp;</td>
    <td height="40" colspan="2">Lots of people worry about whether they will pass the fitness test, or how they will do in the interviews and selection tests. We can help you to get ready for all the tests you'll face, from interview tips to helping you prepare for your ice breaker.</td>
    <td height="40" colspan="4">&nbsp;</td>
  </tr>
  <tr>
    <td colspan="7"><table width="680" height="25" border="0" align="center" bgcolor="#FFFFFF">
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