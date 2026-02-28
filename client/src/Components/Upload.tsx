import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp, Lock, Loader2 } from 'lucide-react';
import { initUpload, putToPresignedUrl, completeUpload } from '../services/api';
import { useAppState } from '../state/AppStateContext';

export default function Upload() {
  const navigate = useNavigate();
  const { ownerAuth, setLastUpload } = useAppState();
  const [isHovering, setIsHovering] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  
  const [ttlHours, setTtlHours] = useState<12 | 24 | 48>(12);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || isUploading || !ownerAuth) return;

    if (passwordEnabled && (!password || password.length < 6)) {
        setError('Password must be at least 6 characters');
        return;
    }

    setIsUploading(true);
    setError('');
    try {
      const initRes = await initUpload(ownerAuth, {
          fileName: file.name,
          sizeBytes: file.size,
          mimeType: file.type,
          ttlHours,
          passwordEnabled,
          password: passwordEnabled ? password : undefined
      });

      await putToPresignedUrl(initRes.uploadUrl, file, file.type);
      
      await completeUpload(ownerAuth, initRes.shortCode);

      setLastUpload({
        shortCode: initRes.shortCode,
        fileName: file.name,
        fileSize: file.size,
        expiry: `${ttlHours}hr`,
        createdAt: Date.now(),
      });

      navigate('/share');

    } catch (caughtError: any) {
      setError(caughtError.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      {/* Hidden Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={onFileSelect} 
      />

      <div 
        className={`
          w-full max-w-2xl h-64 border-2 border-slate-900 bg-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(30,41,59,1)]
          flex flex-col items-center justify-center p-8 mb-8 transition-all cursor-pointer relative overflow-hidden
          ${isHovering ? 'bg-blue-50 border-blue-500 border-dashed' : ''}
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
             <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
             <p className="font-bold text-slate-700">Uploading...</p>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center text-center">
            <div className="bg-slate-100 p-4 rounded-xl border-2 border-slate-300 mb-3">
              <FileUp size={36} className="text-slate-700" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1 max-w-[280px] truncate">{file.name}</h2>
            <p className="text-slate-500 font-semibold text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            <p className="text-blue-600 font-bold text-xs mt-3 bg-blue-50 px-3 py-1 rounded-full">Click to change file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center pointer-events-none">
            <FileUp size={48} className="text-slate-300 mb-4" />
            <h2 className="text-2xl font-black text-slate-800 mb-2">Drag or upload files</h2>
            <p className="text-slate-400 font-semibold text-sm">Max size: 200MB (5 active files max)</p>
          </div>
        )}
      </div>

      <div className="w-full max-w-[360px] flex flex-col gap-4">
        
        <div className="border-2 border-slate-900 rounded-xl p-2 bg-white shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] flex items-center justify-between">
           <span className="text-sm font-black text-slate-700 ml-2">Expire in:</span>
           <div className="flex gap-1">
             {[12, 24, 48].map(time => (
                <button 
                  key={time} 
                  onClick={() => setTtlHours(time as 12|24|48)} 
                  className={`px-3 py-1 text-sm font-bold rounded-lg transition-colors ${ttlHours === time ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    {time}h
                </button>
            ))}
           </div>
        </div>

        <div className="border-2 border-slate-900 rounded-xl p-3 bg-white shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-800">
            <input 
              type="checkbox" 
              checked={passwordEnabled} 
              onChange={(e) => setPasswordEnabled(e.target.checked)} 
              className="w-4 h-4 accent-slate-900"
            />
            <Lock size={16} /> Protect with Password
          </label>
          {passwordEnabled && (
            <input 
              type="password" 
              placeholder="Enter password (min 6 chars)" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-slate-300 rounded-lg p-2 font-bold text-sm focus:border-slate-900 focus:outline-none"
            />
          )}
        </div>

        <button 
          onClick={handleUpload}
          disabled={!file || isUploading || !ownerAuth}
          className={`
            w-full border-2 border-slate-900 rounded-xl py-3.5 font-black text-lg text-white transition-all
            ${!file || isUploading || !ownerAuth 
                ? 'bg-slate-400 border-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] active:translate-x-1 active:translate-y-1 active:shadow-none'}
          `}
        >
          {isUploading ? "Uploading..." : "Upload File"}
        </button>

        {error && (
          <div className="text-center font-bold text-sm text-red-600 bg-red-50 p-2 rounded-lg border-2 border-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}