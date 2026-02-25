import { getUserDetails } from "./api.js";

export default async function syncSessionWithUser() {
  try {
    const res = await getUserDetails();

    // حسب الرسبونس اللي انت باعته
    const userId = res?.currentUser?.id;

    if (!userId) {
      console.warn("User ID not found in response");
      return;
    }

    const storedUserId = sessionStorage.getItem("cvUserId");

    // أول زيارة للصفحة في نفس التاب
    if (!storedUserId) {
      sessionStorage.setItem("cvUserId", String(userId));
      return;
    }

    // لو اليوزر اتغير
    if (storedUserId !== String(userId)) {
      // console.log("User changed → resetting CV session");

      const keysToRemove = ["cvId", "templateId", "cvCurrentStep", "cvUserId"];

      keysToRemove.forEach((key) => sessionStorage.removeItem(key));

      // تسجيل اليوزر الجديد
      sessionStorage.setItem("cvUserId", String(userId));
    }
  } catch (err) {
    console.error("Failed to sync user session", err);

    // لو التوكن منتهي أو غير صالح
    if (err?.response?.status === 401) {
      const keysToRemove = ["cvId", "templateId", "cvCurrentStep", "cvUserId"];

      keysToRemove.forEach((key) => sessionStorage.removeItem(key));

      window.location.href = "/index.html";
    }
  }
}
