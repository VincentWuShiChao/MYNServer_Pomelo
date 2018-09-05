/**
 * Created by Administrator on 2018/8/27.
 */
/**
 *  长连接session的逻辑
 */
var JSONCirular=require('circular-json');
var Dispatch=require('../../../../../shared/MYN/util/dispatch');
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
        this.matchs=this.ctx.sockets["match"];
        this.session.on("message",this.onMessage.bind(this));
        this.session.on("close",this.onClose.bind(this));
    }
    onMessage(data){
        data=this.ctx.app.decodeMsg(data);
        data=JSON.parse(data);
        console.log(data);
        console.log(this.standardClientData(data));
        if(!this.standardClientData(data)){
            let info={
                tag:"error",
                msg:"信息格式不正确"
            }
            let buffer=this.ctx.app.encodeMsg(JSONCirular.stringify(info));
            this.session.send(buffer);
            return;
        }
        switch (data.tag){
            case "linkSuccess"://{serverId:data.id}
                console.log(data.userInfo.serverId);
                let result={};
                console.log(data.userInfo.name);
                this.ctx.socket.forEach(function (socket_each) {
                    if(socket_each.id===data.userInfo.serverId){
                        this.session.serverId=socket_each.id;
                        this.session.user=data.userInfo.name;
                        socket_each.count++;
                        result.count=socket_each.count;
                        result.serverId=socket_each.id;
                        this.ctx.ShareSpace[socket_each.id].push(this.session);
                    }
                }.bind(this));
                Content.getContent()[data.userInfo.serverId]["UserInfo"].push({userData:data.userInfo});
                result.tag="linkSuccess";
                let user_chat=this.ctx.app.loadBalancing(data.userInfo.uid,this.ctx.chats);//分配chat服务器
                let user_match=this.ctx.app.loadBalancing(data.userInfo.uid,this.matchs);//分配match服务器
                if(user_chat===null||user_match===null){
                    result.chatServer={
                        chatId:0,
                        port:0
                    };//玩家连接好游戏服务器后，得到自己所在的chat服务器id
                    this.findWebSocket(data, function (server) {
                        server.emitOne(this.session,result);
                    }.bind(this));
                    return;
                }
                this.session.chatInfo=user_chat;
                result.chatServer={
                    chatId:user_chat.id,
                    port:user_chat.port
                };//玩家连接好游戏服务器后，得到自己所在的chat服务器id
                result.matchServer={
                    matchId:user_match.id,
                    port:user_match.port
                }
                this.findWebSocket(data, function (server) {
                    server.emitOne(this.session,result);
                }.bind(this));
                break;
            case "notice":
                console.log("接收到了notice");
                this.findWebSocket(data, function (server) {
                    let message={
                        tag:"notice",
                        msg:"通知所有玩家，该服务器将要在明天停服。"
                    };
                    //server.emitAll(message);
                    server.emitSameServer(message);
                }.bind(this));
                break;
        }
    }
    findWebSocket(data,cb){//找到该用户所属的connector服务器的server
        this.ctx.ShareSpace["serverInfo"].forEach(function(server){
            if(server.id===data.userInfo.serverId){
                cb(server.websocket);
            }
        }.bind(this));
    }
    standardClientData(data){
        if(data.userInfo==="undefined"){
            return false;
        }else{
            let msg=[];
            for(let key in data.userInfo ){
                if(key==="serverId"){
                    msg.push("serverId");
                }
            }
            if(msg.length===0){
                return false;
            }else {
                return true;
            }
        }

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
                console.log("connector-server-1服务器的值空间：",this.ctx.ShareSpace["connector-server-1"]);
                console.log("connector-server-2服务器的值空间：",this.ctx.ShareSpace["connector-server-2"]);
            }
        }.bind(this));
        console.log(`有用户退出了connector长连接${this.session.serverId},剩余人数：${count}`);
    }
}