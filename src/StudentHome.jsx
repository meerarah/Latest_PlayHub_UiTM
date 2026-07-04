import { useState, useEffect } from "react";
import { Bell, Trophy, Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { db } from "./lib/firebase";
import { collection, query, getDocs, getDoc, doc, orderBy, where } from "firebase/firestore";
import { useAuth } from "./context/AuthContext";
import { Link } from "react-router-dom";
import { cn } from "./lib/utils";
import NotificationsSheet from "./components/NotificationsSheet";
import { onSnapshot } from "firebase/firestore";

export default function Home() {
  const { user } = useAuth(); // Retrieve current authenticated user context
  const [fullName, setFullName] = useState(""); // Stores student's first name for personal welcome
  const [loading, setLoading] = useState(true); // Tracks page loader state
  const [markedDates, setMarkedDates] = useState([]); // Array of date strings that have events (to mark on calendar)
  const [showNotifications, setShowNotifications] = useState(false); // Controls notifications panel visibility
  const [unreadCount, setUnreadCount] = useState(0); // Holds number of unread notifications

  // Unified lists
  const [combinedEvents, setCombinedEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]); // Stores upcoming sports events
  const [pastEvents, setPastEvents] = useState([]); // Stores past registered sports events
  const [selectedDateStr, setSelectedDateStr] = useState(() => new Date().toISOString().split('T')[0]); // Tracks clicked day on calendar

  // Calendar State for browsing months
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper to format consecutive slots into a clean range string
  const formatTimeRange = (slots) => {
    if (!slots || slots.length === 0) return "TBA";
    const sorted = [...slots].sort((a, b) => a - b);
    const start = sorted[0];
    const end = sorted[sorted.length - 1] + 1;
    return `${start}:00 - ${end}:00`;
  };

  // Helper to merge consecutive hourly slots belonging to the same booking/session
  const groupConsecutiveEvents = (eventsList) => {
    if (!eventsList || eventsList.length === 0) return [];
    
    // Group events by key: date, venue, studentid, type
    const groups = {};
    eventsList.forEach(e => {
      const key = `${e.date}_${e.venue}_${e.studentid}_${e.type}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    
    const mergedList = [];
    
    Object.values(groups).forEach(groupEvents => {
      // Sort group events by slot value
      const sorted = [...groupEvents].sort((a, b) => parseInt(a.slot) - parseInt(b.slot));
      
      let currentMerged = null;
      sorted.forEach(ev => {
        const slotNum = parseInt(ev.slot);
        if (!currentMerged) {
          currentMerged = {
            ...ev,
            slots: [slotNum]
          };
        } else {
          const lastSlot = currentMerged.slots[currentMerged.slots.length - 1];
          if (slotNum === lastSlot + 1) {
            currentMerged.slots.push(slotNum);
          } else {
            mergedList.push(currentMerged);
            currentMerged = {
              ...ev,
              slots: [slotNum]
            };
          }
        }
      });
      if (currentMerged) {
        mergedList.push(currentMerged);
      }
    });
    
    return mergedList;
  };

  // Sets up listener for unread notifications and triggers dashboard loading when user is active
  useEffect(() => {
    if (user?.uid) {
       fetchHomeData();
       
       // Real-time listener checking Firestore notifications where isRead is false
       const q = query(collection(db, "notifications"), where("userId", "==", user.uid), where("isRead", "==", false));
       const unsubscribe = onSnapshot(q, (snap) => {
         setUnreadCount(snap.size);
       });
       return () => unsubscribe(); // Cleanup listener on unmount
    }
  }, [user]);

  // Query and process data for home dashboard (User fullname, registrations, events list)
  const fetchHomeData = async () => {
    setLoading(true);
    try {
      // 1. Get user document for welcome header greeting and matrixId
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userMatrixId = "";
      if (userDoc.exists() && userDoc.data().fullname) {
         setFullName(userDoc.data().fullname.split(' ')[0]);
         userMatrixId = userDoc.data().matrixId || "";
      }

      // 2. Fetch all registrations representing sport events the student joined
      const regQ = query(collection(db, 'Registration'), where('studentid', '==', user.uid));
      const regSnap = await getDocs(regQ);
      const regSportIds = regSnap.docs.map(d => d.data().sportid);

      // 3. Fetch all active sport events ordered chronologically
      const allEventsSnap = await getDocs(query(collection(db, 'Sport_event'), orderBy('date', 'asc')));
      const myEvents = [];
      
      allEventsSnap.docs.forEach(d => {
        const data = { id: d.id, ...d.data() };
        // Check if user is either the organizer or a registered participant of the event
        if (data.studentid === user.uid || regSportIds.includes(d.id)) {
          myEvents.push(data);
        }
      });

      // Group consecutive hourly slots
      const mergedSportEvents = groupConsecutiveEvents(myEvents);

      // 4. Fetch tournaments the student is registered for
      const registeredTournaments = [];
      if (userMatrixId) {
         // Query where studentId is user.uid (they registered as captain/leader)
         const captainQ = query(collection(db, 'Tournament_Registrations'), where('studentId', '==', user.uid));
         const captainSnap = await getDocs(captainQ);
         
         // Query where memberMatrixIds contains user's matrixId
         const memberQ = query(collection(db, 'Tournament_Registrations'), where('memberMatrixIds', 'array-contains', userMatrixId));
         const memberSnap = await getDocs(memberQ);
         
         const uniqueRegistrationDocs = new Map();
         captainSnap.docs.forEach(doc => uniqueRegistrationDocs.set(doc.id, doc.data()));
         memberSnap.docs.forEach(doc => uniqueRegistrationDocs.set(doc.id, doc.data()));
         
         const registeredTournamentIds = [...new Set([...uniqueRegistrationDocs.values()].map(r => r.tournamentId))];
         
         if (registeredTournamentIds.length > 0) {
            // Fetch all tournaments details
            const tournamentsSnap = await getDocs(collection(db, 'Tournaments'));
            tournamentsSnap.docs.forEach(td => {
               if (registeredTournamentIds.includes(td.id)) {
                  registeredTournaments.push({
                     id: td.id,
                     ...td.data(),
                     isTournament: true
                  });
               }
            });
         }
      }

      // Combine sport events and registered tournaments
      const combined = [...mergedSportEvents, ...registeredTournaments];
      
      // Sort combined chronologically by date, and then by slot (if present)
      combined.sort((a, b) => {
         const dateCompare = a.date.localeCompare(b.date);
         if (dateCompare !== 0) return dateCompare;
         
         const startA = a.slots ? a.slots[0] : 0;
         const startB = b.slots ? b.slots[0] : 0;
         return startA - startB;
      });

      setCombinedEvents(combined);

      // 5. Extract unique date strings for calendar highlighting
      const activeDates = [];
      combined.forEach(e => {
        if (e.date) activeDates.push(e.date);
      });
      setMarkedDates([...new Set(activeDates)]);

      // 6. Divide into upcoming and past categories
      const today = new Date().toISOString().split('T')[0];
      const upcoming = combined.filter(e => e.date >= today).slice(0, 5);
      const past = combined.filter(e => e.date < today).sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5);

      setUpcomingEvents(upcoming);
      setPastEvents(past);

    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Renders the interactive monthly calendar with highlighted booking dates
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // Find starting weekday of the month
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Total days in selected month
    
    // Fill empty cells up to the first day of the week
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="rounded-[32px] overflow-hidden shadow-xl shadow-brand-deep/5 bg-white w-full">
        {/* Top Header Section */}
        <div className="bg-brand-primary p-6 text-white text-center relative">
           <div className="flex justify-between items-center mb-4">
              <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"><ChevronLeft className="w-5 h-5 text-white" /></button>
              <div>
                 <h3 className="text-2xl font-bold tracking-wide">{new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate)}</h3>
                 <p className="text-sm font-medium text-white/70">{year}</p>
              </div>
              <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"><ChevronRight className="w-5 h-5 text-white" /></button>
           </div>
           
           <div className="flex justify-center space-x-2 mt-4">
              {['Day', 'Week', 'Month', 'Year'].map(t => (
                <button key={t} className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", t === 'Month' ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10")}>{t}</button>
              ))}
           </div>
        </div>
        
        {/* Bottom White Grid */}
        <div className="p-6">
           <div className="grid grid-cols-7 gap-2 text-center mb-4">
              {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(d => <span key={d} className="text-[10px] font-bold text-slate-400">{d}</span>)}
           </div>
           <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center">
              {days.map((day, idx) => {
                if (!day) return <div key={`pad-${idx}`} className="h-8" />;
                
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isMarked = markedDates.includes(dateStr);
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                const isSelected = dateStr === selectedDateStr;

                return (
                  <div key={day} className="flex justify-center items-center">
                    <span 
                      onClick={() => setSelectedDateStr(dateStr)}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all cursor-pointer",
                        isSelected ? "bg-brand-primary text-white shadow-md shadow-brand-primary/40 scale-110" : 
                        isToday ? "border-2 border-brand-primary text-brand-primary" : 
                        isMarked ? "bg-brand-primary/10 text-brand-primary font-bold hover:bg-brand-primary/20" : 
                        "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {day}
                    </span>
                  </div>
                );
              })}
           </div>
        </div>
      </div>
    );
  };

  // Renders the activities specific to the selected day
  const renderSelectedDateEvents = () => {
    const dayEvents = combinedEvents.filter(e => e.date === selectedDateStr);
    
    let formattedDate = selectedDateStr;
    try {
      const d = new Date(selectedDateStr + "T00:00:00");
      formattedDate = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(d);
    } catch (e) {}

    return (
      <div className="mt-8 bg-slate-50 p-6 rounded-[32px] border border-slate-100 animate-in fade-in duration-300">
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black text-brand-deep">Schedule for {formattedDate}</h3>
            <span className="text-xs bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider">
               {dayEvents.length} {dayEvents.length === 1 ? "Activity" : "Activities"}
            </span>
         </div>
         
         <div className="space-y-3">
            {dayEvents.length === 0 ? (
               <div className="text-center py-6">
                  <p className="text-slate-400 text-sm font-medium">No activities scheduled for this day.</p>
                  <Link to="/availability" className="mt-3 inline-block text-xs font-black text-brand-primary hover:underline">Book a court slot →</Link>
               </div>
            ) : dayEvents.map(event => (
               <div key={event.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                     <div className={cn(
                       "w-2 h-10 rounded-full shrink-0",
                       event.isTournament ? "bg-amber-500" : event.type === "shared_session" ? "bg-emerald-500" : "bg-brand-primary"
                     )} />
                     <div>
                        <h4 className="font-bold text-brand-deep text-sm flex items-center flex-wrap gap-1">
                           {event.isTournament && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Tournament</span>}
                           {!event.isTournament && event.type === "shared_session" && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Join In</span>}
                           {!event.isTournament && event.type === "full_court" && <span className="text-[10px] text-brand-primary bg-brand-primary/5 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Booking</span>}
                           <span className="text-brand-deep">{event.sportname || event.sport || event.venue}</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                           {event.isTournament ? "All Day" : formatTimeRange(event.slots)} • {event.venue || event.location}
                        </p>
                     </div>
                  </div>
                  {event.isTournament ? (
                     <Link to={`/tournament/${event.id}`} className="text-xs font-black text-brand-primary hover:underline bg-brand-primary/5 px-3 py-2 rounded-xl shrink-0">View info</Link>
                  ) : (
                     <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-500 block">{event.studentName || "You"}</span>
                     </div>
                  )}
               </div>
            ))}
         </div>
      </div>
    );
  };

  // Renders overall upcoming events (up to 5)
  const renderUpcomingEvents = () => (
    <div className="mt-8">
       <h3 className="text-xl font-black text-brand-deep mb-4">Upcoming events</h3>
       <div className="space-y-3">
          {loading ? (
             <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-brand-primary" /></div>
          ) : upcomingEvents.length === 0 ? (
             <p className="text-slate-400 text-sm">No upcoming events.</p>
          ) : upcomingEvents.map(event => (
             <div key={event.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center hover:shadow-md transition-all">
                <div className="flex items-center space-x-3">
                   <div className={cn(
                     "w-2 h-10 rounded-full shrink-0",
                     event.isTournament ? "bg-amber-500" : event.type === "shared_session" ? "bg-emerald-500" : "bg-brand-primary"
                   )} />
                   <div>
                      <h4 className="font-bold text-brand-deep text-sm flex items-center flex-wrap gap-1">
                         {event.isTournament && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Tournament</span>}
                         {!event.isTournament && event.type === "shared_session" && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Join In</span>}
                         {!event.isTournament && event.type === "full_court" && <span className="text-[10px] text-brand-primary bg-brand-primary/5 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Booking</span>}
                         <span className="text-brand-deep">{event.sportname || event.sport || event.venue}</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 font-medium">
                         {event.date} • {event.isTournament ? "All Day" : formatTimeRange(event.slots)}
                      </p>
                   </div>
                </div>
                {event.isTournament ? (
                   <Link to={`/tournament/${event.id}`} className="text-xs font-black text-brand-primary hover:underline bg-brand-primary/5 px-3 py-2 rounded-xl shrink-0">View info</Link>
                ) : (
                   <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg whitespace-nowrap">{event.venue}</p>
                   </div>
                )}
             </div>
          ))}
       </div>
    </div>
  );

  // Renders overall past events (up to 5)
  const renderPastEvents = () => (
    <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 sticky top-6">
       <div className="flex justify-between items-end mb-8">
          <div>
             <h3 className="font-black text-2xl text-brand-deep">My Journey</h3>
             <p className="text-brand-deep/50 text-sm font-medium mt-1">Past Adventures</p>
          </div>
       </div>
       <div className="space-y-0">
          {loading ? (
             <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-brand-primary" /></div>
          ) : pastEvents.length === 0 ? (
             <p className="text-slate-400 text-sm text-center py-4">No past events found.</p>
          ) : pastEvents.map((event, idx) => (
             <div key={event.id} className="flex space-x-4 group">
                <div className="flex flex-col items-center">
                   <div className="w-3 h-3 rounded-full bg-brand-primary/30 group-hover:bg-brand-primary transition-colors mt-1" />
                   {idx !== pastEvents.length - 1 && <div className="w-0.5 h-12 bg-slate-200 my-1" />}
                </div>
                <div className="pb-6">
                   <h4 className="font-bold text-brand-deep text-sm flex items-center flex-wrap gap-1">
                      {event.isTournament && <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Tournament</span>}
                      <span className="text-brand-deep">{event.sportname || event.sport || event.venue}</span>
                   </h4>
                   <p className="text-xs text-slate-500 mt-1">{event.date} • {event.isTournament ? "All Day" : formatTimeRange(event.slots)}</p>
                </div>
             </div>
          ))}
       </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
           <p className="text-brand-deep/60 font-medium text-sm mb-1">Welcome back,</p>
           <h2 className="text-4xl font-black text-brand-deep tracking-tight">
              {fullName || user?.displayName || (user?.email ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : "Student")}<span className="text-brand-primary">.</span>
           </h2>
        </div>
        <button 
          onClick={() => setShowNotifications(true)}
          className="p-3 bg-white rounded-2xl shadow-sm text-brand-deep/60 relative hover:text-brand-primary transition-all active:scale-95 cursor-pointer"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-3 right-3 w-3 h-3 bg-brand-accent border-2 border-white rounded-full animate-bounce"></span>
          )}
        </button>
      </div>

      <NotificationsSheet 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content Column */}
        <div className="lg:col-span-8 flex flex-col space-y-8">
           
           <div className="max-w-lg w-full">
             {renderCalendar()}
             {renderSelectedDateEvents()}
             {renderUpcomingEvents()}
           </div>

        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 flex flex-col space-y-8">
           {renderPastEvents()}
        </div>
      </div>
    </div>
  );
}
