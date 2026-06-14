function onCompanyDashboardLoad() {
  updateNav();
  const name = currentUser?.company_name || currentUser?.username || "Company";
  setTextContent("comp-greeting", `Welcome, ${name}`);
  const compAvatar = document.getElementById("comp-avatar");
  const compUsername = document.getElementById("comp-username");
  if (compAvatar) compAvatar.textContent = name[0]?.toUpperCase() || "C";
  if (compUsername) compUsername.textContent = name;
  loadCompanyOverview();
}

async function loadCompanyOverview() {
  try {
    const data = await api("GET", "/jobs/", null, true);
    const jobs = Array.isArray(data) ? data : data?.results || [];
    setTextContent("comp-active-jobs", jobs.length);

    let totalApps = 0,
      shortlisted = 0;
    for (const job of jobs.slice(0, 5)) {
      try {
        const aData = await api(
          "GET",
          `/jobs/${job.id}/applications/`,
          null,
          true,
        );
        const apps = Array.isArray(aData) ? aData : aData?.results || [];
        totalApps += apps.length;
        shortlisted += apps.filter((a) => a.status === "SHORTLISTED").length;
      } catch (e) {}
    }
    setTextContent("comp-total-apps", totalApps);
    setTextContent("comp-shortlisted", shortlisted);

    const recentEl = document.getElementById("comp-recent-jobs");
    if (recentEl) {
      recentEl.innerHTML =
        jobs.length === 0
          ? `<p class="muted-text">No jobs posted yet. <button class="btn-primary" onclick="openPostJobModal()">Post your first job</button></p>`
          : jobs
              .slice(0, 5)
              .map((j) => companyJobRowHTML(j))
              .join("");
    }
  } catch (e) {
    const recentEl = document.getElementById("comp-recent-jobs");
    if (recentEl)
      recentEl.innerHTML = '<p class="muted-text">Could not load jobs.</p>';
  }
}

function companyJobRowHTML(job) {
  const locationLabel =
    { REMOTE: "Remote", "ON-SITE": "On-site", HYBRID: "Hybrid" }[
      job.location
    ] ||
    job.location ||
    "—";
  const deadline = job.deadline ? `· Deadline ${formatDate(job.deadline)}` : "";
  return `
    <div class="company-job-row">
      <div class="cjr-info">
        <h3>${esc(job.title)}</h3>
        <p>${esc(locationLabel)} ${deadline} · Posted ${formatDate(job.created_at)}</p>
      </div>
      <div class="cjr-actions">
        <button class="btn-ghost" onclick="viewApplicantsForJob(${job.id})">View applicants</button>
        <button class="btn-danger" onclick="deleteJob(${job.id})">Close</button>
      </div>
    </div>`;
}

async function loadCompanyJobs() {
  const list = document.getElementById("company-jobs-list");
  if (!list) return;
  list.innerHTML =
    '<div class="skeleton-card"></div><div class="skeleton-card"></div>';
  try {
    const data = await api("GET", "/jobs/", null, true);
    const jobs = Array.isArray(data) ? data : data?.results || [];

    const sel = document.getElementById("applicants-job-select");
    if (sel) {
      sel.innerHTML =
        '<option value="">Choose a job...</option>' +
        jobs
          .map((j) => `<option value="${j.id}">${esc(j.title)}</option>`)
          .join("");
    }

    list.innerHTML =
      jobs.length === 0
        ? '<p class="muted-text">No jobs yet. Post your first job!</p>'
        : jobs.map((j) => companyJobRowHTML(j)).join("");

    return jobs;
  } catch (e) {
    list.innerHTML = '<p class="muted-text">Failed to load jobs.</p>';
    return [];
  }
}

async function deleteJob(jobId) {
  if (!confirm("Close this job posting? This cannot be undone.")) return;
  try {
    await api("DELETE", `/jobs/${jobId}/`, null, true);
    showToast("Job closed.");
    loadCompanyJobs();
    loadCompanyOverview();
  } catch (e) {
    showToast("Failed to close job.");
  }
}

function viewApplicantsForJob(jobId) {
  switchCompanyTab("applicants");
  setTimeout(() => {
    const sel = document.getElementById("applicants-job-select");
    if (sel) sel.value = jobId;
    loadJobApplicants(jobId);
  }, 300);
}

async function loadJobApplicants(jobId) {
  if (!jobId) jobId = document.getElementById("applicants-job-select")?.value;
  const list = document.getElementById("applicants-list");
  if (!list) return;
  if (!jobId) {
    list.innerHTML =
      '<p class="muted-text">Select a job above to view applicants.</p>';
    return;
  }
  list.innerHTML =
    '<div class="skeleton-card"></div><div class="skeleton-card"></div>';
  try {
    const data = await api("GET", `/jobs/${jobId}/applications/`, null, true);
    const apps = Array.isArray(data) ? data : data?.results || [];
    list.innerHTML =
      apps.length === 0
        ? '<p class="muted-text">No applicants yet.</p>'
        : apps.map((a) => applicantRowHTML(a)).join("");
  } catch (e) {
    list.innerHTML = '<p class="muted-text">Failed to load applicants.</p>';
  }
}

