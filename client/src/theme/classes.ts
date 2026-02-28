export const theme = {
  page: "w-full flex flex-col items-center animate-slide-up",
  card: "border-2 border-slate-900 bg-white shadow-[8px_8px_0px_0px_rgba(30,41,59,1)]",
  panel: "border-2 border-slate-900 bg-white shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]",
  input:
    "flex-grow border-2 border-slate-900 p-2 font-mono text-center outline-none shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none transition-all",
  button: {
    primary:
      "w-full bg-slate-900 border-2 border-slate-900 py-3 text-white font-bold text-lg shadow-[4px_4px_0px_0px_rgba(148,163,184,1)] hover:bg-slate-800 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all",
    secondary:
      "w-full bg-white border-2 border-slate-900 py-2 font-bold text-sm shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] hover:bg-slate-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  },
} as const;
