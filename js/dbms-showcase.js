/**
 * CampusFix - DBMS Showcase & Academic Viva Module
 * Provides Interactive ER Diagram, Normalization Proofs,
 * Live SQL Sandbox, DDL Script Exporter, and Academic Documentation
 */

const DBMS_DDL_SCRIPT = `-- ====================================================================
-- CAMPUSFIX: CAMPUS MAINTENANCE AND COMPLAINT MANAGEMENT SYSTEM
-- Course: Database Management Systems (DBMS) Mini Project
-- Guide: Prof. P. R. Nerkar
-- Team: Sarth Santosh Pande (28), Takshak Rahul Sirsat (30),
--       Manthan Vinod Dhamal (35), Ali Asgar Yusuf Ali (40), Rohit Sudhir Karpe (53)
-- Database Engine: PostgreSQL / MySQL 8.0+ Compatible DDL
-- ====================================================================

-- 1. DEPARTMENTS TABLE
CREATE TABLE departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    dept_code VARCHAR(10) NOT NULL UNIQUE,
    dept_name VARCHAR(100) NOT NULL,
    head_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    location_block VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS TABLE (Role-Based Access Control)
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
);

-- 3. CATEGORIES TABLE
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    sla_hours INT NOT NULL DEFAULT 24,
    icon VARCHAR(30) DEFAULT 'alert-circle',
    description TEXT,
    CONSTRAINT fk_categories_dept 
        FOREIGN KEY (department_id) REFERENCES departments(department_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 4. COMPLAINTS TABLE (Core Central Relational Entity)
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
);

-- 5. ASSIGNMENTS TABLE (Staff Task Allocation)
CREATE TABLE assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    assigned_by INT NOT NULL,
    assigned_to INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    instructions TEXT,
    CONSTRAINT fk_assign_complaint 
        FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_assign_by 
        FOREIGN KEY (assigned_by) REFERENCES users(user_id),
    CONSTRAINT fk_assign_to 
        FOREIGN KEY (assigned_to) REFERENCES users(user_id)
);

-- 6. COMPLAINT_UPDATES TABLE (Audit Timeline & Work Logs)
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
        ON DELETE CASCADE,
    CONSTRAINT fk_updates_user 
        FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- 7. FEEDBACK TABLE (Resolution Rating & Review)
CREATE TABLE feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL UNIQUE,
    student_id INT NOT NULL,
    rating INT NOT NULL,
    comments TEXT,
    satisfaction_level VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_feedback_rating 
        CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT fk_feedback_complaint 
        FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_feedback_student 
        FOREIGN KEY (student_id) REFERENCES users(user_id)
);

-- 8. ACTIVITY_LOGS TABLE (Master System Audit Trail)
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
        ON DELETE SET NULL,
    CONSTRAINT fk_logs_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ====================================================================
-- DBMS TRIGGERS DEMONSTRATION
-- ====================================================================

-- TRIGGER 1: Automatically transition status from 'Pending' to 'Assigned'
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

-- TRIGGER 2: Auto-close complaint upon successful feedback submission
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

-- TRIGGER 3: Log all status changes into activity_logs
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
`;

const PRESET_QUERIES = [
  {
    name: '1. Multi-Table JOIN (Complaints, Users, Depts)',
    sql: `SELECT c.ticket_no, c.title, c.priority, c.status, u.name AS reporter_name, d.dept_name, c.created_at
FROM complaints c
JOIN users u ON c.reporter_id = u.user_id
JOIN categories cat ON c.category_id = cat.category_id
JOIN departments d ON cat.department_id = d.department_id;`
  },
  {
    name: '2. GROUP BY & Aggregation (Department Performance)',
    sql: `SELECT d.dept_code, d.dept_name,
       COUNT(c.complaint_id) AS total_complaints,
       SUM(CASE WHEN c.status IN ('Pending','Assigned','In Progress') THEN 1 ELSE 0 END) AS pending_count,
       SUM(CASE WHEN c.status IN ('Resolved','Closed') THEN 1 ELSE 0 END) AS resolved_count
FROM departments d
LEFT JOIN categories cat ON d.department_id = cat.department_id
LEFT JOIN complaints c ON cat.category_id = c.category_id
GROUP BY d.dept_code, d.dept_name;`
  },
  {
    name: '3. Priority Distribution (COUNT by Priority)',
    sql: `SELECT priority, COUNT(*) AS total_count
FROM complaints
GROUP BY priority
ORDER BY total_count DESC;`
  },
  {
    name: '4. Student Feedback & Satisfaction Report',
    sql: `SELECT f.feedback_id, c.ticket_no, u.name AS student_name, f.rating, f.satisfaction_level, f.comments
FROM feedback f
JOIN complaints c ON f.complaint_id = c.complaint_id
JOIN users u ON f.student_id = u.user_id;`
  },
  {
    name: '5. Master Activity Audit Trail (Recent 15)',
    sql: `SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 15;`
  },
  {
    name: '6. Schema Inspector: SHOW TABLES',
    sql: `SHOW TABLES;`
  },
  {
    name: '7. Schema Inspector: DESCRIBE complaints',
    sql: `DESCRIBE complaints;`
  }
];