function applicantRowHTML(app) {
  const candidateName = app.candidate_name || `Candidate #${app.candidate}`;
  const pill = statusPill(app.status);
  const coverPreview = app.cover_letter
    ? `<em style="font-size:12px;color:var(--grey-olive)">${esc(app.cover_letter.substring(0, 80))}${app.cover_letter.length > 80 ? "…" : ""}</em>`
    : "";
  return `
    <div class="application-row">
      <div class="app-info">
        <h3>${esc(candidateName)}</h3>
        <p>Applied ${formatDate(app.applied_at)} ${app.cover_letter ? "·" : ""} ${coverPreview}</p>
      </div>
      <div class="app-actions">
        ${pill}
        <button class="btn-ghost" style="font-size:13px" onclick="openStatusModal(${app.id}, '${esc(candidateName)}', '${app.status}')">Update</button>
        ${app.resume ? `<a href="${app.resume}" target="_blank" class="btn-ghost" style="font-size:13px">Resume ↗</a>` : ""}
      </div>
    </div>`;
}

function switchCompanyTab(tab) {
  document
    .querySelectorAll("#page-company-dashboard .dash-tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll("#page-company-dashboard .sidebar-link")
    .forEach((l) => l.classList.remove("active"));
  const tabEl = document.getElementById(`comptab-${tab}`);
  if (tabEl) tabEl.classList.add("active");
  const linkEl = document.querySelector(
    `#page-company-dashboard [data-tab="${tab}"]`,
  );
  if (linkEl) linkEl.classList.add("active");

  if (tab === "myjobs") loadCompanyJobs();
  if (tab === "applicants") {
    loadCompanyJobs().then((jobs) => {
      if (jobs && jobs.length > 0) {
        const sel = document.getElementById("applicants-job-select");
        if (sel) sel.value = jobs[0].id;
        loadJobApplicants(jobs[0].id);
      }
    });
  }
  if (tab === "profile") loadProfile();
}

function openPostJobModal() {
  document.getElementById("post-job-modal").classList.remove("hidden");
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);
  const deadlineInput = document.getElementById("job-deadline");
  if (deadlineInput) deadlineInput.value = deadline.toISOString().slice(0, 16);
}

function closePostJobModal() {
  document.getElementById("post-job-modal").classList.add("hidden");
}

async function postJob() {
  const btn = document.getElementById("post-job-btn");
  const errEl = document.getElementById("post-job-error");
  errEl.classList.add("hidden");
  btn.textContent = "Posting...";
  btn.disabled = true;

  const title = document.getElementById("job-title").value.trim();
  const location = document.getElementById("job-location").value;
  const salary = document.getElementById("job-salary").value.trim();
  const deadline = document.getElementById("job-deadline").value;
  const description = document.getElementById("job-desc").value.trim();

  if (!title || !description || !deadline) {
    errEl.textContent = "Title, description and deadline are required.";
    errEl.classList.remove("hidden");
    btn.textContent = "Post Job";
    btn.disabled = false;
    return;
  }

  const body = { title, description, location, deadline };
  if (salary) body.salary = parseFloat(salary);

  try {
    await api("POST", "/jobs/", body, true);
    closePostJobModal();
    showToast("Job posted successfully!");
    ["job-title", "job-salary", "job-desc"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    document.getElementById("job-location").value = "HYBRID";
    loadCompanyOverview();
    if (document.getElementById("comptab-myjobs")?.classList.contains("active"))
      loadCompanyJobs();
  } catch (e) {
    const msg = flattenErrors(e) || "Failed to post job.";
    errEl.textContent = msg;
    errEl.classList.remove("hidden");
  } finally {
    btn.textContent = "Post Job";
    btn.disabled = false;
  }
}

function openStatusModal(appId, name, currentStatus) {
  statusTargetAppId = appId;
  setTextContent("status-modal-name", name);
  const currentEl = document.getElementById("status-modal-current");
  if (currentEl) currentEl.innerHTML = statusPill(currentStatus);
  const errEl = document.getElementById("status-modal-error");
  if (errEl) errEl.classList.add("hidden");

  const transitions = {
    SUBMITTED: ["UNDER_REVIEW"],
    UNDER_REVIEW: ["SHORTLISTED", "REJECTED"],
    SHORTLISTED: ["REJECTED"],
    REJECTED: [],
  };
  const opts = transitions[currentStatus] || [];
  const sel = document.getElementById("status-select");
  if (sel) {
    sel.innerHTML =
      opts.length === 0
        ? "<option disabled>No further transitions available</option>"
        : opts
            .map(
              (s) =>
                `<option value="${s}">${{ UNDER_REVIEW: "Under Review", SHORTLISTED: "Shortlisted", REJECTED: "Rejected" }[s] || s}</option>`,
            )
            .join("");
  }
  document.getElementById("status-modal").classList.remove("hidden");
}

function closeStatusModal() {
  document.getElementById("status-modal").classList.add("hidden");
}

async function submitStatusUpdate() {
  const btn = document.getElementById("status-update-btn");
  const errEl = document.getElementById("status-modal-error");
  const status = document.getElementById("status-select").value;
  if (errEl) errEl.classList.add("hidden");
  btn.textContent = "Updating...";
  btn.disabled = true;

  try {
    await api(
      "PATCH",
      `/applications/${statusTargetAppId}/status/`,
      { status },
      true,
    );
    closeStatusModal();
    showToast("Status updated. Candidate will be notified.");
    const jobId = document.getElementById("applicants-job-select")?.value;
    if (jobId) loadJobApplicants(jobId);
  } catch (e) {
    const msg = e?.detail || flattenErrors(e) || "Failed to update status.";
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.remove("hidden");
    }
  } finally {
    btn.textContent = "Update";
    btn.disabled = false;
  }
}
