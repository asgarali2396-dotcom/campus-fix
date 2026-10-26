/**
 * CampusFix - Core Application Controller
 * Handles UI interactions, Role-Based Access Control (RBAC),
 * PWA Service Worker registration, Modals, Forms, and Real-time SQL toasts.
 */

class CampusApp {
  constructor() {
    this.currentUser = null;
    this.currentFilter = {
      status: 'ALL',
      priority: 'ALL',
      department_id: 'ALL',
      search: '',
      viewMode: 'cards' // 'cards' or 'table'
    };
    this.activeModal = null;
    this.deferredPrompt = null;
    this.init();
  }

  init() {
    // 1. Set default user (Student: Sarth Santosh Pande)
    const savedUserId = localStorage.getItem('campusfix_active_user') || localStorage.getItem('campuscare_active_user');
    const user = savedUserId ? window.db.getUserById(savedUserId) : null;
    this.currentUser = user || window.db.getUserById(2); // Sarth Pande (Student)

    // 2. Setup theme
    this.initTheme();

    // 3. Register Service Worker & PWA Install handler
    this.initPWA();

    // 4. Listen to SQL events from RDBMS engine
    this.initSQLConsoleListener();

    // 5. Initialize UI Components
    this.renderHeaderUser();
    this.renderDashboardKPIs();
    this.renderDepartmentFilter();
    this.renderComplaintsList();
    this.bindGlobalEvents();

    // 6. Init DBMS academic showcase
    if (window.dbmsShowcase) {
      window.dbmsShowcase.init();
    }

    // 7. Check query params (e.g. ?action=new-complaint or ?page=signin)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new-complaint') {
      setTimeout(() => this.openNewComplaintModal(), 400);
    } else if (urlParams.get('tab') === 'dbms') {
      setTimeout(() => this.openDBMSModal(), 400);
    } else if (urlParams.get('page') === 'signin' || window.location.hash === '#signin') {
      setTimeout(() => this.openSignInPage(), 300);
    }
  }

  // ==========================================
  // PWA & SERVICE WORKER
  // ==========================================
  initPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered successfully:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }

    // Install prompt listener
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const installBtn = document.getElementById('btn-pwa-install');
      if (installBtn) installBtn.style.display = 'inline-flex';
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      const installBtn = document.getElementById('btn-pwa-install');
      if (installBtn) installBtn.style.display = 'none';
      this.showToast('CampusFix PWA installed to your device!', 'success');
    });

    // Offline / Online listeners
    window.addEventListener('online', () => this.updateOnlineStatus(true));
    window.addEventListener('offline', () => this.updateOnlineStatus(false));
    this.updateOnlineStatus(navigator.onLine);
  }

  updateOnlineStatus(isOnline) {
    const pill = document.getElementById('network-status-indicator');
    if (!pill) return;
    if (isOnline) {
      pill.innerHTML = '<span class="status-dot green"></span><span>Online (PWA Synced)</span>';
      pill.className = 'network-pill online';
    } else {
      pill.innerHTML = '<span class="status-dot amber"></span><span>Offline (Local Cache)</span>';
      pill.className = 'network-pill offline';
      this.showToast('You are currently offline. Local cache is active.', 'warning');
    }
  }

  triggerPWAInstall() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] User accepted installation prompt');
        }
        this.deferredPrompt = null;
        const installBtn = document.getElementById('btn-pwa-install');
        if (installBtn) installBtn.style.display = 'none';
      });
    } else {
      this.showToast('To install CampusFix: tap "Share" or "..." in browser and select "Add to Home Screen" or "Install App".', 'info');
    }
  }

  // ==========================================
  // THEME MANAGEMENT
  // ==========================================
  initTheme() {
    const saved = localStorage.getItem('campusfix_theme') || localStorage.getItem('campuscare_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateThemeButtonIcon(saved);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('campusfix_theme', next);
    this.updateThemeButtonIcon(next);
  }

  updateThemeButtonIcon(theme) {
    const btn = document.getElementById('btn-toggle-theme');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
  }

  // ==========================================
  // USER & ROLE-BASED ACCESS CONTROL (RBAC)
  // ==========================================
  switchUser(userId) {
    const user = window.db.getUserById(userId);
    if (!user) return;
    this.currentUser = user;
    localStorage.setItem('campusfix_active_user', user.user_id);
    this.renderHeaderUser();
    this.renderComplaintsList();
    this.renderDashboardKPIs();
    this.closeModal();

    this.showToast(`Switched active role to: ${user.name} (${user.role})`, 'info');
  }

  renderHeaderUser() {
    const nameEl = document.getElementById('active-user-name');
    const roleEl = document.getElementById('active-user-role');
    const avatarEl = document.getElementById('active-user-avatar');

    if (nameEl) nameEl.textContent = this.currentUser.name;
    if (avatarEl) avatarEl.textContent = this.currentUser.avatar || '👤';
    if (roleEl) {
      if (this.currentUser.role === 'STAFF') {
        const dept = window.db.getDepartments().find(d => d.department_id === this.currentUser.department_id);
        roleEl.textContent = `STAFF • ${dept?.dept_code || 'MAINT'}`;
      } else {
        roleEl.textContent = this.currentUser.role;
      }
      roleEl.className = `role-badge role-${this.currentUser.role.toLowerCase()}`;
    }

    // Role-dependent UI visibility
    const reportBtn = document.getElementById('btn-header-new-complaint');
    if (reportBtn) {
      reportBtn.style.display = 'inline-flex';
    }

    // Update Quick Role Switcher Buttons active state
    const quickStudent = document.getElementById('quick-btn-student');
    const quickAdmin = document.getElementById('quick-btn-admin');
    const quickStaff = document.getElementById('quick-btn-staff');
    if (quickStudent) quickStudent.classList.toggle('active', this.currentUser.role === 'STUDENT');
    if (quickAdmin) quickAdmin.classList.toggle('active', this.currentUser.role === 'ADMIN');
    if (quickStaff) quickStaff.classList.toggle('active', this.currentUser.role === 'STAFF');

    // Update Banner subtitle
    const rbacNotice = document.getElementById('rbac-current-perspective');
    if (rbacNotice) {
      if (this.currentUser.role === 'ADMIN') {
        rbacNotice.innerHTML = `Viewing as <strong>Campus Administrator</strong> (Full permissions: triage tickets, dispatch maintenance staff, oversee SLAs &amp; ACID audit logs)`;
      } else if (this.currentUser.role === 'STAFF') {
        const dept = window.db.getDepartments().find(d => d.department_id === this.currentUser.department_id);
        rbacNotice.innerHTML = `Viewing as <strong>Maintenance Staff</strong> [${this.currentUser.name} — ${dept?.dept_name || 'Maintenance'}]. Displaying assigned work orders.`;
      } else {
        rbacNotice.innerHTML = `Viewing as <strong>Student / Reporter</strong> [Roll: ${this.currentUser.roll_no || '28'}]. Report issues, track lifecycle &amp; provide feedback upon resolution.`;
      }
    }
  }

  // ==========================================
  // 3-ROLE ACCESS PORTAL (STUDENT, ADMIN, STAFF)
  // ==========================================
  openSignInPage(role = null) {
    const overlay = document.getElementById('auth-page-modal');
    if (!overlay) return;

    if (!role) {
      if (this.currentUser && this.currentUser.role === 'ADMIN') {
        role = 'staff';
      } else if (this.currentUser && this.currentUser.role === 'STAFF') {
        role = 'student';
      } else {
        role = 'admin';
      }
    }

    this.setAuthRoleTab(role);
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  closeSignInPage() {
    const overlay = document.getElementById('auth-page-modal');
    if (overlay) {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
  }

  setAuthRoleTab(role) {
    const tabs = ['student', 'admin', 'staff'];
    tabs.forEach(r => {
      const btn = document.getElementById(`tab-btn-${r}`);
      const pane = document.getElementById(`auth-pane-${r}`);
      if (btn) btn.classList.toggle('active', r === role);
      if (pane) pane.classList.toggle('active', r === role);
    });

    // Update Dynamic Info Banner
    const emblemEl = document.getElementById('info-role-emblem');
    const titleEl = document.getElementById('info-role-title');
    const descEl = document.getElementById('info-role-desc');
    const highlightsEl = document.getElementById('info-dbms-highlights');

    if (role === 'admin') {
      if (emblemEl) emblemEl.textContent = '🛡️';
      if (titleEl) titleEl.textContent = 'Admin Access';
      if (descEl) descEl.textContent = 'Chief Campus Infrastructure Administrator. Full authority to triage incoming complaints, allocate qualified department staff with instructions, and oversee SLA deadlines.';
      if (highlightsEl) {
        highlightsEl.innerHTML = `
          <div class="dbms-bullet"><span class="bullet-check">✓</span><span><strong>Administrator Dispatch:</strong> Inserts assignment orders with FK references.</span></div>
          <div class="dbms-bullet"><span class="bullet-check">✓</span><span><strong>Automated Trigger 1:</strong> Automatically transitions ticket to 'Assigned' state.</span></div>
          <div class="dbms-bullet"><span class="bullet-check">✓</span><span><strong>ACID Audit Trail:</strong> Every dispatch committed with rollback safety.</span></div>
        `;
      }
    } else if (role === 'staff') {
      if (emblemEl) emblemEl.textContent = '🔧';
      if (titleEl) titleEl.textContent = 'Maintenance Staff Access';
      if (descEl) descEl.textContent = 'Department Maintenance Technician Dashboard. View work orders assigned to you, advance state from Assigned ➔ In-Process ➔ Solved, and record technical field notes.';
      if (highlightsEl) {
        highlightsEl.innerHTML = `
          <div class="dbms-bullet"><span class="bullet-check">✓</span><span><strong>Assigned Work Orders:</strong> Filtered view showing problems assigned to your Staff ID.</span></div>
          <div class="dbms-bullet"><span class="bullet-check">✓</span><span><strong>Status Progression:</strong> Advance from Assigned ➔ In-Process ➔ Solved / Resolved.</span></div>
          <div class="dbms-bullet"><span class="bullet-check">✓</span><span><strong>Chronological Work Logs:</strong> Field notes saved to <code>complaint_updates</code> table.</span></div>
        `;
      }
    } else {
      if (emblemEl) emblemEl.textContent = '👨‍🎓';
      if (titleEl) titleEl.textContent = 'Student Access';
      if (descEl) descEl.textContent = 'Submit geotagged complaints across classrooms, hostels, and labs. Track real-time progress through 5 lifecycle stages, and provide 1-to-5 star reviews upon resolution.';
      if (highlightsEl) {
        highlightsEl.innerHTML = `
          <div class="dbms-bullet"><span class="bullet-check">✓</span><span><strong>Relational Integrity:</strong> Strict 1:1 constraint between Complaints &amp; Feedback.</span></div>
          <div class="dbms-bullet"><span class="bullet-check">✓</span><span><strong>CHECK Constraint:</strong> Student rating strictly bounded between 1 and 5 stars.</span></div>
          <div class="dbms-bullet"><span class="bullet-check">✓</span><span><strong>Auto-Closure Trigger 2:</strong> Feedback submission auto-closes ticket.</span></div>
        `;
      }
    }
  }

  togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    if (btnEl) {
      btnEl.textContent = isPassword ? '🙈' : '👁️';
    }
  }

  fillAdminDemoCredentials() {
    const emailInput = document.getElementById('admin-email-input');
    const pwdInput = document.getElementById('admin-password-input');
    if (emailInput) emailInput.value = 'pr.nerkar@campus.edu';
    if (pwdInput) pwdInput.value = 'admin123';
    this.showToast('Autofilled demo credentials for Prof. P. R. Nerkar (Administrator)', 'info');
  }

  showAdminCredentialsHint() {
    this.showToast('Administrator Demo Credentials: pr.nerkar@campus.edu / admin123', 'info');
  }

  onStudentPersonaChange(userId) {
    const user = window.db.getUserById(userId);
    if (!user) return;
    const emailInput = document.getElementById('student-email-input');
    const pwdInput = document.getElementById('student-password-input');
    if (emailInput) emailInput.value = user.roll_no ? `Roll ${user.roll_no}` : user.email;
    if (pwdInput) pwdInput.value = 'student123';
  }

  fillStudentDemoCredentials(userId = 2) {
    const select = document.getElementById('student-persona-select');
    if (select) select.value = String(userId);
    this.onStudentPersonaChange(userId);
    this.showToast('Autofilled demo credentials for Student (Roll 28 — Sarth Pande)', 'info');
  }

  showStudentCredentialsHint() {
    this.showToast('Student Demo Credentials: Select any Roll No from dropdown (Password: student123)', 'info');
  }

  onStaffPersonaChange(userId) {
    const user = window.db.getUserById(userId);
    if (!user) return;
    const emailInput = document.getElementById('staff-email-input');
    const pwdInput = document.getElementById('staff-password-input');
    if (emailInput) emailInput.value = user.email || `STAFF-00${user.user_id}`;
    if (pwdInput) pwdInput.value = 'staff123';
  }

  fillStaffDemoCredentials(userId = 6) {
    const select = document.getElementById('staff-persona-select');
    if (select) select.value = String(userId);
    this.onStaffPersonaChange(userId);
    this.showToast('Autofilled demo credentials for Maintenance Staff (Rajesh Sharma • ELEC)', 'info');
  }

  showStaffCredentialsHint() {
    this.showToast('Staff Demo Credentials: Select any technician from dropdown (Password: staff123)', 'info');
  }

  triggerCinematicLoginBurst(emblemText, callback) {
    const burstLayer = document.getElementById('auth-burst-effect');
    const emblemEl = document.getElementById('burst-emblem-icon');
    if (!burstLayer) {
      callback();
      return;
    }

    if (emblemEl) emblemEl.textContent = emblemText;
    burstLayer.classList.add('active');

    setTimeout(() => {
      callback();
      setTimeout(() => {
        burstLayer.classList.remove('active');
        this.closeSignInPage();
      }, 350);
    }, 550);
  }

  handleAdminLoginSubmit(e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('btn-admin-login');
    if (btn) btn.disabled = true;

    this.triggerCinematicLoginBurst('🛡️', () => {
      this.switchUser(1); // Prof. P. R. Nerkar (Admin)
      this.showToast('🎉 Welcome, Prof. P. R. Nerkar! Signed in to Campus Admin Portal.', 'success');
      if (btn) btn.disabled = false;
    });
  }

  handleStudentLoginSubmit(e) {
    if (e) e.preventDefault();
    const select = document.getElementById('student-persona-select');
    const selectedUserId = select ? parseInt(select.value, 10) : 2;
    const studentUser = window.db.getUserById(selectedUserId) || window.db.getUserById(2);

    const btn = document.getElementById('btn-student-login');
    if (btn) btn.disabled = true;

    this.triggerCinematicLoginBurst('👨‍🎓', () => {
      this.switchUser(studentUser.user_id);
      this.showToast(`🎉 Welcome, ${studentUser.name}! Signed in to Student Portal (Roll ${studentUser.roll_no}).`, 'success');
      if (btn) btn.disabled = false;
    });
  }

  handleStaffLoginSubmit(e) {
    if (e) e.preventDefault();
    const select = document.getElementById('staff-persona-select');
    const selectedUserId = select ? parseInt(select.value, 10) : 6;
    const staffUser = window.db.getUserById(selectedUserId) || window.db.getUserById(6);

    const btn = document.getElementById('btn-staff-login');
    if (btn) btn.disabled = true;

    this.triggerCinematicLoginBurst('🔧', () => {
      this.switchUser(staffUser.user_id);
      const dept = window.db.getDepartments().find(d => d.department_id === staffUser.department_id);
      this.showToast(`🎉 Welcome, ${staffUser.name}! Signed in to Maintenance Staff Portal [${dept?.dept_code || 'STAFF'}].`, 'success');
      if (btn) btn.disabled = false;
    });
  }

  logout() {
    localStorage.removeItem('campusfix_active_user');
    localStorage.removeItem('campuscare_active_user');
    this.showToast('You have logged out of your session.', 'info');
    this.openSignInPage('admin');
  }

  openRoleSwitcherModal() {
    this.openSignInPage();
  }

  // ==========================================
  // DASHBOARD KPI STATS & FILTERS
  // ==========================================
  renderDashboardKPIs() {
    const stats = window.db.getDashboardMetrics();

    document.getElementById('kpi-total-val').textContent = stats.total;
    document.getElementById('kpi-active-val').textContent = stats.active;
    document.getElementById('kpi-pending-val').textContent = stats.pending;
    document.getElementById('kpi-resolved-val').textContent = stats.resolved + stats.closed;
    document.getElementById('kpi-critical-val').textContent = stats.critical;
    document.getElementById('kpi-rate-val').textContent = `${stats.resolutionRate}%`;

    const avgHoursEl = document.getElementById('kpi-avg-hours');
    if (avgHoursEl) avgHoursEl.textContent = `${stats.avgResolutionHours}h avg`;
  }

  renderDepartmentFilter() {
    const depts = window.db.getDepartments();
    const select = document.getElementById('filter-dept-select');
    if (!select) return;

    select.innerHTML = `
      <option value="ALL">All Campus Departments</option>
      ${depts.map(d => `<option value="${d.department_id}">${d.dept_code} - ${d.dept_name}</option>`).join('')}
    `;
  }

  // ==========================================
  // COMPLAINTS LIST RENDERING
  // ==========================================
  renderComplaintsList() {
    let complaints = window.db.getComplaints(this.currentFilter);

    // If viewing as Staff, automatically prioritize tickets assigned to this technician at the top!
    if (this.currentUser && this.currentUser.role === 'STAFF') {
      complaints.sort((a, b) => {
        const aMine = a.assigned_to === this.currentUser.user_id ? 1 : 0;
        const bMine = b.assigned_to === this.currentUser.user_id ? 1 : 0;
        if (bMine !== aMine) return bMine - aMine;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }

    const countBadge = document.getElementById('complaint-count-badge');
    if (countBadge) countBadge.textContent = `${complaints.length} Records`;

    const container = document.getElementById('complaints-container');
    if (!container) return;

    if (complaints.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon">📭</div>
          <h3>No Maintenance Tickets Found</h3>
          <p>No complaints match the selected filter criteria. Try resetting filters or submit a new ticket.</p>
          <button class="btn btn-primary" onclick="window.app.resetFilters()">Reset Filters</button>
        </div>
      `;
      return;
    }

    if (this.currentFilter.viewMode === 'table') {
      this.renderComplaintsTableView(complaints, container);
    } else {
      this.renderComplaintsCardsView(complaints, container);
    }
  }

  renderComplaintsCardsView(complaints, container) {
    const html = `
      <div class="complaints-grid">
        ${complaints.map(c => this.renderComplaintCard(c)).join('')}
      </div>
    `;
    container.innerHTML = html;
  }

  renderComplaintCard(c) {
    const isMine = c.reporter_id === this.currentUser.user_id;
    const isAssignedToMe = c.assigned_to === this.currentUser.user_id;
    const priorityClass = `priority-${c.priority.toLowerCase()}`;
    const statusClass = `status-${c.status.toLowerCase().replace(/\s+/g, '-')}`;

    return `
      <div class="complaint-card ${isAssignedToMe ? 'assigned-to-me' : ''}" onclick="window.app.openComplaintDetailModal(${c.complaint_id})">
        <div class="card-top-row">
          <div class="ticket-badge-group">
            <span class="ticket-no">${c.ticket_no}</span>
            ${isMine ? '<span class="chip-my-ticket">My Ticket</span>' : ''}
            ${isAssignedToMe ? '<span class="chip-assigned-me">Assigned to You</span>' : ''}
          </div>
          <span class="priority-chip ${priorityClass}">
            <span class="dot"></span>
            ${c.priority}
          </span>
        </div>

        <h4 class="card-title">${this.escapeHtml(c.title)}</h4>

        <div class="card-location">
          <span class="loc-icon">📍</span>
          <span class="loc-text">${this.escapeHtml(c.specific_location)}</span>
        </div>

        <p class="card-desc">${this.escapeHtml(c.description.substring(0, 110))}${c.description.length > 110 ? '...' : ''}</p>

        <!-- Stepper Lifecycle Mini Progress -->
        <div class="stepper-mini">
          ${this.renderMiniStepper(c.status)}
        </div>

        <div class="card-meta-row">
          <div class="category-tag">
            <span>${this.getCategoryIcon(c.category.icon)}</span>
            <span>${c.category.category_name}</span>
          </div>
          <span class="status-pill ${statusClass}">${c.status}</span>
        </div>

        <div class="card-footer-row">
          <div class="avatar-tag" title="Reported by ${c.reporter.name}">
            <span class="avatar-sm">${c.reporter.avatar || '👤'}</span>
            <span class="reporter-name">${c.reporter.name.split(' ')[0]}</span>
          </div>

          <div class="card-time-ago">
            <span>⏱️ ${this.formatTimeAgo(c.created_at)}</span>
          </div>
        </div>
      </div>
    `;
  }

  renderMiniStepper(status) {
    const stages = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
    const currentIndex = stages.indexOf(status);

    return `
      <div class="stepper-mini-bar">
        ${stages.map((stage, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return `
            <div class="step-mini-node ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}" title="${stage}">
              <div class="step-dot"></div>
              ${idx < stages.length - 1 ? `<div class="step-line ${idx < currentIndex ? 'done' : ''}"></div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
      <div class="stepper-mini-label">Stage: <strong>${status}</strong></div>
    `;
  }

  renderComplaintsTableView(complaints, container) {
    const html = `
      <div class="table-responsive card-style">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Priority</th>
              <th>Category</th>
              <th>Title & Location</th>
              <th>Reporter</th>
              <th>Assigned Staff</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${complaints.map(c => `
              <tr onclick="window.app.openComplaintDetailModal(${c.complaint_id})" style="cursor:pointer">
                <td><strong>${c.ticket_no}</strong></td>
                <td><span class="priority-chip priority-${c.priority.toLowerCase()}">${c.priority}</span></td>
                <td>${this.getCategoryIcon(c.category.icon)} ${c.category.category_name}</td>
                <td>
                  <div class="table-title">${this.escapeHtml(c.title)}</div>
                  <div class="table-subloc">📍 ${this.escapeHtml(c.specific_location)}</div>
                </td>
                <td>${c.reporter.name}</td>
                <td>${c.assignee ? `<span>${c.assignee.name}</span>` : '<span class="text-muted">Unassigned</span>'}</td>
                <td><span class="status-pill status-${c.status.toLowerCase().replace(/\s+/g, '-')}">${c.status}</span></td>
                <td>
                  <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); window.app.openComplaintDetailModal(${c.complaint_id})">
                    Inspect
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // ==========================================
  // COMPLAINT DETAILS & LIFECYCLE MODAL
  // ==========================================
  openComplaintDetailModal(complaintId) {
    const c = window.db.getComplaintById(complaintId);
    if (!c) return;

    const isAdmin = this.currentUser.role === 'ADMIN';
    const isStaff = this.currentUser.role === 'STAFF';
    const isReporter = this.currentUser.user_id === c.reporter_id;
    const isAssignedTech = this.currentUser.user_id === c.assigned_to;

    // Full Interactive Stepper
    const stages = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
    const currentIndex = stages.indexOf(c.status);

    const stepperHtml = `
      <div class="lifecycle-stepper">
        ${stages.map((stage, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return `
            <div class="step-item ${isDone ? 'done' : ''} ${isCurrent ? 'active' : ''}">
              <div class="step-circle">${isDone ? '✓' : idx + 1}</div>
              <div class="step-label">${stage}</div>
              ${idx < stages.length - 1 ? `<div class="step-connector ${idx < currentIndex ? 'done' : ''}"></div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Action Panel depending on role
    let actionPanelHtml = '';

    // 1. Admin Assign Action (If unassigned or can reassign)
    if (isAdmin) {
      const staffList = window.db.getUsers('STAFF');
      actionPanelHtml += `
        <div class="action-card admin-action-card">
          <h4>🛡️ Administrator Dispatch & Assignment</h4>
          <p class="text-sm">Assign or reallocate this ticket to qualified department staff:</p>
          <form onsubmit="window.app.handleAssignForm(event, ${c.complaint_id})">
            <div class="form-row">
              <div class="form-group">
                <label>Select Staff Member:</label>
                <select name="staff_id" class="form-input" required>
                  <option value="">-- Choose Qualified Staff --</option>
                  ${staffList.map(s => {
                    const dept = window.db.getDepartments().find(d => d.department_id === s.department_id);
                    const selected = c.assigned_to === s.user_id ? 'selected' : '';
                    return `<option value="${s.user_id}" ${selected}>${s.name} (${dept?.dept_code || 'Staff'} - ${s.title})</option>`;
                  }).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Dispatch Instructions:</label>
                <input type="text" name="instructions" class="form-input" placeholder="e.g. Inspect before 2 PM, bring multimeter" />
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-sm">💾 Commit Assignment (ACID Tx)</button>
          </form>
        </div>
      `;
    }

    // 2. Staff Work Progress & Resolution Action (Accessible by Admin OR the assigned Technician)
    if ((isAdmin || (isStaff && isAssignedTech)) && c.status !== 'Closed') {
      const isAssigned = c.status === 'Assigned' || c.status === 'Pending';
      const isInProgress = c.status === 'In Progress';
      const isResolved = c.status === 'Resolved';

      actionPanelHtml += `
        <div class="action-card staff-action-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <h4 style="margin:0;">🔧 Maintenance Staff Action &amp; Work Order</h4>
            <span class="badge-mini" style="background:#5E936C; color:#fff;">Staff Access</span>
          </div>
          <p class="text-sm">Proceed this problem to <strong>In-Process</strong> state or mark as <strong>Solved</strong>:</p>
          <form onsubmit="window.app.handleStatusUpdateForm(event, ${c.complaint_id})">
            <div class="form-row">
              <div class="form-group">
                <label>Transition State To:</label>
                <select name="new_status" class="form-input" required>
                  ${isAssigned ? '<option value="In Progress" selected>⚡ In-Process State (Start Work / In Progress)</option>' : ''}
                  ${isInProgress ? '<option value="Resolved" selected>✅ Solved State (Mark Resolved)</option>' : ''}
                  ${isAssigned ? '<option value="Resolved">✅ Solved State (Mark Resolved Directly)</option>' : ''}
                  ${isResolved ? '<option value="Resolved" selected>✅ Already Solved (Resolved)</option>' : ''}
                  ${!isAssigned && !isInProgress && !isResolved ? '<option value="In Progress">⚡ In-Process State</option><option value="Resolved">✅ Solved State</option>' : ''}
                </select>
              </div>
              <div class="form-group">
                <label>Technician Field Notes / Remarks:</label>
                <input type="text" name="notes" class="form-input" 
                       placeholder="${isInProgress ? 'e.g. Replaced capacitor, tested voltage under load, fully solved.' : 'e.g. Arrived on site, diagnosed issue, commencing repairs...'}" 
                       required />
              </div>
            </div>
            <button type="submit" class="btn btn-success btn-sm">
              ${isAssigned ? '⚡ Proceed to In-Process State' : (isInProgress ? '✅ Mark as Solved State (Resolved)' : '⚡ Update Status')}
            </button>
          </form>
        </div>
      `;
    } else if (c.status === 'Resolved' && isStaff && isAssignedTech) {
      actionPanelHtml += `
        <div class="action-card" style="background: rgba(94, 147, 108, 0.15); border-left: 4px solid #5E936C; padding: 12px 16px;">
          <h4 style="color:#2E5A36; margin:0 0 4px 0;">🎉 Problem Solved &amp; Marked as Resolved!</h4>
          <p class="text-sm" style="margin:0; color:#1e293b;">
            Your work has been saved in the relational database. Waiting for student satisfaction review to transition this ticket to the <strong>Closed</strong> state.
          </p>
        </div>
      `;
    }

    // 3. Student Feedback Form (If Resolved and not Closed yet)
    if (c.status === 'Resolved' && !c.feedback) {
      actionPanelHtml += `
        <div class="action-card feedback-action-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <h4 style="margin:0;">⭐ Student Resolution Review &amp; Feedback</h4>
            <span class="badge-mini" style="background:#D98C45; color:#fff;">Student Access</span>
          </div>
          <p class="text-sm">Rate the technician's repair work to transition this problem to the <strong>Closed</strong> state (Database Trigger):</p>
          <form onsubmit="window.app.handleFeedbackForm(event, ${c.complaint_id})">
            <div class="star-rating-select">
              <label>Service Rating:</label>
              <div class="star-group">
                <input type="radio" id="star5" name="rating" value="5" checked><label for="star5">★ 5 Stars (Excellent)</label>
                <input type="radio" id="star4" name="rating" value="4"><label for="star4">★ 4 Stars (Good)</label>
                <input type="radio" id="star3" name="rating" value="3"><label for="star3">★ 3 Stars (Satisfactory)</label>
                <input type="radio" id="star2" name="rating" value="2"><label for="star2">★ 2 Stars (Needs Improvement)</label>
                <input type="radio" id="star1" name="rating" value="1"><label for="star1">★ 1 Star (Poor)</label>
              </div>
            </div>
            <div class="form-group" style="margin-top:10px;">
              <label>Student Feedback Comments:</label>
              <textarea name="comments" class="form-input" rows="2" placeholder="Was the maintenance issue resolved satisfactorily? Any comments..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-sm" style="margin-top:8px;">🌟 Submit Feedback &amp; Move to Closed State</button>
          </form>
        </div>
      `;
    }

    // 4. Feedback View if already given
    let feedbackDisplayHtml = '';
    if (c.feedback) {
      feedbackDisplayHtml = `
        <div class="feedback-display-box">
          <div class="feedback-stars">${'★'.repeat(c.feedback.rating)}${'☆'.repeat(5 - c.feedback.rating)}</div>
          <div class="feedback-satisfaction"><strong>${c.feedback.satisfaction_level}</strong></div>
          <p class="feedback-comment">"${this.escapeHtml(c.feedback.comments)}"</p>
          <div class="text-xs text-muted">Submitted on ${new Date(c.feedback.created_at).toLocaleString()}</div>
        </div>
      `;
    }

    // Updates Timeline
    const updatesHtml = c.updates.length ? `
      <div class="timeline-history">
        <h5>Work Logs & Progress History</h5>
        ${c.updates.map(u => {
          const user = window.db.getUserById(u.updated_by);
          return `
            <div class="timeline-item">
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <strong>${user?.name || 'Staff'}</strong> transitioned to <span class="badge-mini">${u.new_status}</span>
                  <span class="timeline-time">${new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="timeline-notes">${this.escapeHtml(u.notes)}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    ` : '<p class="text-muted text-sm">No work logs recorded yet.</p>';

    // Modal Content
    const content = `
      <div class="ticket-detail-view">
        <div class="ticket-header-meta">
          <div>
            <span class="ticket-id-large">${c.ticket_no}</span>
            <span class="priority-chip priority-${c.priority.toLowerCase()}">${c.priority} Priority</span>
            <span class="status-pill status-${c.status.toLowerCase().replace(/\s+/g, '-')}">${c.status}</span>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="window.app.printTicketReceipt(${c.complaint_id})">
            🖨️ Print Receipt
          </button>
        </div>

        <h3 class="ticket-headline">${this.escapeHtml(c.title)}</h3>

        ${stepperHtml}

        <div class="detail-split-grid">
          <!-- Left Column -->
          <div class="detail-col-main">
            <div class="info-block">
              <div class="info-label">Description & Issue Details</div>
              <div class="info-value-box">${this.escapeHtml(c.description)}</div>
            </div>

            ${c.photo_url ? `
              <div class="info-block">
                <div class="info-label">Issue Photographic Evidence</div>
                <div class="ticket-photo-wrapper">
                  <img src="${c.photo_url}" alt="Attachment" class="ticket-photo" />
                </div>
              </div>
            ` : ''}

            ${actionPanelHtml}

            ${feedbackDisplayHtml ? `
              <div class="info-block">
                <div class="info-label">Student Feedback & Review</div>
                ${feedbackDisplayHtml}
              </div>
            ` : ''}

            <div class="info-block">
              ${updatesHtml}
            </div>
          </div>

          <!-- Right Column Relational Schema Metadata -->
          <div class="detail-col-sidebar">
            <div class="meta-box card-style">
              <h4>📋 Relational Record Info</h4>
              
              <div class="meta-item">
                <span class="lbl">Location Type:</span>
                <span class="val">${c.location_type}</span>
              </div>

              <div class="meta-item">
                <span class="lbl">Specific Location:</span>
                <span class="val font-semibold">📍 ${this.escapeHtml(c.specific_location)}</span>
              </div>

              <div class="meta-item">
                <span class="lbl">Category:</span>
                <span class="val">${c.category.category_name}</span>
              </div>

              <div class="meta-item">
                <span class="lbl">Department:</span>
                <span class="val">${c.department.dept_name} (${c.department.dept_code})</span>
              </div>

              <div class="meta-item">
                <span class="lbl">Reported By:</span>
                <span class="val">${c.reporter.avatar} ${c.reporter.name}</span>
              </div>

              <div class="meta-item">
                <span class="lbl">Reporter Email:</span>
                <span class="val text-xs">${c.reporter.email}</span>
              </div>

              <div class="meta-item">
                <span class="lbl">Assigned Staff:</span>
                <span class="val">${c.assignee ? `${c.assignee.avatar} ${c.assignee.name}` : '<span class="badge-pending">Unassigned</span>'}</span>
              </div>

              <div class="meta-item">
                <span class="lbl">Reported At:</span>
                <span class="val text-xs">${new Date(c.created_at).toLocaleString()}</span>
              </div>

              ${c.resolved_at ? `
                <div class="meta-item">
                  <span class="lbl">Resolved At:</span>
                  <span class="val text-xs">${new Date(c.resolved_at).toLocaleString()}</span>
                </div>
              ` : ''}
            </div>

            <!-- DBMS Relational Constraints Box -->
            <div class="academic-note-box">
              <div class="note-title">🎓 DBMS Relational Integrity</div>
              <p class="text-xs">
                <code>PRIMARY KEY (complaint_id)</code><br>
                <code>FOREIGN KEY (reporter_id) REFERENCES users(user_id)</code><br>
                <code>FOREIGN KEY (category_id) REFERENCES categories(category_id)</code><br>
                <code>FOREIGN KEY (assigned_to) REFERENCES users(user_id)</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.openCustomModal(`Ticket Lifecycle Inspector - ${c.ticket_no}`, content, 'modal-lg');
  }

  // ==========================================
  // FORM HANDLERS (ASSIGN, STATUS, FEEDBACK, NEW COMPLAINT)
  // ==========================================
  handleAssignForm(event, complaintId) {
    event.preventDefault();
    const form = event.target;
    const staffId = form.staff_id.value;
    const instructions = form.instructions.value;

    try {
      window.db.assignComplaint(complaintId, staffId, this.currentUser.user_id, instructions);
      this.showToast('Staff member dispatched successfully via ACID Transaction!', 'success');
      this.renderComplaintsList();
      this.renderDashboardKPIs();
      this.openComplaintDetailModal(complaintId); // refresh modal
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  handleStatusUpdateForm(event, complaintId) {
    event.preventDefault();
    const form = event.target;
    const newStatus = form.new_status.value;
    const notes = form.notes.value;

    try {
      window.db.updateComplaintStatus(complaintId, newStatus, this.currentUser.user_id, notes);
      this.showToast(`Ticket status updated to ${newStatus}!`, 'success');
      this.renderComplaintsList();
      this.renderDashboardKPIs();
      this.openComplaintDetailModal(complaintId); // refresh modal
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  handleFeedbackForm(event, complaintId) {
    event.preventDefault();
    const form = event.target;
    const rating = form.rating.value;
    const comments = form.comments.value;

    try {
      window.db.submitFeedback(complaintId, this.currentUser.user_id, rating, comments);
      this.showToast('Thank you! Feedback recorded & Ticket closed by DBMS Trigger.', 'success');
      this.renderComplaintsList();
      this.renderDashboardKPIs();
      this.openComplaintDetailModal(complaintId); // refresh modal
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // ==========================================
  // NEW COMPLAINT MODAL
  // ==========================================
  openNewComplaintModal() {
    const categories = window.db.getCategories();

    const content = `
      <form id="new-complaint-form" onsubmit="window.app.handleNewComplaintSubmit(event)">
        <div class="form-desc-banner">
          Reporting issue as <strong>${this.currentUser.name}</strong> (${this.currentUser.role}).
          All submitted complaints are recorded in the relational database with ACID consistency.
        </div>

        <div class="form-group">
          <label>Issue Category & Department:</label>
          <div class="category-radio-grid">
            ${categories.map((cat, idx) => `
              <label class="category-radio-card">
                <input type="radio" name="category_id" value="${cat.category_id}" ${idx === 0 ? 'checked' : ''} required>
                <div class="card-inner">
                  <span class="cat-icon">${this.getCategoryIcon(cat.icon)}</span>
                  <div class="cat-name">${cat.category_name}</div>
                  <div class="cat-sla">SLA: ${cat.sla_hours}h • ${cat.department?.dept_code || 'Dept'}</div>
                </div>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Location Facility Type:</label>
            <select name="location_type" class="form-input" required>
              <option value="Classroom">Classroom / Lecture Hall</option>
              <option value="Laboratory">Laboratory / Practical Lab</option>
              <option value="Hostel">Hostel (Boys / Girls)</option>
              <option value="Library">Library & Reading Rooms</option>
              <option value="Campus Grounds">Campus Grounds & Walkways</option>
              <option value="Canteen">Cafeteria & Dining</option>
            </select>
          </div>

          <div class="form-group">
            <label>Priority Level:</label>
            <select name="priority" class="form-input" required>
              <option value="Low">Low (General maintenance, 48h-72h)</option>
              <option value="Medium" selected>Medium (Standard classroom issue, 24h-48h)</option>
              <option value="High">High (Impacting classes or exams, 12h-24h)</option>
              <option value="Critical">Critical (Safety hazard, fire/spark, server outage, 2h-4h)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Specific Campus Location:</label>
          <input type="text" name="specific_location" class="form-input" 
                 placeholder="e.g. Academic Block A, Room 302, 3rd Floor" required />
        </div>

        <div class="form-group">
          <label>Issue Title (Brief):</label>
          <input type="text" name="title" class="form-input" 
                 placeholder="e.g. Projector power socket loose and sparking" required />
        </div>

        <div class="form-group">
          <label>Detailed Problem Description:</label>
          <textarea name="description" class="form-input" rows="3" 
                    placeholder="Provide clear details to assist maintenance engineers in diagnosing the issue..." required></textarea>
        </div>

        <div class="form-group">
          <label>Attach Photo / Evidence (Optional):</label>
          <select name="sample_photo" class="form-input">
            <option value="">No photo</option>
            <option value="assets/sample_spark.svg">Sample: Electrical Sparking Hazard</option>
            <option value="assets/sample_wifi.svg">Sample: Wi-Fi Access Point Amber Error</option>
            <option value="assets/sample_leak.svg">Sample: Plumbing High-Pressure Leak</option>
            <option value="assets/sample_projector.svg">Sample: Seminar Projector Display Lamp Glitch</option>
          </select>
        </div>

        <div class="modal-footer-actions">
          <button type="button" class="btn btn-ghost" onclick="window.app.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">🚀 Submit Complaint (INSERT SQL)</button>
        </div>
      </form>
    `;

    this.openCustomModal('Report Campus Maintenance Complaint', content);
  }

  handleNewComplaintSubmit(event) {
    event.preventDefault();
    const form = event.target;

    const data = {
      reporter_id: this.currentUser.user_id,
      category_id: form.category_id.value,
      location_type: form.location_type.value,
      priority: form.priority.value,
      specific_location: form.specific_location.value,
      title: form.title.value,
      description: form.description.value,
      photo_url: form.sample_photo.value || null
    };

    try {
      const created = window.db.createComplaint(data);
      this.closeModal();
      this.renderComplaintsList();
      this.renderDashboardKPIs();
      this.showToast(`Complaint filed! Ticket ${created.ticket_no} created in database.`, 'success');
      setTimeout(() => this.openComplaintDetailModal(created.complaint_id), 300);
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // ==========================================
  // DBMS STUDIO / MODAL
  // ==========================================
  openDBMSModal(tab = 'er-diagram') {
    const modalEl = document.getElementById('dbms-studio-modal');
    if (modalEl) {
      modalEl.classList.add('open');
      this.switchDBMSTab(tab);
    }
  }

  closeDBMSModal() {
    const modalEl = document.getElementById('dbms-studio-modal');
    if (modalEl) modalEl.classList.remove('open');
  }

  switchDBMSTab(tabId) {
    document.querySelectorAll('.dbms-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.dbms-tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });
  }

  // ==========================================
  // REAL-TIME SQL CONSOLE DRAWER & TOASTS
  // ==========================================
  initSQLConsoleListener() {
    const logList = document.getElementById('sql-log-stream');
    const badge = document.getElementById('sql-query-count-badge');
    let count = 0;

    window.db.onSQLExecuted((event) => {
      count++;
      if (badge) badge.textContent = `${count} SQL`;

      // Prepend to SQL log drawer
      if (logList) {
        const item = document.createElement('div');
        item.className = 'sql-log-item';
        item.innerHTML = `
          <div class="sql-item-header">
            <span class="sql-badge sql-badge-${event.type.toLowerCase()}">${event.type}</span>
            <span class="sql-time">${event.timestamp} • ${event.durationMs}ms</span>
          </div>
          <pre class="sql-code-snippet"><code>${this.escapeHtml(event.sql)}</code></pre>
        `;
        logList.insertBefore(item, logList.firstChild);

        // Keep last 30 in drawer
        if (logList.children.length > 30) {
          logList.removeChild(logList.lastChild);
        }
      }

      // Small non-intrusive toast notification for SQL execution
      this.showSQLToast(event);
    });
  }

  showSQLToast(event) {
    const container = document.getElementById('sql-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'sql-toast';
    toast.innerHTML = `
      <div class="sql-toast-title">
        <span class="db-icon">🗄️ SQL:</span> <strong>${event.type}</strong>
        <span class="ms-tag">${event.durationMs}ms</span>
      </div>
      <div class="sql-toast-body">${this.escapeHtml(event.sql.split('\n')[0].substring(0, 75))}...</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }

  toggleSQLDrawer() {
    const drawer = document.getElementById('sql-console-drawer');
    if (drawer) drawer.classList.toggle('open');
  }

  // ==========================================
  // PRINT RECEIPT SLIP
  // ==========================================
  printTicketReceipt(complaintId) {
    const c = window.db.getComplaintById(complaintId);
    if (!c) return;

    const printWin = window.open('', '_blank', 'width=800,height=700');
    if (!printWin) return;

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CampusFix Maintenance Ticket Receipt - ${c.ticket_no}</title>
        <style>
          body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; padding: 30px; color: #291C0E; background: #ffffff; }
          .header { text-align: center; border-bottom: 2px solid #6E473B; padding-bottom: 15px; margin-bottom: 20px; }
          .inst-title { font-size: 20px; font-weight: bold; text-transform: uppercase; color: #291C0E; }
          .sub-title { font-size: 13px; color: #6E473B; margin-top: 4px; }
          .ticket-box { border: 1.5px solid #BEB5A9; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #FAF6F0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 12px; }
          .label { font-weight: bold; color: #5C4535; width: 180px; }
          .val { flex: 1; color: #291C0E; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 99px; background: #E1D4C2; color: #291C0E; font-weight: bold; }
          .footer { font-size: 11px; text-align: center; color: #826F61; border-top: 1px dashed #BEB5A9; padding-top: 15px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="inst-title">Campus Maintenance & Complaint Management System</div>
          <div class="sub-title">Database Management Systems Mini Project • Guided by: Prof. P. R. Nerkar</div>
          <div class="sub-title">Team: Sarth Pande (28), Takshak Sirsat (30), Manthan Dhamal (35), Ali Yusuf (40), Rohit Karpe (53)</div>
        </div>

        <div class="ticket-box">
          <div class="row">
            <div class="label">Ticket Reference No:</div>
            <div class="val"><strong>${c.ticket_no}</strong></div>
          </div>
          <div class="row">
            <div class="label">Issue Title:</div>
            <div class="val"><strong>${c.title}</strong></div>
          </div>
          <div class="row">
            <div class="label">Priority Level:</div>
            <div class="val">${c.priority}</div>
          </div>
          <div class="row">
            <div class="label">Current Status:</div>
            <div class="val"><span class="status">${c.status}</span></div>
          </div>
          <div class="row">
            <div class="label">Facility Location:</div>
            <div class="val">${c.location_type} — ${c.specific_location}</div>
          </div>
          <div class="row">
            <div class="label">Department:</div>
            <div class="val">${c.department.dept_name} (${c.department.dept_code})</div>
          </div>
          <div class="row">
            <div class="label">Reported By:</div>
            <div class="val">${c.reporter.name} (${c.reporter.email})</div>
          </div>
          <div class="row">
            <div class="label">Assigned Technician:</div>
            <div class="val">${c.assignee ? `${c.assignee.name} (${c.assignee.title})` : 'Unassigned (In Triage Queue)'}</div>
          </div>
          <div class="row">
            <div class="label">Date Created:</div>
            <div class="val">${new Date(c.created_at).toLocaleString()}</div>
          </div>
          <div class="row">
            <div class="label">Problem Details:</div>
            <div class="val">${c.description}</div>
          </div>
        </div>

        <div class="footer">
          <p>Generated by CampusFix RDBMS Engine • Certified ACID Transactional Audit Record</p>
        </div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `;
    printWin.document.write(receiptHtml);
    printWin.document.close();
  }

  // ==========================================
  // GENERAL MODAL & TOAST UTILITIES
  // ==========================================
  openCustomModal(title, bodyHtml, extraClass = '') {
    const modalEl = document.getElementById('app-dynamic-modal');
    if (!modalEl) return;

    document.getElementById('app-modal-title').textContent = title;
    document.getElementById('app-modal-body').innerHTML = bodyHtml;

    const dialog = modalEl.querySelector('.modal-dialog');
    if (dialog) {
      dialog.className = `modal-dialog ${extraClass}`;
    }

    modalEl.classList.add('open');
    this.activeModal = modalEl;
  }

  closeModal() {
    const modalEl = document.getElementById('app-dynamic-modal');
    if (modalEl) modalEl.classList.remove('open');
    this.activeModal = null;
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('ui-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `app-toast toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-msg">${this.escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 350);
    }, 3800);
  }

  bindGlobalEvents() {
    // Search input
    const searchInput = document.getElementById('search-complaints-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentFilter.search = e.target.value;
        this.renderComplaintsList();
      });
    }

    // Status filter tabs
    document.querySelectorAll('.filter-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter.status = btn.dataset.status;
        this.renderComplaintsList();
      });
    });

    // Priority filter
    const prioSelect = document.getElementById('filter-priority-select');
    if (prioSelect) {
      prioSelect.addEventListener('change', (e) => {
        this.currentFilter.priority = e.target.value;
        this.renderComplaintsList();
      });
    }

    // Department filter
    const deptSelect = document.getElementById('filter-dept-select');
    if (deptSelect) {
      deptSelect.addEventListener('change', (e) => {
        this.currentFilter.department_id = e.target.value;
        this.renderComplaintsList();
      });
    }

    // View mode toggle
    const viewCardsBtn = document.getElementById('btn-view-cards');
    const viewTableBtn = document.getElementById('btn-view-table');
    if (viewCardsBtn && viewTableBtn) {
      viewCardsBtn.addEventListener('click', () => {
        viewCardsBtn.classList.add('active');
        viewTableBtn.classList.remove('active');
        this.currentFilter.viewMode = 'cards';
        this.renderComplaintsList();
      });
      viewTableBtn.addEventListener('click', () => {
        viewTableBtn.classList.add('active');
        viewCardsBtn.classList.remove('active');
        this.currentFilter.viewMode = 'table';
        this.renderComplaintsList();
      });
    }
  }

  resetFilters() {
    this.currentFilter = {
      status: 'ALL',
      priority: 'ALL',
      department_id: 'ALL',
      search: '',
      viewMode: 'cards'
    };
    const searchInput = document.getElementById('search-complaints-input');
    if (searchInput) searchInput.value = '';
    const prioSelect = document.getElementById('filter-priority-select');
    if (prioSelect) prioSelect.value = 'ALL';
    const deptSelect = document.getElementById('filter-dept-select');
    if (deptSelect) deptSelect.value = 'ALL';
    document.querySelectorAll('.filter-pill-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.status === 'ALL');
    });
    this.renderComplaintsList();
  }

  getCategoryIcon(icon) {
    const map = {
      zap: '⚡',
      wifi: '🌐',
      droplet: '🚰',
      sparkles: '✨',
      monitor: '🖥️',
      tool: '🔨',
      cpu: '🔬',
      'alert-circle': '⚠️'
    };
    return map[icon] || '🔧';
  }

  formatTimeAgo(isoDate) {
    const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

// Instantiate global app controller
function initCampusApp() {
  if (!window.app) {
    window.app = new CampusApp();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCampusApp);
} else {
  initCampusApp();
}
