const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let soundBuffer = null;

function isAlpha(char) {
  const A_CODE = "A".charCodeAt(0);
  const Z_CODE = "Z".charCodeAt(0);
  const letter = char.toUpperCase();
  return letter.charCodeAt(0) >= A_CODE && letter.charCodeAt(0) <= Z_CODE;
}

async function loadSound() {
  const response = await fetch("public/bulb.mp3");
  const arrayBuffer = await response.arrayBuffer();
  soundBuffer = await audioContext.decodeAudioData(arrayBuffer);
}

function playSound() {
  if (!soundBuffer) {
    return;
  }

  const source = audioContext.createBufferSource();
  source.buffer = soundBuffer;
  source.connect(audioContext.destination);
  source.start();
}

function getRandomColor() {
  const colors = ["#FF0077", "#FF6A00", "#00F5FF", "#00FF00"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomFlickerAnimation() {
  const duration = (Math.random() * 0.9).toFixed(3);
  const delay = (Math.random() * 0.6).toFixed(2);
  const steps = Math.floor(Math.random() * 3) + 1;
  return { duration, delay, steps };
}

function turnBulbsOn(value, duration) {
  const letter = value.toUpperCase();
  if (!isAlpha(letter)) {
    return;
  }

  const letterContainers = document.querySelectorAll(".letter-container");
  letterContainers.forEach((container) => {
    if (container.id === letter.toUpperCase()) {
      const bulb = container.querySelector(".bulb");
      bulb.classList.add("bulb-on");
      playSound();
      setTimeout(() => {
        bulb.classList.remove("bulb-on");
      }, duration);
    }
  });
}

function getRandomRotation() {
  const angle = (Math.random() - 0.5) * 90; // Range: -45 to +45
  return `${angle.toFixed(2)}deg`;
}

function setBulbs() {
  const bulbs = document.querySelectorAll(".bulb");
  bulbs.forEach((bulb, key) => {
    let currentColor = getRandomColor();
    const { duration, delay, steps } = getRandomFlickerAnimation();
    const prevBulb = bulbs[key - 1];
    const prevColor = prevBulb && prevBulb.style.getPropertyValue("--bg");
    while (key !== 0 && prevColor === currentColor) {
      currentColor = getRandomColor();
    }

    const filckerAnimation = `flicker ${duration}s steps(${steps}, end) ${delay}s infinite`;
    bulb.style.setProperty("--bg", currentColor);
    bulb.style.setProperty("--filckerAnimation", filckerAnimation);
    bulb.style.setProperty("--deg", getRandomRotation());
  });
}

function flickerRandomnly() {
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((letter) => {
    turnBulbsOn(letter, 500);
  });
}

function setInput(duration) {
  const input = document.getElementById("letter-input");
  input.addEventListener("input", (event) => {
    const value = event.target.value;
    const letter = value.slice(value.length - 1);
    turnBulbsOn(letter, duration);
  });
}

function toggleSnackbar(toggle, message) {
  const dialog = document.querySelector(".dialog");
  dialog.textContent = message;
  dialog.style.display = toggle ? "block" : "none";
}

function displayTimedSnackbar(message, duration) {
  toggleSnackbar(true, message);
  setTimeout(() => {
    toggleSnackbar(false, message);
  }, duration);
}

function setCopyButton() {
  document.querySelector(".copy-btn").addEventListener("click", () => {
    const input = document.getElementById("letter-input");
    if (input.value) {
      const url = new URL(window.location.href);
      const value = input.value.split("").filter((char) => {
        return isAlpha(char.toUpperCase());
      });
      url.searchParams.set("q", btoa(value.join()));
      navigator.clipboard.writeText(url.toString());
      displayTimedSnackbar("message link copied to clipboard!", 2000);
    }
  });
}

function displayMessage(duration) {
  const params = new URLSearchParams(window.location.search);
  const searchQuery = atob(params.get("q") || "");
  if (!searchQuery) {
    flickerRandomnly();
    return;
  }
  const phrase = searchQuery.split("").filter((v) => v.trim());
  phrase.forEach((letter, idx) => {
    setTimeout(() => {
      turnBulbsOn(letter, duration);
      if (idx === phrase.length - 1) {
        setTimeout(() => {
          flickerRandomnly();
        }, duration);
      }
    }, duration * idx);
  });
}

function bindLettersWithInput(duration) {
  const input = document.getElementById("letter-input");
  document.querySelectorAll(".letter-container").forEach((node) => {
    node.addEventListener("click", () => {
      input.value += node.id;
      turnBulbsOn(node.id, duration);
    });
  });
}

async function init() {
  setBulbs();
  await loadSound("./bulb.mp3");
  toggleSnackbar(true, "click anywhere to start");

  document.addEventListener(
    "click",
    () => {
      const DURATION = 1000;
      toggleSnackbar(false);
      setInput(DURATION);
      setCopyButton();
      bindLettersWithInput(DURATION);
      displayMessage(DURATION);
    },
    { once: true }
  );
}

init();
