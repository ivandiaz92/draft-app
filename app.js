const STORAGE_KEY = "draft-words-v1";

const form = document.getElementById("add-form");
const input = document.getElementById("word-input");
const list = document.getElementById("word-list");
const emptyState = document.getElementById("empty-state");
const countLabel = document.getElementById("count-label");
const clearBtn = document.getElementById("clear-btn");
const draftBtn = document.getElementById("draft-btn");
const stage = document.querySelector(".stage");
const stageLabel = document.getElementById("stage-label");
const stageWord = document.getElementById("stage-word");

/** @type {string[]} */
let words = loadWords();
let spinning = false;

function loadWords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((w) => typeof w === "string" && w.trim())
      : [];
  } catch {
    return [];
  }
}

function saveWords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

function normalize(value) {
  return value.trim().replace(/\s+/g, " ");
}

function countText(n) {
  return n === 1 ? "1 palabra" : `${n} palabras`;
}

function render() {
  list.innerHTML = "";
  words.forEach((word, index) => {
    const li = document.createElement("li");
    li.className = "pool__item";

    const span = document.createElement("span");
    span.className = "pool__word";
    span.textContent = word;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "pool__remove";
    remove.setAttribute("aria-label", `Eliminar ${word}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => removeWord(index, li));

    li.append(span, remove);
    list.appendChild(li);
  });

  const hasWords = words.length > 0;
  emptyState.hidden = hasWords;
  clearBtn.hidden = !hasWords;
  draftBtn.disabled = !hasWords || spinning;
  countLabel.textContent = countText(words.length);
}

function addWord(value) {
  const word = normalize(value);
  if (!word) return;

  const exists = words.some((w) => w.toLowerCase() === word.toLowerCase());
  if (exists) {
    input.value = "";
    input.focus();
    return;
  }

  words.push(word);
  saveWords();
  render();
  input.value = "";
  input.focus();

  if (stage.classList.contains("is-revealed")) {
    resetStage();
  }
}

function removeWord(index, element) {
  if (spinning) return;
  element.classList.add("is-leaving");
  window.setTimeout(() => {
    words.splice(index, 1);
    saveWords();
    render();
    if (!words.length) resetStage();
  }, 200);
}

function clearWords() {
  if (spinning || !words.length) return;
  words = [];
  saveWords();
  render();
  resetStage();
  input.focus();
}

function resetStage() {
  stage.classList.remove("is-spinning", "is-revealed");
  stageLabel.textContent = "Listo para elegir";
  stageWord.textContent = "—";
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function runDraft() {
  if (spinning || words.length === 0) return;

  spinning = true;
  draftBtn.disabled = true;
  draftBtn.classList.add("is-busy");
  stage.classList.remove("is-revealed");
  stage.classList.add("is-spinning");
  stageLabel.textContent = "Eligiendo";

  const winner = pickRandom(words);
  const ticks = Math.min(18, 8 + words.length * 2);

  for (let i = 0; i < ticks; i += 1) {
    stageWord.textContent = pickRandom(words);
    const progress = i / ticks;
    await sleep(35 + progress * progress * 120);
  }

  stage.classList.remove("is-spinning");
  stage.classList.add("is-revealed");
  stageLabel.textContent = "Seleccionada";
  stageWord.textContent = winner;

  spinning = false;
  draftBtn.classList.remove("is-busy");
  draftBtn.disabled = words.length === 0;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  addWord(input.value);
});

clearBtn.addEventListener("click", clearWords);
draftBtn.addEventListener("click", runDraft);

render();
input.focus();
