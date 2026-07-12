const key = "study-companion-v2";
let state = JSON.parse(localStorage.getItem(key) || "null") || {
  dark: false,
  schoolTheme: "st-patrick",
  focus: 0,
  notifications: false,
  profiles: [],
  subjects: [],
  grades: [],
  tasks: [],
  notes: [],
  exams: [],
  classes: [],
  activeNoteId: null,
};

const q = (s) => document.querySelector(s);
const qa = (s) => [...document.querySelectorAll(s)];
const schoolThemes = ["st-patrick", "notre-dame", "fenwick"];
const schoolDataFields = [
  "profiles",
  "subjects",
  "grades",
  "tasks",
  "notes",
  "exams",
  "classes",
];

function makeSchoolData(source = {}) {
  const data = {
    focus: Number(source.focus) || 0,
    activeProfileId: source.activeProfileId || null,
    activeNoteId: source.activeNoteId || null,
  };
  schoolDataFields.forEach((field) => {
    data[field] = Array.isArray(source[field]) ? source[field] : [];
  });
  return data;
}

function ensureSchoolData(theme = state.schoolTheme) {
  if (!state.schoolData || typeof state.schoolData !== "object") {
    state.schoolData = {};
  }
  if (!state.schoolData["st-patrick"]) {
    state.schoolData["st-patrick"] = makeSchoolData(state);
  }
  schoolThemes.forEach((item) => {
    if (!state.schoolData[item]) state.schoolData[item] = makeSchoolData();
  });
  return state.schoolData[theme] || state.schoolData["st-patrick"];
}

function bindSchoolData(theme = state.schoolTheme) {
  const data = ensureSchoolData(theme);
  schoolDataFields.forEach((field) => {
    state[field] = data[field];
  });
  state.focus = data.focus || 0;
  state.activeProfileId = data.activeProfileId || null;
  state.activeNoteId = data.activeNoteId || null;
}

function syncSchoolData() {
  const data = ensureSchoolData(state.schoolTheme);
  schoolDataFields.forEach((field) => {
    data[field] = state[field];
  });
  data.focus = Number(state.focus) || 0;
  data.activeProfileId = state.activeProfileId || null;
  data.activeNoteId =
    typeof activeNoteId === "undefined" ? state.activeNoteId : activeNoteId;
}

function save() {
  syncSchoolData();
  localStorage.setItem(key, JSON.stringify(state));
}

function ensureArray(name) {
  if (!Array.isArray(state[name])) state[name] = [];
}

[
  "profiles",
  "subjects",
  "grades",
  "tasks",
  "notes",
  "exams",
  "classes",
].forEach(ensureArray);
if (typeof state.notifications !== "boolean") state.notifications = false;
if (!schoolThemes.includes(state.schoolTheme)) {
  state.schoolTheme = "st-patrick";
}
ensureSchoolData();
bindSchoolData();
if (!state.activeProfileId && state.profiles.length) {
  state.activeProfileId = state.profiles[0].id;
}
state.grades.forEach((grade) => {
  if (!grade.weightLabel) grade.weightLabel = grade.type || "Grade";
  grade.weight = Number(grade.weight) || 0;
});
state.tasks
  .map((task) => task.subject)
  .filter(Boolean)
  .forEach((name) => {
    if (!state.subjects.some((subject) => subject.name === name)) {
      state.subjects.push({
        id: "subject-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name,
        color: "#24583b",
      });
    }
  });
state.tasks.forEach((task) => {
  if (!task.subjectId && task.subject) {
    const subject = state.subjects.find((item) => item.name === task.subject);
    if (subject) task.subjectId = subject.id;
  }
  if (!task.dueDate) task.dueDate = "";
  task.due = formatDate(task.dueDate);
});
state.notes.forEach((note) => {
  if (!note.updatedAt) note.updatedAt = Date.now();
});

let editingProfileId = state.activeProfileId || null;
let editingTaskId = null;
let editingSubjectId = null;
let editingGradeId = null;
let editingExamId = null;
let activeNoteId = state.activeNoteId || null;
let noteSaveTimer;

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

function formatDate(value) {
  if (!value) return "No due date";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return "No due date";
  return Number(month) + "/" + Number(day) + "/" + year;
}

function daysUntil(value) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value + "T00:00:00");
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target - today) / 86400000);
}

