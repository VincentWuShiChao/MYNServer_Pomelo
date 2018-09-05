/**
 * Created by Administrator on 2018/8/29.
 */
/**
 * Created by Administrator on 2018/8/28.
 */
var logger=require('pomelo-logger').getLogger('log', __filename, process.pid);
module.exports = function(app,sockets) {
    return new Handler(app,sockets);
};
var JSONCirular=require('circular-json');
var that={};
var Content=require('../../Content/content');
/**
 * that.app    保存上文的application实例
 * that.sockets 所有开启的服务器信息
 * that.socket 本connector的所有服务器
 * that.self Handler类的this指针
 * that.webSocket 单个connector的websocket对象
 * that.ShareSpace 整个connector值空间
 *
 */
class Handler{

    constructor(app,sockets){
        that.self=this;
        that.app=app;
        that.sockets=sockets;//所有服务器
        that.socket=sockets["connector"];//connector所有服务器
        that.chats=sockets["chat"];//chat所有服务器
        //console.log(that.socket);
        if(that.socket.length===1){
            that.socket[0].ServerSpace=[];
            that.webSocket=this.initWebSocket();
            that.webSocket.on("connection",this.connection);
            that.webSocket.on("error",this.error);
            that.webSocket.on("close",this.close);
        }else {//多个connector服务器
            let wss=this.initAllWebSocket();
            //let chats=this.initAllChatSocket();
            that.ShareSpace=[];//数组json
            that.ShareSpace["serverInfo"]=wss;
            //that.ShareSpace["chatInfo"]=chats;
            //that.ShareSpace["chatAllot"]=[];
            wss.forEach(function (ws,index) {
                that.ShareSpace[ws.id]=[];
                /*that.ShareSpace["chatAllot"][ws.id]=[];
                chats.forEach(function (chat) {
                    that.ShareSpace["chatAllot"][ws.id].push({chatId:chat.id,port:chat.port});
                }.bind(that));*/
                //------------------------------------------初始化Content类--------------------------
                Content.getContent()[ws.id]=[];
                Content.getContent()[ws.id]["UserInfo"]=[];
                Content.getContent()[ws.id]["MatchPool"]=[];
                //----------------------------------------------------------------------------------
                ws.websocket.on("connection",that.self.connection.bind(ws));
                ws.websocket.emitOne=that.self.emitOne;
                ws.websocket.emitSameServer=that.self.emitSameServer.bind(ws);
                ws.websocket.emitAll=that.self.emitAll.bind(wss);
                ws.websocket.on("error",that.self.error);
                ws.websocket.on("close",that.self.close);
            }.bind(that));
            that.app.setDefault("chat",that,that.sockets);//跳转到chatHandlerjs(开启connector聊天服务器)
            this.addServer(that.app,that.sockets);//注册游戏服务器的匹配服务器
        }
    }
    initWebSocket(){//获取单个长连接的webSocket
        logger.info(`开启了${that.socket[0].id}服务器监听-port:${that.socket[0].port}`);
        return that.socket[0].websocket;
    }
    initAllWebSocket(){//获取所有connector长连接的webSocket
        that.socket.forEach(function (socket_each) {
            logger.info(`开启了${socket_each.id}服务器监听-port:${socket_each.port}`);
        });
        return that.socket;
    }
    initAllChatSocket(){//获取所有connector长连接的chatSocket
        that.chats.forEach(function (socket_each) {
            logger.info(`开启了${socket_each.id}服务器监听-port:${socket_each.port}`);
        });
        return that.chats;
    }
    emitOne(session,info) {//给某一个玩家发送信息
        logger.info("------------>发送<-------------");
        let buffer=that.app.encodeMsg(JSONCirular.stringify(info));
        session.send(buffer);
    }
    emitAll(message){//广播到所有connector服务器的玩家{tag:,msg}
        logger.info("------------>广播<-------------");
        if(message.tag==="notice"){
            console.log("广播--notice");
            this.forEach(function (ws) {
                ws.websocket.clients.forEach(function (client) {
                    let buffer=that.app.encodeMsg(JSONCirular.stringify(message));
                    client.send(buffer);
                })
            })
        }
    }
    emitSameServer(message){//广播到同一个connector服务器的玩家{tag:,msg}
        logger.info("------------>广播<-------------");
        if(message.tag==="notice") {
            logger.debug("广播--notice");
            this.websocket.clients.forEach(function (client) {
                let buffer=that.app.encodeMsg(JSONCirular.stringify(message));
                client.send(buffer);
            })
        }
    }
    /*emitRoom(message){//同一个房间

    }*/
    connection(session){//长连接的connection监听事件
        console.log(`ConnectorHandler有用户连进来了connector服务器${this.id}`);
        require('../../../../websoket-server/app/servers/connector/session/connectorSession.js')(that,session);
    }
    allConnectorServers(socket){//显示所有connector服务器
        let result=[];
        socket.forEach(function (socket_each) {
            let serverInfo={
                id:socket_each.id,
                host:socket_each.host,
                port:socket_each.port
            };
            result.push(serverInfo);
        });
        return result;
    }
    connectorServer(uid,socket){//分派某一个connector服务器
        let result=that.app.loadBalancing(uid,socket);
        result={
            id:result.id,
            host:result.host,
            port:result.port
        };
        return result;
    }
    error(error){
        logger.error(`${that.socket[0].id}-port:${that.socket[0].port}服务器出现异常`);
    }
    close(){
        logger.off(`${that.socket[0].id}-port:${that.socket[0].port}服务器关闭`);
    }
    addServer(app,result){//注册该游戏服务器下的匹配服务器
        app.set("match",that,result);
    }

}