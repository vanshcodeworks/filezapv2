// dataChannel.ts
// --------------------------------------------------
// DataChannel manager
// Owns RTCDataChannel lifecycle
// --------------------------------------------------

import { getPeerConnection } from "./peer";

// =====================
// Internal state
// =====================

let dataChannel: RTCDataChannel | null  = null;
let onConnectedCallback: (() => void) | null = null;


type MessageHandler = (data: ArrayBuffer | string) => void;
let messageHandler: MessageHandler | null = null;


// =====================
// Creator side
// =====================

export function createDataChannel(label = "file") {
  const pc = getPeerConnection();
  if (!pc) throw new Error("PeerConnection not initialized");

  dataChannel = pc.createDataChannel(label);
  
  bindChannelEvents(dataChannel);

  return dataChannel;
}


// =====================
// Receiver side
// =====================

export function listenForDataChannel() {
  const pc = getPeerConnection();
  if (!pc) throw new Error("PeerConnection not initialized");

  pc.ondatachannel = (event) => {
    dataChannel = event.channel;
    bindChannelEvents(dataChannel);
  };
}


// =====================
// Channel events
// =====================

function bindChannelEvents(dc: RTCDataChannel) {
  dc.binaryType = "arraybuffer";

  dc.onopen = () => {
    console.log("[datachannel] open");
    onConnectedCallback?.();
  };

  dc.onclose = () => {
    console.log("[datachannel] closed");
  };

  dc.onerror = (err) => {
    console.error("[datachannel] error", err);
  };

  dc.onmessage = (event) => {
    messageHandler?.(event.data);
  };
}


// =====================
// Public API
// =====================

export function send(data: ArrayBuffer | string) {
  if (!dataChannel || dataChannel.readyState !== "open") {
    throw new Error("DataChannel not open");
  }
  dataChannel.send(data);
}

export function onMessage(handler: MessageHandler) {
  messageHandler = handler;
}

export function isChannelOpen(): boolean {
  return dataChannel?.readyState === "open";
}
export function onDataChannelOpen(cb: () => void) {
  onConnectedCallback = cb;
}


// =====================
// Cleanup
// =====================

export function closeDataChannel() {
  if (dataChannel) {
    dataChannel.close();
    dataChannel = null;
  }
}
