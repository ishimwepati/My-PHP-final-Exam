<?php
include_once 'connect_to_db.php';

if(isset($_SESSION['user'])!="")
{
	header("Location:forget.php");
}

if(isset($_POST['btn-send']))
{
	$code = mysql_real_escape_string($_POST['code']);
	$phone = mysql_real_escape_string($_POST['phone']);
	$res=mysql_query("SELECT * FROM users_tbl WHERE code='$code'");
	$row=mysql_fetch_array($res);
	
	if($row['phone']==($phone))
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

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<!-- Start WOWSlider.com HEAD section -->
<link rel="stylesheet" type="text/css" href="engine1/style.css" />
<script type="text/javascript" src="engine1/jquery.js"></script>
<!-- End WOWSlider.com HEAD section -->
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>New | Patient FARDC</title>
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
</style>
</head>

<body >
<table width="1139" height="883" border="0" align="center" bgcolor="#FFFFFF">
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
    <td colspan="4"> <div align="center"><a href="mail.php"><em>Mail</em></a></div></td>
  </tr>
  <tr>
    <td width="63" height="21"><a href="http://www.facebook.com"><img src="fa.PNG" width="56" height="28" alt="facebook" /></a></td>
    <td width="73"><a href="http://www.yahoo.com"><img src="yahoo.jpeg" width="69" height="31" alt="facebook" /></a></td>
    <td width="68"><a href="http://www.twitter.com"><img src="tweeter.png" width="64" height="28" alt="facebook" /></a></td>
    <td width="56"><a href="http://www.instagram.com"><img src="instagram.jpeg" width="52" height="31" alt="facebook" /></a></td>
  </tr>
  <tr>
    <td height="-4"><table width="117" border="0" align="right">
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
    <td height="35" colspan="2"><div id="wowslider-container1">
      <div class="ws_images"><ul>
		<li><img src="data1/images/c.jpg" alt="c" title="c" id="wows1_0"/></li>
		<li><img src="data1/images/dgyh.jpg" alt="dgyh" title="dgyh" id="wows1_1"/></li>
		<li><img src="data1/images/download.jpg" alt="download" title="download" id="wows1_2"/></li>
		<li><img src="data1/images/dyu.jpg" alt="dyu" title="dyu" id="wows1_3"/></li>
		<li><img src="data1/images/fds.jpg" alt="fds" title="fds" id="wows1_4"/></li>
		<li><img src="data1/images/ffjfk.jpg" alt="ffjfk" title="ffjfk" id="wows1_5"/></li>
		<li><img src="data1/images/fk.jpg" alt="fk" title="fk" id="wows1_6"/></li>
		<li><img src="data1/images/fodi.jpg" alt="fodi" title="fodi" id="wows1_7"/></li>
		<li><img src="data1/images/fv.jpg" alt="fv" title="fv" id="wows1_8"/></li>
		<li><img src="data1/images/g.jpg" alt="g" title="g" id="wows1_9"/></li>
		<li><img src="data1/images/gk.jpg" alt="gk" title="gk" id="wows1_10"/></li>
		<li><img src="data1/images/hhghkgh.jpg" alt="hhghkgh" title="hhghkgh" id="wows1_11"/></li>
		<li><img src="data1/images/i.jpg" alt="i" title="i" id="wows1_12"/></li>
		<li><img src="data1/images/irfe.jpg" alt="irfe" title="irfe" id="wows1_13"/></li>
		<li><img src="data1/images/it.jpg" alt="it" title="it" id="wows1_14"/></li>
		<li><img src="data1/images/j.jpg" alt="j" title="j" id="wows1_15"/></li>
		<li><img src="data1/images/kd.jpg" alt="kd" title="kd" id="wows1_16"/></li>
		<li><img src="data1/images/kfkifkfj.jpg" alt="kfkifkfj" title="kfkifkfj" id="wows1_17"/></li>
		<li><img src="data1/images/laauewe.jpg" alt="laauewe" title="laauewe" id="wows1_18"/></li>
		<li><a href="http://wowslider.com"><img src="data1/images/lkfd.jpg" alt="jquery slider" title="lkfd" id="wows1_19"/></a></li>
		<li><img src="data1/images/urwirie.jpg" alt="urwirie" title="urwirie" id="wows1_20"/></li>
	</ul></div>
	<div class="ws_bullets"><div>
		<a href="#" title="c"><span><img src="data1/tooltips/c.jpg" alt="c"/>1</span></a>
		<a href="#" title="dgyh"><span><img src="data1/tooltips/dgyh.jpg" alt="dgyh"/>2</span></a>
		<a href="#" title="download"><span><img src="data1/tooltips/download.jpg" alt="download"/>3</span></a>
		<a href="#" title="dyu"><span><img src="data1/tooltips/dyu.jpg" alt="dyu"/>4</span></a>
		<a href="#" title="fds"><span><img src="data1/tooltips/fds.jpg" alt="fds"/>5</span></a>
		<a href="#" title="ffjfk"><span><img src="data1/tooltips/ffjfk.jpg" alt="ffjfk"/>6</span></a>
		<a href="#" title="fk"><span><img src="data1/tooltips/fk.jpg" alt="fk"/>7</span></a>
		<a href="#" title="fodi"><span><img src="data1/tooltips/fodi.jpg" alt="fodi"/>8</span></a>
		<a href="#" title="fv"><span><img src="data1/tooltips/fv.jpg" alt="fv"/>9</span></a>
		<a href="#" title="g"><span><img src="data1/tooltips/g.jpg" alt="g"/>10</span></a>
		<a href="#" title="gk"><span><img src="data1/tooltips/gk.jpg" alt="gk"/>11</span></a>
		<a href="#" title="hhghkgh"><span><img src="data1/tooltips/hhghkgh.jpg" alt="hhghkgh"/>12</span></a>
		<a href="#" title="i"><span><img src="data1/tooltips/i.jpg" alt="i"/>13</span></a>
		<a href="#" title="irfe"><span><img src="data1/tooltips/irfe.jpg" alt="irfe"/>14</span></a>
		<a href="#" title="it"><span><img src="data1/tooltips/it.jpg" alt="it"/>15</span></a>
		<a href="#" title="j"><span><img src="data1/tooltips/j.jpg" alt="j"/>16</span></a>
		<a href="#" title="kd"><span><img src="data1/tooltips/kd.jpg" alt="kd"/>17</span></a>
		<a href="#" title="kfkifkfj"><span><img src="data1/tooltips/kfkifkfj.jpg" alt="kfkifkfj"/>18</span></a>
		<a href="#" title="laauewe"><span><img src="data1/tooltips/laauewe.jpg" alt="laauewe"/>19</span></a>
		<a href="#" title="lkfd"><span><img src="data1/tooltips/lkfd.jpg" alt="lkfd"/>20</span></a>
		<a href="#" title="urwirie"><span><img src="data1/tooltips/urwirie.jpg" alt="urwirie"/>21</span></a>
	</div></div><div class="ws_script" style="position:absolute;left:-99%"><a href="http://wowslider.com">wowslider</a> by WOWSlider.com v8.6</div>
<div class="ws_shadow"></div>

</div>	
<script type="text/javascript" src="engine1/wowslider.js"></script>
<script type="text/javascript" src="engine1/script.js"></script>
<!-- End WOWSlider.com BODY section --></p></td>
    <td height="146" colspan="4" rowspan="5">&nbsp;</td>
  </tr>
  <tr>
    <td height="22">&nbsp;</td>
    <td height="22" colspan="2"><h3 align="center">RDC Joseph Kabila names new general officers, superiors and subordinates in the army</h3></td>
  </tr>
  <tr>
    <td height="164">&nbsp;</td>
    <td width="378" height="164"><img src="training/kl.jpg" width="380" height="159" alt="d" /></td>
    <td width="357"><img src="training/igo.jpg" width="357" height="162" alt="jfd" /></td>
  </tr>
  <tr>
    <td height="309">&nbsp;</td>
    <td height="309"><p>The Superior Council of Defense adopted last June, the initial revised Plan of Reform few weeks ago. The new elements occurred in April 2012 in the territories of Rutshuru and Nyragongo therefore motivated the revision of the Plan. To comply with one hand, this revised plan and secondly, for the sake of gradually rejuvenate and increase the efficiency of the men who control the Military of the Democratic Republic of the Congo (FARDC), Joseph Kabila, in his dual capacity as Head of State and Supreme Commander of the FARDC, has taken a series of orders (twelve in total), made public for four days. Either last Sunday and Monday.</p>
    <p>This is, inter alia, Ordinance No. 13/82 concerning forced retirement of General Officers of the FARDC, Ordinance No. 13/086 concerning forced retirement of senior officers of FARDC and Order 13/088 concerning forced retirement of Junior Officers of the FARDC. Not only. </p></td>
    <td height="309"><img src="rfi.PNG" width="355" height="319" alt="jhd" /></td>
  </tr>
  <tr>
    <td height="72">&nbsp;</td>
    <td height="72" colspan="2">After the series of public orders made on Sunday, two more were enacted late in the evening of Monday, July 8 on the airwaves of radio and public television, the Congolese National Radio Television (RTNC). This is the order of 7 July 2013 appointing the category of General Officers of the FARDC. In its edition of yesterday Tuesday, Forum des As was echoed in different nominations.</td>
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