import { useState, useEffect } from "react";
import { Users, Calendar, Clock, MapPin, Search, Loader2, CheckCircle2, X, Trash2, Award, ExternalLink, Download } from "lucide-react";
import { api } from "./lib/api";
import { cn } from "./lib/utils";

const formatHour = (hour) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour > 12 ? hour - 12 : hour;
  return `${h}:00 ${period}`;
};

export default function AdminJoinIn() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Participant Roster Modal State
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [selectedSessionParticipants, setSelectedSessionParticipants] = useState(null);
  const [participantsList, setParticipantsList] = useState([]);
  const [fetchingParticipants, setFetchingParticipants] = useState(false);

  useEffect(() => {
    fetchSharedSessions();
  }, []);

  const fetchSharedSessions = async () => {
    setLoading(true);
    try {
      const data = await api.getEvents({ type: 'shared_session' });
      setSessions(data);
    } catch (error) {
      console.error("Error fetching shared sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (id) => {
    if (!confirm("Are you sure you want to delete this join-in session?")) return;
    try {
      await api.deleteEvent(id);
      fetchSharedSessions();
    } catch (e) {
      alert("Failed to delete session.");
    }
  };

  const fetchParticipants = async (session) => {
    setSelectedSessionParticipants(session);
    setShowParticipantModal(true);
    setFetchingParticipants(true);
    try {
      const data = await api.getEventParticipants(session.id);
      const enriched = data.map(r => ({
        ...r,
        user: {
          fullname: r.studentName || "Student",
          email: r.email || "N/A",
          phone: r.phoneNumber || "N/A"
        }
      }));
      setParticipantsList(enriched);
    } catch (e) {
      console.error("Error fetching participants:", e);
    } finally {
      setFetchingParticipants(false);
    }
  };

  const sportsList = ["All", "Futsal", "Badminton", "Tennis", "Basketball", "Lawn Bowls", "Cricket"];

  const filteredSessions = sessions.filter(s => {
    const matchSport = selectedSport === "All" || (s.sportname || "").toLowerCase().includes(selectedSport.toLowerCase());
    const matchDiff = selectedDifficulty === "All" || (s.difficultylevel || "Beginner").toLowerCase() === selectedDifficulty.toLowerCase();
    const matchSearch = !searchQuery.trim() || 
      (s.venue || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.studentName || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchSport && matchDiff && matchSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-admin-card p-6 rounded-[32px] border border-white/40 shadow-xl shadow-admin-accent/5 gap-4">
        <div>
          <span className="px-3 py-1 bg-admin-accent/10 text-admin-accent rounded-lg text-[9px] font-black uppercase tracking-wider border border-admin-accent/15">
            Administrative Session Monitor
          </span>
          <h2 className="text-2xl font-black text-admin-text tracking-tight uppercase mt-1">Join-In Sessions Monitor</h2>
          <p className="text-admin-text/60 text-xs mt-1 font-bold">
            View active community group sessions, player rosters, and participant capacities across all sports
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-white p-3 rounded-[20px] shadow-sm border border-slate-200/80">
          <Users className="w-5 h-5 text-admin-accent" />
          <span className="text-xs font-black text-admin-text uppercase">{filteredSessions.length} Sessions Active</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-admin-card p-4 rounded-[28px] border border-white/40 gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-admin-text/40 absolute left-3.5 top-3.5" />
          <input 
            type="text" 
            placeholder="Search by venue or host name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-bold text-admin-text outline-none focus:ring-2 focus:ring-admin-accent shadow-sm"
          />
        </div>

        {/* Sport Category Filter */}
        <div className="flex space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
          {sportsList.map(sport => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap",
                selectedSport === sport ? "bg-white text-admin-text shadow-sm border border-slate-200" : "text-admin-text/60 hover:bg-white/40"
              )}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Sessions */}
      {loading ? (
        <div className="flex justify-center p-16"><Loader2 className="w-8 h-8 text-admin-accent animate-spin" /></div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-16 bg-admin-card rounded-[32px] border border-white/40">
          <p className="text-admin-text/40 font-black uppercase tracking-wider text-sm">No Active Join-In Sessions Found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map(session => (
            <div key={session.id} className="bg-white/80 backdrop-blur-md rounded-[32px] border border-white p-6 shadow-sm flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-admin-accent/10 text-admin-accent border border-admin-accent/15 rounded-lg text-[9px] font-black uppercase tracking-wider">
                    {session.difficultylevel || "Beginner"}
                  </span>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => fetchParticipants(session)} 
                      className="p-2 bg-admin-accent/10 hover:bg-admin-accent/20 text-admin-accent rounded-xl transition-all"
                      title="View Player Roster"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSession(session.id)} 
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-all"
                      title="Delete Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="text-lg font-black text-admin-text leading-snug mb-2">{session.sportname || "Join-in Session"}</h4>
                <p className="text-xs font-bold text-admin-text/60 flex items-center mb-1">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-admin-accent" /> {session.venue}
                </p>
                <p className="text-xs font-bold text-admin-text/60 flex items-center mb-4">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-admin-accent" /> {session.date} • {formatHour(session.slot)}
                </p>

                <div className="bg-admin-card p-3 rounded-2xl border border-white/40 text-xs font-bold space-y-1">
                  <div className="flex justify-between text-admin-text/60">
                    <span>Host Student:</span>
                    <span className="text-admin-text font-black">{session.studentName || "Student"}</span>
                  </div>
                  <div className="flex justify-between text-admin-text/60">
                    <span>Status:</span>
                    <span className="text-emerald-600 uppercase font-black">{session.status || "Approved"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-black uppercase">
                <span className="text-admin-text/50">Capacity</span>
                <span className="text-admin-accent bg-admin-accent/10 px-3 py-1 rounded-xl">
                  {session.currentPlayers || 1} / {session.maxplayers || 10} Players Joined
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Participant Roster Modal */}
      {showParticipantModal && (
        <div className="fixed inset-0 bg-admin-text/60 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
          <div className="bg-admin-panel border border-white/60 rounded-[40px] w-full max-w-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-black text-2xl text-admin-text uppercase tracking-tight">Session Player Roster</h3>
                <p className="text-admin-accent font-black text-xs uppercase tracking-widest mt-1">
                  {selectedSessionParticipants?.venue} • {selectedSessionParticipants?.date}
                </p>
              </div>
              <button onClick={() => setShowParticipantModal(false)} className="text-admin-text/50 hover:bg-admin-card p-2 rounded-xl">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-3 hide-scrollbar">
              {fetchingParticipants ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-admin-accent animate-spin" /></div>
              ) : participantsList.length === 0 ? (
                <div className="text-center py-12 bg-admin-card rounded-[32px] border border-white/40">
                  <p className="text-admin-text/40 font-black uppercase text-xs">No joined participants found</p>
                </div>
              ) : (
                participantsList.map(p => (
                  <div key={p.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-admin-accent/10 text-admin-accent font-black flex items-center justify-center">
                        {p.user.fullname.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="font-black text-xs text-admin-text">{p.user.fullname}</h5>
                        <p className="text-[10px] text-admin-text/50 font-bold">{p.user.email}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                      Joined Player
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/40 flex justify-end">
              <button 
                onClick={() => setShowParticipantModal(false)}
                className="px-6 py-3 bg-admin-card text-admin-text font-black rounded-2xl hover:bg-white/60 shadow-sm transition-colors text-xs uppercase tracking-widest"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
