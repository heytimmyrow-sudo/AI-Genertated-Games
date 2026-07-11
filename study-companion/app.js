const key = "study-companion-v2";
let state = JSON.parse(localStorage.getItem(key) || "null") || {
  dark: false,
  focus: 0,
  notifications: false,
  tasks: [],
};
const q = (s) => document.querySelector(s),
  qa = (s) => [...document.querySelectorAll(s)],
  save = () => localStorage.setItem(key, JSON.stringify(state));
if (!Array.isArray(state.profiles)) {
  state.profiles = [];
}
if (!state.activeProfileId && state.profiles.length) {
  state.activeProfileId = state.profiles[0].id;
}
if (typeof state.notifications !== "boolean") {
  state.notifications = false;
}
let editingProfileId = state.activeProfileId || null;
function activeProfile() {
  return (
    state.profiles.find((profile) => profile.id === state.activeProfileId) ||
    null
  );
}
function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
function renderProfile() {
  const profile = activeProfile();
  const button = q("#profileButton");
  button.textContent = profile ? initials(profile.name) : "+";
  button.classList.toggle("has-profile", Boolean(profile));
  button.style.background = profile ? profile.color : "";
  button.title = profile ? profile.name + " profile" : "Create your profile";
}
function populateProfileForm() {
  const picker = q("#profilePicker");
  picker.innerHTML = state.profiles.length
    ? state.profiles
        .map(
          (profile) =>
            '<option value="' + profile.id + '">' + profile.name + "</option>",
        )
        .join("")
    : '<option value="">New profile</option>';
  picker.value = editingProfileId || "";
  const profile = state.profiles.find((item) => item.id === editingProfileId);
  q("#profileName").value = profile ? profile.name : "";
  q("#profileFocus").value = profile ? profile.focus : "";
  q("#profileColor").value = profile ? profile.color : "#6558e8";
}
function html(t) {
  return (
    '<div class="task ' +
    (t.done ? "done" : "") +
    '"><button class="check" data-id="' +
    t.id +
    '">' +
    (t.done ? "✓" : "") +
    "</button><div><b>" +
    t.title +
    "</b><small>" +
    t.due +
    '</small></div><span class="tag">' +
    t.subject +
    "</span></div>"
  );
}
function tasks() {
  let x = state.tasks.map(html).join("");
  const empty =
    '<div class="empty-state"><b>Your workspace is clear.</b><small>Add a task when you are ready to begin.</small></div>';
  q("#taskList").innerHTML = x || empty;
  q("#plannerTasks").innerHTML = x || empty;
  q("#plannerCount").textContent = state.tasks.filter((t) => !t.done).length;
  renderStats();
  qa(".check").forEach(
    (b) =>
      (b.onclick = () => {
        let t = state.tasks.find((x) => x.id == b.dataset.id);
        t.done = !t.done;
        save();
        if (t.done) notify("Task complete", t.title + " is done.");
        tasks();
      }),
  );
}
function renderStats() {
  const completed = state.tasks.filter((task) => task.done).length;
  const cards = [];
  if (state.focus > 0) {
    cards.push(
      "<article>◷ <b>" +
        state.focus +
        "m<small>Focused today</small></b><span>Keep going</span></article>",
    );
  }
  if (completed > 0) {
    cards.push(
      "<article>✓ <b>" +
        completed +
        "<small>Tasks completed</small></b><span>This week</span></article>",
    );
  }
  q("#stats").innerHTML = cards.length
    ? cards.join("")
    : '<div class="stats-empty">Your study statistics will appear after you log activity.</div>';
}
function toast(message) {
  const el = q("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 3200);
}
function canNotify() {
  return "Notification" in window && Notification.permission === "granted";
}
function notify(title, body) {
  if (state.notifications && canNotify()) {
    new Notification(title, {
      body,
      tag: "study-companion",
    });
  }
  toast(body);
}
function renderNotifications() {
  const supported = "Notification" in window;
  const permission = supported ? Notification.permission : "unsupported";
  const enabled = state.notifications && permission === "granted";
  q("#notificationDot").classList.toggle("on", enabled);
  q("#enableNotifications").textContent = enabled
    ? "Notifications on"
    : "Enable notifications";
  q("#testNotification").disabled = !enabled;
  q("#notificationStatus").textContent = !supported
    ? "This browser does not support notifications."
    : enabled
      ? "Focus sessions and completed tasks can alert you."
      : permission === "denied"
        ? "Notifications are blocked in your browser settings."
        : "Off until you enable them.";
}
async function enableNotifications() {
  if (!("Notification" in window)) {
    toast("This browser does not support notifications.");
    renderNotifications();
    return;
  }
  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  state.notifications = permission === "granted";
  save();
  renderNotifications();
  if (state.notifications) {
    notify("Study Companion", "Notifications are ready.");
  } else {
    toast(
      permission === "denied"
        ? "Notifications are blocked in your browser settings."
        : "Notifications were not enabled.",
    );
  }
}
function nav(v) {
  qa(".view").forEach((x) => x.classList.toggle("active", x.id === v));
  qa(".nav").forEach((x) => x.classList.toggle("active", x.dataset.view === v));
  scrollTo(0, 0);
}
qa("[data-view]").forEach((b) => (b.onclick = () => nav(b.dataset.view)));
qa('[data-action="task"]').forEach(
  (b) => (b.onclick = () => q("#dialog").showModal()),
);
q("#save").onclick = () => {
  let x = q("#title").value.trim();
  if (x) {
    state.tasks.unshift({
      id: Date.now(),
      title: x,
      subject: q("#subject").value,
      due: "Due soon",
      done: false,
    });
    save();
    tasks();
    q("#title").value = "";
    q("#subject").value = "";
    notify("Task added", "Your new task was saved.");
  }
};
q("#theme").onclick = () => {
  state.dark = !state.dark;
  document.body.classList.toggle("dark", state.dark);
  q("#theme").textContent = state.dark ? "☀ Light mode" : "☾ Dark mode";
  save();
};
if (state.dark) {
  document.body.classList.add("dark");
  q("#theme").textContent = "☀ Light mode";
}
let sec = 1500,
  clock,
  run = false;
function show() {
  q("#time").textContent =
    Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
}
q("#start").onclick = () => {
  run = !run;
  q("#start").textContent = run ? "Pause focus" : "Start focus";
  if (run)
    clock = setInterval(() => {
      if (sec) {
        sec--;
        show();
      } else {
        clearInterval(clock);
        run = false;
        state.focus += 25;
        renderStats();
        save();
        notify("Focus session complete", "Great work. Take a short reset.");
      }
    }, 1000);
  else clearInterval(clock);
};
q("#reset").onclick = () => {
  clearInterval(clock);
  run = false;
  sec = 1500;
  show();
  q("#start").textContent = "Start focus";
};
q("#enableNotifications").onclick = enableNotifications;
q("#testNotification").onclick = () => {
  notify("Study Companion", "This is what your reminders will look like.");
};
q("#flash").onclick = () => {
  q("#cardText").textContent = "Use New card to create your first flashcard.";
};
q("#generate").onclick = () => {
  let t = q("#topic").value || "your selected topic";
  q("#result").innerHTML =
    "<b>Your " +
    t +
    " practice quiz is ready.</b><br>1. Which idea is most central to this topic?<br>2. How would you explain its key process in your own words?<br>3. What is one real-world example?";
};
let c = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  .map((x) => '<div class="day"><b>' + x + "</b></div>")
  .join("");
for (let i = 1; i < 32; i++) c += '<div class="day"><b>' + i + "</b></div>";
q("#calendarGrid").innerHTML = c;
q("#search").oninput = (e) => {
  let x = e.target.value.toLowerCase();
  if (
    x.length > 1 &&
    state.tasks.some(
      (t) =>
        t.title.toLowerCase().includes(x) ||
        t.subject.toLowerCase().includes(x),
    )
  )
    nav("planner");
};
q("#profileButton").onclick = () => {
  editingProfileId = state.activeProfileId || null;
  populateProfileForm();
  q("#profileDialog").showModal();
};
q("#profilePicker").onchange = (event) => {
  editingProfileId = event.target.value || null;
  populateProfileForm();
};
q("#newProfile").onclick = () => {
  editingProfileId = null;
  populateProfileForm();
  q("#profileName").focus();
};
q("#saveProfile").onclick = (event) => {
  const name = q("#profileName").value.trim();
  if (!name) {
    event.preventDefault();
    q("#profileName").focus();
    return;
  }
  const profile = {
    id: editingProfileId || String(Date.now()),
    name,
    focus: q("#profileFocus").value.trim(),
    color: q("#profileColor").value,
  };
  const existing = state.profiles.findIndex((item) => item.id === profile.id);
  if (existing >= 0) state.profiles[existing] = profile;
  else state.profiles.push(profile);
  state.activeProfileId = profile.id;
  save();
  renderProfile();
};
tasks();
renderProfile();
renderNotifications();
show();
