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
<title>Join | Patient FARDC</title>
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
<table width="1142" height="776" border="0" align="center" bgcolor="#FFFFFF">
  <tr>
    <td height="27" colspan="6" bgcolor="#006633"><table width="261" border="0" align="right" bgcolor="#FFFFFF">
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
    <td rowspan="2"><table width="742" border="0">
      <tr>
        <td width="333" height="42" rowspan="2"><div align="center"><img src="fardc.PNG" width="229" height="47" alt="farcd" /></div></td>
        <td width="399"><table width="207" border="0" align="right">
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
    <td height="21"><h3 align="center">Your Details Are here :</h3></td>
    <td height="21" colspan="2"><strong>Hi <?php echo $userRow['first_name']; ?></strong></td>
    <td height="21" colspan="2"><div align="right"><a href="singout.php?logout">Log Out</a>&nbsp;</div></td>
  </tr>
  <tr>
    <td height="26"><table width="299" border="0" align="center">
      <tr>
        <td width="108"><div align="center"><a href="joinform.php">Join Form</a></div></td>
        <td width="67"><div align="center"><a href="mynew.php">My new</a></div></td>
        <td width="110"><div align="center"><a href="myprofile.php">My Profile</a></div></td>
      </tr>
    </table></td>
    <td height="26" colspan="4">&nbsp;</td>
  </tr>
  <tr>
    <td rowspan="3"><form id="form1" name="form1" method="post" action="joinconnect.php""><table width="468" border="0" align="center">
      <tr>
        <td colspan="3"><div align="center">Please Fill The form bellow :</div></td>
        </tr>
      <tr>
        <td width="198">Candidate's names</td>
        <td colspan="2">
          <label for="textfield"></label>
          <input type="text" name="names" id="textfield" />
       </td>
      </tr>
      <tr>
        <td>Father's Name</td>
        <td colspan="2"><input type="text" name="father_name" id="textfield2" /></td>
      </tr>
      <tr>
        <td>Mother's Name</td>
        <td colspan="2"><input type="text" name="mother_name" id="textfield3" /></td>
      </tr>
      <tr>
        <td>Permant Address</td>
        <td colspan="2"><input type="text" name="address" id="textfield4" /></td>
      </tr>
      <tr>
        <td>Choice of written exam centre</td>
        <td colspan="2">
          <label for="select"></label>
          <select name="centre" id="select">
            <option></option>
              <option>Kinshasa</option>
            <option>Lubumbashi</option>
            <option>Bukavu</option>
            <option>Butembo</option>
            <option>Kisangani</option>
            <option>Goma</option>
         
          </select>
        </td>
      </tr>
      <tr>
        <td>Date of Birth</td>
        <td colspan="2"><select name="year_of_birth" required="required" >
          <option>Year</option>
          <option>1960</option>
          <option>1961</option>
          <option>1962</option>
          <option>1963</option>
          <option>1964</option>
          <option>1965</option>
          <option>1966</option>
          <option>1967</option>
          <option>1968</option>
          <option>1969</option>
          <option>1970</option>
          <option>1971</option>
          <option>1972</option>
          <option>1973</option>
          <option>1974</option>
          <option>1975</option>
          <option>1976</option>
          <option>1977</option>
          <option>1978</option>
          <option>1979</option>
          <option>1980</option>
          <option>1981</option>
          <option>1982</option>
          <option>1983</option>
          <option>1984</option>
          <option>1985</option>
          <option>1986</option>
          <option>1987</option>
          <option>1988</option>
          <option>1989</option>
          <option>1990</option>
          <option>1991</option>
          <option>1992</option>
          <option>1993</option>
          <option>1994</option>
          <option>1995</option>
          <option>1996</option>
          <option>1997</option>
          <option>1998</option>
          <option>1999</option>
          <option>2000</option>
          <option>2001</option>
          <option>2002</option>
          <option>2003</option>
          <option>2004</option>
          <option>2005</option>
          <option>2006</option>
          <option>2007</option>
          <option>2008</option>
          <option>2009</option>
          <option>2010</option>
          <option>2011</option>
          <option>2012</option>
          <option>2013</option>
          <option>2014</option>
          <option>2015</option>
        </select>
          <select name="month_of_birth" required="required" >
            <option>Month</option>
            <option>January</option>
            <option>February</option>
            <option>March</option>
            <option>April</option>
            <option>May</option>
            <option>June</option>
            <option>July</option>
            <option>August</option>
            <option>September</option>
            <option>October</option>
            <option>November</option>
            <option>December</option>
            <option> </option>
          </select>
          <select name="day_of_birth" required="required" >
            <option>Day</option>
            <option>1</option>
            <option>2</option>
            <option>3</option>
            <option>4</option>
            <option>5</option>
            <option>6</option>
            <option>7</option>
            <option>8</option>
            <option>9</option>
            <option>10</option>
            <option>11</option>
            <option>12</option>
            <option>13</option>
            <option>14</option>
            <option>15</option>
            <option>16</option>
            <option>17</option>
            <option>18</option>
            <option>19</option>
            <option>20</option>
            <option>21</option>
            <option>22</option>
            <option>23</option>
            <option>24</option>
            <option>25</option>
            <option>26</option>
            <option>27</option>
            <option>28</option>
            <option>29</option>
            <option>30</option>
            <option>31</option>
            <option> </option>
          </select></td>
      </tr>
      <tr>
        <td>Gender</td>
        <td colspan="2"><input name="gender" type="radio" value="Male" />
          Male 
          <input name="gender" type="radio" value="Female" />
          Female</td>
      </tr>
      <tr>
        <td>Educational Qualification</td>
        <td colspan="2"><select name="qualification" id="select2">
          <option></option>
          <option>Dilpoma</option>
          <option>Graduation</option>
          <option>Post graduation</option>
          
        </select></td>
      </tr>
      <tr>
        <td>Education Stream</td>
        <td colspan="2"><select name="education" id="select3">
          <option></option>
          <option>Arts</option>
          <option>Science</option>
          <option>Commerce</option>
          <option>Engineering</option> 
          <option>Medical</option>
          <option>MBA</option>
          <option>Any Other</option>
        </select></td>
      </tr>
      <tr>
        <td>Nationality</td>
        <td colspan="2"><select name="nationality" required="required" >
          <option>Nationality</option>
          <option>Congolese</option>
          <option>Ugandan</option>
          <option>Somali</option>
          <option>Burundian</option>
          <option>Rwandese</option>
          <option>Comorian</option>
          <option>Kenyan</option>
          <option>Tanzanian</option>
          <option>South Sudanese</option>
          <option>North Sudanese</option>
          <option>Zambian</option>
          <option>Nigerian</option>
          <option>Indian</option>
          <option>American</option>
          <option>Erithrean</option>
          <option>Ethiopian</option>
          <option>Egyptian</option>
          <option>South African</option>
          <option>Ivorian</option>
          <option>Ghanaian</option>
          <option>Libyan</option>
          <option>Moroccan</option>
          <option>Tunisian</option>
          <option>Malagasy</option>
          <option>Mozambican</option>
          <option>Namibian</option>
          <option>Zimbabwean</option>
          <option> </option>
        </select></td>
      </tr>
      <tr>
        <td>Marital Status</td>
        <td colspan="2"><select name="marital" id="select4">
          <option></option>
          <option>Single</option>
          <option>Married </option>
          <option>Divorced</option>
        </select></td>
      </tr>
      <tr>
        <td>Next of Kin</td>

        <td colspan="2"><select name="next_kin" id="select5">
          <option></option>
           <option>Father</option>
          <option>Mother </option>
          <option>Wife</option>
          <option> Son</option>
          <option>Daughter</option>
          <option>Other </option>
        </select></td>
      </tr>
      <tr>
        <td>Name of next of kin</td>
        <td colspan="2"><input type="text" name="kin_name" id="textfield5" /></td>
      </tr>
      <tr>
        <td colspan="3"><p align="center"><strong><u>DECLARATION</u></strong>.</p>
          <ul>
            <li>In the event of my  selection for commission in the Territorial Army, I am willing to serve  anywhere in India for longer duration also, whenever required, or as per the  rules and orders in force from time to time.          </li>
          </ul>
          <ul>
            <li>I clearly understand  that if at any time during the period of probation I am not found suitable, I  shall have to resign my commission in accordance with the rules and orders in  force from time to time and in case I decline to do so I am liable to be discharged/removed  from the Territorial Army.</li>
          </ul>
          <ul>
            <li>I am fully aware that if  it is found at any stage that I have knowingly furnished any details which  is/are false or have suppressed material information or I fail to comply with  the above undertakings, my candidature will be rejected summarily and if already  commissioned, I shall be liable to be discharged/removed from the Territorial  Army. </li>
          </ul></td>
        </tr>
      <tr>
        <td height="37"><p align="center"><strong>Signature of candidate</strong></p></td>
        <td width="163"><div align="center"><img src="Other arrow.jpeg" width="163" height="24" alt="hd" /></div></td>
        <td width="93"><input type="submit" name="btn-Agree" id="button" value="Agree" /></td>
      </tr>
    </table> </form></td>
    <td height="72" colspan="4" rowspan="3"><p>&nbsp;</p>
    <p>&nbsp;</p>
    <p>&nbsp;</p>
    <p>&nbsp;</p>
    <p>&nbsp;</p>
    <p>&nbsp;</p></td>
  </tr>
  <tr>
    <td height="21">&nbsp;</td>
  </tr>
  <tr>
    <td height="191">&nbsp;</td>
  </tr>
  <tr>
    <td height="21">&nbsp;</td>
    <td>&nbsp;</td>
    <td height="21" colspan="4">&nbsp;</td>
  </tr>
  <tr>
    <td height="27" colspan="6"><table width="680" height="25" border="0" align="center" bgcolor="#FFFFFF">
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
    <td height="21" colspan="6" bgcolor="#006600><div align="center"><span class="style16">Copy right &copy; 2015, All rights reserved to The </span>Force Armée de la République Démocratique du Congo En RDC!!!    <span class="style16">. </span></div></td>
  </tr>
</table>
</body>
</html>