(function () {
    const STORAGE_KEYS = {
        contacts: 'bycContactPosts',
        gallery: 'noiVienGallery',
        schedules: 'noiVienSchedules',
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

    function saveData(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function formatDateTime(value) {
        const date = new Date(value);
        return date.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    function normalizeYoutube(url) {
        if (!url) return '';
        try {
            const parsed = new URL(url.trim());
            const host = parsed.hostname.replace('www.', '');

            if (host === 'youtu.be') {
                return `https://youtu.be/${parsed.pathname.replace('/', '')}`;
            }

            if (host.includes('youtube.com')) {
                if (parsed.searchParams.get('v')) {
                    return `https://www.youtube.com/watch?v=${parsed.searchParams.get('v')}`;
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

    // -------- CONTACT POSTS --------
    function initContactModule() {
        const form = document.getElementById('contactForm');
        const list = document.getElementById('contactList');
        if (!form || !list) return;

        let contacts = loadData(STORAGE_KEYS.contacts, []);

        function renderContacts() {
            if (!contacts.length) {
                list.innerHTML = '<p class="muted">Chưa có liên hệ nào được lưu.</p>';
                return;
            }

            list.innerHTML = contacts
                .map((item) => {
                    const youtube = normalizeYoutube(item.youtube);
                    const youtubeLink = youtube ? `<a href="${youtube}" target="_blank" rel="noopener">${youtube}</a>` : '';
                    return `
                    <article class="contact-card">
                        <div>
                            <p><strong>Số điện thoại:</strong> ${item.phone || '—'}</p>
                            <p><strong>Zalo:</strong> ${item.zalo || '—'}</p>
                            <p><strong>Kênh YouTube:</strong> ${youtubeLink || 'Chưa cung cấp'}</p>
                            <p class="muted">Ghi chú: ${item.note || 'Không có'}</p>
                        </div>
                        <span class="timestamp">${formatDateTime(item.createdAt)}</span>
                    </article>
                `;
                })
                .join('');
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const phone = form.contactPhone.value.trim();
            const zalo = form.contactZalo.value.trim();
            const youtube = form.contactYoutube.value.trim();
            const note = form.contactNote.value.trim();

            if (!phone && !zalo && !youtube) {
                alert('Nhập ít nhất một cách để liên hệ (số điện thoại / Zalo / YouTube).');
                return;
            }

            const entry = {
                id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
                phone,
                zalo,
                youtube,
                note,
                createdAt: new Date().toISOString(),
            };

            contacts = [entry, ...contacts];
            saveData(STORAGE_KEYS.contacts, contacts);
            form.reset();
            renderContacts();
        });

        renderContacts();
    }

    // -------- NỘI VIỆN GALLERY --------
    function initGalleryModule() {
        const form = document.getElementById('galleryForm');
        const list = document.getElementById('galleryGrid');
        if (!form || !list) return;

        let gallery = loadData(STORAGE_KEYS.gallery, [
            {
                id: 'g1',
                title: 'Buổi nhập môn Tử Vi',
                course: 'Tử Vi',
                imageUrl: 'assets/img/khai-mon-hero.png',
            },
            {
                id: 'g2',
                title: 'Thiền đường Tâm Cảnh',
                course: 'Thiền định',
                imageUrl: 'assets/img/tam-canh-hero.png',
            },
            {
                id: 'g3',
                title: 'Sinh hoạt Nội viện',
                course: 'Nội viện',
                imageUrl: 'assets/img/bach-y-vien.png',
            },
        ]);

        function renderGallery() {
            if (!gallery.length) {
                list.innerHTML = '<p class="muted">Chưa có ảnh nào được lưu.</p>';
                return;
            }

            list.innerHTML = gallery
                .map(
                    (item) => `
                    <figure class="gallery-card">
                        <div class="gallery-thumb" style="background-image: url('${item.imageUrl}')"></div>
                        <figcaption>
                            <p class="gallery-title">${item.title}</p>
                            <p class="muted">${item.course || 'Khóa học'}</p>
                        </figcaption>
                    </figure>
                `
                )
                .join('');
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = form.galleryTitle.value.trim();
            const course = form.galleryCourse.value.trim();
            const imageUrl = form.galleryImageUrl.value.trim();

            if (!title || !imageUrl) {
                alert('Nhập đầy đủ tiêu đề và đường dẫn ảnh.');
                return;
            }

            const item = {
                id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
                title,
                course: course || 'Khóa học',
                imageUrl,
            };

            gallery = [item, ...gallery];
            saveData(STORAGE_KEYS.gallery, gallery);
            form.reset();
            renderGallery();
        });

        renderGallery();
    }

    // -------- NỘI VIỆN SCHEDULE --------
    function initScheduleModule() {
        const form = document.getElementById('scheduleForm');
        const list = document.getElementById('scheduleList');
        if (!form || !list) return;

        let schedules = loadData(STORAGE_KEYS.schedules, [
            {
                id: 's1',
                course: 'Tử Vi Nội môn',
                slot: 'Thứ 4 – 20:00 đến 22:00',
                mentor: 'Sư huynh Trần Quang',
                format: 'Zoom',
            },
            {
                id: 's2',
                course: 'Tứ Trụ căn bản',
                slot: 'Thứ 7 – 09:00 đến 11:00',
                mentor: 'Tịnh Hà',
                format: 'Google Meet',
            },
            {
                id: 's3',
                course: 'Phong Thủy nhập môn',
                slot: 'Chủ nhật – 19:30 đến 21:00',
                mentor: 'Thanh Minh',
                format: 'Trực tiếp tại Nội viện',
            },
        ]);

        function renderSchedule() {
            if (!schedules.length) {
                list.innerHTML = '<p class="muted">Chưa có lịch học nào.</p>';
                return;
            }

            list.innerHTML = schedules
                .map(
                    (item) => `
                    <article class="schedule-card">
                        <div>
                            <p class="schedule-course">${item.course}</p>
                            <p class="schedule-slot">${item.slot}</p>
                            <p class="muted">Người phụ trách: ${item.mentor || 'Đang bổ sung'} · Hình thức: ${item.format || 'Chưa xác định'}</p>
                        </div>
                    </article>
                `
                )
                .join('');
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const course = form.scheduleCourse.value.trim();
            const slot = form.scheduleSlot.value.trim();
            const mentor = form.scheduleMentor.value.trim();
            const format = form.scheduleFormat.value.trim();

            if (!course || !slot) {
                alert('Nhập tên pháp môn và khung giờ học.');
                return;
            }

            const item = {
                id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
                course,
                slot,
                mentor,
                format,
            };

            schedules = [item, ...schedules];
            saveData(STORAGE_KEYS.schedules, schedules);
            form.reset();
            renderSchedule();
        });

        renderSchedule();
    }

    document.addEventListener('DOMContentLoaded', () => {
        initContactModule();
        initGalleryModule();
        initScheduleModule();
    });
})();