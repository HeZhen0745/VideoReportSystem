/*-----------------
Used in login.html
-------------------*/

var envId ="dxwvr-1e2175";

//init CloudBase
const app =tcb.init({
  env:envId
});

var auth = app.auth({
    persistence: "local"
}); 

if(!auth.hasLoginState()) {
	auth.signInAnonymously();
}

const db = app.database();

var nameInput = document.getElementById("user");
var pwdInput = document.getElementById("password");
var loginButton = document.getElementById("login");
loginButton.addEventListener("click", login, false);

//bind to login button
function login(){
	var uname = nameInput.value;
	var pwd = md5(pwdInput.value);
	
	//avoid throw in Promise error when the 'uname' collection does not exist in tcb database
	const tempuserlist = ["temp01","temp02","admin01","admin02"];      //edit when update user or admin collections in tcb database

	//if user does not input ID or the ID is wrong, over this function
	if(tempuserlist.indexOf(uname) == -1){
		alert("ID does not exist");
		return;
	}

	//if the ID is right
	db.collection(uname).get().then((res)=>{ //get the collection named as this ID
    	if(!res.code){                       //if success, res.code is null
			db.collection(uname).where({password: pwd}).get().then((res2)=>{	//to identify if the password is correct
				if(res2.code){
					alert(`Error: [code=${res2.code}] [message=${res2.message}]`);
				}else{
					if(res2.data.length == 0)  //password wrong
						alert("password is wrong!");
					else{						 //password correct
						var subwin = null;
						//window.location.href='vrsys.html?name='+uname+'&psw='+pwd;
						if(uname=="admin01"|| uname =="admin02")
							subwin = window.open("manage.html","_self");
						else
							subwin = window.open("vrsys.html","_self");
						setCookie(subwin,"username",uname,7);    //set  cookie
					}
				}
			});
		}
	});		
}

//set cookie of MAIN system papge (save username)
function setCookie(csubwin,cname,cvalue,exdays){
	var d = new Date();
	d.setTime(d.getTime()+(exdays*24*60*60*1000));
	var expires = "expires="+d.toGMTString();
	csubwin.document.cookie = cname+"="+cvalue+"; "+expires;
}

//"ENTER" key to click login button
document.addEventListener("keydown",function(){
	if(event.keyCode == 13){
		loginButton.click();
	}
})
