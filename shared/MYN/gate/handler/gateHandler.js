/**
 * Created by Administrator on 2018/8/28.
 */
var logger=require('pomelo-logger').getLogger('log', __filename, process.pid);
module.exports = function(app,sockets) {
    return new Handler(app,sockets);
};
var that={};
class Handler{
    constructor(app,sockets){
        that.app=app;
        that.sockets=sockets;//所有服务器
        that.socket=sockets["gate"];//gate所有服务器
        if(that.socket.length===1){
            that.socket[0].ServerSpace=[];
            that.webSocket=this.initWebSocket();
            that.webSocket.on("connection",this.connection.bind(this));
            that.webSocket.on("error",this.error.bind(this));
        }
    }
    initWebSocket(){//获取长连接的webSocket
        logger.info(`开启了${that.socket[0].id}服务器监听-port:${that.socket[0].port}`);
        return that.socket[0].websocket;
    }
    connection(session){//长连接的connection监听事件
        logger.info("有用户连进来了gate服务器");
        require('../session/GateSession')(that,session);
    }

    error(error){
        logger.warn(`${that.socket[0].id}-port:${that.socket[0].port}服务器出现异常`);
    }
    close(){
        logger.warn(`${that.socket[0].id}-port:${that.socket[0].port}服务器关闭`);
    }

}