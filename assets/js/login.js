// login logout functionality
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("login");
  const logoutBtn = document.getElementById("logout");
  const profileMenu = document.getElementById("profileMenu");

  // 🔹 دالة التوست
  function showToast(message, type = "info") {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "center",
      style: {
        background:
          type === "success"
            ? "linear-gradient(to right, #00b09b, #96c93d)"
            : type === "error"
            ? "linear-gradient(to right, #e52d27, #b31217)"
            : type === "warning"
            ? "linear-gradient(to right, #f7971e, #ffd200)"
            : "linear-gradient(to right, #283c86, #45a247)",
        color: "#fff",
        fontSize: "14px",
        borderRadius: "8px",
        padding: "10px 20px",
      },
    }).showToast();
  }

  // Login
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const phone = document.getElementById("phone").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!phone || !password) {
        showToast("⚠️ Please enter phone and password", "warning");
        return;
      }

      try {
        const data = await loginUser(phone, password);

        if (data.token) {
          localStorage.setItem("authToken", data.token);
          showToast("✅ Login successful!", "success");
        }

        updateUI();

        setTimeout(() => {
          window.location.href = "index.html";
        }, 800);
      } catch (err) {
        showToast(
          err.response?.data?.message || "❌ Login failed, please try again",
          "error"
        );
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      try {
        localStorage.removeItem("authToken");
        showToast("  Logged out successfully!", "success");
        setTimeout(() => {
          location.reload();
        }, 800);
      } catch (err) {
        showToast(
          err.response?.data?.message || "❌ Something went wrong",
          "error"
        );
      }
    });
  }

  // Update UI
  function updateUI() {
    const token = localStorage.getItem("authToken");

    if (token) {
      if (loginBtn) loginBtn.classList.add("log-toggle");
      if (logoutBtn) logoutBtn.classList.remove("log-toggle");
      if (profileMenu) profileMenu.style.display = "block";
    } else {
      if (loginBtn) loginBtn.classList.remove("log-toggle");
      if (logoutBtn) logoutBtn.classList.add("log-toggle");
      if (profileMenu) profileMenu.style.display = "none";
    }
  }

  // Initialize
  updateUI();

  // Check token and show profile
  const token = localStorage.getItem("authToken");
  if (token && profileMenu) {
    profileMenu.style.display = "block";
  }
});

//end login&logout functionality
