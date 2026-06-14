function switchAuthTab(tab) {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  if (tab === "login") {
    loginForm.style.display = "flex";
    loginForm.classList.remove("hidden");
    registerForm.style.display = "none";
    registerForm.classList.add("hidden");
  } else {
    loginForm.style.display = "none";
    loginForm.classList.add("hidden");
    registerForm.style.display = "flex";
    registerForm.classList.remove("hidden");
  }
  document
    .getElementById("tab-login")
    .classList.toggle("active", tab === "login");
  document
    .getElementById("tab-register")
    .classList.toggle("active", tab === "register");
}

function switchRole(role) {
  document
    .getElementById("role-candidate")
    .classList.toggle("active", role === "candidate");
  document
    .getElementById("role-company")
    .classList.toggle("active", role === "company");
  document
    .getElementById("candidate-fields")
    .classList.toggle("hidden", role !== "candidate");
  document
    .getElementById("company-fields")
    .classList.toggle("hidden", role !== "company");
}

async function login() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const errEl = document.getElementById("login-error");
  const btn = document.getElementById("login-btn");
  errEl.classList.add("hidden");
  btn.textContent = "Logging in...";
  btn.disabled = true;
  try {
    const tokens = await api("POST", "/accounts/login/", {
      username,
      password,
    });
    accessToken = tokens.access;
    refreshToken = tokens.refresh;
    const profile = await api("GET", "/accounts/profile/", null, true);
    const user = buildUserObject(profile);
    saveSession(tokens.access, tokens.refresh, user);
    updateNav();
    goToDashboard();
    startNotificationPolling();
  } catch (e) {
    const msg =
      e?.non_field_errors?.[0] ||
      e?.detail ||
      "Login failed. Check credentials.";
    errEl.textContent = msg;
    errEl.classList.remove("hidden");
  } finally {
    btn.textContent = "Log in";
    btn.disabled = false;
  }
}

function buildUserObject(profile) {
  const cp = profile.candidate_profile || {};
  const comp = profile.company_profile || {};
  return {
    id: profile.id,
    username: profile.username,
    email: profile.email,
    phone_no: profile.phone_no || "",
    role: profile.role,
    skill: cp.skill || "",
    experience: cp.experience || "",
    bio: cp.bio || "",
    address: cp.address || "",
    company_name: comp.name || "",
    website: comp.website || "",
    comp_address: comp.address || "",
    description: comp.description || "",
  };
}

async function register() {
  const errEl = document.getElementById("reg-error");
  const btn = document.getElementById("reg-btn");
  const isCandidate = document
    .getElementById("role-candidate")
    .classList.contains("active");

  errEl.classList.add("hidden");
  btn.textContent = "Creating account...";
  btn.disabled = true;

  const username = document.getElementById("reg-username").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const phone_no = document.getElementById("reg-phone").value.trim();
  const password = document.getElementById("reg-password").value;
  const password2 = document.getElementById("reg-password2").value;

  if (!username || !password || !password2) {
    errEl.textContent = "Username and password are required.";
    errEl.classList.remove("hidden");
    btn.textContent = "Create account";
    btn.disabled = false;
    return;
  }
  if (password !== password2) {
    errEl.textContent = "Passwords do not match.";
    errEl.classList.remove("hidden");
    btn.textContent = "Create account";
    btn.disabled = false;
    return;
  }

  try {
    if (isCandidate) {
      const fd = new FormData();
      fd.append("username", username);
      fd.append("email", email);
      fd.append("phone_no", phone_no);
      fd.append("password", password);
      fd.append("password2", password2);
      fd.append("skill", document.getElementById("reg-skill").value.trim());
      fd.append(
        "experience",
        document.getElementById("reg-experience").value.trim(),
      );
      fd.append("address", document.getElementById("reg-address").value.trim());
      fd.append("bio", document.getElementById("reg-bio").value.trim());
      const resumeFile = document.getElementById("reg-resume").files[0];
      if (resumeFile) fd.append("resume", resumeFile);
      await api("POST", "/accounts/register/candidate/", fd, false, true);
    } else {
      const body = {
        username,
        email,
        phone_no,
        password,
        password2,
        name: document.getElementById("reg-companyname").value.trim(),
        website: document.getElementById("reg-website").value.trim(),
        address: document.getElementById("reg-comp-address").value.trim(),
        description: document.getElementById("reg-description").value.trim(),
      };
      await api("POST", "/accounts/register/company/", body);
    }
    showToast("Account created! Please log in.");
    switchAuthTab("login");
    document.getElementById("login-username").value = username;
  } catch (e) {
    const msg = flattenErrors(e) || "Registration failed.";
    errEl.textContent = msg;
    errEl.classList.remove("hidden");
  } finally {
    btn.textContent = "Create account";
    btn.disabled = false;
  }
}

