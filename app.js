let db;
let currentUser;
let data = { courses: [], assignments: [] };
let isSignUpMode = false;

const $ = id => document.getElementById(id);
const today = () => new Date().toISOString().split("T")[0];
function futureDate(days) { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().split("T")[0]; }
function formatDate(value) { return new Date(value + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c])); }
function showError(message) { $("errorMessage").textContent = message; $("errorMessage").classList.remove("hidden"); }
function clearError() { $("errorMessage").classList.add("hidden"); }
function isOverdue(a) { return a.status !== "Completed" && a.dueDate < today(); }
function isDueToday(a) { return a.status !== "Completed" && a.dueDate === today(); }

async function initializeBackend() {
  if (!window.SUPABASE_URL || window.SUPABASE_URL.startsWith("PASTE_") || !window.SUPABASE_PUBLISHABLE_KEY || window.SUPABASE_PUBLISHABLE_KEY.startsWith("PASTE_")) {
    throw new Error("Add your Supabase Project URL and publishable key to supabase-config.js.");
  }
  db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY);
  const { data: sessionData, error } = await db.auth.getSession();
  if (error) throw error;
  if (!sessionData.session) {
    showAuth();
    return;
  }
  await showApp(sessionData.session.user);
}

function showAuth() {
  currentUser = null;
  data = { courses: [], assignments: [] };
  $("authView").classList.remove("hidden");
  $("sidebar").classList.add("hidden");
  $("appMain").classList.add("hidden");
  $("authForm").reset();
}

async function showApp(user) {
  currentUser = user;
  $("authView").classList.add("hidden");
  $("sidebar").classList.remove("hidden");
  $("appMain").classList.remove("hidden");
  $("userEmail").textContent = user.email || "Signed in";
  $("connectionStatus").textContent = "Connected to Supabase. Your planner is saved online.";
  await loadData();
}

function showAuthMessage(message, isError = false) {
  $("authMessage").textContent = message;
  $("authMessage").classList.remove("hidden", "error");
  if (isError) $("authMessage").classList.add("error");
}

$("authSwitch").onclick = () => {
  isSignUpMode = !isSignUpMode;
  $("authTitle").textContent = isSignUpMode ? "Create your account" : "Welcome back";
  $("authSubtitle").textContent = isSignUpMode ? "Sign up to start planning your schoolwork." : "Sign in to access your study planner.";
  $("authSubmit").textContent = isSignUpMode ? "Sign Up" : "Sign In";
  $("authSwitch").textContent = isSignUpMode ? "Already have an account? Sign in" : "Need an account? Sign up";
  $("authMessage").classList.add("hidden");
};

$("authForm").onsubmit = async event => {
  event.preventDefault();
  $("authSubmit").disabled = true;
  $("authMessage").classList.add("hidden");
  const credentials = { email: $("email").value.trim(), password: $("password").value };
  try {
    if (isSignUpMode) {
      const { data: authData, error } = await db.auth.signUp(credentials);
      if (error) throw error;
      if (authData.session) await showApp(authData.user);
      else showAuthMessage("Account created. Check your email, then return here to sign in.");
    } else {
      const { data: authData, error } = await db.auth.signInWithPassword(credentials);
      if (error) throw error;
      await showApp(authData.user);
    }
  } catch (error) {
    showAuthMessage(error.message, true);
  } finally {
    $("authSubmit").disabled = false;
  }
};

$("signOutBtn").onclick = async () => {
  const { error } = await db.auth.signOut();
  if (error) return showError(error.message);
  showAuth();
};

async function loadData() {
  clearError();
  const [coursesResult, assignmentsResult] = await Promise.all([
    db.from("courses").select("id,name").order("created_at"),
    db.from("assignments").select("id,title,description,due_date,priority,status,course_id,courses(name)").order("due_date")
  ]);
  if (coursesResult.error) throw coursesResult.error;
  if (assignmentsResult.error) throw assignmentsResult.error;
  data.courses = coursesResult.data;
  data.assignments = assignmentsResult.data.map(a => ({
    id: a.id, title: a.title, description: a.description, dueDate: a.due_date,
    priority: a.priority, status: a.status, courseId: a.course_id,
    course: a.courses?.name || "Unknown course"
  }));
  renderAll();
}

function assignmentHTML(a) {
  const due = isOverdue(a) ? " • OVERDUE" : isDueToday(a) ? " • DUE TODAY" : "";
  return `<div class="assignment"><div class="assignment-info ${a.status === "Completed" ? "done" : ""}"><div class="assignment-title">${escapeHTML(a.title)}</div><div class="assignment-meta">${escapeHTML(a.course)} • Due ${formatDate(a.dueDate)}${due}</div></div><span class="badge ${a.priority.toLowerCase()}">${a.priority}</span><div class="actions"><button onclick="toggleAssignment(${a.id})">${a.status === "Completed" ? "↩" : "✓"}</button><button onclick="editAssignment(${a.id})">✏️</button><button class="delete" onclick="deleteAssignment(${a.id})">🗑</button></div></div>`;
}

