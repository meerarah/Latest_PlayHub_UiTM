import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

const COURTS_TO_SEED = [
  // Arena 1
  { arena: "Arena 1", name: "Gelanggang Bola Sepak 5 Sebelah A", sport: "Futsal", capacity: 10, image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80" },
  { arena: "Arena 1", name: "Gelanggang Bola Sepak 5 Sebelah B", sport: "Futsal", capacity: 10, image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80" },
  { arena: "Arena 1", name: "Gelanggang Bola Keranjang A", sport: "Basketball", capacity: 10, image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80" },
  { arena: "Arena 1", name: "Gelanggang Bola Keranjang B", sport: "Basketball", capacity: 10, image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80" },
  
  // Arena 2
  { arena: "Arena 2", name: "Gelanggang Boling Padang Rink 1", sport: "Lawn Bowls", capacity: 4, image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80" },
  { arena: "Arena 2", name: "Gelanggang Boling Padang Rink 2", sport: "Lawn Bowls", capacity: 4, image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80" },
  { arena: "Arena 2", name: "Gelanggang Boling Padang Rink 3", sport: "Lawn Bowls", capacity: 4, image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80" },
  { arena: "Arena 2", name: "Gelanggang Boling Padang Rink 4", sport: "Lawn Bowls", capacity: 4, image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80" },
  { arena: "Arena 2", name: "Gelanggang Boling Padang Rink 5", sport: "Lawn Bowls", capacity: 4, image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80" },
  { arena: "Arena 2", name: "Gelanggang Boling Padang Rink 6", sport: "Lawn Bowls", capacity: 4, image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80" },
  { arena: "Arena 2", name: "Gelanggang Boling Padang Rink 7", sport: "Lawn Bowls", capacity: 4, image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80" },

  // Arena 3
  { arena: "Arena 3", name: "Kriket Batting Cage 1", sport: "Cricket", capacity: 4, image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80" },
  { arena: "Arena 3", name: "Kriket Batting Cage 2", sport: "Cricket", capacity: 4, image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80" },
  { arena: "Arena 3", name: "Kriket Batting Cage 3", sport: "Cricket", capacity: 4, image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80" },
  { arena: "Arena 3", name: "Kriket Batting Cage 4", sport: "Cricket", capacity: 4, image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80" },

  // Arena 7
  { arena: "Arena 7", name: "Bola Sepak 5 Sebelah A", sport: "Futsal", capacity: 10, image: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80" },
  { arena: "Arena 7", name: "Bola Sepak 5 Sebelah B", sport: "Futsal", capacity: 10, image: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80" },

  // Arena 6
  { arena: "Arena 6", name: "Gelanggang Badminton A", sport: "Badminton", capacity: 4, image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80" },
  { arena: "Arena 6", name: "Gelanggang Badminton B", sport: "Badminton", capacity: 4, image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80" },
  { arena: "Arena 6", name: "Gelanggang Badminton C", sport: "Badminton", capacity: 4, image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80" },
  { arena: "Arena 6", name: "Gelanggang Badminton D", sport: "Badminton", capacity: 4, image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80" },
];

const BADGES_TO_SEED = [
  { id: "badge_rookie", badgename: "The Rookie", image_icon: "🏅", description: "Completed your first session!", type: "achievement" },
  { id: "badge_team", badgename: "Team Player", image_icon: "🤝", description: "Joined a shared session.", type: "social" },
  { id: "badge_legend", badgename: "Court Legend", image_icon: "🏛️", description: "Completed 5 sessions.", type: "loyalty" }
];

export const initializeSystem = async (forceReset = false) => {
  try {
    const courtsRef = collection(db, "courts");
    
    if (forceReset) {
      // Clear existing courts (only when explicitly requested by admin reset)
      const courtSnap = await getDocs(courtsRef);
      for (const docRef of courtSnap.docs) {
        await deleteDoc(docRef.ref);
      }

      // Seed all Courts
      for (const court of COURTS_TO_SEED) {
        await addDoc(courtsRef, court);
      }
    } else {
      // Safe, idempotent seeding (check if court already exists before adding)
      const courtSnap = await getDocs(courtsRef);
      const existingKeys = new Set(
        courtSnap.docs.map(docRef => {
          const data = docRef.data();
          return `${data.arena || ""}_${data.name || ""}`.trim().toLowerCase();
        })
      );

      for (const court of COURTS_TO_SEED) {
        const key = `${court.arena || ""}_${court.name || ""}`.trim().toLowerCase();
        if (!existingKeys.has(key)) {
          await addDoc(courtsRef, court);
        }
      }
    }

    // Seed Badges (using fixed document IDs, always idempotent)
    for (const badge of BADGES_TO_SEED) {
      const { id, ...badgeData } = badge;
      await setDoc(doc(db, "Badge", id), badgeData);
    }

    return { success: true, message: "Successfully seeded courts and badges!" };
  } catch (error) {
    console.error("Error initializing system:", error);
    return { success: false, message: "Seeding failed: " + error.message };
  }
};
