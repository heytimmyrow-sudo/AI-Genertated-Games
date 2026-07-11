const key = "study-companion-v1";
let state = JSON.parse(localStorage.getItem(key) || "null") || {
  dark: false,
  focus: 0,
  tasks: [],
};
const q = (s) => document.querySelector(s),
  qa = (s) => [...document.querySelectorAll(s)],
  save = () => localStorage.setItem(key, JSON.stringify(state));
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
  const empty = '<div class="empty-state"><b>Your workspace is clear.</b><small>Add a task when you are ready to begin.</small></div>';
  q("#taskList").innerHTML = x || empty;
  q("#plannerTasks").innerHTML = x || empty;
  q("#plannerCount").textContent = state.tasks.filter((t) => !t.done).length;
  q("#completed").textContent = 12 + state.tasks.filter((t) => t.done).length;
  qa(".check").forEach(
    (b) =>
      (b.onclick = () => {
        let t = state.tasks.find((x) => x.id == b.dataset.id);
        t.done = !t.done;
        save();
        tasks();
      }),
  );
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
        q("#focused").innerHTML = state.focus + "m<small>Focused today</small>";
        save();
        alert("Focus session complete. Great work!");
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
q("#flash").onclick = () => {
  let x = q("#cardText");
  x.textContent = x.textContent.startsWith("What")
    ? "Mitochondria generate most of the cell’s ATP energy."
    : "What is the powerhouse of the cell?";
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
for (let i = 1; i < 32; i++)
  c +=
    '<div class="day"><b>' +
    i +
    "</b>" +
    (i == 11
      ? '<div class="event">Lab report due</div>'
      : i == 16
        ? '<div class="event">History quiz</div>'
        : i == 23
          ? '<div class="event">Biology midterm</div>'
          : "") +
    "</div>";
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
tasks();
show();
