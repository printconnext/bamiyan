/**
 * admin.js — สคริปต์ควบคุมระบบหลังบ้าน พุทธอุทยานโชคชัย-บามิยัน
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const loginScreen = document.getElementById('loginScreen');
  const pinInput = document.getElementById('pinInput');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  
  const newsList = document.getElementById('newsList');
  const totalNewsCount = document.getElementById('totalNewsCount');
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  
  const openAddModalBtn = document.getElementById('openAddModalBtn');
  const newsModal = document.getElementById('newsModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const newsForm = document.getElementById('newsForm');
  const modalTitle = document.getElementById('modalTitle');
  
  const imageInput = document.getElementById('imageInput');
  const dropzoneArea = document.getElementById('dropzoneArea');
  const previewContainer = document.getElementById('previewContainer');
  const previewImg = document.getElementById('previewImg');
  const removeImgBtn = document.getElementById('removeImgBtn');
  
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFileInput = document.getElementById('importFileInput');
  const resetBtn = document.getElementById('resetBtn');
  
  const toast = document.getElementById('toast');

  let currentImageData = '';
  let editingId = null;
  let allArticles = [];

  // ─── Authentication (PIN: 0994405888) ─────────────────────
  const CORRECT_PIN = '0994405888';

  function checkAuth() {
    const isAuth = sessionStorage.getItem('bamiyan_admin_auth') === 'true';
    if (isAuth) {
      loginScreen.style.display = 'none';
      loadArticles();
    } else {
      loginScreen.style.display = 'flex';
      pinInput.value = '';
      pinInput.focus();
    }
  }

  function handleLogin() {
    const pin = pinInput.value.trim();
    if (pin === CORRECT_PIN) {
      sessionStorage.setItem('bamiyan_admin_auth', 'true');
      loginScreen.style.display = 'none';
      showToast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับครับ');
      loadArticles();
    } else {
      pinInput.style.borderColor = 'var(--danger)';
      showToast('รหัสผ่าน PIN ไม่ถูกต้อง', true);
      pinInput.value = '';
      pinInput.focus();
    }
  }

  loginBtn.addEventListener('click', handleLogin);
  pinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('bamiyan_admin_auth');
    checkAuth();
    showToast('ออกจากระบบเรียบร้อย');
  });

  // ─── Load & Render Articles ───────────────────────────────
  async function loadArticles() {
    try {
      allArticles = await window.BamiyanNewsDB.getAllNews();
      renderArticles();
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', true);
    }
  }

  function renderArticles() {
    const keyword = searchInput.value.toLowerCase().trim();
    const cat = categoryFilter.value;

    const filtered = allArticles.filter(item => {
      const matchKeyword = !keyword || 
        (item.title && item.title.toLowerCase().includes(keyword)) ||
        (item.excerpt && item.excerpt.toLowerCase().includes(keyword));
      const matchCat = !cat || item.category === cat;
      return matchKeyword && matchCat;
    });

    totalNewsCount.textContent = allArticles.length;

    if (filtered.length === 0) {
      newsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📂</div>
          <h3 style="color:var(--gold-light);margin-bottom:0.5rem;">ไม่พบรายการข่าว/กิจกรรม</h3>
          <p style="color:var(--text-muted);font-size:0.9rem;">กดปุ่ม "+ เพิ่มข่าว/กิจกรรมใหม่" เพื่อเริ่มสร้างเนื้อหา</p>
        </div>
      `;
      return;
    }

    newsList.innerHTML = filtered.map(item => {
      const imgHtml = item.image 
        ? `<img src="${item.image}" alt="${escapeHtml(item.title)}" onerror="this.onerror=null;this.parentElement.innerHTML='<span class=\\'placeholder-icon\\'>🖼️</span>';" />`
        : `<span class="placeholder-icon">${item.emoji || '📰'}</span>`;

      return `
        <div class="manage-card" data-id="${item.id}">
          <div class="manage-card-thumb">
            ${imgHtml}
            <span class="manage-card-tag">${escapeHtml(item.category || 'ทั่วไป')}</span>
          </div>
          <div class="manage-card-body">
            <div class="manage-card-date">📅 ${escapeHtml(item.date || '')}</div>
            <h3 class="manage-card-title">${escapeHtml(item.title || '')}</h3>
            <p class="manage-card-excerpt">${escapeHtml(item.excerpt || '')}</p>
            <div class="manage-card-actions">
              <button class="btn btn-outline btn-sm edit-btn" data-id="${item.id}">
                ✏️ แก้ไข
              </button>
              <button class="btn btn-danger btn-sm delete-btn" data-id="${item.id}">
                🗑️ ลบ
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach Event Listeners
    newsList.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });

    newsList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => handleDelete(btn.dataset.id));
    });
  }

  searchInput.addEventListener('input', renderArticles);
  categoryFilter.addEventListener('change', renderArticles);

  // ─── Modal Open / Close ───────────────────────────────────
  function openAddModal() {
    editingId = null;
    modalTitle.textContent = 'เพิ่มข่าว/กิจกรรมใหม่';
    newsForm.reset();
    currentImageData = '';
    previewContainer.style.display = 'none';
    dropzoneArea.style.display = 'block';

    // ใส่วันที่ปัจจุบันแบบไทย
    const today = new Date();
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    document.getElementById('newsDate').value = `${today.getDate()} ${thaiMonths[today.getMonth()]} ${today.getFullYear() + 543}`;

    newsModal.classList.add('active');
  }

  async function openEditModal(id) {
    editingId = id;
    const item = await window.BamiyanNewsDB.getNewsById(id);
    if (!item) return;

    modalTitle.textContent = 'แก้ไขข่าว/กิจกรรม';
    document.getElementById('newsTitle').value = item.title || '';
    document.getElementById('newsCategory').value = item.category || 'ข่าวกิจกรรม';
    document.getElementById('newsDate').value = item.date || '';
    document.getElementById('newsExcerpt').value = item.excerpt || '';
    document.getElementById('newsContent').value = item.content || '';

    currentImageData = item.image || '';
    if (currentImageData) {
      previewImg.src = currentImageData;
      previewContainer.style.display = 'block';
      dropzoneArea.style.display = 'none';
    } else {
      previewContainer.style.display = 'none';
      dropzoneArea.style.display = 'block';
    }

    newsModal.classList.add('active');
  }

  function closeModal() {
    newsModal.classList.remove('active');
    editingId = null;
    newsForm.reset();
  }

  openAddModalBtn.addEventListener('click', openAddModal);
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  newsModal.addEventListener('click', (e) => {
    if (e.target === newsModal) closeModal();
  });

  // ─── Image Upload & Dropzone ──────────────────────────────
  dropzoneArea.addEventListener('click', () => imageInput.click());

  dropzoneArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzoneArea.classList.add('dragover');
  });

  dropzoneArea.addEventListener('dragleave', () => {
    dropzoneArea.classList.remove('dragover');
  });

  dropzoneArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzoneArea.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  });

  imageInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  });

  async function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น', true);
      return;
    }

    showToast('กำลังปรับแต่งและโหลดรูปภาพ...');
    try {
      // ทำการบีบอัดภาพให้อัตโนมัติ (ไม่เกิน 1280px, คุณภาพ 0.85)
      const compressed = await window.BamiyanNewsDB.compressImage(file, 1280, 800, 0.85);
      currentImageData = compressed;
      previewImg.src = compressed;
      previewContainer.style.display = 'block';
      dropzoneArea.style.display = 'none';
      showToast('อัปโหลดและปรับขนาดภาพสำเร็จ');
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ', true);
    }
  }

  removeImgBtn.addEventListener('click', () => {
    currentImageData = '';
    imageInput.value = '';
    previewContainer.style.display = 'none';
    dropzoneArea.style.display = 'block';
  });

  // ─── Save / Submit Form ───────────────────────────────────
  newsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('newsTitle').value.trim();
    const category = document.getElementById('newsCategory').value;
    const date = document.getElementById('newsDate').value.trim();
    const excerpt = document.getElementById('newsExcerpt').value.trim();
    const content = document.getElementById('newsContent').value.trim();

    if (!title) {
      showToast('กรุณากรอกหัวข้อข่าว/กิจกรรม', true);
      return;
    }

    const payload = {
      id: editingId || undefined,
      title,
      category,
      date,
      excerpt,
      content,
      image: currentImageData,
      emoji: getEmojiForCategory(category)
    };

    try {
      await window.BamiyanNewsDB.saveNews(payload);
      showToast(editingId ? 'แก้ไขข้อมูลเรียบร้อยแล้ว' : 'เพิ่มข่าว/กิจกรรมใหม่สำเร็จ');
      closeModal();
      loadArticles();
    } catch (err) {
      console.error(err);
      showToast('บันทึกข้อมูลไม่สำเร็จ', true);
    }
  });

  // ─── Delete ───────────────────────────────────────────────
  async function handleDelete(id) {
    const item = await window.BamiyanNewsDB.getNewsById(id);
    if (!item) return;

    if (confirm(`คุณต้องการลบข่าว "${item.title}" ใช่หรือไม่?`)) {
      try {
        await window.BamiyanNewsDB.deleteNews(id);
        showToast('ลบรายการข่าวเรียบร้อย');
        loadArticles();
      } catch (err) {
        console.error(err);
        showToast('ลบรายการไม่สำเร็จ', true);
      }
    }
  }

  // ─── Export / Import / Reset ──────────────────────────────
  exportBtn.addEventListener('click', async () => {
    try {
      const json = await window.BamiyanNewsDB.exportNewsJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bamiyan-news-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('ส่งออกข้อมูล JSON สำเร็จ');
    } catch (err) {
      console.error(err);
      showToast('ส่งออกข้อมูลล้มเหลว', true);
    }
  });

  importBtn.addEventListener('click', () => importFileInput.click());

  importFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await window.BamiyanNewsDB.importNewsJSON(ev.target.result);
        showToast('นำเข้าข้อมูลสำเร็จ');
        loadArticles();
      } catch (err) {
        showToast('ไฟล์ JSON ไม่ถูกต้อง', true);
      }
    };
    reader.readAsText(file);
  });

  resetBtn.addEventListener('click', async () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
      await window.BamiyanNewsDB.resetToDefaults();
      showToast('รีเซ็ตข้อมูลเป็นค่าเริ่มต้นเรียบร้อย');
      loadArticles();
    }
  });

  // ─── Helper Functions ─────────────────────────────────────
  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.borderColor = isError ? 'var(--danger)' : 'var(--gold)';
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getEmojiForCategory(cat) {
    switch (cat) {
      case 'ข่าวกิจกรรม': return '🏛️';
      case 'การก่อสร้าง': return '🏗️';
      case 'กิจกรรม': return '📿';
      case 'ธรรมะ': return '📜';
      case 'โครงการ': return '🌸';
      default: return '📰';
    }
  }

  // เริ่มต้นตรวจสอบการล็อกอิน
  checkAuth();
});
