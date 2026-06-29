import { db } from "./lib/firebase.js";
import { collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";

const seedCourts = async () => {
  // First, clear existing courts to avoid duplicates/orphans
  try {
    const querySnapshot = await getDocs(collection(db, "courts"));
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log("Cleared existing courts.");
  } catch (error) {
    console.error("Error clearing courts:", error);
  }

  const courts = [
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

  for (const court of courts) {
    try {
      await addDoc(collection(db, "courts"), court);
      console.log(`Seeded: ${court.arena} - ${court.name}`);
    } catch (e) {
      console.error("Error seeding:", e);
    }
  }
  console.log("Seeding complete! You can press Ctrl+C to exit if it hangs.");
};

seedCourts();
