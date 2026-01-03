import { getPlans } from "./api.js";
import api from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".mysr-form");
  const lang = localStorage.getItem("lang") || "en";

  if (!container) return;

  /* ================= Toast ================= */
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

  /* ================= AUTH CHECK (COOKIE) ================= */
  async function isLoggedIn() {
    try {
      const res = await api.get("/users/get-user-details");
      return !!res.data?.currentUser?.id;
    } catch (err) {
      return false; // 401 / 403 / network
    }
  }

  try {
    /* ================= FETCH PLANS ================= */
    const response = await getPlans();
    const plans = response.data?.plansWithAmount;

    if (!plans || plans.length === 0) {
      container.innerHTML = `<p class="text-center">${
        lang === "en" ? "No plans available." : "لا توجد باقات متاحة"
      }</p>`;
      return;
    }

    /* ================= RENDER ================= */
    container.innerHTML = `
      <div class="row justify-content-center">
        ${plans
          .map(
            (plan) => `
          <div class="col-md-6 col-lg-4 mb-4">
            <div class="rts__pricing__box style-1 rounded-3 h-100 d-flex flex-column">
              <div class="py-4 flex-grow-1">
                <h3 class="h6 fw-medium lh-1 mb-2 text-primary">
                  ${lang === "ar" ? plan.ar_name : plan.name}
                </h3>

                <div class="plan__price lh-1 mb-3">
                  <span class="h2 mb-0 me-1">
                    ${plan.price / 100} ${plan.currency}
                  </span>
                  <small class="text-muted d-block">
                    ${lang === "en" ? "Duration" : "المدة"}:
                    ${plan.duration} ${lang === "en" ? "days" : "يوم"}
                  </small>
                </div>

                ${
                  plan.isTrial
                    ? `<span class="badge bg-success mb-3">${
                        lang === "en" ? "Trial" : "تجريبي"
                      }</span>`
                    : ""
                }

                <ul class="plan__feature mt-3">
                  ${(plan[lang === "ar" ? "ar_features" : "features"] || [])
                    .map(
                      (f) =>
                        `<li><i class="fa-sharp fa-solid fa-check"></i> ${f}</li>`
                    )
                    .join("")}
                </ul>
              </div>

              <div class="pricing-footer mt-auto p-3">
                <button
                  class="rts__btn pricing__btn choose-plan-btn"
                  data-plan-id="${plan.id}"
                  data-price="${plan.price}"
                  data-plan-name-en="${plan.name}"
                >
                  ${lang === "en" ? "Choose Plan" : "اختر الباقة"}
                </button>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    /* ================= CHOOSE PLAN HANDLER ================= */
    document.querySelectorAll(".choose-plan-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const logged = await isLoggedIn();

        if (!logged) {
          showToast(
            lang === "en"
              ? "⚠️ Please log in before choosing a plan."
              : "⚠️ يرجى تسجيل الدخول قبل اختيار الباقة.",
            "warning"
          );

          const loginModalEl = document.getElementById("loginModal");
          if (loginModalEl) {
            new bootstrap.Modal(loginModalEl).show();
          }
          return;
        }

        // ✅ logged in
        const planId = btn.dataset.planId;
        const price = btn.dataset.price;
        const planNameEn = btn.dataset.planNameEn;

        window.location.href = `payment-choose.html?planId=${planId}&amount=${price}&planName=${encodeURIComponent(
          planNameEn
        )}`;
      });
    });
  } catch (err) {
    console.error("❌ Error fetching plans:", err);
    container.innerHTML = `<p class="text-center text-danger">${
      lang === "en"
        ? "Failed to load plans. Please try again."
        : "فشل تحميل الباقات. برجاء المحاولة لاحقًا"
    }</p>`;
  }
});
