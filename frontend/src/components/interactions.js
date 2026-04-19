import { predict, getHealth } from '../api.js'

const SKILLS_LIST = [
  'Python','SQL','JavaScript','Java','C++','HTML','CSS','React','Node.js','TypeScript',
  'Git','Docker','Kubernetes','AWS','Azure','GCP','Terraform','Linux',
  'Machine Learning','Deep Learning','TensorFlow','PyTorch','Scikit-learn','NLP',
  'Pandas','NumPy','Statistics','R','Excel','Tableau','Power BI','Data Cleaning',
  'Django','Flask','REST API','Microservices','MongoDB','OOP','Algorithms',
  'Data Structures','Bootstrap','CI/CD','JIRA','Communication','Project Management',
  'Business Intelligence','Data Analysis','Unit Testing','Networking','Kafka'
]

let selectedSkills = []
let lastResult = null

export function init() {
  setupNav()
  setupSliders()
  setupSteppers()
  setupRatingBars()
  setupSkillInput()
  setupForm()
  setupResultActions()
  checkAPIHealth()
}

// ── Navigation ────────────────────────────────────────────────────────────────
function setupNav() {
  const allBtns = document.querySelectorAll('[data-view]')
  allBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view
      switchView(view)
    })
  })
}

function switchView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
  document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'))
  const view = document.getElementById(`view-${viewId}`)
  if (view) view.classList.add('active')
  document.querySelectorAll(`[data-view="${viewId}"]`).forEach(b => b.classList.add('active'))
  // scroll to top
  document.querySelector('.main-content').scrollTop = 0
}

// ── Sliders ───────────────────────────────────────────────────────────────────
function setupSliders() {
  const cgpa  = document.getElementById('cgpa')
  const cgpaO = document.getElementById('cgpaOut')
  const apt   = document.getElementById('aptitude_score')
  const aptO  = document.getElementById('aptOut')

  const sync = (inp, out) => {
    out.textContent = inp.value
    inp.style.setProperty('--pct', `${(inp.value - inp.min) / (inp.max - inp.min) * 100}%`)
  }

  cgpa.addEventListener('input', () => sync(cgpa, cgpaO))
  apt .addEventListener('input', () => sync(apt,  aptO))
  sync(cgpa, cgpaO)
  sync(apt,  aptO)
}

// ── Steppers ──────────────────────────────────────────────────────────────────
function setupSteppers() {
  document.querySelectorAll('.step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const field   = btn.dataset.field
      const hidden  = document.getElementById(field)
      const display = document.getElementById(`${field}Val`)
      const isPlus  = btn.classList.contains('plus')
      const max     = field === 'internships' ? 3 : 10
      let val       = parseInt(hidden.value)
      val = isPlus ? Math.min(val + 1, max) : Math.max(val - 1, 0)
      hidden.value  = val
      display.textContent = val
    })
  })
}

// ── Rating Bars ───────────────────────────────────────────────────────────────
function setupRatingBars() {
  document.querySelectorAll('.rating-bar').forEach(bar => {
    const field  = bar.dataset.field
    const hidden = bar.querySelector('input[type="hidden"]')
    const dots   = bar.querySelectorAll('.rating-dot')

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const v = parseInt(dot.dataset.v)
        hidden.value = v
        dots.forEach((d, i) => d.classList.toggle('active', i < v))
      })
    })
  })
}

// ── Skill Tag Input ───────────────────────────────────────────────────────────
function setupSkillInput() {
  const raw   = document.getElementById('skillsRaw')
  const chips = document.getElementById('skillChips')
  const hidden= document.getElementById('skills')
  const sugg  = document.getElementById('skillSuggestions')

  function renderChips() {
    chips.innerHTML = selectedSkills.map(s => `
      <span class="skill-chip">
        ${s}
        <button type="button" class="chip-remove" data-skill="${s}">×</button>
      </span>
    `).join('')
    hidden.value = selectedSkills.join(', ')

    chips.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedSkills = selectedSkills.filter(x => x !== btn.dataset.skill)
        renderChips()
      })
    })
  }

  function addSkill(skill) {
    const s = skill.trim()
    if (s && !selectedSkills.includes(s)) {
      selectedSkills.push(s)
      renderChips()
    }
    raw.value = ''
    sugg.innerHTML = ''
    sugg.classList.remove('visible')
  }

  raw.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (raw.value.trim()) addSkill(raw.value.replace(',',''))
    }
    if (e.key === 'Backspace' && !raw.value && selectedSkills.length) {
      selectedSkills.pop()
      renderChips()
    }
  })

  raw.addEventListener('input', () => {
    const q = raw.value.toLowerCase().trim()
    if (!q) { sugg.innerHTML=''; sugg.classList.remove('visible'); return }
    const matches = SKILLS_LIST.filter(s =>
      s.toLowerCase().includes(q) && !selectedSkills.includes(s)
    ).slice(0, 6)
    if (matches.length) {
      sugg.innerHTML = matches.map(s =>
        `<button type="button" class="sugg-item" data-skill="${s}">${s}</button>`
      ).join('')
      sugg.classList.add('visible')
      sugg.querySelectorAll('.sugg-item').forEach(btn => {
        btn.addEventListener('click', () => addSkill(btn.dataset.skill))
      })
    } else {
      sugg.innerHTML=''; sugg.classList.remove('visible')
    }
  })

  document.addEventListener('click', e => {
    if (!e.target.closest('#skillsRaw') && !e.target.closest('#skillSuggestions')) {
      sugg.classList.remove('visible')
    }
  })
}

