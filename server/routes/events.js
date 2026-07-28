import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET dashboard stats for Admin
router.get('/stats', async (req, res) => {
  try {
    const [uRows] = await pool.query('SELECT COUNT(*) AS count FROM users');
    const [eRows] = await pool.query("SELECT COUNT(*) AS count FROM Sport_event WHERE status != 'rejected'");
    const [fRows] = await pool.query('SELECT COUNT(*) AS count FROM feedbacks');
    
    res.json({
      users: (uRows && uRows[0]) ? uRows[0].count : 0,
      events: (eRows && eRows[0]) ? eRows[0].count : 0,
      feedbacks: (fRows && fRows[0]) ? fRows[0].count : 0
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message || 'Database error fetching dashboard stats' });
  }
});

// GET all sports events / bookings (supports optional filters)
router.get('/', async (req, res) => {
  const { type, courtID, date, status } = req.query;
  try {
    let queryStr = `
      SELECT se.sportID AS id, se.sportname, se.venue, se.date, se.time, se.maxplayers, se.currentPlayers, 
             se.difficultylevel, se.createdByID AS adminid, se.createdByID AS studentId, se.createdByID AS studentid, 
             se.type, se.proofUrl, se.slot, se.phoneNumber, se.courtID AS courtId, se.courtID AS courtid, se.status, se.createdAt,
             COALESCE(u.fullname, 'Unknown Student') AS studentName
      FROM Sport_event se
      LEFT JOIN users u ON se.createdByID = u.id
    `;
    let params = [];
    let conditions = [];

    if (type) {
      const typeList = type.split(',');
      conditions.push(`type IN (${typeList.map(() => '?').join(',')})`);
      params.push(...typeList);
    }
    if (courtID) {
      conditions.push('courtID = ?');
      params.push(courtID);
    }
    if (date) {
      conditions.push('date = ?');
      params.push(date);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      queryStr += ' WHERE ' + conditions.join(' AND ');
    }

    queryStr += ' ORDER BY createdAt DESC';

    const [rows] = await pool.query(queryStr, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching sports events:', error);
    res.status(500).json({ error: 'Database error fetching sports events' });
  }
});

// POST create a new event or court booking
router.post('/', async (req, res) => {
  const { 
    sportname, venue, date, time, maxplayers, currentPlayers, 
    difficultylevel, adminid, studentid, type, proofUrl, slot, phoneNumber, courtid, status,
    studentName, matrixId
  } = req.body;

  if (!sportname || !venue || !date || !type) {
    return res.status(400).json({ error: 'Missing required event fields' });
  }

  // Save creator ID (either admin or student)
  const creatorID = adminid || studentid || null;

  try {
    if (creatorID) {
      // Auto-upsert user record to prevent foreign key constraint failure
      await pool.query(
        `INSERT INTO users (id, fullname, email, role) VALUES (?, ?, ?, 'student')
         ON DUPLICATE KEY UPDATE fullname = VALUES(fullname)`,
        [creatorID, studentName || 'Student', `${creatorID}@student.uitm.edu.my`]
      );
      if (matrixId) {
        await pool.query(
          `INSERT INTO students (userID, matrixID, phoneNumber) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE matrixID = VALUES(matrixID), phoneNumber = VALUES(phoneNumber)`,
          [creatorID, matrixId, phoneNumber || null]
        );
      }
    }

    const [result] = await pool.query(
      `INSERT INTO Sport_event 
       (sportname, venue, date, time, maxplayers, currentPlayers, difficultylevel, createdByID, type, proofUrl, slot, phoneNumber, courtID, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sportname,
        venue,
        date,
        time || 'TBA',
        maxplayers || 10,
        currentPlayers || 0,
        difficultylevel || 'Beginner',
        creatorID,
        type,
        proofUrl || null,
        slot || null,
        phoneNumber || null,
        courtid || null,
        status || 'approved'
      ]
    );

    res.status(201).json({
      id: result.insertId,
      sportname,
      venue,
      date,
      type,
      status: status || 'approved'
    });
  } catch (error) {
    console.error('Error creating sport event/booking:', error);
    res.status(500).json({ error: error.message || 'Database error creating event/booking' });
  }
});

// PUT update event booking status (for private bookings)
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await pool.query('UPDATE Sport_event SET status = ? WHERE sportID = ?', [status, id]);
    res.json({ message: 'Event status updated successfully' });
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ error: 'Database error updating event status' });
// PUT update full event details (admin edit)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { sportname, venue, date, slot, maxplayers, difficultylevel, status } = req.body;
  try {
    await pool.query(
      `UPDATE Sport_event 
       SET sportname = COALESCE(?, sportname),
           venue = COALESCE(?, venue),
           date = COALESCE(?, date),
           slot = COALESCE(?, slot),
           maxplayers = COALESCE(?, maxplayers),
           difficultylevel = COALESCE(?, difficultylevel),
           status = COALESCE(?, status)
       WHERE sportID = ?`,
      [sportname || null, venue || null, date || null, slot || null, maxplayers || null, difficultylevel || null, status || null, id]
    );
    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Database error updating event' });
  }
});

// DELETE an event / booking
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Sport_event WHERE sportID = ?', [id]);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Database error deleting event' });
  }
});

// GET registrations (participants) for a specific event
router.get('/:id/participants', async (req, res) => {
  const { id } = req.params;
  try {
    const queryStr = `
      SELECT r.registrationID AS id, r.sportID AS sportid, r.studentID AS studentId, r.studentID AS studentid, 
             r.participantCount, r.proofUrl, r.status, r.timestamp,
             COALESCE(u.fullname, 'Unknown Student') AS studentName,
             COALESCE(u.email, 'N/A') AS email,
             COALESCE(s.matrixID, 'N/A') AS matrixId,
             COALESCE(s.residencyType, 'College') AS residencyType,
             COALESCE(s.phoneNumber, 'N/A') AS phoneNumber
      FROM Registration r
      LEFT JOIN users u ON r.studentID = u.id
      LEFT JOIN students s ON r.studentID = s.userID
      WHERE r.sportID = ?
    `;
    const [rows] = await pool.query(queryStr, [id]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching event participants:', error);
    res.status(500).json({ error: 'Database error fetching event participants' });
  }
});

// POST join a sport event (create Registration)
router.post('/:id/join', async (req, res) => {
  const { id } = req.params;
  const { studentId, participantCount, proofUrl, status } = req.body;

  if (!studentId) {
    return res.status(400).json({ error: 'Missing studentId parameter' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Auto-upsert user record to prevent foreign key constraint failure
    if (studentId) {
      await connection.query(
        `INSERT INTO users (id, fullname, email, role) VALUES (?, 'Student User', ?, 'student')
         ON DUPLICATE KEY UPDATE id = id`,
        [studentId, `${studentId}@student.uitm.edu.my`]
      );
    }

    // Check if registration already exists
    const [existing] = await connection.query(
      'SELECT * FROM Registration WHERE sportID = ? AND studentID = ?',
      [id, studentId]
    );
    
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ error: 'You have already registered for this session.' });
    }

    // 1. Insert registration record
    const [result] = await connection.query(
      'INSERT INTO Registration (sportID, studentID, participantCount, proofUrl, status) VALUES (?, ?, ?, ?, ?)',
      [id, studentId, participantCount || 1, proofUrl || null, status || 'pending']
    );

    // 2. If status is approved, update currentPlayers count in Sport_event
    if (status === 'approved' || status === 'confirmed') {
      await connection.query(
        'UPDATE Sport_event SET currentPlayers = currentPlayers + 1 WHERE sportID = ?',
        [id]
      );
    }

    await connection.commit();
    res.status(201).json({
      id: result.insertId,
      sportid: id,
      studentid: studentId,
      status: status || 'pending'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error joining event:', error);
    res.status(500).json({ error: 'Database error joining event' });
  } finally {
    connection.release();
  }
});

// PUT update participant status (for event registrations)
router.put('/registrations/:regId/status', async (req, res) => {
  const { regId } = req.params;
  const { status, studentId } = req.body; // studentId is used for badge check if status is 'completed'

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get current registration details
    const [[reg]] = await connection.query('SELECT sportID, status FROM Registration WHERE registrationID = ?', [regId]);
    if (!reg) {
      connection.release();
      return res.status(404).json({ error: 'Registration not found' });
    }

    // 1. Update status
    await connection.query('UPDATE Registration SET status = ? WHERE registrationID = ?', [status, regId]);

    // 2. Adjust currentPlayers if status changed to approved
    if (status === 'approved' && reg.status !== 'approved') {
      await connection.query('UPDATE Sport_event SET currentPlayers = currentPlayers + 1 WHERE sportID = ?', [reg.sportID]);
    } else if (status === 'rejected' && reg.status === 'approved') {
      await connection.query('UPDATE Sport_event SET currentPlayers = GREATEST(0, currentPlayers - 1) WHERE sportID = ?', [reg.sportID]);
    }

    // 3. Award "The Rookie" badge if status is 'completed' and eligible
    if (status === 'completed' && studentId) {
      // Ensure "The Rookie" badge exists
      let [[badge]] = await connection.query('SELECT badgeID FROM Badge WHERE badgeName = "The Rookie"');
      if (!badge) {
        const [badgeResult] = await connection.query(
          'INSERT INTO Badge (badgeName, imageIcon, description, type) VALUES ("The Rookie", "Award", "Completed your first event booking", "achievement")'
        );
        badge = { badgeID: badgeResult.insertId };
      }

      // Check if student already has this badge
      const [[hasBadge]] = await connection.query(
        'SELECT studentBadgeID FROM Student_Badge WHERE studentID = ? AND badgeID = ?',
        [studentId, badge.badgeID]
      );

      if (!hasBadge) {
        // Insert student badge
        await connection.query(
          'INSERT INTO Student_Badge (studentID, badgeID) VALUES (?, ?)',
          [studentId, badge.badgeID]
        );
        console.log(`Badge 'The Rookie' awarded to student ${studentId}`);
      }
    }

    await connection.commit();
    res.json({ message: 'Registration status updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating participant status:', error);
    res.status(500).json({ error: 'Database error updating participant status' });
  } finally {
    connection.release();
  }
});

// GET registrations (private bookings + joined sessions) for a student (for certificates / schedule)
router.get('/student/:studentId/registrations', async (req, res) => {
  const { studentId } = req.query;
  const actualId = req.params.studentId || studentId;
  try {
    const queryStr = `
      SELECT r.registrationID AS id, r.sportID AS sportid, r.studentID AS studentid, 
             r.participantCount, r.proofUrl, r.status, r.timestamp,
             se.sportname, se.venue, se.date, se.time, se.type AS eventType, se.slot
      FROM Registration r
      JOIN Sport_event se ON r.sportID = se.sportID
      WHERE r.studentID = ?
    `;
    const [rows] = await pool.query(queryStr, [actualId]);
    
    const mapped = rows.map(r => ({
      id: r.id,
      sportid: r.sportid,
      studentid: r.studentid,
      participantCount: r.participantCount,
      proofUrl: r.proofUrl,
      status: r.status,
      timestamp: r.timestamp,
      Sport_event: {
        sportname: r.sportname,
        venue: r.venue,
        date: r.date,
        time: r.time,
        type: r.eventType,
        slot: r.slot
      }
    }));
    
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching student event registrations:', error);
    res.status(500).json({ error: 'Database error fetching student registrations' });
  }
});

export default router;
