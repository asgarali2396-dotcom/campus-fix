/**
 * CampusFix - Relational Database Management System (RDBMS) Engine
 * Academic DBMS Mini Project Implementation
 * Guided by: Prof. P. R. Nerkar
 * Team: Sarth Santosh Pande (28), Takshak Rahul Sirsat (30), Manthan Vinod Dhamal (35), Ali Asgar Yusuf Ali (40), Rohit Sudhir Karpe (53)
 */

class CampusDBMS {
  constructor() {
    this.STORAGE_KEY = 'campusfix_rdbms_v3';
    // Graceful migration from older storage key if present
    if (!localStorage.getItem(this.STORAGE_KEY) && localStorage.getItem('campuscare_rdbms_v3')) {
      localStorage.setItem(this.STORAGE_KEY, localStorage.getItem('campuscare_rdbms_v3'));
    }
    this.sqlListeners = [];
    this.init();
  }

  // Subscribe to real-time SQL execution events
  onSQLExecuted(callback) {
    this.sqlListeners.push(callback);
  }

  notifySQL(sql, type = 'QUERY', rowsAffected = 0, durationMs = 1.2) {
    const event = {
      sql,
      type,
      rowsAffected,
      durationMs: (Math.random() * 2 + 0.8).toFixed(2),
      timestamp: new Date().toLocaleTimeString(),
      isoTime: new Date().toISOString()
    };
    this.sqlListeners.forEach((cb) => {
      try { cb(event); } catch (e) { console.error(e); }
    });
  }