// ── Form Submit ───────────────────────────────────────────────────────────────
function setupForm() {
  const form   = document.getElementById('assessForm')
  const btn    = document.getElementById('submitBtn')
  const reset  = document.getElementById('resetBtn')

  form.addEventListener('submit', async e => {
    e.preventDefault()
    if (!selectedSkills.length) { showToast('Add at least one skill!', 'warn'); return }

    setLoading(true)

    const payload = {
      skills:               selectedSkills.join(', '),
      projects:             form.projects.value || 'None',
      certifications:       form.certifications.value || 'None',
      cgpa:                 parseFloat(form.cgpa.value),
      internships:          parseInt(form.internships.value),
      communication_skills: parseInt(form.communication_skills.value),
      problem_solving:      parseInt(form.problem_solving.value),
      aptitude_score:       parseInt(form.aptitude_score.value),
      role_interest:        form.role_interest.value
    }

    try {
      const result = await predict(payload)
      lastResult = { ...result, payload }
      renderResults(result)
      switchView('results')
    } catch (err) {
      showToast('Could not reach the API. Is the backend running?', 'error')
    } finally {
      setLoading(false)
    }
  })

  reset.addEventListener('click', () => {
    form.reset()
    selectedSkills = []
    document.getElementById('skillChips').innerHTML = ''
    document.getElementById('skills').value = ''
    document.getElementById('cgpaOut').textContent = '7.5'
    document.getElementById('aptOut').textContent  = '65'
    document.getElementById('internshipsVal').textContent = '0'
    document.getElementById('internships').value = '0'
    document.querySelectorAll('.rating-dot').forEach((d,i) => d.classList.toggle('active', i<4))
    document.getElementById('communication_skills').value = '5'
    document.getElementById('problem_solving').value = '5'
    // reset sliders
    document.getElementById('cgpa').style.setProperty('--pct','58.33%')
    document.getElementById('aptitude_score').style.setProperty('--pct','50%')
    showToast('Form reset', 'info')
  })
}

function setLoading(on) {
  const btn  = document.getElementById('submitBtn')
  const text = btn.querySelector('.btn-text')
  const icon = btn.querySelector('.btn-icon')
  const load = btn.querySelector('.btn-loader')
  btn.disabled = on
  text.textContent = on ? 'Analysing…' : 'Analyse My Profile'
  icon.classList.toggle('hidden', on)
  load.classList.toggle('hidden', !on)
}

