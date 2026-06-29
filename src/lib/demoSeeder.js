import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where, doc, setDoc, deleteDoc } from "firebase/firestore";

const BADGES_TO_SEED = [
  { id: "badge_rookie", badgename: "The Rookie", image_icon: "🏅", description: "Completed your first session!", type: "achievement" },
  { id: "badge_team", badgename: "Team Player", image_icon: "🤝", description: "Joined a shared session.", type: "social" },
  { id: "badge_legend", badgename: "Court Legend", image_icon: "🏛️", description: "Completed 5 sessions.", type: "loyalty" }
];

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
];

export const seedDemoData = async (studentId) => {
  try {
    console.log("Starting demo data seeding for student ID:", studentId);

    // 1. Seed Badges collection (using fixed document IDs to easily reference them)
    for (const badge of BADGES_TO_SEED) {
      const { id, ...badgeData } = badge;
      await setDoc(doc(db, "Badge", id), badgeData);
    }
    console.log("Badges seeded/verified.");

    // 2. Seed Courts collection (clear and rebuild to restore all courts)
    const courtsSnap = await getDocs(collection(db, "courts"));
    for (const doc of courtsSnap.docs) {
      await deleteDoc(doc.ref);
    }
    for (const court of COURTS_TO_SEED) {
      await addDoc(collection(db, "courts"), court);
    }
    console.log("Default courts seeded.");

    // 3. Create past sport events (to generate certificates and past timeline)
    const pastEvents = [
      {
        sportname: "Inter-Faculty Futsal Friendly",
        venue: "Gelanggang Bola Sepak A",
        date: "2026-05-12",
        time: "17:00",
        maxplayers: 10,
        difficultylevel: "Intermediate",
        type: "event"
      },
      {
        sportname: "UiTM Badminton Open Session",
        venue: "Gelanggang Badminton 1",
        date: "2026-05-20",
        time: "20:00",
        maxplayers: 4,
        difficultylevel: "Beginner",
        type: "shared_session"
      },
      {
        sportname: "Campus Basketball Challenge",
        venue: "Gelanggang Bola Keranjang A",
        date: "2026-06-02",
        time: "16:00",
        maxplayers: 10,
        difficultylevel: "Advanced",
        type: "event"
      }
    ];

    const seededPastEventIds = [];
    for (const ev of pastEvents) {
      // Check if this event already exists to avoid duplication
      const q = query(collection(db, "Sport_event"), where("sportname", "==", ev.sportname), where("date", "==", ev.date));
      const snap = await getDocs(q);
      if (snap.empty) {
        const docRef = await addDoc(collection(db, "Sport_event"), ev);
        seededPastEventIds.push(docRef.id);
      } else {
        seededPastEventIds.push(snap.docs[0].id);
      }
    }
    console.log("Past sport events seeded/verified:", seededPastEventIds);

    // 4. Create completed registrations for these past events for the student
    for (const sportId of seededPastEventIds) {
      const q = query(collection(db, "Registration"), where("sportid", "==", sportId), where("studentid", "==", studentId));
      const snap = await getDocs(q);
      if (snap.empty) {
        await addDoc(collection(db, "Registration"), {
          sportid: sportId,
          studentid: studentId,
          status: "completed",
          completedAt: new Date()
        });
      }
    }
    console.log("Past registrations (certificates) seeded.");

    // 5. Award badges to student in Student_Badge collection
    const badgesToAward = ["badge_rookie", "badge_team", "badge_legend"];
    for (const badgeId of badgesToAward) {
      const q = query(collection(db, "Student_Badge"), where("badgeid", "==", badgeId), where("studentid", "==", studentId));
      const snap = await getDocs(q);
      if (snap.empty) {
        await addDoc(collection(db, "Student_Badge"), {
          badgeid: badgeId,
          studentid: studentId,
          awardedAt: new Date()
        });
      }
    }
    console.log("Milestone badges awarded.");

    // 6. Create 1 upcoming event & registration so calendar has an active event
    const upcomingEvent = {
      sportname: "Next-Gen Volleyball Friendly",
      venue: "Gelanggang Bola Sepak A",
      date: "2026-06-15",
      time: "18:00",
      maxplayers: 12,
      difficultylevel: "Beginner",
      type: "shared_session"
    };

    const upcomingQ = query(collection(db, "Sport_event"), where("sportname", "==", upcomingEvent.sportname), where("date", "==", upcomingEvent.date));
    const upcomingSnap = await getDocs(upcomingQ);
    let upcomingId = "";
    if (upcomingSnap.empty) {
      const docRef = await addDoc(collection(db, "Sport_event"), upcomingEvent);
      upcomingId = docRef.id;
    } else {
      upcomingId = upcomingSnap.docs[0].id;
    }

    const regQ = query(collection(db, "Registration"), where("sportid", "==", upcomingId), where("studentid", "==", studentId));
    const regSnap = await getDocs(regQ);
    if (regSnap.empty) {
      await addDoc(collection(db, "Registration"), {
        sportid: upcomingId,
        studentid: studentId,
        status: "confirmed"
      });
    }
    console.log("Upcoming event & registration seeded.");

    return { success: true };
  } catch (error) {
    console.error("Error seeding demo data:", error);
    throw error;
  }
};
