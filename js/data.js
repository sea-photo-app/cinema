// ============================================
// Firestore Data Layer
// Заменяет localStorage на Firebase Firestore
// Требует: firebase-config.js (загружается раньше)
// ============================================

// ============================================
// MOVIES
// ============================================
async function fbGetMovies() {
  const snap = await db.collection("movies").get();
  return snap.docs.map(d => ({ firebaseId: d.id, ...d.data() }));
}
// Сортировка по дате/времени выполняется на клиенте — не требует составного индекса Firestore
function sortMoviesBySchedule(movies) {
  return movies.slice().sort((a, b) =>
    new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
  );
}

async function fbAddMovie(movie) {
  const ref = await db.collection("movies").add(movie);
  return ref.id;
}

async function fbDeleteMovie(firebaseId) {
  await db.collection("movies").doc(firebaseId).delete();
}

// ============================================
// BOOKINGS
// ============================================
async function fbGetBookings() {
  const snap = await db.collection("bookings").get();
  return snap.docs.map(d => ({ firebaseId: d.id, ...d.data() }));
}

async function fbAddBooking(booking) {
  const ref = await db.collection("bookings").add(booking);
  return ref.id;
}

async function fbUpdateBooking(firebaseId, data) {
  await db.collection("bookings").doc(firebaseId).update(data);
}

async function fbDeleteBooking(firebaseId) {
  await db.collection("bookings").doc(firebaseId).delete();
}

// ============================================
// ANNOUNCEMENTS
// ============================================
async function fbGetAnnouncements() {
  const snap = await db.collection("announcements").get();
  const items = snap.docs.map(d => ({ firebaseId: d.id, ...d.data() }));
  return items.sort((a, b) => (b.id || 0) - (a.id || 0));
}

async function fbAddAnnouncement(announcement) {
  await db.collection("announcements").add(announcement);
}

async function fbDeleteAnnouncement(firebaseId) {
  await db.collection("announcements").doc(firebaseId).delete();
}

// ============================================
// EMPLOYEES
// ============================================
async function fbGetEmployees() {
  const snap = await db.collection("employees").get();
  return snap.docs.map(d => ({ firebaseId: d.id, ...d.data() }));
}

async function fbAddEmployee(employee) {
  await db.collection("employees").add(employee);
}

async function fbUpdateEmployee(firebaseId, data) {
  await db.collection("employees").doc(firebaseId).update(data);
}

async function fbDeleteEmployee(firebaseId) {
  await db.collection("employees").doc(firebaseId).delete();
}

// ============================================
// SITE CONTENT (один документ)
// ============================================
const SITE_CONTENT_ID = "main";

async function fbGetSiteContent() {
  const snap = await db.collection("siteContent").doc(SITE_CONTENT_ID).get();
  if (!snap.exists) {
    await db.collection("siteContent").doc(SITE_CONTENT_ID).set(DEFAULT_CONTENT);
    return { ...DEFAULT_CONTENT };
  }
  return { ...DEFAULT_CONTENT, ...snap.data() };
}

async function fbSaveSiteContent(data) {
  await db.collection("siteContent").doc(SITE_CONTENT_ID).set(data);
}

// ============================================
// DAILY REPORTS
// ============================================
async function fbGetDailyReports() {
  const snap = await db.collection("dailyReports").orderBy("date", "desc").get();
  return snap.docs.map(d => ({ firebaseId: d.id, ...d.data() }));
}

async function fbAddDailyReport(report) {
  await db.collection("dailyReports").add(report);
}

async function fbUpdateDailyReport(firebaseId, data) {
  await db.collection("dailyReports").doc(firebaseId).update(data);
}

async function fbDeleteDailyReport(firebaseId) {
  await db.collection("dailyReports").doc(firebaseId).delete();
}
