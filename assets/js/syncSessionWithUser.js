export default async function syncSessionWithUser() {
  try {
    const res = await getUserDetails();
    const userId = res?.currentUser?.id;
    console.log(userId);

    if (!userId) {
      console.warn("User not found in response");
      return;
    }

    const storedUserId = sessionStorage.getItem("cvUserId");

    // أول مرة
    if (!storedUserId) {
      sessionStorage.setItem("cvUserId", String(userId));
      return;
    }

    // لو اليوزر اتغير
    if (storedUserId !== String(userId)) {
      sessionStorage.clear();
      sessionStorage.setItem("cvUserId", String(userId));
    }
  } catch (err) {
    console.error("Failed to sync user session", err);

    // لو التوكن بايظ
    sessionStorage.clear();
    window.location.href = "/index.html";
  }
}