function renderDashboard() {
  $("totalCount").textContent = data.assignments.length;
  $("completedCount").textContent = data.assignments.filter(a => a.status === "Completed").length;
  $("dueCount").textContent = data.assignments.filter(isDueToday).length;
  $("overdueCount").textContent = data.assignments.filter(isOverdue).length;
  const upcoming = [...data.assignments].filter(a => a.status !== "Completed").sort((a,b) => a.dueDate.localeCompare(b.dueDate)).slice(0,5);
  $("upcomingList").innerHTML = upcoming.length ? upcoming.map(assignmentHTML).join("") : '<div class="empty">No upcoming assignments. Great job! 🎉</div>';
}
function renderAssignments() {
  const search = $("searchInput").value.toLowerCase(), priority = $("filterPriority").value, status = $("filterStatus").value;
  const filtered = data.assignments.filter(a => (a.title.toLowerCase().includes(search) || a.course.toLowerCase().includes(search)) && (priority === "all" || a.priority === priority) && (status === "all" || a.status === status));
  $("assignmentList").innerHTML = filtered.length ? filtered.map(assignmentHTML).join("") : '<div class="empty">No assignments found.</div>';
}
function renderCourses() {
  $("courseList").innerHTML = data.courses.length ? data.courses.map(c => `<div class="course-row"><strong>📖 ${escapeHTML(c.name)}</strong><span>${data.assignments.filter(a => a.courseId === c.id).length} assignments</span></div>`).join("") : '<div class="empty">No courses yet.</div>';
  $("course").innerHTML = data.courses.map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join("");
}
function renderAll() { renderDashboard(); renderAssignments(); renderCourses(); }
function showView(view) { document.querySelectorAll(".view").forEach(v => v.classList.add("hidden")); $(view + "View").classList.remove("hidden"); document.querySelectorAll(".nav").forEach(n => n.classList.remove("active")); document.querySelector(`.nav[data-view="${view}"]`).classList.add("active"); $("pageTitle").textContent = ({dashboard:"Dashboard",assignments:"Assignments",courses:"Courses",settings:"Settings"})[view]; }
function openAssignmentModal(id = null) {
  if (!data.courses.length) { showError("Add a course before adding an assignment."); showView("courses"); return; }
  const form = $("assignmentForm"); form.dataset.editId = id || "";
  if (id) { const a = data.assignments.find(x => x.id === id); $("modalTitle").textContent = "Edit Assignment"; $("title").value = a.title; $("course").value = a.courseId; $("description").value = a.description; $("dueDate").value = a.dueDate; $("priority").value = a.priority; }
  else { $("modalTitle").textContent = "Add Assignment"; form.reset(); $("dueDate").value = futureDate(1); $("priority").value = "Medium"; }
  $("assignmentModal").classList.remove("hidden");
}

document.querySelectorAll(".nav").forEach(b => b.onclick = () => showView(b.dataset.view));
$("addBtn").onclick = () => openAssignmentModal(); $("seeAllBtn").onclick = () => showView("assignments"); $("closeModal").onclick = () => $("assignmentModal").classList.add("hidden");
$("searchInput").oninput = renderAssignments; $("filterPriority").onchange = renderAssignments; $("filterStatus").onchange = renderAssignments;
$("addCourseBtn").onclick = () => $("courseModal").classList.remove("hidden"); $("closeCourseModal").onclick = () => $("courseModal").classList.add("hidden");

$("assignmentForm").onsubmit = async e => {
  e.preventDefault(); clearError();
  try {
    const id = Number(e.target.dataset.editId);
    const values = { user_id: currentUser.id, title: $("title").value.trim(), course_id: Number($("course").value), description: $("description").value.trim(), due_date: $("dueDate").value, priority: $("priority").value };
    const result = id ? await db.from("assignments").update(values).eq("id", id) : await db.from("assignments").insert(values);
    if (result.error) throw result.error;
    $("assignmentModal").classList.add("hidden"); await loadData();
  } catch (error) { showError(error.message); }
};
$("courseForm").onsubmit = async e => {
  e.preventDefault(); clearError();
  try { const { error } = await db.from("courses").insert({ user_id: currentUser.id, name: $("courseName").value.trim() }); if (error) throw error; e.target.reset(); $("courseModal").classList.add("hidden"); await loadData(); } catch (error) { showError(error.message); }
}
window.toggleAssignment = async id => { try { const a = data.assignments.find(x => x.id === id); const { error } = await db.from("assignments").update({ status: a.status === "Completed" ? "Pending" : "Completed" }).eq("id", id); if (error) throw error; await loadData(); } catch (error) { showError(error.message); } };
window.deleteAssignment = async id => { if (!confirm("Delete this assignment?")) return; try { const { error } = await db.from("assignments").delete().eq("id", id); if (error) throw error; await loadData(); } catch (error) { showError(error.message); } };
window.editAssignment = id => openAssignmentModal(id);
$("clearDataBtn").onclick = async () => { if (!confirm("Clear every assignment and course?")) return; try { const first = await db.from("assignments").delete().eq("user_id", currentUser.id); if (first.error) throw first.error; const second = await db.from("courses").delete().eq("user_id", currentUser.id); if (second.error) throw second.error; await loadData(); } catch (error) { showError(error.message); } };
$("dateText").textContent = new Date().toLocaleDateString(undefined, { weekday:"long", month:"long", day:"numeric", year:"numeric" });

initializeBackend().catch(error => { $("connectionStatus").textContent = "Supabase is not connected."; showError(error.message); renderAll(); });
