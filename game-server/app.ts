///<reference path='./definitelyTyped/app.d.ts'/>
import _ = require("underscore");
import playerMd = require("./model/player");
import Player = playerMd.Player;
import rServerMd = require("./server/roomServer");
import RoomServer = rServerMd.RoomService;
import sServerMd = require("./server/sessionServer");
import SessionServer = sServerMd.SessionServer;

class App{

  /**
   * socket 端口
   */
  private socketport:number = 8888;

  public io = require('socket.io')(this.socketport);

  public start(){
    //初始化socket server
    try{
      this.initSocket();
    }catch(ex){
      console.log("启动服务器失败...");
      console.log(ex.stack);
    }
  }

  public initSocket(){

    console.log("正在启动 socket 服务器...监听 %d 端口",this.socketport);

    var io = this.io;

    io.on('connection', function(socket){

      console.log(socket.id + " 连接了服务器...");

      //获取当前所有房间
      socket.on('list room',function(){
        socket.emit('list room',{rooms:RoomServer.getAllRoomInfo()});
      });

      //join room 
      socket.on('join room', function() {
        console.log("收到 join room 协议...");
        var session = SessionServer.get(socket.id);
        socket.join(session.roomId);
        socket.emit('join roomed',{success:true});
        socket.broadcast.in(session.roomId).emit('chat message',"欢迎用户 "+session.uId+" 加入房间");
      });

      //发送消息
      socket.on('chat message', function(msg){
        var info = JSON.parse(msg);
        console.log('chat message',info);
        var session = SessionServer.get(socket.id)
        if(session.roomId){
          //发送到默认namespace下的特定room 
          io.sockets.in(session.roomId).emit('chat message',info.msg);
        }else{
          //发送到默认namespace下的默认room 
          io.emit('chat message',info.msg);  
        }
      });

      //进入房间
      socket.on('enter room', function(msg){
          var result = <enterRoomRes>{success:true};
          var info = <enterRoomMsg>JSON.parse(msg);
          console.log("收到玩家 %s 进入房间 %s 协议...",info.userId,info.rid);
          if(!(info.rid && info.userId)){
            result.success = false;
            result.msg = "param invalid";   
          }else{
            var room = RoomServer.getOrAddRoom(info.rid);
            if(room.checkUserIn(info.userId)){
              result.success = false;
              result.msg = "该玩家已经在房间内，请使用其他用户名";  
            }else{
              var player = new Player(info.userId,info.rid)
              room.addUser(player);
              //设置session
              SessionServer.set(socket.id,player);
              //返回房间所有人
              var players = room.getAllUser();
              var uids = [];
              for(var i=0;i<players.length;i++){
                  uids.push(players[i].uId);
              }
              result.users = uids;
              result.userId = info.userId;
              result.rid = info.rid;
            }
          }
          socket.emit('enter roomed',result);
      });


      socket.on('disconnect', function () {
        //如何广播到该socket所在的房间,并删除房间内的玩家数据
        console.log("socketId:"+socket.id); 
        var player = SessionServer.get(socket.id);
        console.log("断开连接 ",JSON.stringify(player));
        if(player){
          console.log("房间 %s 的玩家 %s 断开连接...",player.roomId,player.uId);
          var room = RoomServer.getRoom(player.roomId);
          if(room){
            room.deleteUser(player.uId);
            RoomServer.updateRoom(player.roomId);
            socket.broadcast.in(player.roomId).emit('chat message',"用户 "+player.uId+" 下线");
          }
        }
      });
    });
  }
}




/**进入房间协议 */
interface enterRoomMsg{
  userId:number;
  rid:number;  
}

interface enterRoomRes{
  /**进入房间结果 */
  success:boolean;
  msg:string;
  userId:number;
  rid:number;
  /**房间内所有玩家 */
  users:Array<string>;
}




//启动服务器
var app = new App();
app.start();






