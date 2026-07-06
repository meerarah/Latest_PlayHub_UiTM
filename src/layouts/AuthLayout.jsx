import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-white p-6 font-sans sm:bg-slate-50">
      <div className="w-full max-w-md mx-auto sm:bg-white sm:p-10 sm:rounded-[40px] sm:shadow-xl sm:shadow-brand-deep/5 sm:border sm:border-slate-100 space-y-10 animate-in fade-in zoom-in-95 duration-700">
        
        <div className="text-center space-y-3 pt-8 sm:pt-0">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-primary rounded-[24px] shadow-lg shadow-brand-primary/30 mb-4 rotate-[-6deg] hover:rotate-0 transition-transform cursor-pointer">
            <span className="text-4xl font-black text-white">P</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-brand-deep">
            Play<span className="text-brand-primary">Hub</span>
          </h1>
          <p className="text-brand-deep/60 font-medium">Your Campus Sports Community</p>
        </div>
        
        <div className="relative">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
