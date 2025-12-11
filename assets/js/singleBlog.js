// singleBlog.js
import { getSingleBlog } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const blogId = params.get("blogId"); // الرابط: single-blog.html?blogId=8
  const blogContainer = document.querySelector(".rts__blog__details");
  const breadcrumbContainer = document.querySelector(
    ".rts__section.breadcrumb__background"
  );

  if (!blogId) {
    if (breadcrumbContainer)
      breadcrumbContainer.innerHTML = "<p>Blog ID not found in URL.</p>";
    blogContainer.innerHTML = "<p>Blog ID not found in URL.</p>";
    return;
  }

  try {
    const blog = await getSingleBlog(blogId);

    if (!blog) {
      if (breadcrumbContainer)
        breadcrumbContainer.innerHTML = "<p>Blog not found.</p>";
      blogContainer.innerHTML = "<p>Blog not found.</p>";
      return;
    }

    // تحويل التاريخ لصيغة قابلة للقراءة
    const publishedDate = new Date(blog.publishedAt).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    // تحديث الـ breadcrumb section
    if (breadcrumbContainer) {
      breadcrumbContainer.innerHTML = `
        <div class="container">
          <div class="row">
            <div class="col-lg-12 position-relative d-flex justify-content-between align-items-center">
              <div class="breadcrumb__area max-content mx-auto breadcrumb__padding">
                <div class="rts__job__card__big bg-transparent p-0 position-relative z-1 flex-wrap justify-content-center d-flex gap-4 align-items-center">
                  <div class="">
                    <div class="job__meta w-100 d-flex text-center text-md-start flex-column gap-2">
                      <h3 class="job__title text-center h3 mb-0">${blog.title}</h3>
                      <div class="blog__meta__info justify-content-center d-flex gap-3 mt-2">
                        <span class="d-flex gap-2 align-items-center fw-medium">
                          <img class="svg" src="assets/img/icon/calender.svg" alt="" height="16" width="16" />
                          ${publishedDate}
                        </span>
                        <a href="#" class="d-flex gap-2 align-items-center fw-medium">
                          <img class="svg" src="assets/img/icon/user.svg" alt="" width="12" height="12" />
                          Author
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="breadcrumb__area__shape breadcrumb__style__four d-flex gap-4 justify-content-end align-items-center">
                <div class="shape__one common"></div>
                <div class="shape__two common">
                  <img src="assets/img/breadcrumb/shape-2.svg" alt="" />
                </div>
                <div class="shape__three common">
                  <img src="assets/img/breadcrumb/shape-3.svg" alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // عرض بيانات البلوج في الـ HTML
    blogContainer.innerHTML = `
      <h1 class="mb-20">${blog.title}</h1>
      <span class="mb-20 d-block text-muted">Published at: ${publishedDate}</span>
      <p>${blog.content}</p>

      <h6 class="fw-semibold mb-30">Comments</h6>
      <ul class="comment__list">
        ${
          blog.comments.length > 0
            ? blog.comments
                .map(
                  (comment) => `
            <li>
              <div class="is__content">
                <div class="d-flex gap-3">
                  <img height="60" width="60" src="${
                    comment.authorAvatar || "assets/img/author/1.svg"
                  }" alt="" class="rounded-2 mb-3"/>
                  <div class="d-flex flex-column">
                    <a href="#" class="font-20 text-dark fw-medium">${
                      comment.authorName
                    }</a>
                    <span>${new Date(comment.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <p>${comment.text}</p>
                <a href="#" class="rts__btn reply__btn mt-3">Reply</a>
              </div>
            </li>
          `
                )
                .join("")
            : "<li>No comments yet.</li>"
        }
      </ul>
    `;
  } catch (error) {
    console.error("Error fetching blog:", error);
    if (breadcrumbContainer)
      breadcrumbContainer.innerHTML = "<p>Failed to load blog.</p>";
    blogContainer.innerHTML =
      "<p>Failed to load blog. Please try again later.</p>";
  }
});
