import { useLocation, useNavigate } from 'react-router-dom';
import { QrCode as QrIcon, Link as LinkIcon, Copy, Check, Mail } from 'lucide-react';
import QRCode from "react-qr-code";
import { useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { theme } from '../theme/classes';
import { shareByEmail } from '../services/api';

export default function Share() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lastUpload, ownerAuth } = useAppState();
  const [copied, setCopied] = useState(false);
  
  const [emailInput, setEmailInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [emailMessage, setEmailMessage] = useState('');

  const stateUpload = location.state as
    | { shortCode?: string; fileName?: string; expiry?: string }
    | null;

  const shortCode = lastUpload?.shortCode ?? stateUpload?.shortCode;
  const fileName = lastUpload?.fileName ?? stateUpload?.fileName;
  const expiry = lastUpload?.expiry ?? stateUpload?.expiry;
  
  if (!shortCode) {
    return <div className="text-center font-bold text-red-500 mt-20">No file uploaded recently. <button onClick={() => navigate('/upload')} className="underline">Go back</button></div>
  }

  const shareLink = `${window.location.origin}/download?c=${shortCode}`;

  const copyToClipboard = () => {
    void navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    if (!ownerAuth) {
      setEmailStatus('error');
      setEmailMessage('Missing auth credentials to share via email');
      return;
    }

    setIsSendingEmail(true);
    setEmailStatus('idle');
    try {
      await shareByEmail(ownerAuth, shortCode, emailInput.trim());
      setEmailStatus('success');
      setEmailMessage('Email sent successfully!');
      setEmailInput('');
    } catch (err: any) {
      setEmailStatus('error');
      setEmailMessage(err.message || 'Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className={`${theme.page} max-w-xl mx-auto`}>
      <div className={`${theme.card} p-8 mb-8 flex flex-col items-center bg-white`}>
        <div className="w-48 h-48 bg-white flex items-center justify-center border-2 border-slate-200 mb-4 p-2 shadow-sm">
           <QRCode value={shareLink} size={160} />
        </div>
        <div className="flex items-center gap-2 text-slate-700 font-bold tracking-widest text-sm">
             <QrIcon size={20} />
             <span>SCAN TO DOWNLOAD</span>
        </div>
      </div>

      <div className="w-full flex flex-col gap-6">
        
        {/* Link Box */}
        <div className={`${theme.panel} p-4 bg-white`}>
          <div className="flex items-center justify-between mb-3 border-b-2 border-slate-100 pb-2">
            <div className="flex items-center gap-2 font-black text-slate-800 tracking-wide text-sm">
                <LinkIcon size={16} /> SHARE LINK
            </div>
            <button 
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
              onClick={copyToClipboard}
            >
              {copied ? <><Check size={14} className="text-green-600"/> COPIED</> : <><Copy size={14} /> COPY</>}
            </button>
          </div>
          
          <div 
            className="text-sm text-slate-700 font-mono bg-slate-50 p-3 border-2 border-slate-200 break-all select-all outline-none focus:border-slate-400 rounded-sm cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={copyToClipboard}
          >
            {shareLink}
          </div>
          <div className="text-center text-xs font-bold text-slate-400 mt-3 flex items-center justify-between">
            <span className="truncate max-w-[200px]">{fileName}</span>
            <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-sm">Valid for {expiry || 'Time limit'}</span>
          </div>
        </div>

        {/* Email Box */}
        <div className={`${theme.panel} p-4 bg-white`}>
          <div className="flex items-center gap-2 font-black text-slate-800 tracking-wide text-sm mb-3 border-b-2 border-slate-100 pb-2">
              <Mail size={16} /> SHARE VIA EMAIL
          </div>
          <form onSubmit={handleShareEmail} className="flex flex-col gap-3">
            <div className={`flex w-full border-2 focus-within:border-slate-900 transition-colors ${emailStatus === 'error' ? 'border-red-400' : 'border-slate-300'}`}>
              <input 
                type="email" 
                placeholder="friend@example.com"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                className="flex-1 px-3 py-2 outline-none text-sm font-medium"
                required
              />
              <button 
                type="submit"
                disabled={isSendingEmail || !emailInput.trim()}
                className="bg-slate-900 text-white px-4 font-bold text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {isSendingEmail ? 'Sending...' : 'Send'}
              </button>
            </div>
            {emailMessage && (
              <div className={`text-xs font-bold ${emailStatus === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                {emailMessage}
              </div>
            )}
          </form>
        </div>

        <button 
          onClick={() => navigate('/upload')}
          className="w-full bg-slate-900 border-2 border-slate-900 py-3 mt-4 text-white font-bold text-lg shadow-[4px_4px_0px_0px_rgba(251,146,60,1)] hover:bg-slate-800 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all uppercase tracking-widest"
        >
          Upload Another
        </button>
      </div>
    </div>
  );
}