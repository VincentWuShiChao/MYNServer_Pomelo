/**
 * Created by Administrator on 2018/8/28.
 */
function stringToByte(str) {
    var bytes = new Array();
    var len, c;
    len = str.length;
    for(var i = 0; i < len; i++) {
        c = str.charCodeAt(i);
        if(c >= 0x010000 && c <= 0x10FFFF) {
            bytes.push(((c >> 18) & 0x07) | 0xF0);
            bytes.push(((c >> 12) & 0x3F) | 0x80);
            bytes.push(((c >> 6) & 0x3F) | 0x80);
            bytes.push((c & 0x3F) | 0x80);
        } else if(c >= 0x000800 && c <= 0x00FFFF) {
            bytes.push(((c >> 12) & 0x0F) | 0xE0);
            bytes.push(((c >> 6) & 0x3F) | 0x80);
            bytes.push((c & 0x3F) | 0x80);
        } else if(c >= 0x000080 && c <= 0x0007FF) {
            bytes.push(((c >> 6) & 0x1F) | 0xC0);
            bytes.push((c & 0x3F) | 0x80);
        } else {
            bytes.push(c & 0xFF);
        }
    }
    return bytes;
}

function decodeBuffer(arr) {
    if(typeof arr === 'string') {
        return arr;
    }
    var str = '',
        _arr = arr;
    for(var i = 0; i < _arr.length; i++) {
        var one = _arr[i].toString(2),
            v = one.match(/^1+?(?=0)/);
        if(v && one.length == 8) {
            var bytesLength = v[0].length;
            var store = _arr[i].toString(2).slice(7 - bytesLength);
            for(var st = 1; st < bytesLength; st++) {
                store += _arr[st + i].toString(2).slice(2);
            }
            str += String.fromCharCode(parseInt(store, 2));
            i += bytesLength - 1;
        } else {
            str += String.fromCharCode(_arr[i]);
        }
    }
    return str;
};
var ws = require("ws");
json={
    type:1,
    userInfo:{
        uid:"3",
        name:"hahah",
        age:10
    }

}
bytes=stringToByte(JSON.stringify(json));
// url ws://127.0.0.1:6080
// 创建了一个客户端的socket,然后让这个客户端去连接服务器的socket
var sock = new ws("ws://127.0.0.1:3450");
sock.on("open", function () {
    console.log("connect success !!!!");
    sock.send(bytes);
});

sock.on("error", function(err) {
    console.log("error: ", err);
});

sock.on("close", function() {
    console.log("close");
});

sock.on("message", function(data) {
    data=JSON.parse(data);
    console.log(data);
    var socket_1=new ws(`ws://127.0.0.1:${data.port}`);
    let json_data={
        tag:"linkSuccess",
        serverId:data.id,
        userInfo:{
            "name":"吴世超"
        }
    };

    let bytes_1=stringToByte(JSON.stringify(json_data));
    socket_1.on("open", function () {
        console.log("connect connector success");
        socket_1.send(bytes_1)
    })
    socket_1.on("message", function (data) {
        console.log(data);
        console.log(JSON.parse(decodeBuffer(data)));
    })
});