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
var ChatConfig=require('../../config/chatType');
var Content=require('../../Content/content');
var logger=require('pomelo-logger').getLogger('log', __filename, process.pid);
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
        logger.debug("35:",data);
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
                let serverChats=this.ctx.socket;
                serverChats.forEach(function (serverChat) {
                    serverChat.websocket.clients.forEach(function (client) {
                        if(client===this.session){
                            serverChat.count++;
                            client.serverId=data.userInfo.serverId;//可拓展（包括同服，同公会，同房间等）
                            //client.teamId=data.userInfo.teamId;
                        }
                    }.bind(this));
                }.bind(this));
                Content.getContent()[data.userInfo.serverId]["UserInfo"].forEach(function (each,index) {
                    if(data.userInfo.name===each.userData.name){
                        Content.getContent()[data.userInfo.serverId]["UserInfo"][index].chatMsg=[];
                    }
                });
                logger.debug(Content.getContent()["connector-server-1"]["UserInfo"]);
                result.tag="linkSuccess";
                result.serverId=data.userInfo.serverId;
                result.chatServerId=data.userInfo.chatServerId;
                let message=this.ctx.app.encodeMsg(JSON.stringify(result));
                this.session.send(message);
                logger.debug(serverChats);
                break;
            case "WORLD":
                this.worldChat(data);
                break;
            case "SERVER":
                this.serverChat(data);
                break;
            case "TEAM":
                this.teamChat(data);
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
    worldChat(data){
        let result={
            tag:"WORLD",
            msg:data.userInfo.msg
        };
        //--------------------------------------------将用户发送的信息保存到全局缓存中--------------------------------------------
        let msg_list=[];
        let has_user=-1;
        Content.getContent()[data.userInfo.serverId]["UserInfo"].forEach(function (content,index) {
            if(content.userData.name===data.userInfo.name){
                msg_list=content.chatMsg;
                has_user=index;
            }
        });
        if(has_user===-1){
            logger.warn("该用户并没有登录成功到connector服务器");
        }else {
            let time=this.ctx.app.nowTime();
            Content.getContent()[data.userInfo.serverId]["UserInfo"][has_user].chatMsg.push({msg:data.userInfo.msg,time:time,type:data.tag});
        }
        //-----------------------------------------------------------------------------------------------------------------------------------
        let serverChats=this.ctx.socket;
        serverChats.forEach(function (serverChat) {
            serverChat.websocket.clients.forEach(function (client) {
                let message=this.ctx.app.encodeMsg(JSON.stringify(result));
                //console.log("找到相同的用户:",message);
                client.send(message);
                logger.debug("世界聊天");

            }.bind(this));
        }.bind(this));

    }
    serverChat(data){
        let result={
            tag:"SERVER",
            serverId:data.userInfo.serverId,
            chatServerId:data.userInfo.chatServerId,
            msg:data.userInfo.msg
        };

        //--------------------------------------------将用户发送的信息保存到全局缓存中--------------------------------------------
        let msg_list=[];
        let has_user=-1;
        Content.getContent()[data.userInfo.serverId]["UserInfo"].forEach(function (content,index) {
            if(content.userData.name===data.userInfo.name){
                msg_list=content.chatMsg;
                has_user=index;
            }
        });
        if(has_user===-1){
            logger.warn("该用户并没有登录成功到connector服务器");
        }else {
            let time=this.ctx.app.nowTime();
            Content.getContent()[data.userInfo.serverId]["UserInfo"][has_user].chatMsg.push({msg:data.userInfo.msg,time:time,type:data.tag});
        }
       //-----------------------------------------------------------------------------------------------------------------------------------

        let serverChats=this.ctx.socket;
        serverChats.forEach(function (serverChat) {
            serverChat.websocket.clients.forEach(function (client) {
                if(client.serverId===data.userInfo.serverId){
                    logger.debug(result);
                    let message=this.ctx.app.encodeMsg(JSON.stringify(result));
                    //console.log("找到相同的用户:",message);
                    client.send(message);
                    logger.debug("同服聊天");
                }
            }.bind(this));
        }.bind(this));

    }
    teamChat(data){//未完成
        let result={
            tag:"TEAM",
            serverId:data.userInfo.serverId,
            chatServerId:data.userInfo.chatServerId,
            msg:data.userInfo.msg
        };
        let serverChats=this.ctx.socket;
        serverChats.forEach(function (serverChat) {

            serverChat.websocket.clients.forEach(function (client) {
                if(client.serverId===data.userInfo.serverId){
                    logger.debug(result);
                    let message=this.ctx.app.encodeMsg(JSON.stringify(result));
                    //console.log("找到相同的用户:",message);
                    client.send(message);
                    logger.debug("团队聊天");
                }
            }.bind(this));
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
                        logger.debug("index:",index);
                        this.ctx.ShareSpace[this.session.serverId].splice(index,1);
                    }
                }.bind(this));
                logger.info("connector-server-1服务器的值空间：",this.ctx.ShareSpace["connector-server-1"]);
                logger.info("connector-server-2服务器的值空间：",this.ctx.ShareSpace["connector-server-2"]);
            }
        }.bind(this));
        logger.off(`有用户退出了connector长连接${this.session.serverId},剩余人数：${count}`);
    }
    standardClientData(data){
        logger.debug("standardClientData");
        if(data.userInfo==="undefined"){
            return false;
        }else{
            let msg=[];
            let config_list=this.readFromChatConfig();
            logger.debug(config_list);
            let size=0;
            logger.debug(data.tag);
            if(data.tag==="WORLD"){
                size=2;
                for(let key in data.userInfo ){
                    if(key==="chatServerId"){
                        msg.push("chatServerId");
                    }
                    if(key==="serverId"){
                        msg.push("serverId");
                    }
                }
                if(msg.length===0||msg.length!=2){
                    return false;
                }else {
                    return true;
                }
            }else if(config_list.indexOf(data.tag)>-1){
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
                logger.debug(msg);
                logger.debug(size);
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
    readFromChatConfig(){
        let keys=[];
        for(let key in ChatConfig){
            if(ChatConfig[key]===1){
                keys.push(key);
            }
        }
        return keys;
    }
}