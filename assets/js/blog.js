(function () {
  const store = window.BYCContentStore;
  const placementRegistry = window.BYCPlacements?.list || [];
  const BLOG_PLACEMENT_ID = 'blog-main';
  const NEW_POST_DAYS = 14;

  // Lấy state từ store (nguồn dữ liệu chính)
  let categories = [];
  let posts = [];
  if (store?.getState) {
    const state = store.getState();
    categories = state.categories || [];
    posts = state.posts || [];
  }

  const elements = {
    searchInput: document.getElementById('searchInput'),
    userCategoryFilter: document.getElementById('userCategoryFilter'),
    newOnly: document.getElementById('newOnly'),
    postList: document.getElementById('postList'),

    categoryForm: document.getElementById('categoryForm'),
    categoryName: document.getElementById('categoryName'),
    categoryDescription: document.getElementById('categoryDescription'),
    categoryList: document.getElementById('categoryList'),

    postForm: document.getElementById('postForm'),
    postId: document.getElementById('postId'),
    postTitle: document.getElementById('postTitle'),
    postCategory: document.getElementById('postCategory'),
    postExcerpt: document.getElementById('postExcerpt'),
    postContent: document.getElementById('postContent'),
    postVideoUrl: document.getElementById('postVideoUrl'),
    insertVideo: document.getElementById('insertVideo'),
    videoPreview: document.getElementById('videoPreview'),
    adminPostList: document.getElementById('adminPostList'),

    placementOptions: document.getElementById('placementOptions'),
    resetPostForm: document.getElementById('resetPostForm'),
  };

  function syncState() {
    if (!store?.getState) return;
    const next = store.getState();
    categories = next.categories || [];
    posts = next.posts || [];
  }

  // Ưu tiên dùng slugify của store; fallback nếu store không có
  function slugify(text) {
    if (store?.slugify) return store.slugify(text);
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  function formatDate(value) {
    const date = new Date(value);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function isNewPost(dateString) {
    const created = new Date(dateString).getTime();
    const daysAgo = (Date.now() - created) / (1000 * 60 * 60 * 24);
    return daysAgo <= NEW_POST_DAYS;
  }

  function normalizeYoutubeUrl(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url.trim());
      const host = parsed.hostname.replace('www.', '');

      if (host === 'youtu.be') {
        const videoId = parsed.pathname.replace('/', '');
        return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
      }

      if (host.includes('youtube.com')) {
        const videoId = parsed.searchParams.get('v');
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        if (parsed.pathname.startsWith('/embed/')) return url;
      }

      return '';
    } catch (err) {
      return '';
    }
  }

  function renderVideoPreview(url) {
    if (!elements.videoPreview) return;
    const embed = normalizeYoutubeUrl(url);

    if (!url) {
      elements.videoPreview.innerHTML = 'Dán link YouTube để xem trước video được nhúng.';
      elements.videoPreview.classList.add('muted');
      return;
    }

    if (!embed) {
      elements.videoPreview.innerHTML =
        'Link YouTube chưa đúng định dạng. Ví dụ: https://www.youtube.com/watch?v=abc';
      elements.videoPreview.classList.add('muted');
      return;
    }

    elements.videoPreview.classList.remove('muted');
    elements.videoPreview.innerHTML = `
      <div class="video-wrapper">
        <iframe src="${embed}" title="Xem trước video" allowfullscreen loading="lazy"></iframe>
      </div>
    `;
  }

  function renderPlacementOptions(selected = [BLOG_PLACEMENT_ID]) {
    if (!elements.placementOptions) return;
    const chosen = selected && selected.length ? selected : [BLOG_PLACEMENT_ID];

    const options = placementRegistry
      .map((placement) => {
        const checked = chosen.includes(placement.id);
        return `
          <label class="placement-option">
            <input type="checkbox" name="postPlacements" value="${placement.id}" ${checked ? 'checked' : ''}>
            <div>
              <strong>${placement.name}</strong>
              <p class="muted">${placement.description || ''}</p>
            </div>
          </label>
        `;
      })
      .join('');

    elements.placementOptions.innerHTML = options;
  }

  function renderCategoryOptions() {
    if (!elements.postCategory || !elements.userCategoryFilter) return;

    const options = (categories || [])
      .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
      .join('');

    elements.postCategory.innerHTML = '<option value="" disabled selected>Chọn danh mục</option>' + options;
    elements.userCategoryFilter.innerHTML = '<option value="">Tất cả danh mục</option>' + options;
  }

  function renderCategoryList() {
    if (!elements.categoryList) return;
    if (!categories || !categories.length) {
      elements.categoryList.innerHTML = '<p class="muted">Chưa có danh mục nào.</p>';
      return;
    }

    elements.categoryList.innerHTML = categories
      .map(
        (cat) => `
        <div class="pill">
          <div>
            <strong>${cat.name}</strong>
            <p class="muted">${cat.description || 'Chưa có mô tả'}</p>
          </div>
          <button class="link-btn" data-delete-category="${cat.id}">Xóa</button>
        </div>
      `
      )
      .join('');
  }

  function renderAdminPosts() {
    if (!elements.adminPostList) return;
    if (!posts || !posts.length) {
      elements.adminPostList.innerHTML = '<p class="muted">Chưa có bài viết nào.</p>';
      return;
    }

    const placementLookup = placementRegistry.reduce((acc, item) => {
      acc[item.id] = item.name;
      return acc;
    }, {});

    const sorted = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    elements.adminPostList.innerHTML = sorted
      .map((post) => {
        const category = categories.find((c) => c.id === post.categoryId);
        const videoLabel = post.videoUrl ? '<span class="pill-label">Video</span>' : '';
        const placementTags = (post.placements || [BLOG_PLACEMENT_ID])
          .map((placementId) => placementLookup[placementId] || placementId)
          .map((label) => `<span class="pill-label neutral">${label}</span>`)
          .join(' ');

        return `
          <article class="admin-post">
            <div>
              <h4>${post.title}</h4>
              <p class="muted">${category ? category.name : 'Không rõ danh mục'} • ${formatDate(post.createdAt)} ${videoLabel}</p>
              <div class="placement-tags">${placementTags}</div>
              <p>${post.excerpt}</p>
            </div>
            <div class="admin-actions">
              <button class="link-btn" data-edit-post="${post.id}">Sửa</button>
              <button class="link-btn danger" data-delete-post="${post.id}">Xóa</button>
            </div>
          </article>
        `;
      })
      .join('');
  }

  function renderVideoEmbed(url) {
    const embedUrl = normalizeYoutubeUrl(url);
    if (!embedUrl) return '';
    return `
      <div class="video-wrapper">
        <iframe src="${embedUrl}" title="Video bài viết" allowfullscreen loading="lazy"></iframe>
      </div>
    `;
  }

  function renderPosts() {
    if (!elements.postList) return;

    const searchText = elements.searchInput?.value?.toLowerCase() || '';
    const categoryFilter = elements.userCategoryFilter?.value || '';
    const onlyNew = elements.newOnly?.checked;

    const filtered = (posts || [])
      .filter((post) => !post.placements || post.placements.includes(BLOG_PLACEMENT_ID))
      .filter((post) => {
        const matchCategory = categoryFilter ? post.categoryId === categoryFilter : true;
        const matchSearch = searchText
          ? (post.title + post.excerpt + post.content + (post.videoUrl || ''))
              .toLowerCase()
              .includes(searchText)
          : true;
        const matchNew = onlyNew ? isNewPost(post.createdAt) : true;

        return matchCategory && matchSearch && matchNew;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (!filtered.length) {
      elements.postList.innerHTML = '<p class="muted">Không tìm thấy bài viết phù hợp.</p>';
      return;
    }

    elements.postList.innerHTML = filtered
      .map((post) => {
        const category = categories.find((c) => c.id === post.categoryId);
        const newBadge = isNewPost(post.createdAt) ? '<span class="badge">Mới</span>' : '';
        const videoBlock = renderVideoEmbed(post.videoUrl);

        return `
          <article class="post-card">
            <div class="post-card-header">
              <div>
                <p class="eyebrow">${category ? category.name : 'Danh mục khác'}</p>
                <h3>${post.title}</h3>
                <p class="meta">${formatDate(post.createdAt)}</p>
              </div>
              ${newBadge}
            </div>
            <p>${post.excerpt}</p>
            <details>
              <summary>Đọc bài viết</summary>
              <p>${post.content}</p>
              ${videoBlock}
            </details>
          </article>
        `;
      })
      .join('');
  }

  function resetPostForm() {
    if (!elements.postForm) return;
    elements.postId.value = '';
    elements.postTitle.value = '';
    elements.postCategory.value = '';
    elements.postExcerpt.value = '';
    elements.postContent.value = '';
    elements.postVideoUrl.value = '';
    renderVideoPreview('');
    renderPlacementOptions();
    const submitBtn = elements.postForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Lưu bài viết';
  }

  function handleCategorySubmit(event) {
    event.preventDefault();
    const name = elements.categoryName.value.trim();
    const description = elements.categoryDescription.value.trim();
    if (!name) return;

    const newCategory = {
      id: slugify(name) || `cat-${Date.now()}`,
      name,
      description,
    };

    // Dùng store làm nguồn dữ liệu
    store.setCategories((current) => {
      const next = Array.isArray(current) ? [...current] : [];
      next.push(newCategory);
      return next;
    });
  }

  function getSelectedPlacements() {
    return Array.from(document.querySelectorAll('input[name="postPlacements"]:checked')).map(
      (input) => input.value
    );
  }

  function handlePostSubmit(event) {
    event.preventDefault();

    const id = elements.postId.value;
    const title = elements.postTitle.value.trim();
    const categoryId = elements.postCategory.value;
    const excerpt = elements.postExcerpt.value.trim();
    const content = elements.postContent.value.trim();
    const videoUrl = elements.postVideoUrl.value.trim();
    const placements = getSelectedPlacements();

    if (!title || !categoryId || !excerpt || !content) return;

    store.setPosts((current) => {
      const next = Array.isArray(current) ? [...current] : [];

      if (id) {
        const idx = next.findIndex((p) => p.id === id);
        if (idx !== -1) {
          next[idx] = {
            ...next[idx],
            title,
            categoryId,
            excerpt,
            content,
            videoUrl,
            placements: placements.length ? placements : [BLOG_PLACEMENT_ID],
          };
        }
      } else {
        next.push({
          id: `post-${Date.now()}`,
          title,
          categoryId,
          excerpt,
          content,
          videoUrl,
          placements: placements.length ? placements : [BLOG_PLACEMENT_ID],
          createdAt: new Date().toISOString(),
        });
      }

      return next;
    });

    resetPostForm();
  }

  function handleListClick(event) {
    const deleteCategoryId = event.target.getAttribute('data-delete-category');
    if (deleteCategoryId) {
      const inUse = (posts || []).some((post) => post.categoryId === deleteCategoryId);
      if (inUse) {
        alert('Không thể xóa danh mục đang được sử dụng.');
        return;
      }

      store.setCategories((current) => (Array.isArray(current) ? current.filter((c) => c.id !== deleteCategoryId) : []));
      return;
    }

    const editPostId = event.target.getAttribute('data-edit-post');
    if (editPostId) {
      const post = (posts || []).find((p) => p.id === editPostId);
      if (post) {
        elements.postId.value = post.id;
        elements.postTitle.value = post.title;
        elements.postCategory.value = post.categoryId;
        elements.postExcerpt.value = post.excerpt;
        elements.postContent.value = post.content;
        elements.postVideoUrl.value = post.videoUrl || '';
        renderVideoPreview(post.videoUrl || '');
        renderPlacementOptions(post.placements || [BLOG_PLACEMENT_ID]);

        const submitBtn = elements.postForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Cập nhật bài viết';

        window.scrollTo({ top: elements.postForm.offsetTop - 40, behavior: 'smooth' });
      }
      return;
    }

    const deletePostId = event.target.getAttribute('data-delete-post');
    if (deletePostId) {
      store.setPosts((current) => (Array.isArray(current) ? current.filter((p) => p.id !== deletePostId) : []));
      return;
    }
  }

  function handleInsertVideo() {
    const url = elements.postVideoUrl.value.trim();
    const embed = normalizeYoutubeUrl(url);
    if (!url || !embed) {
      alert('Vui lòng nhập link YouTube hợp lệ để chèn video.');
      return;
    }

    const marker = `[Video] ${url}`;
    const current = elements.postContent.value;
    const spacer = current && !current.endsWith('\n') ? '\n\n' : '';
    elements.postContent.value = `${current}${spacer}${marker}`;
    renderVideoPreview(url);
  }

  function bindEvents() {
    elements.categoryForm?.addEventListener('submit', handleCategorySubmit);
    elements.postForm?.addEventListener('submit', handlePostSubmit);
    elements.categoryList?.addEventListener('click', handleListClick);
    elements.adminPostList?.addEventListener('click', handleListClick);
    elements.resetPostForm?.addEventListener('click', resetPostForm);

    elements.searchInput?.addEventListener('input', renderPosts);
    elements.userCategoryFilter?.addEventListener('change', renderPosts);
    elements.newOnly?.addEventListener('change', renderPosts);

    elements.postVideoUrl?.addEventListener('input', (event) => renderVideoPreview(event.target.value));
    elements.insertVideo?.addEventListener('click', handleInsertVideo);

    if (store?.onChange) {
      store.onChange((state) => {
        categories = state.categories || [];
        posts = state.posts || [];
        renderCategoryOptions();
        renderCategoryList();
        renderAdminPosts();
        renderPosts();
      });
    }
  }

  function init() {
    renderPlacementOptions();
    renderCategoryOptions();
    renderCategoryList();
    renderAdminPosts();
    renderPosts();
    renderVideoPreview(elements.postVideoUrl?.value || '');
    bindEvents();
  }

  init();
})();
