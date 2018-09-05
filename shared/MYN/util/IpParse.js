/**
 * Created by Administrator on 2018/7/27.
 */
'use strict'
/*
    ip地址解析
 */
/**
 * let ipParse=new IpParse(req);
 * let userIp=ipParse.getClientIp();
 * ipParse.parseIpByTaoBao(userIp,function (result) {
 *       data.ipAddr=result;
 *       let logger=logJs.useLogger(date+"_adminLogin");
 *       logJs.createLog(logger,JSON.stringify(data));
 * });
 *
 */
var libqqwry=require('lib-qqwry');
var request=require('request');
var qqwry=libqqwry.init();
qqwry.speed();

class IpParse{
    constructor(req){
        this.req=req;
    }
    getClientIp(){//获取客户端ip
        return this.req.get("X-Real-IP")||this.req.get("X-Forwarded-For")||this.req.ip;
    }
    parseIp(ipAddr){//解析IP
        let ipL=qqwry.searchIP(ipAddr);
        return ipL;
    }
    parseIpByTaoBao(ip,callback){
        let url=`http://ip.taobao.com/service/getIpInfo.php?ip=${ip}`;
        request({
            type:"GET",
            url:url
        },function (res,cb) {
            let result=JSON.parse(cb.body).data;
            callback(result);
        }.bind(this));
    }
}

module.exports=IpParse;