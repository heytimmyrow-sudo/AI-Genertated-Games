const STORAGE_KEY = "codex-threadmail-state";

const seedThreads = [
  {
    id: "t1",
    from: "Ari Control",
    subject: "Launch checklist for the new hub tile",
    body: "The missing file should live under games/threadmail.html and the launcher card needs to point there.\n\nOnce it opens cleanly from the hub, we can treat this as recovered.",
    time: "Today 2:14 PM",
    unread: true,
    starred: true,
    archived: false,
    tags: ["hub", "launch"]
  },
  {
    id: "t2",
    from: "Mina QA",
    subject: "Quick pass on mobile layout",
    body: "Checked the compact view. The inbox stacks correctly, compose stays reachable, and the thread cards keep enough spacing for taps.",
    time: "Today 1:02 PM",
    unread: true,
    starred: false,
    archived: false,
    tags: ["mobile", "qa"]
  },
  {
    id: "t3",
    from: "Dev Desk",
    subject: "Draft: welcome copy",
    body: "Welcome to Threadmail. This little static app saves its demo state in localStorage, so messages remain after refresh until Reset Demo is pressed.",
    time: "Yesterday",
    unread: false,
    starred: false,
    archived: false,
    tags: ["draft", "local"]
  },
  {
    id: "t4",
    from: "Archive Bot",
    subject: "Old status note",
    body: "This thread starts archived so the Archived filter has something useful to show.",
    time: "May 14",
    unread: false,
    starred: false,
    archived: true,
    tags: ["archive"]
  }
];

let threads = loadThreads();
let activeFilter = "inbox";
let activeQuery = "";
let activeId = threads[0]?.id || null;
let replyToId = null;

const els = {
  inboxCount: document.getElementById("inboxCount"),
  unreadCount: document.getElementById("unreadCount"),
  archivedCount: document.getElementById("archivedCount"),
  visibleCount: document.getElementById("visibleCount"),
  listTitle: document.getElementById("listTitle"),
  threadList: document.getElementById("threadList"),
  emptyState: document.getElementById("emptyState"),
  messageDetail: document.getElementById("messageDetail"),
  detailFrom: document.getElementById("detailFrom"),
  detailSubject: document.getElementById("detailSubject"),
  detailMeta: document.getElementById("detailMeta"),
  detailTags: document.getElementById("detailTags"),
  detailBody: document.getElementById("detailBody"),
  starButton: document.getElementById("starButton"),
  archiveButton: document.getElementById("archiveButton"),
  unreadButton: document.getElementById("unreadButton"),
  deleteButton: document.getElementById("deleteButton"),
  replyButton: document.getElementById("replyButton"),
  composeButton: document.getElementById("composeButton"),
  composePanel: document.getElementById("composePanel"),
  composeForm: document.getElementById("composeForm"),
  composeTitle: document.getElementById("composeTitle"),
  composeTo: document.getElementById("composeTo"),
  composeSubject: document.getElementById("composeSubject"),
  composeBody: document.getElementById("composeBody"),
  closeCompose: document.getElementById("closeCompose"),
  saveDraft: document.getElementById("saveDraft"),
  seedButton: document.getElementById("seedButton"),
  mailSearch: document.getElementById("mailSearch")
};

function loadThreads() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) && saved.length ? saved : structuredClone(seedThreads);
  } catch {
    return structuredClone(seedThreads);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

function currentThread() {
  return threads.find((thread) => thread.id === activeId);
}

function matchesFilter(thread) {
  if (activeFilter === "inbox") return !thread.archived;
  if (activeFilter === "unread") return thread.unread && !thread.archived;
  if (activeFilter === "starred") return thread.starred && !thread.archived;
  if (activeFilter === "archived") return thread.archived;
  return true;
}

function matchesQuery(thread) {
  if (!activeQuery) return true;
  const haystack = [thread.from, thread.subject, thread.body, ...thread.tags].join(" ").toLowerCase();
  return haystack.includes(activeQuery);
}

function visibleThreads() {
  return threads.filter((thread) => matchesFilter(thread) && matchesQuery(thread));
}

function filterLabel() {
  return activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1);
}

function renderStats() {
  els.inboxCount.textContent = String(threads.filter((thread) => !thread.archived).length);
  els.unreadCount.textContent = String(threads.filter((thread) => thread.unread && !thread.archived).length);
  els.archivedCount.textContent = String(threads.filter((thread) => thread.archived).length);
}

