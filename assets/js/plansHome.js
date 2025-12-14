// plansHome.js
import { getPlans } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const monthlyContainer = document.querySelector(".monthly__pricing .row");
  const yearlyContainer = document.querySelector(".yearly__pricing .row");
  const lang = localStorage.getItem("lang") || "en";

  if (!monthlyContainer || !yearlyContainer) return;

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

  try {
    const res = await getPlans();
    const plans = res.data?.plansWithAmount;

    if (!plans || plans.length === 0) {
      monthlyContainer.innerHTML = `<p class="text-center">${
        lang === "en" ? "No plans available." : "لا توجد باقات متاحة"
      }</p>`;
      yearlyContainer.innerHTML = monthlyContainer.innerHTML;
      return;
    }

    // 🔹 اختر فقط الخطط Free, Basic, Golden
    const filteredPlans = plans.filter((plan) =>
      ["free plan", "basic plan", "gold plan"].includes(plan.name.toLowerCase())
    );

    function renderPlan(plan, type = "monthly") {
      const features = plan[lang === "ar" ? "ar_features" : "features"] || [];
      return `
        <div class="col-lg-5 col-xl-4 col-md-6 mb-4">
          <div class="rts__pricing__box d-flex flex-column h-100 rounded-3 p-3">
            <div class="flex-grow-1">
              <div class="h6 fw-medium lh-1 mb-2 text-primary" style="text-transform: capitalize;">
                ${lang === "ar" ? plan.ar_name : plan.name}
              </div>
              <div class="plan__price lh-1 mb-3">
                <span class="h2">${plan.price / 100} ${plan.currency}/</span>
                <span>${
                  type === "monthly"
                    ? lang === "ar"
                      ? "شهري"
                      : "Month"
                    : lang === "ar"
                    ? "سنوي"
                    : "Yearly"
                }</span>
              </div>
              <ul class="plan__feature">
                ${features
                  .map(
                    (f) =>
                      `<li><i class="fa-sharp fa-solid fa-check"></i> ${f}</li>`
                  )
                  .join("")}
              </ul>
            </div>
            <a
              href="pricing.html"
              class="rts__btn pricing__btn no__fill__btn mt-auto"
              data-en="Get Started Now"
              data-ar="ابدأ الآن"
            >
              ${lang === "ar" ? "ابدأ الآن" : "Get Started Now"}
            </a>
          </div>
        </div>
      `;
    }

    monthlyContainer.innerHTML = filteredPlans
      .map((p) => renderPlan(p, "monthly"))
      .join("");
    yearlyContainer.innerHTML = filteredPlans
      .map((p) => renderPlan(p, "yearly"))
      .join("");
  } catch (err) {
    console.error("❌ Error fetching plans:", err);
    showToast(
      lang === "en"
        ? "Failed to load plans. Please try again."
        : "فشل تحميل الباقات. برجاء المحاولة لاحقًا",
      "error"
    );
  }
});