function activeSchoolPrimary() {
  return (
    {
      "st-patrick": { primary: "#24583b", label: "Saint Patrick green" },
      "notre-dame": { primary: "#c99700", label: "Notre Dame gold" },
      fenwick: { primary: "#f2c300", label: "Fenwick yellow" },
    }[state.schoolTheme] || {
      primary: "#24583b",
      label: "Saint Patrick green",
    }
  );
}

function applySchoolTheme() {
  document.body.classList.toggle(
    "theme-notre-dame",
    state.schoolTheme === "notre-dame",
  );
  document.body.classList.toggle(
    "theme-fenwick",
    state.schoolTheme === "fenwick",
  );
  const picker = q("#schoolTheme");
  if (picker) picker.value = state.schoolTheme;
  const active = activeSchoolPrimary();
  ["#subjectColor", "#profileColor"].forEach((selector) => {
    const select = q(selector);
    const option = select?.querySelector('option[data-school-primary="true"]');
    if (!option) return;
    const shouldUpdate = !select.value || select.value === option.value;
    option.value = active.primary;
    option.textContent = active.label;
    if (shouldUpdate) select.value = active.primary;
  });
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
  q("#profileColor").value = profile
    ? profile.color
    : activeSchoolPrimary().primary;
}

function subjectById(id) {
  return state.subjects.find((subject) => subject.id === id) || null;
}

function subjectOptions(includeEmpty = false) {
  const empty = includeEmpty
    ? '<option value="">No subject</option>'
    : state.subjects.length
      ? ""
      : '<option value="">Add a subject first</option>';
  return (
    empty +
    state.subjects
      .map(
        (subject) =>
          '<option value="' +
          subject.id +
          '">' +
          escapeHtml(subject.name) +
          "</option>",
      )
      .join("")
  );
}

function syncSubjectSelectors() {
  ["#subject", "#gradeSubject", "#examSubject"].forEach((selector) => {
    if (q(selector)) q(selector).innerHTML = subjectOptions();
  });
  if (q("#noteSubject")) q("#noteSubject").innerHTML = subjectOptions(true);
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
  "#24583b",
  "#c99700",
  "#041e42",
  "#f2c300",
  "#111111",
  "#b58b00",
  "#5b6770",
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
            '<article class="subject-card" data-subject-id="' +
            subject.id +
            '"><button class="subject-main" data-open-subject="' +
            subject.id +
            '"><span style="background:' +
            subject.color +
            '"></span><b>' +
            escapeHtml(subject.name) +
            "</b><small>" +
            openTasks +
            " open tasks" +
            (average === null ? "" : " · " + Math.round(average) + "% avg") +
            '</small></button><div class="item-actions"><button data-edit-subject="' +
            subject.id +
            '">Edit</button><button class="danger" data-delete-subject="' +
            subject.id +
            '">Delete</button></div></article>'
          );
        })
        .join("")
    : '<div class="empty-state"><b>No subjects yet.</b><small>Add classes like Algebra, History, or Science.</small></div>';
  qa("[data-open-subject]").forEach(
    (button) => (button.onclick = () => nav("grades")),
  );
  qa("[data-edit-subject]").forEach((button) => {
    button.onclick = () => openSubjectDialog(button.dataset.editSubject);
  });
  qa("[data-delete-subject]").forEach((button) => {
    button.onclick = () => deleteSubject(button.dataset.deleteSubject);
  });
}

function taskHtml(t) {
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
    formatDate(t.dueDate) +
    '</small></div><span class="tag">' +
    escapeHtml(subject ? subject.name : t.subject || "No subject") +
    '</span><div class="item-actions"><button data-edit-task="' +
    t.id +
    '">Edit</button><button class="danger" data-delete-task="' +
    t.id +
    '">Delete</button></div></div>'
  );
}

