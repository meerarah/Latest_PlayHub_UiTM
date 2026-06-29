import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyACjXH8UspF4wVaoREVIqd_UExSjp7k6Sk",
  authDomain: "playhub-5a422.firebaseapp.com",
  projectId: "playhub-5a422",
  storageBucket: "playhub-5a422.appspot.com",
  messagingSenderId: "550025575374",
  appId: "1:550025575374:web:b87b0f4281726925d1099f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Pusat Sukan UiTM Shah Alam area
const BASE_LAT = 3.0697;
const BASE_LNG = 101.5037;

async function updateCoords() {
  console.log("Updating court coordinates to UiTM Shah Alam...");
  const courtsRef = collection(db, "courts");
  const snap = await getDocs(courtsRef);
  
  let i = 0;
  for (const d of snap.docs) {
    const courtRef = doc(db, "courts", d.id);
    // Add a tiny offset so markers aren't exactly on top of each other
    await updateDoc(courtRef, {
      lat: BASE_LAT + (i * 0.0001),
      lng: BASE_LNG + (i * 0.0001)
    });
    console.log(`Updated: ${d.data().name}`);
    i++;
  }
  console.log("All courts updated!");
  process.exit(0);
}

updateCoords().catch(err => {
  console.error(err);
  process.exit(1);
});
