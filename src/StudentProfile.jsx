import { useState, useEffect, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import { Award, ChevronRight, FileBadge, Loader2, Download, X, Medal, Clock, MapPin, Settings, Save } from "lucide-react";
import { db, auth } from "./lib/firebase";
import { collection, query, getDocs, getDoc, doc, where, updateDoc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { seedDemoData } from "./lib/demoSeeder";

const getSportCategory = (name) => {
   if (!name) return "Sport";
   const lower = name.toLowerCase();
   if (lower.includes("futsal")) return "Futsal";
   if (lower.includes("bola sepak") || lower.includes("football") || lower.includes("bola padang")) return "Bola Sepak";
   if (lower.includes("badminton")) return "Badminton";
   if (lower.includes("kriket") || lower.includes("cricket")) return "Kriket";
   if (lower.includes("netball") || lower.includes("bola jaring")) return "Bola Jaring";
   if (lower.includes("volleyball") || lower.includes("bola tampar")) return "Bola Tampar";
   if (lower.includes("basketball") || lower.includes("bola keranjang")) return "Bola Keranjang";
   if (lower.includes("ping pong") || lower.includes("table tennis")) return "Ping Pong";
   if (lower.includes("rugby") || lower.includes("ragbi")) return "Ragbi";
   return name;
};

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Certificate Modal State
  const [selectedCert, setSelectedCert] = useState(null);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const certRef = useRef(null);

  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [showBadgeInfo, setShowBadgeInfo] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMatrixId, setEditMatrixId] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editResidency, setEditResidency] = useState("College");
  const [editCollegeName, setEditCollegeName] = useState("Kolej Perindu");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Fallback if not found in table
  const defaultEmail = user?.email || "student@university.edu";

  const handleSeedDemoData = async () => {
     if (!user?.uid) return;
     setIsSeeding(true);
     try {
        await seedDemoData(user.uid);
        alert("Demo data seeded successfully! Your past events, badges, and certificates are ready.");
        await fetchProfileData();
     } catch (err) {
        console.error("Failed to seed demo data:", err);
        alert("Failed to seed demo data: " + err.message);
     } finally {
        setIsSeeding(false);
     }
  };

  useEffect(() => {
    if (user?.uid) {
       fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile Info
      let matrixId = "";
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
         const data = userDoc.data();
         setProfile(data);
         setEditName(data.fullname || "");
         setEditMatrixId(data.matrixId || "");
         setEditPhone(data.phone || "");
         setEditResidency(data.residencyType || "College");
         setEditCollegeName(data.collegeName || "Kolej Perindu");
         matrixId = data.matrixId || "";
      } else {
         setProfile(null);
      }

      // 2. Fetch Certificates (Completed Registrations)
      const q = query(
        collection(db, 'Registration'), 
        where('studentid', '==', user.uid),
        where('status', '==', 'completed')
      );
      const regSnap = await getDocs(q);
      const regList = regSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'session' }));

      // Fetch associated Sport_event data for each registration
      const enrichedCerts = await Promise.all(regList.map(async (reg) => {
        const sportDoc = await getDoc(doc(db, 'Sport_event', reg.sportid));
        return {
          ...reg,
          Sport_event: sportDoc.exists() ? sportDoc.data() : { sportname: "Deleted Event", date: "TBA", venue: "TBA" }
        };
      }));

      // Fetch completed tournament registrations where this user is the leader/registrant
      const tq = query(
        collection(db, 'Tournament_Registrations'),
        where('studentId', '==', user.uid),
        where('status', '==', 'completed')
      );
      const tRegSnap = await getDocs(tq);
      const tRegList1 = tRegSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'tournament' }));

      // Fetch completed tournament registrations where this user is a roster member matrixId
      let tRegList2 = [];
      if (matrixId) {
         const tq2 = query(
           collection(db, 'Tournament_Registrations'),
           where('memberMatrixIds', 'array-contains', matrixId),
           where('status', '==', 'completed')
         );
         const tRegSnap2 = await getDocs(tq2);
         tRegList2 = tRegSnap2.docs.map(d => ({ id: d.id, ...d.data(), type: 'tournament' }));
      }

      // Merge and de-duplicate
      const mergedTReg = [];
      const seenIds = new Set();
      [...tRegList1, ...tRegList2].forEach(reg => {
         if (!seenIds.has(reg.id)) {
            seenIds.add(reg.id);
            mergedTReg.push(reg);
         }
      });

      const enrichedTCerts = await Promise.all(mergedTReg.map(async (reg) => {
         const tDoc = await getDoc(doc(db, 'Tournaments', reg.tournamentId));
         const tData = tDoc.exists() ? tDoc.data() : { name: "Deleted Tournament", date: "TBA", venue: "TBA", sport: "Sport" };
         return {
           ...reg,
           Sport_event: {
              sportname: tData.name,
              date: tData.date,
              venue: tData.venue || "Kompleks Sukan UiTM Shah Alam"
           }
         };
      }));

      setCertificates([...enrichedCerts, ...enrichedTCerts]);

      // 3. Fetch Badges
      const bq = query(collection(db, 'Student_Badge'), where('studentid', '==', user.uid));
      const bSnap = await getDocs(bq);
      const bList = await Promise.all(bSnap.docs.map(async (b) => {
        const bData = b.data();
        const bInfo = await getDoc(doc(db, 'Badge', bData.badgeid));
        return { id: b.id, ...bData, Badge: bInfo.exists() ? bInfo.data() : null };
      }));
      setBadges(bList);

    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCertName = () => {
     if (selectedCert?.type === 'tournament' && selectedCert?.members && selectedCert.members.length > 0) {
        const m = selectedCert.members[selectedMemberIndex];
        return m ? m.fullname.toUpperCase() : "PARTICIPANT";
     }
     return profile?.fullname?.toUpperCase() || "PASSIONATE STUDENT";
  };

  const getCertMatrix = () => {
     if (selectedCert?.type === 'tournament' && selectedCert?.members && selectedCert.members.length > 0) {
        const m = selectedCert.members[selectedMemberIndex];
        return m ? m.matrixId : "N/A";
     }
     return profile?.matrixId || "N/A";
  };

  const downloadPDF = async () => {
    if (!certRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      
      const memberName = getCertName().replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = selectedCert.Sport_event?.sportname || "Certificate";
      pdf.save(`Certificate_${fileName.replace(/[^a-zA-Z0-9]/g, "_")}_${memberName}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };
   
  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setIsSavingName(true);
    try {
       await setDoc(doc(db, 'users', user.uid), {
          fullname: editName,
          matrixId: editMatrixId.trim(),
          residencyType: editResidency,
          collegeName: editResidency === 'College' ? editCollegeName : "",
          phone: editPhone.trim(),
          email: user?.email || "",
          role: 'student'
       }, { merge: true });
       setProfile(prev => ({
          ...prev,
          fullname: editName,
          matrixId: editMatrixId.trim(),
          residencyType: editResidency,
          collegeName: editResidency === 'College' ? editCollegeName : "",
          phone: editPhone.trim(),
          email: user?.email || prev?.email
       }));
       setShowSettings(false);
    } catch(err) {
       console.error("Failed to update profile", err);
       alert("Failed to update profile: " + err.message);
    } finally {
       setIsSavingName(false);
    }
  };
   
  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="space-y-6 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-black text-slate-800">Profile</h2>
         <button onClick={() => setShowSettings(true)} className="text-slate-400 hover:text-brand-primary transition-colors active:scale-95">
            <Settings className="w-6 h-6" />
         </button>
      </div>

      {loading ? (
         <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
         </div>
      ) : (
         <>
         {/* Profile Header */}
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
            <div className="flex items-center space-x-4">
               <div className="w-16 h-16 rounded-full bg-brand-primary flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-brand-primary/30">
                  {profile?.fullname ? profile.fullname.charAt(0).toUpperCase() : defaultEmail.charAt(0).toUpperCase()}
               </div>
               <div className="overflow-hidden">
                  <h3 className="font-bold text-lg text-brand-deep truncate">{profile?.fullname || defaultEmail.split('@')[0]}</h3>
                  <p className="text-sm text-brand-deep/50 truncate">{profile?.email || defaultEmail}</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        ID: {profile?.matrixId || "Not Set"}
                     </span>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Residency: {profile?.residencyType === 'NR' ? 'Non-Resident (NR)' : profile?.residencyType === 'College' ? `College Resident (${profile?.collegeName || 'Kolej Perindu'})` : 'Not Set'}
                     </span>
                  </div>
               </div>
            </div>
            <button 
               onClick={() => setShowSettings(true)}
               className="bg-brand-primary hover:bg-brand-primary/95 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-brand-primary/25"
            >
               Edit Profile Settings
            </button>
         </div>

         {/* Certificates Section */}
         <div>
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-brand-deep flex items-center">
                <FileBadge className="w-5 h-5 mr-2 text-brand-primary" />
                My Certificates
              </h3>
           </div>
           
           {certificates.length === 0 ? (
              <div className="text-center p-10 bg-white/40 backdrop-blur-sm rounded-[32px] border border-brand-primary/10 border-dashed">
                 <p className="text-brand-deep/30 text-sm font-black uppercase tracking-widest">No achievements yet.</p>
                 <p className="text-[10px] text-brand-primary font-bold mt-1">Join an event to earn your first badge!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                 {certificates.map(cert => (
                    <div 
                      key={cert.id} 
                      onClick={() => setSelectedCert(cert)}
                      className="group relative bg-white/70 backdrop-blur-sm border border-white p-5 rounded-[32px] flex justify-between items-center overflow-hidden hover:shadow-xl hover:shadow-brand-primary/5 hover:border-brand-primary/20 transition-all cursor-pointer"
                    >
                       <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                          <Medal className="w-32 h-32 text-brand-primary rotate-12" />
                       </div>
                       <div className="relative z-10 space-y-2">
                          <div className="flex items-center space-x-2">
                             <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-lg">
                               E-Certificate
                             </span>
                          </div>
                          <h4 className="font-black text-brand-deep text-lg leading-tight group-hover:text-brand-primary transition-colors">
                             {cert.Sport_event?.sportname || "Unknown Event"}
                          </h4>
                          <div className="flex items-center space-x-3 text-brand-deep/40 text-[10px] font-bold uppercase tracking-wider">
                             <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {cert.Sport_event?.date}</span>
                             <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {cert.Sport_event?.venue}</span>
                          </div>
                       </div>
                       <div className="relative z-10 w-10 h-10 flex items-center justify-center bg-brand-primary/10 text-brand-primary rounded-xl group-hover:bg-brand-primary group-hover:text-white transition-all">
                          <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                       </div>
                    </div>
                 ))}
              </div>
            )}
         </div>

          {/* Gamification / Badges */}
          <div className="pt-4">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-black text-xl text-brand-deep flex items-center">
                 <Medal className="w-6 h-6 mr-3 text-brand-primary" />
                 Milestones
               </h3>
               <div className="flex items-center space-x-3">
                  <button 
                     onClick={() => setShowBadgeInfo(true)}
                     className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:underline hover:text-brand-primary/80 transition-colors"
                  >
                     How to earn
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
                    {badges.length} Unlocked
                  </span>
               </div>
            </div>
            
            {badges.length === 0 ? (
               <div className="text-center p-12 bg-white/40 backdrop-blur-sm rounded-[40px] border border-brand-primary/5 border-dashed group hover:border-brand-primary/20 transition-all">
                 <div className="w-16 h-16 bg-brand-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Award className="w-8 h-8 text-brand-primary/20" />
                 </div>
                 <p className="text-brand-deep/30 text-sm font-black uppercase tracking-widest leading-loose">
                   Your journey <br/> is just beginning
                 </p>
                 <button 
                   onClick={() => setShowBadgeInfo(true)}
                   className="mt-4 text-[10px] font-black text-brand-primary uppercase underline tracking-widest active:scale-95 transition-transform"
                 >
                   How to earn badges
                 </button>
               </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                 {badges.map((b) => (
                   <div 
                     key={b.id} 
                     className="group rounded-[32px] p-6 flex flex-col items-center justify-center text-center space-y-3 border border-white bg-white/60 backdrop-blur-sm transition-all hover:shadow-xl hover:shadow-brand-primary/5 hover:-translate-y-1"
                   >
                     <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-sm group-hover:scale-110 transition-transform">
                        {b.Badge?.image_icon || "🏅"}
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-brand-deep leading-tight">
                        {b.Badge?.badgename || "Badge"}
                     </span>
                   </div>
                 ))}
              </div>
            )}
          </div>
         </>
      )}

      {/* Certificate Preview Modal */}
      {selectedCert && (
        <div className="fixed inset-0 bg-brand-deep/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 lg:p-10">
           <div className="relative w-full max-w-5xl animate-in zoom-in-95 duration-500">
              {/* Close Button */}
              <button 
                onClick={() => {
                   setSelectedCert(null);
                   setSelectedMemberIndex(0);
                }}
                className="absolute -top-14 right-0 lg:-right-14 p-3 text-white/60 hover:text-white transition-colors bg-white/10 rounded-full hover:bg-white/20"
              >
                <X className="w-8 h-8" />
              </button>

              {/* Container (Split into Sidebar + Certificate Preview) */}
              <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden soft-shadow flex flex-col md:flex-row">
                 
                 {/* Sidebar (Only shown for team tournaments with member lists) */}
                 {selectedCert?.type === 'tournament' && selectedCert?.members && selectedCert.members.length > 0 && (
                    <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col space-y-3 shrink-0">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Team Roster</h4>
                       <div className="flex flex-col space-y-1.5 overflow-y-auto max-h-[360px] pr-1">
                          {selectedCert.members.map((m, idx) => (
                             <button
                               key={idx}
                               onClick={() => setSelectedMemberIndex(idx)}
                               className={`text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                                  selectedMemberIndex === idx
                                    ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                                    : "bg-white border border-slate-150 text-slate-600 hover:bg-slate-100"
                               }`}
                             >
                                <div className="truncate font-black">{m.fullname}</div>
                                <div className={`text-[10px] opacity-70 mt-0.5 ${selectedMemberIndex === idx ? "text-white" : "text-slate-400"}`}>
                                   ID: {m.matrixId}
                                </div>
                             </button>
                          ))}
                       </div>
                    </div>
                 )}

                 {/* Preview & Download Panel */}
                 <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="overflow-x-auto p-6 bg-slate-100 flex justify-center items-center">
                        <div 
                          ref={certRef} 
                          className="relative w-full max-w-[800px] min-h-[540px] p-10 md:p-14 flex flex-col justify-between select-none shrink-0"
                          style={{ 
                             fontFamily: "Georgia, 'Times New Roman', serif",
                             backgroundColor: "#ffffff",
                             textAlign: "center",
                             borderRadius: "1rem"
                          }}
                        >
                           {/* Classic Double Border */}
                           <div className="absolute inset-4 pointer-events-none" style={{ border: "4px solid rgba(217, 119, 6, 0.35)", borderRadius: "0.5rem" }} />
                           <div className="absolute inset-5 pointer-events-none" style={{ border: "1px solid rgba(217, 119, 6, 0.2)", borderRadius: "0.375rem" }} />
                           
                           {/* Classic Corner Gold Ornaments */}
                           <div className="absolute top-6 left-6 text-2xl font-bold select-none" style={{ color: "rgba(217, 119, 6, 0.4)" }}>✦</div>
                           <div className="absolute top-6 right-6 text-2xl font-bold select-none" style={{ color: "rgba(217, 119, 6, 0.4)" }}>✦</div>
                           <div className="absolute bottom-6 left-6 text-2xl font-bold select-none" style={{ color: "rgba(217, 119, 6, 0.4)" }}>✦</div>
                           <div className="absolute bottom-6 right-6 text-2xl font-bold select-none" style={{ color: "rgba(217, 119, 6, 0.4)" }}>✦</div>

                           <div className="relative z-10 flex flex-col justify-between h-full space-y-8 my-auto">
                              {/* Header Section */}
                              <div className="space-y-3">
                                 <h4 className="text-lg md:text-xl font-bold tracking-widest uppercase" style={{ letterSpacing: '0.15em', color: "#1e293b" }}>
                                    Universiti Teknologi MARA Shah Alam
                                 </h4>
                                 <div className="w-24 h-[1px] mx-auto" style={{ backgroundColor: "rgba(217, 119, 6, 0.3)" }} />
                              </div>

                              {/* Title Section */}
                              <div className="space-y-1">
                                 <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide uppercase" style={{ color: "#d97706" }}>
                                    Certificate of Participation
                                 </h2>
                                 <h3 className="text-sm md:text-base italic font-medium" style={{ color: "#64748b" }}>
                                    (Sijil Penyertaan)
                                 </h3>
                              </div>

                              {/* Certificate Body Wording */}
                              <div className="max-w-2xl mx-auto px-4 space-y-4">
                                 <p className="text-xs md:text-sm leading-relaxed" style={{ color: "#475569" }}>
                                    This is to certify that
                                 </p>
                                 
                                 <h3 className="text-xl md:text-2xl font-bold inline-block px-6" style={{ color: "#0f172a", borderBottom: "1.5px solid #e2e8f0", paddingBottom: "0.375rem" }}>
                                    {getCertName()}
                                 </h3>
                                 
                                 <p className="text-xs md:text-sm font-semibold" style={{ color: "#334155" }}>
                                    ID NO: {getCertMatrix()}
                                 </p>
                                 
                                 <p className="text-xs md:text-sm leading-relaxed max-w-xl mx-auto" style={{ color: "#475569" }}>
                                    has actively participated in the <span className="font-bold" style={{ color: "#0f172a" }}>{selectedCert.Sport_event?.sportname}</span> event.
                                 </p>
                                 
                                 <p className="text-[10px] md:text-xs" style={{ color: "#475569" }}>
                                    Held on <span className="font-semibold" style={{ color: "#0f172a" }}>{selectedCert.Sport_event?.date}</span> at <span className="font-semibold" style={{ color: "#0f172a" }}>Kompleks Sukan UiTM Shah Alam</span>.
                                 </p>
                              </div>

                              {/* Bottom Footer Section */}
                              <div className="flex justify-between items-end pt-4 px-6 text-[10px]" style={{ color: "#64748b" }}>
                                 <div className="text-left space-y-1">
                                    <div className="w-28 h-[1px]" style={{ backgroundColor: "#cbd5e1" }} />
                                    <p className="font-bold" style={{ color: "#1e293b" }}>PlayHub Sports Unit</p>
                                    <p>UiTM Shah Alam</p>
                                 </div>
                                 <div className="text-right space-y-1">
                                    <p className="font-bold" style={{ color: "#1e293b" }}>Certificate ID</p>
                                    <p className="font-mono text-[9px] font-bold uppercase" style={{ color: "#b45309" }}>{selectedCert.id.substring(0, 12)}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                    </div>

                    {/* Download Action Bar */}
                     <div className="bg-brand-deep p-6 px-10 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-white/60 text-xs font-bold uppercase tracking-wider hidden md:block">
                           Digital ID: {selectedCert.id.substring(0, 8)}...
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                           <button 
                             onClick={() => {
                                setSelectedCert(null);
                                setSelectedMemberIndex(0);
                             }}
                             className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/10 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                           >
                             <span>Back</span>
                           </button>
                           <button 
                             disabled={isGenerating}
                             onClick={downloadPDF}
                             className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                           >
                             {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                             <span>{isGenerating ? "Engraving PDF..." : "Download Official PDF"}</span>
                           </button>
                        </div>
                     </div>
                 </div>

              </div>
           </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-brand-deep/80 backdrop-blur-xl z-[100] flex items-end sm:items-center justify-center sm:p-4">
           <div className="relative w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
              <div className="p-8">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-brand-deep flex items-center">
                       <Settings className="w-6 h-6 mr-3 text-brand-primary" />
                       Account Settings
                    </h3>
                    <button onClick={() => setShowSettings(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                       <X className="w-6 h-6" />
                    </button>
                 </div>
                 
                 <div className="space-y-6">
                    <div>
                       <label className="block text-xs font-bold text-brand-deep/40 uppercase tracking-widest mb-2">Name</label>
                       <input 
                         type="text" 
                         value={editName}
                         onChange={(e) => setEditName(e.target.value)}
                         className="w-full bg-slate-50 border border-slate-200 text-brand-deep rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary font-medium transition-all"
                         placeholder="Enter your name"
                       />
                    </div>

                    <div>
                       <label className="block text-xs font-bold text-brand-deep/40 uppercase tracking-widest mb-2">Student ID / Matrix ID</label>
                       <input 
                         type="text" 
                         value={editMatrixId}
                         onChange={(e) => setEditMatrixId(e.target.value)}
                         className="w-full bg-slate-50 border border-slate-200 text-brand-deep rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary font-medium transition-all"
                         placeholder="e.g. 2024123456"
                       />
                    </div>

                    <div>
                       <label className="block text-xs font-bold text-brand-deep/40 uppercase tracking-widest mb-2">Phone Number</label>
                       <input 
                         type="tel" 
                         value={editPhone}
                         onChange={(e) => setEditPhone(e.target.value)}
                         className="w-full bg-slate-50 border border-slate-200 text-brand-deep rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary font-medium transition-all"
                         placeholder="e.g. 0123456789"
                       />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-brand-deep/40 uppercase tracking-widest mb-2">Residency Status</label>
                        <select 
                          value={editResidency}
                          onChange={(e) => setEditResidency(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-brand-deep rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary font-medium transition-all"
                        >
                           <option value="College">College Resident</option>
                           <option value="NR">Non-Resident (NR)</option>
                        </select>
                     </div>

                     {editResidency === "College" && (
                        <div className="animate-in slide-in-from-top-2 duration-200">
                           <label className="block text-xs font-bold text-brand-deep/40 uppercase tracking-widest mb-2">College Name</label>
                           <select 
                             value={editCollegeName}
                             onChange={(e) => setEditCollegeName(e.target.value)}
                             className="w-full bg-slate-50 border border-slate-200 text-brand-deep rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary font-medium transition-all"
                           >
                              <option value="Kolej Perindu">Kolej Perindu</option>
                              <option value="Kolej Mawar">Kolej Mawar</option>
                              <option value="Kolej Melati">Kolej Melati</option>
                              <option value="Kolej Seroja">Kolej Seroja</option>
                              <option value="Kolej Teratai">Kolej Teratai</option>
                              <option value="Kolej Meranti">Kolej Meranti</option>
                              <option value="Kolej Delima">Kolej Delima</option>
                           </select>
                        </div>
                     )}
                    
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSavingName || !editName.trim() || (editName === profile?.fullname && editMatrixId === (profile?.matrixId || "") && editPhone === (profile?.phone || "") && editResidency === (profile?.residencyType || "College") && (editResidency === "NR" || editCollegeName === (profile?.collegeName || "Kolej Perindu")))}
                      className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl py-4 font-black shadow-lg shadow-brand-primary/20 flex items-center justify-center transition-all active:scale-95"
                    >
                       {isSavingName ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                       {isSavingName ? "Saving..." : "Save Changes"}
                    </button>

                     <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col space-y-4">
                        <button 
                          onClick={handleSignOut}
                          className="w-full font-black text-red-500 py-4 bg-red-50 hover:bg-red-100 rounded-2xl transition-all uppercase tracking-widest text-xs"
                        >
                           Sign Out Safely
                        </button>
                     </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Badge Info Modal */}
      {showBadgeInfo && (
        <div className="fixed inset-0 bg-brand-deep/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
           <div className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-brand-deep flex items-center">
                       <Award className="w-6 h-6 mr-3 text-brand-primary" />
                       PlayHub Badges
                    </h3>
                    <button 
                      onClick={() => setShowBadgeInfo(false)} 
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                       <X className="w-5 h-5" />
                    </button>
                 </div>
                 
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider leading-relaxed">
                    Complete activities, book courts, and join tournaments to unlock official achievement milestones!
                 </p>

                 <div className="space-y-4">
                    {/* Badge 1 */}
                    <div className="flex items-start space-x-4 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0">
                          🏅
                       </div>
                       <div>
                          <h4 className="text-sm font-black text-brand-deep">The Rookie</h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                             Earned by completing your very first court booking session on PlayHub.
                          </p>
                       </div>
                    </div>

                    {/* Badge 2 */}
                    <div className="flex items-start space-x-4 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0">
                          🤝
                       </div>
                       <div>
                          <h4 className="text-sm font-black text-brand-deep">Team Player</h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                             Earned by participating in a shared booking slot or joining a tournament team.
                          </p>
                       </div>
                    </div>

                    {/* Badge 3 */}
                    <div className="flex items-start space-x-4 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0">
                          🏛️
                       </div>
                       <div>
                          <h4 className="text-sm font-black text-brand-deep">Court Legend</h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                             Unlocks automatically after completing 5 active bookings or tournaments on campus.
                          </p>
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={() => setShowBadgeInfo(false)}
                   className="w-full bg-brand-primary hover:bg-brand-primary/95 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs shadow-md shadow-brand-primary/20 transition-all active:scale-95"
                 >
                    Got It!
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