function tasks() {
  const x = state.tasks.map(taskHtml).join("");
  const empty =
    '<div class="empty-state"><b>Your workspace is clear.</b><small>Add a task when you are ready to begin.</small></div>';
  q("#taskList").innerHTML = x || empty;
  q("#plannerTasks").innerHTML = x || empty;
  q("#plannerCount").textContent = state.tasks.filter((t) => !t.done).length;
  renderSubjects();
  renderGrades();
  renderStats();
  renderCalendar();
  renderExamCountdown();
  qa(".check").forEach((b) => {
    b.onclick = () => {
      const t = state.tasks.find((item) => String(item.id) === b.dataset.id);
      if (!t) return;
      t.done = !t.done;
      save();
      if (t.done) notify("Task complete", t.title + " is done.");
      tasks();
    };
  });
  qa("[data-edit-task]").forEach((button) => {
    button.onclick = () => openTaskDialog(button.dataset.editTask);
  });
  qa("[data-delete-task]").forEach((button) => {
    button.onclick = () => {
      state.tasks = state.tasks.filter(
        (task) => String(task.id) !== button.dataset.deleteTask,
      );
      save();
      tasks();
      toast("Task deleted.");
    };
  });
}

function renderStats() {
  const completed = state.tasks.filter((task) => task.done).length;
  const gradedSubjects = state.subjects.filter(
    (subject) => subjectAverage(subject.id) !== null,
  );
  const cards = [];
  if (state.focus > 0) {
    cards.push(
      "<article>◇ <b>" +
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
            '% weight</span><div class="item-actions"><button data-edit-grade="' +
            grade.id +
            '">Edit</button><button class="danger" data-delete-grade="' +
            grade.id +
            '">Delete</button></div></div>'
          );
        })
        .join("")
    : '<div class="empty-state"><b>No grades tracked yet.</b><small>Add tests, schoolwork, projects, or homework with weights.</small></div>';
  qa("[data-edit-grade]").forEach((button) => {
    button.onclick = () => openGradeDialog(button.dataset.editGrade);
  });
  qa("[data-delete-grade]").forEach((button) => {
    button.onclick = () => {
      state.grades = state.grades.filter(
        (grade) => String(grade.id) !== button.dataset.deleteGrade,
      );
      save();
      renderGrades();
      renderSubjects();
      renderStats();
      toast("Grade deleted.");
    };
  });
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

function makeInviteCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from(
      { length: 6 },
      () => letters[Math.floor(Math.random() * letters.length)],
    ).join("");
  } while (state.classes.some((item) => item.code === code));
  return code;
}

function renderClasses() {
  const list = q("#classList");
  if (!list) return;
  list.innerHTML = state.classes.length
    ? state.classes
        .map((item) => {
          const students = Array.isArray(item.students) ? item.students : [];
          return (
            '<article class="classroom-card"><div><p>' +
            escapeHtml(
              item.role === "student" ? "JOINED CLASS" : "TEACHER CLASS",
            ) +
            "</p><h2>" +
            escapeHtml(item.name) +
            "</h2><small>" +
            escapeHtml(item.teacher || "Teacher") +
            (item.room ? " · " + escapeHtml(item.room) : "") +
            '</small></div><div class="class-code"><span>Invite code</span><b>' +
            escapeHtml(item.code) +
            '</b></div><div class="student-roster"><b>' +
            students.length +
            " student" +
            (students.length === 1 ? "" : "s") +
            "</b><small>" +
            (students.length
              ? students.map((student) => escapeHtml(student.name)).join(", ")
              : "Students will appear after they join.") +
            '</small></div><div class="item-actions"><button data-copy-class="' +
            item.id +
            '">Copy code</button><button class="danger" data-delete-class="' +
            item.id +
            '">Delete</button></div></article>'
          );
        })
        .join("")
    : '<div class="empty-state"><b>No classes yet.</b><small>Teachers can create a class and students can join with an invite code.</small></div>';
  qa("[data-copy-class]").forEach((button) => {
    button.onclick = async () => {
      const item = state.classes.find(
        (classItem) => String(classItem.id) === button.dataset.copyClass,
      );
      if (!item) return;
      try {
        await navigator.clipboard.writeText(item.code);
        toast("Invite code copied: " + item.code);
      } catch {
        toast("Invite code: " + item.code);
      }
    };
  });
  qa("[data-delete-class]").forEach((button) => {
    button.onclick = () => {
      state.classes = state.classes.filter(
        (item) => String(item.id) !== button.dataset.deleteClass,
      );
      save();
      renderClasses();
      toast("Class deleted.");
    };
  });
}

function renderCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  let html = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    .map((x) => '<div class="day day-head"><b>' + x + "</b></div>")
    .join("");
  for (let i = 0; i < first; i++) html += '<div class="day muted-day"></div>';
  for (let day = 1; day <= days; day++) {
    const dateKey =
      year +
      "-" +
      String(month + 1).padStart(2, "0") +
      "-" +
      String(day).padStart(2, "0");
    const dayTasks = state.tasks.filter((task) => task.dueDate === dateKey);
    const dayExams = state.exams.filter((exam) => exam.date === dateKey);
    html += '<div class="day"><b>' + day + "</b>";
    dayTasks.forEach((task) => {
      html +=
        '<span class="event assignment">HW: ' +
        escapeHtml(task.title) +
        "</span>";
    });
    dayExams.forEach((exam) => {
      html +=
        '<span class="event exam">Exam: ' + escapeHtml(exam.title) + "</span>";
    });
    html += "</div>";
  }
  q("#calendarGrid").innerHTML = html;
}

function renderExamCountdown() {
  const card = q("#examCountdown");
  if (!card) return;
  const upcoming = state.exams
    .map((exam) => ({ ...exam, days: daysUntil(exam.date) }))
    .filter((exam) => exam.days !== null && exam.days >= 0)
    .sort((a, b) => a.days - b.days)[0];
  if (!upcoming) {
    card.innerHTML =
      '<p>NEXT EXAM</p><h2>No exams added yet</h2><small>Add an exam when you are ready to plan for it.</small><button data-action="exam">Add an exam -></button>';
  } else {
    const subject = subjectById(upcoming.subjectId);
    card.innerHTML =
      "<p>NEXT EXAM</p><h2>" +
      escapeHtml(upcoming.title) +
      "</h2><small>" +
      (upcoming.days === 0 ? "Today" : upcoming.days + " days away") +
      (subject ? " · " + escapeHtml(subject.name) : "") +
      '</small><button data-action="exam">Add another exam -></button>';
  }
  wireActionButtons(card);
}

function renderNotes() {
  syncSubjectSelectors();
  if (!activeNoteId && state.notes.length) activeNoteId = state.notes[0].id;
  const active = state.notes.find(
    (note) => String(note.id) === String(activeNoteId),
  );
  state.activeNoteId = active ? active.id : null;
  q("#noteList").innerHTML = state.notes.length
    ? state.notes
        .map((note) => {
          const subject = subjectById(note.subjectId);
          return (
            '<button class="note-item ' +
            (String(note.id) === String(activeNoteId) ? "active" : "") +
            '" data-note-id="' +
            note.id +
            '"><b>' +
            escapeHtml(note.title || "Untitled note") +
            "</b><small>" +
            escapeHtml(subject ? subject.name : "No subject") +
            "</small></button>"
          );
        })
        .join("")
    : '<div class="empty-state"><b>No notes yet.</b><small>Create a note for any class or topic.</small></div>';
  q("#noteTitle").value = active ? active.title : "";
  q("#noteSubject").value = active ? active.subjectId || "" : "";
  q("#noteBody").textContent = active ? active.body : "";
  q("#saveNote").disabled = !active;
  q("#deleteNote").disabled = !active;
  qa("[data-note-id]").forEach((button) => {
    button.onclick = () => {
      activeNoteId = button.dataset.noteId;
      renderNotes();
    };
  });
  save();
}

function currentNote() {
  return state.notes.find((note) => String(note.id) === String(activeNoteId));
}

function saveCurrentNote(showToast = false) {
  const note = currentNote();
  if (!note) return;
  note.title = q("#noteTitle").value.trim() || "Untitled note";
  note.subjectId = q("#noteSubject").value;
  note.body = q("#noteBody").textContent.trim();
  note.updatedAt = Date.now();
  state.activeNoteId = note.id;
  save();
  if (showToast) {
    renderNotes();
    toast("Note saved.");
  }
}

function scheduleNoteAutosave() {
  if (!currentNote()) return;
  clearTimeout(noteSaveTimer);
  noteSaveTimer = setTimeout(() => saveCurrentNote(false), 450);
}

function openTaskDialog(id = null) {
  editingTaskId = id;
  syncSubjectSelectors();
  if (!state.subjects.length) {
    toast("Add a subject first.");
    openSubjectDialog();
    return;
  }
  const task = state.tasks.find((item) => String(item.id) === String(id));
  q("#taskDialogTitle").textContent = task ? "Edit task" : "Add to your plan";
  q("#save").textContent = task ? "Save task" : "Add task";
  q("#title").value = task ? task.title : "";
  q("#subject").value = task ? task.subjectId || "" : state.subjects[0].id;
  q("#due").value = task ? task.dueDate || "" : "";
  q("#dialog").showModal();
}

