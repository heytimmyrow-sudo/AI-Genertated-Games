const key = "study-companion-v2";
let state = JSON.parse(localStorage.getItem(key) || "null") || {
  dark: false,
  focus: 0,
  notifications: false,
  subjects: [],
  grades: [],
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
if (!Array.isArray(state.subjects)) {
  state.subjects = [];
}
if (!Array.isArray(state.grades)) {
  state.grades = [];
}
state.grades.forEach((grade) => {
  if (!grade.weightLabel) grade.weightLabel = grade.type || "Grade";
});
state.tasks
  .map((task) => task.subject)
  .filter(Boolean)
  .forEach((name) => {
    if (!state.subjects.some((subject) => subject.name === name)) {
      state.subjects.push({
        id: "subject-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name,
        color: "#6558e8",
      });
    }
  });
state.tasks.forEach((task) => {
  if (!task.subjectId && task.subject) {
    const subject = state.subjects.find((item) => item.name === task.subject);
    if (subject) task.subjectId = subject.id;
  }
});
let editingProfileId = state.activeProfileId || null;
function escapeHtml(value) {
  return String(value || "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char],
  );
}
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
            '<option value="' +
            profile.id +
            '">' +
            escapeHtml(profile.name) +
            "</option>",
        )
        .join("")
    : '<option value="">New profile</option>';
  picker.value = editingProfileId || "";
  const profile = state.profiles.find((item) => item.id === editingProfileId);
  q("#profileName").value = profile ? profile.name : "";
  q("#profileFocus").value = profile ? profile.focus : "";
  q("#profileColor").value = profile ? profile.color : "#6558e8";
}
function subjectById(id) {
  return state.subjects.find((subject) => subject.id === id) || null;
}
function subjectOptions() {
  return state.subjects.length
    ? state.subjects
        .map(
          (subject) =>
            '<option value="' +
            subject.id +
            '">' +
            escapeHtml(subject.name) +
            "</option>",
        )
        .join("")
    : '<option value="">Add a subject first</option>';
}
function syncSubjectSelectors() {
  q("#subject").innerHTML = subjectOptions();
  q("#gradeSubject").innerHTML = subjectOptions();
}
function gradePercent(grade) {
  return grade.outOf ? (grade.score / grade.outOf) * 100 : 0;
}
function subjectAverage(subjectId) {
  const entries = state.grades.filter((grade) => grade.subjectId === subjectId);
  const weight = entries.reduce((total, grade) => total + grade.weight, 0);
  if (!weight) return null;
  return (
    entries.reduce(
      (total, grade) => total + gradePercent(grade) * grade.weight,
      0,
    ) / weight
  );
}
const weightColors = [
  "#6558e8",
  "#ef7e72",
  "#37a98a",
  "#4b93e6",
  "#d89c2f",
  "#c25fd6",
  "#2f9ab7",
];
function weightBreakdown() {
  const totals = new Map();
  state.grades.forEach((grade) => {
    const label = grade.weightLabel || grade.type || "Grade";
    totals.set(label, (totals.get(label) || 0) + grade.weight);
  });
  return [...totals.entries()].map(([label, weight], index) => ({
    label,
    weight,
    color: weightColors[index % weightColors.length],
  }));
}
function updateWeightPreview() {
  const label =
    q("#weightLabel").value.trim() || q("#gradeType").value || "Weight";
  const weight = Number(q("#gradeWeight").value) || 0;
  q("#weightPreview").textContent = label + " = " + weight + "%";
}
function renderSubjects() {
  syncSubjectSelectors();
  q("#subjectList").innerHTML = state.subjects.length
    ? state.subjects
        .map((subject) => {
          const openTasks = state.tasks.filter(
            (task) => task.subjectId === subject.id && !task.done,
          ).length;
          const average = subjectAverage(subject.id);
          return (
            '<button class="subject-card" data-subject-id="' +
            subject.id +
            '"><span style="background:' +
            subject.color +
            '"></span><b>' +
            escapeHtml(subject.name) +
            "</b><small>" +
            openTasks +
            " open tasks" +
            (average === null ? "" : " · " + Math.round(average) + "% avg") +
            "</small></button>"
          );
        })
        .join("")
    : '<div class="empty-state"><b>No subjects yet.</b><small>Add classes like Algebra, History, or Science.</small></div>';
  qa(".subject-card").forEach(
    (button) =>
      (button.onclick = () => {
        nav("grades");
      }),
  );
}
function html(t) {
  const subject = subjectById(t.subjectId);
  return (
    '<div class="task ' +
    (t.done ? "done" : "") +
    '"><button class="check" data-id="' +
    t.id +
    '">' +
    (t.done ? "✓" : "") +
    "</button><div><b>" +
    escapeHtml(t.title) +
    "</b><small>" +
    t.due +
    '</small></div><span class="tag">' +
    escapeHtml(subject ? subject.name : t.subject || "No subject") +
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
  renderSubjects();
  renderGrades();
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
  const gradedSubjects = state.subjects.filter(
    (subject) => subjectAverage(subject.id) !== null,
  );
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
  if (state.subjects.length > 0) {
    cards.push(
      "<article>□ <b>" +
        state.subjects.length +
        "<small>Subjects</small></b><span>Active</span></article>",
    );
  }
  if (gradedSubjects.length > 0) {
    const overall =
      gradedSubjects.reduce(
        (total, subject) => total + subjectAverage(subject.id),
        0,
      ) / gradedSubjects.length;
    cards.push(
      "<article>↗ <b>" +
        Math.round(overall) +
        "%<small>Grade average</small></b><span>Weighted</span></article>",
    );
  }
  q("#stats").innerHTML = cards.length
    ? cards.join("")
    : '<div class="stats-empty">Your study statistics will appear after you log activity.</div>';
}
function renderGrades() {
  q("#gradeSummary").innerHTML = state.subjects.length
    ? state.subjects
        .map((subject) => {
          const entries = state.grades.filter(
            (grade) => grade.subjectId === subject.id,
          );
          const weight = entries.reduce(
            (total, grade) => total + grade.weight,
            0,
          );
          const average = subjectAverage(subject.id);
          return (
            '<article class="panel grade-card"><span style="background:' +
            subject.color +
            '"></span><p>' +
            escapeHtml(subject.name) +
            "</p><h1>" +
            (average === null ? "--" : Math.round(average) + "%") +
            "</h1><small>" +
            entries.length +
            " grades · " +
            weight +
            "% weight logged</small></article>"
          );
        })
        .join("")
    : '<article class="panel empty-state"><b>No subjects yet.</b><small>Add a subject before tracking grades.</small></article>';
  q("#gradeList").innerHTML = state.grades.length
    ? state.grades
        .map((grade) => {
          const subject = subjectById(grade.subjectId);
          return (
            '<div class="grade-row"><div><b>' +
            escapeHtml(grade.name) +
            "</b><small>" +
            escapeHtml(subject ? subject.name : "No subject") +
            " · " +
            escapeHtml(grade.weightLabel || grade.type) +
            "</small></div><strong>" +
            Math.round(gradePercent(grade)) +
            '%</strong><span class="tag">' +
            grade.weight +
            "% weight</span></div>"
          );
        })
        .join("")
    : '<div class="empty-state"><b>No grades tracked yet.</b><small>Add tests, schoolwork, projects, or homework with weights.</small></div>';
  renderWeightChart();
}
function renderWeightChart() {
  const items = weightBreakdown();
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  if (!total) {
    q("#weightPie").style.background = "";
    q("#weightPie").innerHTML = "<span>No weights</span>";
    q("#weightLegend").innerHTML =
      '<div class="empty-state"><b>No chart yet.</b><small>Add weighted grades to build your pie chart.</small></div>';
    return;
  }
  let cursor = 0;
  const stops = items.map((item) => {
    const start = cursor;
    cursor += (item.weight / total) * 100;
    return item.color + " " + start + "% " + cursor + "%";
  });
  q("#weightPie").innerHTML = "<span>Weights<small>by label</small></span>";
  q("#weightPie").style.background = "conic-gradient(" + stops.join(",") + ")";
  q("#weightLegend").innerHTML = items
    .map(
      (item) =>
        '<div class="weight-key"><span style="background:' +
        item.color +
        '"></span><b>' +
        escapeHtml(item.label) +
        " = " +
        item.weight +
        "%</b></div>",
    )
    .join("");
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
  (b) =>
    (b.onclick = () => {
      syncSubjectSelectors();
      if (!state.subjects.length) {
        toast("Add a subject first.");
        q("#subjectDialog").showModal();
        return;
      }
      q("#dialog").showModal();
    }),
);
qa('[data-action="subject"]').forEach(
  (b) =>
    (b.onclick = () => {
      q("#subjectName").value = "";
      q("#subjectColor").value = "#6558e8";
      q("#subjectDialog").showModal();
    }),
);
qa('[data-action="grade"]').forEach(
  (b) =>
    (b.onclick = () => {
      syncSubjectSelectors();
      if (!state.subjects.length) {
        toast("Add a subject before adding grades.");
        q("#subjectDialog").showModal();
        return;
      }
      q("#gradeName").value = "";
      q("#gradeScore").value = "";
      q("#gradeOutOf").value = "100";
      q("#gradeWeight").value = "10";
      q("#weightLabel").value = q("#gradeType").value;
      updateWeightPreview();
      q("#gradeDialog").showModal();
    }),
);
q("#save").onclick = () => {
  let x = q("#title").value.trim();
  if (x) {
    const subject = subjectById(q("#subject").value);
    if (!subject) {
      toast("Choose a subject for this task.");
      return;
    }
    state.tasks.unshift({
      id: Date.now(),
      title: x,
      subjectId: subject.id,
      subject: subject.name,
      due: "Due soon",
      done: false,
    });
    save();
    tasks();
    q("#title").value = "";
    notify("Task added", "Your new task was saved.");
  }
};
q("#saveSubject").onclick = (event) => {
  const name = q("#subjectName").value.trim();
  if (!name) {
    event.preventDefault();
    q("#subjectName").focus();
    return;
  }
  const existing = state.subjects.find(
    (subject) => subject.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) {
    state.tasks.forEach((task) => {
      if (task.subject === name && !task.subjectId)
        task.subjectId = existing.id;
    });
  } else {
    state.subjects.push({
      id: "subject-" + Date.now(),
      name,
      color: q("#subjectColor").value,
    });
  }
  save();
  renderSubjects();
  renderGrades();
  renderStats();
  toast(existing ? "That subject already exists." : "Subject added.");
};
q("#saveGrade").onclick = (event) => {
  const subject = subjectById(q("#gradeSubject").value);
  const name = q("#gradeName").value.trim();
  const score = Number(q("#gradeScore").value);
  const outOf = Number(q("#gradeOutOf").value);
  const weight = Number(q("#gradeWeight").value);
  const weightLabel =
    q("#weightLabel").value.trim() || q("#gradeType").value || "Grade";
  if (!subject || !name || score < 0 || outOf <= 0 || weight <= 0) {
    event.preventDefault();
    toast("Fill in the grade, score, total, and weight.");
    return;
  }
  state.grades.unshift({
    id: Date.now(),
    subjectId: subject.id,
    type: q("#gradeType").value,
    name,
    score,
    outOf,
    weight,
    weightLabel,
  });
  save();
  renderGrades();
  renderSubjects();
  renderStats();
  notify("Grade added", subject.name + " average updated.");
};
q("#gradeType").onchange = () => {
  if (!q("#weightLabel").value.trim())
    q("#weightLabel").value = q("#gradeType").value;
  updateWeightPreview();
};
q("#gradeWeight").oninput = updateWeightPreview;
q("#weightLabel").oninput = updateWeightPreview;
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
