/*-----------------
Used in vrsys.html
-------------------*/

var envId ="dxwvr-1e2175";

var ename = null;
var efile = null;

var user = null;
var userCollection = null;


var fileInput = document.getElementById("file");
var uploadButton = document.getElementById("upload");
var fileBoxList = document.getElementById("fileBox");
var fileNoticeSpan = document.getElementById("filenotice");
var uploadProgressBar = document.getElementById("uploadProgress");
var progressDisplayDiv = document.getElementById("progressDisplay");
fileInput.addEventListener("change", this.getFile.bind(this), false);
uploadButton.addEventListener("click", this.upload.bind(this), false);

const app =tcb.init({
    env:envId
});

var auth = app.auth({
    persistence: "local"
});

if(!auth.hasLoginState()) {
	auth.signInAnonymously();
}

const db =app.database();

function getCookie(cname){
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i].trim();
        if (c.indexOf(name)==0) { return c.substring(name.length,c.length); }
    }
    return "";
}

//*****check chookie and video list of user when onload vrsys.html
function checkCookieVideoList(){
    user = getCookie("username");
    const _ = db.command;    
    const tempuserlist = ["temp01","temp02"];
    if (tempuserlist.indexOf(user) != -1){       //如果cookie中有记录用户名字则加载该用户的文件列表   
        userCollection = db.collection(user);
        userCollection.where({type:"file", fileID:_.neq(null)})
        .get()
        .then(async function (res) {
            if(res.data.length == 0){
                fileNoticeSpan.innerHTML="No file uploaded.";
            }
            else{   //开始读取文件
                var temprownode = null;

                for(var i=0;i<res.data.length;i++){
                    var date = res.data[i].date; //*在这获取文件上传的日期
                    var comment = res.data[i].ct; //*在这获取文件的评论
                    var commentby = res.data[i].ctby; //*在这获取文件的评论者

                    await app.getTempFileURL({fileList:[res.data[i].fileID]})
                    .then(res2=>{ 
                        //动态生成文件内容并压入
                
                        //获得文件下载链接 url
                        var fileObj = res2.fileList[0];
                        var url = fileObj.tempFileURL;

                            //视频缩略图（<video><source></source></video>,只支持mp4类型的文件）
                            var videonode= document.createElement("video");
                            videonode.setAttribute("width", "100%");
                            videonode.setAttribute("controls", "controls");

                            var sourcenode = document.createElement("source");
                            sourcenode.setAttribute("src", url);
                            sourcenode.setAttribute("type", "video/mp4");
                            videonode.appendChild(sourcenode);
                    
                            //生成Date和Comment
                            var hdatenode = document.createElement("h4");
                            hdatenode.innerHTML = "Date: " + date;

                            var pcommentnode = document.createElement("p");
                            var strongnode = document.createElement("strong");
                            strongnode.innerHTML = "Comment: ";
                            var textcommentnode=document.createTextNode(comment);
                            pcommentnode.appendChild(strongnode);
                            if(comment)
                                pcommentnode.appendChild(textcommentnode);
                            else
                                pcommentnode.innerHTML = "No Comment";

                            //生成对应文件的删除按钮(<p><button></button><p>)
                            var pbuttonnode = document.createElement("p");
                            var buttonnode = document.createElement("button");
                            var textbuttonnode=document.createTextNode("Delete");    
                            buttonnode.appendChild(textbuttonnode);
                            pbuttonnode.appendChild(buttonnode);
                            buttonnode.setAttribute("class","btn btn-primary");  
                            pbuttonnode.setAttribute("class","text-right");     
                            buttonnode.addEventListener("click", function(){ deleteFile(fileObj.fileID)}, false);

                            //生成外部div（idivnod & odivnode）
                            var odivnode = document.createElement("div");
                            var idivnode = document.createElement("div");

                        //将以上所有元素压入idivnode，idivnode压入odivnode
                        idivnode.appendChild(videonode);
                        idivnode.appendChild(hdatenode);
                        idivnode.appendChild(pcommentnode);
                        idivnode.appendChild(pbuttonnode);
                        odivnode.setAttribute("class","col-md-6");
                        idivnode.setAttribute("class","thumbnail");
                        idivnode.setAttribute("style","padding: 15px");
                        odivnode.appendChild(idivnode);

                        //将一个文件内容压入 filebox
                      
                        if (i%2 == 0) //如果为新的一行
                        {
                            var rownode = document.createElement("div");
                            rownode.setAttribute("class","row");
                            temprownode = rownode;
                            temprownode.appendChild(odivnode);
                            fileBoxList.appendChild (temprownode);
                        }
                        else{
                            temprownode.appendChild(odivnode);                            
                        }  
                    });
                }
            }
        });
    }
    else{//该用户未登录
        alert("Please login!");
        window.open("login.html","_self");
    }
}

function deleteFile(tempfileID){
    //删除文件
    app.deleteFile({fileList:[tempfileID]})
    .then(res=>{
        alert("Delete success!");
        //从该用户的集合删除形容该文件的文档
        userCollection.where({type:"file", fileID:tempfileID}).remove().then(res=>{
            location.reload(); 
        });
    });  
}

//get file and name of file
function getFile(e){
    e.stopPropagation();
    e.preventDefault(); 
    efile = e.target.files[0];
    ename = efile.name;
}

//upload file
function upload(){
    if(ename && efile){  
        progressDisplayDiv.style.display = "block";
        var value=0;
        progress(value);
        app.uploadFile({
            //文件的绝对路径，包含文件名
            cloudPath: user+"/"+ename,
            //要上传的文件对象
            filePath: efile
            // onUploadProgress: function (progressEvent) {
            //     // console.log(progressEvent);
            //     // var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        }).then(res=>{
            //写入对应用户的json文档里
            const _=db.command;
            
            userCollection.where({fileID:res.fileID}).get().then(res2=>{
                if(res2.data.length == 0){//if the fileID is not recorded in the collection
                    userCollection.add({
                        type:"file",
                        fileID: res.fileID,
                        date: getUploadDate()
                    })
                    .then(function (res3) {
                        $("#uploadProgress").css("width", "100%");
                        setTimeout(function(){
                            alert("Upload Success!");
                            location.reload();
                            },
                            1500);
                    });
                }
                else{
                    alert("The file has existed!")
                    location.reload();
                    }
            });    
        });   
    }
    else
        window.alert("Upload Failed");
}

//check cookie and the video list of this user when load the page(window)
window.addEventListener("load",checkCookieVideoList,false);

function progress(value) {
    if (value < 50) {
        value += 1;
        $("#uploadProgress").css("width", value + "%");
        // remindspan.innerText=value+"%";
        setTimeout("progress("+value+")", 20);
    }else if (value>=50 && value<85){
        value += 1;
        $("#uploadProgress").css("width", value + "%");
        // remindspan.innerText=value+"%";
        setTimeout("progress("+value+")", 40);
    }else if (value>=85 && value<99){
        value += 1;
        $("#uploadProgress").css("width", value + "%");
        // remindspan.innerText=value+"%";
        setTimeout("progress("+value+")", 60);
    }
    else return"";
}

function getUploadDate(){
    var date = new Date();
	var sep = "-";
	var year = date.getFullYear(); //获取完整的年份(4位)
	var month = date.getMonth() + 1; //获取当前月份(0-11,0代表1月)
	var day = date.getDate(); //获取当前日
	if (month <= 9) {
		month = "0" + month;
	}
	if (day <= 9) {
		day = "0" + day;
	}
	var currentdate = year + sep + month + sep + day;
	return currentdate;
}