function openSubjectDialog(id = null) {
  editingSubjectId = id;
  const subject = subjectById(id);
  q("#subjectDialogTitle").textContent = subject
    ? "Edit subject"
    : "Add a subject";
  q("#saveSubject").textContent = subject ? "Save subject" : "Add subject";
  q("#subjectName").value = subject ? subject.name : "";
  q("#subjectColor").value = subject
    ? subject.color
    : activeSchoolPrimary().primary;
  q("#subjectDialog").showModal();
}

function openGradeDialog(id = null) {
  editingGradeId = id;
  syncSubjectSelectors();
  if (!state.subjects.length) {
    toast("Add a subject before adding grades.");
    openSubjectDialog();
    return;
  }
  const grade = state.grades.find((item) => String(item.id) === String(id));
  q("#gradeDialogTitle").textContent = grade ? "Edit grade" : "Add grade";
  q("#saveGrade").textContent = grade ? "Save grade" : "Add grade";
  q("#gradeSubject").value = grade ? grade.subjectId : state.subjects[0].id;
  q("#gradeType").value = grade ? grade.type : "Test";
  q("#gradeName").value = grade ? grade.name : "";
  q("#gradeScore").value = grade ? grade.score : "";
  q("#gradeOutOf").value = grade ? grade.outOf : "100";
  q("#gradeWeight").value = grade ? grade.weight : "10";
  q("#weightLabel").value = grade ? grade.weightLabel : q("#gradeType").value;
  updateWeightPreview();
  q("#gradeDialog").showModal();
}

function openExamDialog(id = null) {
  editingExamId = id;
  syncSubjectSelectors();
  if (!state.subjects.length) {
    toast("Add a subject before adding exams.");
    openSubjectDialog();
    return;
  }
  const exam = state.exams.find((item) => String(item.id) === String(id));
  q("#examDialogTitle").textContent = exam ? "Edit exam" : "Add exam";
  q("#saveExam").textContent = exam ? "Save exam" : "Add exam";
  q("#examTitle").value = exam ? exam.title : "";
  q("#examSubject").value = exam ? exam.subjectId : state.subjects[0].id;
  q("#examDate").value = exam ? exam.date : "";
  q("#examDialog").showModal();
}

function deleteSubject(id) {
  const used =
    state.tasks.some((task) => task.subjectId === id) ||
    state.grades.some((grade) => grade.subjectId === id) ||
    state.notes.some((note) => note.subjectId === id) ||
    state.exams.some((exam) => exam.subjectId === id);
  if (used) {
    toast("Delete or move this subject's items first.");
    return;
  }
  state.subjects = state.subjects.filter((subject) => subject.id !== id);
  save();
  renderSubjects();
  renderGrades();
  renderNotes();
  toast("Subject deleted.");
}

