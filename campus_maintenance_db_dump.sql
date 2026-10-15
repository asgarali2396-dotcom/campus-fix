-- ====================================================================
-- CAMPUS MAINTENANCE AND COMPLAINT MANAGEMENT SYSTEM
-- Course: Database Management Systems (DBMS) Mini Project
-- Guided by: Prof. P. R. Nerkar
-- Team Members:
--   1. Sarth Santosh Pande     (Roll No. 28)
--   2. Takshak Rahul Sirsat     (Roll No. 30)
--   3. Manthan Vinod Dhamal    (Roll No. 35)
--   4. Ali Asgar Yusuf Ali      (Roll No. 40)
--   5. Rohit Sudhir Karpe       (Roll No. 53)
--
-- Target Database: MySQL 8.0+ / MariaDB / PostgreSQL Compatible
-- File Type: Complete Relational Schema (DDL) + Data Dump (DML)
-- Generated on: 2026-10-12
-- ====================================================================

-- --------------------------------------------------------------------
-- DATABASE INITIALIZATION
-- --------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS campus_maintenance_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campus_maintenance_db;

-- Disable foreign key checks during schema creation & data load
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------------
-- TABLE 1: departments
-- Stores academic and administrative maintenance divisions
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- TABLE 2: users
-- Implements Role-Based Access Control (ADMIN, STAFF, STUDENT)
-- --------------------------------------------------------------------
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
    CONSTRAINT fk_users_department 
        FOREIGN KEY (department_id) REFERENCES departments(department_id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- TABLE 3: categories
-- Categorizes maintenance issues with department SLA targets
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    sla_hours INT NOT NULL DEFAULT 24,
    icon VARCHAR(30) DEFAULT 'alert-circle',
    description TEXT,
    CONSTRAINT fk_categories_department 
        FOREIGN KEY (department_id) REFERENCES departments(department_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- TABLE 4: complaints (Central Relational Entity)
-- Tracks campus complaints lifecycle from Pending to Closed
-- --------------------------------------------------------------------
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
    CONSTRAINT fk_complaints_reporter 
        FOREIGN KEY (reporter_id) REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_complaints_category 
        FOREIGN KEY (category_id) REFERENCES categories(category_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_complaints_assignee 
        FOREIGN KEY (assigned_to) REFERENCES users(user_id) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- TABLE 5: assignments
-- Logs administrator staff allocation orders & technician instructions
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS assignments;
CREATE TABLE assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    assigned_by INT NOT NULL,
    assigned_to INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    instructions TEXT,
    CONSTRAINT fk_assignments_complaint 
        FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_assignments_admin 
        FOREIGN KEY (assigned_by) REFERENCES users(user_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_assignments_staff 
        FOREIGN KEY (assigned_to) REFERENCES users(user_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- TABLE 6: complaint_updates
-- Chronological technician work notes and state transitions
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS complaint_updates;
CREATE TABLE complaint_updates (
    update_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    updated_by INT NOT NULL,
    old_status VARCHAR(30) NOT NULL,
    new_status VARCHAR(30) NOT NULL,
    notes TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_updates_complaint 
        FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_updates_user 
        FOREIGN KEY (updated_by) REFERENCES users(user_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- TABLE 7: feedback
-- Resolution ratings and satisfaction surveys (Enforces 1:1 with complaint)
-- --------------------------------------------------------------------
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
    CONSTRAINT fk_feedback_complaint 
        FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_feedback_student 
        FOREIGN KEY (student_id) REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------------------
-- TABLE 8: activity_logs
-- Immutable master audit trail logging transactions and actions
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS activity_logs;
CREATE TABLE activity_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NULL,
    user_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    sql_executed TEXT NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_logs_complaint 
        FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_logs_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- DML: SEED DATA INSERTION
-- ====================================================================

-- 1. Insert Departments
INSERT INTO departments (department_id, dept_code, dept_name, head_name, contact_email, location_block) VALUES
(1, 'ELEC', 'Electrical Maintenance', 'Er. R. K. Joshi', 'electrical@campus.edu', 'Utility Substation Block E'),
(2, 'NETW', 'IT & Network Infrastructure', 'Prof. S. M. Deshmukh', 'networking@campus.edu', 'Computer Center 2nd Floor'),
(3, 'SANI', 'Sanitation & Housekeeping', 'Mrs. Rekha Jadhav', 'sanitation@campus.edu', 'Administrative Basement'),
(4, 'CIVL', 'Civil, Carpentry & Facilities', 'Er. Anand Gaikwad', 'civil@campus.edu', 'Workshop Building Bay 3'),
(5, 'LABS', 'Laboratory Equipment & Tech', 'Dr. Sanjay Kulkarni', 'labsupport@campus.edu', 'Science & Engineering Complex');

-- 2. Insert Users (Administrator, Students & Staff)
INSERT INTO users (user_id, name, email, role, department_id, phone, roll_no, title, avatar) VALUES
-- Administrator / Project Guide
(1, 'Prof. P. R. Nerkar', 'pr.nerkar@campus.edu', 'ADMIN', NULL, '+91 98220 11223', NULL, 'Project Guide & Campus Chief Administrator', '👨‍🏫'),
-- Student Team Members
(2, 'Sarth Santosh Pande', 'sarth.pande@student.campus.edu', 'STUDENT', NULL, '+91 98341 22334', '28', 'Student (Dept. of Comp Sci)', '👨‍🎓'),
(3, 'Takshak Rahul Sirsat', 'takshak.sirsat@student.campus.edu', 'STUDENT', NULL, '+91 97654 33445', '30', 'Student (Dept. of Comp Sci)', '👨‍🎓'),
(11, 'Manthan Vinod Dhamal', 'manthan.dhamal@student.campus.edu', 'STUDENT', NULL, '+91 98555 44332', '35', 'Student (Dept. of Comp Sci)', '👨‍🎓'),
(4, 'Ali Asgar Yusuf Ali', 'ali.yusuf@student.campus.edu', 'STUDENT', NULL, '+91 99234 44556', '40', 'Student (Dept. of Comp Sci)', '👨‍🎓'),
(5, 'Rohit Sudhir Karpe', 'rohit.karpe@student.campus.edu', 'STUDENT', NULL, '+91 98112 55667', '53', 'Student (Dept. of Comp Sci)', '👨‍🎓'),
-- Department Maintenance Staff
(6, 'Rajesh Sharma', 'rajesh.sharma@staff.campus.edu', 'STAFF', 1, '+91 94231 66778', NULL, 'Senior Electrician & Substation Tech', '⚡'),
(7, 'Amit Verma', 'amit.verma@staff.campus.edu', 'STAFF', 2, '+91 93221 77889', NULL, 'Campus Network Systems Engineer', '💻'),
(8, 'Sunita Devi', 'sunita.devi@staff.campus.edu', 'STAFF', 3, '+91 92211 88990', NULL, 'Sanitation Supervisor & Facility Care', '🧹'),
(9, 'Vikas Patil', 'vikas.patil@staff.campus.edu', 'STAFF', 4, '+91 91200 99001', NULL, 'Infrastructure & Carpentry Lead', '🔨'),
(10, 'Dr. Sanjay Kulkarni', 'sanjay.kulkarni@staff.campus.edu', 'STAFF', 5, '+91 90199 00112', NULL, 'Scientific Instrumentation Tech', '🔬');

-- 3. Insert Issue Categories
INSERT INTO categories (category_id, category_name, department_id, sla_hours, icon, description) VALUES
(1, 'Electrical & Power Supply', 1, 24, 'zap', 'Power cut, spark, socket failure, switchboard fault, fan/light malfunction'),
(2, 'Campus Wi-Fi & Internet', 2, 12, 'wifi', 'Access point outage, LAN port dead, DNS issues, slow bandwidth'),
(3, 'Plumbing & Water Supply', 3, 8, 'droplet', 'Tap leakage, washroom overflow, water cooler failure, drainage blockage'),
(4, 'Sanitation & Hygiene', 3, 6, 'sparkles', 'Uncleaned classroom, dustbin overflow, pest control, sanitizer refill'),
(5, 'Classroom AV & Projectors', 2, 18, 'monitor', 'Projector display glitch, HDMI cable damaged, mic/speaker buzz'),
(6, 'Civil, Doors & Furniture', 4, 48, 'tool', 'Broken desk bench, stuck door latch, cracked glass pane, window lock'),
(7, 'Laboratory Equipment & Instruments', 5, 24, 'cpu', 'Oscilloscope calibration, PC crash in lab, fume hood fan, chemical shower');

-- 4. Insert Complaints Records
INSERT INTO complaints (complaint_id, ticket_no, reporter_id, category_id, title, description, location_type, specific_location, priority, status, assigned_to, photo_url, created_at, updated_at, resolved_at, closed_at) VALUES
(1, 'CMP-2026-001', 2, 1, 'Ceiling fan making screeching noise & sparking near switch', 'In classroom 402, the middle ceiling fan regulator is overheating with spark smell when turned to speed 4.', 'Classroom', 'Academic Complex Block A, Room 402', 'High', 'In Progress', 6, 'assets/sample_spark.svg', '2026-10-11 18:30:00', '2026-10-12 12:30:00', NULL, NULL),
(2, 'CMP-2026-002', 3, 2, 'Hostel Block 3 2nd Floor Wi-Fi Access Point Offline', 'The Cisco AP LED is blinking amber continuously. Students unable to access college intranet and LMS portal.', 'Hostel', 'Boys Hostel 3, Corridor 2nd Floor West Wing', 'Critical', 'Assigned', 7, 'assets/sample_wifi.svg', '2026-10-12 04:00:00', '2026-10-12 08:30:00', NULL, NULL),
(3, 'CMP-2026-003', 4, 3, 'Water tap leaking continuously in 1st Floor Washroom', 'High pressure water leak causing pooling near doorway, creating slippery floor safety hazard.', 'Classroom', 'Main Science Block, Gents Restroom 1st Floor', 'Medium', 'Resolved', 8, 'assets/sample_leak.svg', '2026-10-10 10:00:00', '2026-10-12 09:30:00', '2026-10-12 09:30:00', NULL),
(4, 'CMP-2026-004', 5, 5, 'Projector in Seminar Hall 1 has pink tint and flickering lamp', 'Upcoming DBMS guest lecture requires HDMI projection. Current image has bad color distortion and shuts down after 10 mins.', 'Classroom', 'Auditorium Wing, Seminar Hall 1', 'High', 'Closed', 7, 'assets/sample_projector.svg', '2026-10-08 14:00:00', '2026-10-11 14:00:00', '2026-10-11 12:00:00', '2026-10-11 14:00:00'),
(5, 'CMP-2026-005', 2, 7, 'High-speed centrifuge in Bio/Chemistry Lab vibrating violently', 'Centrifuge Unit 4 rotor unbalanced warning during semester practicals. Power cut immediately.', 'Laboratory', 'Research Lab 108, Chemistry Wing', 'Critical', 'Pending', NULL, NULL, '2026-10-12 13:00:00', '2026-10-12 13:00:00', NULL, NULL),
(6, 'CMP-2026-006', 3, 6, 'Door handle lock broken on Study Hall Room B', 'Brass latch mechanism sheared off; door bangs with heavy wind gusts.', 'Library', 'Central Library, 3rd Floor Quiet Study Hall', 'Low', 'Assigned', 9, NULL, '2026-10-11 18:00:00', '2026-10-11 20:30:00', NULL, NULL);

-- 5. Insert Assignments Records
INSERT INTO assignments (assignment_id, complaint_id, assigned_by, assigned_to, assigned_at, instructions) VALUES
(1, 1, 1, 6, '2026-10-12 02:30:00', 'Inspect regulator and MCB panel on 4th floor immediately before afternoon classes.'),
(2, 2, 1, 7, '2026-10-12 08:30:00', 'Check PoE switch in telecom rack 3B and re-flash firmware if necessary.'),
(3, 3, 1, 8, '2026-10-10 22:00:00', 'Replace damaged rubber washer and inspect drainage trap.'),
(4, 4, 1, 7, '2026-10-09 10:00:00', 'Replace EPSON projector lamp bulb and recalibrate keystone settings.'),
(5, 6, 1, 9, '2026-10-11 20:30:00', 'Install heavy-duty mortise lock assembly.');

-- 6. Insert Complaint Updates (Field Notes & Progress)
INSERT INTO complaint_updates (update_id, complaint_id, updated_by, old_status, new_status, notes, created_at) VALUES
(1, 1, 6, 'Assigned', 'In Progress', 'Reached Room 402 with replacement capacitor and stepped electronic regulator. Testing electrical line voltage.', '2026-10-12 12:30:00'),
(2, 3, 8, 'Assigned', 'In Progress', 'Shut main shutoff valve on 1st floor; removed corroded brass spindle.', '2026-10-11 16:00:00'),
(3, 3, 8, 'In Progress', 'Resolved', 'Replaced Teflon tape and new valve gland. Tested under pressure with zero leaks. Sanitized floor area.', '2026-10-12 09:30:00'),
(4, 4, 7, 'In Progress', 'Resolved', 'Installed OEM replacement lamp module. Cleaned optical filters and ran 2-hour stress benchmark.', '2026-10-11 12:00:00');

-- 7. Insert Student Feedback
INSERT INTO feedback (feedback_id, complaint_id, student_id, rating, comments, satisfaction_level, created_at) VALUES
(1, 4, 5, 5, 'Extremely quick resolution! Tested presentation yesterday and colors were crisp. Thanks to the IT team!', 'Highly Satisfied', '2026-10-11 14:00:00');

-- 8. Insert Activity Audit Logs
INSERT INTO activity_logs (log_id, complaint_id, user_id, action_type, sql_executed, details, timestamp) VALUES
(1, 4, 5, 'FEEDBACK_SUBMITTED', 'INSERT INTO feedback...; UPDATE complaints SET status = ''Closed'' WHERE complaint_id = 4;', 'Student Rohit Karpe rated 5 stars; Ticket CMP-2026-004 transitioned to Closed.', '2026-10-11 14:00:00'),
(2, 3, 8, 'STATUS_UPDATED', 'UPDATE complaints SET status = ''Resolved'' WHERE complaint_id = 3;', 'Staff Sunita Devi marked ticket CMP-2026-003 as Resolved.', '2026-10-12 09:30:00'),
(3, 1, 6, 'WORK_NOTE_ADDED', 'UPDATE complaints SET status = ''In Progress'' WHERE complaint_id = 1;', 'Staff Rajesh Sharma commenced work on ticket CMP-2026-001.', '2026-10-12 12:30:00'),
(4, 5, 2, 'COMPLAINT_CREATED', 'INSERT INTO complaints (ticket_no, reporter_id, ...) VALUES (''CMP-2026-005'', 2, ...);', 'Student Sarth Pande reported Critical issue in Research Lab 108.', '2026-10-12 13:00:00');

-- ====================================================================
-- TRIGGERS IMPLEMENTATION
-- ====================================================================

-- Trigger 1: Auto-update complaint status to 'Assigned' upon technician assignment
DELIMITER $$
CREATE TRIGGER trg_after_complaint_assigned
AFTER INSERT ON assignments
FOR EACH ROW
BEGIN
    UPDATE complaints
    SET status = 'Assigned',
        assigned_to = NEW.assigned_to,
        updated_at = NOW()
    WHERE complaint_id = NEW.complaint_id AND status = 'Pending';
END$$
DELIMITER ;

-- Trigger 2: Auto-close complaint upon successful feedback submission
DELIMITER $$
CREATE TRIGGER trg_auto_close_on_feedback
AFTER INSERT ON feedback
FOR EACH ROW
BEGIN
    UPDATE complaints
    SET status = 'Closed',
        closed_at = NOW(),
        updated_at = NOW()
    WHERE complaint_id = NEW.complaint_id;
END$$
DELIMITER ;

-- Trigger 3: Audit log recording for status changes
DELIMITER $$
CREATE TRIGGER trg_audit_status_update
AFTER UPDATE ON complaints
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO activity_logs (complaint_id, user_id, action_type, sql_executed, details, timestamp)
        VALUES (
            NEW.complaint_id,
            COALESCE(NEW.assigned_to, NEW.reporter_id),
            'STATUS_TRANSITION',
            CONCAT('UPDATE complaints SET status = ''', NEW.status, ''' WHERE complaint_id = ', NEW.complaint_id),
            CONCAT('Status changed from ', OLD.status, ' to ', NEW.status),
            NOW()
        );
    END IF;
END$$
DELIMITER ;

-- --------------------------------------------------------------------
-- VERIFICATION QUERIES (Test Your Database Setup)
-- --------------------------------------------------------------------
-- 1. Check all complaints with departments and reporters:
-- SELECT c.ticket_no, c.title, c.priority, c.status, u.name AS reporter, d.dept_name
-- FROM complaints c
-- JOIN users u ON c.reporter_id = u.user_id
-- JOIN categories cat ON c.category_id = cat.category_id
-- JOIN departments d ON cat.department_id = d.department_id;

-- 2. Department performance summary:
-- SELECT d.dept_name, COUNT(c.complaint_id) AS total_complaints,
--        SUM(CASE WHEN c.status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) AS resolved_count
-- FROM departments d
-- LEFT JOIN categories cat ON d.department_id = cat.department_id
-- LEFT JOIN complaints c ON cat.category_id = c.category_id
-- GROUP BY d.dept_name;
