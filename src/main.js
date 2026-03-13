import { faces } from "./data/faces";

const app = document.getElementById("app");

// --- Simple Router ---
function router() {
  const route = window.location.hash.replace("#", "");
  if (route.startsWith("/game")) {
    const cat = route.split("?cat=")[1];
    renderGame(cat);
  } else if (route === "/dashboard") {
    renderDashboard();
  } else {
    renderCategorySelect();
  }
}
window.addEventListener("hashchange", router);
router();

// --- Pages ---
function renderCategorySelect() {
  // app.innerHTML = `
  // <h1>Select a Category</h1>
  // <button onclick="window.location.hash='/dashboard'">Dashboard</button>
  // `;
  app.innerHTML = `
        <img
        src="/face-guess.svg"
        alt="Face Guess"
        width="100px"
        height="100px"
      />
  <button onclick="window.location.hash='/dashboard'">Dashboard</button>
  `;
  const categories = ["science", "movies", "music", "history", "sports"];
  categories.forEach((cat) => {
    const btn = document.createElement("button");

    btn.textContent = cat;
    btn.onclick = () => {
      const today = new Date().toDateString();
      const lastPlayed = localStorage.getItem("lastPlayed");
      if (lastPlayed === today) {
        alert("You already played today's game! Come back tomorrow.");
        window.location.hash = "/dashboard";
      } else {
        window.location.hash = `/game?cat=${cat}`;
      }
    };
    app.appendChild(btn);
  });
}

function renderGame(category) {
  app.innerHTML = `<h2>${category.toUpperCase()} Challenge</h2>`;

  // Pick one random face per day per category
  const today = new Date().toDateString();
  const key = `daily-${category}-${today}`;
  let data = localStorage.getItem(key);
  if (data) {
    data = JSON.parse(data);
    //console.log("data", data.article);
  } else {
    const options = faces[category];
    const randomFace = options[Math.floor(Math.random() * options.length)];
    data = randomFace;
    // console.log("randomFacedata", data.article);
    localStorage.setItem(key, JSON.stringify(randomFace));
  }

  let guessesLeft = 4;
  let filterLevel = 0;
  const filters = [
    "blur(20px) grayscale(100%)",
    "blur(15px) grayscale(80%)",
    "blur(10px) grayscale(60%)",
    "blur(6px) grayscale(40%)",
    "blur(3px) grayscale(20%)",
    "none",
  ];

  const img = document.createElement("img");
  img.src = data.img;
  // console.log("ImgSrc ", img.src);
  img.style.height = "300px";
  img.style.filter = filters[filterLevel];
  app.appendChild(img);

  const input = document.createElement("input");
  input.placeholder = "Enter name guess...";
  app.appendChild(input);

  const guessBtn = document.createElement("button");
  guessBtn.textContent = "Guess";
  guessBtn.classList.add("guessButton");
  app.appendChild(guessBtn);

  const hintRow = document.createElement("div");
  app.appendChild(hintRow);

  const status = document.createElement("p");
  app.appendChild(status);

  data.hints.forEach((hint) => {
    const btn = document.createElement("button");
    btn.textContent = hint.q;
    btn.onclick = () => {
      if (hint.a) {
        if (filterLevel < filters.length - 1) {
          filterLevel++;
          img.style.filter = filters[filterLevel];
        }
        status.textContent = "Correct hint!";
      } else {
        guessesLeft--;
        status.textContent = `Wrong hint. Guesses left: ${guessesLeft}`;
      }
      if (guessesLeft <= 0) {
        endGame(false, data.name, category);
      }
    };
    hintRow.appendChild(btn);
  });

  guessBtn.onclick = () => {
    const val = input.value.trim().toLowerCase();
    if (val.length === 0) {
      alert("Type your guess first!");
    } else if (val === data.name) {
      endGame(true, data.name);
    } else {
      guessesLeft--;
      status.textContent = `Wrong guess. Guesses left: ${guessesLeft}`;
      if (guessesLeft <= 0) {
        endGame(false, data.name, category);
      }
    }
  };

  function endGame(won, answer, category) {
    img.style.filter = "none";
    localStorage.setItem("lastPlayed", today);

    // --- Global streak logic (unchanged) ---
    const lastDay = localStorage.getItem("lastDay");
    const streak = parseInt(localStorage.getItem("streak") || "0", 10);
    if (lastDay !== today) {
      if (
        lastDay &&
        new Date(lastDay).getTime() === new Date(today).getTime() - 86400000
      ) {
        localStorage.setItem("streak", streak + 1);
      } else {
        localStorage.setItem("streak", 1);
      }
      localStorage.setItem("lastDay", today);
    }

    // --- Per-category streak logic (unchanged) ---
    const catKeyDay = `lastDay-${category}`;
    const catKeyStreak = `streak-${category}`;
    const lastCatDay = localStorage.getItem(catKeyDay);
    const catStreak = parseInt(localStorage.getItem(catKeyStreak) || "0", 10);

    if (lastCatDay !== today) {
      if (
        lastCatDay &&
        new Date(lastCatDay).getTime() === new Date(today).getTime() - 86400000
      ) {
        localStorage.setItem(catKeyStreak, catStreak + 1);
      } else {
        localStorage.setItem(catKeyStreak, 1);
      }
      localStorage.setItem(catKeyDay, today);
    }

    // status.textContent = won
    //   ? `You got it! It's ${answer}.`
    //   : `Out of guesses! It's ${answer}.`;

    status.textContent = won ? "You got it! It's " : "Out of guesses! It's ";

    const link = document.createElement("a");
    link.href = data.article;
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer"); // good security practice

    link.textContent = answer;

    status.appendChild(link);
    status.append(".");

    const backBtn = document.createElement("button");
    backBtn.textContent = "Dashboard";
    backBtn.onclick = () => (window.location.hash = "/dashboard");
    app.appendChild(backBtn);

    // 🎉 Trigger confetti if won
    if (won) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    // Share button
    const shareBtn = document.createElement("button");
    shareBtn.textContent = "Share Result";
    shareBtn.onclick = () => {
      const streak = localStorage.getItem("streak") || 0;
      const catStreak = localStorage.getItem(`streak-${category}`) || 0;
      const text = `🎉 I guessed today's ${category} face (${answer})!\nGlobal streak: ${streak} days\n${category} streak: ${catStreak} days`;
      navigator.clipboard.writeText(text).then(() => {
        alert("Result copied to clipboard!");
      });
    };
    app.appendChild(shareBtn);
  }
}