function wireActionButtons(scope = document) {
  scope.querySelectorAll('[data-action="task"]').forEach((b) => {
    b.onclick = () => openTaskDialog();
  });
  scope.querySelectorAll('[data-action="subject"]').forEach((b) => {
    b.onclick = () => openSubjectDialog();
  });
  scope.querySelectorAll('[data-action="grade"]').forEach((b) => {
    b.onclick = () => openGradeDialog();
  });
  scope.querySelectorAll('[data-action="exam"]').forEach((b) => {
    b.onclick = () => openExamDialog();
  });
  scope.querySelectorAll('[data-action="class"]').forEach((b) => {
    b.onclick = () => {
      q("#className").value = "";
      q("#teacherName").value = "";
      q("#classRoom").value = "";
      q("#classDialog").showModal();
    };
  });
  scope.querySelectorAll('[data-action="join-class"]').forEach((b) => {
    b.onclick = () => {
      q("#joinCode").value = "";
      q("#studentName").value = "";
      q("#joinClassDialog").showModal();
    };
  });
  scope.querySelectorAll('[data-action="note"]').forEach((b) => {
    b.onclick = () => {
      const note = {
        id: Date.now(),
        title: "Untitled note",
        subjectId: state.subjects[0]?.id || "",
        body: "",
        updatedAt: Date.now(),
      };
      state.notes.unshift(note);
      activeNoteId = note.id;
      renderNotes();
      q("#noteTitle").focus();
      toast("New note created.");
    };
  });
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
  if (state.notifications)
    notify("Study Companion", "Notifications are ready.");
  else {
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
wireActionButtons();

q("#save").onclick = (event) => {
  const title = q("#title").value.trim();
  const subject = subjectById(q("#subject").value);
  if (!title || !subject) {
    event.preventDefault();
    toast("Add a title and subject.");
    return;
  }
  const data = {
    title,
    subjectId: subject.id,
    subject: subject.name,
    dueDate: q("#due").value,
    due: formatDate(q("#due").value),
  };
  const task = state.tasks.find(
    (item) => String(item.id) === String(editingTaskId),
  );
  if (task) Object.assign(task, data);
  else state.tasks.unshift({ id: Date.now(), done: false, ...data });
  editingTaskId = null;
  save();
  tasks();
  notify(task ? "Task updated" : "Task added", title + " was saved.");
};

q("#saveSubject").onclick = (event) => {
  const name = q("#subjectName").value.trim();
  if (!name) {
    event.preventDefault();
    q("#subjectName").focus();
    return;
  }
  const duplicate = state.subjects.find(
    (subject) =>
      subject.id !== editingSubjectId &&
      subject.name.toLowerCase() === name.toLowerCase(),
  );
  if (duplicate) {
    event.preventDefault();
    toast("That subject already exists.");
    return;
  }
  const subject = subjectById(editingSubjectId);
  if (subject) {
    subject.name = name;
    subject.color = q("#subjectColor").value;
    state.tasks.forEach((task) => {
      if (task.subjectId === subject.id) task.subject = subject.name;
    });
  } else {
    state.subjects.push({
      id: "subject-" + Date.now(),
      name,
      color: q("#subjectColor").value,
    });
  }
  editingSubjectId = null;
  save();
  tasks();
  renderNotes();
  toast(subject ? "Subject updated." : "Subject added.");
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
  const data = {
    subjectId: subject.id,
    type: q("#gradeType").value,
    name,
    score,
    outOf,
    weight,
    weightLabel,
  };
  const grade = state.grades.find(
    (item) => String(item.id) === String(editingGradeId),
  );
  if (grade) Object.assign(grade, data);
  else state.grades.unshift({ id: Date.now(), ...data });
  editingGradeId = null;
  save();
  renderGrades();
  renderSubjects();
  renderStats();
  notify(
    grade ? "Grade updated" : "Grade added",
    subject.name + " average updated.",
  );
};

q("#saveExam").onclick = (event) => {
  const subject = subjectById(q("#examSubject").value);
  const title = q("#examTitle").value.trim();
  const date = q("#examDate").value;
  if (!subject || !title || !date) {
    event.preventDefault();
    toast("Add an exam title, subject, and date.");
    return;
  }
  const data = { title, subjectId: subject.id, date };
  const exam = state.exams.find(
    (item) => String(item.id) === String(editingExamId),
  );
  if (exam) Object.assign(exam, data);
  else state.exams.unshift({ id: Date.now(), ...data });
  editingExamId = null;
  save();
  renderCalendar();
  renderExamCountdown();
  notify(exam ? "Exam updated" : "Exam added", title + " is on the calendar.");
};

q("#saveClass").onclick = (event) => {
  const name = q("#className").value.trim();
  const teacher = q("#teacherName").value.trim();
  if (!name || !teacher) {
    event.preventDefault();
    toast("Add a class name and teacher name.");
    return;
  }
  state.classes.unshift({
    id: Date.now(),
    role: "teacher",
    name,
    teacher,
    room: q("#classRoom").value.trim(),
    code: makeInviteCode(),
    students: [],
    createdAt: Date.now(),
  });
  save();
  renderClasses();
  notify("Class created", "Invite code is ready for students.");
};

q("#joinClass").onclick = (event) => {
  const code = q("#joinCode").value.trim().toUpperCase();
  const studentName = q("#studentName").value.trim();
  const classItem = state.classes.find((item) => item.code === code);
  if (!code || !studentName || !classItem) {
    event.preventDefault();
    toast("Enter a valid class code and student name.");
    return;
  }
  if (!Array.isArray(classItem.students)) classItem.students = [];
  const existing = classItem.students.find(
    (student) => student.name.toLowerCase() === studentName.toLowerCase(),
  );
  if (!existing) {
    classItem.students.push({ id: Date.now(), name: studentName });
  }
  save();
  renderClasses();
  notify("Class joined", studentName + " joined " + classItem.name + ".");
};

q("#gradeType").onchange = () => {
  if (!q("#weightLabel").value.trim())
    q("#weightLabel").value = q("#gradeType").value;
  updateWeightPreview();
};
q("#gradeWeight").oninput = updateWeightPreview;
q("#weightLabel").oninput = updateWeightPreview;

q("#newNote").onclick = () => {
  const note = {
    id: Date.now(),
    title: "Untitled note",
    subjectId: state.subjects[0]?.id || "",
    body: "",
    updatedAt: Date.now(),
  };
  state.notes.unshift(note);
  activeNoteId = note.id;
  renderNotes();
  q("#noteTitle").focus();
};
q("#saveNote").onclick = () => saveCurrentNote(true);
q("#deleteNote").onclick = () => {
  if (!currentNote()) return;
  state.notes = state.notes.filter(
    (note) => String(note.id) !== String(activeNoteId),
  );
  activeNoteId = state.notes[0]?.id || null;
  save();
  renderNotes();
  toast("Note deleted.");
};
q("#noteTitle").oninput = scheduleNoteAutosave;
q("#noteSubject").onchange = scheduleNoteAutosave;
q("#noteBody").oninput = scheduleNoteAutosave;

q("#exportData").onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "study-companion-backup.json";
  link.click();
  URL.revokeObjectURL(url);
  toast("Backup exported.");
};
q("#importData").onchange = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported || typeof imported !== "object")
        throw new Error("bad backup");
      state = { ...state, ...imported };
      save();
      location.reload();
    } catch {
      toast("That backup file could not be imported.");
    }
  };
  reader.readAsText(file);
};

