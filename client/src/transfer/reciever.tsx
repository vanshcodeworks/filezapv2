import { onMessage } from "../webrtc/datachannel";
import { decodeMeta } from "./metadata";

let receiveBuffer: ArrayBuffer[] = [];
let receivedBytes = 0;
let expectedSize = 0;
let fileName = "";

export function initReceiver(
  onComplete: (file: Blob, name: string) => void
) {
  onMessage((data) => {
    // TEXT messages (metadata)
    if (typeof data === "string") {
      const meta = decodeMeta(data);

      if (meta.type === "meta") {
        fileName = meta.name;
        expectedSize = meta.size;
        receiveBuffer = [];
        receivedBytes = 0;
      }
      return;
    }

    // BINARY chunks
    receiveBuffer.push(data);
    receivedBytes += data.byteLength;

    if (receivedBytes === expectedSize) {
      const blob = new Blob(receiveBuffer);
      onComplete(blob, fileName);
      cleanup();
    }
  });
}

function cleanup() {
  receiveBuffer = [];
  receivedBytes = 0;
  expectedSize = 0;
  fileName = "";
}