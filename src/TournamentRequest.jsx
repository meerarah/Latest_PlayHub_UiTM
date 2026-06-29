import { useState } from "react";
import { Trophy, Send, Loader2, Calendar as CalendarIcon, Users, FileText } from "lucide-react";
import { db } from "./lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function TournamentRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    sport: "Futsal",
    preferredDate: new Date().toISOString().split("T")[0],
    teamsCount: 4,
    description: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please sign in first.");

    setLoading(true);
    try {
      await addDoc(collection(db, "Tournament_Requests"), {
        ...formData,
        studentId: user.uid,
        status: "pending", // admin needs to review and key in
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-6 animate-in zoom-in-95">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <Trophy className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-brand-deep mb-2">Request Sent!</h2>
        <p className="text-slate-500 mb-8">
          The Admin will review your request and key in the tournament. You'll be notified soon.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-brand-primary text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:bg-brand-primary/90 transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-black text-brand-deep tracking-tight">Request Tournament</h2>
        <p className="text-sm text-slate-500">Fill this form to request a tournament or match. Admin will organize it and generate certificates.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
        
        {/* Sport Selection */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary ml-2 mb-2 block">Sport</label>
          <select 
            value={formData.sport}
            onChange={(e) => setFormData({...formData, sport: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-slate-700 appearance-none"
          >
            <option value="Futsal">Futsal</option>
            <option value="Basketball">Basketball</option>
            <option value="Lawn Bowls">Lawn Bowls</option>
            <option value="Cricket">Cricket</option>
          </select>
        </div>

        {/* Date Selection */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary ml-2 mb-2 block">Preferred Date</label>
          <div className="relative">
             <CalendarIcon className="w-5 h-5 absolute left-4 top-4 text-slate-400" />
             <input 
              type="date" 
              min={new Date().toISOString().split('T')[0]}
              value={formData.preferredDate}
              onChange={(e) => setFormData({...formData, preferredDate: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-slate-700"
             />
          </div>
        </div>

        {/* Teams Count */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary ml-2 mb-2 block">Expected Teams/Participants</label>
          <div className="relative">
             <Users className="w-5 h-5 absolute left-4 top-4 text-slate-400" />
             <input 
              type="number" 
              min="2"
              max="50"
              value={formData.teamsCount}
              onChange={(e) => setFormData({...formData, teamsCount: parseInt(e.target.value)})}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-slate-700"
             />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary ml-2 mb-2 block">Additional Details</label>
          <div className="relative">
             <FileText className="w-5 h-5 absolute left-4 top-4 text-slate-400" />
             <textarea 
              rows="3"
              placeholder="E.g., Inter-faculty match, requires referee..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-slate-700 resize-none"
             />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-brand-primary text-white font-black py-5 rounded-2xl shadow-xl shadow-brand-primary/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
            <>
              <span>Submit Request</span>
              <Send className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
