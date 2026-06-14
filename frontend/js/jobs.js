function onLandingLoad() {
  updateNav();
  fetchJobCount();
  loadLandingJobs();
}

async function fetchJobCount() {
  try {
    const data = await api("GET", "/jobs/");
    const count = data?.count || (Array.isArray(data) ? data.length : "—");
    animateNumber("stat-jobs", count);
  } catch (e) {}
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  if (!el || isNaN(target)) {
    if (el) el.textContent = target;
    return;
  }
  let start = 0;
  const step = Math.ceil(target / 40);
  const t = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = start.toLocaleString();
    if (start >= target) clearInterval(t);
  }, 30);
}

async function loadLandingJobs() {
  const grid = document.getElementById("landing-jobs-grid");
  try {
    const data = await api("GET", "/jobs/?page_size=3");
    const jobs = Array.isArray(data) ? data : data?.results || [];
    grid.innerHTML =
      jobs.length === 0
        ? '<p class="muted-text">No jobs posted yet.</p>'
        : jobs
            .slice(0, 3)
            .map((j) => jobCardHTML(j))
            .join("");
  } catch (e) {
    grid.innerHTML = '<p class="muted-text">Could not load jobs.</p>';
  }
}

function jobCardHTML(job) {
  const colors = [
    "#274c77",
    "#6096ba",
    "#10B981",
    "#F59E0B",
    "#8b8c89",
    "#a3cef1",
  ];
  const color = colors[(job.title || "").charCodeAt(0) % colors.length];
  const companyName = job.company_name || job.company?.name || "Company";
  const letter = companyName[0].toUpperCase();
  const locationLabel =
    { REMOTE: "Remote", "ON-SITE": "On-site", HYBRID: "Hybrid" }[
      job.location
    ] ||
    job.location ||
    "—";
  const salaryText = job.salary
    ? `NPR ${Number(job.salary).toLocaleString()}`
    : "Competitive";
  return `
    <div class="job-card" onclick="openJobDetail(${job.id})">
      <div class="job-card-header">
        <div class="company-logo" style="background:${color}">${letter}</div>
        <span class="status-pill pill-emerald">Open</span>
      </div>
      <h3>${esc(job.title)}</h3>
      <p class="company-name">${esc(companyName)}</p>
      <div class="job-meta">
        <span class="meta-tag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${esc(locationLabel)}
        </span>
      </div>
      <div class="job-card-footer">
        <span class="salary-text">${salaryText}</span>
        <span class="date-text">${formatDate(job.created_at)}</span>
      </div>
    </div>`;
}

function onJobsLoad() {
  currentPage = 1;
  loadJobs(1);
}

async function loadJobs(page = 1) {
  currentPage = page;
  const list = document.getElementById("jobs-list");
  const search = document.getElementById("filter-search")?.value || "";
  const loc = document.getElementById("filter-location")?.value || "";

  list.innerHTML =
    '<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>';

  let qs = `?page=${page}`;
  if (search) qs += `&search=${encodeURIComponent(search)}`;
  if (loc) qs += `&location=${encodeURIComponent(loc)}`;

  try {
    const data = await api("GET", `/jobs/${qs}`);
    const jobs = Array.isArray(data) ? data : data?.results || [];
    const count = data?.count;

    list.innerHTML =
      jobs.length === 0
        ? '<p class="muted-text">No jobs found. Try adjusting your filters.</p>'
        : jobs.map((j) => jobCardHTML(j)).join("");

    const pageSize = 10;
    const totalPages = count ? Math.ceil(count / pageSize) : 1;
    const pag = document.getElementById("pagination");
    pag.classList.toggle("hidden", totalPages <= 1);
    document.getElementById("page-indicator").textContent =
      `Page ${page} of ${totalPages}`;
    document.getElementById("prev-btn").disabled = page <= 1;
    document.getElementById("next-btn").disabled = page >= totalPages;
  } catch (e) {
    list.innerHTML = '<p class="muted-text">Failed to load jobs.</p>';
  }
}

function filterJobs() {
  clearTimeout(window._filterTimer);
  window._filterTimer = setTimeout(() => loadJobs(1), 300);
}

function clearFilters() {
  const s = document.getElementById("filter-search");
  const l = document.getElementById("filter-location");
  if (s) s.value = "";
  if (l) l.value = "";
  loadJobs(1);
}

function searchJobs() {
  const q = document.getElementById("hero-search-input").value;
  const l = document.getElementById("hero-location-input").value;
  showPage("jobs");
  setTimeout(() => {
    const s = document.getElementById("filter-search");
    const loc = document.getElementById("filter-location");
    if (s) s.value = q;
    if (loc) loc.value = l;
    loadJobs(1);
  }, 50);
}

