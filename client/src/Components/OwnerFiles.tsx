import { useState, useEffect } from 'react';
import { useAppState } from '../state/AppStateContext';
import { listFiles, deleteFile } from '../services/api';
import { Trash2, Link as LinkIcon, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OwnerFiles() {
  const { ownerAuth } = useAppState();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchFiles = async () => {
    if (!ownerAuth) return;
    setLoading(true);
    setError('');
    try {
      const data = await listFiles(ownerAuth);
      setFiles(data.files || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch your files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ownerAuth) {
      fetchFiles();
    }
  }, [ownerAuth]);

  const handleDelete = async (shortCode: string) => {
    if (!ownerAuth || !window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await deleteFile(ownerAuth, shortCode);
      setFiles(prev => prev.filter(f => f.shortCode !== shortCode));
    } catch (err: any) {
      alert(err.message || 'Failed to delete file');
    }
  };

  const copyLink = (shortCode: string) => {
    const link = `${window.location.origin}/download?c=${shortCode}`;
    void navigator.clipboard.writeText(link);
    alert('Link copied!');
  };

  if (!ownerAuth) return null;

  return (
    <div className="w-full max-w-3xl flex flex-col p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Cloud Files</h2>
        <button 
          onClick={fetchFiles} 
          disabled={loading}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>

      {error && <div className="text-red-500 font-bold mb-4">{error}</div>}

      {!loading && files.length === 0 && (
        <div className="text-center p-12 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
          <p className="text-slate-500 font-bold mb-4">No active cloud files.</p>
          <button 
            onClick={() => navigate('/upload')}
            className="bg-slate-900 text-white px-6 py-2 rounded-lg font-black text-sm hover:bg-slate-800 transition-colors"
          >
            Upload Now
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {files.map(f => (
          <div key={f.shortCode} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-2 border-slate-900 bg-white shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] rounded-xl gap-4">
            <div className="flex-1 w-full min-w-0 pr-2">
              <h3 className="font-black text-slate-900 truncate text-lg block w-full" title={f.fileName}>{f.fileName}</h3>
              <div className="flex gap-2 sm:gap-3 text-xs font-bold text-slate-500 mt-1 flex-wrap">
                <span className="whitespace-nowrap">{(f.sizeBytes / (1024*1024)).toFixed(2)} MB</span>
                <span className="text-orange-600 whitespace-nowrap">Expires: {new Date(f.expiresAt).toLocaleDateString()}</span>
                {f.passwordEnabled && <span className="text-amber-600 whitespace-nowrap">Password Protected</span>}
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
              <button 
                onClick={() => copyLink(f.shortCode)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border-2 border-slate-900 bg-slate-50 hover:bg-slate-100 font-bold text-sm rounded-lg transition-colors"
                title="Copy Link"
              >
                <LinkIcon size={16} /> <span className="sm:hidden">Copy Link</span>
              </button>
              <button 
                onClick={() => handleDelete(f.shortCode)}
                className="flex items-center justify-center p-2 border-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 font-bold rounded-lg transition-all"
                title="Delete File"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {!loading && files.length > 0 && (
         <div className="mt-8 text-center text-xs font-bold text-slate-400">
           {files.length} / 5 active files (Max 500MB total)
         </div>
      )}
    </div>
  );
}
