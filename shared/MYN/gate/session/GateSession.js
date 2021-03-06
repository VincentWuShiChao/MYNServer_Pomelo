/**
 * Created by Administrator on 2018/8/27.
 */
/**
 *  长连接session的逻辑
 */
var logger=require('pomelo-logger').getLogger('log', __filename, process.pid);
module.exports = function(context,session) {
    return new Session(context,session);
};

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
        let user=data.userInfo;
        let uid=user.uid;
        let result={};
        if(data.type===1){
            result=this.allConnectorServers(this.ctx.sockets['connector']);//显示所有connector服务器
        }else if(data.type===2){
            result=this.connectorServer(uid,this.ctx.sockets['connector']);//分派某一个connector服务器
        }
        this.session.send(JSON.stringify(result));
        this.session.close();
    }
    onClose(){
        logger.info(`有用户退出了gate长连接`);
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
    connectorServer(uid,socket){//分派某一个connector服务器,单个服务器的连接数不能超过2000
        let result=this.ctx.app.loadBalancing(uid,socket);
        if(result===null){//所有connector服务器爆满
            result={
                chatId:0,
                port:0
            };
            return result;
        }
        result={
            id:result.id,
            host:result.host,
            port:result.port,
            count:result.count
        };
        return result;
    }
}