async function openJobDetail(jobId) {
  selectedJobId = jobId;
  showPage("job-detail");
  const content = document.getElementById("job-detail-content");
  const applyCard = document.getElementById("apply-card");
  content.innerHTML = '<div class="skeleton-card" style="height:200px"></div>';

  try {
    const job = await api("GET", `/jobs/${jobId}/`);
    const companyName = job.company_name || job.company?.name || "Company";
    const colors = ["#274c77", "#6096ba", "#10B981", "#F59E0B", "#8b8c89"];
    const color = colors[(job.title || "").charCodeAt(0) % colors.length];
    const letter = companyName[0].toUpperCase();
    const locationLabel =
      { REMOTE: "Remote", "ON-SITE": "On-site", HYBRID: "Hybrid" }[
        job.location
      ] ||
      job.location ||
      "—";
    const salaryText = job.salary
      ? `NPR ${Number(job.salary).toLocaleString()}/month`
      : null;
    const deadline = job.deadline
      ? new Date(job.deadline).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

    content.innerHTML = `
      <div class="detail-hero">
        <div class="company-logo" style="background:${color};width:56px;height:56px;font-size:22px;border-radius:14px">${letter}</div>
        <h1>${esc(job.title)}</h1>
        <p class="company-name">${esc(companyName)}</p>
        <div class="job-meta">
          <span class="meta-tag">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${esc(locationLabel)}
          </span>
          ${salaryText ? `<span class="meta-tag" style="color:var(--dusk-blue);background:var(--indigo-light)">💰 ${esc(salaryText)}</span>` : ""}
          ${deadline ? `<span class="meta-tag">📅 Apply by ${esc(deadline)}</span>` : ""}
        </div>
      </div>
      <div class="detail-body">
        <h2>About this role</h2>
        <p>${esc(job.description || "")}</p>
      </div>
    `;

    applyCard.innerHTML = `
      <h3>Interested?</h3>
      <p>Submit your application below.</p>
      <div id="apply-section">
        <div class="form-group">
          <label>Cover Letter</label>
          <textarea class="form-input" id="cover-letter" rows="4" placeholder="Tell us why you're a great fit..."></textarea>
        </div>
        <div class="form-group">
          <label>Resume <span class="label-hint">(PDF/DOC)</span></label>
          <input type="file" class="form-input" id="resume-file" accept=".pdf,.doc,.docx"/>
        </div>
        <div class="error-msg hidden" id="apply-error"></div>
        <div class="success-msg hidden" id="apply-success"></div>
        <button class="btn-primary full-width" onclick="applyJob()" id="apply-btn">Apply Now</button>
      </div>
      <div id="apply-login-prompt" class="hidden">
        <p class="muted-text">You need to be logged in as a candidate to apply.</p>
        <button class="btn-primary full-width" onclick="showPage('auth')">Log in to apply</button>
      </div>
    `;

    const newApplySection = document.getElementById("apply-section");
    const newLoginPrompt = document.getElementById("apply-login-prompt");

    if (!currentUser) {
      newApplySection.classList.add("hidden");
      newLoginPrompt.classList.remove("hidden");
    } else if (currentUser.role === "COMPANY") {
      applyCard.innerHTML =
        '<p class="muted-text" style="padding:1rem 0">You are logged in as a company. Switch to a candidate account to apply.</p>';
    } else {
      newApplySection.classList.remove("hidden");
      newLoginPrompt.classList.add("hidden");
    }
  } catch (e) {
    content.innerHTML = '<p class="muted-text">Failed to load job details.</p>';
  }
}

async function applyJob() {
  const coverLetter =
    document.getElementById("cover-letter")?.value.trim() || "";
  const fileInput = document.getElementById("resume-file");
  const errEl = document.getElementById("apply-error");
  const succEl = document.getElementById("apply-success");
  const btn = document.getElementById("apply-btn");

  if (errEl) errEl.classList.add("hidden");
  if (succEl) succEl.classList.add("hidden");
  if (btn) {
    btn.textContent = "Submitting...";
    btn.disabled = true;
  }

  try {
    const fd = new FormData();
    fd.append("cover_letter", coverLetter);
    if (fileInput?.files[0]) fd.append("resume", fileInput.files[0]);
    await api("POST", `/jobs/${selectedJobId}/apply/`, fd, true, true);
    if (succEl) {
      succEl.textContent = "Application submitted! Good luck 🎉";
      succEl.classList.remove("hidden");
    }
    if (btn) btn.textContent = "Applied ✓";
    if (document.getElementById("cover-letter"))
      document.getElementById("cover-letter").value = "";
    if (fileInput) fileInput.value = "";
    showToast("Application sent!");
  } catch (e) {
    const msg =
      e?.detail ||
      flattenErrors(e) ||
      "Failed to submit. You may have already applied.";
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.remove("hidden");
    }
    if (btn) {
      btn.textContent = "Apply Now";
      btn.disabled = false;
    }
  }
}
