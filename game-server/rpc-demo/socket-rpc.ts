var proxy = require("./Proxy");

/**
 * 简单版的socketRpc框架
 */
class SocketRpc{

    public wrapper;

    public port;

    constructor(wrapper){
        if(!wrapper){
            this.wrapper = {};
        }else if(wrapper instanceof Object){
            this.wrapper = wrapper;
        }                        
    }


    public listen(port:number):SocketRpc{
        if(!port){
            return;
        }
        this.port = port;
        this.initServer(port);
        console.log("rpc server listening port:"+port);
        return this;
    }


    private initServer(port:number){
        var self = this;
        var io = require('socket.io')(port);
        io.on('connection', function(socket){
            console.log("some connect...");

            socket.on('message', function (msg) {

            })

            socket.on('rpc', function (msg) {
                console.log("receive the remove process call:",msg);
                var data;
                if(msg && msg.method){
                    if(msg.method in self.wrapper){
                        var fun = self.wrapper[msg.method];
                        if(typeof fun  === "function"){
                            var arg = self.parseParam(msg.args);
                            var result = eval("fun("+arg+")");
                            data = {
                                success:true,
                                msg:undefined,
                                cbId:msg.callbackId,
                                args:""+result+""
                            }
                        }        
                    }else{
                        data = {
                            success:false,
                            msg:"has no method "+msg.method,
                        }
                    }    
                }else{
                    data = {
                        success:false,
                        msg:"invaild param..."
                    }
                }
                socket.emit("invoked",data);    
            })
            
            socket.on('disconnect', function () {
                console.log("some disconnect...");    
            })            
        })
    }


    /**
     * 添加handler处理函数
     */
    public addHandler(name,func){   
        this.wrapper[name] = func;
    }

    /**
     * 解析参数
     */
    private parseParam(args):string{
        var arg = []
        for(var key in args){
            arg.push(args[key]); 
        }
        return arg.toString();
    }


    private isRpcServer():boolean{
        return !!this.port;
    }


//--------------------------------------------------------------
//--------------------------------------------------------------
//--------------------------------------------------------------
//--------------------------------------------------------------
//--------------------------------------------------------------


    public static connect(host:string,port:number,cb){
        if(!host || !port){
            throw("invaild param...");
        }
        return this.initClient(host,port);        
    }

    private static initClient(host:string,port:number){

        var socket = require('socket.io-client')('http://'+host+":"+port);
        return new proxy(socket);
    }
}

module.exports = SocketRpc;