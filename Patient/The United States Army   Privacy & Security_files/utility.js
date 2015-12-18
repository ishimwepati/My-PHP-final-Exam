active=1;

//get current server
var fullURL = document.URL;
var host = window.location.hostname;
var prefix = parent.location.protocol + '//';
var basepath = prefix+host;

//set env vars
var testSites = "http://www.army.mil";
var w4 = "http://www4.army.mil";
var testCORE = "";
var prodA = "http://www.army.mil";
var prodCORE = "";


//find the root
if(fullURL.indexOf(testSites) != -1){
	rootF = testSites;	
}else if(fullURL.indexOf(testCORE) != -1){
	rootF = testCORE;	
}else if(fullURL.indexOf(prodCORE) != -1){
	rootF = prodCORE;		
}else if(fullURL.indexOf(w4) != -1){
	rootF = w4;		
}else{
	rootF = prodA;	
}

//generic form validation
//make sure to set the field class as "required" in your form
function form_validate(myform)
{
	var error = 0;
	
	for(i=0; i<myform.elements.length; i++)
	{
		if(myform.elements[i].className=="required" && (myform.elements[i].value==null || myform.elements[i].value==''))
		{
			error++;
		}
	}
		
	if(error)
	{
		alert("Please fill out all required fields");
		return false;
	}
	
	else
	{
		return true;
	}

}


var semiMatch = false;
function readInfo(name, semiMatch){
	
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' '){
			c = c.substring(1,c.length);
		}
		if (semiMatch){
			if (c.indexOf(name) != -1){ // if string exists in any part of the cookie name
				return true;
			}
		}
		else if (c.indexOf(nameEQ) == 0){
			return c.substring(nameEQ.length,c.length);
		}
		
	}
	return false;
}

/* window.onload, dean edwards style */
function init() {
   if (arguments.callee.done) return;
   arguments.callee.done = true;

	/* when DOM is ready, do this */
	var loggedIn = readInfo('myarmy');
	var myArmy = 'http://my.army.mil/';
	if (loggedIn){
		// if cookie is set, change home button href
		document.getElementById('dropDownNav').children[1].children[0].setAttribute('href', myArmy);
	}
};

if (document.addEventListener) {		// for recent Mozilla, Safari, Chrome, Opera
   document.addEventListener("DOMContentLoaded", init, false);
}
window.onload = init;	// for other browsers