class DBMSShowcase {
  constructor() {
    this.currentTab = 'er-diagram';
  }

  init() {
    this.renderPresetQueryButtons();
    this.renderDDLCode();
    this.renderNormalization();
    this.bindEvents();
  }

  bindEvents() {
    // Preset SQL button click
    const presetContainer = document.getElementById('preset-queries-list');
    if (presetContainer) {
      presetContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.preset-sql-btn');
        if (!btn) return;
        const index = parseInt(btn.dataset.index, 10);
        const query = PRESET_QUERIES[index];
        if (query) {
          const editor = document.getElementById('sql-editor-input');
          if (editor) {
            editor.value = query.sql;
            this.runSQL(query.sql);
          }
        }
      });
    }

    // Run SQL Button
    const runBtn = document.getElementById('btn-run-sql');
    if (runBtn) {
      runBtn.addEventListener('click', () => {
        const editor = document.getElementById('sql-editor-input');
        if (editor) this.runSQL(editor.value);
      });
    }

    // Keyboard shortcut: Ctrl + Enter in SQL Editor
    const editor = document.getElementById('sql-editor-input');
    if (editor) {
      editor.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          this.runSQL(editor.value);
        }
      });
    }

    // Copy DDL button
    const copyDdlBtn = document.getElementById('btn-copy-ddl');
    if (copyDdlBtn) {
      copyDdlBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(DBMS_DDL_SCRIPT).then(() => {
          copyDdlBtn.textContent = '✓ SQL Copied!';
          setTimeout(() => { copyDdlBtn.textContent = '📋 Copy Full SQL Script'; }, 2000);
        });
      });
    }
  }

  renderPresetQueryButtons() {
    const container = document.getElementById('preset-queries-list');
    if (!container) return;
    container.innerHTML = PRESET_QUERIES.map((q, idx) => `
      <button type="button" class="preset-sql-btn" data-index="${idx}">
        <span class="preset-icon">⚡</span>
        <span>${q.name}</span>
      </button>
    `).join('');
  }

  runSQL(sql) {
    if (!sql || !sql.trim()) return;
    const outputContainer = document.getElementById('sql-results-output');
    const statusContainer = document.getElementById('sql-status-badge');
    if (!outputContainer) return;

    outputContainer.innerHTML = `
      <div class="sql-loading-spinner">
        <div class="spinner"></div>
        <span>Executing relational query against database engine...</span>
      </div>
    `;

    setTimeout(() => {
      const result = window.db.executeCustomSQL(sql);

      if (!result.success) {
        if (statusContainer) {
          statusContainer.className = 'status-pill status-critical';
          statusContainer.textContent = 'Error: Query Failed';
        }
        outputContainer.innerHTML = `
          <div class="sql-error-box">
            <div class="error-header">⚠️ SQL Execution Error</div>
            <div class="error-msg">${result.error}</div>
          </div>
        `;
        return;
      }

      if (statusContainer) {
        statusContainer.className = 'status-pill status-resolved';
        statusContainer.textContent = `✓ Success • ${result.rows.length} rows returned • ${result.duration}ms`;
      }

      if (result.rows.length === 0) {
        outputContainer.innerHTML = `
          <div class="sql-empty-state">
            <span>Query executed successfully. 0 records returned.</span>
          </div>
        `;
        return;
      }

      // Render SQL Table
      const cols = result.columns;
      const html = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                ${cols.map(c => `<th>${c}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${result.rows.map(r => `
                <tr>
                  ${cols.map(c => {
                    let val = r[c] ?? 'NULL';
                    if (typeof val === 'string' && val.length > 50) val = val.substring(0, 50) + '...';
                    return `<td>${val}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      outputContainer.innerHTML = html;
    }, 250);
  }

  renderDDLCode() {
    const el = document.getElementById('ddl-code-block');
    if (el) {
      el.textContent = DBMS_DDL_SCRIPT;
    }
  }

  renderNormalization() {
    const container = document.getElementById('normalization-content');
    if (!container) return;

    container.innerHTML = `
      <div class="norm-grid">
        <!-- 1NF -->
        <div class="norm-card">
          <div class="norm-badge">Stage 1: 1NF</div>
          <h3>First Normal Form (Atomic Attributes)</h3>
          <p class="norm-desc">Eliminates repeating groups and comma-separated multi-valued values. Each column holds atomic, indivisible values.</p>
          <div class="norm-example">
            <div class="before-after">
              <span class="tag-bad">❌ Non-1NF:</span>
              <code>complaint(id, reporter, multiple_locations, tags)</code>
            </div>
            <div class="before-after">
              <span class="tag-good">✓ 1NF Applied:</span>
              <code>complaints(complaint_id, location_type, specific_location)</code>
            </div>
          </div>
          <div class="norm-point">
            <strong>Key Requirement:</strong> A primary key is designated for every table, and values are strictly atomic.
          </div>
        </div>

        <!-- 2NF -->
        <div class="norm-card">
          <div class="norm-badge">Stage 2: 2NF</div>
          <h3>Second Normal Form (No Partial Dependencies)</h3>
          <p class="norm-desc">The table is in 1NF and every non-prime attribute is fully functionally dependent on the entire primary key (no partial dependencies on a composite key).</p>
          <div class="norm-example">
            <div class="before-after">
              <span class="tag-bad">❌ Partial Dependency:</span>
              <code>assignment(complaint_id, staff_id, staff_name, staff_phone)</code>
              <small>Here, staff_name depends solely on staff_id, not complaint_id.</small>
            </div>
            <div class="before-after">
              <span class="tag-good">✓ 2NF Decomposed:</span>
              <code>users(user_id [PK], name, phone)</code><br>
              <code>assignments(assignment_id [PK], complaint_id [FK], assigned_to [FK])</code>
            </div>
          </div>
        </div>

        <!-- 3NF -->
        <div class="norm-card">
          <div class="norm-badge">Stage 3: 3NF</div>
          <h3>Third Normal Form (No Transitive Dependencies)</h3>
          <p class="norm-desc">The table is in 2NF and has no transitive dependencies $X \rightarrow Y \rightarrow Z$. Non-prime attributes must not depend on other non-prime attributes.</p>
          <div class="norm-example">
            <div class="before-after">
              <span class="tag-bad">❌ Transitive Dependency:</span>
              <code>complaint_id → category_id → department_name, dept_head</code>
              <small>Department details depend on category_id, creating update anomalies.</small>
            </div>
            <div class="before-after">
              <span class="tag-good">✓ 3NF Normalized:</span>
              <code>departments(department_id, dept_name, head_name)</code><br>
              <code>categories(category_id, department_id [FK])</code><br>
              <code>complaints(complaint_id, category_id [FK])</code>
            </div>
          </div>
        </div>

        <!-- BCNF -->
        <div class="norm-card">
          <div class="norm-badge">Stage 4: BCNF</div>
          <h3>Boyce-Codd Normal Form (Strict Superkeys)</h3>
          <p class="norm-desc">For every functional dependency $X \rightarrow Y$ in the relation, $X$ is a superkey. Guarantees zero redundancy and strict referential integrity.</p>
          <div class="norm-example">
            <div class="before-after">
              <span class="tag-good">✓ BCNF Verified:</span>
              <code>feedback(feedback_id [PK], complaint_id [UNIQUE/FK], rating, comments)</code>
              <small>Here, both feedback_id and complaint_id are candidate keys.</small>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

window.dbmsShowcase = new DBMSShowcase();
