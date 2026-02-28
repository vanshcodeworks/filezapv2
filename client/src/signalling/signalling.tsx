// signaling.ts
// --------------------------------------------------
// Signaling layer
// Responsibility:
// - Own WebSocket connection
// - Exchange SDP + ICE only
// - Emit high-level events for other layers
// --------------------------------------------------

type OfferHandler = (payload: {
  roomId: string;
  from: string;
  sdp: RTCSessionDescriptionInit;
}) => void;

type AnswerHandler = (payload: {
  roomId: string;
  from: string;
  sdp: RTCSessionDescriptionInit;
}) => void;

type IceHandler = (payload: {
  roomId: string;
  from: string;
  candidate: RTCIceCandidateInit;
}) => void;

type PeerJoinedHandler = (payload: {
  roomId: string;
  peerId: string;
}) => void;




// =====================
// Internal state
// =====================

let ws: WebSocket | null = null;
let currentRoomId: string | null = null;
let pendingRoomId: string | null = null;
let peerId: string = crypto.randomUUID();

// Event listeners (subscribers)
let offerHandler: OfferHandler | null = null;
let answerHandler: AnswerHandler | null = null;
let iceHandler: IceHandler | null = null;
let peerJoinedHandler: PeerJoinedHandler | null = null;



// =====================
// Connection lifecycle
// =====================

export function connectSignaling(url: string) {
  if (ws) return;

  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log("[signaling] WebSocket connected");
    flushPendingRoomJoin();
  };

  ws.onclose = () => {
    console.warn("[signaling] WebSocket closed");
    ws = null;
  };

  ws.onerror = (err) => {
    console.error("[signaling] WebSocket error", err);
  };

  ws.onmessage = handleMessage;
}


// =====================
// Room handling
// =====================

export function joinRoom(roomId: string) {
  currentRoomId = roomId;
  pendingRoomId = roomId;

  flushPendingRoomJoin();
}


// =====================
// Outgoing messages
// =====================

export function sendOffer(sdp: RTCSessionDescriptionInit) {
  if (!ws || ws.readyState !== WebSocket.OPEN || !currentRoomId) return;

  ws.send(JSON.stringify({
    type: "offer",
    roomId: currentRoomId,
    from: peerId,
    sdp
  }));
}

export function sendAnswer(sdp: RTCSessionDescriptionInit) {
  if (!ws || ws.readyState !== WebSocket.OPEN || !currentRoomId) return;

  ws.send(JSON.stringify({
    type: "answer",
    roomId: currentRoomId,
    from: peerId,
    sdp
  }));
}

export function sendIceCandidate(candidate: RTCIceCandidateInit) {
  if (!ws || ws.readyState !== WebSocket.OPEN || !currentRoomId) return;

  ws.send(JSON.stringify({
    type: "ice",
    roomId: currentRoomId,
    from: peerId,
    candidate
  }));
}


// =====================
// Incoming message router
// =====================

function handleMessage(event: MessageEvent) {
  const msg = JSON.parse(event.data);

  switch (msg.type) {
    case "offer":
      offerHandler?.({
        roomId: msg.roomId,
        from: msg.from,
        sdp: msg.sdp
      });
      break;

    case "answer":
      answerHandler?.({
        roomId: msg.roomId,
        from: msg.from,
        sdp: msg.sdp
      });
      break;

    case "ice":
      iceHandler?.({
        roomId: msg.roomId,
        from: msg.from,
        candidate: msg.candidate
      });
      break;
      case "peer-joined":
        peerJoinedHandler?.({
            roomId : msg.roomId,
            peerId : msg.peerId,
        })
        break;

    default:
      console.warn("[signaling] Unknown message type", msg.type);
  }
}


// =====================
// Event subscriptions
// =====================

// Peer layer will register these callbacks

export function onOfferReceived(handler: OfferHandler) {
  offerHandler = handler;
}

export function onAnswerReceived(handler: AnswerHandler) {
  answerHandler = handler;
}

export function onIceCandidateReceived(handler: IceHandler) {
  iceHandler = handler;
}

export function onPeerJoined(handler: PeerJoinedHandler) {
  peerJoinedHandler = handler;
}


// =====================
// Cleanup
// =====================

export function closeSignaling() {
  if (ws) {
    ws.close();
    ws = null;
  }
  currentRoomId = null;
  pendingRoomId = null;
}

function flushPendingRoomJoin() {
  if (!ws || ws.readyState !== WebSocket.OPEN || !pendingRoomId) {
    return;
  }

  ws.send(
    JSON.stringify({
      type: "join-room",
      roomId: pendingRoomId,
      peerId,
    }),
  );

  pendingRoomId = null;
}
