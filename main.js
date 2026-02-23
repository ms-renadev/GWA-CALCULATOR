
  /* ═══════════════════════════════════════════
     RULES (as specified):
     ─────────────────────────────────────────
     Dean's List     → Semestral GWA 1.00–1.75
     Crème de la Crème → Semestral GWA 1.00–1.25
     Cum Laude       → CGPA 1.46–1.75
     Magna Cum Laude → CGPA 1.21–1.45
     Summa Cum Laude → CGPA 1.00–1.20
     Scale: 1.00 = best, 5.00 = fail
  ═══════════════════════════════════════════ */

  /* ── STATE ── */
  let subjects  = [];
  let semesters = [];   // past sems: { id, gpa, units }
  let nextId    = 1;
  let nextSemId = 1;

  const PRESETS = [
    { name: 'Mathematics 101', units: 4, grade: 1.50 },
    { name: 'Filipino 1',      units: 3, grade: 1.25 },
    { name: 'English Comm.',   units: 3, grade: 1.00 },
    { name: 'Physics 101',     units: 5, grade: 1.75 },
    { name: 'PE 1',            units: 2, grade: 1.00 },
    { name: 'History 101',     units: 3, grade: 1.25 },
  ];

  /* ── GRADE COLOR FOR GWA VALUE ── */
  function gwaColorClass(g) {
    if (g == null) return '';
    if (g <= 1.25) return 'good';   // mint — excellent
    if (g <= 1.75) return 'good';   // still Dean's List
    if (g <= 2.50) return 'warn';   // ok
    return 'fail';
  }

  function pipClass(g) {
    if (!g || isNaN(g)) return '';
    if (g <= 1.75) return '';
    return g <= 3.00 ? 'warn' : 'fail';
  }

  /* ── RENDER SUBJECT ROW ── */
  function renderRow(s) {
    const row = document.createElement('div');
    row.className = 'subject-row';
    row.dataset.id = s.id;

    row.innerHTML = `
      <input class="row-input" type="text" placeholder="e.g. Math 101" value="${s.name}" data-field="name" />
      <div class="num-input-wrap">
        <button class="num-btn" data-dir="-1" data-field="units">−</button>
        <input class="num-input" type="number" min="1" max="9" value="${s.units}" data-field="units" />
        <button class="num-btn" data-dir="1" data-field="units">+</button>
      </div>
      <div class="grade-cell num-input-wrap" style="position:relative">
        <div class="grade-pip ${pipClass(s.grade)}"></div>
        <button class="num-btn" data-dir="-0.25" data-field="grade" style="padding-left:10px">−</button>
        <input class="grade-input" type="number" min="1" max="5" step="0.25" value="${s.grade}" data-field="grade" />
        <button class="num-btn" data-dir="0.25" data-field="grade">+</button>
      </div>
      <button class="del-btn" title="Remove">✕</button>
    `;

    row.querySelectorAll('.row-input, .num-input, .grade-input').forEach(inp => {
      inp.addEventListener('input', () => updateField(s.id, inp.dataset.field, inp.value));
    });
    row.querySelectorAll('.num-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s2 = subjects.find(x => x.id === s.id);
        if (!s2) return;
        const dir = parseFloat(btn.dataset.dir);
        if (btn.dataset.field === 'units') {
          s2.units = Math.min(9, Math.max(1, (s2.units || 1) + dir));
        } else {
          s2.grade = Math.min(5.00, Math.max(1.00, Math.round(((s2.grade || 1.00) + dir) * 100) / 100));
        }
        refreshAll();
      });
    });
    row.querySelector('.del-btn').addEventListener('click', () => {
      subjects = subjects.filter(x => x.id !== s.id);
      refreshAll();
    });
    return row;
  }

  function updateField(id, field, val) {
    const s = subjects.find(x => x.id === id);
    if (!s) return;
    if (field === 'name')  s.name  = val;
    if (field === 'units') s.units = parseInt(val)   || 1;
    if (field === 'grade') s.grade = parseFloat(val) || 1.00;
    updateCalc();
  }

  function refreshAll() {
    const container = document.getElementById('subjectRows');
    container.innerHTML = '';
    subjects.forEach((s, i) => {
      const row = renderRow(s);
      row.style.animationDelay = `${i * 0.04}s`;
      container.appendChild(row);
    });
    updateCalc();
  }

  /* ── RENDER SEMESTER ROW (CGPA section) ── */
  function renderSemRow(sem) {
    const row = document.createElement('div');
    row.className = 'sem-row';
    row.dataset.id = sem.id;
    row.innerHTML = `
      <span class="sem-label">Sem ${sem.id}</span>
      <input class="sem-input" type="number" min="1" max="5" step="0.01" placeholder="GPA e.g. 1.50" value="${sem.gpa || ''}" data-field="gpa" />
      <input class="sem-input" type="number" min="1" max="60" placeholder="Units e.g. 21" value="${sem.units || ''}" data-field="units" />
      <button class="del-btn" title="Remove">✕</button>
    `;
    row.querySelectorAll('.sem-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const s2 = semesters.find(x => x.id === sem.id);
        if (!s2) return;
        if (inp.dataset.field === 'gpa')   s2.gpa   = parseFloat(inp.value);
        if (inp.dataset.field === 'units') s2.units = parseFloat(inp.value);
        updateCGPA();
      });
    });
    row.querySelector('.del-btn').addEventListener('click', () => {
      semesters = semesters.filter(x => x.id !== sem.id);
      renderSemRows();
      updateCGPA();
    });
    return row;
  }

  function renderSemRows() {
    const container = document.getElementById('semRows');
    container.innerHTML = '';
    // Renumber labels
    semesters.forEach((s, i) => {
      s.displayNum = i + 1;
      const row = renderSemRow(s);
      row.querySelector('.sem-label').textContent = `Sem ${i + 1}`;
      container.appendChild(row);
    });
  }

  /* ── MAIN CALC (Semestral GWA) ── */
  function updateCalc() {
    const valid = subjects.filter(s => s.units > 0 && s.grade >= 1.00 && s.grade <= 5.00);
    const totalUnits  = valid.reduce((a, s) => a + s.units, 0);
    const weightedSum = valid.reduce((a, s) => a + s.grade * s.units, 0);
    const gwa = totalUnits > 0 ? weightedSum / totalUnits : null;

    /* GWA number */
    const gwaEl   = document.getElementById('gwaValue');
    const scaleEl = document.getElementById('gwaScale');
    if (gwa !== null) {
      gwaEl.textContent = gwa.toFixed(4);
      gwaEl.className   = 'gwa-value ' + gwaColorClass(gwa);
      // Inline hint
      if      (gwa <= 1.25) scaleEl.textContent = '👑 Crème de la Crème territory';
      else if (gwa <= 1.75) scaleEl.textContent = "📋 Dean's List territory";
      else if (gwa <= 2.50) scaleEl.textContent = 'Keep pushing — almost there';
      else                  scaleEl.textContent = 'Grades need improvement';
    } else {
      gwaEl.textContent = '—';
      gwaEl.className   = 'gwa-value';
      scaleEl.textContent = 'Add subjects to begin';
    }

    /* Total units */
    document.getElementById('totalUnits').textContent = totalUnits;

    /* Main status badge — only reflects CdlC/semestral standing */
    const badge = document.getElementById('statusBadge');
    const icon  = document.getElementById('deansIcon');
    if (gwa === null) {
      badge.className   = 'status-badge';
      badge.textContent = 'No data yet';
    } else if (gwa === 1.00) {
      badge.className   = 'status-badge cdlc';
      badge.textContent = 'Sheesh Boosing PL!';
      icon.classList.add('celebrate');
      setTimeout(() => icon.classList.remove('celebrate'), 700);
    } else if (1.25 >= gwa && gwa > 1.00) {
      badge.className   = 'status-badge cdlc';
      badge.textContent = 'Naks! CL! How to be u po';
      icon.classList.add('celebrate');
      setTimeout(() => icon.classList.remove('celebrate'), 700);
    }
    else if (gwa === 1.75 && gwa > 1.25) {
      badge.className   = 'status-badge close';
      badge.textContent = 'DL! Laban pa! Kunting push nalang next sem';
    } else {
      badge.className   = 'status-badge away';
      badge.textContent = 'hala ka meh!';
    }

    /* Honor strip — Crème de la Crème (semestral GWA only) */
    const cdlcStatus = document.getElementById('cdlcStatus');
    if (gwa === null) {
      cdlcStatus.className   = 'honor-block-status';
      cdlcStatus.textContent = '—';
    } else if (gwa <= 1.25) {
      cdlcStatus.className   = 'honor-block-status qualify-hot';
      cdlcStatus.textContent = '✓ Qualified';
    } else {
      cdlcStatus.className   = 'honor-block-status no';
      cdlcStatus.textContent = `${(gwa - 1.25).toFixed(4)} pts above cutoff`;
    }

    /* Honor strip — Dean's List status is driven by CGPA, show pending */
    const dlStatus = document.getElementById('dlStatus');
    dlStatus.className   = 'honor-block-status';
    dlStatus.textContent = 'Add semesters below ↓';

    /* Progress bar — maps 5.00→0%, 1.00→100%, mark DL at 1.75 */
    const pctEl  = document.getElementById('progressPct');
    const fillEl = document.getElementById('progressFill');
    if (gwa !== null) {
      const pct = Math.max(0, Math.min(100, ((5.00 - gwa) / (5.00 - 1.00)) * 100));
      fillEl.style.width = pct.toFixed(1) + '%';
      pctEl.textContent  = pct.toFixed(0) + '%';
      fillEl.className   = 'progress-fill' + (gwa <= 1.25 ? ' deans-fill' : '');
    } else {
      fillEl.style.width = '0%';
      pctEl.textContent  = '0%';
      fillEl.className   = 'progress-fill';
    }

    /* Insight cards */
    if (valid.length > 0) {
      const best  = valid.reduce((a, b) => a.grade < b.grade ? a : b);
      const worst = valid.reduce((a, b) => a.grade > b.grade ? a : b);
      document.getElementById('bestGrade').textContent    = best.grade.toFixed(2);
      document.getElementById('bestSubject').textContent  = best.name || 'Unnamed';
      document.getElementById('worstGrade').textContent   = worst.grade.toFixed(2);
      document.getElementById('worstSubject').textContent = worst.name || 'Unnamed';

      if (gwa !== null && gwa > 1.25) {
        const diff = gwa - 1.25;
        document.getElementById('targetNeeded').textContent = '+' + diff.toFixed(4);
        document.getElementById('targetSub').textContent    = 'pts above CdlC cutoff (1.25)';
      } else if (gwa !== null && gwa <= 1.25) {
        document.getElementById('targetNeeded').textContent = '✓';
        document.getElementById('targetSub').textContent    = "Crème de la Crème!";
      } else {
        document.getElementById('targetNeeded').textContent = '—';
        document.getElementById('targetSub').textContent    = 'Need GWA ≤ 1.25';
      }
    } else {
      ['bestGrade','bestSubject','worstGrade','worstSubject','targetNeeded'].forEach(id => {
        document.getElementById(id).textContent = '—';
      });
      document.getElementById('targetSub').textContent = 'Need GWA ≤ 1.75';
    }

    /* Also update CGPA since this sem is included */
    updateCGPA(gwa, totalUnits);
  }

  /* ── CGPA CALC (includes current sem) ── */
  function updateCGPA(currentGWA, currentUnits) {
    // If called standalone (from sem row changes), re-compute current sem
    if (currentGWA === undefined) {
      const valid = subjects.filter(s => s.units > 0 && s.grade >= 1 && s.grade <= 5);
      const u = valid.reduce((a, s) => a + s.units, 0);
      const w = valid.reduce((a, s) => a + s.grade * s.units, 0);
      currentGWA   = u > 0 ? w / u : null;
      currentUnits = u;
    }

    const validSems = semesters.filter(s => s.gpa > 0 && s.units > 0);

    // Include current sem if it has data
    let allEntries = [...validSems.map(s => ({ gpa: s.gpa, units: s.units }))];
    if (currentGWA !== null && currentUnits > 0) {
      allEntries.push({ gpa: currentGWA, units: currentUnits });
    }

    const cgpaEl    = document.getElementById('cgpaValue');
    const honorEl   = document.getElementById('cgpaHonor');
    const breakEl   = document.getElementById('cgpaBreakdown');

    if (allEntries.length === 0) {
      cgpaEl.textContent  = '—';
      cgpaEl.className    = 'cgpa-value';
      honorEl.className   = 'cgpa-honor';
      honorEl.textContent = 'Add semesters or subjects to see your Latin Honors standing';
      breakEl.textContent = '';
      return;
    }

    const totalW = allEntries.reduce((a, e) => a + e.gpa * e.units, 0);
    const totalU = allEntries.reduce((a, e) => a + e.units, 0);
    const cgpa   = totalW / totalU;

    cgpaEl.textContent = cgpa.toFixed(4);
    breakEl.textContent = `${allEntries.length} semester${allEntries.length > 1 ? 's' : ''} · ${totalU} total units`;

    if (cgpa <= 1.20) {
      cgpaEl.className  = 'cgpa-value summa-color';
      honorEl.className = 'cgpa-honor summa-h';
      honorEl.textContent = '🥇 Summa Cum Laude — With Highest Honors';
    } else if (cgpa <= 1.45) {
      cgpaEl.className  = 'cgpa-value magna-color';
      honorEl.className = 'cgpa-honor magna-h';
      honorEl.textContent = '🥈 Magna Cum Laude — With High Honors';
    } else if (cgpa <= 1.75) {
      cgpaEl.className  = 'cgpa-value cum-color';
      honorEl.className = 'cgpa-honor cum-h';
      honorEl.textContent = '🥉 Cum Laude — With Honors';
    } else {
      cgpaEl.className  = 'cgpa-value';
      honorEl.className = 'cgpa-honor';
      const toCum = cgpa - 1.75;
      honorEl.textContent = `${toCum.toFixed(4)} pts above Cum Laude cutoff (1.75)`;
    }

    /* Update Dean's List status in honor strip — based on CGPA */
    const dlStatus = document.getElementById('dlStatus');
    if (cgpa <= 1.75) {
      dlStatus.className   = 'honor-block-status qualify';
      dlStatus.textContent = `✓ Qualified (CGPA ${cgpa.toFixed(4)})`;
    } else {
      dlStatus.className   = 'honor-block-status no';
      dlStatus.textContent = `${(cgpa - 1.75).toFixed(4)} pts above cutoff`;
    }
  }

  /* ── CONTROLS ── */
  document.getElementById('addBtn').addEventListener('click', () => {
    subjects.push({ id: nextId++, name: '', units: 3, grade: 1.75 });
    refreshAll();
    setTimeout(() => {
      const rows = document.querySelectorAll('.subject-row');
      if (rows.length) rows[rows.length - 1].querySelector('.row-input').focus();
    }, 80);
  });

  document.getElementById('presetBtn').addEventListener('click', () => {
    subjects = PRESETS.map(p => ({ id: nextId++, ...p }));
    refreshAll();
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!subjects.length) return;
    subjects = [];
    refreshAll();
  });

  document.getElementById('addSemBtn').addEventListener('click', () => {
    semesters.push({ id: nextSemId++, gpa: null, units: null });
    renderSemRows();
    updateCGPA();
    setTimeout(() => {
      const rows = document.querySelectorAll('.sem-row');
      if (rows.length) rows[rows.length - 1].querySelector('.sem-input').focus();
    }, 80);
  });

  /* ── INIT ── */
  for (let i = 0; i < 3; i++) subjects.push({ id: nextId++, name: '', units: 3, grade: 1.75 });
  refreshAll();
