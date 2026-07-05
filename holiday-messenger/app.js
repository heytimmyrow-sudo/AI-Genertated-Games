const STORAGE_KEY = "holidayMessengerStateV1";
const SENT_KEY = "holidayMessengerSentV1";
const PUBLIC_APP_URL = "https://heytimmyrow-sudo.github.io/AI-Genertated-Games/holiday-messenger/";

const defaultHolidays = [
  { id: "new-year", name: "New Year's Day", type: "Holiday", rule: { kind: "fixed", month: 1, day: 1 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Happy New Year! Hope this year starts strong." },
  { id: "mlk-day", name: "Martin Luther King Jr. Day", type: "Holiday", rule: { kind: "weekday", month: 1, weekday: 1, nth: 3 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Remembering Martin Luther King Jr. Day today." },
  { id: "valentines", name: "Valentine's Day", type: "Holiday", rule: { kind: "fixed", month: 2, day: 14 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Happy Valentine's Day! Sending love today." },
  { id: "presidents", name: "Presidents' Day", type: "Holiday", rule: { kind: "weekday", month: 2, weekday: 1, nth: 3 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Happy Presidents' Day." },
  { id: "st-patricks", name: "St. Patrick's Day", type: "Holiday", rule: { kind: "fixed", month: 3, day: 17 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Happy St. Patrick's Day!" },
  { id: "easter", name: "Easter", type: "Holiday", rule: { kind: "easter", offset: 0 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Happy Easter! Hope your day is full of joy." },
  { id: "mothers", name: "Mother's Day", type: "Holiday", rule: { kind: "weekday", month: 5, weekday: 0, nth: 2 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Happy Mother's Day! Thank you for everything." },
  { id: "memorial", name: "Memorial Day", type: "Holiday", rule: { kind: "weekday", month: 5, weekday: 1, nth: -1 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Remembering and honoring Memorial Day." },
  { id: "fathers", name: "Father's Day", type: "Holiday", rule: { kind: "weekday", month: 6, weekday: 0, nth: 3 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Happy Father's Day! Hope you have a great day." },
  { id: "juneteenth", name: "Juneteenth", type: "Holiday", rule: { kind: "fixed", month: 6, day: 19 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Honoring Juneteenth today." },
  { id: "independence", name: "Independence Day", type: "Holiday", rule: { kind: "fixed", month: 7, day: 4 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Happy Fourth of July!" },
  { id: "labor", name: "Labor Day", type: "Holiday", rule: { kind: "weekday", month: 9, weekday: 1, nth: 1 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Happy Labor Day! Enjoy the long weekend." },
  { id: "halloween", name: "Halloween", type: "Holiday", rule: { kind: "fixed", month: 10, day: 31 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Happy Halloween! Have fun and stay safe." },
  { id: "veterans", name: "Veterans Day", type: "Holiday", rule: { kind: "fixed", month: 11, day: 11 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Honoring Veterans Day today." },
  { id: "thanksgiving", name: "Thanksgiving", type: "Holiday", rule: { kind: "weekday", month: 11, weekday: 4, nth: 4 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Happy Thanksgiving! Grateful for you." },
  { id: "christmas-eve", name: "Christmas Eve", type: "Holiday", rule: { kind: "fixed", month: 12, day: 24 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Merry Christmas Eve!" },
  { id: "christmas", name: "Christmas Day", type: "Holiday", rule: { kind: "fixed", month: 12, day: 25 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Merry Christmas! Hope your day is wonderful." },
  { id: "new-years-eve", name: "New Year's Eve", type: "Holiday", rule: { kind: "fixed", month: 12, day: 31 }, repeats: "yearly", time: "09:00", leadDays: 0, message: "Happy New Year's Eve! See you next year." }
];

const els = {
  form: document.getElementById("holidayForm"),
  name: document.getElementById("holidayName"),
  date: document.getElementById("holidayDate"),
  type: document.getElementById("holidayType"),
  repeats: document.getElementById("holidayRepeats"),
  time: document.getElementById("holidayTime"),
  lead: document.getElementById("holidayLead"),
  message: document.getElementById("holidayMessage"),
  recipientName: document.getElementById("recipientName"),
  recipientPhone: document.getElementById("recipientPhone"),
  recipientEmail: document.getElementById("recipientEmail"),
  autoNotify: document.getElementById("autoNotify"),
  vibrate: document.getElementById("vibrateToggle"),
  sound: document.getElementById("soundToggle"),
  list: document.getElementById("holidayList"),
  template: document.getElementById("holidayTemplate"),
  status: document.getElementById("notificationStatus"),
  nextName: document.getElementById("nextHolidayName"),
  nextCountdown: document.getElementById("nextCountdown"),
  nextMessage: document.getElementById("nextMessage"),
  enableNotifications: document.getElementById("enableNotifications"),
  sendTest: document.getElementById("sendTest"),
  openLocalApp: document.getElementById("openLocalApp"),
  deliveryStatus: document.getElementById("deliveryStatus"),
  invitePanel: document.getElementById("invitePanel"),
  inviteTitle: document.getElementById("inviteTitle"),
  inviteSummary: document.getElementById("inviteSummary"),
  acceptInvite: document.getElementById("acceptInvite"),
  dismissInvite: document.getElementById("dismissInvite"),
  sendNextNow: document.getElementById("sendNextNow"),
  openSms: document.getElementById("openSms"),
  openEmail: document.getElementById("openEmail"),
  copyLink: document.getElementById("copyLink"),
  exportData: document.getElementById("exportData"),
  importData: document.getElementById("importData"),
  restoreDefaults: document.getElementById("restoreDefaults"),
  clearCustom: document.getElementById("clearCustom"),
  groupName: document.getElementById("groupName"),
  shareScope: document.getElementById("shareScope"),
  shareCount: document.getElementById("shareCount"),
  shareLink: document.getElementById("shareLink"),
  createShareLink: document.getElementById("createShareLink"),
  copyShareLink: document.getElementById("copyShareLink"),
  nativeShareLink: document.getElementById("nativeShareLink"),
  scheduleForm: document.getElementById("scheduleForm"),
  scheduleHoliday: document.getElementById("scheduleHoliday"),
  schedulePhone: document.getElementById("schedulePhone"),
  scheduleDate: document.getElementById("scheduleDate"),
  scheduleTime: document.getElementById("scheduleTime"),
  scheduleMessage: document.getElementById("scheduleMessage"),
  fillNextHoliday: document.getElementById("fillNextHoliday"),
  scheduledCount: document.getElementById("scheduledCount"),
  scheduledList: document.getElementById("scheduledList"),
  scheduledTemplate: document.getElementById("scheduledTemplate")
};

let state = loadState();
let sentLog = loadSentLog();
let activeFilter = "all";
const isFileMode = window.location.protocol === "file:";
let pendingShare = null;

function loadState() {
  const fallback = {
    holidays: defaultHolidays,
    scheduledMessages: [],
    recipient: { name: "", phone: "", email: "" },
    settings: { autoNotify: true, vibrate: true, sound: false }
  };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || !Array.isArray(parsed.holidays)) return fallback;
    return {
      holidays: parsed.holidays,
      scheduledMessages: Array.isArray(parsed.scheduledMessages) ? parsed.scheduledMessages : [],
      recipient: { ...fallback.recipient, ...(parsed.recipient || {}) },
      settings: { ...fallback.settings, ...(parsed.settings || {}) }
    };
  } catch {
    return fallback;
  }
}

function saveState() {
  state.recipient = {
    name: els.recipientName.value.trim(),
    phone: formatPhoneNumber(els.recipientPhone.value),
    email: els.recipientEmail.value.trim()
  };
  state.settings = {
    autoNotify: els.autoNotify.checked,
    vibrate: els.vibrate.checked,
    sound: els.sound.checked
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentShareBaseUrl() {
  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    return new URL(window.location.pathname, window.location.origin).toString();
  }
  return PUBLIC_APP_URL;
}

function loadSentLog() {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSentLog() {
  localStorage.setItem(SENT_KEY, JSON.stringify(sentLog));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateInputValue(date) {
  return dateKey(date);
}

function formatPhoneNumber(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length === 11 && digits.startsWith("1")) {
    const main = digits.slice(1);
    return `1-${main.slice(0, 3)}-${main.slice(3, 6)}-${main.slice(6)}`.replace(/-$/g, "");
  }
  const main = digits.slice(0, 10);
  if (main.length <= 3) return main;
  if (main.length <= 6) return `${main.slice(0, 3)}-${main.slice(3)}`;
  return `${main.slice(0, 3)}-${main.slice(3, 6)}-${main.slice(6)}`;
}

function bindPhoneFormatter(input) {
  input.addEventListener("input", () => {
    input.value = formatPhoneNumber(input.value);
  });
  input.addEventListener("blur", () => {
    input.value = formatPhoneNumber(input.value);
  });
}

function parseDateInput(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function easterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function nthWeekday(year, month, weekday, nth) {
  if (nth === -1) {
    const last = new Date(year, month, 0);
    const delta = (last.getDay() - weekday + 7) % 7;
    last.setDate(last.getDate() - delta);
    return last;
  }
  const first = new Date(year, month - 1, 1);
  const delta = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month - 1, 1 + delta + (nth - 1) * 7);
}

function holidayDateForYear(holiday, year) {
  if (holiday.rule?.kind === "fixed") return new Date(year, holiday.rule.month - 1, holiday.rule.day);
  if (holiday.rule?.kind === "weekday") return nthWeekday(year, holiday.rule.month, holiday.rule.weekday, holiday.rule.nth);
  if (holiday.rule?.kind === "easter") return addDays(easterDate(year), holiday.rule.offset || 0);
  const base = parseDateInput(holiday.date);
  return holiday.repeats === "yearly" ? new Date(year, base.getMonth(), base.getDate()) : base;
}

function withTime(date, time) {
  const [hours, minutes] = (time || "09:00").split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours || 0, minutes || 0, 0, 0);
  return next;
}

function occurrenceFor(holiday, now = new Date()) {
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const occurrences = years
    .map((year) => {
      const holidayDate = holidayDateForYear(holiday, year);
      const notifyAt = withTime(addDays(holidayDate, -Number(holiday.leadDays || 0)), holiday.time);
      return { holiday, holidayDate, notifyAt };
    })
    .filter((entry) => holiday.repeats !== "once" || entry.holidayDate >= startOfDay(now))
    .sort((a, b) => a.notifyAt - b.notifyAt);
  return occurrences.find((entry) => entry.notifyAt >= now) || occurrences[occurrences.length - 1];
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function allUpcoming(now = new Date()) {
  return state.holidays
    .map((holiday) => occurrenceFor(holiday, now))
    .filter(Boolean)
    .sort((a, b) => a.notifyAt - b.notifyAt);
}

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function formatShortDate(date) {
  return {
    month: new Intl.DateTimeFormat(undefined, { month: "short" }).format(date),
    day: new Intl.DateTimeFormat(undefined, { day: "numeric" }).format(date)
  };
}

function timeUntil(date) {
  const ms = Math.max(0, date - new Date());
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function messageFor(entry) {
  const to = state.recipient.name ? ` ${state.recipient.name}` : "";
  return (entry.holiday.message || `Happy ${entry.holiday.name}${to}!`).replaceAll("{name}", state.recipient.name || "there");
}

function updateStatus() {
  if (isFileMode) {
    els.status.textContent = "This file is open directly. Use the local or public website link for real device alerts; Send Test will still show an in-app test.";
    els.openLocalApp.hidden = false;
    return;
  }
  els.openLocalApp.hidden = true;
  if (!("Notification" in window)) {
    els.status.textContent = "This browser does not support device notifications.";
    return;
  }
  if (Notification.permission === "granted") {
    els.status.textContent = "Device alerts are on for this browser.";
  } else if (Notification.permission === "denied") {
    els.status.textContent = "Notifications are blocked in this browser's site settings.";
  } else {
    els.status.textContent = "Device alerts are waiting for permission.";
  }
}

async function requestNotifications() {
  if (isFileMode) {
    showDeliveryStatus("File mode cannot reliably ask for device notification permission. Open the local website version, then tap Allow Device Alerts.", true);
    updateStatus();
    return false;
  }
  if (!("Notification" in window)) {
    updateStatus();
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    updateStatus();
    return permission === "granted";
  } catch {
    els.status.textContent = "This browser could not open the notification permission prompt.";
    return false;
  }
}

async function notify(entry, isTest = false) {
  saveState();
  if (state.settings.sound) playSoftSound();
  if (state.settings.vibrate && navigator.vibrate) navigator.vibrate([120, 60, 120]);

  const title = isTest ? "Holiday Messenger test" : entry.holiday.name;
  const body = isTest ? "Your computer or phone can receive alerts from this website." : messageFor(entry);
  showDeliveryStatus(`${title}: ${body}${isFileMode ? " File mode preview only." : ""}`, isFileMode);

  if (!state.settings.autoNotify) return;
  if (isFileMode) return;
  if (!("Notification" in window)) {
    showDeliveryStatus("This browser does not support system notifications, so I showed the message in the app instead.", true);
    return;
  }
  if (Notification.permission !== "granted") {
    const allowed = await requestNotifications();
    if (!allowed) {
      showDeliveryStatus("Notification permission was not granted, so I showed the message in the app instead.", true);
      return;
    }
  }

  try {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        tag: isTest ? "holiday-test" : `${entry.holiday.id}-${dateKey(entry.notifyAt)}`,
        icon: "./assets/holiday-messenger-hero.png",
        badge: "./assets/holiday-messenger-hero.png"
      });
    } else {
      new Notification(title, { body });
    }
  } catch {
    new Notification(title, { body });
  }
}

function showDeliveryStatus(message, warning = false) {
  els.deliveryStatus.textContent = message;
  els.deliveryStatus.classList.add("active");
  els.deliveryStatus.classList.toggle("warning", warning);
}

function playSoftSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = "sine";
  osc.frequency.value = 660;
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);
  osc.connect(gain).connect(context.destination);
  osc.start();
  osc.stop(context.currentTime + 0.5);
}

function openSmsDraft(entry) {
  saveState();
  const text = encodeURIComponent(messageFor(entry));
  const phone = state.recipient.phone.replace(/[^\d+]/g, "");
  window.location.href = phone ? `sms:${phone}?&body=${text}` : `sms:?&body=${text}`;
}

function openPhoneSmsDraft(phoneNumber, message) {
  const text = encodeURIComponent(message);
  const phone = phoneNumber.replace(/[^\d+]/g, "");
  window.location.href = phone ? `sms:${phone}?&body=${text}` : `sms:?&body=${text}`;
}

function openEmailDraft(entry) {
  saveState();
  const subject = encodeURIComponent(entry.holiday.name);
  const body = encodeURIComponent(messageFor(entry));
  const email = state.recipient.email.trim();
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}

function renderNext() {
  const [next] = allUpcoming();
  if (!next) {
    els.nextName.textContent = "No holidays saved";
    els.nextCountdown.textContent = "--";
    els.nextMessage.textContent = "Add a holiday or restore the default list.";
    return;
  }
  els.nextName.textContent = next.holiday.name;
  els.nextCountdown.textContent = timeUntil(next.notifyAt);
  els.nextMessage.textContent = `${messageFor(next)} Alert: ${formatDate(next.notifyAt)}. Holiday date: ${formatDate(next.holidayDate)}.`;
}

function renderList() {
  els.list.innerHTML = "";
  const upcoming = allUpcoming();
  const filtered = upcoming.filter((entry) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "custom") return entry.holiday.custom;
    return entry.holiday.type === activeFilter;
  });

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "notice";
    empty.textContent = "No holidays match this filter.";
    els.list.append(empty);
    return;
  }

  for (const entry of filtered) {
    const clone = els.template.content.firstElementChild.cloneNode(true);
    const short = formatShortDate(entry.holidayDate);
    clone.querySelector(".month").textContent = short.month;
    clone.querySelector(".day").textContent = short.day;
    clone.querySelector("h3").textContent = entry.holiday.name;
    clone.querySelector(".type-pill").textContent = entry.holiday.custom ? `${entry.holiday.type} custom` : entry.holiday.type;
    clone.querySelector(".holiday-card-meta").textContent = `Holiday: ${formatDate(entry.holidayDate)} | Alert: ${formatDate(entry.notifyAt)} at ${entry.holiday.time || "09:00"}`;
    clone.querySelector(".holiday-card-message").textContent = messageFor(entry);
    clone.querySelector(".send-button").addEventListener("click", () => notify(entry));
    clone.querySelector(".delete-button").addEventListener("click", () => deleteHoliday(entry.holiday.id));
    els.list.append(clone);
  }
}

function render() {
  saveState();
  renderScheduleHolidayOptions();
  renderNext();
  renderList();
  renderScheduledMessages();
  renderShareCount();
  updateStatus();
}

function deleteHoliday(id) {
  state.holidays = state.holidays.filter((holiday) => holiday.id !== id);
  render();
}

function addHoliday(event) {
  event.preventDefault();
  const name = els.name.value.trim();
  const date = els.date.value;
  if (!name || !date) return;
  state.holidays.push({
    id: `custom-${Date.now()}`,
    name,
    type: els.type.value,
    date,
    repeats: els.repeats.value,
    time: els.time.value || "09:00",
    leadDays: Number(els.lead.value || 0),
    message: els.message.value.trim() || `Happy ${name}!`,
    custom: true
  });
  els.form.reset();
  els.time.value = "09:00";
  els.lead.value = "0";
  els.repeats.value = "yearly";
  render();
}

function getScheduleSendDate(schedule) {
  return new Date(`${schedule.date}T${schedule.time || "09:00"}`);
}

function scheduleStatus(schedule, now = new Date()) {
  if (schedule.sentAt) return "Sent";
  return getScheduleSendDate(schedule) <= now ? "Due now" : "Scheduled";
}

function fillScheduleFromEntry(entry) {
  if (!entry) return;
  els.scheduleHoliday.value = entry.holiday.id;
  els.scheduleDate.value = dateInputValue(entry.notifyAt);
  els.scheduleTime.value = entry.holiday.time || "09:00";
  els.scheduleMessage.value = messageFor(entry);
  if (!els.schedulePhone.value && state.recipient.phone) {
    els.schedulePhone.value = state.recipient.phone;
  }
}

function fillScheduleFromSelectedHoliday() {
  const selected = els.scheduleHoliday.value;
  const entry = allUpcoming().find((item) => item.holiday.id === selected) || allUpcoming()[0];
  fillScheduleFromEntry(entry);
}

function addScheduledMessage(event) {
  event.preventDefault();
  const phone = formatPhoneNumber(els.schedulePhone.value);
  const date = els.scheduleDate.value;
  const time = els.scheduleTime.value || "09:00";
  const message = els.scheduleMessage.value.trim();
  const selectedEntry = allUpcoming().find((entry) => entry.holiday.id === els.scheduleHoliday.value);
  if (!phone || !date || !time || !message) return;

  state.scheduledMessages.push({
    id: `scheduled-${Date.now()}`,
    holidayId: selectedEntry?.holiday.id || "",
    holidayName: selectedEntry?.holiday.name || "Custom message",
    phone,
    date,
    time,
    message,
    createdAt: new Date().toISOString(),
    remindedAt: ""
  });

  els.scheduleForm.reset();
  els.scheduleTime.value = "09:00";
  fillScheduleFromEntry(allUpcoming()[0]);
  render();
  showDeliveryStatus("Phone message scheduled. Keep this site open or installed so it can remind you.");
}

function renderScheduleHolidayOptions() {
  const selected = els.scheduleHoliday.value;
  const upcoming = allUpcoming();
  els.scheduleHoliday.innerHTML = "";
  upcoming.slice(0, 30).forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.holiday.id;
    option.textContent = `${entry.holiday.name} - ${formatDate(entry.holidayDate)}`;
    els.scheduleHoliday.append(option);
  });
  const customOption = document.createElement("option");
  customOption.value = "";
  customOption.textContent = "Custom date/message";
  els.scheduleHoliday.append(customOption);
  if ([...els.scheduleHoliday.options].some((option) => option.value === selected)) {
    els.scheduleHoliday.value = selected;
  }
}

function renderScheduledMessages() {
  const schedules = [...state.scheduledMessages].sort((a, b) => getScheduleSendDate(a) - getScheduleSendDate(b));
  const activeCount = schedules.filter((schedule) => !schedule.sentAt).length;
  els.scheduledCount.textContent = `${activeCount} scheduled`;
  els.scheduledList.innerHTML = "";

  if (!schedules.length) {
    const empty = document.createElement("p");
    empty.className = "notice";
    empty.textContent = "No phone messages scheduled yet.";
    els.scheduledList.append(empty);
    return;
  }

  schedules.forEach((schedule) => {
    const clone = els.scheduledTemplate.content.firstElementChild.cloneNode(true);
    const status = scheduleStatus(schedule);
    clone.classList.toggle("is-due", status === "Due now");
    clone.classList.toggle("is-sent", status === "Sent");
    clone.querySelector("h3").textContent = schedule.holidayName || "Scheduled message";
    clone.querySelector(".type-pill").textContent = status;
    clone.querySelector(".holiday-card-meta").textContent = `To ${schedule.phone} | ${formatDateTime(getScheduleSendDate(schedule))}`;
    clone.querySelector(".holiday-card-message").textContent = schedule.message;
    clone.querySelector(".sms-now-button").addEventListener("click", () => openScheduledSms(schedule.id));
    clone.querySelector(".done-button").addEventListener("click", () => markScheduleSent(schedule.id));
    clone.querySelector(".delete-schedule-button").addEventListener("click", () => deleteSchedule(schedule.id));
    els.scheduledList.append(clone);
  });
}

function openScheduledSms(id) {
  const schedule = state.scheduledMessages.find((item) => item.id === id);
  if (!schedule) return;
  openPhoneSmsDraft(schedule.phone, schedule.message);
}

function markScheduleSent(id) {
  const schedule = state.scheduledMessages.find((item) => item.id === id);
  if (!schedule) return;
  schedule.sentAt = new Date().toISOString();
  render();
}

function deleteSchedule(id) {
  state.scheduledMessages = state.scheduledMessages.filter((item) => item.id !== id);
  render();
}

function checkDueScheduledMessages() {
  const now = new Date();
  let changed = false;
  state.scheduledMessages.forEach((schedule) => {
    if (schedule.sentAt || schedule.remindedAt) return;
    if (getScheduleSendDate(schedule) > now) return;
    schedule.remindedAt = now.toISOString();
    changed = true;
    showDeliveryStatus(`Phone message due for ${schedule.phone}: ${schedule.message}`);
    notify({
      holiday: {
        id: schedule.id,
        name: "Phone message due",
        message: `Text ${schedule.phone}: ${schedule.message}`
      },
      notifyAt: now,
      holidayDate: now
    });
  });
  if (changed) render();
}

function checkDueReminders() {
  const now = new Date();
  for (const entry of allUpcoming(addDays(now, -1))) {
    const dueWindow = now - entry.notifyAt;
    const key = `${entry.holiday.id}-${dateKey(entry.notifyAt)}-${entry.holiday.time || "09:00"}`;
    if (dueWindow >= 0 && dueWindow < 120000 && !sentLog[key]) {
      sentLog[key] = new Date().toISOString();
      saveSentLog();
      notify(entry);
    }
  }
  renderNext();
}

function exportData() {
  saveState();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "holiday-messenger-list.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function importData(file) {
  if (!file) return;
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.holidays)) return;
  state = {
    holidays: parsed.holidays,
    scheduledMessages: Array.isArray(parsed.scheduledMessages) ? parsed.scheduledMessages : [],
    recipient: { ...state.recipient, ...(parsed.recipient || {}) },
    settings: { ...state.settings, ...(parsed.settings || {}) }
  };
  hydrateFormValues();
  render();
}

async function copyAppLink() {
  const appLink = isFileMode ? PUBLIC_APP_URL : currentShareBaseUrl();
  await copyText(appLink, els.copyLink, "Copy App Link");
}

async function copyText(text, button, resetText) {
  try {
    await navigator.clipboard.writeText(text);
    if (button) button.textContent = "Copied";
  } catch {
    if (els.shareLink.value === text) {
      els.shareLink.focus();
      els.shareLink.select();
    }
    showDeliveryStatus("Copy was blocked by this browser. Select the link field and copy it manually.", true);
    return false;
  } finally {
    if (button && resetText) {
      window.setTimeout(() => {
        button.textContent = resetText;
      }, 1200);
    }
  }
  return true;
}

function shareableHolidays() {
  const scope = els.shareScope.value;
  const source = scope === "custom" ? state.holidays.filter((holiday) => holiday.custom) : state.holidays;
  return source.map((holiday) => ({ ...holiday }));
}

function renderShareCount() {
  const count = shareableHolidays().length;
  els.shareCount.textContent = `${count} ${count === 1 ? "holiday" : "holidays"}`;
}

function encodeSharePayload(payload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeSharePayload(encoded) {
  const normalized = encoded.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function findShareToken() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("share")) return params.get("share");
  if (window.location.hash.startsWith("#share=")) return window.location.hash.slice("#share=".length);
  return "";
}

function createShareLink() {
  saveState();
  const groupName = els.groupName.value.trim() || "Family Group";
  const holidays = shareableHolidays();
  const payload = {
    v: 1,
    groupName,
    createdAt: new Date().toISOString(),
    holidays
  };
  const token = encodeSharePayload(payload);
  const url = new URL(currentShareBaseUrl());
  url.searchParams.set("share", token);
  els.shareLink.value = url.toString();
  els.copyShareLink.disabled = false;
  els.nativeShareLink.disabled = false;
  showDeliveryStatus(`Share link ready for ${groupName}. It includes ${holidays.length} ${holidays.length === 1 ? "holiday" : "holidays"}.`);
}

async function copyShareLink() {
  if (!els.shareLink.value) createShareLink();
  await copyText(els.shareLink.value, els.copyShareLink, "Copy");
}

async function nativeShareLink() {
  if (!els.shareLink.value) createShareLink();
  const title = `${els.groupName.value.trim() || "Family Group"} Holiday Messenger`;
  const text = "Open this Holiday Messenger link to add our shared holidays.";
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: els.shareLink.value });
      showDeliveryStatus("Share sheet opened.");
      return;
    } catch {
      showDeliveryStatus("Share was cancelled or blocked.", true);
    }
  }
  await copyShareLink();
}

function showPendingShare(payload) {
  const holidays = Array.isArray(payload.holidays) ? payload.holidays : [];
  pendingShare = { ...payload, holidays };
  els.inviteTitle.textContent = `${payload.groupName || "Family Group"} invite`;
  els.inviteSummary.textContent = `This link includes ${holidays.length} ${holidays.length === 1 ? "holiday" : "holidays"}. Add them to this browser's calendar when you are ready.`;
  els.invitePanel.hidden = false;
}

function sharedHolidayKey(holiday) {
  if (holiday.rule) return `${holiday.name}|${JSON.stringify(holiday.rule)}`;
  return `${holiday.name}|${holiday.date || ""}`;
}

function acceptPendingShare() {
  if (!pendingShare) return;
  const existingKeys = new Set(state.holidays.map(sharedHolidayKey));
  let added = 0;
  pendingShare.holidays.forEach((holiday, index) => {
    const key = sharedHolidayKey(holiday);
    if (existingKeys.has(key)) return;
    existingKeys.add(key);
    state.holidays.push({
      ...holiday,
      id: `shared-${Date.now()}-${index}`,
      custom: holiday.custom || !holiday.rule,
      shared: true,
      groupName: pendingShare.groupName || "Family Group"
    });
    added += 1;
  });
  els.invitePanel.hidden = true;
  pendingShare = null;
  clearShareFromAddress();
  render();
  showDeliveryStatus(`Added ${added} ${added === 1 ? "holiday" : "holidays"} from the shared group link.`);
}

function dismissPendingShare() {
  els.invitePanel.hidden = true;
  pendingShare = null;
  clearShareFromAddress();
}

function clearShareFromAddress() {
  try {
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("share");
    if (cleanUrl.hash.startsWith("#share=")) cleanUrl.hash = "";
    window.history.replaceState(null, "", cleanUrl.toString());
  } catch {
    // Some file:// contexts do not allow history updates. The invite still works.
  }
}

function loadSharedInviteFromUrl() {
  const token = findShareToken();
  if (!token) return;
  try {
    const payload = decodeSharePayload(token);
    if (!payload || !Array.isArray(payload.holidays)) return;
    showPendingShare(payload);
  } catch {
    showDeliveryStatus("This shared group link could not be opened.", true);
  }
}

function hydrateFormValues() {
  els.date.value = dateInputValue(new Date());
  els.recipientName.value = state.recipient.name || "";
  els.recipientPhone.value = formatPhoneNumber(state.recipient.phone || "");
  els.recipientEmail.value = state.recipient.email || "";
  els.autoNotify.checked = Boolean(state.settings.autoNotify);
  els.vibrate.checked = Boolean(state.settings.vibrate);
  els.sound.checked = Boolean(state.settings.sound);
}

function bindEvents() {
  els.form.addEventListener("submit", addHoliday);
  els.enableNotifications.addEventListener("click", requestNotifications);
  els.sendTest.addEventListener("click", () => {
    const [next] = allUpcoming();
    notify(next || { holiday: { id: "test", name: "Holiday Messenger", message: "" }, notifyAt: new Date(), holidayDate: new Date() }, true);
  });
  els.sendNextNow.addEventListener("click", () => {
    const [next] = allUpcoming();
    if (next) notify(next);
  });
  els.openSms.addEventListener("click", () => {
    const [next] = allUpcoming();
    if (next) openSmsDraft(next);
  });
  els.openEmail.addEventListener("click", () => {
    const [next] = allUpcoming();
    if (next) openEmailDraft(next);
  });
  els.copyLink.addEventListener("click", copyAppLink);
  els.createShareLink.addEventListener("click", createShareLink);
  els.copyShareLink.addEventListener("click", copyShareLink);
  els.nativeShareLink.addEventListener("click", nativeShareLink);
  bindPhoneFormatter(els.recipientPhone);
  bindPhoneFormatter(els.schedulePhone);
  els.scheduleForm.addEventListener("submit", addScheduledMessage);
  els.scheduleHoliday.addEventListener("change", fillScheduleFromSelectedHoliday);
  els.fillNextHoliday.addEventListener("click", () => fillScheduleFromEntry(allUpcoming()[0]));
  els.acceptInvite.addEventListener("click", acceptPendingShare);
  els.dismissInvite.addEventListener("click", dismissPendingShare);
  els.shareScope.addEventListener("change", () => {
    renderShareCount();
    els.shareLink.value = "";
    els.copyShareLink.disabled = true;
    els.nativeShareLink.disabled = true;
  });
  els.exportData.addEventListener("click", exportData);
  els.importData.addEventListener("change", (event) => importData(event.target.files[0]).catch(() => {
    els.status.textContent = "That import file could not be read.";
  }));
  els.restoreDefaults.addEventListener("click", () => {
    const existingIds = new Set(state.holidays.map((holiday) => holiday.id));
    state.holidays = [...state.holidays, ...defaultHolidays.filter((holiday) => !existingIds.has(holiday.id))];
    render();
  });
  els.clearCustom.addEventListener("click", () => {
    state.holidays = state.holidays.filter((holiday) => !holiday.custom);
    render();
  });
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((entry) => entry.classList.toggle("active", entry === button));
      renderList();
    });
  });
  [els.recipientName, els.recipientPhone, els.recipientEmail, els.autoNotify, els.vibrate, els.sound].forEach((control) => {
    control.addEventListener("input", saveState);
    control.addEventListener("change", saveState);
  });
}

if (!isFileMode && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

hydrateFormValues();
bindEvents();
loadSharedInviteFromUrl();
render();
fillScheduleFromEntry(allUpcoming()[0]);
checkDueReminders();
checkDueScheduledMessages();
window.setInterval(() => {
  checkDueReminders();
  checkDueScheduledMessages();
}, 60000);
