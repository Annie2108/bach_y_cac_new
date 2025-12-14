(function () {
    const CATEGORY_KEY = 'bycCategories';
    const POST_KEY = 'bycPosts';
    const NEW_POST_DAYS = 14;

    const defaultCategories = [
        { id: 'tu-vi', name: 'Tử Vi', description: 'Pháp môn luận giải vận mệnh qua lá số.' },
        { id: 'tu-tru', name: 'Tứ Trụ', description: 'Góc nhìn Bát Tự, hà lạc khí vận.' },
        { id: 'phong-thuy', name: 'Phong Thủy', description: 'Sắp xếp phong thủy, tạo cân bằng đời sống.' },
    ];

    const defaultPosts = [
        {
            id: 'bai-viet-1',
            title: 'Cách tự đọc lá số Tử Vi cơ bản',
            categoryId: 'tu-vi',
            excerpt: 'Ba bước nhập môn giúp bạn hiểu bố cục lá số và xác định các cung trọng yếu.',
            content: 'Hãy bắt đầu từ việc nhận diện mệnh thân, sau đó xem tứ hóa và liên hệ hạn vận hiện tại. Bài viết kèm checklist để tự luyện hằng ngày.',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'bai-viet-2',
            title: 'Khai mở Tứ Trụ: đừng bỏ qua trụ giờ',
            categoryId: 'tu-tru',
            excerpt: 'Trụ giờ giúp soi tâm tính và tiềm năng ẩn. Đây là nơi nhiều hành giả mới thường bỏ sót.',
            content: 'Phần này minh họa cách xác định trụ giờ, ghi nhớ thần sát quan trọng và cách kết nối với trụ ngày để luận vận.',
            videoUrl: '',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'bai-viet-3',
            title: 'Bố trí phòng làm việc hợp phong thủy',
            categoryId: 'phong-thuy',
            excerpt: 'Một số gợi ý nhanh về hướng bàn, ánh sáng và vật phẩm giúp ổn định khí trường.',
            content: 'Chọn vị trí tựa lưng vững chắc, tránh xung trực cửa. Ánh sáng dịu, thêm cây xanh và hạn chế vật sắc nhọn chĩa vào người.',
            videoUrl: '',
            createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    let categories = loadData(CATEGORY_KEY, defaultCategories);
    let posts = loadData(POST_KEY, defaultPosts);

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
        resetPostForm: document.getElementById('resetPostForm'),
    };

    function loadData(key, fallback) {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : fallback;
        } catch (err) {
            return fallback;
        }
    }

    function saveData() {
        localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
        localStorage.setItem(POST_KEY, JSON.stringify(posts));
    }

    function slugify(text) {
        return text
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
                if (videoId) {
                    return `https://www.youtube.com/embed/${videoId}`;
                }
                if (parsed.pathname.startsWith('/embed/')) {
                    return `https://www.youtube.com${parsed.pathname}`;
                }
            }
        } catch (err) {
            return '';
        }

        return '';
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
            elements.videoPreview.innerHTML = 'Link YouTube chưa đúng định dạng. Ví dụ: https://www.youtube.com/watch?v=abc';
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

    function renderCategoryOptions() {
        if (!elements.postCategory || !elements.userCategoryFilter) return;

        const options = categories
            .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
            .join('');

        elements.postCategory.innerHTML = '<option value="" disabled selected>Chọn danh mục</option>' + options;
        elements.userCategoryFilter.innerHTML = '<option value="">Tất cả danh mục</option>' + options;
    }

    function renderCategoryList() {
        if (!elements.categoryList) return;
        if (!categories.length) {
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
        if (!posts.length) {
            elements.adminPostList.innerHTML = '<p class="muted">Chưa có bài viết nào.</p>';
            return;
        }

        const sorted = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        elements.adminPostList.innerHTML = sorted
            .map((post) => {
                const category = categories.find((c) => c.id === post.categoryId);
                const videoLabel = post.videoUrl ? '<span class="pill-label">Video</span>' : '';
                return `
                <article class="admin-post">
                    <div>
                        <h4>${post.title}</h4>
                        <p class="muted">${category ? category.name : 'Không rõ danh mục'} • ${formatDate(post.createdAt)} ${videoLabel}</p>
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

        const filtered = posts
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
                const newBadge = isNewPost(post.createdAt)
                    ? '<span class="badge">Mới</span>'
                    : '';
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
        elements.postId.value = '';
        elements.postTitle.value = '';
        elements.postCategory.value = '';
        elements.postExcerpt.value = '';
        elements.postContent.value = '';
        elements.postVideoUrl.value = '';
        renderVideoPreview('');
        elements.postForm.querySelector('button[type="submit"]').textContent = 'Lưu bài viết';
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
        categories.push(newCategory);
        saveData();
        renderCategoryOptions();
        renderCategoryList();
        elements.categoryForm.reset();
    }

    function handlePostSubmit(event) {
        event.preventDefault();
        const id = elements.postId.value;
        const title = elements.postTitle.value.trim();
        const categoryId = elements.postCategory.value;
        const excerpt = elements.postExcerpt.value.trim();
        const content = elements.postContent.value.trim();
        const videoUrl = elements.postVideoUrl.value.trim();

        if (!title || !categoryId || !excerpt || !content) return;

        if (id) {
            const idx = posts.findIndex((p) => p.id === id);
            if (idx !== -1) {
                posts[idx] = { ...posts[idx], title, categoryId, excerpt, content, videoUrl };
            }
        } else {
            posts.push({
                id: `post-${Date.now()}`,
                title,
                categoryId,
                excerpt,
                content,
                videoUrl,
                createdAt: new Date().toISOString(),
            });
        }

        saveData();
        renderPosts();
        renderAdminPosts();
        resetPostForm();
    }

    function handleListClick(event) {
        const deleteCategoryId = event.target.getAttribute('data-delete-category');
        if (deleteCategoryId) {
            const inUse = posts.some((post) => post.categoryId === deleteCategoryId);
            if (inUse) {
                alert('Không thể xóa danh mục đang được sử dụng.');
                return;
            }
            categories = categories.filter((cat) => cat.id !== deleteCategoryId);
            saveData();
            renderCategoryOptions();
            renderCategoryList();
            renderPosts();
            return;
        }

        const editPostId = event.target.getAttribute('data-edit-post');
        if (editPostId) {
            const post = posts.find((p) => p.id === editPostId);
            if (post) {
                elements.postId.value = post.id;
                elements.postTitle.value = post.title;
                elements.postCategory.value = post.categoryId;
                elements.postExcerpt.value = post.excerpt;
                elements.postContent.value = post.content;
                elements.postVideoUrl.value = post.videoUrl || '';
                renderVideoPreview(post.videoUrl || '');
                elements.postForm.querySelector('button[type="submit"]').textContent = 'Cập nhật bài viết';
                window.scrollTo({ top: elements.postForm.offsetTop - 40, behavior: 'smooth' });
            }
            return;
        }

        const deletePostId = event.target.getAttribute('data-delete-post');
        if (deletePostId) {
            posts = posts.filter((p) => p.id !== deletePostId);
            saveData();
            renderPosts();
            renderAdminPosts();
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
    }

    function init() {
        renderCategoryOptions();
        renderCategoryList();
        renderAdminPosts();
        renderPosts();
        renderVideoPreview(elements.postVideoUrl?.value || '');
        bindEvents();
    }

    init();
})();