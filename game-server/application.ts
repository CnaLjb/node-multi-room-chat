import appUtilMd = require("./util/appUtil");
var appUtil = appUtilMd.appUtil;
import ctsMd = require("./common/constants");
var Constants = ctsMd.Constants;
import masterMd = require("./master/master");
var Master = masterMd.Master;
/**
 * Application 类是server的抽象
 */
export class Application{

    

    public loaded = [];       // loaded component list
    public components = {};   // name -> component map

    // current server info
    public serverId = null;   // current server id
    public serverType = null; // current server type
    public startTime = null; // current server start time

    // global server infos
    public master = null;         // master server info
    public servers = {};          // current global server info maps, id -> info
    public serverTypeMaps = {};   // current global type maps, type -> [info]


    constructor(){
                
    }   

    /**
     * init Application
     */
    public init(){
        appUtil.defaultConfiguration(this);
    }


    public getMaster():any{
        return this.master;
    }

    public set(key,value){
        this[key] = value;
    }


    /**
     * start Application
     */
    public start(){
        this.startTime = Date.now();
        appUtil.loadComponents(this);
        appUtil.startUpComponents(this);
    }

    
    public load = function(name:string){
        if(name === Constants.RESERVED.MASTER){
            var cmp = new Master(this);
            this.loaded.push(cmp);
            this.components[name] = cmp;
        }else if(name){

        }
    }
}