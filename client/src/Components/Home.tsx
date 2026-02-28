import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon } from 'lucide-react';
import { useAppState } from '../state/AppStateContext';
import type { ShareDuration } from '../types/file';
import { connectSignaling, joinRoom } from '../signalling/signalling';
import { generateRoomCode } from '../utils/id';
import { createPeerConnection } from '../webrtc/peer';
import {
  createDataChannel,
  listenForDataChannel,
  onDataChannelOpen,
} from '../webrtc/datachannel';
import { initReceiver } from '../transfer/reciever';
import { sendFile } from '../transfer/sender';

const SIGNALING_URL =
  import.meta.env.VITE_SIGNALING_URL ?? 'wss://filezapv2-production.up.railway.app/';
const ROOM_CODE_KEY = 'filezap:p2p-room-code';

export default function Home() {
  const navigate = useNavigate();
  const {
    username,
    isUserReady,
    shareDuration,
    setShareDuration,
    setUsernameAndPersist,
  } = useAppState();
  const [nameInput, setNameInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [peersFound, setPeersFound] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [p2pMessage, setP2pMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    connectSignaling(SIGNALING_URL);
    const savedRoomCode = localStorage.getItem(ROOM_CODE_KEY) ?? '';
    setRoomCode(savedRoomCode);
  }, []);

  useEffect(() => {
    initReceiver((blob, name) => {
      setDownloadUrl((oldUrl) => {
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl);
        }
        return URL.createObjectURL(blob);
      });
      setDownloadName(name);
    });

    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  useEffect(() => {
    onDataChannelOpen(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setPeersFound(true);
      setP2pMessage('P2P connected. You can send files now.');
    });
  }, []);

  useEffect(() => {
    setNameInput(username);
  }, [username]);

  useEffect(() => {
    const normalizedRoomCode = roomCode.trim();
    if (!normalizedRoomCode) {
      localStorage.removeItem(ROOM_CODE_KEY);
      return;
    }

    localStorage.setItem(ROOM_CODE_KEY, normalizedRoomCode);
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode || !isUserReady) {
      return;
    }
    void connectToRoom(roomCode, false, true);
  }, [isUserReady]);

  const connectToRoom = async (
    nextRoomCode: string,
    shouldCreateChannel: boolean,
    isAutoReconnect = false,
  ) => {
    const normalizedName = nameInput.trim();
    const normalizedRoomCode = nextRoomCode.trim();

    if (!normalizedName || !normalizedRoomCode) {
      return;
    }

    await setUsernameAndPersist(normalizedName);

    setIsConnecting(true);
    setIsConnected(false);
    setP2pMessage(
      isAutoReconnect
        ? `Reconnecting to room ${normalizedRoomCode}...`
        : `Connecting to room ${normalizedRoomCode}...`,
    );

    createPeerConnection();
    listenForDataChannel();
    if (shouldCreateChannel) {
      createDataChannel();
    }

    joinRoom(normalizedRoomCode);
    setRoomCode(normalizedRoomCode);
    localStorage.setItem(ROOM_CODE_KEY, normalizedRoomCode);
  };

  const handleConnect = async () => {
    const normalizedName = nameInput.trim();
    if (!normalizedName || isConnecting) return;

    if (roomCode.trim()) {
      await connectToRoom(roomCode, false);
      return;
    }

    const generatedRoomCode = generateRoomCode();
    await connectToRoom(generatedRoomCode, true);
  };

  const handleCreateRoom = async () => {
    if (isConnecting) return;
    const generatedRoomCode = generateRoomCode();
    await connectToRoom(generatedRoomCode, true);
  };

  const handleJoinRoom = async () => {
    if (isConnecting || !roomCode.trim()) return;
    await connectToRoom(roomCode, false);
  };

  const clearSavedRoom = () => {
    localStorage.removeItem(ROOM_CODE_KEY);
    setRoomCode('');
    setP2pMessage('Saved room cleared. Create or join again.');
    setIsConnected(false);
    setPeersFound(false);
  };

  const handleSendP2PFile = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !isConnected || isSending) return;

    setIsSending(true);
    setP2pMessage(`Sending ${file.name}...`);
    try {
      await sendFile(file);
      setP2pMessage(`${file.name} sent successfully.`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center w-full min-h-[75vh] gap-12 lg:gap-24 animate-fade-in px-4 pb-12 overflow-x-hidden">

      <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left z-10 w-full mt-8 lg:mt-0">
        <div className="flex items-center gap-3 mb-6 bg-slate-100 px-4 py-2 border-2 border-slate-900 rounded-full shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
          <span className="text-xs font-black tracking-widest text-slate-700 uppercase">
            {isConnected ? 'P2P Connected' : 'Waiting for connection'}
          </span>
        </div>
        
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black leading-[1.05] text-slate-900 tracking-tighter uppercase drop-shadow-sm">
          One Stop<br />Solution
        </h1>
        <div className="mt-6 md:mt-8">
          <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl block font-black text-slate-900 bg-orange-400 px-6 py-3 border-[3px] border-slate-900 shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] uppercase tracking-wide transform -rotate-1 hover:rotate-0 transition-transform cursor-default">
            For Fast Anon Sharing
          </span>
        </div>
        <p className="mt-8 text-slate-600 font-bold max-w-md text-sm md:text-base leading-relaxed">
          Share files securely over peer-to-peer or upload them to our cloud for timed access. No registration required. Always lightning fast.
        </p>
      </div>

      <div className="lg:w-1/2 flex flex-col items-center justify-center w-full z-20">
        <div className="flex flex-col gap-5 w-full max-w-md items-center">
          <div className="w-full relative group">
            <label className="absolute -top-3 left-4 bg-[#f8fafc] px-2 text-xs font-black text-slate-500 tracking-wider">YOUR NAME</label>
            <input 
              type="text" 
              placeholder="e.g. Maverick" 
              className="w-full bg-white border-2 border-slate-900 px-4 py-4 text-center font-bold text-xl placeholder:text-slate-300 outline-none focus:border-orange-500 transition-colors shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={() => {
                const normalizedName = nameInput.trim();
                if (normalizedName) {
                  void setUsernameAndPersist(normalizedName);
                }
              }}
            />
          </div>

          <button 
            onClick={handleConnect}
            disabled={!isUserReady || !nameInput.trim() || isConnecting}
            className={`
              w-full border-2 border-slate-900 py-4 
              text-lg font-black tracking-widest shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]
              active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all uppercase
              ${isConnecting ? 'bg-slate-100 text-slate-500' : isConnected ? 'bg-green-400 text-slate-900 border-slate-900 shadow-[4px_4px_0px_0px_green]' : 'bg-orange-400 text-slate-900 hover:bg-orange-300'}
            `}
          >
            {isConnecting ? "CONNECTING..." : isConnected ? "CONNECTED" : "QUICK CONNECT"}
          </button>

          <div className="w-full border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] flex flex-col gap-4 relative mt-2">
            <span className="absolute -top-3 left-4 bg-white px-2 text-xs font-black text-slate-500 tracking-wider">ROOM (P2P)</span>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: XYZ123"
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                className="w-2/3 border-2 border-slate-200 focus:border-slate-900 px-3 py-3 text-center font-black tracking-[0.2em] outline-none text-slate-700 bg-slate-50"
              />
              <button
                onClick={handleJoinRoom}
                className="w-1/3 border-2 border-slate-900 bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!roomCode.trim() || isConnecting || isConnected}
              >
                JOIN
              </button>
            </div>

            <div className="flex items-center justify-between mt-1">
              <button
                onClick={handleCreateRoom}
                className="text-sm font-bold text-orange-600 hover:text-orange-700 underline decoration-2 underline-offset-4"
                disabled={isConnecting || isConnected}
              >
                Create new room
              </button>
              {roomCode && (
                <button
                  onClick={clearSavedRoom}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                  type="button"
                >
                  Clear history
                </button>
              )}
            </div>

            {p2pMessage && (
              <div className="mt-2 p-3 bg-slate-50 border-l-4 border-slate-900 text-xs font-bold text-slate-700">
                {p2pMessage}
              </div>
            )}
            
            {isConnected && (
              <div className="mt-2 flex flex-col gap-3 pt-4 border-t-2 border-slate-100">
                <input ref={fileInputRef} type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer" />
                <button
                  onClick={handleSendP2PFile}
                  disabled={isSending}
                  className="w-full bg-orange-400 border-2 border-slate-900 py-3 text-sm font-black shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:bg-orange-300 disabled:opacity-50 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all uppercase tracking-widest"
                >
                  {isSending ? 'SENDING...' : 'SEND DIRECTLY'}
                </button>
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download={downloadName}
                    className="w-full text-center bg-green-100 border-2 border-green-600 py-3 text-green-700 font-black text-sm uppercase tracking-widest hover:bg-green-200 transition-colors"
                  >
                    DOWNLOAD {downloadName}
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="w-full flex items-center my-4">
            <div className="flex-1 h-[2px] bg-slate-200"></div>
            <span className="px-4 font-black text-slate-400 text-sm tracking-widest">OR CLOUD HOST</span>
            <div className="flex-1 h-[2px] bg-slate-200"></div>
          </div>

          <div className="w-full border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] flex flex-col gap-4 relative">
             <span className="absolute -top-3 left-4 bg-white px-2 text-xs font-black text-slate-500 tracking-wider">CLOUD OPTIONS</span>
             
             <div className="flex justify-between items-center bg-slate-50 p-2 border-2 border-slate-200">
              <span className="text-slate-600 font-bold text-sm ml-2">Expire after:</span>
              <div className="flex gap-1">
                {['12hr', '24hr', '48hr'].map(time => (
                  <button 
                    key={time} 
                    onClick={() => setShareDuration(time as ShareDuration)} 
                    className={`px-3 py-1 text-sm font-black transition-colors ${shareDuration === time ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/upload')}
              className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white border-2 border-slate-900 py-4 font-black text-lg shadow-[4px_4px_0px_0px_rgba(251,146,60,1)] hover:bg-slate-800 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all uppercase tracking-widest"
            >
              <UploadIcon size={20} strokeWidth={3} />
              UPLOAD TO CLOUD
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}