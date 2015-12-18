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
<table width="1142" height="526" border="0" align="center" bgcolor="#FFFFFF">
  <tr>
    <td height="27" colspan="8" bgcolor="#006633"><table width="261" border="0" align="right" bgcolor="#FFFFFF">
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
    <td colspan="3" rowspan="2"><table width="742" border="0">
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
    <td width="65" height="37"><a href="http://www.facebook.com"><img src="fa.PNG" width="56" height="28" alt="facebook" /></a></td>
    <td width="73"><a href="http://www.yahoo.com"><img src="yahoo.jpeg" width="69" height="31" alt="facebook" /></a></td>
    <td width="68"><a href="http://www.twitter.com"><img src="tweeter.png" width="64" height="28" alt="facebook" /></a></td>
    <td width="56"><a href="http://www.instagram.com"><img src="instagram.jpeg" width="52" height="31" alt="facebook" /></a></td>
  </tr>
  <tr>
    <td height="21" rowspan="3"><table width="117" border="0" align="right">
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
    <td height="21" colspan="3"><h3 align="center">Welcome to Leaders Admin part.</h3></td>
    <td height="21" colspan="2">&nbsp;</td>
    <td height="21" colspan="2"><div align="right"><a href="logout.php?logout">Log Out</a>&nbsp;</div></td>
  </tr>
  <tr>
    <td height="26" colspan="3"><table width="299" border="0" align="center">
      <tr>
        <td width="108"><div align="center"><a href="joiners.php">List of Joiners </a></div></td>
        <td width="67"><div align="center"></div></td>
        <td width="110"><div align="center"><a href="users.php">List of Users</a></div></td>
      </tr>
    </table></td>
    <td height="26" colspan="4">&nbsp;</td>
  </tr>
  <tr>
    <td colspan="3" rowspan="2"><p>Also, Joseph Kabila welcomed t he general, senior and junior officers who loyally and faithfully served the country but, to date, have been honorably retired. To these generals, senior and junior officers, Congolese President promises a retirement allowance and reintegration honorable in proportion to the rank of each. An allowance of end of honorable career for General Officers and fair for senior and junior officers. That, in accordance with Articles 195 and 197 of the Law on Military Statute.</p>
    <p>After the series of public orders made on Sunday, two more were enacted late in the evening of Monday, July 8 on the airwaves of radio and public television, the Congolese National Radio Television (RTNC). This is the order of 7 July 2013 appointing the category of General Officers of the FARDC. In its edition of yesterday Tuesday, Forum des As was echoed in different nominations. Also, it presents newspaper writing all his apologies to all their readers consecutive some misspelled words because of decryption hazards.</p></td>
    <td height="72" colspan="4" rowspan="3">&nbsp;</td>
  </tr>
  <tr>
    <td height="21">&nbsp;</td>
  </tr>
  <tr>
    <td height="11">&nbsp;</td>
    <td width="246" rowspan="3"><img src="Leaders/y.jpg" width="246" height="189" alt="dj" /></td>
    <td width="260" rowspan="3"><img src="Leaders/y ;.jpg" width="260" height="188" alt="f" /></td>
    <td width="230" rowspan="3"><img src="Leaders/;.jpg" width="233" height="191" alt="g" /></td>
  </tr>
  <tr>
    <td height="135">&nbsp;</td>
    <td height="135" colspan="4">&nbsp;</td>
  </tr>
  <tr>
    <td height="21">&nbsp;</td>
    <td height="21" colspan="4">&nbsp;</td>
  </tr>
  <tr>
    <td height="27" colspan="8"><table width="680" height="25" border="0" align="center" bgcolor="#FFFFFF">
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
    <td height="21" colspan="8" bgcolor="#006600"><div align="center"><span class="style16">Copy right &copy; 2015, All rights reserved to The </span>Force Armée de la République Démocratique du Congo En RDC!!!    <span class="style16">. </span></div></td>
  </tr>
</table>
</body>
</html>