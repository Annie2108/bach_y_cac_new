(function () {
    const CATEGORY_KEY = 'bycCategories';
    const POST_KEY = 'bycPosts';

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
            placements: ['blog-main', 'homepage-spotlight', 'van-tam-goi-y'],
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'bai-viet-2',
            title: 'Khai mở Tứ Trụ: đừng bỏ qua trụ giờ',
            categoryId: 'tu-tru',
            excerpt: 'Trụ giờ giúp soi tâm tính và tiềm năng ẩn. Đây là nơi nhiều hành giả mới thường bỏ sót.',
            content: 'Phần này minh họa cách xác định trụ giờ, ghi nhớ thần sát quan trọng và cách kết nối với trụ ngày để luận vận.',
            videoUrl: '',
            placements: ['blog-main', 'homepage-spotlight'],
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'bai-viet-3',
            title: 'Bố trí phòng làm việc hợp phong thủy',
            categoryId: 'phong-thuy',
            excerpt: 'Một số gợi ý nhanh về hướng bàn, ánh sáng và vật phẩm giúp ổn định khí trường.',
            content: 'Chọn vị trí tựa lưng vững chắc, tránh xung trực cửa. Ánh sáng dịu, thêm cây xanh và hạn chế vật sắc nhọn chĩa vào người.',
            videoUrl: '',
            placements: ['blog-main', 'tam-canh-chuyen'],
            createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    const listeners = new Set();

    const slugify = (text) =>
        text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');

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

    function normalizePost(post) {
        const placements = Array.isArray(post.placements) && post.placements.length ? post.placements : ['blog-main'];
        return { ...post, placements };
    }

    let categories = loadData(CATEGORY_KEY, defaultCategories);
    let posts = loadData(POST_KEY, defaultPosts).map(normalizePost);

    function persist() {
        localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
        localStorage.setItem(POST_KEY, JSON.stringify(posts));
    }

    function notify() {
        listeners.forEach((listener) => listener(getState()));
    }

    function getState() {
        return {
            categories: [...categories],
            posts: posts.map((post) => ({ ...post, placements: [...post.placements] })),
        };
    }

    function setCategories(next) {
        categories = Array.isArray(next) ? [...next] : [];
        persist();
        notify();
    }

    function setPosts(next) {
        const updated = typeof next === 'function' ? next(getState().posts) : next;
        posts = Array.isArray(updated) ? updated.map(normalizePost) : [];
        persist();
        notify();
    }

    function onChange(listener) {
        if (typeof listener !== 'function') return () => {};
        listeners.add(listener);
        return () => listeners.delete(listener);
    }

    window.BYCContentStore = {
        getState,
        setCategories,
        setPosts,
        onChange,
        slugify,
        CATEGORY_KEY,
        POST_KEY,
    };
})();