import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, Users, MapPin, Search, Loader2, CheckCircle2, AlertCircle, Info, Filter, Trash2 } from "lucide-react";
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

export default function AdminAvailability() {
  const [courts, setCourts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedArena, setSelectedArena] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlotEvent, setSelectedSlotEvent] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const courtsData = await api.getCourts();
      setCourts(courtsData);

      const eventsData = await api.getEvents({ date: selectedDate });
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching availability data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (eventId) => {
    if (!confirm("Are you sure you want to delete this booking record?")) return;
    try {
      await api.deleteEvent(eventId);
      setSelectedSlotEvent(null);
      fetchData();
    } catch (e) {
      alert("Failed to delete booking.");
    }
  };

  const arenas = ["All", ...new Set(courts.map(c => c.arena).filter(Boolean))].sort();

  const filteredCourts = courts.filter(c => {
    const matchArena = selectedArena === "All" || c.arena === selectedArena;
    const matchSearch = !searchQuery.trim() || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.sport || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchArena && matchSearch;
  });

  // Calculate daily statistics
  const totalSlotsCount = courts.length * AVAILABLE_SLOTS.length;
  const activeBookingsForDate = events.filter(e => e.status !== 'rejected');
  const fullBookingsCount = activeBookingsForDate.filter(e => e.type === 'full_court').length;
  const sharedSessionsCount = activeBookingsForDate.filter(e => e.type === 'shared_session').length;
  const availableSlotsCount = Math.max(0, totalSlotsCount - activeBookingsForDate.length);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-admin-card p-6 rounded-[32px] border border-white/40 shadow-xl shadow-admin-accent/5 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-admin-accent/10 text-admin-accent rounded-lg text-[9px] font-black uppercase tracking-wider border border-admin-accent/15">
              Read-Only Administrative Monitor
            </span>
          </div>
          <h2 className="text-2xl font-black text-admin-text tracking-tight uppercase mt-1">Court Availability Monitor</h2>
          <p className="text-admin-text/60 text-xs mt-1 font-bold">
            Monitor real-time court allocations, slot bookings, and availability across Pusat Sukan
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
            placeholder="Search by court or sport name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-bold text-admin-text outline-none focus:ring-2 focus:ring-admin-accent shadow-sm"
          />
        </div>

        {/* Arenas Filter */}
        <div className="flex space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
          {arenas.map(arena => (
            <button
              key={arena}
              onClick={() => setSelectedArena(arena)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap",
                selectedArena === arena ? "bg-white text-admin-text shadow-sm border border-slate-200" : "text-admin-text/60 hover:bg-white/40"
              )}
            >
              {arena}
            </button>
          ))}
        </div>
      </div>

      {/* Availability Matrix List */}
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

              {/* Hourly Slots Grid (8 AM to 9 PM) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {AVAILABLE_SLOTS.map(hour => {
                  const event = events.find(e => e.courtId === court.id && e.slot === hour && e.status !== 'rejected');
                  const isBooked = !!event;
                  const isFullCourt = event && event.type === 'full_court';

                  return (
                    <div 
                      key={hour}
                      onClick={() => event && setSelectedSlotEvent({ ...event, courtName: court.name })}
                      className={cn(
                        "p-3 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer relative group",
                        !isBooked 
                          ? "bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/80" 
                          : isFullCourt 
                          ? "bg-red-50/70 border-red-200/80 hover:bg-red-100/80" 
                          : "bg-blue-50/70 border-blue-200/80 hover:bg-blue-100/80"
                      )}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-admin-text/60 flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-admin-accent" />
                          {formatHourRange(hour).split(' - ')[0]}
                        </span>
                        <span className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          !isBooked ? "bg-emerald-500" : isFullCourt ? "bg-red-500" : "bg-blue-500 animate-pulse"
                        )} />
                      </div>

                      <div className="space-y-0.5">
                        <p className={cn(
                          "text-xs font-black leading-tight truncate",
                          !isBooked ? "text-emerald-700" : isFullCourt ? "text-red-700" : "text-blue-700"
                        )}>
                          {!isBooked ? "Available" : isFullCourt ? (event.studentName || "Booked") : "Join-In"}
                        </p>
                        <p className="text-[9px] font-bold text-admin-text/50 truncate">
                          {!isBooked ? "Open slot" : isFullCourt ? `ID: ${event.studentid ? event.studentid.slice(0, 7) : 'Admin'}...` : `${event.currentPlayers || 1}/${event.maxplayers || 10} players`}
                        </p>
                      </div>

                      {isBooked && (
                        <div className="mt-2 pt-1 border-t border-slate-200/50 flex justify-between items-center text-[8px] font-black uppercase text-admin-text/40">
                          <span>Details</span>
                          <Info className="w-3 h-3 text-admin-accent" />
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

      {/* Reservation Details Modal (Read-Only Info Popover for Admin) */}
      {selectedSlotEvent && (
        <div className="fixed inset-0 bg-admin-text/60 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
          <div className="bg-admin-panel border border-white/60 rounded-[40px] w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className={cn(
                  "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                  selectedSlotEvent.type === 'full_court' ? "bg-red-50 text-red-600 border-red-200" : "bg-blue-50 text-blue-600 border-blue-200"
                )}>
                  {selectedSlotEvent.type === 'full_court' ? 'Private Full Court Booking' : 'Shared Join-In Session'}
                </span>
                <h3 className="font-black text-xl text-admin-text mt-2">{selectedSlotEvent.courtName || selectedSlotEvent.venue}</h3>
              </div>
              <button onClick={() => setSelectedSlotEvent(null)} className="text-admin-text/50 hover:bg-admin-card p-2 rounded-xl">
                ✕
              </button>
            </div>

            <div className="space-y-4 bg-admin-card p-5 rounded-2xl border border-white/40 text-xs font-bold text-admin-text">
              <div className="flex justify-between">
                <span className="text-admin-text/50">Date:</span>
                <span>{selectedSlotEvent.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-admin-text/50">Time Slot:</span>
                <span>{formatHourRange(selectedSlotEvent.slot)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-admin-text/50">Reserved By:</span>
                <span>{selectedSlotEvent.studentName || 'Student'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-admin-text/50">Student Matrix ID:</span>
                <span>{selectedSlotEvent.studentid || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-admin-text/50">Approval Status:</span>
                <span className="uppercase text-emerald-600 font-black">{selectedSlotEvent.status || 'Approved'}</span>
              </div>
              {selectedSlotEvent.type === 'shared_session' && (
                <div className="flex justify-between">
                  <span className="text-admin-text/50">Player Count:</span>
                  <span>{selectedSlotEvent.currentPlayers || 1} / {selectedSlotEvent.maxplayers || 10} Joined</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex space-x-3">
              <button 
                onClick={() => handleDeleteBooking(selectedSlotEvent.id)}
                className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Booking</span>
              </button>
              <button 
                onClick={() => setSelectedSlotEvent(null)}
                className="flex-1 py-3 bg-admin-card hover:bg-white text-admin-text rounded-2xl font-black text-xs uppercase tracking-wider transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
