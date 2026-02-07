import { WebSocketServer , WebSocket } from "ws";
import { genrateRoomCode } from "./utils/genrateroom";

const wss = new WebSocketServer({
  port: 8080,
});


type Peer = {
  id: string;           
  ws: WebSocket;         
};


type Room = {
  id: string;            
  peers: Map<string, Peer>;
  createdAt: number;
};


const rooms = new Map<string, Room>();
const socketMeta = new Map<WebSocket, { roomId: string; peerId: string }>();



wss.on("connection", function connection(ws) {

  ws.on("error", console.error);


  ws.on("message", function message(data) {
    console.log("Server received raw message length:", data.toString().length);
    let msg : any
    try {
        msg = JSON.parse(data.toString());
    } catch (error : any) {
        console.error("Something happened while parsing" , error.message);
        return;
    }

    const {type} = msg;

console.log(`Server processing message type: ${type} from ${msg.peerId || msg.from}`); 

    if (msg.roomId) {
        msg.roomId = String(msg.roomId);
    }

    if(type === "join-room"){
        let {roomId , peerId} = msg;
        
        if(!roomId) roomId = genrateRoomCode();
        if(!rooms.has(roomId)){
            rooms.set(
                roomId , {
                    id : peerId,
                    peers: new Map(),
                    createdAt : Date.now()

                }
            )
        }

        const room = rooms.get(roomId);
        room?.peers.set(peerId , {id:peerId , ws});
        socketMeta.set(ws , {
            roomId , peerId
        });
        console.log(`${peerId} joined room ${roomId}`)

        for(const [id , peer] of room?.peers ){
            if(id != peerId){
                peer.ws.send(
                    JSON.stringify(
                        {
                            type : "peer-joined",
                            peerId, 
                            roomId
                        }
                    )
                );
            }
        }
        // sending notification for joined room
        ws.send(
            JSON.stringify(
                {
                    type : "joined-room",
                    roomId
                }
            )
        )
        return;
    }

    if(type === "offer" || type === "answer" || type === "ice"){
        const{roomId , from} = msg;
        const room = rooms.get(roomId);
        if(!room) return;
        for(const[peerId , peer] of room.peers){
            if(peerId !== from){
                peer.ws.send(JSON.stringify(msg));
            }
        }
        return;
    }

    if(type === "leave"){
        cleanup(ws);
    }

    });

  ws.on("close", () => {
    cleanup(ws);
    });


});

function cleanup(ws : WebSocket){
    const meta = socketMeta.get(ws);
    if(!meta) return;
    const { roomId , peerId} = meta;
    const room = rooms.get(roomId);
    if(!room) return;
    room.peers.delete(peerId);
    socketMeta.delete(ws);
    for( const peer of room.peers.values()){
        peer.ws.send(JSON.stringify({
            type : "peer-left",
            peerId
        }))
    }
    if(room.peers.size === 0 ){
        rooms.delete(roomId);
    }
}
