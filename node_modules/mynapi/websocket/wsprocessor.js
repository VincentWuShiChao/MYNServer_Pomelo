/**
 * Created by Administrator on 2018/8/28.
 */
var WebSocketServer=require('ws');

var ST_STARTED=1;
var ST_CLOSED=2;

var ServerSpace=[]//盛放每个服务器端的缓存数据
class Processor{
    constructor(){
    }
    startServer(serverType,servers){
        //console.log(servers);
        let serverList=[];
        servers.forEach(function (serverInfo) {
            let wsServer=new WebSocketServer.Server({port:serverInfo.port});
            serverInfo.websocket=wsServer;
            serverInfo.state=ST_STARTED;
            serverList.push(serverInfo);
        });
        ServerSpace[serverType]=serverList;
        return new Promise(function (resolve,reject) {
            resolve(ServerSpace);
        });

    }
    getServerSpace(){
        return ServerSpace;
    }
    getServerSpaceByType(serverId){
        return ServerSpace.serverId;
    }
}

module.exports=Processor;



