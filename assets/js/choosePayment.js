document.addEventListener("DOMContentLoaded", () => {
  // ---------- Get params from URL ----------
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get("planId");
  const planPrice = urlParams.get("amount");
  const planName = urlParams.get("planName") || "Pro Plan";
  const userId = localStorage.getItem("userId") || null;

  // ---------- Update UI ----------
  const planNameEl = document.getElementById("planName");
  const planPriceEl = document.getElementById("planPrice");
  if (planNameEl && planPriceEl) {
    planNameEl.textContent = planName || `No Plan`;
    planPriceEl.textContent = planPrice
      ? `SAR ${Number(planPrice).toLocaleString()}`
      : "No Price Found";
  } else {
    console.error("❌ Elements not found in DOM!");
  }

  // ---------- Payment selection ----------
  const methods = document.querySelectorAll(".method");
  const proceedBtn = document.getElementById("proceedBtn");
  let selectedMethod = null;

  methods.forEach((method) => {
    method.addEventListener("click", () => {
      // reset
      methods.forEach((m) => m.classList.remove("active"));
      method.classList.add("active");
      selectedMethod = method.dataset.method;
      proceedBtn.disabled = false;

      // update button look
      if (selectedMethod === "apple") {
        proceedBtn.className = "apple";
        proceedBtn.innerHTML = `<img src="assets/img/apple-white.png" alt="Apple" /> دفع باستخدام Apple Pay`;
      } else if (selectedMethod === "moyasser") {
        proceedBtn.className = "moyasser";
        proceedBtn.innerHTML = `<img src="assets/img/moyasar.png" alt="Moyasar" /> الدفع عبر Moyasar`;
      }
    });
  });

  // ---------- Redirect based on selection ----------
  proceedBtn.addEventListener("click", () => {
    if (!selectedMethod || !planId || !planPrice) {
      alert("البيانات غير مكتملة، حاول مرة أخرى.");
      return;
    }

    // ✅ تحديد الصفحة بناءً على طريقة الدفع
    let targetPage = "";
    if (selectedMethod === "apple") {
      targetPage = "apple-pay.html";
    } else if (selectedMethod === "moyasser") {
      targetPage = "moyaser.html";
    }

    // ✅ تمرير البيانات في الـ URL
    const query = `?planId=${encodeURIComponent(
      planId
    )}&amount=${encodeURIComponent(planPrice)}&planName=${encodeURIComponent(
      planName
    )}`;

    window.location.href = `${targetPage}${query}`;
  });
});
