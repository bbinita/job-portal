async function loadNotifications() {
  if (!currentUser || currentUser.role !== "CANDIDATE") return;
  try {
    const data = await api("GET", "/notifications/", null, true);
    const notifications = Array.isArray(data) ? data : data?.results || [];
    const unread = notifications.filter((n) => !n.is_read).length;

    ["notif-badge", "notif-badge-dash"].forEach((id) => {
      const badge = document.getElementById(id);
      if (badge) {
        badge.textContent = unread;
        unread > 0
          ? badge.classList.remove("hidden")
          : badge.classList.add("hidden");
      }
    });

    const html =
      notifications.length === 0
        ? '<p class="notif-empty">No notifications yet.</p>'
        : notifications
            .map(
              (n) => `
          <div class="notif-item ${n.is_read ? "" : "unread"}" onclick="markNotifRead(${n.id})">
            <p>${esc(n.message || "Your application status was updated.")}</p>
            <p class="notif-time">${formatDate(n.created_at)}</p>
          </div>`,
            )
            .join("");

    ["notif-list", "notif-list-dash"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    });
  } catch (e) {}
}

async function markNotifRead(id) {
  try {
    await api("PATCH", `/notifications/${id}/read/`, {}, true);
    loadNotifications();
  } catch (e) {}
}

async function markAllRead() {
  try {
    const data = await api("GET", "/notifications/", null, true);
    const notifications = Array.isArray(data) ? data : data?.results || [];
    await Promise.all(
      notifications
        .filter((n) => !n.is_read)
        .map((n) => api("PATCH", `/notifications/${n.id}/read/`, {}, true)),
    );
    loadNotifications();
    showToast("All notifications marked as read.");
  } catch (e) {}
}

function startNotificationPolling() {
  clearInterval(notificationTimer);
  if (currentUser?.role === "CANDIDATE") {
    loadNotifications();
    notificationTimer = setInterval(loadNotifications, 30000);
  }
}
