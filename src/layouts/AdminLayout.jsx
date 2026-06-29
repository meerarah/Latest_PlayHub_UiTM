import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, MessageSquareShare, LogOut, Trophy, Settings, Menu, X } from "lucide-react";
import { cn } from "../lib/utils";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const links = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Tournaments", path: "/admin/tournaments", icon: Trophy },
    { name: "Feedbacks", path: "/admin/feedback", icon: MessageSquareShare },
  ];

  return (
    <div className="min-h-screen bg-admin-base p-4 sm:p-6 lg:p-8 flex items-center justify-center font-sans selection:bg-admin-accent selection:text-white">
      {/* Main Floating Container */}
      <div className="w-full max-w-[1400px] h-[90vh] bg-admin-panel rounded-[40px] shadow-2xl flex overflow-hidden border border-white/40 relative">
        
        {/* Sidebar (Desktop) */}
        <aside className="w-64 bg-transparent flex-col hidden md:flex flex-shrink-0 pt-8 pb-6 px-4 z-10 border-r border-admin-card/50">
          <div className="px-4 mb-10 flex items-center group cursor-pointer" onClick={() => navigate("/admin")}>
            <div className="w-10 h-10 bg-admin-accent rounded-xl flex items-center justify-center mr-3 shadow-md rotate-[-3deg] group-hover:rotate-0 transition-all">
               <span className="text-white text-xl font-black">P</span>
            </div>
            <h1 className="text-2xl font-black text-admin-text tracking-tight">Play<span className="text-admin-accent opacity-80">Hub</span></h1>
          </div>

          <nav className="flex-1 space-y-3">
            {links.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center space-x-4 px-5 py-3.5 rounded-full font-bold transition-all group",
                    isActive
                      ? "bg-white/60 text-admin-text shadow-sm"
                      : "text-admin-text/60 hover:bg-admin-card/50 hover:text-admin-text"
                  )
                }
                end={link.path === "/admin"}
              >
                {({ isActive }) => (
                  <>
                    <link.icon className={cn("w-5 h-5 transition-transform group-active:scale-95", isActive ? "text-admin-accent" : "")} />
                    <span>{link.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          
          <div className="mt-auto space-y-2">
            <NavLink 
              to="/admin/settings"
              className={({ isActive }) =>
                cn(
                  "flex items-center space-x-4 px-5 py-3.5 w-full rounded-full font-bold transition-all group",
                  isActive
                    ? "bg-white/60 text-admin-text shadow-sm"
                    : "text-admin-text/60 hover:bg-admin-card/50 hover:text-admin-text"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Settings className={cn("w-5 h-5 transition-transform group-active:scale-95", isActive ? "text-admin-accent" : "")} />
                  <span>Setting</span>
                </>
              )}
            </NavLink>
            <button onClick={handleSignOut} className="flex items-center space-x-4 px-5 py-3.5 w-full text-admin-text/60 hover:bg-white/40 hover:text-admin-text rounded-full font-bold transition-all group mt-4">
              <LogOut className="w-5 h-5 group-active:scale-95 transition-transform" />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
          {/* Mobile Header */}
          <header className="md:hidden bg-admin-panel/80 backdrop-blur-md p-4 border-b border-admin-card/50 flex justify-between items-center z-20">
              <div className="flex items-center">
                 <div className="w-8 h-8 bg-admin-accent rounded-lg flex items-center justify-center mr-2 shadow-sm">
                   <span className="text-white font-black">P</span>
                 </div>
                 <h1 className="font-bold text-xl text-admin-text">PlayHub</h1>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="p-2 bg-admin-card rounded-xl text-admin-text transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
          </header>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-[73px] left-0 right-0 bg-admin-panel border-b border-admin-card/50 shadow-xl z-30 p-4 animate-in slide-in-from-top-2">
               <nav className="flex flex-col space-y-2">
                 {links.map((link) => (
                   <NavLink
                     key={link.name}
                     to={link.path}
                     onClick={() => setIsMobileMenuOpen(false)}
                     className={({ isActive }) =>
                       cn(
                         "flex items-center space-x-4 px-5 py-4 rounded-2xl font-bold transition-all",
                         isActive
                           ? "bg-white/60 text-admin-text shadow-sm"
                           : "text-admin-text/60 hover:bg-admin-card/50 hover:text-admin-text"
                       )
                     }
                     end={link.path === "/admin"}
                   >
                     {({ isActive }) => (
                       <>
                         <link.icon className={cn("w-5 h-5", isActive ? "text-admin-accent" : "")} />
                         <span>{link.name}</span>
                       </>
                     )}
                   </NavLink>
                 ))}
                 
                 <div className="pt-4 mt-2 border-t border-admin-card/50 flex flex-col space-y-2">
                    <NavLink 
                      to="/admin/settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center space-x-4 px-5 py-4 w-full rounded-2xl font-bold transition-all text-left",
                          isActive
                            ? "bg-white/60 text-admin-text shadow-sm"
                            : "text-admin-text/60 hover:bg-admin-card/50 hover:text-admin-text"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Settings className={cn("w-5 h-5", isActive ? "text-admin-accent" : "")} />
                          <span>Setting</span>
                        </>
                      )}
                    </NavLink>
                    <button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} className="flex items-center space-x-4 px-5 py-4 w-full text-admin-text/60 hover:bg-white/40 hover:text-admin-text rounded-2xl font-bold transition-all text-left">
                      <LogOut className="w-5 h-5" />
                      <span>Log out</span>
                    </button>
                 </div>
               </nav>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 hide-scrollbar scroll-smooth">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
