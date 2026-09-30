"use strict";



const COMMON_PASSWORDS = new Set([
  "password",
  "passw0rd",
  "123456",
  "1234567",
  "12345678",
  "123456789",
  "1234567890",
  "111111",
  "000000",
  "123123",
  "qwerty",
  "qwertyuiop",
  "azerty",
  "abc123",
  "letmein",
  "welcome",
  "admin",
  "administrator",
  "login",
  "master",
  "monkey",
  "dragon",
  "football",
  "baseball",
  "iloveyou",
  "sunshine",
  "princess",
  "shadow",
  "superman",
  "trustno1",
  "whatever",
  "freedom",
  "starwars",
  "hello",
  "secret",
  "changeme",
  "azertyuiop",
  "motdepasse",
  "soleil",
  "bonjour",
]);

const SEQUENCES = [
  "abcdefghijklmnopqrstuvwxyz",
  "0123456789",
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
  "azertyuiop",
  "qsdfghjklm",
  "wxcvbn",
];

const LEET_MAP = {
  "@": "a",
  4: "a",
  0: "o",
  1: "i",
  3: "e",
  $: "s",
  5: "s",
  7: "t",
  "!": "i",
};


const LEVELS = [
  { max: 36, key: "weak", label: "Weak" },
  { max: 60, key: "medium", label: "Medium" },
  { max: 80, key: "strong", label: "Strong" },
  { max: Infinity, key: "very-strong", label: "Very Strong" },
];

const BITS_FOR_FULL_BAR = 80;
const GUESSES_PER_SECOND = 1e10; 
const GENERATED_LENGTH = 16;

const CHARSETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  number: "0123456789",
  symbol: "!@#$%^&*()-_=+[]{};:,.<>?",
};


function getChecks(pw) {
  return {
    length: pw.length >= 8,
    lowercase: /[a-z]/.test(pw),
    uppercase: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^a-zA-Z0-9]/.test(pw),
  };
}

function getPoolSize(checks) {
  let pool = 0;
  if (checks.lowercase) pool += 26;
  if (checks.uppercase) pool += 26;
  if (checks.number) pool += 10;
  if (checks.symbol) pool += 33;
  return pool;
}

function deLeet(str) {
  return str.replace(/[@40135$7!]/g, (ch) => LEET_MAP[ch]);
}

function isCommonPassword(pw) {
  const lower = pw.toLowerCase();
  const stripEnds = (s) => s.replace(/^[^a-z]+/, "").replace(/[^a-z]+$/, "");
  const noTrailing = (s) => s.replace(/[^a-z]+$/, "");

  const candidates = [
    lower,
    noTrailing(lower), 
    stripEnds(lower),
    deLeet(lower), 
    noTrailing(deLeet(lower)),
  ];

  return candidates.some((c) => c && COMMON_PASSWORDS.has(c));
}

function countSequences(pw) {
  const lower = pw.toLowerCase();
  let count = 0;

  for (const seq of SEQUENCES) {
    const reversed = [...seq].reverse().join("");
    for (const source of [seq, reversed]) {
      for (let i = 0; i <= source.length - 3; i++) {
        if (lower.includes(source.slice(i, i + 3))) count++;
      }
    }
  }
  return count;
}

function formatCrackTime(bits) {
  let value = Math.pow(2, bits) / GUESSES_PER_SECOND / 2;
  if (value < 1) return "Instantly";

  const steps = [
    ["second", 60],
    ["minute", 60],
    ["hour", 24],
    ["day", 365],
    ["year", Infinity],
  ];

  for (const [name, size] of steps) {
    if (value < size) {
      if (name === "year" && value >= 1e6) return "Millions of years";
      const n = Math.round(value);
      return `${n} ${name}${n === 1 ? "" : "s"}`;
    }
    value /= size;
  }
}

function analyse(pw) {
  const checks = getChecks(pw);
  const length = pw.length;
  const pool = getPoolSize(checks);

  const unique = new Set(pw).size;
  const effectiveLength = unique + (length - unique) * 0.25;

  let bits = effectiveLength * Math.log2(pool);
  let warning = "";

  const sequences = countSequences(pw);
  if (sequences > 0) {
    bits -= Math.min(20, sequences * 4);
    warning = "Avoid sequences like abc, 123 or qwerty.";
  }

  if (length - unique >= 3) {
    warning = warning || "Avoid repeating the same characters.";
  }

  if (isCommonPassword(pw)) {
    bits = Math.min(bits, 10);
    warning = "This is a very common password.";
  }

  bits = Math.max(0, bits);

  const score = Math.min(100, Math.round((bits / BITS_FOR_FULL_BAR) * 100));
  const level = LEVELS.find((l) => bits < l.max);

  return {
    length,
    checks,
    bits,
    score,
    level,
    warning,
    crackTime: formatCrackTime(bits),
  };
}


function randomInt(max) {

  const limit = 256 - (256 % max);
  const buf = new Uint8Array(1);
  let n;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= limit);
  return n % max;
}

function generatePassword(length = GENERATED_LENGTH) {
  const sets = Object.values(CHARSETS);
  const all = sets.join("");

  const chars = sets.map((set) => set[randomInt(set.length)]);
  while (chars.length < length) {
    chars.push(all[randomInt(all.length)]);
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}


const passwordInput = document.getElementById("password");
const toggleButton = document.getElementById("toggle-password");
const iconShow = toggleButton.querySelector(".icon-show");
const iconHide = toggleButton.querySelector(".icon-hide");
const generateButton = document.getElementById("generate");

const wrapper = document.getElementById("analyser");
const bar = document.getElementById("strength-bar");
const statusText = document.getElementById("status");
const lengthInfo = document.getElementById("length-info");
const crackInfo = document.getElementById("crack-info");
const warningInfo = document.getElementById("warning-info");
const checklistItems = document.querySelectorAll("#checklist li");

function render(pw) {

  if (!pw) {
    delete wrapper.dataset.level;
    bar.style.setProperty("--value", "0%");
    bar.setAttribute("aria-valuenow", "0");
    statusText.textContent = "";
    lengthInfo.textContent = "0 Characters";
    crackInfo.textContent = "—";
    warningInfo.textContent = "";
    checklistItems.forEach((li) => li.classList.remove("met"));
    return;
  }

  const result = analyse(pw);

  wrapper.dataset.level = result.level.key;
  bar.style.setProperty("--value", `${result.score}%`);
  bar.setAttribute("aria-valuenow", String(result.score));

  statusText.textContent = result.level.label;
  lengthInfo.textContent = `${result.length} Character${result.length === 1 ? "" : "s"}`;
  crackInfo.textContent = result.crackTime;
  warningInfo.textContent = result.warning;

  checklistItems.forEach((li) => {
    li.classList.toggle("met", result.checks[li.dataset.check]);
  });
}

function setPasswordVisible(visible) {
  passwordInput.type = visible ? "text" : "password";
  toggleButton.setAttribute(
    "aria-label",
    visible ? "Hide password" : "Show password",
  );
  toggleButton.setAttribute("aria-pressed", String(visible));
  iconShow.hidden = visible;
  iconHide.hidden = !visible;
}



passwordInput.addEventListener("input", () => render(passwordInput.value));

toggleButton.addEventListener("click", () => {
  setPasswordVisible(passwordInput.type === "password");
});

generateButton.addEventListener("click", () => {
  passwordInput.value = generatePassword();
  setPasswordVisible(true); 
  render(passwordInput.value);
  passwordInput.focus();
});

render(passwordInput.value);
