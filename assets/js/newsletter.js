import { subscribeNewsletter } from "./api.js";

// ✅ language helper
function t(ar, en) {
  return (localStorage.getItem("lang") || "en") === "ar" ? ar : en;
}

function showToast(message, type = "info") {
  Toastify({
    text: message,
    duration: 4000,
    gravity: "top",
    position: "center",
    style: {
      background:
        type === "success"
          ? "linear-gradient(to right, #00b09b, #96c93d)"
          : type === "error"
            ? "linear-gradient(to right, #e52d27, #b31217)"
            : "linear-gradient(to right, #283c86, #45a247)",
      color: "#fff",
      fontSize: "14px",
      borderRadius: "8px",
      padding: "10px 20px",
    },
  }).showToast();
}

document.addEventListener("click", async function (e) {
  const btn = e.target.closest(".newsletter button");
  if (!btn) return;

  e.preventDefault();

  const form = btn.closest(".newsletter");
  const emailInput = form.querySelector("input[type='email']");
  const email = emailInput.value.trim();

  if (!email) {
    showToast(
      t("من فضلك أدخل بريدك الإلكتروني أولاً", "Please enter your email first"),
      "error",
    );
    return;
  }

  try {
    const res = await subscribeNewsletter({ email });

    if (res.data?.status) {
      showToast(
        t("تم الاشتراك بنجاح 🎉", "Subscribed successfully 🎉"),
        "success",
      );
      emailInput.value = "";
    } else {
      showToast(
        res.data?.msg || t("حدث خطأ ما، حاول مرة أخرى", "Something went wrong"),
        "error",
      );
    }
  } catch (err) {
    console.error(err);
    showToast(
      err.response?.data?.msg ||
        t("حدث خطأ في الخادم، حاول لاحقاً", "Server error. Try again later."),
      "error",
    );
  }
});
