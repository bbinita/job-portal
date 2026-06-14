const API = "https://job-portal-qew0.onrender.com/api";

let currentUser = null;
let accessToken = null;
let refreshToken = null;
let currentPage = 1;
let selectedJobId = null;
let statusTargetAppId = null;
let notificationTimer = null;

function saveSession(access, refresh, user) {
  accessToken = access;
  refreshToken = refresh;
  currentUser = user;
  localStorage.setItem("jc_access", access);
  localStorage.setItem("jc_refresh", refresh);
  localStorage.setItem("jc_user", JSON.stringify(user));
}
function loadSession() {
  accessToken = localStorage.getItem("jc_access");
  refreshToken = localStorage.getItem("jc_refresh");
  const u = localStorage.getItem("jc_user");
  if (u) currentUser = JSON.parse(u);
}
function clearSession() {
  accessToken = refreshToken = currentUser = null;
  localStorage.removeItem("jc_access");
  localStorage.removeItem("jc_refresh");
  localStorage.removeItem("jc_user");
}

async function api(
  method,
  path,
  body = null,
  auth = false,
  isFormData = false,
) {
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (auth && accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);
  let res = await fetch(`${API}${path}`, opts);
  if (res.status === 401 && refreshToken) {
    const rRes = await fetch(`${API}/accounts/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (rRes.ok) {
      const rData = await rRes.json();
      accessToken = rData.access;
      localStorage.setItem("jc_access", accessToken);
      headers["Authorization"] = `Bearer ${accessToken}`;
      res = await fetch(`${API}${path}`, { ...opts, headers });
    } else {
      clearSession();
      showPage("auth");
      return null;
    }
  }
  if (!res.ok) {
    const text = await res.text();
    throw JSON.parse(text || "{}");
  }
  if (res.status === 204) return null;
  return res.json();
}

function esc(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusPill(status) {
  const map = {
    SUBMITTED: ["pill-blue", "Submitted"],
    UNDER_REVIEW: ["pill-amber", "Under Review"],
    SHORTLISTED: ["pill-emerald", "Shortlisted"],
    REJECTED: ["pill-red", "Rejected"],
  };
  const [cls, label] = map[status] || ["pill-slate", status || "Unknown"];
  return `<span class="status-pill ${cls}">${label}</span>`;
}

function flattenErrors(e) {
  if (!e || typeof e !== "object") return String(e || "");
  return Object.values(e).flat().join(" ");
}

function showToast(msg, duration = 3000) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.add("hidden"), duration);
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || "";
}

function setTextContent(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
