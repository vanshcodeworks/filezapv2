import { onMessage } from "../webrtc/datachannel";
import { decodeMeta } from "./metadata";


let receiveBuffer: ArrayBuffer[] = [];

let receivedByte = 0;
let expectedSize = 0;
let fileName = "";

export function initReceiver(onComplete : (file : Blob , name : string) => void){
onMessage((data)=>{
    if (typeof(data) == "string"){
        const msg = JSON.parse(data);
        if(msg.type == "meta"){
            const meta = decodeMeta(data);
            fileName = meta.name;
            expectedSize = meta.size;
            receiveBuffer = [];
            receivedByte = 0;
        }
        if(msg.type == "done"){
            const blob = new Blob(receiveBuffer);
            onComplete(blob , fileName);
            cleanup();
        }
        return;

    }
    // decryption logic
    receiveBuffer.push(data);
    receivedByte+= data.byteLength;
    if (receivedByte >= expectedSize) {
  const blob = new Blob(receiveBuffer);
  onComplete(blob, fileName);
  cleanup();
}
});
}

function cleanup(){
    receiveBuffer = [];
    receivedByte = 0;
    expectedSize = 0;
    fileName = "";
}