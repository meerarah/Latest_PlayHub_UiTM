import fs from 'fs';
import path from 'path';
import pool from './db.js';

async function init() {
  try {
    console.log('🔄 Starting database initialization...');
    
    // Read the schema file
    const schemaPath = path.join(process.cwd(), '../schema_mysql.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Clean SQL (remove single-line comments)
    schemaSql = schemaSql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
      
    // Split statements by semicolon
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
      
    for (let statement of statements) {
      // Skip CREATE DATABASE and USE because the pool database is already configured,
      // and cloud SQL hosts do not allow changing databases dynamically.
      if (
        statement.toUpperCase().startsWith('CREATE DATABASE') || 
        statement.toUpperCase().startsWith('USE ')
      ) {
        console.log(`⏩ Skipping: ${statement.substring(0, 30)}...`);
        continue;
      }
      console.log(`Executing statement: ${statement.substring(0, 60)}...`);
      await pool.query(statement);
    }
    console.log('✅ Database schema tables created successfully.');
    
    // Seed courts only if empty
    const [courtRows] = await pool.query('SELECT COUNT(*) as count FROM courts');
    if (courtRows[0].count === 0) {
      console.log('🌱 Seeding courts...');
      const courts = [
        { arena: "Arena 1", name: "Gelanggang Bola Sepak 5 Sebelah A", sport: "Futsal", capacity: 10, image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80" },
        { arena: "Arena 1", name: "Gelanggang Bola Sepak 5 Sebelah B", sport: "Futsal", capacity: 10, image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80" },
        { arena: "Arena 1", name: "Gelanggang Bola Keranjang A", sport: "Basketball", capacity: 10, image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80" },
        { arena: "Arena 1", name: "Gelanggang Bola Keranjang B", sport: "Basketball", capacity: 10, image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80" },
        
        { arena: "Arena 2", name: "Gelanggang Boling Padang Rink 1", sport: "Lawn Bowls", capacity: 4, image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80" },
        { arena: "Arena 2", name: "Gelanggang Boling Padang Rink 2", sport: "Lawn Bowls", capacity: 4, image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80" },
        { arena: "Arena 2", name: "Gelanggang Boling Padang Rink 3", sport: "Lawn Bowls", capacity: 4, image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80" },
        { arena: "Arena 2", name: "Gelanggang Boling Padang Rink 4", sport: "Lawn Bowls", capacity: 4, image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80" },
        { arena: "Arena 2", name: "Gelanggang Boling Padang Rink 5", sport: "Lawn Bowls", capacity: 4, image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80" },
        { arena: "Arena 2", name: "Gelanggang Boling Padang Rink 6", sport: "Lawn Bowls", capacity: 4, image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80" },
        { arena: "Arena 2", name: "Gelanggang Boling Padang Rink 7", sport: "Lawn Bowls", capacity: 4, image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80" },

        { arena: "Arena 3", name: "Kriket Batting Cage 1", sport: "Cricket", capacity: 4, image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80" },
        { arena: "Arena 3", name: "Kriket Batting Cage 2", sport: "Cricket", capacity: 4, image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80" },
        { arena: "Arena 3", name: "Kriket Batting Cage 3", sport: "Cricket", capacity: 4, image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80" },
        { arena: "Arena 3", name: "Kriket Batting Cage 4", sport: "Cricket", capacity: 4, image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80" },

        { arena: "Arena 7", name: "Bola Sepak 5 Sebelah A", sport: "Futsal", capacity: 10, image: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80" },
        { arena: "Arena 7", name: "Bola Sepak 5 Sebelah B", sport: "Futsal", capacity: 10, image: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80" },

        { arena: "Arena 6", name: "Gelanggang Badminton A", sport: "Badminton", capacity: 4, image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80" },
        { arena: "Arena 6", name: "Gelanggang Badminton B", sport: "Badminton", capacity: 4, image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80" },
        { arena: "Arena 6", name: "Gelanggang Badminton C", sport: "Badminton", capacity: 4, image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80" },
        { arena: "Arena 6", name: "Gelanggang Badminton D", sport: "Badminton", capacity: 4, image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80" }
      ];
      for (const court of courts) {
        await pool.query(
          'INSERT INTO courts (arena, name, sport, capacity, image) VALUES (?, ?, ?, ?, ?)',
          [court.arena, court.name, court.sport, court.capacity, court.image]
        );
      }
      console.log('✅ Courts seeded.');
    } else {
      console.log('⏩ Courts already seeded.');
    }

    // Seed Tournaments only if empty
    const [tRows] = await pool.query('SELECT COUNT(*) as count FROM Tournaments');
    if (tRows[0].count === 0) {
      console.log('🌱 Seeding tournaments...');
      const tournaments = [
        { name: "Piala Dekan Futsal Tournament 2026", sport: "Futsal", date: "2026-08-20", time: "08:00 AM - 05:00 PM", venue: "Arena 1 (Gelanggang Futsal)", maxTeams: 8, description: "Official inter-faculty futsal championship. Register your team now and win cash prizes!" },
        { name: "UiTM Badminton Doubles Open", sport: "Badminton", date: "2026-09-12", time: "09:00 AM - 04:00 PM", venue: "Arena 6 (Gelanggang Badminton)", maxTeams: 16, description: "Open doubles tournament. Compete with top campus teams. Certificates provided for all participants!" },
        { name: "Kejohanan Boling Padang UiTM 2026", sport: "Lawn Bowls", date: "2026-07-18", time: "08:30 AM - 05:00 PM", venue: "Arena 2 (Gelanggang Boling Padang)", maxTeams: 6, description: "Official Lawn Bowls Inter-Team Tournament at Arena 2." }
      ];
      for (const t of tournaments) {
        await pool.query(
          "INSERT INTO Tournaments (name, sport, date, time, venue, maxTeams, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [t.name, t.sport, t.date, t.time, t.venue, t.maxTeams, t.description, "active"]
        );
      }
      console.log('✅ Tournaments seeded.');
    } else {
      console.log('⏩ Tournaments already seeded.');
    }

    // Seed Badges only if empty
    const [badgeRows] = await pool.query('SELECT COUNT(*) as count FROM Badge');
    if (badgeRows[0].count === 0) {
      console.log('🌱 Seeding badges...');
      const badges = [
        { badgeName: "The Rookie", imageIcon: "🏅", description: "Completed your first session!", type: "achievement" },
        { badgeName: "Team Player", imageIcon: "🤝", description: "Joined a shared session.", type: "social" },
        { badgeName: "Court Legend", imageIcon: "🏛️", description: "Completed 5 sessions.", type: "loyalty" }
      ];
      for (const b of badges) {
        await pool.query(
          'INSERT INTO Badge (badgeName, imageIcon, description, type) VALUES (?, ?, ?, ?)',
          [b.badgeName, b.imageIcon, b.description, b.type]
        );
      }
      console.log('✅ Badges seeded.');
    } else {
      console.log('⏩ Badges already seeded.');
    }

    // Seed sample Shared Sessions for upcoming dates if Sport_event is empty
    const [eventRows] = await pool.query('SELECT COUNT(*) as count FROM Sport_event');
    if (eventRows[0].count === 0) {
      console.log('🌱 Seeding sample shared sessions...');
      const d1 = new Date();
      d1.setDate(d1.getDate() + 2);
      const date1 = d1.toISOString().split('T')[0];

      const d2 = new Date();
      d2.setDate(d2.getDate() + 5);
      const date2 = d2.toISOString().split('T')[0];

      const sharedSessions = [
        { sportname: "Futsal", venue: "Gelanggang Bola Sepak 5 Sebelah A", date: date1, time: "17:00", maxplayers: 10, currentPlayers: 3, difficultylevel: "Intermediate", type: "shared_session", status: "approved", slot: 17, courtID: 1 },
        { sportname: "Futsal", venue: "Gelanggang Bola Sepak 5 Sebelah A", date: date1, time: "18:00", maxplayers: 10, currentPlayers: 3, difficultylevel: "Intermediate", type: "shared_session", status: "approved", slot: 18, courtID: 1 },
        { sportname: "Badminton", venue: "Gelanggang Badminton A", date: date2, time: "20:00", maxplayers: 4, currentPlayers: 2, difficultylevel: "Beginner", type: "shared_session", status: "approved", slot: 20, courtID: 19 },
        { sportname: "Badminton", venue: "Gelanggang Badminton A", date: date2, time: "21:00", maxplayers: 4, currentPlayers: 2, difficultylevel: "Beginner", type: "shared_session", status: "approved", slot: 21, courtID: 19 }
      ];

      for (const s of sharedSessions) {
        await pool.query(
          `INSERT INTO Sport_event (sportname, venue, date, time, maxplayers, currentPlayers, difficultylevel, type, status, slot, courtID)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.sportname, s.venue, s.date, s.time, s.maxplayers, s.currentPlayers, s.difficultylevel, s.type, s.status, s.slot, s.courtID]
        );
      }
      console.log('✅ Shared sessions seeded.');
    } else {
      console.log('⏩ Shared sessions already seeded.');
    }

    console.log('🎉 Database initialization complete and fully linked!');
    process.exit(0);
  } catch (error) {
    console.error('⚠️ Database initialization warning (DB may be spinning up):', error.message);
    process.exit(0);
  }
}

init();
