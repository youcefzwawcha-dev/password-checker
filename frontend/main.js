document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("password");
  const toggleButton = document.querySelector(".eye-logo");
  const toggleImg = document.getElementById("toggle-password");
  const progressBar = document.getElementById("password-strength");
  const statusText = document.querySelector(".status");
  const analyzeBtn = document.querySelector(".analyse");
  const cardParagraphs = document.querySelectorAll(".card p");

  const lengthDisplay = cardParagraphs[0];
  const protectionDisplay = cardParagraphs[1];

  if (toggleButton && passwordInput) {
    toggleButton.addEventListener("click", (e) => {
      e.preventDefault();
      const isPassword = passwordInput.type === "password";

      passwordInput.type = isPassword ? "text" : "password";

      if (toggleImg) {
        toggleImg.style.opacity = isPassword ? "0.5" : "1";
      }
    });
  }

  function analyzePassword() {
    const val = passwordInput.value;

    if (!val) {
      progressBar.value = 0;
      statusText.textContent = "";
      if (lengthDisplay) lengthDisplay.textContent = "0 Characters";
      if (protectionDisplay) protectionDisplay.textContent = "Security checks";
      return;
    }

    let score = 0;
    const missingRequirements = [];

    const len = val.length;
    if (len >= 16) {
      score += 40;
    } else if (len >= 12) {
      score += 30;
    } else if (len >= 8) {
      score += 20;
    } else {
      score += 10;
      missingRequirements.push("min 8+ chars");
    }

    if (/[a-z]/.test(val)) score += 15;
    else missingRequirements.push("lowercase");
    if (/[A-Z]/.test(val)) score += 15;
    else missingRequirements.push("uppercase");
    if (/[0-9]/.test(val)) score += 15;
    else missingRequirements.push("number");
    if (/[^a-zA-Z0-9]/.test(val)) score += 15;
    else missingRequirements.push("symbol");

    score = Math.min(100, score);

    let status = "";
    let statusColor = "";

    if (score <= 35) {
      status = "Weak";
      statusColor = "var(--strength-weak)";
    } else if (score <= 65) {
      status = "Medium";
      statusColor = "var(--strength-medium)";
    } else if (score <= 85) {
      status = "Strong";
      statusColor = "var(--strength-strong)";
    } else {
      status = "Very Strong";
      statusColor = "var(--strength-very-strong)";
    }

    progressBar.value = score;
    statusText.textContent = status;
    statusText.style.color = statusColor;

    if (lengthDisplay) {
      lengthDisplay.textContent = `${len} Character${len === 1 ? "" : "s"}`;
    }

    if (protectionDisplay) {
      if (missingRequirements.length > 0) {
        protectionDisplay.textContent = `Needs: ${missingRequirements.join(", ")}`;
      } else {
        protectionDisplay.textContent = "All security checks passed!";
      }
    }
  }

  passwordInput.addEventListener("input", analyzePassword);

  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      analyzePassword();
    });
  }

  analyzePassword();
});
