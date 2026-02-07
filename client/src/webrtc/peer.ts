// peer.ts
// --------------------------------------------------
// Owns RTCPeerConnection lifecycle.
// Handles SDP + ICE application.
// Does NOT know about WebSocket or files.
// --------------------------------------------------

import {
  sendIceCandidate,
  sendOffer,
  sendAnswer,
  onOfferReceived,
  onAnswerReceived,
  onIceCandidateReceived,
  onPeerJoined
} from "../signalling/signalling";


// =====================
// Internal state
// =====================
let isOfferer = false;

let pc: RTCPeerConnection | null = null;


// =====================
// Initialization
// =====================

export function createPeerConnection() {
  if (pc) return pc;

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  // Browser → ICE candidate discovered
  pc.onicecandidate = handleIceCandidate;

  // Connection lifecycle tracking
  pc.onconnectionstatechange = handleConnectionStateChange;
  pc.onsignalingstatechange = handleSignalingStateChange;

  // Subscribe to signaling events
  wireSignalingEvents();

  return pc;
}


// =====================
// ICE handling
// =====================

function handleIceCandidate(event: RTCPeerConnectionIceEvent) {
  if (event.candidate) {
    // Emit candidate to signaling layer
    sendIceCandidate(event.candidate);
  }
}


// =====================
// SDP handling
// =====================

export async function createAndSendOffer() {
  const pc = getPeerConnection();
  if (!pc) throw new Error("PeerConnection not created");
    if(isOfferer) return;
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // Send SDP via signaling
  sendOffer(offer);
}

export async function createAndSendAnswer() {
  if (!pc) throw new Error("PeerConnection not created");

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  // Send SDP via signaling
  sendAnswer(answer);
}

onPeerJoined(async () => {
    const pc = getPeerConnection();
  if (!pc) throw new Error("PeerConnection not created");

  if (isOfferer) return;
  isOfferer = true;
  
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  sendOffer(offer);
});



export async function applyRemoteDescription(
  sdp: RTCSessionDescriptionInit
) {
  if (!pc) throw new Error("PeerConnection not created");

  await pc.setRemoteDescription(sdp);
}


// =====================
// ICE candidate application
// =====================

export async function addIceCandidate(
  candidate: RTCIceCandidateInit
) {
  if (!pc) throw new Error("PeerConnection not created");

  try {
    await pc.addIceCandidate(candidate);
  } catch (err) {
    console.error("[peer] Failed to add ICE candidate", err);
  }
}


// =====================
// Signaling event wiring
// =====================

function wireSignalingEvents() {
  onOfferReceived(async ({ sdp }) => {
    if (!pc) return;

    await applyRemoteDescription(sdp);
    await createAndSendAnswer();
  });

  onAnswerReceived(async ({ sdp }) => {
    if (!pc) return;

    await applyRemoteDescription(sdp);
  });

  onIceCandidateReceived(async ({ candidate }) => {
    await addIceCandidate(candidate);
  });
}


// =====================
// State tracking
// =====================

function handleConnectionStateChange() {
  if (!pc) return;

  console.log("[peer] connection state:", pc.connectionState);

  switch (pc.connectionState) {
    case "connected":
      console.log("[peer] Peer connected");
      break;

    case "disconnected":
    case "failed":
      console.warn("[peer] Connection lost");
      break;

    case "closed":
      console.log("[peer] Connection closed");
      break;
  }
}

function handleSignalingStateChange() {
  if (!pc) return;

  console.log("[peer] signaling state:", pc.signalingState);
}


// =====================
// Accessors
// =====================

export function getPeerConnection(): RTCPeerConnection | null {
  return pc;
}


// =====================
// Cleanup
// =====================

export function closePeerConnection() {
  if (!pc) return;

  pc.close();
  pc = null;
}