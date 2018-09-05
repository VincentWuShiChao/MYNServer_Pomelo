/**
 * Created by Administrator on 2018/8/31.
 */
/**
 *
 * content 为数组json
 * serverId 为服务器id名，为数组json,主要包括UserInfo和MatchPool
 * UserInfo  为数组，存放多个用户的信息
 * MatchPool 为数组，存放多个带匹配玩家的信息
 * userData 为json，存放用户的信息
 * chatMsg 为json，存放聊天信息
 * matchMsg 为json,存放匹配信息，例如房间信息
 */

var content=[];//["serverId":["UserInfo":[{userData:{},chatMsg:{},matchMsg:{}}],"MatchPool":[{}]]]

class Content{

    constructor(){

    }
    getContent(){
        return content;
    }
}

module.exports=new Content();