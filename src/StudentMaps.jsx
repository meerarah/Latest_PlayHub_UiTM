import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import { db } from "./lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { MapPin, Navigation, Loader2, ArrowLeft, Search } from "lucide-react";

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet marker icon asset paths which get broken by bundlers (like Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow
});

export default function StudentMaps() {
  const [loading, setLoading] = useState(true); // Loading state for database fetch
  const [courtsList, setCourtsList] = useState([]); // Stores list of courts fetched from Firestore
  const [selectedCourt, setSelectedCourt] = useState(null); // Stores court selected by user for viewing map/directions
  const [searchQuery, setSearchQuery] = useState("");

  // Default coordinate center (Kompleks Sukan / Pusat Sukan UiTM Shah Alam)
  const defaultCenter = [3.0675, 101.4975];

  // Specific GPS coordinates mapping for each Arena group on campus
  const arenaCoordinates = {
    "Arena 1": [3.0675, 101.4975], // Kompleks Sukan / Pusat Sukan UiTM
    "Arena 2": [3.0720, 101.4916], // Kompleks Kolam Renang UiTM
    "Arena 3": [3.0680, 101.4950], // Arena 3 Cricket Cages
    "Arena 6": [3.0658, 101.4895], // Arena 6 Badminton Courts
    "Arena 7": [3.0645, 101.5020], // Arena 7 near Kolej Perindu
  };

  // Fetch court facilities from Firestore database on component mount
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "courts"));
        const courts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourtsList(courts);
      } catch (error) {
        console.error("Error fetching courts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourts();
  }, []);

  const handleCourtClick = (court) => {
    setSelectedCourt(court);
  };

  const handleBack = () => {
    setSelectedCourt(null);
  };

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2 mb-2">
        <h2 className="text-2xl font-black text-brand-deep tracking-tight uppercase">
          {selectedCourt ? `DIRECTIONS TO ${selectedCourt.name}` : "SELECT A COURT FOR DIRECTIONS"}
        </h2>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
      ) : !selectedCourt ? (() => {
         const filteredCourts = courtsList.filter(court => {
            const q = searchQuery.toLowerCase();
            return (
               (court.name || "").toLowerCase().includes(q) ||
               (court.sport || "").toLowerCase().includes(q) ||
               (court.arena || "").toLowerCase().includes(q)
            );
         });

         return (
            <div className="space-y-6">
               {/* Search Box */}
               <div className="relative max-w-md">
                  <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by court name, sport, or arena..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary"
                  />
               </div>

               {filteredCourts.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                     <p className="text-slate-400 font-bold">No courts matching your search query found.</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {filteredCourts.map((court) => (
                        <div 
                          key={court.id} 
                          onClick={() => handleCourtClick(court)}
                          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
                        >
                           <div>
                             <h3 className="font-bold text-lg text-brand-deep mb-1">{court.name}</h3>
                             <div className="flex items-center space-x-2 text-sm text-slate-500 mb-3">
                               <MapPin className="w-4 h-4 text-brand-primary" />
                               <span>{court.arena}</span>
                             </div>
                           </div>
                           <div className="inline-block bg-brand-light text-brand-primary text-xs font-semibold px-3 py-1 rounded-full w-max">
                             {court.sport}
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         );
      })() : (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
          <button 
            onClick={handleBack}
            className="flex items-center space-x-2 text-brand-primary hover:text-brand-deep transition-colors font-medium bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm w-max"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Courts List</span>
          </button>
          
          <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm relative z-0">
            <div className="h-[60vh] w-full rounded-2xl overflow-hidden border border-slate-100">
              {/* MapContainer initializes the Leaflet Map with the selected court's arena coordinates */}
              <MapContainer
                center={arenaCoordinates[selectedCourt.arena] || defaultCenter}
                zoom={17}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
              >
                {/* TileLayer fetches visual map tiles from OpenStreetMap (OSM) */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Marker places the pin at the selected Arena coordinates on the map */}
                <Marker position={arenaCoordinates[selectedCourt.arena] || defaultCenter}>
                  {/* Popup shows detailed info when the user clicks the marker pin */}
                  <Popup>
                    <div className="font-bold text-brand-deep mb-1">{selectedCourt.name}</div>
                    <div className="text-sm text-slate-600">{selectedCourt.arena}</div>
                    <div className="text-xs text-brand-primary mt-1">{selectedCourt.sport}</div>
                  </Popup>
                  {/* Tooltip displays a permanently visible label floating directly above the pin */}
                  <Tooltip 
                    permanent 
                    direction="top" 
                    offset={[0, -40]} 
                    className="font-bold shadow-md rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-brand-deep text-xs z-50"
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-extrabold text-[10px] text-brand-primary tracking-wider uppercase mb-0.5">{selectedCourt.arena}</span>
                      <span className="font-bold text-slate-800 text-[11px]">{selectedCourt.name}</span>
                    </div>
                  </Tooltip>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
