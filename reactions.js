import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://wjspjyqqsepcxnmjbxbp.supabase.co";
const SUPABASE_KEY = "sb_publishable_snjwsTMDLiTgtwTlI_CD7w_8y5z1Q6_";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Pobranie parametrów z URL
const qs = new URLSearchParams(location.search);
const comicKey = qs.get("comic");
const chapter = qs.get("chapter");

// ID rekordu w Supabase
const reactionId = `${comicKey}_${chapter}`;
const localKey = `reacted_${reactionId}`;

// Elementy HTML
const buttons = document.querySelectorAll(".reaction-btn");
const counts = document.querySelectorAll(".reaction-count");


// ------------------------------
// ŁADOWANIE LICZNIKÓW
// ------------------------------
async function loadCounts() {
  const { data, error } = await supabase
    .from("reactions")
    .select("*")
    .eq("id", reactionId)
    .single();

  const arr = data?.counts || [0,0,0,0,0,0];

  // Ustaw liczniki
  counts.forEach((c, i) => c.textContent = arr[i]);

  // Zamroź tylko te guziki, które były kliknięte
  buttons.forEach((btn, i) => {
    if (localStorage.getItem(`${localKey}_${i}`)) {
      btn.classList.add("clicked");
    }
  });
}


// ------------------------------
// WYSYŁANIE REAKCJI
// ------------------------------
async function sendReaction(index, btn) {

  // Blokada per guzik
  if (localStorage.getItem(`${localKey}_${index}`)) return;

  let { data, error } = await supabase
    .from("reactions")
    .select("*")
    .eq("id", reactionId)
    .single();

  // Jeśli brak rekordu → tworzymy
  let arr = data?.counts ? [...data.counts] : [0,0,0,0,0,0];
  arr[index]++;

  if (error && error.code === "PGRST116") {
    await supabase.from("reactions").insert({
      id: reactionId,
      counts: arr
    });
  } else {
    await supabase
      .from("reactions")
      .update({ counts: arr })
      .eq("id", reactionId);
  }

  // Zamrożenie tylko tego jednego guzika
  localStorage.setItem(`${localKey}_${index}`, "1");
  btn.classList.add("clicked");

  loadCounts();
}


// ------------------------------
// OBSŁUGA KLIKNIĘĆ
// ------------------------------
buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    const index = parseInt(btn.dataset.reaction);
    sendReaction(index, btn);
  });
});


// ------------------------------
// START
// ------------------------------
loadCounts();
