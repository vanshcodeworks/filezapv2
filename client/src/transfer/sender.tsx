import { send, isChannelOpen, getDataChannel } from "../webrtc/datachannel";
import { encodeMeta } from "./metadata";

const CHUNK_SIZE = 16 * 1024;
const HIGH_WATER_MARK = 4 * 1024 * 1024; // 4MB

export async function sendFile(file: File) {
  if (!file || file.size === 0) {
    console.warn("Invalid file");
    return;
  }

  if (!isChannelOpen()) {
    console.warn("DataChannel not open");
    return;
  }

  // 1️⃣ Send metadata
  send(
    encodeMeta({
      type: "meta",
      name: file.name,
      size: file.size
    })
  );

  const channel = getDataChannel();
  if (!channel) return;

  let offset = 0;

  // 2️⃣ Send chunks with backpressure control
  while (offset < file.size) {
    if (channel.bufferedAmount > HIGH_WATER_MARK) {
      await waitForBufferDrain(channel);
    }

    const slice = file.slice(offset, offset + CHUNK_SIZE);
    const buffer = await slice.arrayBuffer();

    send(buffer);
    offset += buffer.byteLength;
  }

  console.log("File sent completely");
}

// 🔽 helper
function waitForBufferDrain(channel: RTCDataChannel): Promise<void> {
  return new Promise((resolve) => {
    channel.onbufferedamountlow = () => {
      channel.onbufferedamountlow = null;
      resolve();
    };
    channel.bufferedAmountLowThreshold = HIGH_WATER_MARK / 2;
  });
}