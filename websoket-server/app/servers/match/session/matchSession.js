/**
 * Created by Administrator on 2018/8/27.
 */
/**
 *  长连接session的逻辑
 */
const WORLD=0;//世界聊天
const SERVER=1;//同一个服务器聊天
const UNION=2;//公会聊天
const TEAM=3;//团队聊天
const ROOM=4;//房间聊天
const PRIVATECHAT=5;//私聊
var JSONCirular=require('circular-json');
var Content=require('../../../../../shared/MYN/Content/content');
module.exports = function(context,session) {
    return new Session(context,session);
};
/**
 * this.ctx.ShareSpace=[connector-server-1:[session]]
 * session:{
 *  user:"",
 *  serverId:
 * }
 */
class Session{
    constructor(context,session){
        this.ctx=context;
        this.session=session;
        this.session.on("message",this.onMessage.bind(this));
        this.session.on("close",this.onClose.bind(this));
    }
    onMessage(data){
        data=this.ctx.app.decodeMsg(data);
        data=JSON.parse(data);
        let result={};
        console.log("35:",data);
        if(data.tag!="linkSuccess"){
            if(!this.standardClientData(data)){
                let info={
                    tag:"error",
                    msg:"信息格式不正确或未配置chatType.json文件"
                };
                let buffer=this.ctx.app.encodeMsg(JSONCirular.stringify(info));
                this.session.send(buffer);
                return;
            }
        }
        switch (data.tag){
            case "linkSuccess":
                let serverMatchs=this.ctx.socket;
                serverMatchs.forEach(function (serverMatch) {//标记匹配服务器中的client属于哪个服务器的
                    serverMatch.websocket.clients.forEach(function (client) {
                        if(client===this.session){
                            client.serverId=data.userInfo.serverId;
                        }
                    }.bind(this));
                }.bind(this));
                result.tag="linkSuccess";
                result.serverId=data.userInfo.serverId;
                result.matchServerId=data.userInfo.matchServerId;
                let message=this.ctx.app.encodeMsg(JSON.stringify(result));
                this.session.send(message);
                Content.getContent()[data.userInfo.serverId]["UserInfo"].forEach(function (each,index) {
                    if(data.userInfo.name===each.userData.name){
                        Content.getContent()[data.userInfo.serverId]["UserInfo"][index].matchMsg=[];
                    }
                });
                console.log(Content.getContent()["connector-server-1"]["UserInfo"]);
                break;
        }
    }
    findWebSocket(data,cb){//找到该用户所属的服务器的server
        this.ctx.ShareSpace["serverInfo"].forEach(function(server){
            if(server.id===data.userInfo.serverId){
                cb(server.websocket);
            }
        }.bind(this));
    }
    onClose(){
        let count=-1;
        this.ctx.socket.forEach(function (socket_each) {
            if(socket_each.id===this.session.serverId){
                socket_each.count--;
                count=socket_each.count;
                this.ctx.ShareSpace[this.session.serverId].forEach(function (shareSpace,index) {
                    if(shareSpace.user===this.session.user){
                        console.log("index:",index);
                        this.ctx.ShareSpace[this.session.serverId].splice(index,1);
                    }
                }.bind(this));
                console.log("match-server-1服务器的值空间：",this.ctx.ShareSpace["match-server-1"]);
                console.log("match-server-2服务器的值空间：",this.ctx.ShareSpace["match-server-2"]);
            }
        }.bind(this));
        console.log(`有用户退出了connector长连接${this.session.serverId},剩余人数：${count}`);
    }
    standardClientData(data){
        console.log("standardClientData");
        if(data.userInfo==="undefined"){
            return false;
        }else{
            let msg=[];
            let config_list=this.readFromChatConfig();
            console.log(config_list);
            let size=0;
            console.log(data.tag);
            console.log(config_list.indexOf(data.tag));
            if(config_list.indexOf(data.tag)>-1){
                if(data.tag==="SERVER"){
                    size=2;
                    for(let key in data.userInfo ){
                        if(key==="chatServerId"){
                            msg.push("chatServerId");
                        }
                        if(key==="serverId"){
                            msg.push("serverId");
                        }

                    }
                }
                if(data.tag==="UNION"){
                    size=3;
                    for(let key in data.userInfo){
                        if(key==="chatServerId"){
                            msg.push("chatServerId");
                        }
                        if(key==="serverId"){
                            msg.push("serverId");
                        }
                        if(key==="unionId"){
                            msg.push("unionId");
                        }
                    }
                }
                if(data.tag==="TEAM"){
                    size=3;
                    for(let key in data.userInfo){
                        if(key==="chatServerId"){
                            msg.push("chatServerId");
                        }
                        if(key==="serverId"){
                            msg.push("serverId");
                        }
                        if(key==="teamId"){
                            msg.push("teamId");
                        }
                    }
                }
                if(data.tag==="ROOM"){
                    size=3;
                    for(let key in data.userInfo){
                        if(key==="chatServerId"){
                            msg.push("chatServerId");
                        }
                        if(key==="serverId"){
                            msg.push("serverId");
                        }
                        if(key==="roomId"){
                            msg.push("roomId");
                        }
                    }
                }
                if(data.tag==="PRIVATECHAT"){
                    size=3;
                    for(let key in data.userInfo){
                        if(key==="chatServerId"){
                            msg.push("chatServerId");
                        }
                        if(key==="serverId"){
                            msg.push("serverId");
                        }
                        if(key==="otherId"){
                            msg.push("otherId");
                        }
                    }
                }
                console.log(msg);
                console.log(size);
                if(data.tag==="SERVER"&&(msg.length===0||msg.length!=2)){
                    return false;
                }else if(data.tag!=="SERVER"&&(msg.length===0||msg.length!=3)){
                    return false;
                }else {
                    return true;
                }
            }else {
                return false;
            }
        }
    }
}