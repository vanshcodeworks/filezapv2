import { useRef, useState, useEffect } from "react";

import { connectSignaling, joinRoom } from "./signalling/signalling";
import { generateRoomCode } from "./utils/id";

import { createPeerConnection } from "./webrtc/peer";
import {
  createDataChannel,
  listenForDataChannel,
  onDataChannelOpen
} from "./webrtc/datachannel";

import { sendFile } from "./transfer/sender";
import { initReceiver } from "./transfer/reciever";

import "./index.css";

function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [roomId, setRoomId] = useState("");
  const [connected, setConnected] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("");

  useEffect(() => {
    connectSignaling("wss://filezapv2-production.up.railway.app/");
  }, []);

  useEffect(() => {
    initReceiver((blob, name) => {
      setDownloadUrl(URL.createObjectURL(blob));
      setDownloadName(name);
    });
  }, []);

  useEffect(() => {
    onDataChannelOpen(() => setConnected(true));
  }, []);

  async function createRoom() {
    const id = generateRoomCode();
    setRoomId(id);

    joinRoom(id);
    createPeerConnection();
    createDataChannel();
    listenForDataChannel();
  }

  async function joinExistingRoom() {
    if (!roomId) return;

    joinRoom(roomId);
    createPeerConnection();
    listenForDataChannel();
  }

  async function handleSendFile() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    await sendFile(file);
  }

  return (
    <div className="app">
      <div className="card">
        <h1>⚡ FileZap</h1>
        <p className="subtitle">Fast • Secure • P2P File Sharing</p>

        <button className="primary" onClick={createRoom}>
          Create Room
        </button>

        {roomId && (
          <div className="room-box">
            Room Code
            <span>{roomId}</span>
          </div>
        )}

        <div className="divider" />

        <input
          className="input"
          placeholder="Enter room code"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <button className="secondary" onClick={joinExistingRoom}>
          Join Room
        </button>

        {connected && (
          <>
            <div className="status connected">● Connected</div>

            <input type="file" ref={fileInputRef} />
            <button className="primary" onClick={handleSendFile}>
              Send File
            </button>
          </>
        )}

        {downloadUrl && (
          <a className="download" href={downloadUrl} download={downloadName}>
            ⬇ Download {downloadName}
          </a>
        )}
      </div>
    </div>
  );
}

export default App;