async function logout() {
  try {
    if (refreshToken) {
      await fetch(`${API}/accounts/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    }
  } catch (e) {}
  clearInterval(notificationTimer);
  clearSession();
  updateNav();
  showPage("landing");
  showToast("Logged out successfully.");
}

async function loadProfile() {
  try {
    const data = await api("GET", "/accounts/profile/", null, true);
    if (currentUser?.role === "CANDIDATE") {
      const cp = data.candidate_profile || {};
      setVal("prof-username", data.username);
      setVal("prof-email", data.email);
      setVal("prof-skill", cp.skill);
      setVal("prof-experience", cp.experience);
      setVal("prof-address", cp.address);
      setVal("prof-bio", cp.bio);
    } else {
      const comp = data.company_profile || {};
      setVal("comp-prof-username", data.username);
      setVal("comp-prof-email", data.email);
      setVal("comp-prof-name", comp.name);
      setVal("comp-prof-website", comp.website);
      setVal("comp-prof-address", comp.address);
      setVal("comp-prof-desc", comp.description);
    }
  } catch (e) {
    showToast("Could not load profile.");
  }
}

async function saveProfile() {
  const btn = document.getElementById("save-profile-btn");
  if (btn) {
    btn.textContent = "Saving...";
    btn.disabled = true;
  }
  try {
    if (currentUser?.role === "CANDIDATE") {
      const resumeFile = document.getElementById("prof-resume")?.files[0];
      let result;
      if (resumeFile) {
        const fd = new FormData();
        fd.append("skill", document.getElementById("prof-skill").value);
        fd.append(
          "experience",
          document.getElementById("prof-experience").value,
        );
        fd.append("address", document.getElementById("prof-address").value);
        fd.append("bio", document.getElementById("prof-bio").value);
        fd.append("resume", resumeFile);
        result = await api("PATCH", "/accounts/profile/", fd, true, true);
      } else {
        result = await api(
          "PATCH",
          "/accounts/profile/",
          {
            skill: document.getElementById("prof-skill").value,
            experience: document.getElementById("prof-experience").value,
            address: document.getElementById("prof-address").value,
            bio: document.getElementById("prof-bio").value,
          },
          true,
        );
      }
      if (result) {
        const cp = result.candidate_profile || {};
        currentUser.skill = cp.skill || currentUser.skill;
        currentUser.bio = cp.bio || currentUser.bio;
        localStorage.setItem("jc_user", JSON.stringify(currentUser));
      }
      const succ = document.getElementById("profile-save-success");
      if (succ) {
        succ.classList.remove("hidden");
        setTimeout(() => succ.classList.add("hidden"), 3000);
      }
    } else {
      const result = await api(
        "PATCH",
        "/accounts/profile/",
        {
          name: document.getElementById("comp-prof-name").value,
          website: document.getElementById("comp-prof-website").value,
          address: document.getElementById("comp-prof-address").value,
          description: document.getElementById("comp-prof-desc").value,
        },
        true,
      );
      if (result) {
        const comp = result.company_profile || {};
        currentUser.company_name = comp.name || currentUser.company_name;
        localStorage.setItem("jc_user", JSON.stringify(currentUser));
      }
      const succ = document.getElementById("comp-profile-save-success");
      if (succ) {
        succ.classList.remove("hidden");
        setTimeout(() => succ.classList.add("hidden"), 3000);
      }
    }
    showToast("Profile saved!");
  } catch (e) {
    showToast("Failed to save profile. " + (flattenErrors(e) || ""));
  } finally {
    if (btn) {
      btn.textContent = "Save changes";
      btn.disabled = false;
    }
  }
}
