/**
 * Created by Administrator on 2018/8/28.
 */
var logger=require('pomelo-logger').getLogger('log', __filename, process.pid);
module.exports = function(app,sockets) {
    return new Handler(app,sockets);
};
var that={};
class Handler{
    constructor(context,sockets){
        that.ctx=context;
        that.app=context.app;
        that.sockets=sockets;//所有服务器
        that.socket=sockets["chat"];//chat所有服务器
        if(that.socket.length===1){
            that.webSocket=this.initWebSocket();
            that.webSocket.on("connection",this.connection);
            that.webSocket.on("error",this.error);
            that.webSocket.on("close",this.close);
        }else {//多个chat服务器
            let wss=this.initAllWebSocket();
            wss.forEach(function (ws,index) {
                ws.websocket.on("connection",this.connection.bind(this));
                ws.websocket.on("error",this.error);
                ws.websocket.on("close",this.close);
            }.bind(this));
        }
    }
    initWebSocket(){//获取长连接的webSocket
        logger.info(`开启了${that.socket[0].id}服务器监听-port:${that.socket[0].port}`);
        return that.socket[0].websocket;
    }
    initAllWebSocket(){//获取所有connector长连接的webSocket
        that.socket.forEach(function (socket_each) {
            logger.info(`开启了${socket_each.id}服务器监听-port:${socket_each.port}`);
        });
        return that.socket;
    }
    connection(session){//长连接的connection监听事件
        logger.info("有用户连进来了chat服务器");
        require('../session/chatSession')(that,session);
    }

    error(error){
        console.log(`${that.socket[0].id}-port:${that.socket[0].port}服务器出现异常`);
    }
    close(){
        console.log(`${that.socket[0].id}-port:${that.socket[0].port}服务器关闭`);
    }

}