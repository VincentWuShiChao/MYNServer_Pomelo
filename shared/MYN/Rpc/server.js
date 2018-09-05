'use strict';
const net=require('net');
const pump=require('pump');
const protocol=require('sofa-bolt-node');

function plus(array){
    return array[0]+array[1];
}
const server=net.createServer(socket=>{
    const options={
        sentReqs:new Map()
    };
    const encoder=protocol.encoder(options);
    const decoder=protocol.decoder(options);
    pump(encoder,socket,decoder,err=>{
        console.log(err);
    });
    decoder.on('request',req=>{
        let array=req.data.args;
        console.log("request data:",array);
        encoder.writeResponse(req,{
            isError:false,
            appResponse:{
                //$class:'java.lang.String',
                "method":"plus",
                "return":`${array[0].data[0]}+${array[0].data[1]}=${plus(array[0].data)}!`
            }
        });
    });
    decoder.on('heartbeat',hb=>{
        console.log(hb);
        encoder.writeHeartbeatAck(hb);
    });

});
server.listen(12200);
