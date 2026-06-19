import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://ksoqkpzjdjoglnfflfui.supabase.co";
const SUPABASE_KEY = "sb_publishable_4d_svQaLP_NzQ3KV3Qy20Q_KQzwuL_C";

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
  const { data } = await supabase
    .from("reactions")
    .select("*")
    .eq("id", reactionId)
    .single();

  const arr = data?.counts || [0,0,0,0,0,0];

  counts.forEach((c, i) => c.textContent = arr[i]);

  buttons.forEach((btn, i) => {
    if (localStorage.getItem(`${localKey}_${i}`)) {
      btn.classList.add("clicked");
      btn.style.opacity = ".4";
    }
  });
}


// ------------------------------
// WYSYŁANIE REAKCJI
// ------------------------------
async function sendReaction(index, btn) {

  if (localStorage.getItem(`${localKey}_${index}`)) return;

  let { data, error } = await supabase
    .from("reactions")
    .select("*")
    .eq("id", reactionId)
    .single();

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

  localStorage.setItem(`${localKey}_${index}`, "1");
  btn.classList.add("clicked");
  btn.style.opacity = ".4";

  loadCounts();
}


// ------------------------------
// PODWÓJNE KLIKNIĘCIE + „POTWIERDŹ” + ANULACJA
// ------------------------------
let pending = null;
let timeoutId = null;
let confirmMode = false;

function cancelPending() {
  pending = null;
  confirmMode = false;
  clearTimeout(timeoutId);

  document.querySelectorAll(".confirm-label").forEach(el => el.remove());

  buttons.forEach(b => {
    if (!b.classList.contains("clicked")) {
      b.style.opacity = "1";
    }
  });
}

buttons.forEach(btn => {
  btn.addEventListener("click", e => {
    e.stopPropagation();

    const index = parseInt(btn.dataset.reaction);

    if (btn.classList.contains("clicked")) return;

    // ⭐ DRUGIE KLIKNIĘCIE = POTWIERDZENIE
    if (confirmMode && pending === index) {

      // natychmiast blokujemy wizualnie
      btn.classList.add("clicked");
      btn.style.opacity = ".4";

      cancelPending();
      sendReaction(index, btn);
      return;
    }

    // ⭐ PIERWSZE KLIKNIĘCIE
    pending = index;
    confirmMode = true;

    document.querySelectorAll(".confirm-label").forEach(el => el.remove());

    buttons.forEach(b => {
      if (b !== btn && !b.classList.contains("clicked")) {
        b.style.opacity = "0.3";
      }
    });

    btn.style.opacity = "1";

    const label = document.createElement("div");
    label.className = "confirm-label";
    label.textContent = "potwierdź";
    label.style.color = "white";
    label.style.fontSize = "12px";
    label.style.marginTop = "4px";
    label.style.opacity = "0.8";
    btn.parentElement.appendChild(label);

    clearTimeout(timeoutId);
    timeoutId = setTimeout(cancelPending, 5000);
  });
});

// ⭐ ANULACJA KLIKNIĘCIEM POZA
document.addEventListener("click", e => {
  if (!e.target.closest(".reaction-btn")) {
    cancelPending();
  }
});


// ------------------------------
// START
// ------------------------------
loadCounts();
