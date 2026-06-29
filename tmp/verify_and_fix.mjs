import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyACjXH8UspF4wVaoREVIqd_UExSjp7k6Sk",
  authDomain: "playhub-5a422.firebaseapp.com",
  projectId: "playhub-5a422",
  storageBucket: "playhub-5a422.firebasestorage.app",
  messagingSenderId: "550025575374",
  appId: "1:550025575374:web:b87b0f4281726925d1099f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BADGES_TO_SEED = [
  { badgename: "The Rookie", image_icon: "🏅", description: "Completed your first session!", type: "achievement" },
  { badgename: "Team Player", image_icon: "🤝", description: "Joined a shared session.", type: "social" },
  { badgename: "Court Legend", image_icon: "🏛️", description: "Completed 5 sessions.", type: "loyalty" }
];

async function seedNow() {
  console.log("Seeding Badges directly...");
  const badgesRef = collection(db, "Badge");
  const snap = await getDocs(badgesRef);
  
  if (snap.size > 0) {
    console.log("Badges already exist. Skipping.");
  } else {
    for (const badge of BADGES_TO_SEED) {
      await addDoc(badgesRef, badge);
      console.log(`Seeded: ${badge.badgename}`);
    }
    console.log("Seeding complete!");
  }
}

seedNow().catch(console.error);
