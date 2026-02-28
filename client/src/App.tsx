import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Home from "./Components/Home";
import Upload from "./Components/Upload";
import Download from "./Components/Download";
import Share from "./Components/Share";
import OwnerFiles from "./Components/OwnerFiles";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-orange-100 flex flex-col">
      {/* Navbar */}
      <header className="border-b-[3px] border-slate-900 px-4 md:px-8 py-4 flex flex-col xl:flex-row justify-between items-center gap-4 bg-white z-50 sticky top-0 shadow-sm">
        <div className="flex items-center justify-between w-full xl:w-auto">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="border-[3px] border-slate-900 px-5 py-2 text-xl font-black tracking-widest bg-orange-400 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all uppercase">
              FileZap
            </div>
          </div>
          <a href="https://github.com/vanshcodeworks/filezapv2" target="_blank" rel="noreferrer" className="xl:hidden flex px-3 py-2 text-xs font-black tracking-widest border-[3px] border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(251,146,60,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all uppercase items-center justify-center">
            GitHub
          </a>
        </div>
        <nav className="flex flex-wrap justify-center gap-2 w-full xl:w-auto mt-2 xl:mt-0">
          <NavButton label="P2P Transfer" onClick={() => navigate('/')} active={location.pathname === '/'} />
          <NavButton label="Cloud" onClick={() => navigate('/upload')} active={location.pathname === '/upload'} />
          <NavButton label="My Files" onClick={() => navigate('/files')} active={location.pathname === '/files'} />
          <NavButton label="Download" onClick={() => navigate('/download')} active={location.pathname === '/download'} />
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center relative min-h-[600px]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/share" element={<Share />} />
          <Route path="/download" element={<Download />} />
          <Route path="/files" element={<OwnerFiles />} />
        </Routes>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 hide-on-mobile md:block">
        <a href="https://github.com/vanshcodeworks/filezapv2" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white px-5 py-3 border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] hover:bg-slate-50 hover:-translate-y-1 active:translate-y-2 active:translate-x-2 active:shadow-none transition-all font-black text-xs uppercase tracking-widest">
          <span>Star on Github</span>
        </a>
      </div>
    </div>
  );
}

function NavButton({ label, onClick, active }: { label: string; onClick?: () => void; active?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 text-xs font-black tracking-widest border-[3px] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none uppercase
        ${active 
          ? 'border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(251,146,60,1)]' 
          : 'border-slate-900 bg-white text-slate-800 hover:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]'
        }
      `}
    >
      {label}
    </button>
  );
}

export default App;