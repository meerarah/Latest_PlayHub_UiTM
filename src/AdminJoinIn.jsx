import { useState, useEffect } from "react";
import { Users, Calendar as CalendarIcon, Clock, MapPin, Search, Loader2, CheckCircle2, X, Trash2, Info, Filter } from "lucide-react";
import { api } from "./lib/api";
import { cn } from "./lib/utils";

const AVAILABLE_SLOTS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21];

const formatHourRange = (hour) => {
  const formatSingle = (h) => {
    const period = h >= 12 ? 'PM' : 'AM';
    let formattedH = h > 12 ? h - 12 : h;
    if (formattedH === 0) formattedH = 12;
    return `${formattedH}:00 ${period}`;
  };
  return `${formatSingle(hour)} - ${formatSingle(hour + 1)}`;
};

export default function AdminJoinIn() {
  const [courts, setCourts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedArena, setSelectedArena] = useState("All");
  const [selectedSport, setSelectedSport] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Participant Roster Modal State
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [selectedSessionParticipants, setSelectedSessionParticipants] = useState(null);
  const [participantsList, setParticipantsList] = useState([]);
  const [fetchingParticipants, setFetchingParticipants] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const courtsData = await api.getCourts();
      setCourts(courtsData);

      const eventsData = await api.getEvents({ date: selectedDate });
      // Filter for shared sessions only
      const sharedOnly = eventsData.filter(e => e.type === 'shared_session' && e.status !== 'rejected');
      setEvents(sharedOnly);
    } catch (error) {
      console.error("Error fetching join-in sessions data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (id) => {
    if (!confirm("Are you sure you want to delete this join-in session?")) return;
    try {
      await api.deleteEvent(id);
      fetchData();
    } catch (e) {
      alert("Failed to delete session.");
    }
  };

  const fetchParticipants = async (session, courtName) => {
    setSelectedSessionParticipants({ ...session, courtName });
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

  const arenas = ["All", ...new Set(courts.map(c => c.arena).filter(Boolean))].sort();
  const sportsList = ["All", "Futsal", "Badminton", "Tennis", "Basketball", "Lawn Bowls", "Cricket"];

  const filteredCourts = courts.filter(c => {
    const matchArena = selectedArena === "All" || c.arena === selectedArena;
    const matchSport = selectedSport === "All" || (c.sport || "").toLowerCase().includes(selectedSport.toLowerCase());
    const matchSearch = !searchQuery.trim() || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.sport || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchArena && matchSport && matchSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-admin-card p-6 rounded-[32px] border border-white/40 shadow-xl shadow-admin-accent/5 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-admin-accent/10 text-admin-accent rounded-lg text-[9px] font-black uppercase tracking-wider border border-admin-accent/15">
              Read-Only Join-In Session Monitor
            </span>
          </div>
          <h2 className="text-2xl font-black text-admin-text tracking-tight uppercase mt-1">Join-In Sessions Schedule Monitor</h2>
          <p className="text-admin-text/60 text-xs mt-1 font-bold">
            Overall court schedule matrix of community join-in sessions and player attendance across Pusat Sukan
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center space-x-3 bg-white p-2 rounded-[20px] shadow-sm border border-slate-200/80 w-full md:w-auto">
          <CalendarIcon className="w-5 h-5 text-admin-accent ml-2" />
          <span className="text-xs font-black uppercase text-admin-text tracking-wider">Date:</span>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-admin-text outline-none focus:ring-2 focus:ring-admin-accent"
          />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-admin-card p-4 rounded-[28px] border border-white/40 gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-admin-text/40 absolute left-3.5 top-3.5" />
          <input 
            type="text" 
            placeholder="Search by court or sport..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-bold text-admin-text outline-none focus:ring-2 focus:ring-admin-accent shadow-sm"
          />
        </div>

        {/* Sports & Arenas Filters */}
        <div className="flex flex-wrap gap-2 overflow-x-auto w-full md:w-auto">
          <div className="flex space-x-1.5 bg-white/60 p-1.5 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-black uppercase text-admin-text/50 self-center px-2">Arena:</span>
            {arenas.map(arena => (
              <button
                key={arena}
                onClick={() => setSelectedArena(arena)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap",
                  selectedArena === arena ? "bg-white text-admin-text shadow-sm border border-slate-200" : "text-admin-text/60 hover:bg-white/40"
                )}
              >
                {arena}
              </button>
            ))}
          </div>

          <div className="flex space-x-1.5 bg-white/60 p-1.5 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-black uppercase text-admin-text/50 self-center px-2">Sport:</span>
            {sportsList.map(sport => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap",
                  selectedSport === sport ? "bg-white text-admin-text shadow-sm border border-slate-200" : "text-admin-text/60 hover:bg-white/40"
                )}
              >
                {sport}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Join-In Matrix View per Court */}
      {loading ? (
        <div className="flex justify-center p-16"><Loader2 className="w-8 h-8 text-admin-accent animate-spin" /></div>
      ) : filteredCourts.length === 0 ? (
        <div className="text-center py-16 bg-admin-card rounded-[32px] border border-white/40">
          <p className="text-admin-text/40 font-black uppercase tracking-wider text-sm">No Courts Match Your Search Filter</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCourts.map(court => (
            <div key={court.id} className="bg-white/80 backdrop-blur-md rounded-[32px] border border-white p-6 shadow-sm">
              {/* Court Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 mb-5 gap-3">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                    <img src={court.image || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80"} alt={court.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-admin-accent bg-admin-accent/10 px-2.5 py-0.5 rounded-md border border-admin-accent/15">
                        {court.sport}
                      </span>
                      <span className="text-xs font-bold text-slate-400 flex items-center">
                        <MapPin className="w-3 h-3 mr-1 text-admin-accent" /> {court.arena || "Pusat Sukan"}
                      </span>
                    </div>
                    <h3 className="font-black text-admin-text text-lg mt-1">{court.name}</h3>
                  </div>
                </div>
                
                <div className="text-right text-xs font-bold text-admin-text/50">
                  <span>Capacity: {court.capacity} max players</span>
                </div>
              </div>

              {/* Hourly Time Slots Matrix (8 AM to 9 PM) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {AVAILABLE_SLOTS.map(hour => {
                  const session = events.find(e => e.courtId === court.id && e.slot === hour && e.type === 'shared_session');
                  const hasSession = !!session;

                  return (
                    <div 
                      key={hour}
                      onClick={() => hasSession && fetchParticipants(session, court.name)}
                      className={cn(
                        "p-3 rounded-2xl border flex flex-col justify-between transition-all relative group",
                        hasSession 
                          ? "bg-blue-50/80 border-blue-200 hover:bg-blue-100/90 cursor-pointer shadow-sm" 
                          : "bg-slate-50/50 border-slate-200/50 opacity-60"
                      )}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-admin-text/60 flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-admin-accent" />
                          {formatHourRange(hour).split(' - ')[0]}
                        </span>
                        <span className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          hasSession ? "bg-blue-600 animate-pulse" : "bg-slate-300"
                        )} />
                      </div>

                      <div className="space-y-0.5">
                        <p className={cn(
                          "text-xs font-black leading-tight truncate",
                          hasSession ? "text-blue-800" : "text-slate-400"
                        )}>
                          {hasSession ? (session.sportname || "Shared Session") : "No Join-In"}
                        </p>
                        <p className="text-[9px] font-bold text-admin-text/50 truncate">
                          {hasSession ? `${session.currentPlayers || 1}/${session.maxplayers || 10} Joined` : "Open slot"}
                        </p>
                      </div>

                      {hasSession && (
                        <div className="mt-2 pt-1 border-t border-blue-200/60 flex justify-between items-center text-[8px] font-black uppercase text-blue-700">
                          <span>View Roster</span>
                          <Users className="w-3 h-3 text-blue-600" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Participant Roster Modal */}
      {showParticipantModal && selectedSessionParticipants && (
        <div className="fixed inset-0 bg-admin-text/60 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
          <div className="bg-admin-panel border border-white/60 rounded-[40px] w-full max-w-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-200">
                  Shared Join-In Session
                </span>
                <h3 className="font-black text-2xl text-admin-text uppercase tracking-tight mt-2">
                  {selectedSessionParticipants.courtName || selectedSessionParticipants.venue}
                </h3>
                <p className="text-admin-text/60 font-bold text-xs mt-1">
                  Date: {selectedSessionParticipants.date} • Time Slot: {formatHourRange(selectedSessionParticipants.slot)}
                </p>
              </div>
              <button onClick={() => setShowParticipantModal(false)} className="text-admin-text/50 hover:bg-admin-card p-2 rounded-xl">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-admin-card p-4 rounded-2xl border border-white/40 mb-6 flex justify-between items-center text-xs font-bold">
              <div>
                <span className="text-admin-text/50">Host Student: </span>
                <span className="text-admin-text font-black">{selectedSessionParticipants.studentName || "Student"}</span>
              </div>
              <div className="text-right">
                <span className="text-admin-text/50">Capacity: </span>
                <span className="text-blue-700 font-black">{selectedSessionParticipants.currentPlayers || 1} / {selectedSessionParticipants.maxplayers || 10} Players Joined</span>
              </div>
            </div>

            <div className="max-h-[45vh] overflow-y-auto pr-2 space-y-3 hide-scrollbar">
              {fetchingParticipants ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-admin-accent animate-spin" /></div>
              ) : participantsList.length === 0 ? (
                <div className="text-center py-12 bg-admin-card rounded-[32px] border border-white/40">
                  <p className="text-admin-text/40 font-black uppercase text-xs">No registered players found</p>
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

            <div className="mt-6 pt-4 border-t border-white/40 flex justify-between items-center">
              <button 
                onClick={() => handleDeleteSession(selectedSessionParticipants.id)}
                className="px-5 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Session</span>
              </button>

              <button 
                onClick={() => setShowParticipantModal(false)}
                className="px-6 py-3 bg-admin-card text-admin-text font-black rounded-2xl hover:bg-white/60 shadow-sm transition-colors text-xs uppercase tracking-widest cursor-pointer"
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
