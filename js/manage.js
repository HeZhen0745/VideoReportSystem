/*-----------------
Used in manage.html
-------------------*/
var envId ="dxwvr-1e2175" ;
var user = null;

var fileBoxList = document.getElementById("fileBox");
var fileNoticeSpan = document.getElementById("filenotice");

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
async function checkCookieAlluserVideoList(){
    user = getCookie("username");
    const _ = db.command;
    const tempmanagerlist = ["admin01","admin02"];
    if (tempmanagerlist.indexOf(user) != -1){       
        const tempuserlist = ["temp01","temp02"];//users' ID. edit when update collections in tcb database
        //如果cookie中有记录用户名字则加载该用户的文件列表 
        for(var i=0; i<tempuserlist.length;i++){
           
            var uname = tempuserlist[i];
            var ucollection = db.collection(uname);       
            await ucollection.where({type:"file", fileID:_.neq(null)})
            .get()
            .then(async function (res) {
                if(res.data.length > 0){
                    var temprownode = null;
                    for(var j=0;j<res.data.length;j++){            
                        var date = res.data[j].date; //*在这获取文件上传的日期
                        var comment = res.data[j].ct; //*在这获取文件的评论
                        var commentby = res.data[j].ctby; //*在这获取文件的评论者
                        await app.getTempFileURL({fileList:[res.data[j].fileID]})
                        .then(function(res2){
                            //动态生成html元素并压入：
                            //获得文件下载链接 url 和 文件名 fileName
                            var fileObj = res2.fileList[0];                            
                            var url = fileObj.tempFileURL;
                            var temparray = url.split('/');
                            var fileName = temparray.pop();//get the name from fileID
                            var un = temparray.pop();
                            
                                //视频缩略图（<video><source></source></video>,只支持mp4类型的文件）
                                var videonode= document.createElement("video");
                                videonode.setAttribute("width", "100%");
                                videonode.setAttribute("controls", "controls");

                                var sourcenode = document.createElement("source");
                                sourcenode.setAttribute("src", url);
                                sourcenode.setAttribute("type", "video/mp4");
                                videonode.appendChild(sourcenode);

                                //生成Date和留言栏
                                var hdatenode = document.createElement("h4");
                                hdatenode.innerHTML = "Date: " + date;

                                var divcommentnode = document.createElement("div");
                                divcommentnode.setAttribute("class","input-group input-group-sm");
                                var spancommentnode = document.createElement("span");
                                spancommentnode.setAttribute("class","input-group-addon");
                                spancommentnode.innerHTML = "Comment";
                                var inputnode =  document.createElement("input");
                                inputnode.setAttribute("type","text");
                                inputnode.setAttribute("class","form-control");
                                inputnode.addEventListener("change", function(){giveComment(fileObj.fileID, un,inputnode.value)}, false);
                                divcommentnode.appendChild(spancommentnode);
                                divcommentnode.appendChild(inputnode);
                                if(comment)
                                    inputnode.value = comment;
                                else
                                    inputnode.placeholder = "Please write down your comment here";
                            
                                //生成对应文件的删除按钮(<p><button></button><p>)
                                var pbuttonnode = document.createElement("p");
                                var buttonnode = document.createElement("button");
                                var textbuttonnode=document.createTextNode("Delete");    
                                buttonnode.appendChild(textbuttonnode);
                                pbuttonnode.appendChild(buttonnode);
                                buttonnode.setAttribute("class","btn btn-primary");  
                                pbuttonnode.setAttribute("class","text-right");    
                                pbuttonnode.style.marginTop = "8px";   
                                buttonnode.addEventListener("click", function(){ deleteFile(fileObj.fileID, un)}, false);

                            //生成外部div（idivnod & odivnode）
                            var odivnode = document.createElement("div");
                            var idivnode = document.createElement("div");

                            //将以上所有元素压入idivnode，idivnode压入odivnode
                            idivnode.appendChild(videonode);
                            idivnode.appendChild(hdatenode);
                            idivnode.appendChild(divcommentnode);
                            idivnode.appendChild(pbuttonnode);
                            odivnode.setAttribute("class","col-md-6");
                            idivnode.setAttribute("class","thumbnail");
                            idivnode.setAttribute("style","padding: 10px");
                            odivnode.appendChild(idivnode);

                            //将一个文件内容压入 filebox

                            if (j%2 == 0) //如果为新的一行
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
        
    }
    else{//该用户未登录
        alert("Please login!");
        window.open("login.html","_self");
    }
}

function deleteFile(tfileID, tusername){
    //删除文件
    app.deleteFile({fileList:[tfileID]})
    .then(res=>{alert("Delete success!")
         db.collection(tusername).where({type:"file", fileID:tfileID}).remove() //从该用户的集合删除形容该文件的文档
         .then(res2=>{
            location.reload(); 
         });
    });       
}

function giveComment(tfileID, tusername, tcomment){
    db.collection(tusername).where({type:"file", fileID:tfileID}).update({ct:tcomment, ctby:user});
}

//check cookie and the video list of this user when load the page(window)
window.addEventListener("load",checkCookieAlluserVideoList,false);