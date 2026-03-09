  const MET = {
    freestyle:    { easy: 5.8, moderate: 7.0, hard: 10.0 },
    breaststroke: { easy: 5.3, moderate: 6.5, hard: 10.3 },
    backstroke:   { easy: 4.8, moderate: 6.0, hard:  9.5 },
    butterfly:    { easy: 8.0, moderate: 10.0, hard: 13.8 },
    mixed:        { easy: 5.5, moderate: 7.0, hard:  9.5 }
  };

  const DAILY_GOAL_KCAL = 500;
  let profile = { weight: null, height: null, age: null, sex: 'male', bmi: null };
  let sessions = [];
  let selectedSex = 'male';

  // === SEX TOGGLE ===
  function selectSex(val) {
    selectedSex = val;
    document.querySelectorAll('.sex-toggle button').forEach(b =>
      b.classList.toggle('selected', b.dataset.val === val));
  }

  // === LIVE VALIDATION: enable/disable Continue + show warnings ===
  function checkContinueEnabled() {
    const h = parseFloat(document.getElementById('height').value);
    const w = parseFloat(document.getElementById('weight').value);
    const a = parseFloat(document.getElementById('age').value);
    const allFilled = !isNaN(h) && h > 0 && !isNaN(w) && w > 0 && !isNaN(a) && a > 0;
    document.getElementById('btnContinue').classList.toggle('btn-continue--locked', !allFilled);
  }

  function checkWarnings() {
    const h = parseFloat(document.getElementById('height').value);
    const w = parseFloat(document.getElementById('weight').value);
    const a = parseFloat(document.getElementById('age').value);

    let warnH = '', warnW = '', warnA = '', warnBMI = '';

    // Age-based height limits
    if (!isNaN(a) && !isNaN(h) && h > 0) {
      if      (a < 7  && h > 130) warnH = `Height above 130 cm is unusual for age ${a}`;
      else if (a < 10 && h > 155) warnH = `Height above 155 cm is unusual for age ${a}`;
      else if (a < 14 && h > 180) warnH = `Height above 180 cm is unusual for age ${a}`;
    }

    // Age-based weight limits
    if (!isNaN(a) && !isNaN(w) && w > 0) {
      if      (a < 7  && w > 35) warnW = `Weight above 35 kg is unusual for age ${a}`;
      else if (a < 10 && w > 50) warnW = `Weight above 50 kg is unusual for age ${a}`;
      else if (a < 14 && w > 70) warnW = `Weight above 70 kg is unusual for age ${a}`;
    }

    // Age range sanity
    if (!isNaN(a) && (a < 3 || a > 120)) {
      warnA = `Age ${a} seems outside a normal range`;
    }

    // BMI sanity — shown under Sex field
    if (!isNaN(h) && !isNaN(w) && h > 0 && w > 0) {
      const bmi = w / ((h / 100) ** 2);
      if      (bmi < 12) warnBMI = `BMI of ${bmi.toFixed(1)} seems very low — double-check values`;
      else if (bmi > 60) warnBMI = `BMI of ${bmi.toFixed(1)} seems very high — double-check values`;
    }

    setWarn('warn-height', warnH);
    setWarn('warn-weight', warnW);
    setWarn('warn-age',    warnA);
    setWarn('warn-bmi',    warnBMI);
  }

  function setWarn(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg ? '⚠ ' + msg : '';
    el.classList.toggle('visible', !!msg);
  }

  function stepInput(id, delta) {
    const el = document.getElementById(id);
    const step = parseFloat(el.step) || 1;
    const current = parseFloat(el.value) || 0;
    el.value = Math.max(parseFloat(el.min) || 0, current + delta * step);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function setFieldError(id, msg) {
    const el = document.getElementById('err-' + id);
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('visible', !!msg);
  }

  // === SUBMIT PROFILE (Screen 1 → Screen 2) ===
  function submitProfile() {
    if (document.getElementById('btnContinue').classList.contains('btn-continue--locked')) {
      const btn = document.getElementById('btnContinue');
      btn.style.animation = 'none'; btn.offsetHeight;
      btn.style.animation = 'shake 0.4s ease';
      const LABELS = { height: 'Height is required', weight: 'Weight is required', age: 'Age is required' };
      ['height', 'weight', 'age'].forEach(id => {
        const el = document.getElementById(id);
        const val = parseFloat(el.value);
        if (!el.value || isNaN(val) || val <= 0) {
          el.classList.add('input-error');
          setFieldError(id, LABELS[id]);
        }
      });
      setTimeout(() => {
        ['height', 'weight', 'age'].forEach(id => {
          document.getElementById(id).classList.remove('input-error');
          setFieldError(id, '');
        });
      }, 2000);
      return;
    }

    const hRaw = document.getElementById('height').value;
    const wRaw = document.getElementById('weight').value;
    const aRaw = document.getElementById('age').value;
    const h = parseFloat(hRaw);
    const w = parseFloat(wRaw);
    const a = parseInt(aRaw);

    // Hard validation — absolute limits only
    let errors = [], badFields = [];

    if (!hRaw || isNaN(h)) {
      setFieldError('height', 'Height is required');
      errors.push('Please enter your height'); badFields.push('height');
    } else if (h < 50 || h > 250) {
      setFieldError('height', 'Must be 50–250 cm');
      errors.push(`<strong>${h} cm</strong> doesn't look right — expected 50–250 cm`);
      badFields.push('height');
    }

    if (!wRaw || isNaN(w)) {
      setFieldError('weight', 'Weight is required');
      errors.push('Please enter your weight'); badFields.push('weight');
    } else if (w < 10 || w > 300) {
      setFieldError('weight', 'Must be 10–300 kg');
      errors.push(`<strong>${w} kg</strong> doesn't look right — expected 10–300 kg`);
      badFields.push('weight');
    }

    if (!aRaw || isNaN(a)) {
      setFieldError('age', 'Age is required');
      errors.push('Please enter your age'); badFields.push('age');
    } else if (a < 1 || a > 120) {
      setFieldError('age', 'Must be 1–120');
      errors.push(`<strong>${a} years</strong> doesn't seem right — expected 1–120`);
      badFields.push('age');
    }

    if (errors.length > 0) {
      showError(errors.join('<br>'), badFields);
      const btn = document.getElementById('btnContinue');
      btn.style.animation = 'none'; btn.offsetHeight;
      btn.style.animation = 'shake 0.4s ease';
      return;
    }

    profile.weight = w;
    profile.height = h;
    profile.age    = a;
    profile.sex    = selectedSex;

    const bmi = w / ((h / 100) ** 2);
    profile.bmi = bmi;


    // Populate profile strip
    document.getElementById('stripWeight').textContent = w;
    document.getElementById('stripHeight').textContent = h;
    document.getElementById('stripBmiVal').textContent = bmi.toFixed(1);

    // Recalc any existing sessions
    sessions.forEach(s => { s.kcal = calcCalories(s.stroke, s.intensity, s.duration); });

    goToTracker();
    updateUI();
  }

  // === SCREEN NAVIGATION ===
  function goToTracker() {
    document.getElementById('screenOnboarding').classList.remove('active');
    const tracker = document.getElementById('screenTracker');
    tracker.classList.add('active');
    // Re-trigger animation
    tracker.style.animation = 'none';
    tracker.offsetHeight;
    tracker.style.animation = '';
  }

  function goToOnboarding() {
    // Pre-fill fields with current profile values
    if (profile.height) document.getElementById('height').value = profile.height;
    if (profile.weight) document.getElementById('weight').value = profile.weight;
    if (profile.age)    document.getElementById('age').value    = profile.age;
    selectSex(profile.sex || 'female');
    checkWarnings();
    checkContinueEnabled();

    document.getElementById('screenTracker').classList.remove('active');
    const onb = document.getElementById('screenOnboarding');
    onb.classList.add('active');
    onb.style.animation = 'none';
    onb.offsetHeight;
    onb.style.animation = '';
    setTimeout(() => document.getElementById('height').focus(), 300);
  }

  // === ERROR TOAST ===
  let toastTimer = null;
  function smoothScrollTo(el, duration) {
    const start = window.pageYOffset;
    const target = el.getBoundingClientRect().top + start;
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min((now - t0) / duration, 1);
      const ease = p < 0.5 ? 2*p*p : -1+(4-2*p)*p;
      window.scrollTo(0, start + (target - start) * ease);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  let confirmTimer = null;
  function showSessionConfirm() {
    const el = document.getElementById('sessionConfirm');
    el.classList.add('visible');
    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => el.classList.remove('visible'), 4000);
  }

  function showError(msg, fieldIds) {
    document.querySelectorAll('.error-toast').forEach(el => el.remove());
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));

    if (fieldIds) {
      fieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('input-error');
      });
    }

    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
      <span class="toast-icon">⚠️</span>
      <span class="toast-msg">${msg}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    document.body.appendChild(toast);

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.remove();
      document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
      ['height', 'weight', 'age'].forEach(id => setFieldError(id, ''));
    }, 3600);
  }

  // === CALORIES ===
  function calcCalories(stroke, intensity, durationMin) {
    const met = MET[stroke]?.[intensity] || 8;
    return Math.round(met * profile.weight * (durationMin / 60));
  }

  // === UI ===
  let historyOpen = false;

  function updateUI() {
    const totalKcal = sessions.reduce((s, x) => s + x.kcal, 0);
    const totalDist = sessions.reduce((s, x) => s + x.distance, 0);
    const totalMin  = sessions.reduce((s, x) => s + x.duration, 0);

    document.getElementById('goalNumber').textContent = totalKcal;
    const pct = Math.min(totalKcal / DAILY_GOAL_KCAL, 1);
    const circumference = 2 * Math.PI * 65;
    document.getElementById('ringFill').style.strokeDashoffset = circumference * (1 - pct);

    document.getElementById('totalDist').textContent = totalDist.toLocaleString();
    document.getElementById('totalTime').textContent = totalMin;
    document.getElementById('sessionCount').textContent = sessions.length;
    document.getElementById('kcalPerMin').textContent = totalMin > 0 ? (totalKcal / totalMin).toFixed(1) : '—';

    const badge = document.getElementById('sessionBadge');
    if (sessions.length > 0) {
      badge.textContent = sessions.length; badge.classList.add('visible');
    } else {
      badge.classList.remove('visible');
    }

    const clearBtn = document.getElementById('clearBtn');
    sessions.length > 0 ? clearBtn.classList.add('visible') : clearBtn.classList.remove('visible');

    const list = document.getElementById('sessionList');
    if (sessions.length === 0) {
      list.innerHTML = '<div class="empty-state">No sessions yet — go make some waves!</div>';
    } else {
      list.innerHTML = sessions.map((s, i) => {
        const sl = s.stroke.charAt(0).toUpperCase() + s.stroke.slice(1);
        const il = s.intensity.charAt(0).toUpperCase() + s.intensity.slice(1);
        const timeStr = s.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `<div class="session" id="session-${i}">
          <div class="left">
            <div class="stroke-name">${sl}</div>
            <div class="meta">${il} · ${s.duration} min · ${timeStr}</div>
          </div>
          <div class="mid">
            <div class="kcal">${s.kcal} kcal</div>
            <div class="dist">${s.distance.toLocaleString()} m</div>
          </div>
          <button class="del-btn" onclick="removeSession(${i})" title="Remove">✕</button>
        </div>`;
      }).reverse().join('');
    }

  }

  // === TOGGLE HISTORY ===
  function toggleHistory() {
    historyOpen = !historyOpen;
    document.getElementById('sessionList').classList.toggle('collapsed', !historyOpen);
    document.getElementById('toggleArrow').classList.toggle('collapsed', !historyOpen);
  }

  // === REMOVE SINGLE SESSION ===
  function removeSession(index) {
    const el = document.getElementById('session-' + index);
    if (el) {
      el.classList.add('removing');
      setTimeout(() => { sessions.splice(index, 1); updateUI(); }, 350);
    } else {
      sessions.splice(index, 1); updateUI();
    }
  }

  // === CLEAR ALL ===
  function clearAll() {
    if (sessions.length === 0) return;
    document.getElementById('confirmOverlay').classList.add('visible');
  }
  function cancelClear() {
    document.getElementById('confirmOverlay').classList.remove('visible');
  }
  function confirmClear() {
    document.getElementById('confirmOverlay').classList.remove('visible');
    sessions = [];
    updateUI();
  }

  // === LOG SESSION ===
  function logSession() {
    const distRaw  = document.getElementById('distance').value;
    const durRaw   = document.getElementById('duration').value;
    const distance = parseInt(distRaw) || 0;
    const duration = parseInt(durRaw)  || 0;
    const stroke    = document.getElementById('stroke').value;
    const intensity = document.getElementById('intensity').value;

    let errors = [], badFields = [];

    if (!distRaw || distance <= 0) {
      errors.push('Enter a distance'); badFields.push('distance');
    } else if (distance > 20000) {
      errors.push(`<strong>${distance.toLocaleString()} m</strong> in one session? That's 200+ laps — please double-check`);
      badFields.push('distance');
    }

    if (!durRaw || duration <= 0) {
      errors.push('Enter a duration'); badFields.push('duration');
    } else if (duration > 480) {
      errors.push(`<strong>${duration} min</strong> is over 8 hours — that doesn't look right`);
      badFields.push('duration');
    }

    if (errors.length === 0 && distance > 0 && duration > 0) {
      const paceMin100m = duration / (distance / 100);
      if (paceMin100m < 0.5) {
        errors.push(`That pace is <strong>${(paceMin100m * 60).toFixed(0)}s per 100m</strong> — faster than an Olympic sprinter! Double-check your values`);
        badFields.push('distance', 'duration');
      }
    }

    if (errors.length > 0) {
      showError(errors.join('<br>'), badFields);
      const btn = document.querySelector('.btn-log');
      btn.style.animation = 'none'; btn.offsetHeight;
      btn.style.animation = 'shake 0.4s ease';
      return;
    }

    const kcal = calcCalories(stroke, intensity, duration);
    sessions.push({ distance, duration, stroke, intensity, kcal, time: new Date() });
    document.getElementById('distance').value = '';
    document.getElementById('duration').value = '';
    if (!historyOpen) {
      historyOpen = true;
      document.getElementById('sessionList').classList.remove('collapsed');
      document.getElementById('toggleArrow').classList.remove('collapsed');
    }
    showSessionConfirm();
    updateUI();
    setTimeout(() => smoothScrollTo(document.getElementById('historyHeader'), 800), 100);
  }

  // Enter key on log form fields
  ['distance', 'duration'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') logSession();
    });
  });