  init() {
    const existing = localStorage.getItem(this.STORAGE_KEY);
    if (!existing) {
      this.resetDatabase();
    } else {
      try {
        this.tables = JSON.parse(existing);
        if (!this.tables || !this.tables.complaints || !this.tables.departments || this.tables.complaints.length === 0) {
          console.warn('[DBMS] Table data incomplete or empty in storage. Re-seeding...');
          this.resetDatabase();
        }
      } catch (e) {
        console.error('Failed to parse existing DB. Resetting to seed data.', e);
        this.resetDatabase();
      }
    }
  }

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tables));
  }

  resetDatabase() {
    console.log('[DBMS] Seeding clean relational database...');
    this.tables = this.getSeedData();
    this.save();
    this.notifySQL('-- DATABASE INITIALIZED WITH DEFAULT SEED SCHEMA AND RELATIONAL CONSTRAINTS', 'DDL', 0, 4.5);
  }

  getSeedData() {
    const now = Date.now();
    const day = 86400000;
    const hour = 3600000;

    return {
      // 1. DEPARTMENTS TABLE
      departments: [
        {
          department_id: 1,
          dept_code: 'ELEC',
          dept_name: 'Electrical Maintenance',
          head_name: 'Er. R. K. Joshi',
          contact_email: 'electrical@campus.edu',
          location_block: 'Utility Substation Block E'
        },
        {
          department_id: 2,
          dept_code: 'NETW',
          dept_name: 'IT & Network Infrastructure',
          head_name: 'Prof. S. M. Deshmukh',
          contact_email: 'networking@campus.edu',
          location_block: 'Computer Center 2nd Floor'
        },
        {
          department_id: 3,
          dept_code: 'SANI',
          dept_name: 'Sanitation & Housekeeping',
          head_name: 'Mrs. Rekha Jadhav',
          contact_email: 'sanitation@campus.edu',
          location_block: 'Administrative Basement'
        },
        {
          department_id: 4,
          dept_code: 'CIVL',
          dept_name: 'Civil, Carpentry & Facilities',
          head_name: 'Er. Anand Gaikwad',
          contact_email: 'civil@campus.edu',
          location_block: 'Workshop Building Bay 3'
        },
        {
          department_id: 5,
          dept_code: 'LABS',
          dept_name: 'Laboratory Equipment & Tech',
          head_name: 'Dr. Sanjay Kulkarni',
          contact_email: 'labsupport@campus.edu',
          location_block: 'Science & Engineering Complex'
        }
      ],

      // 2. CATEGORIES TABLE (Foreign Key -> departments.department_id)
      categories: [
        {
          category_id: 1,
          category_name: 'Electrical & Power Supply',
          department_id: 1,
          sla_hours: 24,
          icon: 'zap',
          description: 'Power cut, spark, socket failure, switchboard fault, fan/light malfunction'
        },
        {
          category_id: 2,
          category_name: 'Campus Wi-Fi & Internet',
          department_id: 2,
          sla_hours: 12,
          icon: 'wifi',
          description: 'Access point outage, LAN port dead, DNS issues, slow bandwidth'
        },
        {
          category_id: 3,
          category_name: 'Plumbing & Water Supply',
          department_id: 3,
          sla_hours: 8,
          icon: 'droplet',
          description: 'Tap leakage, washroom overflow, water cooler failure, drainage blockage'
        },
        {
          category_id: 4,
          category_name: 'Sanitation & Hygiene',
          department_id: 3,
          sla_hours: 6,
          icon: 'sparkles',
          description: 'Uncleaned classroom, dustbin overflow, pest control, sanitizer refill'
        },
        {
          category_id: 5,
          category_name: 'Classroom AV & Projectors',
          department_id: 2,
          sla_hours: 18,
          icon: 'monitor',
          description: 'Projector display glitch, HDMI cable damaged, mic/speaker buzz'
        },
        {
          category_id: 6,
          category_name: 'Civil, Doors & Furniture',
          department_id: 4,
          sla_hours: 48,
          icon: 'tool',
          description: 'Broken desk bench, stuck door latch, cracked glass pane, window lock'
        },
        {
          category_id: 7,
          category_name: 'Laboratory Equipment & Instruments',
          department_id: 5,
          sla_hours: 24,
          icon: 'cpu',
          description: 'Oscilloscope calibration, PC crash in lab, fume hood fan, chemical shower'
        }
      ],

      // 3. USERS TABLE (Roles: ADMIN, STAFF, STUDENT)
      users: [
        // Admin / Guide
        {
          user_id: 1,
          name: 'Prof. P. R. Nerkar',
          email: 'pr.nerkar@campus.edu',
          role: 'ADMIN',
          department_id: null,
          phone: '+91 98220 11223',
          roll_no: null,
          title: 'Project Guide & Campus Chief Administrator',
          avatar: '👨‍🏫'
        },
        // Team Members (Students)
        {
          user_id: 2,
          name: 'Sarth Santosh Pande',
          email: 'sarth.pande@student.campus.edu',
          role: 'STUDENT',
          department_id: null,
          phone: '+91 98341 22334',
          roll_no: '28',
          title: 'Student (Dept. of Comp Sci)',
          avatar: '👨‍🎓'
        },
        {
          user_id: 3,
          name: 'Takshak Rahul Sirsat',
          email: 'takshak.sirsat@student.campus.edu',
          role: 'STUDENT',
          department_id: null,
          phone: '+91 97654 33445',
          roll_no: '30',
          title: 'Student (Dept. of Comp Sci)',
          avatar: '👨‍🎓'
        },
        {
          user_id: 11,
          name: 'Manthan Vinod Dhamal',
          email: 'manthan.dhamal@student.campus.edu',
          role: 'STUDENT',
          department_id: null,
          phone: '+91 98555 44332',
          roll_no: '35',
          title: 'Student (Dept. of Comp Sci)',
          avatar: '👨‍🎓'
        },
        {
          user_id: 4,
          name: 'Ali Ali Asgar Yusuf',
          email: 'ali.yusuf@student.campus.edu',
          role: 'STUDENT',
          department_id: null,
          phone: '+91 99234 44556',
          roll_no: '40',
          title: 'Student (Dept. of Comp Sci)',
          avatar: '👨‍🎓'
        },
        {
          user_id: 5,
          name: 'Rohit Sudhir Karpe',
          email: 'rohit.karpe@student.campus.edu',
          role: 'STUDENT',
          department_id: null,
          phone: '+91 98112 55667',
          roll_no: '53',
          title: 'Student (Dept. of Comp Sci)',
          avatar: '👨‍🎓'
        },
        // Department Maintenance Staff
        {
          user_id: 6,
          name: 'Rajesh Sharma',
          email: 'rajesh.sharma@staff.campus.edu',
          role: 'STAFF',
          department_id: 1, // Electrical
          phone: '+91 94231 66778',
          roll_no: null,
          title: 'Senior Electrician & Substation Tech',
          avatar: '⚡'
        },
        {
          user_id: 7,
          name: 'Amit Verma',
          email: 'amit.verma@staff.campus.edu',
          role: 'STAFF',
          department_id: 2, // IT & Network
          phone: '+91 93221 77889',
          roll_no: null,
          title: 'Campus Network Systems Engineer',
          avatar: '💻'
        },
        {
          user_id: 8,
          name: 'Sunita Devi',
          email: 'sunita.devi@staff.campus.edu',
          role: 'STAFF',
          department_id: 3, // Sanitation
          phone: '+91 92211 88990',
          roll_no: null,
          title: 'Sanitation Supervisor & Facility Care',
          avatar: '🧹'
        },
        {
          user_id: 9,
          name: 'Vikas Patil',
          email: 'vikas.patil@staff.campus.edu',
          role: 'STAFF',
          department_id: 4, // Civil
          phone: '+91 91200 99001',
          roll_no: null,
          title: 'Infrastructure & Carpentry Lead',
          avatar: '🔨'
        },
        {
          user_id: 10,
          name: 'Dr. Sanjay Kulkarni',
          email: 'sanjay.kulkarni@staff.campus.edu',
          role: 'STAFF',
          department_id: 5, // Labs
          phone: '+91 90199 00112',
          roll_no: null,
          title: 'Scientific Instrumentation Tech',
          avatar: '🔬'
        }
      ],

      // 4. COMPLAINTS TABLE (Central Relational Entity)
      complaints: [
        {
          complaint_id: 1,
          ticket_no: 'CMP-2026-001',
          reporter_id: 2, // Sarth Pande
          category_id: 1, // Electrical
          title: 'Ceiling fan making screeching noise & sparking near switch',
          description: 'In classroom 402, the middle ceiling fan regulator is overheating with spark smell when turned to speed 4.',
          location_type: 'Classroom',
          specific_location: 'Academic Complex Block A, Room 402',
          priority: 'High',
          status: 'In Progress',
          assigned_to: 6, // Rajesh Sharma
          created_at: new Date(now - 14 * hour).toISOString(),
          updated_at: new Date(now - 2 * hour).toISOString(),
          resolved_at: null,
          closed_at: null,
          photo_url: 'assets/sample_spark.svg'
        },
        {
          complaint_id: 2,
          ticket_no: 'CMP-2026-002',
          reporter_id: 3, // Takshak Sirsat
          category_id: 2, // Network
          title: 'Hostel Block 3 2nd Floor Wi-Fi Access Point Offline',
          description: 'The Cisco AP LED is blinking amber continuously. Students unable to access college intranet and LMS portal.',
          location_type: 'Hostel',
          specific_location: 'Boys Hostel 3, Corridor 2nd Floor West Wing',
          priority: 'Critical',
          status: 'Assigned',
          assigned_to: 7, // Amit Verma
          created_at: new Date(now - 8 * hour).toISOString(),
          updated_at: new Date(now - 6 * hour).toISOString(),
          resolved_at: null,
          closed_at: null,
          photo_url: 'assets/sample_wifi.svg'
        },
        {
          complaint_id: 3,
          ticket_no: 'CMP-2026-003',
          reporter_id: 4, // Ali Yusuf
          category_id: 3, // Plumbing
          title: 'Water tap leaking continuously in 1st Floor Washroom',
          description: 'High pressure water leak causing pooling near doorway, creating slippery floor safety hazard.',
          location_type: 'Classroom',
          specific_location: 'Main Science Block, Gents Restroom 1st Floor',
          priority: 'Medium',
          status: 'Resolved',
          assigned_to: 8, // Sunita Devi
          created_at: new Date(now - 2 * day).toISOString(),
          updated_at: new Date(now - 5 * hour).toISOString(),
          resolved_at: new Date(now - 5 * hour).toISOString(),
          closed_at: null,
          photo_url: 'assets/sample_leak.svg'
        },
        {
          complaint_id: 4,
          ticket_no: 'CMP-2026-004',
          reporter_id: 5, // Rohit Karpe
          category_id: 5, // Projector
          title: 'Projector in Seminar Hall 1 has pink tint and flickering lamp',
          description: 'Upcoming DBMS guest lecture requires HDMI projection. Current image has bad color distortion and shuts down after 10 mins.',
          location_type: 'Classroom',
          specific_location: 'Auditorium Wing, Seminar Hall 1',
          priority: 'High',
          status: 'Closed',
          assigned_to: 7, // Amit Verma
          created_at: new Date(now - 4 * day).toISOString(),
          updated_at: new Date(now - 1 * day).toISOString(),
          resolved_at: new Date(now - 26 * hour).toISOString(),
          closed_at: new Date(now - 24 * hour).toISOString(),
          photo_url: 'assets/sample_projector.svg'
        },
        {
          complaint_id: 5,
          ticket_no: 'CMP-2026-005',
          reporter_id: 11, // Manthan Dhamal
          category_id: 7, // Lab equipment
          title: 'High-speed centrifuge in Bio/Chemistry Lab vibrating violently',
          description: 'Centrifuge Unit 4 rotor unbalanced warning during semester practicals. Power cut immediately.',
          location_type: 'Laboratory',
          specific_location: 'Research Lab 108, Chemistry Wing',
          priority: 'Critical',
          status: 'Pending',
          assigned_to: null,
          created_at: new Date(now - 1.5 * hour).toISOString(),
          updated_at: new Date(now - 1.5 * hour).toISOString(),
          resolved_at: null,
          closed_at: null,
          photo_url: null
        },
        {
          complaint_id: 6,
          ticket_no: 'CMP-2026-006',
          reporter_id: 3, // Takshak Sirsat
          category_id: 6, // Civil
          title: 'Door handle lock broken on Study Hall Room B',
          description: 'Brass latch mechanism sheared off; door bangs with heavy wind gusts.',
          location_type: 'Library',
          specific_location: 'Central Library, 3rd Floor Quiet Study Hall',
          priority: 'Low',
          status: 'Assigned',
          assigned_to: 9, // Vikas Patil
          created_at: new Date(now - 20 * hour).toISOString(),
          updated_at: new Date(now - 18 * hour).toISOString(),
          resolved_at: null,
          closed_at: null,
          photo_url: null
        }
      ],

      // 5. ASSIGNMENTS TABLE (Relational tracking of staff dispatch)
      assignments: [
        {
          assignment_id: 1,
          complaint_id: 1,
          assigned_by: 1, // Admin
          assigned_to: 6, // Rajesh Sharma
          assigned_at: new Date(now - 12 * hour).toISOString(),
          instructions: 'Inspect regulator and MCB panel on 4th floor immediately before afternoon classes.'
        },
        {
          assignment_id: 2,
          complaint_id: 2,
          assigned_by: 1, // Admin
          assigned_to: 7, // Amit Verma
          assigned_at: new Date(now - 6 * hour).toISOString(),
          instructions: 'Check PoE switch in telecom rack 3B and re-flash firmware if necessary.'
        },
        {
          assignment_id: 3,
          complaint_id: 3,
          assigned_by: 1, // Admin
          assigned_to: 8, // Sunita Devi
          assigned_at: new Date(now - 36 * hour).toISOString(),
          instructions: 'Replace damaged rubber washer and inspect drainage trap.'
        },
        {
          assignment_id: 4,
          complaint_id: 4,
          assigned_by: 1, // Admin
          assigned_to: 7, // Amit Verma
          assigned_at: new Date(now - 3 * day).toISOString(),
          instructions: 'Replace EPSON projector lamp bulb and recalibrate keystone settings.'
        },
        {
          assignment_id: 5,
          complaint_id: 6,
          assigned_by: 1, // Admin
          assigned_to: 9, // Vikas Patil
          assigned_at: new Date(now - 18 * hour).toISOString(),
          instructions: 'Install heavy-duty mortise lock assembly.'
        }
      ],

      // 6. COMPLAINT_UPDATES TABLE (Audit timeline & technician work logs)
      complaint_updates: [
        {
          update_id: 1,
          complaint_id: 1,
          updated_by: 6, // Rajesh Sharma
          old_status: 'Assigned',
          new_status: 'In Progress',
          notes: 'Reached Room 402 with replacement capacitor and stepped electronic regulator. Testing electrical line voltage.',
          created_at: new Date(now - 2 * hour).toISOString()
        },
        {
          update_id: 2,
          complaint_id: 3,
          updated_by: 8, // Sunita Devi
          old_status: 'Assigned',
          new_status: 'In Progress',
          notes: 'Shut main shutoff valve on 1st floor; removed corroded brass spindle.',
          created_at: new Date(now - 18 * hour).toISOString()
        },
        {
          update_id: 3,
          complaint_id: 3,
          updated_by: 8, // Sunita Devi
          old_status: 'In Progress',
          new_status: 'Resolved',
          notes: 'Replaced Teflon tape and new valve gland. Tested under pressure with zero leaks. Sanitized floor area.',
          created_at: new Date(now - 5 * hour).toISOString()
        },
        {
          update_id: 4,
          complaint_id: 4,
          updated_by: 7, // Amit Verma
          old_status: 'In Progress',
          new_status: 'Resolved',
          notes: 'Installed OEM replacement lamp module. Cleaned optical filters and ran 2-hour stress benchmark.',
          created_at: new Date(now - 26 * hour).toISOString()
        }
      ],

      // 7. FEEDBACK TABLE (Student ratings & reviews)
      feedback: [
        {
          feedback_id: 1,
          complaint_id: 4,
          student_id: 5, // Rohit Karpe
          rating: 5,
          comments: 'Extremely quick resolution! Tested presentation yesterday and colors were crisp. Thanks to the IT team!',
          satisfaction_level: 'Highly Satisfied',
          created_at: new Date(now - 24 * hour).toISOString()
        }
      ],

      // 8. ACTIVITY_LOGS TABLE (Master System Audit Trail with SQL executed)
      activity_logs: [
        {
          log_id: 1,
          complaint_id: 4,
          user_id: 5,
          action_type: 'FEEDBACK_SUBMITTED',
          sql_executed: "INSERT INTO feedback (complaint_id, student_id, rating, comments, satisfaction_level) VALUES (4, 5, 5, 'Extremely quick resolution!', 'Highly Satisfied'); UPDATE complaints SET status = 'Closed', closed_at = NOW() WHERE complaint_id = 4;",
          details: 'Student Rohit Karpe rated 5 stars; Ticket CMP-2026-004 transitioned to Closed.',
          timestamp: new Date(now - 24 * hour).toISOString()
        },
        {
          log_id: 2,
          complaint_id: 3,
          user_id: 8,
          action_type: 'STATUS_UPDATED',
          sql_executed: "UPDATE complaints SET status = 'Resolved', resolved_at = NOW(), updated_at = NOW() WHERE complaint_id = 3; INSERT INTO complaint_updates (complaint_id, updated_by, old_status, new_status, notes) VALUES (3, 8, 'In Progress', 'Resolved', 'Replaced Teflon tape...');",
          details: 'Staff Sunita Devi marked ticket CMP-2026-003 as Resolved.',
          timestamp: new Date(now - 5 * hour).toISOString()
        },
        {
          log_id: 3,
          complaint_id: 1,
          user_id: 6,
          action_type: 'WORK_NOTE_ADDED',
          sql_executed: "UPDATE complaints SET status = 'In Progress', updated_at = NOW() WHERE complaint_id = 1; INSERT INTO complaint_updates (complaint_id, updated_by, old_status, new_status, notes) VALUES (1, 6, 'Assigned', 'In Progress', 'Reached Room 402...');",
          details: 'Staff Rajesh Sharma commenced work on ticket CMP-2026-001.',
          timestamp: new Date(now - 2 * hour).toISOString()
        },
        {
          log_id: 4,
          complaint_id: 5,
          user_id: 11,
          action_type: 'COMPLAINT_CREATED',
          sql_executed: "INSERT INTO complaints (ticket_no, reporter_id, category_id, title, description, location_type, specific_location, priority, status) VALUES ('CMP-2026-005', 11, 7, 'High-speed centrifuge...', 'Centrifuge Unit 4...', 'Laboratory', 'Research Lab 108', 'Critical', 'Pending');",
          details: 'Student Manthan Dhamal reported Critical issue in Research Lab 108.',
          timestamp: new Date(now - 1.5 * hour).toISOString()
        }
      ]
    };
  }

  // ==========================================
  // QUERY & CRUD API (Simulating RDBMS Engine)
  // ==========================================

  // Select all users
  getUsers(role = null) {
    let list = this.tables.users;
    if (role) {
      list = list.filter((u) => u.role === role);
    }
    return list;
  }

  getUserById(id) {
    return this.tables.users.find((u) => u.user_id === Number(id));
  }

  getDepartments() {
    return this.tables.departments;
  }

  getCategories() {
    return this.tables.categories.map((cat) => {
      const dept = this.tables.departments.find((d) => d.department_id === cat.department_id);
      return { ...cat, department: dept };
    });
  }

  // Get joined complaints list with filters
  getComplaints(filters = {}) {
    let list = this.tables.complaints.map((c) => {
      const reporter = this.getUserById(c.reporter_id) || { name: 'Unknown', email: '' };
      const category = this.tables.categories.find((cat) => cat.category_id === c.category_id) || { category_name: 'General', sla_hours: 24, icon: 'alert-circle' };
      const department = this.tables.departments.find((d) => d.department_id === category.department_id) || { dept_name: 'General Maintenance' };
      const assignee = c.assigned_to ? this.getUserById(c.assigned_to) : null;
      const feedback = this.tables.feedback.find((f) => f.complaint_id === c.complaint_id) || null;
      const updates = this.tables.complaint_updates.filter((u) => u.complaint_id === c.complaint_id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return {
        ...c,
        reporter,
        category,
        department,
        assignee,
        feedback,
        updates
      };
    });

    // Apply filters
    if (filters.status && filters.status !== 'ALL') {
      list = list.filter((c) => c.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.priority && filters.priority !== 'ALL') {
      list = list.filter((c) => c.priority.toLowerCase() === filters.priority.toLowerCase());
    }
    if (filters.department_id && filters.department_id !== 'ALL') {
      list = list.filter((c) => c.category.department_id === Number(filters.department_id));
    }
    if (filters.reporter_id) {
      list = list.filter((c) => c.reporter_id === Number(filters.reporter_id));
    }
    if (filters.assigned_to) {
      list = list.filter((c) => c.assigned_to === Number(filters.assigned_to));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((c) =>
        c.ticket_no.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.specific_location.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getComplaintById(id) {
    const list = this.getComplaints();
    return list.find((c) => c.complaint_id === Number(id));
  }

  // ==========================================
  // TRANSACTIONAL OPERATIONS WITH AUDIT & TRIGGERS
  // ==========================================

  /**
   * Submit a new complaint (Student/Reporter Action)
   * ACID Transaction:
   * BEGIN;
   *   INSERT INTO complaints ...
   *   INSERT INTO activity_logs ...
   * COMMIT;
   */
  createComplaint(data) {
    const nextId = this.tables.complaints.reduce((max, c) => Math.max(max, c.complaint_id), 0) + 1;
    const ticketNo = `CMP-2026-${String(nextId).padStart(3, '0')}`;
    const nowIso = new Date().toISOString();

    const newComplaint = {
      complaint_id: nextId,
      ticket_no: ticketNo,
      reporter_id: Number(data.reporter_id),
      category_id: Number(data.category_id),
      title: data.title.trim(),
      description: data.description.trim(),
      location_type: data.location_type || 'Classroom',
      specific_location: data.specific_location.trim(),
      priority: data.priority || 'Medium',
      status: 'Pending',
      assigned_to: null,
      photo_url: data.photo_url || null,
      created_at: nowIso,
      updated_at: nowIso,
      resolved_at: null,
      closed_at: null
    };

    // Begin Transaction
    const sql1 = `INSERT INTO complaints (complaint_id, ticket_no, reporter_id, category_id, title, description, location_type, specific_location, priority, status, created_at, updated_at) VALUES (${nextId}, '${ticketNo}', ${newComplaint.reporter_id}, ${newComplaint.category_id}, '${newComplaint.title.replace(/'/g, "''")}', '${newComplaint.description.replace(/'/g, "''")}', '${newComplaint.location_type}', '${newComplaint.specific_location.replace(/'/g, "''")}', '${newComplaint.priority}', 'Pending', '${nowIso}', '${nowIso}');`;

    this.tables.complaints.unshift(newComplaint);

    // Trigger Audit Log
    const logId = this.tables.activity_logs.reduce((max, l) => Math.max(max, l.log_id), 0) + 1;
    const user = this.getUserById(newComplaint.reporter_id);
    const logDetails = `${user?.name || 'User'} filed ticket ${ticketNo} [${newComplaint.priority} Priority] at ${newComplaint.specific_location}`;
    const sqlLog = `INSERT INTO activity_logs (log_id, complaint_id, user_id, action_type, sql_executed, details, timestamp) VALUES (${logId}, ${nextId}, ${newComplaint.reporter_id}, 'COMPLAINT_CREATED', '${sql1.replace(/'/g, "''")}', '${logDetails.replace(/'/g, "''")}', '${nowIso}');`;

    this.tables.activity_logs.unshift({
      log_id: logId,
      complaint_id: nextId,
      user_id: newComplaint.reporter_id,
      action_type: 'COMPLAINT_CREATED',
      sql_executed: sql1,
      details: logDetails,
      timestamp: nowIso
    });

    this.save();

    // Notify SQL Console
    const fullTxSql = `BEGIN TRANSACTION;\n  ${sql1}\n  ${sqlLog}\nCOMMIT;`;
    this.notifySQL(fullTxSql, 'TRANSACTION', 2, 2.1);

    return newComplaint;
  }

  /**
   * Assign a complaint to a staff member (Administrator Action)
   * ACID Transaction + TRG_AFTER_COMPLAINT_ASSIGN trigger simulation:
   */
  assignComplaint(complaintId, staffId, adminId, instructions = '') {
    complaintId = Number(complaintId);
    staffId = Number(staffId);
    adminId = Number(adminId);
    const nowIso = new Date().toISOString();

    const complaint = this.tables.complaints.find((c) => c.complaint_id === complaintId);
    if (!complaint) throw new Error('Complaint record not found');

    const staff = this.getUserById(staffId);
    const admin = this.getUserById(adminId);
    if (!staff || staff.role !== 'STAFF') throw new Error('Selected user is not qualified staff');

    // Update Complaint
    const oldStatus = complaint.status;
    complaint.assigned_to = staffId;
    if (complaint.status === 'Pending') {
      complaint.status = 'Assigned';
    }
    complaint.updated_at = nowIso;

    // Insert into assignments table
    const nextAssignId = this.tables.assignments.reduce((max, a) => Math.max(max, a.assignment_id), 0) + 1;
    const assignmentRecord = {
      assignment_id: nextAssignId,
      complaint_id: complaintId,
      assigned_by: adminId,
      assigned_to: staffId,
      assigned_at: nowIso,
      instructions: instructions || 'Please inspect and resolve within department SLA.'
    };
    this.tables.assignments.unshift(assignmentRecord);

    // SQL Statements
    const sql1 = `UPDATE complaints SET assigned_to = ${staffId}, status = '${complaint.status}', updated_at = '${nowIso}' WHERE complaint_id = ${complaintId};`;
    const sql2 = `INSERT INTO assignments (assignment_id, complaint_id, assigned_by, assigned_to, assigned_at, instructions) VALUES (${nextAssignId}, ${complaintId}, ${adminId}, ${staffId}, '${nowIso}', '${assignmentRecord.instructions.replace(/'/g, "''")}');`;

    // Audit log
    const logId = this.tables.activity_logs.reduce((max, l) => Math.max(max, l.log_id), 0) + 1;
    const logDetails = `Admin ${admin?.name} assigned ticket ${complaint.ticket_no} to ${staff.name} (${staff.title || 'Staff'})`;
    this.tables.activity_logs.unshift({
      log_id: logId,
      complaint_id: complaintId,
      user_id: adminId,
      action_type: 'STAFF_ASSIGNED',
      sql_executed: `${sql1} ${sql2}`,
      details: logDetails,
      timestamp: nowIso
    });

    this.save();

    const fullTxSql = `BEGIN TRANSACTION;\n  ${sql1}\n  ${sql2}\n  -- TRIGGER: trg_audit_assignment_dispatch FIRED\nCOMMIT;`;
    this.notifySQL(fullTxSql, 'TRANSACTION', 3, 2.8);

    return complaint;
  }

  /**
   * Update Status & Add Work Notes (Staff / Admin Action)
   */
  updateComplaintStatus(complaintId, newStatus, userId, notes = '') {
    complaintId = Number(complaintId);
    userId = Number(userId);
    const nowIso = new Date().toISOString();

    const complaint = this.tables.complaints.find((c) => c.complaint_id === complaintId);
    if (!complaint) throw new Error('Complaint not found');

    const user = this.getUserById(userId);
    const oldStatus = complaint.status;

    // Referential / Business Rule Constraint check
    if (newStatus === 'Resolved' && !complaint.assigned_to) {
      throw new Error('DBMS Constraint Violation: Cannot resolve a complaint without an assigned technician.');
    }

    complaint.status = newStatus;
    complaint.updated_at = nowIso;
    if (newStatus === 'Resolved' && !complaint.resolved_at) {
      complaint.resolved_at = nowIso;
    }
    if (newStatus === 'Closed' && !complaint.closed_at) {
      complaint.closed_at = nowIso;
    }

    // Insert update history note
    const nextUpdateId = this.tables.complaint_updates.reduce((max, u) => Math.max(max, u.update_id), 0) + 1;
    this.tables.complaint_updates.unshift({
      update_id: nextUpdateId,
      complaint_id: complaintId,
      updated_by: userId,
      old_status: oldStatus,
      new_status: newStatus,
      notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
      created_at: nowIso
    });

    const sql1 = `UPDATE complaints SET status = '${newStatus}', updated_at = '${nowIso}'${newStatus === 'Resolved' ? `, resolved_at = '${nowIso}'` : ''}${newStatus === 'Closed' ? `, closed_at = '${nowIso}'` : ''} WHERE complaint_id = ${complaintId};`;
    const sql2 = `INSERT INTO complaint_updates (update_id, complaint_id, updated_by, old_status, new_status, notes, created_at) VALUES (${nextUpdateId}, ${complaintId}, ${userId}, '${oldStatus}', '${newStatus}', '${notes.replace(/'/g, "''")}', '${nowIso}');`;

    // Audit log
    const logId = this.tables.activity_logs.reduce((max, l) => Math.max(max, l.log_id), 0) + 1;
    this.tables.activity_logs.unshift({
      log_id: logId,
      complaint_id: complaintId,
      user_id: userId,
      action_type: 'STATUS_UPDATED',
      sql_executed: `${sql1} ${sql2}`,
      details: `${user?.name || 'User'} transitioned ticket ${complaint.ticket_no} from [${oldStatus}] to [${newStatus}]. Note: "${notes}"`,
      timestamp: nowIso
    });

    this.save();

    const fullTxSql = `BEGIN TRANSACTION;\n  ${sql1}\n  ${sql2}\n  -- TRIGGER: trg_after_status_change EXECUTED\nCOMMIT;`;
    this.notifySQL(fullTxSql, 'TRANSACTION', 2, 1.9);

    return complaint;
  }

  /**
   * Submit Feedback & Close Ticket (Student Action)
   */
  submitFeedback(complaintId, studentId, rating, comments, satisfaction) {
    complaintId = Number(complaintId);
    studentId = Number(studentId);
    rating = Number(rating);
    const nowIso = new Date().toISOString();

    const complaint = this.tables.complaints.find((c) => c.complaint_id === complaintId);
    if (!complaint) throw new Error('Complaint not found');

    // CHECK Constraint: 1 <= rating <= 5
    if (rating < 1 || rating > 5) {
      throw new Error('CHECK CONSTRAINT VIOLATION: rating must be between 1 and 5 stars.');
    }

    // UNIQUE constraint on complaint_id in feedback
    const existing = this.tables.feedback.find((f) => f.complaint_id === complaintId);
    if (existing) {
      throw new Error('UNIQUE CONSTRAINT VIOLATION: Feedback has already been recorded for this ticket.');
    }

    const nextFid = this.tables.feedback.reduce((max, f) => Math.max(max, f.feedback_id), 0) + 1;
    const feedbackRecord = {
      feedback_id: nextFid,
      complaint_id: complaintId,
      student_id: studentId,
      rating,
      comments: comments || 'Service completed satisfactorily.',
      satisfaction_level: satisfaction || (rating >= 4 ? 'Highly Satisfied' : rating === 3 ? 'Neutral' : 'Needs Improvement'),
      created_at: nowIso
    };
    this.tables.feedback.unshift(feedbackRecord);

    // Auto close ticket via Trigger simulation
    complaint.status = 'Closed';
    complaint.closed_at = nowIso;
    complaint.updated_at = nowIso;

    const sql1 = `INSERT INTO feedback (feedback_id, complaint_id, student_id, rating, comments, satisfaction_level, created_at) VALUES (${nextFid}, ${complaintId}, ${studentId}, ${rating}, '${feedbackRecord.comments.replace(/'/g, "''")}', '${feedbackRecord.satisfaction_level}', '${nowIso}');`;
    const sql2 = `UPDATE complaints SET status = 'Closed', closed_at = '${nowIso}', updated_at = '${nowIso}' WHERE complaint_id = ${complaintId};`;

    const logId = this.tables.activity_logs.reduce((max, l) => Math.max(max, l.log_id), 0) + 1;
    this.tables.activity_logs.unshift({
      log_id: logId,
      complaint_id: complaintId,
      user_id: studentId,
      action_type: 'FEEDBACK_RECORDED',
      sql_executed: `${sql1} ${sql2}`,
      details: `Student submitted ${rating}-Star feedback for ticket ${complaint.ticket_no}. Ticket auto-closed.`,
      timestamp: nowIso
    });

    this.save();

    const fullTxSql = `BEGIN TRANSACTION;\n  ${sql1}\n  ${sql2}\n  -- TRIGGER: trg_auto_close_on_feedback FIRED\nCOMMIT;`;
    this.notifySQL(fullTxSql, 'TRANSACTION', 2, 2.4);

    return feedbackRecord;
  }

  // ==========================================
  // AGGREGATE QUERIES (DBMS Mini Project Analytics)
  // ==========================================

  getDashboardMetrics() {
    const total = this.tables.complaints.length;
    const pending = this.tables.complaints.filter((c) => c.status === 'Pending').length;
    const assigned = this.tables.complaints.filter((c) => c.status === 'Assigned').length;
    const inProgress = this.tables.complaints.filter((c) => c.status === 'In Progress').length;
    const resolved = this.tables.complaints.filter((c) => c.status === 'Resolved').length;
    const closed = this.tables.complaints.filter((c) => c.status === 'Closed').length;
    const critical = this.tables.complaints.filter((c) => c.priority === 'Critical' && c.status !== 'Closed').length;

    // Calculate average resolution time (hours) for resolved/closed items
    const resolvedItems = this.tables.complaints.filter((c) => c.resolved_at);
    let avgResolutionHours = 0;
    if (resolvedItems.length > 0) {
      const totalHours = resolvedItems.reduce((acc, c) => {
        const diff = (new Date(c.resolved_at) - new Date(c.created_at)) / (1000 * 3600);
        return acc + Math.max(diff, 1);
      }, 0);
      avgResolutionHours = (totalHours / resolvedItems.length).toFixed(1);
    }

    // Average Student Satisfaction Rating
    const ratings = this.tables.feedback.map((f) => f.rating);
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '5.0';

    return {
      total,
      pending,
      assigned,
      inProgress,
      resolved,
      closed,
      critical,
      active: pending + assigned + inProgress,
      resolutionRate: total ? Math.round(((resolved + closed) / total) * 100) : 0,
      avgResolutionHours,
      avgRating
    };
  }

  // Aggregate by Department
  getDepartmentStats() {
    return this.tables.departments.map((dept) => {
      const deptCats = this.tables.categories.filter((c) => c.department_id === dept.department_id).map((c) => c.category_id);
      const complaints = this.tables.complaints.filter((c) => deptCats.includes(c.category_id));
      const pending = complaints.filter((c) => ['Pending', 'Assigned', 'In Progress'].includes(c.status)).length;
      const solved = complaints.filter((c) => ['Resolved', 'Closed'].includes(c.status)).length;
      const staffMembers = this.tables.users.filter((u) => u.department_id === dept.department_id);

      return {
        ...dept,
        totalComplaints: complaints.length,
        pendingComplaints: pending,
        solvedComplaints: solved,
        staffCount: staffMembers.length
      };
    });
  }

  // Aggregate by Priority
  getPriorityBreakdown() {
    const priorities = ['Critical', 'High', 'Medium', 'Low'];
    return priorities.map((p) => {
      const total = this.tables.complaints.filter((c) => c.priority === p).length;
      const active = this.tables.complaints.filter((c) => c.priority === p && !['Resolved', 'Closed'].includes(c.status)).length;
      return { priority: p, total, active };
    });
  }

  // Master Audit Logs with limit
  getActivityLogs(limit = 50) {
    return this.tables.activity_logs.slice(0, limit);
  }

  // Execute raw mock SQL query against the engine for the live SQL sandbox
  executeCustomSQL(sql) {
    const cleaned = sql.trim().replace(/;$/, '');
    const startTime = performance.now();

    try {
      // 1. SELECT queries
      if (cleaned.toUpperCase().startsWith('SELECT')) {
        const result = this.evaluateSelectQuery(cleaned);
        const duration = (performance.now() - startTime).toFixed(2);
        this.notifySQL(sql, 'SELECT', result.rows.length, duration);
        return { success: true, ...result, duration };
      }

      // 2. SHOW TABLES
      if (cleaned.toUpperCase() === 'SHOW TABLES' || cleaned.toUpperCase().includes('SHOW TABLES')) {
        const rows = Object.keys(this.tables).map((t) => ({
          table_name: t,
          total_records: this.tables[t].length
        }));
        return {
          success: true,
          columns: ['table_name', 'total_records'],
          rows,
          duration: (performance.now() - startTime).toFixed(2)
        };
      }

      // 3. DESCRIBE / EXPLAIN
      if (cleaned.toUpperCase().startsWith('DESCRIBE') || cleaned.toUpperCase().startsWith('DESC')) {
        const parts = cleaned.split(/\s+/);
        const tableName = parts[1]?.toLowerCase();
        if (this.tables[tableName] && this.tables[tableName].length > 0) {
          const sample = this.tables[tableName][0];
          const rows = Object.keys(sample).map((k) => ({
            field: k,
            type: typeof sample[k] === 'number' ? 'INT' : 'VARCHAR(255)',
            null_allowed: k.endsWith('_id') && !k.startsWith('user_id') ? 'YES' : 'NO',
            key: k.endsWith('_id') ? (k === `${tableName.replace(/s$/, '')}_id` ? 'PRI' : 'FOR') : ''
          }));
          return {
            success: true,
            columns: ['field', 'type', 'null_allowed', 'key'],
            rows,
            duration: (performance.now() - startTime).toFixed(2)
          };
        }
      }

      // Fallback
      return {
        success: false,
        error: 'Unsupported query format in client simulator. Please run SELECT, SHOW TABLES, or DESCRIBE <table_name> statements.'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  evaluateSelectQuery(sql) {
    const upper = sql.toUpperCase();

    // Built-in presets detection for accurate joins
    if (upper.includes('JOIN') && upper.includes('DEPARTMENTS') && upper.includes('COMPLAINTS')) {
      const complaints = this.getComplaints();
      const rows = complaints.map((c) => ({
        ticket_no: c.ticket_no,
        title: c.title.substring(0, 32) + '...',
        priority: c.priority,
        status: c.status,
        reporter_name: c.reporter.name,
        department_name: c.department.dept_name,
        created_at: c.created_at.substring(0, 10)
      }));
      return {
        columns: ['ticket_no', 'title', 'priority', 'status', 'reporter_name', 'department_name', 'created_at'],
        rows
      };
    }

    if (upper.includes('GROUP BY') && upper.includes('DEPT_NAME')) {
      const stats = this.getDepartmentStats();
      const rows = stats.map((s) => ({
        dept_code: s.dept_code,
        dept_name: s.dept_name,
        total_complaints: s.totalComplaints,
        pending_count: s.pendingComplaints,
        resolved_count: s.solvedComplaints
      }));
      return {
        columns: ['dept_code', 'dept_name', 'total_complaints', 'pending_count', 'resolved_count'],
        rows
      };
    }

    if (upper.includes('FEEDBACK') && upper.includes('RATING')) {
      const rows = this.tables.feedback.map((f) => {
        const c = this.tables.complaints.find((x) => x.complaint_id === f.complaint_id);
        const s = this.tables.users.find((u) => u.user_id === f.student_id);
        return {
          feedback_id: f.feedback_id,
          ticket_no: c?.ticket_no || 'N/A',
          student_name: s?.name || 'N/A',
          rating: '★'.repeat(f.rating),
          satisfaction_level: f.satisfaction_level,
          comments: f.comments
        };
      });
      return {
        columns: ['feedback_id', 'ticket_no', 'student_name', 'rating', 'satisfaction_level', 'comments'],
        rows
      };
    }

    // Direct table select: SELECT * FROM <table> [WHERE ...] [LIMIT ...]
    const fromMatch = sql.match(/FROM\s+([a-zA-Z_]+)/i);
    if (!fromMatch) throw new Error('Missing FROM clause in SELECT query');

    const tableName = fromMatch[1].toLowerCase();
    if (!this.tables[tableName]) {
      throw new Error(`Table '${tableName}' does not exist in relational schema.`);
    }

    let rows = [...this.tables[tableName]];

    // Simple WHERE clause parsing
    const whereMatch = sql.match(/WHERE\s+([a-zA-Z_]+)\s*(=|LIKE)\s*['"]?([^'"]+)['"]?/i);
    if (whereMatch) {
      const col = whereMatch[1];
      const op = whereMatch[2].toUpperCase();
      const val = whereMatch[3];
      rows = rows.filter((r) => {
        if (op === '=') return String(r[col]).toLowerCase() === val.toLowerCase();
        if (op === 'LIKE') return String(r[col]).toLowerCase().includes(val.replace(/%/g, '').toLowerCase());
        return true;
      });
    }

    // LIMIT parsing
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      rows = rows.slice(0, parseInt(limitMatch[1], 10));
    }

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { columns, rows };
  }

  // ==========================================
  // SQL DUMP EXPORTER & DOWNLOADER
  // ==========================================
  generateFullSQLDump() {
    let sql = `-- ====================================================================
-- CAMPUS MAINTENANCE AND COMPLAINT MANAGEMENT SYSTEM
-- Course: Database Management Systems (DBMS) Mini Project
-- Guided by: Prof. P. R. Nerkar
-- Team: Sarth Santosh Pande (28), Takshak Rahul Sirsat (30),
--       Manthan Vinod Dhamal (35), Ali Ali Asgar Yusuf (40), Rohit Sudhir Karpe (53)
-- Target: MySQL 8.0+ / MariaDB / PostgreSQL Compatible Relational Dump
-- Generated on: ${new Date().toISOString()}
-- ====================================================================

CREATE DATABASE IF NOT EXISTS campus_maintenance_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE campus_maintenance_db;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. DEPARTMENTS TABLE
DROP TABLE IF EXISTS departments;
CREATE TABLE departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    dept_code VARCHAR(10) NOT NULL UNIQUE,
    dept_name VARCHAR(100) NOT NULL,
    head_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    location_block VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. USERS TABLE
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    role ENUM('ADMIN', 'STAFF', 'STUDENT') NOT NULL,
    department_id INT NULL,
    phone VARCHAR(20) NOT NULL,
    roll_no VARCHAR(20) NULL,
    title VARCHAR(120) NULL,
    avatar VARCHAR(10) DEFAULT '👤',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 3. CATEGORIES TABLE
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    sla_hours INT NOT NULL DEFAULT 24,
    icon VARCHAR(30) DEFAULT 'alert-circle',
    description TEXT,
    CONSTRAINT fk_categories_dept FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 4. COMPLAINTS TABLE
DROP TABLE IF EXISTS complaints;
CREATE TABLE complaints (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_no VARCHAR(20) NOT NULL UNIQUE,
    reporter_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location_type ENUM('Classroom', 'Laboratory', 'Hostel', 'Campus Grounds', 'Library', 'Canteen') NOT NULL,
    specific_location VARCHAR(150) NOT NULL,
    priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    status ENUM('Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed') NOT NULL DEFAULT 'Pending',
    assigned_to INT NULL,
    photo_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    CONSTRAINT fk_complaints_reporter FOREIGN KEY (reporter_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_complaints_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_complaints_assignee FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5. ASSIGNMENTS TABLE
DROP TABLE IF EXISTS assignments;
CREATE TABLE assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    assigned_by INT NOT NULL,
    assigned_to INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    instructions TEXT,
    CONSTRAINT fk_assignments_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_admin FOREIGN KEY (assigned_by) REFERENCES users(user_id),
    CONSTRAINT fk_assignments_staff FOREIGN KEY (assigned_to) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- 6. COMPLAINT_UPDATES TABLE
DROP TABLE IF EXISTS complaint_updates;
CREATE TABLE complaint_updates (
    update_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    updated_by INT NOT NULL,
    old_status VARCHAR(30) NOT NULL,
    new_status VARCHAR(30) NOT NULL,
    notes TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_updates_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    CONSTRAINT fk_updates_user FOREIGN KEY (updated_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- 7. FEEDBACK TABLE
DROP TABLE IF EXISTS feedback;
CREATE TABLE feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL UNIQUE,
    student_id INT NOT NULL,
    rating INT NOT NULL,
    comments TEXT,
    satisfaction_level VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_feedback_rating CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT fk_feedback_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    CONSTRAINT fk_feedback_student FOREIGN KEY (student_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- 8. ACTIVITY_LOGS TABLE
DROP TABLE IF EXISTS activity_logs;
CREATE TABLE activity_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NULL,
    user_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    sql_executed TEXT NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_logs_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE SET NULL,
    CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- CURRENT RELATIONAL DATA RECORDS (DML)
-- ==========================================

`;

    // Helper to format values
    const esc = (v) => {
      if (v === null || v === undefined) return 'NULL';
      if (typeof v === 'number') return v;
      return `'${String(v).replace(/'/g, "''")}'`;
    };

    // 1. Departments
    if (this.tables.departments.length) {
      sql += `-- Departments (${this.tables.departments.length} records)\n`;
      this.tables.departments.forEach((d) => {
        sql += `INSERT INTO departments (department_id, dept_code, dept_name, head_name, contact_email, location_block) VALUES (${d.department_id}, ${esc(d.dept_code)}, ${esc(d.dept_name)}, ${esc(d.head_name)}, ${esc(d.contact_email)}, ${esc(d.location_block)});\n`;
      });
      sql += '\n';
    }

    // 2. Users
    if (this.tables.users.length) {
      sql += `-- Users (${this.tables.users.length} records)\n`;
      this.tables.users.forEach((u) => {
        sql += `INSERT INTO users (user_id, name, email, role, department_id, phone, roll_no, title, avatar) VALUES (${u.user_id}, ${esc(u.name)}, ${esc(u.email)}, ${esc(u.role)}, ${esc(u.department_id)}, ${esc(u.phone)}, ${esc(u.roll_no)}, ${esc(u.title)}, ${esc(u.avatar)});\n`;
      });
      sql += '\n';
    }

    // 3. Categories
    if (this.tables.categories.length) {
      sql += `-- Categories (${this.tables.categories.length} records)\n`;
      this.tables.categories.forEach((c) => {
        sql += `INSERT INTO categories (category_id, category_name, department_id, sla_hours, icon, description) VALUES (${c.category_id}, ${esc(c.category_name)}, ${c.department_id}, ${c.sla_hours}, ${esc(c.icon)}, ${esc(c.description)});\n`;
      });
      sql += '\n';
    }

    // 4. Complaints
    if (this.tables.complaints.length) {
      sql += `-- Complaints (${this.tables.complaints.length} records)\n`;
      this.tables.complaints.forEach((c) => {
        sql += `INSERT INTO complaints (complaint_id, ticket_no, reporter_id, category_id, title, description, location_type, specific_location, priority, status, assigned_to, photo_url, created_at, updated_at, resolved_at, closed_at) VALUES (${c.complaint_id}, ${esc(c.ticket_no)}, ${c.reporter_id}, ${c.category_id}, ${esc(c.title)}, ${esc(c.description)}, ${esc(c.location_type)}, ${esc(c.specific_location)}, ${esc(c.priority)}, ${esc(c.status)}, ${esc(c.assigned_to)}, ${esc(c.photo_url)}, ${esc(c.created_at)}, ${esc(c.updated_at)}, ${esc(c.resolved_at)}, ${esc(c.closed_at)});\n`;
      });
      sql += '\n';
    }

    // 5. Assignments
    if (this.tables.assignments.length) {
      sql += `-- Assignments (${this.tables.assignments.length} records)\n`;
      this.tables.assignments.forEach((a) => {
        sql += `INSERT INTO assignments (assignment_id, complaint_id, assigned_by, assigned_to, assigned_at, instructions) VALUES (${a.assignment_id}, ${a.complaint_id}, ${a.assigned_by}, ${a.assigned_to}, ${esc(a.assigned_at)}, ${esc(a.instructions)});\n`;
      });
      sql += '\n';
    }

    // 6. Complaint Updates
    if (this.tables.complaint_updates.length) {
      sql += `-- Complaint Updates (${this.tables.complaint_updates.length} records)\n`;
      this.tables.complaint_updates.forEach((u) => {
        sql += `INSERT INTO complaint_updates (update_id, complaint_id, updated_by, old_status, new_status, notes, created_at) VALUES (${u.update_id}, ${u.complaint_id}, ${u.updated_by}, ${esc(u.old_status)}, ${esc(u.new_status)}, ${esc(u.notes)}, ${esc(u.created_at)});\n`;
      });
      sql += '\n';
    }

    // 7. Feedback
    if (this.tables.feedback.length) {
      sql += `-- Feedback (${this.tables.feedback.length} records)\n`;
      this.tables.feedback.forEach((f) => {
        sql += `INSERT INTO feedback (feedback_id, complaint_id, student_id, rating, comments, satisfaction_level, created_at) VALUES (${f.feedback_id}, ${f.complaint_id}, ${f.student_id}, ${f.rating}, ${esc(f.comments)}, ${esc(f.satisfaction_level)}, ${esc(f.created_at)});\n`;
      });
      sql += '\n';
    }

    // 8. Activity Logs
    if (this.tables.activity_logs.length) {
      sql += `-- Activity Audit Logs (${this.tables.activity_logs.length} records)\n`;
      this.tables.activity_logs.forEach((l) => {
        sql += `INSERT INTO activity_logs (log_id, complaint_id, user_id, action_type, sql_executed, details, timestamp) VALUES (${l.log_id}, ${esc(l.complaint_id)}, ${l.user_id}, ${esc(l.action_type)}, ${esc(l.sql_executed)}, ${esc(l.details)}, ${esc(l.timestamp)});\n`;
      });
      sql += '\n';
    }

    sql += `-- ==========================================
-- DATABASE TRIGGERS
-- ==========================================
DELIMITER $$
CREATE TRIGGER trg_after_complaint_assigned
AFTER INSERT ON assignments
FOR EACH ROW
BEGIN
    UPDATE complaints
    SET status = 'Assigned', assigned_to = NEW.assigned_to, updated_at = NOW()
    WHERE complaint_id = NEW.complaint_id AND status = 'Pending';
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_auto_close_on_feedback
AFTER INSERT ON feedback
FOR EACH ROW
BEGIN
    UPDATE complaints
    SET status = 'Closed', closed_at = NOW(), updated_at = NOW()
    WHERE complaint_id = NEW.complaint_id;
END$$
DELIMITER ;
`;

    return sql;
  }

  downloadSQLDump() {
    const sqlContent = this.generateFullSQLDump();
    const blob = new Blob([sqlContent], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campus_maintenance_db_dump_${new Date().toISOString().substring(0, 10)}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.notifySQL('-- FULL DATABASE SQL DUMP EXPORTED AND DOWNLOADED AS .SQL FILE', 'DDL', this.tables.complaints.length, 1.5);
  }
}

// Global RDBMS instance
window.db = new CampusDBMS();

