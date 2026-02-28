import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Download as DownloadIcon, Loader2, Search } from 'lucide-react';
import { getDownloadMeta, unlockDownload } from '../services/api';

export default function Download() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const urlCode = searchParams.get('c') || '';
  
  const [code, setCode] = useState(urlCode);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileMeta, setFileMeta] = useState<any>(null);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (urlCode) {
        handleFindFile(urlCode);
    }
  }, [urlCode]);

  const fmtBytes = (bytes: number) => {
    if (!Number.isFinite(bytes)) return "—";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0; let v = bytes;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
  };

  const handleFindFile = async (codeToFind: string) => {
    if (!codeToFind) return;
    setLoading(true);
    setError('');
    setDownloadUrl('');
    setFileMeta(null);
    setPassword('');

    try {
      const data = await getDownloadMeta(codeToFind);
      setFileMeta(data);
      if (!data.requiresPassword) {
        setDownloadUrl(data.downloadUrl);
      }
    } catch (caughtError: any) {
      setError(caughtError.message || 'Error retrieving file.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!password) return;
    setLoading(true);
    setError('');
    
    try {
      const data = await unlockDownload(fileMeta.shortCode, password);
      setDownloadUrl(data.downloadUrl);
      setFileMeta((prev: any) => ({ ...prev, requiresPassword: false }));
    } catch (err: any) {
      setError(err.message || 'Invalid password');
    } finally {
      setLoading(false);
    }
  };

  const manualSubmit = () => {
      if (!code) return;
      setSearchParams({ c: code }); 
      handleFindFile(code);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-2xl mb-8">
        <h1 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">Download in seconds with a short code</h1>
        <p className="text-slate-500 text-sm md:text-base leading-relaxed">
          Paste the FileZap code to fetch the file. Links can expire in <b>12/24/48 hours</b>.
          Owners can delete anytime. No login required.
        </p>
      </div>

      <div className="w-full max-w-[560px] flex gap-3 items-center justify-center mb-6">
        <input 
            type="text" 
            placeholder="Enter Short Code" 
            className="flex-1 border-2 border-slate-900 rounded-lg p-3 text-slate-900 font-bold tracking-wider shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 placeholder:font-semibold"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') manualSubmit(); }}
            maxLength={32}
        />
        <button 
            onClick={manualSubmit}
            disabled={loading}
            className="w-12 h-12 flex items-center justify-center bg-white text-slate-900 border-2 border-slate-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] hover:bg-slate-50 transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
        </button>
      </div>

      {error && <div className="text-red-600 font-bold mb-4 bg-red-50 p-3 rounded-lg border-2 border-red-200">{error}</div>}

      <article className="w-full max-w-[520px] border-2 border-slate-900 rounded-2xl bg-white shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] overflow-hidden">
        <div className="bg-slate-50 border-b-2 border-slate-900 p-4 flex items-center justify-between">
          <span className="text-xs font-black border-2 border-slate-900 rounded-full px-3 py-1 flex items-center gap-2 bg-white">
            <span className={`w-2 h-2 rounded-full border border-slate-900 ${fileMeta ? (fileMeta.requiresPassword ? 'bg-amber-500' : 'bg-green-500') : 'bg-slate-300'}`}></span>
            {fileMeta ? (fileMeta.requiresPassword ? 'Password required' : 'Ready') : 'No file selected'}
          </span>
          <span className="text-xs font-black border-2 border-slate-900 rounded-full px-3 py-1 bg-white">
            No-login ownership
          </span>
        </div>

        <div className="p-4 md:p-6 flex flex-col gap-4">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center min-h-[180px] bg-white text-center text-slate-400">
            <FileText size={44} className={fileMeta ? "text-blue-500 opacity-80" : "text-slate-300"} />
            <strong className={`block mt-3 text-sm ${fileMeta ? 'text-slate-700' : 'text-slate-400'}`}>
              {fileMeta ? fileMeta.fileName : 'No File Selected'}
            </strong>
            <div className="text-xs mt-1">
              {fileMeta ? 'Click Download when available' : 'Enter a code above'}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="font-black text-slate-900 truncate">
              {fileMeta ? fileMeta.fileName : '—'}
            </div>
            <div className="text-slate-500 text-sm flex gap-3 flex-wrap">
              <span>Size: {fileMeta ? fmtBytes(fileMeta.sizeBytes) : '—'}</span>
              <span>Expires: {fileMeta ? new Date(fileMeta.expiresAt).toLocaleString() : '—'}</span>
              <span>Password: {fileMeta?.requiresPassword ? 'Required' : 'No'}</span>
            </div>
          </div>

          {fileMeta?.requiresPassword && (
            <div className="border-2 border-slate-900 rounded-xl p-4 bg-white shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]">
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Enter password"
                  className="flex-1 border-2 border-slate-900 rounded-lg p-2 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock(); }}
                />
                <button
                  onClick={handleUnlock}
                  disabled={loading || !password}
                  className="bg-blue-600 text-white px-4 font-bold border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:bg-blue-700 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
                >
                  Unlock
                </button>
              </div>
              <p className="mt-2 text-slate-500 text-xs font-semibold">This file is password-protected. Unlock to get a download link.</p>
            </div>
          )}

          <div className="pt-2">
            <a 
              href={downloadUrl || '#'}
              className={`
                w-full border-2 border-slate-900 rounded-xl py-3.5 font-bold text-base md:text-lg 
                flex items-center justify-center gap-2 transition-all
                ${!downloadUrl 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed hover:bg-slate-100 opacity-70' 
                    : 'bg-slate-900 text-white shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none pointer-events-auto'}
              `}
              onClick={(e) => { if(!downloadUrl) e.preventDefault(); }}
            >
              <DownloadIcon size={20} className={downloadUrl ? "animate-bounce" : ""} /> Download
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}