// ice.ts
// --------------------------------------------
// ICE candidate queue & application
// --------------------------------------------

let iceQueue: RTCIceCandidateInit[] = [];

/**
 * Adds ICE candidate immediately if possible,
 * otherwise queues it until remote description is set.
 */
export async function handleRemoteIceCandidate(
  pc: RTCPeerConnection,
  candidate: RTCIceCandidateInit
) {
  if (pc.remoteDescription) {
    await pc.addIceCandidate(candidate);
  } else {
    iceQueue.push(candidate);
  }
}

/**
 * Flush queued ICE candidates once SDP is applied
 */
export async function flushIceQueue(pc: RTCPeerConnection) {
  while (iceQueue.length > 0) {
    const candidate = iceQueue.shift();
    if (candidate) {
      await pc.addIceCandidate(candidate);
    }
  }
}

/**
 * Clears all queued ICE candidates (on cleanup)
 */
export function clearIceQueue() {
  iceQueue = [];
}
