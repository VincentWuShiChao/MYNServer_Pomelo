'use strict';
const net=require('net');
const pump=require('pump');
const protocol=require('sofa-bolt-node');
const options={
    sentReqs:new Map()
};
const socket=net.connect(12200,"127.0.0.1");
const encoder=protocol.encoder(options);
const decoder=protocol.decoder(options);

socket.once("connect",()=>{
    console.log("connected");
});
socket.once("close",()=>{
    console.log("close");
});
socket.once("error",err=>{
    console.log(err);
});

//流式api
pump(encoder,socket,decoder,err=>{
    console.log(err);
});

//监听response/heartbeat_acl
decoder.on("response",res=>{
    console.log("response:",res.data.appResponse);
});
decoder.on('heartbeat_ack',res=>{
    console.log("heartbeat_ack",res);
});

encoder.writeRequest(1,{
    args:[{
        //$class:'java.lang.String',
        //$:{name:"wushichao"}
        "method":"plus",
        "data":[2,4]
    }],
    //serverSignature:'com.alipay.sofa.rpc.quickstart.HelloService:1.0',
    //methodName:'sayHello',
    timeout:3000
});
//encoder.writeHeartbeat(2,{clientUrl:"xxx"});