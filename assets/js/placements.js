(function () {
    const registry = [
        {
            id: 'blog-main',
            name: 'Trang Bài viết',
            description: 'Luồng chính hiển thị trên trang Bài viết.',
            limit: null,
            renderOnSite: false,
        },
        {
            id: 'homepage-spotlight',
            name: 'Trang chủ – Tin nổi bật',
            description: 'Hiển thị 3 thẻ tóm tắt trên trang chủ.',
            selector: '[data-placement="homepage-spotlight"]',
            limit: 3,
            renderOnSite: true,
        },
        {
            id: 'tam-canh-chuyen',
            name: 'Tâm Cảnh Đường – Chuyện mới',
            description: 'Nhấn mạnh các bài mang chất đời sống, chia sẻ trải nghiệm.',
            selector: '[data-placement="tam-canh-chuyen"]',
            limit: 2,
            renderOnSite: true,
        },
        {
            id: 'van-tam-goi-y',
            name: 'Vấn Tâm Các – Gợi ý đọc',
            description: 'Đề xuất bài đọc trước khi xét duyên nhập môn.',
            selector: '[data-placement="van-tam-goi-y"]',
            limit: 3,
            renderOnSite: true,
        },
    ];

    function formatDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function buildCard(post) {
        const createdLabel = formatDate(post.createdAt);
        return `
            <article class="post-card">
                <div class="post-card-header">
                    <div>
                        <p class="eyebrow">${createdLabel || 'Bài viết'}</p>
                        <h3>${post.title}</h3>
                    </div>
                </div>
                <p>${post.excerpt}</p>
            </article>
        `;
    }

    function renderPlacements() {
        const store = window.BYCContentStore;
        if (!store) return;
        const { posts } = store.getState();

        registry
            .filter((placement) => placement.renderOnSite)
            .forEach((placement) => {
                const containers = document.querySelectorAll(placement.selector || '');
                if (!containers.length) return;

                const matched = posts
                    .filter((post) => (post.placements || []).includes(placement.id))
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                const limited = placement.limit ? matched.slice(0, placement.limit) : matched;

                containers.forEach((container) => {
                    if (!limited.length) {
                        container.innerHTML = '<p class="muted">Chưa có bài viết được gán vị trí này.</p>';
                        return;
                    }
                    container.innerHTML = limited.map(buildCard).join('');
                });
            });
    }

    function setup() {
        const store = window.BYCContentStore;
        if (store?.onChange) {
            store.onChange(renderPlacements);
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', renderPlacements);
        } else {
            renderPlacements();
        }
    }

    setup();

    window.BYCPlacements = {
        list: registry,
        renderPlacements,
    };
})();