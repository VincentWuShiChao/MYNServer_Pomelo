/**
 * Created by Administrator on 2018/8/28.
 */


var Utils=require('./util/utils.js');
var utils=new Utils();
var serversConfig=require('./config/servers');
var STATE_INITED  = 1;  // app has inited
var STATE_START = 2;  // app start
var STATE_STARTED = 3;  // app has started
var STATE_STOPED  = 4;  // app has stoped
var WsProcessor=require('./websocket/wsprocessor.js');
var wsProcessor=new WsProcessor();
var Buf=require('./util/code.js');
var Dispatch=require('./util/dispatch');
var logger=require('pomelo-logger').getLogger('log', __filename, process.pid);
var that;
class Application{
    constructor(){
        that=this;
    }
    init(){
        this.state = STATE_INITED;
        logger.info(`application inited`)
    }
    start(cb){
        this.startTime=Date.now();
        if(this.state>STATE_INITED){
            utils.invokeCallback(cb,new Error("application has already start"));
            return;
        }
        var self=this;
        this.getServersFromConfig(self)
            .then(function (allServers) {
                let serverTypes=[];
                for(let serverId in allServers){
                    serverTypes.push(serverId);
                }
                logger.debug(serverTypes);
                var current=0;
                serverTypes.forEach(function (serverType) {
                    self.run(self,serverType,allServers[serverType], function (result) {
                            logger.info(`创建${serverType}相关服务器成功`);
                            current++;
                            if(serverType==="gate"){
                                that.setDefault("gate",that,result);
                            }
                            if(serverType==="connector"){
                                that.setDefault("connector",that,result);
                            }
                            if(current===serverTypes.length){
                                cb(result);
                            }
                        });
                });
            });
    }
    getServersFromConfig(app){
        let allServers=serversConfig;
        return new Promise(function (resolve,reject) {
            resolve(allServers);
        });
    }
    run(app,serverType,servers,cb){
        wsProcessor.startServer(serverType,servers)
            .then(function (result_resolve) {
                if(result_resolve){
                    //console.log("---------run:",result_resolve);
                    cb(result_resolve)
                }
            })
    }
    setDefault(type,app,result){
        logger.debug("application-67:",type);
        let filename=type+'Handler.js';
        let path='./'+type+'/handler/'+filename;
        logger.debug(path);
        require(path)(app,result);
    }
    set(type,app,result) {
        logger.debug("application-67:",type);
        let filename=type+'Handler.js';
        let path='../../websoket-server/app/servers/'+type+'/handler/'+filename;
        logger.debug(path);
        require(path)(app,result);
    }
    encodeMsg(str){
        return Buf.encodeBuffer(str);
    }
    decodeMsg(buffer){
        return Buf.decodeBuffer(buffer);
    }
    loadBalancing(uid,servers){
        return Dispatch.dispatch(uid,servers);
    }
    nowTime(){
        let year=new Date().getFullYear();
        let month=new Date().getMonth()+1;
        let date=new Date().getDate();
        let hour=new Date().getHours();
        let minute=new Date().getMinutes();
        let second=new Date().getSeconds();
        let time=year+"/"+month+"/"+date+"-"+hour+":"+minute+":"+second;
        return time;
    }
}

module.exports=Application;