function renderList() {
  const list = visibleThreads();
  els.listTitle.textContent = filterLabel();
  els.visibleCount.textContent = `${list.length} ${list.length === 1 ? "thread" : "threads"}`;
  els.threadList.innerHTML = "";

  if (!list.some((thread) => thread.id === activeId)) {
    activeId = list[0]?.id || null;
  }

  for (const thread of list) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `thread-item${thread.unread ? " is-unread" : ""}${thread.id === activeId ? " is-active" : ""}`;
    button.innerHTML = `
      <div class="thread-item__meta">
        <span>${thread.time}</span>
        ${thread.starred ? "<span>Starred</span>" : ""}
        ${thread.unread ? "<span>Unread</span>" : ""}
      </div>
      <h3>${escapeHtml(thread.subject)}</h3>
      <p>${escapeHtml(thread.from)} - ${escapeHtml(thread.body.slice(0, 92))}${thread.body.length > 92 ? "..." : ""}</p>
    `;
    button.addEventListener("click", () => {
      activeId = thread.id;
      thread.unread = false;
      persist();
      render();
    });
    els.threadList.append(button);
  }
}

function renderDetail() {
  const thread = currentThread();
  els.emptyState.hidden = Boolean(thread);
  els.messageDetail.hidden = !thread;
  if (!thread) return;

  els.detailFrom.textContent = thread.from;
  els.detailSubject.textContent = thread.subject;
  els.detailMeta.textContent = `${thread.time} | ${thread.archived ? "Archived" : "Inbox"}`;
  els.detailBody.textContent = thread.body;
  els.detailTags.innerHTML = "";
  for (const tag of thread.tags) {
    const item = document.createElement("span");
    item.textContent = tag;
    els.detailTags.append(item);
  }
  els.starButton.textContent = thread.starred ? "★" : "☆";
  els.archiveButton.textContent = thread.archived ? "Move To Inbox" : "Archive";
  els.unreadButton.textContent = thread.unread ? "Mark Read" : "Mark Unread";
}

function renderFilters() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === activeFilter);
  });
}

function render() {
  renderStats();
  renderFilters();
  renderList();
  renderDetail();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function openCompose(mode = "new") {
  const thread = currentThread();
  replyToId = mode === "reply" ? activeId : null;
  els.composeTitle.textContent = mode === "reply" ? "Reply" : "New Message";
  els.composeTo.value = mode === "reply" && thread ? thread.from : "";
  els.composeSubject.value = mode === "reply" && thread ? `Re: ${thread.subject.replace(/^Re:\s*/i, "")}` : "";
  els.composeBody.value = "";
  els.composePanel.hidden = false;
  els.composeTo.focus();
}

function closeComposePanel() {
  els.composePanel.hidden = true;
  replyToId = null;
}

function addMessage(isDraft = false) {
  const subject = els.composeSubject.value.trim();
  const to = els.composeTo.value.trim();
  const body = els.composeBody.value.trim();
  if (!subject || !to || !body) return;

  const newThread = {
    id: `t${Date.now()}`,
    from: isDraft ? `Draft to ${to}` : `You to ${to}`,
    subject,
    body: replyToId ? `${body}\n\n--- Original thread updated in Threadmail. ---` : body,
    time: isDraft ? "Draft" : "Just now",
    unread: false,
    starred: false,
    archived: false,
    tags: isDraft ? ["draft"] : ["sent"]
  };

  threads.unshift(newThread);
  activeFilter = "inbox";
  activeId = newThread.id;
  persist();
  closeComposePanel();
  render();
}

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    render();
  });
});

els.mailSearch.addEventListener("input", () => {
  activeQuery = els.mailSearch.value.trim().toLowerCase();
  render();
});

els.starButton.addEventListener("click", () => {
  const thread = currentThread();
  if (!thread) return;
  thread.starred = !thread.starred;
  persist();
  render();
});

els.archiveButton.addEventListener("click", () => {
  const thread = currentThread();
  if (!thread) return;
  thread.archived = !thread.archived;
  persist();
  render();
});

els.unreadButton.addEventListener("click", () => {
  const thread = currentThread();
  if (!thread) return;
  thread.unread = !thread.unread;
  persist();
  render();
});

els.deleteButton.addEventListener("click", () => {
  threads = threads.filter((thread) => thread.id !== activeId);
  activeId = visibleThreads()[0]?.id || null;
  persist();
  render();
});

els.replyButton.addEventListener("click", () => openCompose("reply"));
els.composeButton.addEventListener("click", () => openCompose("new"));
els.closeCompose.addEventListener("click", closeComposePanel);
els.saveDraft.addEventListener("click", () => addMessage(true));
els.composeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addMessage(false);
});

els.seedButton.addEventListener("click", () => {
  threads = structuredClone(seedThreads);
  activeFilter = "inbox";
  activeQuery = "";
  activeId = threads[0].id;
  els.mailSearch.value = "";
  persist();
  render();
});

document.addEventListener("keydown", (event) => {
  if (event.target.matches("input, textarea")) return;
  if (event.key.toLowerCase() === "n") openCompose("new");
  if (event.key.toLowerCase() === "r") openCompose("reply");
  if (event.key.toLowerCase() === "a") els.archiveButton.click();
  if (event.key === "Escape") {
    if (!els.composePanel.hidden) {
      closeComposePanel();
      return;
    }
    window.parent.postMessage({ type: "codex-menu-exit" }, window.location.origin);
  }
});

render();
