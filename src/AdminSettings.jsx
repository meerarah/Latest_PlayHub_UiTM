import { useState, useEffect } from "react";
import { Settings, Shield, RefreshCw, Loader2, Database, Award, Users, BookOpen } from "lucide-react";
import { db } from "./lib/firebase";
import { collection, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";
import { useAuth } from "./context/AuthContext";
import { initializeSystem } from "./lib/adminUtils";

export default function AdminSettings() {
  const { user } = useAuth();
  
  const [stats, setStats] = useState({ courts: 0, badges: 0, users: 0, registrations: 0 });
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
     fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
     setLoading(true);
     try {
        const [courtSnap, badgeSnap, userSnap, regSnap] = await Promise.all([
           getDocs(collection(db, "courts")),
           getDocs(collection(db, "Badge")),
           getDocs(collection(db, "users")),
           getDocs(collection(db, "Tournament_Registrations"))
        ]);
        
        setStats({
           courts: courtSnap.size,
           badges: badgeSnap.size,
           users: userSnap.size,
           registrations: regSnap.size
        });
     } catch (err) {
        console.error("Failed to load statistics", err);
     } finally {
        setLoading(false);
     }
  };

  const handleSystemSeed = async () => {
     if (!confirm("WARNING: This will clear all existing courts and re-seed the system facilities. Booking histories tied to old court IDs will be orphaned. Are you sure you want to proceed?")) {
        return;
     }
     
     setIsSeeding(true);
     setSuccessMessage("");
     try {
        const res = await initializeSystem(true);
        if (res.success) {
           setSuccessMessage(res.message);
           await fetchSystemStats();
        } else {
           alert("Seeding failed: " + res.message);
        }
     } catch (err) {
        console.error(err);
        alert("Error during seeding: " + err.message);
     } finally {
        setIsSeeding(false);
     }
  };

  return (
     <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header Title Card */}
        <div className="flex flex-col space-y-2 mb-8 bg-admin-card p-6 rounded-[32px] border border-white/40 shadow-xl shadow-admin-accent/5 font-sans">
           <h2 className="text-2xl font-black text-admin-text tracking-tight uppercase flex items-center">
              <Settings className="w-6 h-6 mr-3 text-admin-accent" /> Control Settings
           </h2>
           <p className="text-sm text-admin-text/60 font-bold">Configure system parameters, seed core assets, and view database integrity statistics.</p>
        </div>

        {loading ? (
           <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-admin-accent animate-spin" />
           </div>
        ) : (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-sans">
              {/* Database and System seeding */}
              <div className="bg-white/70 backdrop-blur-sm rounded-[32px] p-8 border border-white shadow-xl shadow-admin-accent/5 flex flex-col justify-between space-y-6">
                 <div>
                    <h3 className="text-lg font-black text-admin-text mb-4 uppercase tracking-tight flex items-center">
                       <Database className="w-5 h-5 mr-2 text-admin-accent" /> System Seeding & Reset
                    </h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                       Initialize or reset the court coordinates, capacity, and active badges. Wiping the database resets all 21 default sports facilities across Arena 1, 2, 3, 6, and 7.
                    </p>

                    {/* Stats List */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                       <div className="bg-admin-card/40 p-4 rounded-2xl border border-white/50">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Total Facilities</span>
                          <span className="text-2xl font-black text-admin-text mt-1 block">{stats.courts} Courts</span>
                       </div>
                       <div className="bg-admin-card/40 p-4 rounded-2xl border border-white/50">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Milestones</span>
                          <span className="text-2xl font-black text-admin-text mt-1 block">{stats.badges} Badges</span>
                       </div>
                       <div className="bg-admin-card/40 p-4 rounded-2xl border border-white/50">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Registered Users</span>
                          <span className="text-2xl font-black text-admin-text mt-1 block">{stats.users} Students</span>
                       </div>
                       <div className="bg-admin-card/40 p-4 rounded-2xl border border-white/50">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Tournament Entries</span>
                          <span className="text-2xl font-black text-admin-text mt-1 block">{stats.registrations} Roster Entries</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    {successMessage && (
                       <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs font-bold leading-normal">
                          ✓ {successMessage}
                       </div>
                    )}
                    
                    <button
                       onClick={handleSystemSeed}
                       disabled={isSeeding}
                       className="w-full bg-admin-accent hover:bg-admin-accent/95 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs shadow-lg shadow-admin-accent/20 flex items-center justify-center transition-all active:scale-[0.98]"
                    >
                       {isSeeding ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                       {isSeeding ? "Resetting Database..." : "Force Wipe & Re-Seed System"}
                    </button>
                 </div>
              </div>

              {/* Admin Profile Details */}
              <div className="bg-white/70 backdrop-blur-sm rounded-[32px] p-8 border border-white shadow-xl shadow-admin-accent/5 space-y-6 flex flex-col justify-between">
                 <div>
                    <h3 className="text-lg font-black text-admin-text mb-4 uppercase tracking-tight flex items-center">
                       <Shield className="w-5 h-5 mr-2 text-admin-accent" /> Security Credentials
                    </h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                       Your administrator session is managed securely. Contact the IT infrastructure lead for updating admin emails or backend authentication scopes.
                    </p>

                    <div className="space-y-4">
                       <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Account Email</label>
                          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-500">
                             {user?.email || "admin@playhub.edu"}
                          </div>
                       </div>

                       <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-450 text-slate-400 mb-2">Access Scope</label>
                          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-500 flex items-center">
                             <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 inline-block"></span>
                             System Owner (Admin Role)
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-100/50">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-450 block text-center">
                       UiTM Shah Alam Pusat Sukan Panel v1.2.0
                    </span>
                 </div>
              </div>
           </div>
        )}
     </div>
  );
}
