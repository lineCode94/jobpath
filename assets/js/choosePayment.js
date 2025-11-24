document.addEventListener("DOMContentLoaded", () => {
  // ---------- Get params from URL ----------
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get("planId");
  const planPrice = urlParams.get("amount");
  const finalPrice = planPrice / 100;
  const planName = urlParams.get("planName") || "Pro Plan";
  const userId = localStorage.getItem("userId") || null;

  // ---------- Update UI ----------
  const planNameEl = document.getElementById("planName");
  const planPriceEl = document.getElementById("planPrice");

  if (planNameEl && planPriceEl) {
    planNameEl.textContent = planName || `No Plan`;
    planPriceEl.textContent = finalPrice
      ? `SAR ${Number(finalPrice).toLocaleString()}`
      : "No Price Found";
  }

  // ---------- Payment selection ----------
  const methods = document.querySelectorAll(".method");
  const proceedBtn = document.getElementById("proceedBtn");
  let selectedMethod = null;

  methods.forEach((method) => {
    method.addEventListener("click", () => {
      // reset active
      methods.forEach((m) => m.classList.remove("active"));
      method.classList.add("active");

      selectedMethod = method.dataset.method;
      proceedBtn.disabled = false;

      // update button UI based on selected method
      const lang =localStorage.getItem("lang")
      switch (selectedMethod) {
        
        case "apple":
          proceedBtn.className = "apple";
          proceedBtn.innerHTML = `${
            lang === "ar"
              ? ` <img src="assets/img/apple-white.png" alt="Apple" />
            ادفع باستخدام Apple Pay`
              : ` <img src="assets/img/apple-white.png" alt="Apple" />
            Pay with Apple Pay`
          }`;
          break;

        case "visa":
          proceedBtn.className = "moyasser";
          proceedBtn.innerHTML = `      ${
            lang === "ar" ? "        الدفع بإستخدام فيزا / ماستركارد" : "Pay with Visa/Mastercard"
          }  `;
          break;

        case "mada":
          proceedBtn.className = "moyasser";
          proceedBtn.innerHTML = `${
            lang === "ar" ? "الدفع بإستخدام مدى" : "Pay with Mada"
          } `;
          break;

        case "bank":
          proceedBtn.className = "moyasser";
          proceedBtn.innerHTML = `${
            lang === "ar" ? " تحويل بنكي" : " Bank Transfer"
          } `;
          break;
      }
    });
  });

  // ---------- Redirect based on selection ----------
  proceedBtn.addEventListener("click", () => {
    if (!selectedMethod || !planId || !planPrice) {
      alert("البيانات غير مكتملة، حاول مرة أخرى.");
      return;
    }

    let targetPage = "";

    // ❌ Apple Pay → صفحة Apple Pay
    if (selectedMethod === "apple") {
      targetPage = "apple-pay.html";
    }

    // ✔ كل الطرق الأخرى → صفحة ميسر
    else {
      targetPage = "moyaser.html";
    }

    const query = `?planId=${encodeURIComponent(
      planId
    )}&amount=${encodeURIComponent(planPrice)}&planName=${encodeURIComponent(
      planName
    )}`;

    window.location.href = `${targetPage}${query}`;
  });
});
