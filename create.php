<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Create | Patient FARDC</title>
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
<table width="1164" height="620" border="0" align="center" bgcolor="#FFFFFF">
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
    <td width="135" height="42" rowspan="2">&nbsp;</td>
    <td width="742" rowspan="2"><table width="742" border="0">
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
    <td width="63" height="37"><a href="http://www.facebook.com"><img src="fa.PNG" width="56" height="28" alt="facebook" /></a></td>
    <td width="73"><a href="http://www.yahoo.com"><img src="yahoo.jpeg" width="69" height="31" alt="facebook" /></a></td>
    <td width="68"><a href="http://www.twitter.com"><img src="tweeter.png" width="64" height="28" alt="facebook" /></a></td>
    <td width="57"><a href="http://www.instagram.com"><img src="instagram.jpeg" width="52" height="31" alt="facebook" /></a></td>
  </tr>
  <tr>
    <td height="167"><table width="117" border="0" align="right">
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
    <td height="146" rowspan="2">
    <form action="connect.php" method="post" id="">
    <table width="701" height="443" border="0" align="center">
      <tr>
        <td height="28" colspan="8"><h2 align="center">Create a FARDC E-mail Account</h2><hr /></td>
      </tr>
      <tr>
        <td width="172">Your First name</td>
        <td width="162"><input type="text" name="first_name" required="required" placeholder="Your First name" id="first_name"/></td>
        <td width="5">&nbsp;</td>
        <td width="87">&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td rowspan="4">&nbsp;</td>
      </tr>
      <tr>
        <td>Your Last name</td>
        <td><input type="text" name="last_name" required="required" placeholder="Your Last name" id="last_name"/></td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
      </tr>
      <tr>
        <td>Are you ?</td>
        <td colspan="3"><label>
          <input name="gender" type="radio" value="Male" />
          Male</label>
          <label>
            <input name="gender" type="radio" value="Female" />
            Female</label></td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
      </tr>
      <tr>
        <td>When where you born</td>
        <td colspan="3"><select name="year_of_birth" required="required" >
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
        <td width="78">&nbsp;</td>
        <td width="2">&nbsp;</td>
        <td>&nbsp;</td>
      </tr>
      <tr>
        <td>Your Nationality</td>
        <td colspan="3"><select name="nationality" required="required" >
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
        <td colspan="4">&nbsp;</td>
      </tr>
      <tr>
        <td>Your active E-mail</td>
        <td colspan="3"><input type="email" name="email" required="required" placeholder="Your E-mail" id="email"/></td>
        <td colspan="4">&nbsp;</td>
      </tr>
      <tr>
        <td>Your own Password</td>
        <td colspan="3"><input type="password" name="password" required="required" placeholder="Your Password" id="email2"/></td>
        <td colspan="4">&nbsp;</td>
      </tr>
      <tr>
        <td>Your Tel. Phone</td>
        <td colspan="3"><select name="code" required="required" >
          <option>Code </option>
          <option>+211</option>
          <option>+240</option>
          <option>+241</option>
          <option>+242</option>
          <option>+243</option>
          <option>+244</option>
          <option>+245</option>
          <option>+246</option>
          <option>+247</option>
          <option>+248</option>
          <option>+249</option>
          <option>+250</option>
          <option>+251</option>
          <option>+252</option>
          <option>+253</option>
          <option>+254</option>
          <option>+255</option>
          <option>+256</option>
          <option>+257</option>
          <option>+258</option>
          <option>+259</option>
          <option>+260</option>
          <option> </option>
          </select>
          <input type="text" name="phone" required="required" placeholder="Your phone number"/></td>
        <td colspan="4">&nbsp;</td>
      </tr>
      <tr>
        <td>Your Occupation</td>
        <td colspan="3"><input type="text" name="occupation" required="required" placeholder="Your occupation" /></td>
        <td colspan="4">&nbsp;</td>
      </tr>
      <tr>
        <td>Where do you live now?</td>
        <td colspan="7"><select name="residential_country" required="required" >
          <option>Actual Country </option>
          <option>D R Congo</option>
          <option>Uganda</option>
          <option>Somali</option>
          <option>Burundi</option>
          <option>Rwanda</option>
          <option>Comoro</option>
          <option>Kenya</option>
          <option>Tanzani</option>
          <option>South Sudan</option>
          <option>North Sudan</option>
          <option>Zambia</option>
          <option>Nigeria</option>
          <option>India</option>
          <option>America</option>
          <option>Erithrea</option>
          <option>Ethiopia</option>
          <option>Egypti</option>
          <option>South Africa</option>
          <option>Ivory cost</option>
          <option>Ghana</option>
          <option>Libya</option>
          <option>Morocco</option>
          <option>Tunisia</option>
          <option>Madascar</option>
          <option>Mozambica</option>
          <option>Namibia</option>
          <option>Zimbabwe</option>
          <option> </option>
        </select></td>
      </tr>
      <tr>
        <td>Your District or City</td>
        <td colspan="7"><input type="text" name="district" required="required" placeholder="Your District or City"/></td>
      </tr>
      <tr>
        <td>&nbsp;</td>
        <td colspan="7"><div align="center">
          <blockquote>
            <h3>Are an human being? </h3>
          </blockquote>
        </div></td>
      </tr>
      <tr>
        <td height="24">Enter This code</td>
        <td colspan="3"><div align="center"><img src="untitled.jpg" alt="j" width="113" height="27" /></div></td>
        <td>Type here</td>
        <td colspan="3"><input type="text" name="test_answer" required="required" placeholder="Your Code" id="test_answer"/></td>
      </tr>
      <tr>
        <td>&nbsp;</td>
        <td colspan="7"><div align="center">Live for something rather than die for nothing!!</div></td>
      </tr>
      <tr bgcolor="#006600">
        <td height="26" colspan="6"><div align="right"></div></td>
        <td width="48"><input type="reset" name="Create2" id="Create2" value="Reset" /></td>
        <td width="113"><input type="submit" name="btn-Create" id="btn-Create" value="Create" /></td>
      </tr>
    </table></form></td>
    <td height="146" colspan="4" rowspan="2">&nbsp;</td>
  </tr>
  <tr>
    <td height="179">&nbsp;</td>
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
    <td height="21" colspan="6" bgcolor="#006600"><div align="center"><span class="style16">Copy right &copy; 2015, All rights reserved to The </span>Force Armée de la République Démocratique du Congo En RDC!!!    <span class="style16">. </span></div></td>
  </tr>
</table>
</body>
</html><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Untitled Document</title>
</head>

<body>
</body>
</html>