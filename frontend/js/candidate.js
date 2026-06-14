function onCandidateDashboardLoad() {
  updateNav();
  const username = currentUser?.username || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const el = document.getElementById("cand-greeting");
  if (el) el.textContent = `${greeting}, ${username} 👋`;

  const dashAvatar = document.getElementById("dash-avatar");
  const dashUsername = document.getElementById("dash-username");
  if (dashAvatar) dashAvatar.textContent = username[0]?.toUpperCase() || "U";
  if (dashUsername) dashUsername.textContent = username;

  loadCandidateOverview();
  startNotificationPolling();
}

async function loadCandidateOverview() {
  try {
    const data = await api("GET", "/applications/", null, true);
    const apps = Array.isArray(data) ? data : data?.results || [];

    setTextContent("cand-total", apps.length);
    setTextContent(
      "cand-review",
      apps.filter((a) => a.status === "UNDER_REVIEW").length,
    );
    setTextContent(
      "cand-short",
      apps.filter((a) => a.status === "SHORTLISTED").length,
    );
    setTextContent(
      "cand-rejected",
      apps.filter((a) => a.status === "REJECTED").length,
    );

    const recentEl = document.getElementById("recent-applications");
    if (recentEl) {
      recentEl.innerHTML =
        apps.length === 0
          ? `<p class="muted-text">No applications yet. <a href="#" onclick="showPage('jobs')" style="color:var(--steel-blue)">Browse jobs →</a></p>`
          : apps
              .slice(0, 5)
              .map((a) => applicationRowHTML(a))
              .join("");
    }
  } catch (e) {
    const recentEl = document.getElementById("recent-applications");
    if (recentEl)
      recentEl.innerHTML =
        '<p class="muted-text">Could not load applications.</p>';
  }
}

function applicationRowHTML(app) {
  const jobTitle =
    app.job_title ||
    (typeof app.job === "object" ? app.job?.title : null) ||
    `Job #${app.job}`;
  const pill = statusPill(app.status);
  return `
    <div class="application-row">
      <div class="app-info">
        <h3>${esc(jobTitle)}</h3>
        <p>Applied ${formatDate(app.applied_at)}</p>
      </div>
      <div class="app-actions">${pill}</div>
    </div>`;
}

async function loadMyApplications() {
  const statusFilter =
    document.getElementById("app-filter-status")?.value || "";
  const list = document.getElementById("my-applications-list");
  if (!list) return;
  list.innerHTML =
    '<div class="skeleton-card"></div><div class="skeleton-card"></div>';
  try {
    let url = "/applications/";
    if (statusFilter) url += `?status=${statusFilter}`;
    const data = await api("GET", url, null, true);
    const apps = Array.isArray(data) ? data : data?.results || [];
    list.innerHTML =
      apps.length === 0
        ? '<p class="muted-text">No applications found.</p>'
        : apps.map((a) => applicationRowHTML(a)).join("");
  } catch (e) {
    list.innerHTML = '<p class="muted-text">Failed to load applications.</p>';
  }
}

function switchCandidateTab(tab) {
  document
    .querySelectorAll("#page-candidate-dashboard .dash-tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll("#page-candidate-dashboard .sidebar-link")
    .forEach((l) => l.classList.remove("active"));
  const tabEl = document.getElementById(`ctab-${tab}`);
  if (tabEl) tabEl.classList.add("active");
  const linkEl = document.querySelector(
    `#page-candidate-dashboard [data-tab="${tab}"]`,
  );
  if (linkEl) linkEl.classList.add("active");

  if (tab === "applications") loadMyApplications();
  if (tab === "profile") loadProfile();
}