// ── Results Rendering ─────────────────────────────────────────────────────────
function renderResults(result) {
  const empty = document.getElementById('resultsEmpty')
  const panel = document.getElementById('resultsPanel')
  empty.classList.add('hidden')
  panel.classList.remove('hidden')

  const ready = result.ready
  const conf  = result.confidence

  // Verdict card
  const card  = document.getElementById('verdictCard')
  card.className = `verdict-card ${ready ? 'ready' : 'not-ready'}`
  document.getElementById('badgeIcon').textContent  = ready ? '✓' : '✗'
  document.getElementById('badgeLabel').textContent = ready ? 'Job Ready' : 'Not Ready'
  document.getElementById('verdictTitle').textContent =
    ready ? 'You are Job Ready!' : 'Keep Building Your Profile'
  document.getElementById('verdictSub').textContent =
    ready
      ? `Strong profile with ${conf}% confidence. You\'re ready to apply!`
      : `${conf < 40 ? 'Significant' : 'Some'} gaps remain. Focus on the roadmap below.`

  // Animate confidence ring
  const circ = 2 * Math.PI * 50
  const fill = document.getElementById('ringFill')
  fill.style.strokeDasharray = circ
  fill.style.strokeDashoffset = circ
  setTimeout(() => {
    fill.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)'
    fill.style.strokeDashoffset = circ - (conf / 100) * circ
    fill.style.stroke = ready ? '#00FF87' : '#FF5C5C'
  }, 100)

  const pctEl = document.getElementById('ringPct')
  animateNumber(pctEl, 0, conf, 1200, v => `${v.toFixed(0)}%`)

  // Role cards
  const roleCards = document.getElementById('roleCards')
  const roleIcons = {'ML Engineer':'🤖','Data Analyst':'📊','Software Developer':'💻',
    'Web Developer':'🌐','Backend Developer':'⚙️','Business Analyst':'📈','Cloud Engineer':'☁️'}
  roleCards.innerHTML = result.top_roles.map((r, i) => `
    <div class="rec-role-card" style="animation-delay:${i*0.1}s">
      <div class="rrc-header">
        <span class="rrc-rank">#${i+1}</span>
        <span class="rrc-icon">${roleIcons[r.role]||'🎯'}</span>
        <span class="rrc-name">${r.role}</span>
      </div>
      <div class="rrc-bar-wrap">
        <div class="rrc-bar" style="--w:${r.score}%"></div>
      </div>
      <span class="rrc-score">${r.score}% match</span>
    </div>
  `).join('')

  // Skill Gap
  const gap = result.skill_gap
  const gapWrapper = document.getElementById('gapWrapper')
  const covColor = gap.coverage >= 70 ? '#00FF87' : gap.coverage >= 40 ? '#FFD166' : '#FF5C5C'
  gapWrapper.innerHTML = `
    <div class="gap-header">
      <div class="gap-role">Target: <strong>${gap.target_role}</strong></div>
      <div class="gap-cov" style="color:${covColor}">${gap.coverage}% covered</div>
    </div>
    <div class="gap-progress">
      <div class="gap-bar" style="width:${gap.coverage}%;background:${covColor}"></div>
    </div>
    <div class="gap-cols">
      <div class="gap-col have">
        <div class="gap-col-title">✓ You have (${gap.have.length})</div>
        ${gap.have.map(s=>`<span class="gap-chip have">${s}</span>`).join('')}
        ${!gap.have.length ? '<span class="gap-empty">None yet</span>' : ''}
      </div>
      <div class="gap-col missing">
        <div class="gap-col-title">✗ Learn next (${gap.missing.length})</div>
        ${gap.missing.map(s=>`<span class="gap-chip missing">${s}</span>`).join('')}
        ${!gap.missing.length ? '<span class="gap-empty">Nothing! 🎉</span>' : ''}
      </div>
    </div>
  `
}

function setupResultActions() {
  document.getElementById('backToAssess').addEventListener('click', () => switchView('assess'))
  document.getElementById('copyReport').addEventListener('click', () => {
    if (!lastResult) return
    const r = lastResult
    const text = [
      '=== CareerAI Job Readiness Report ===',
      `Status: ${r.job_ready} (${r.confidence}% confidence)`,
      '',
      'Top Roles:',
      ...r.top_roles.map((x,i) => `  ${i+1}. ${x.role} — ${x.score}% match`),
      '',
      `Skill Gap for ${r.skill_gap.target_role}:`,
      `  Have    : ${r.skill_gap.have.join(', ')||'None'}`,
      `  Missing : ${r.skill_gap.missing.join(', ')||'None'}`,
      `  Coverage: ${r.skill_gap.coverage}%`,
    ].join('\n')
    navigator.clipboard.writeText(text).then(() => showToast('Report copied!', 'success'))
  })
}

// ── API Health ────────────────────────────────────────────────────────────────
async function checkAPIHealth() {
  const dot    = document.getElementById('apiDot')
  const status = document.getElementById('apiStatus')
  const h = await getHealth()
  if (h.status === 'ok') {
    dot.classList.add('online')
    status.textContent = `${h.model} ready`
  } else {
    dot.classList.add('offline')
    status.textContent = 'API offline'
  }
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.className = `toast ${type} show`
  clearTimeout(t._t)
  t._t = setTimeout(() => t.classList.remove('show'), 3000)
}

function animateNumber(el, from, to, duration, fmt) {
  const start = performance.now()
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1)
    el.textContent = fmt(from + (to - from) * easeOut(p))
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3) }
