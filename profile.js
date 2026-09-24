async function loadProfile() {
  if (!currentUser || !db) return;
  const userId = currentUser.id;
  const name = currentUser.user_metadata?.display_name || "Student";
  $("profileGreeting").textContent = name;
  $("profileName").value = currentUser.user_metadata?.display_name || "";
  $("profileEmail").textContent = currentUser.email || "";
  $("profileAvatar").textContent = name.trim().charAt(0).toUpperCase() || "S";
  $("profileJoined").textContent = currentUser.created_at
    ? `Member since ${new Date(currentUser.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}` : "";
  $("profileCompleted").textContent = data.assignments.filter(item => item.status === "Completed").length;
  $("profileHistory").textContent = "Loading your results...";

  const [countResult, bestResult, recentResult] = await Promise.all([
    db.from("quiz_results").select("id", { count: "exact", head: true }).eq("user_id", userId),
    db.from("quiz_results").select("score").eq("user_id", userId).order("score", { ascending: false }).limit(1),
    db.from("quiz_results").select("category,score,total,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5)
  ]);
  if (currentUser?.id !== userId) return;
  if (countResult.error || bestResult.error || recentResult.error) {
    $("profileHistory").textContent = "Could not load quiz results. Check that setup.sql has been run in Supabase.";
    return;
  }
  $("profileRounds").textContent = countResult.count ?? 0;
  $("profileBest").textContent = `${bestResult.data?.[0]?.score ?? 0} / 10`;
  const history = $("profileHistory");
  history.replaceChildren();
  if (!recentResult.data?.length) {
    history.textContent = "No quests played yet. Try one in Study Quest!";
    return;
  }
  for (const result of recentResult.data) {
    const row = document.createElement("div");
    row.className = "profile-history-row";
    const details = document.createElement("div");
    const label = document.createElement("strong");
    label.textContent = `${result.category} Quest`;
    const date = document.createElement("small");
    date.textContent = new Date(result.created_at).toLocaleDateString();
    details.append(label, date);
    const scoreLabel = document.createElement("b");
    scoreLabel.textContent = `${result.score} / ${result.total}`;
    row.append(details, scoreLabel);
    history.append(row);
  }
}

$("profileForm").addEventListener("submit", async event => {
  event.preventDefault();
  const name = $("profileName").value.trim();
  if (!name || !db || !currentUser) return;
  const button = $("saveProfileBtn");
  button.disabled = true;
  $("profileMessage").textContent = "Saving...";
  try {
    const { data: updated, error } = await db.auth.updateUser({ data: { display_name: name } });
    if (error) throw error;
    currentUser = updated.user;
    $("profileGreeting").textContent = name;
    $("profileAvatar").textContent = name.charAt(0).toUpperCase();
    $("profileMessage").textContent = "Profile saved.";
  } catch (error) {
    $("profileMessage").textContent = `Could not save profile: ${error.message}`;
  } finally {
    button.disabled = false;
  }
});
