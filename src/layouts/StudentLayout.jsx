import { useState } from "react";
import { Home, CalendarClock, User, LogOut, Menu, X, Image as GalleryIcon, MessageSquare, Trophy, Map as MapIcon, Users } from "lucide-react";
import { cn } from "../lib/utils";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";

export default function StudentLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const bottomTabs = [
    { name: "Home", path: "/", icon: Home },
    { name: "Availability", path: "/availability", icon: CalendarClock },
    { name: "Join In", path: "/join-in", icon: Users },
    { name: "Profile", path: "/profile", icon: User },
  ];

  const sidebarLinks = [
    { name: "Host Tournament", path: "/request-tournament", icon: Trophy },
    { name: "Join Tournament", path: "/tournaments", icon: Trophy },
    { name: "Maps", path: "/maps", icon: MapIcon },
    { name: "Gallery", path: "/gallery", icon: GalleryIcon },
    { name: "Feedback", path: "/feedback", icon: MessageSquare },
  ];

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-brand-warm pb-24 font-sans selection:bg-brand-primary selection:text-white overflow-x-hidden">
      {/* Top Header */}
      <header className="bg-brand-warm px-6 py-5 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
             onClick={() => setSidebarOpen(true)}
             className="p-2 -ml-2 text-brand-deep hover:bg-slate-100 rounded-xl transition-colors"
          >
             <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-black tracking-tight flex items-center group cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center mr-2 rotate-[-6deg] group-hover:rotate-0 transition-transform">
              <span className="text-white text-lg font-black">P</span>
            </div>
            <span className="text-brand-deep hidden sm:inline">Play</span>
            <span className="text-brand-primary hidden sm:inline">Hub</span>
          </h1>
        </div>
        <button 
           onClick={handleSignOut}
           className="p-2.5 text-brand-deep/30 hover:text-brand-accent hover:bg-brand-accent/10 rounded-2xl transition-all flex items-center"
           title="Sign Out"
        >
           <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div className={cn(
        "fixed top-0 left-0 bottom-0 w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-xl font-black text-brand-deep">Menu</h2>
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 flex-1 space-y-2">
          {sidebarLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center space-x-4 px-4 py-4 rounded-2xl hover:bg-brand-warm/50 text-slate-700 font-bold transition-colors group"
            >
              <link.icon className="w-5 h-5 text-brand-primary group-hover:scale-110 transition-transform" />
              <span>{link.name}</span>
            </Link>
          ))}
        </div>
        <div className="p-6 border-t border-slate-100">
           <p className="text-xs text-slate-400 text-center font-bold">UiTM Shah Alam Pusat Sukan</p>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="p-6 max-w-2xl mx-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-6 left-6 right-6 max-w-sm mx-auto bg-white px-4 py-3 flex justify-around items-center z-40 rounded-[24px] shadow-[0_20px_40px_-15px_rgba(167,139,250,0.3)] border border-slate-100">
        {bottomTabs.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.path}
            className={({ isActive }) =>
              cn(
                "relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 group min-w-[70px]",
                isActive ? "text-brand-primary" : "text-slate-300 hover:text-slate-400"
              )
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon className={cn("w-6 h-6 relative z-10 transition-transform group-active:scale-90", isActive && "scale-110")} strokeWidth={ isActive ? 2.5 : 2} />
                <span className={cn("text-[10px] font-black mt-1 uppercase tracking-widest relative z-10 transition-opacity", isActive ? "opacity-100" : "group-hover:opacity-100 opacity-0")}>{tab.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
