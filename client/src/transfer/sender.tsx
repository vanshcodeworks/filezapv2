import { send , isChannelOpen } from "../webrtc/datachannel";
import { encodeMeta } from "./metadata";

const CHUNK_SIZE = 16*1024;

export async function sendFile(file : File){
    if(!file) console.log("select valid file");
    if(file.size == 0) console.log("File having no size");
    if(!isChannelOpen()){
        console.warn("Data Channel not opened");
        return;
    }

    send(
        encodeMeta({
            type : "meta",
            name : file.name,
            size : file.size
        })
    );

    let offset = 0;
    while(offset < file.size){
        const slice = file.slice(offset , offset + CHUNK_SIZE);
        const buffer = await slice.arrayBuffer();
        // encryption
        send(buffer);
        offset += buffer.byteLength;
    }

    send(JSON.stringify({type : "done"}));
}