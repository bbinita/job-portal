function showPage(name) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  const page = document.getElementById(`page-${name}`);
  if (page) page.classList.add("active");
  closeAllDropdowns();

  const navbar = document.getElementById("navbar");
  const hiddenOnPages = ["candidate-dashboard", "company-dashboard"];
  if (navbar) navbar.style.display = hiddenOnPages.includes(name) ? "none" : "";

  if (name === "landing") onLandingLoad();
  if (name === "jobs") onJobsLoad();
  if (name === "candidate-dashboard") onCandidateDashboardLoad();
  if (name === "company-dashboard") onCompanyDashboardLoad();
}

function goToDashboard() {
  if (!currentUser) {
    showPage("auth");
    return;
  }
  if (currentUser.role === "CANDIDATE") showPage("candidate-dashboard");
  else if (currentUser.role === "COMPANY") showPage("company-dashboard");
  else console.error("Unknown role:", currentUser.role);
}

function updateNav() {
  const actions = document.getElementById("nav-actions");
  const navUser = document.getElementById("nav-user");
  if (!currentUser) {
    actions.classList.remove("hidden");
    navUser.classList.add("hidden");
    return;
  }
  actions.classList.add("hidden");
  navUser.classList.remove("hidden");

  const name =
    currentUser.role === "COMPANY"
      ? currentUser.company_name || currentUser.username
      : currentUser.username;

  const avatar = document.getElementById("nav-avatar");
  const navUsername = document.getElementById("nav-username");
  if (avatar) avatar.textContent = (name[0] || "U").toUpperCase();
  if (navUsername) navUsername.textContent = name;
}

function toggleNotifications() {
  const dd = document.getElementById("notif-dropdown");
  if (!dd) return;
  const wasHidden = dd.classList.contains("hidden");
  closeAllDropdowns();
  if (wasHidden) {
    dd.classList.remove("hidden");
    loadNotifications();
  }
}

function toggleNotificationsDash() {
  const dd = document.getElementById("notif-dropdown-dash");
  if (!dd) return;
  const wasHidden = dd.classList.contains("hidden");
  closeAllDropdowns();
  if (wasHidden) {
    dd.classList.remove("hidden");
    loadNotifications();
  }
}

function toggleProfileMenu() {
  const pm = document.getElementById("profile-menu");
  if (!pm) return;
  const wasHidden = pm.classList.contains("hidden");
  closeAllDropdowns();
  if (wasHidden) pm.classList.remove("hidden");
}

function toggleProfileMenuDash() {
  const pm = document.getElementById("profile-menu-dash");
  if (!pm) return;
  const wasHidden = pm.classList.contains("hidden");
  closeAllDropdowns();
  if (wasHidden) pm.classList.remove("hidden");
}

function toggleProfileMenuComp() {
  const pm = document.getElementById("profile-menu-comp");
  if (!pm) return;
  const wasHidden = pm.classList.contains("hidden");
  closeAllDropdowns();
  if (wasHidden) pm.classList.remove("hidden");
}

function closeAllDropdowns() {
  [
    "notif-dropdown",
    "notif-dropdown-dash",
    "profile-menu",
    "profile-menu-dash",
    "profile-menu-comp",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".notif-wrap") && !e.target.closest(".profile-wrap"))
    closeAllDropdowns();
});

document.addEventListener("DOMContentLoaded", () => {
  loadSession();
  updateNav();
  showPage("landing");

  document.getElementById("post-job-modal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closePostJobModal();
  });
  document.getElementById("status-modal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeStatusModal();
  });

  document
    .getElementById("login-password")
    ?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") login();
    });
  document
    .getElementById("login-username")
    ?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") login();
    });

  if (currentUser) startNotificationPolling();
});
