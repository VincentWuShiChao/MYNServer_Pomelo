/**
 * Created by Administrator on 2018/8/28.
 */
module.exports.dispatch = function(uid, connectors) {//分派服务器
    var index = Number(uid) % connectors.length;
    var count=1;
    while(connectors[index].count>2000){
        logger.warn(`${connectors[index].id}端口为${connectors[index].port}的服务器已经爆满`);
        count++;
        if(count>connectors.length){
            logger.warn(`游戏服务器已经爆满`);
            return null;
            break;
        }
        uid=Number(uid)+1;
        logger.debug("uid");
        index=uid % connectors.length;

    }
    return connectors[index];
};