function renderDashboard() {
  const streak = localStorage.getItem("streak") || 0;
  const scienceStreak = localStorage.getItem("streak-science") || 0;
  const moviesStreak = localStorage.getItem("streak-movies") || 0;
  const musicStreak = localStorage.getItem("streak-music") || 0;
  const historyStreak = localStorage.getItem("streak-history") || 0;
  const sportsStreak = localStorage.getItem("streak-sports") || 0;
  app.innerHTML = `
      <img
    src="/face-guess.svg"
    alt="Face Guess"
    width="200px"
    height="200px"
    />
  <h1>Dashboard</h1>
      <p>Global streak: ${streak} day(s)</p>
      <p>Science streak: ${scienceStreak} day(s)</p>
      <p>Movies streak: ${moviesStreak} day(s)</p>
    <p>Music streak: ${musicStreak} day(s)</p>
    <p>History streak: ${historyStreak} day(s)</p>
    <p>Sports streak: ${sportsStreak} day(s)</p>
    <p>Badges: ${
      scienceStreak >= 5 ? "🔬 Science Buff " : ""
    }${moviesStreak >= 5 ? "🎞️ Cinema Buff " : ""}${
      musicStreak >= 5 ? "🎵 Music Buff " : ""
    }${historyStreak >= 5 ? "📜 History Buff " : ""}${
      sportsStreak >= 5 ? "🏅 Sports Buff " : ""
    }</p>
    <button onclick="window.location.hash='/'">Back to categories</button>
`;
}

/**
 *     <p>Current streak: ${streak} day(s)</p>
    <p>Badges coming soon!</p>
    <button onclick="window.location.hash='/'">Back to categories</button>
 */
