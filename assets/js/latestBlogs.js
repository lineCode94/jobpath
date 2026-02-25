// latestBlogs.js
import { getLatestBlogs } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("latestBlogsContainer");
  if (!container) return;

  const lang = localStorage.getItem("lang") || "en";

  /* ================= Helpers ================= */

  const pick = (obj, enKey, arKey) => {
    return lang === "ar"
      ? obj[arKey] ?? obj[enKey] ?? ""
      : obj[enKey] ?? obj[arKey] ?? "";
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    return new Date(isoDate).toLocaleDateString(
      lang === "ar" ? "ar-EG" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  /* ================= Fetch Blogs ================= */

  try {
    const res = await getLatestBlogs();
    const blogs = res?.data?.blogs || [];
// console.log(res);
    if (!blogs.length) {
      container.innerHTML = `<p class="text-center mt-4">${
        lang === "ar" ? "لا توجد مقالات حالياً" : "No blogs available"
      }</p>`;
      return;
    }
    // console.log(blogs[0].blogId);

    container.innerHTML = blogs
      .map((blog) => {
        const title = pick(blog, "title", "ar_title");
        const publisher = pick(blog, "publisher", "ar_publisher");
        const date = formatDate(blog.publishedAt);
        const image = blog.blogImagePath || "assets/img/home-1/blog/2.webp";

      return `
  <div class="col-xl-4 col-lg-4 col-md-6">
    <div class="rts__single__blog">
      <a href="blog-details.html?blogId=${blog.blogId}" class="blog__img">
        <img src="${image}" alt="${title}" />
      </a>

      <div class="blog__meta">
        <div class="blog__meta__info d-flex gap-3 my-3">
          <span class="d-flex gap-1 align-items-center">
            <img class="svg" src="assets/img/icon/calender.svg" />
            <span>${date}</span>
          </span>

          <span class="d-flex gap-1 align-items-center">
            <img class="svg" src="assets/img/icon/user.svg" />
            <span>${publisher}</span>
          </span>
        </div>

        <a href="blog-details.html?blogId=${blog.blogId}" class="h6 fw-semibold">
          ${title}
        </a>
      </div>
    </div>
  </div>
`;

      })
      .join("");
  } catch (err) {
    console.error("❌ Failed to load blogs", err);
    container.innerHTML = `<p class="text-danger text-center mt-4">${
      lang === "ar" ? "حدث خطأ أثناء تحميل المقالات" : "Failed to load blogs"
    }</p>`;
  }
});
