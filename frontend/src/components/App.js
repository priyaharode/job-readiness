export function App() {
  return /* html */`
<div class="app-shell">

  <!-- ── SIDEBAR NAV ─────────────────────────────────────────────────── -->
  <aside class="sidebar">
    <div class="sidebar-logo">
      <span class="logo-icon">⬡</span>
      <span class="logo-text">Career<em>AI</em></span>
    </div>

    <nav class="sidebar-nav">
      <button class="nav-item active" data-view="assess">
        <span class="nav-icon">◈</span>
        <span>Assess</span>
      </button>
      <button class="nav-item" data-view="results">
        <span class="nav-icon">◉</span>
        <span>Results</span>
      </button>
      <button class="nav-item" data-view="roles">
        <span class="nav-icon">◫</span>
        <span>Roles</span>
      </button>
      <button class="nav-item" data-view="about">
        <span class="nav-icon">◌</span>
        <span>About</span>
      </button>
    </nav>

    <div class="sidebar-status">
      <div class="status-dot" id="apiDot"></div>
      <span id="apiStatus">Connecting…</span>
    </div>
  </aside>

  <!-- ── MAIN CONTENT ────────────────────────────────────────────────── -->
  <main class="main-content">

    <!-- HERO STRIP -->
    <header class="page-header">
      <div class="header-inner">
        <div class="header-tag">AI-Powered Assessment</div>
        <h1 class="header-title">Are You <span class="accent-word">Job Ready?</span></h1>
        <p class="header-sub">Enter your profile. Get an instant readiness score, role recommendations, and a skill gap roadmap — all from a trained ML model.</p>
      </div>
      <div class="header-deco" aria-hidden="true">
        <div class="deco-ring r1"></div>
        <div class="deco-ring r2"></div>
        <div class="deco-ring r3"></div>
        <span class="deco-glyph"></span>
      </div>
    </header>

    <!-- ── VIEW: ASSESS ──────────────────────────────────────────────── -->
    <section class="view active" id="view-assess">

      <form class="assess-form" id="assessForm" novalidate>

        <!-- SKILLS ROW -->
        <div class="form-section">
          <div class="form-section-label">
            <span class="section-num">01</span>
            <span>Skills & Expertise</span>
          </div>

          <div class="field-group">
            <label class="field-label" for="skills">
              Technical Skills
              <span class="field-hint">Comma-separated (e.g. Python, SQL, React)</span>
            </label>
            <div class="tag-input-wrapper">
              <div class="tag-chips" id="skillChips"></div>
              <input type="text" id="skillsRaw" class="tag-input" placeholder="Type a skill and press Enter…" autocomplete="off" />
              <input type="hidden" id="skills" name="skills" />
            </div>
            <div class="skill-suggestions" id="skillSuggestions"></div>
          </div>

          <div class="field-row">
            <div class="field-group">
              <label class="field-label" for="projects">
                Projects Built
                <span class="field-hint">Comma-separated</span>
              </label>
              <input type="text" id="projects" name="projects" class="text-input"
                     placeholder="e.g. Image Classifier, Portfolio Website" />
            </div>
            <div class="field-group">
              <label class="field-label" for="certifications">
                Certifications
                <span class="field-hint">Comma-separated</span>
              </label>
              <input type="text" id="certifications" name="certifications" class="text-input"
                     placeholder="e.g. AWS Certified, IBM Data Science" />
            </div>
          </div>
        </div>

        <!-- ACADEMICS ROW -->
        <div class="form-section">
          <div class="form-section-label">
            <span class="section-num">02</span>
            <span>Academic Profile</span>
          </div>

          <div class="field-row three-col">
            <div class="field-group">
              <label class="field-label" for="cgpa">CGPA <span class="field-hint">4.0 – 10.0</span></label>
              <div class="slider-field">
                <input type="range" id="cgpa" name="cgpa" min="4" max="10" step="0.1" value="7.5" class="slider" />
                <output class="slider-out" id="cgpaOut">7.5</output>
              </div>
            </div>
            <div class="field-group">
              <label class="field-label" for="internships">Internships <span class="field-hint">0 – 3</span></label>
              <div class="stepper" id="internshipsStepper">
                <button type="button" class="step-btn minus" data-field="internships">−</button>
                <span class="step-val" id="internshipsVal">0</span>
                <button type="button" class="step-btn plus" data-field="internships">+</button>
                <input type="hidden" id="internships" name="internships" value="0" />
              </div>
            </div>
            <div class="field-group">
              <label class="field-label" for="role_interest">Role Interest</label>
              <div class="custom-select">
                <select id="role_interest" name="role_interest" class="select-input">
                  <option value="ML Engineer">ML Engineer</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Software Developer">Software Developer</option>
                  <option value="Web Developer">Web Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Business Analyst">Business Analyst</option>
                  <option value="Cloud Engineer">Cloud Engineer</option>
                </select>
                <span class="select-arrow">▾</span>
              </div>
            </div>
          </div>
        </div>

        <!-- SOFT SKILLS -->
        <div class="form-section">
          <div class="form-section-label">
            <span class="section-num">03</span>
            <span>Soft Skills & Aptitude</span>
          </div>

          <div class="field-row three-col">
            <div class="field-group">
              <label class="field-label">Communication <span class="field-hint">1 – 10</span></label>
              <div class="rating-bar" id="commRating" data-field="communication_skills" data-value="5">
                ${Array.from({length:10},(_,i)=>`<button type="button" class="rating-dot${i<5?' active':''}" data-v="${i+1}">${i+1}</button>`).join('')}
                <input type="hidden" id="communication_skills" name="communication_skills" value="5" />
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Problem Solving <span class="field-hint">1 – 10</span></label>
              <div class="rating-bar" id="psRating" data-field="problem_solving" data-value="5">
                ${Array.from({length:10},(_,i)=>`<button type="button" class="rating-dot${i<5?' active':''}" data-v="${i+1}">${i+1}</button>`).join('')}
                <input type="hidden" id="problem_solving" name="problem_solving" value="5" />
              </div>
            </div>
            <div class="field-group">
              <label class="field-label" for="aptitude_score">Aptitude Score <span class="field-hint">30 – 100</span></label>
              <div class="slider-field">
                <input type="range" id="aptitude_score" name="aptitude_score" min="30" max="100" step="1" value="65" class="slider" />
                <output class="slider-out" id="aptOut">65</output>
              </div>
            </div>
          </div>
        </div>

        <!-- SUBMIT -->
        <div class="form-submit-row">
          <button type="submit" class="submit-btn" id="submitBtn">
            <span class="btn-text">Analyse My Profile</span>
            <span class="btn-icon">→</span>
            <span class="btn-loader hidden">
              <span class="spin-ring"></span>
            </span>
          </button>
          <button type="button" class="ghost-btn" id="resetBtn">Reset</button>
        </div>

      </form>
    </section>

    <!-- ── VIEW: RESULTS ─────────────────────────────────────────────── -->
    <section class="view" id="view-results">
      <div class="results-empty" id="resultsEmpty">
        <div class="empty-icon">◎</div>
        <p>Submit your profile to see your results here.</p>
        <button class="ghost-btn" data-view="assess">Go to Assessment →</button>
      </div>

      <div class="results-panel hidden" id="resultsPanel">

        <!-- VERDICT CARD -->
        <div class="verdict-card" id="verdictCard">
          <div class="verdict-left">
            <div class="verdict-badge" id="verdictBadge">
              <span class="badge-icon" id="badgeIcon">?</span>
              <span class="badge-label" id="badgeLabel">…</span>
            </div>
            <div class="verdict-text">
              <h2 class="verdict-title" id="verdictTitle">Analysing…</h2>
              <p class="verdict-sub" id="verdictSub"></p>
            </div>
          </div>
          <div class="confidence-ring">
            <svg viewBox="0 0 120 120" class="ring-svg">
              <circle class="ring-bg" cx="60" cy="60" r="50"/>
              <circle class="ring-fill" cx="60" cy="60" r="50" id="ringFill"/>
            </svg>
            <div class="ring-label">
              <span class="ring-pct" id="ringPct">0%</span>
              <span class="ring-sub">confidence</span>
            </div>
          </div>
        </div>

        <!-- ROLE RECOMMENDATIONS -->
        <div class="results-section">
          <h3 class="results-section-title"><span class="section-num">01</span> Top Matched Roles</h3>
          <div class="role-cards" id="roleCards"></div>
        </div>

        <!-- SKILL GAP -->
        <div class="results-section">
          <h3 class="results-section-title"><span class="section-num">02</span> Skill Gap Analysis</h3>
          <div class="gap-wrapper" id="gapWrapper"></div>
        </div>

        <!-- ACTIONS -->
        <div class="results-actions">
          <button class="ghost-btn" id="backToAssess">← Edit Profile</button>
          <button class="submit-btn small" id="copyReport">Copy Report</button>
        </div>
      </div>
    </section>

    <!-- ── VIEW: ROLES ───────────────────────────────────────────────── -->
    <section class="view" id="view-roles">
      <div class="roles-grid">
        ${rolesData().map(r => `
          <div class="role-card-info" data-role="${r.name}">
            <div class="rci-icon">${r.icon}</div>
            <h3 class="rci-name">${r.name}</h3>
            <p class="rci-desc">${r.desc}</p>
            <div class="rci-skills">
              ${r.skills.map(s=>`<span class="rci-chip">${s}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- ── VIEW: ABOUT ───────────────────────────────────────────────── -->
    <section class="view" id="view-about">
      <div class="about-content">
        <div class="about-hero">
          <div class="about-glyph">⬡</div>
          <h2>About CareerAI</h2>
          <p>A complete ML-powered career guidance system — from data generation to prediction.</p>
        </div>

        <div class="about-grid">
          <div class="about-card">
            <div class="ac-num">8K</div>
            <div class="ac-label">Training Rows</div>
            <div class="ac-desc">Synthetic but realistic candidate profiles generated with weighted scoring logic</div>
          </div>
          <div class="about-card">
            <div class="ac-num">4</div>
            <div class="ac-label">ML Models</div>
            <div class="ac-desc">Logistic Regression, Decision Tree, Random Forest, XGBoost — best selected</div>
          </div>
          <div class="about-card">
            <div class="ac-num">91</div>
            <div class="ac-label">Features</div>
            <div class="ac-desc">TF-IDF (skills/projects/certs) + scaled numerics combined as sparse matrix</div>
          </div>
          <div class="about-card">
            <div class="ac-num">~95%</div>
            <div class="ac-label">Accuracy</div>
            <div class="ac-desc">XGBoost tuned with RandomizedSearchCV, ROC-AUC ≥ 0.98</div>
          </div>
        </div>

        <div class="tech-stack">
          <h3>Tech Stack</h3>
          <div class="tech-pills">
            ${['Python','Flask','scikit-learn','XGBoost','TF-IDF','Cosine Similarity',
               'Vite','Vanilla JS','CSS Variables','PWA','Service Worker','Web Manifest']
              .map(t=>`<span class="tech-pill">${t}</span>`).join('')}
          </div>
        </div>

        <div class="pipeline-steps">
          <h3>How It Works</h3>
          <div class="steps">
            ${['Dataset generation (8,000 rows with weighted scoring)',
               'TF-IDF vectorisation of Skills, Projects, Certifications',
               'StandardScaler on CGPA, Internships, Aptitude etc.',
               'hstack() merges text + numeric into 91-feature sparse matrix',
               'XGBoost trained & tuned with RandomizedSearchCV',
               'Model + vectorisers serialised to bundle.pkl',
               'Flask API loads pkl once, serves predictions in <50ms',
               'Cosine Similarity recommends top-3 job roles',
               'Set-difference reveals missing skills for target role']
              .map((s,i)=>`
              <div class="step-item">
                <span class="step-n">0${i+1}</span>
                <span class="step-txt">${s}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </section>

  </main>

  <!-- TOAST -->
  <div class="toast" id="toast"></div>

  <!-- MOBILE NAV -->
  <nav class="mobile-nav">
    <button class="mnav-item active" data-view="assess">◈<span>Assess</span></button>
    <button class="mnav-item" data-view="results">◉<span>Results</span></button>
    <button class="mnav-item" data-view="roles">◫<span>Roles</span></button>
    <button class="mnav-item" data-view="about">◌<span>About</span></button>
  </nav>

</div>
`
}

function rolesData() {
  return [
    { name:'Data Analyst', icon:'📊', desc:'Transform raw data into actionable insights using statistical methods and visualisation tools.',
      skills:['Python','SQL','Excel','Tableau','Power BI','Statistics'] },
    { name:'Software Developer', icon:'💻', desc:'Design and build scalable software applications across the full development lifecycle.',
      skills:['Java','Python','Git','OOP','Data Structures','Algorithms'] },
    { name:'ML Engineer', icon:'🤖', desc:'Build and deploy machine learning models that power intelligent product features.',
      skills:['Python','TensorFlow','PyTorch','Scikit-learn','NLP','Deep Learning'] },
    { name:'Web Developer', icon:'🌐', desc:'Create responsive, performant web experiences using modern frontend technologies.',
      skills:['JavaScript','React','Node.js','HTML','CSS','TypeScript'] },
    { name:'Backend Developer', icon:'⚙️', desc:'Architect robust server-side systems, APIs, and databases that power applications.',
      skills:['Python','Django','Docker','SQL','REST API','Kubernetes'] },
    { name:'Business Analyst', icon:'📈', desc:'Bridge the gap between business needs and technical solutions through data analysis.',
      skills:['Excel','SQL','Power BI','JIRA','Statistics','Tableau'] },
    { name:'Cloud Engineer', icon:'☁️', desc:'Design and manage scalable cloud infrastructure across AWS, GCP, and Azure.',
      skills:['AWS','Docker','Kubernetes','Terraform','Linux','CI/CD'] },
  ]
}
