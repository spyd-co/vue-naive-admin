export const spydLocalData = getSpydLocalData();

import { spydTool } from './spyd-tool';
import localforage from 'localforage/dist/localforage';

function getSpydLocalData() {

    async function readyIndexeddb(){
        await localforage.ready();
        if(!localforage.supports(localforage.INDEXEDDB)){
            console.error("indexeddb is required");
            return false;
        };
        return true;
    }

    return {
        set: async function (k, v) {
            localforage.setItem(k, spydTool.Base64.encode(JSON.stringify(v)));
        },        
        setStr: async function (k, v, encodeBase64) {
            let v_ = v;
            if(encodeBase64){
                v_=spydTool.Base64.encode(v);
            }

            localforage.setItem(k, v_);
        },
        get: async function (k) {            
            let v = await localforage.getItem(k);
            let v_ = undefined;
            if (typeof v === 'string' || v instanceof String) {
                try {
                    let decodedStr = spydTool.Base64.decode(v);
                    var o = JSON.parse(decodedStr);    
                    v_ = o;
                }
                catch (err) {
                    //console.error(err);
                    v_ = v;
                }
            }
            else if (v) { v_ = v; }
            else { v_ = ""; }
            return v_;
        },
        getStr: async function (k, decodeBase64) {
            let v = await localforage.getItem(k);
            let v_ = undefined;
            if (typeof v === 'string' || v instanceof String) {
                if (decodeBase64) {
                    v_ = spydTool.Base64.decode(v);
                }
                else {
                    v_ = v.toString();
                }
            }
            else {
                if (v) { 
                    v_ = JSON.stringify(v); 
                } else { 
                    v_ = ""; 
                }
            }
            return v_;
        },
        getObj: async function(k){
            let v = await localforage.getItem(k);
            let v_ = undefined;
            if (typeof v === 'string' || v instanceof String) {
                let decodedStr = spydTool.Base64.decode(v);
                var o = JSON.parse(decodedStr);    
                v_ = o;
            }
            return v_;
        },
        getAry: async function (k) {
            let v = await localforage.getItem(k);
            let v_ = undefined;
            if (typeof v === 'string' || v instanceof String) {
                let decodedStr = spydTool.Base64.decode(v);
                var o = JSON.parse(decodedStr);    

                if (o instanceof Array) {                        
                    v_ = o;
                }
                else {
                    v_ = [o];
                }                    
            }

            return v_;
        },
        remove: async function (k) {
            await localforage.removeItem(k);
        },
        ready: async function(){
            return await readyIndexeddb();
        }
    };
}


// test code

//         let ver = await spydLocalData.ready();
//         console.log(ver);

//         await spydLocalData.setStr("k1", "vvv开始", true);
//         await spydLocalData.set("k_obj", {a:1}, false);
//         await spydLocalData.set("k_ary", [1,2,3,4,5], false);

//         let v = undefined;
//         v = await spydLocalData.get("k1");
//         console.log(v);        

//         v = await spydLocalData.getStr("k1");
//         console.log("getStr: [k1] = " + v);
        

//         v = await spydLocalData.getStr("k1", true);
//         console.log("getStr(decodeBase64:true): [k1] = " + v);
        

//         v = await spydLocalData.getStr("k_obj");
//         console.log("getStr(decodeBase64:false): [k_obj] = " + v);
        

//         v = await spydLocalData.getStr("k_obj", true);
//         console.log("getStr(decodeBase64:true): [k_obj] = " + v);
        
//         v = await spydLocalData.get("k_obj");
//         console.log("get: [k_obj] = " + JSON.stringify(v));
        
//         v = await spydLocalData.getObj("k_obj");
//         console.log("getObj: [k_obj] = " + JSON.stringify(v));        

//         v = await spydLocalData.getObj("k_no_exist");
//         console.log("getObj: [k_no_exist] = " + JSON.stringify(v));
        
        
//         v = await spydLocalData.get("k_ary");
//         console.log("get: [k_ary] = " + JSON.stringify(v));
        

//         v = await spydLocalData.getAry("k_ary");
//         console.log("getArt: [k_ary] = " + JSON.stringify(v));
        

//         v = await spydLocalData.getAry("k_no_exist");
//         console.log("getAry: [k_no_exist] = " + JSON.stringify(v));
        

//         v = await spydLocalData.get("k_no_exist");
//         console.log("get: [k_no_exist]" + v);
        
//         await spydLocalData.remove("k1");
//         console.log("[k1] removed");

//         await spydLocalData.remove("k_obj");
//         console.log("[k_obj] removed");

//         await spydLocalData.remove("k_ary");
//         console.log("[k_ary] removed");