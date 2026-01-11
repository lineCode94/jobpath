// singleBlog.js
import { getSingleBlog } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const blogId = params.get("blogId");

  const blogContainer = document.querySelector(".rts__blog__details");
  const breadcrumbContainer = document.querySelector(
    ".rts__section.breadcrumb__background"
  );

  const lang = localStorage.getItem("lang") || "en";
  const isAr = lang === "ar";

  document.documentElement.dir = isAr ? "rtl" : "ltr";

  if (!blogId) {
    blogContainer.innerHTML = "<p>Blog ID not found.</p>";
    return;
  }

  try {
    const blog = await getSingleBlog(blogId);
    if (!blog) return;

    const title = isAr ? blog.ar_title : blog.title;
    const content = isAr ? blog.ar_content : blog.content;
    const publisher = isAr ? blog.ar_publisher : blog.publisher;
    const image = blog.blogPath || "assets/img/blog/default-blog.jpg";

    const publishedDate = new Date(blog.publishedAt).toLocaleDateString(
      isAr ? "ar-EG" : "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );

    /* ================= Breadcrumb ================= */
    if (breadcrumbContainer) {
      breadcrumbContainer.innerHTML = `
        <div class="container">
          <div class="row justify-content-center">
            <div style="margin-top: 250px;" class="col-lg-10 text-center">
              <h2 class="fw-bold mb-3 fs-4 fs-md-3">
                ${title}
              </h2>

              <div class="d-flex justify-content-center gap-3 small text-muted">
                <span>
                  <img src="assets/img/icon/calender.svg" width="14" />
                  ${publishedDate}
                </span>
                <span>
                  <img src="assets/img/icon/user.svg" width="12" />
                  ${publisher}
                </span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    /* ================= Blog Content ================= */
    blogContainer.innerHTML = `
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-8 col-md-10">

            <img
              src="${image}"
              alt="${title}"
              class="img-fluid rounded-3 mb-4 w-100"
              loading="lazy"
            />

            <h1 class="fs-3 fs-md-2 fw-semibold mb-3">
              ${title}
            </h1>

            <p class="text-muted small mb-4">
              ${publishedDate} • ${publisher}
            </p>

            <div class="blog__content fs-6 lh-lg text-secondary">
              ${content.replace(/\n/g, "<br />")}
            </div>

          </div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    blogContainer.innerHTML =
      "<p>Failed to load blog. Please try again later.</p>";
  }
});