q("#schoolTheme").onchange = (event) => {
  syncSchoolData();
  state.schoolTheme = event.target.value;
  bindSchoolData();
  activeNoteId = state.activeNoteId || null;
  editingProfileId = state.activeProfileId || null;
  editingTaskId = null;
  editingSubjectId = null;
  editingGradeId = null;
  editingExamId = null;
  applySchoolTheme();
  tasks();
  renderNotes();
  renderClasses();
  renderProfile();
  renderNotifications();
  save();
  toast("School changed. This school has its own saved data.");
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

let sec = 1500;
let clock;
let run = false;
function show() {
  q("#time").textContent =
    Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
}
q("#start").onclick = () => {
  run = !run;
  q("#start").textContent = run ? "Pause focus" : "Start focus";
  if (run) {
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
  } else clearInterval(clock);
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
  const t = q("#topic").value || "your selected topic";
  q("#result").innerHTML =
    "<b>Your " +
    escapeHtml(t) +
    " practice quiz is ready.</b><br>1. Which idea is most central to this topic?<br>2. How would you explain its key process in your own words?<br>3. What is one real-world example?";
};
q("#search").oninput = (e) => {
  const x = e.target.value.toLowerCase();
  if (x.length <= 1) return;
  const inTasks = state.tasks.some(
    (t) =>
      t.title.toLowerCase().includes(x) ||
      (t.subject || "").toLowerCase().includes(x),
  );
  const inNotes = state.notes.some(
    (note) =>
      (note.title || "").toLowerCase().includes(x) ||
      (note.body || "").toLowerCase().includes(x),
  );
  if (inTasks) nav("planner");
  else if (inNotes) nav("notes");
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

let navScrollTimer;
function handleMobileScroll() {
  if (innerWidth > 580) return;
  document.body.classList.add("nav-hidden");
  clearTimeout(navScrollTimer);
  navScrollTimer = setTimeout(() => {
    document.body.classList.remove("nav-hidden");
  }, 520);
}
addEventListener("scroll", handleMobileScroll, { passive: true });
addEventListener("resize", () => {
  if (innerWidth > 580) document.body.classList.remove("nav-hidden");
});

tasks();
applySchoolTheme();
renderProfile();
renderNotifications();
renderNotes();
renderClasses();
show();
