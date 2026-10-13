/* ============================================================
   พุทธอุทยานโชคชัย-บามิยัน — Main JavaScript
   ============================================================ */

'use strict';

// ─── Navbar scroll behavior ──────────────────────────────────
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

function handleNavbarScroll() {
  const current = window.scrollY;
  if (current > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  lastScroll = current;
}
window.addEventListener('scroll', handleNavbarScroll, { passive: true });

// ─── Mobile nav ──────────────────────────────────────────────
const hamburger = document.querySelector('.nav-hamburger');
const mobileNav = document.querySelector('.mobile-nav');
const mobileClose = document.querySelector('.mobile-nav-close');

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    mobileNav.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
  mobileClose?.addEventListener('click', closeMobileNav);
  mobileNav.addEventListener('click', (e) => {
    if (e.target === mobileNav) closeMobileNav();
  });
}
function closeMobileNav() {
  mobileNav?.classList.remove('open');
  document.body.style.overflow = '';
}
document.querySelectorAll('.mobile-nav .nav-link').forEach(link => {
  link.addEventListener('click', closeMobileNav);
});

// ─── Scroll Reveal ───────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, entry.target.dataset.delay ? parseInt(entry.target.dataset.delay) : 0);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el, i) => {
  revealObserver.observe(el);
});

// ─── Staggered children reveal ───────────────────────────────
document.querySelectorAll('.stagger-children').forEach(parent => {
  Array.from(parent.children).forEach((child, i) => {
    child.classList.add('reveal');
    child.dataset.delay = String(i * 120);
    revealObserver.observe(child);
  });
});

// ─── Masterplan interactive ──────────────────────────────────
const masterplanItems = document.querySelectorAll('.masterplan-item');
const masterplanHotspots = document.querySelectorAll('.masterplan-hotspot');

function activateMasterplanItem(id) {
  masterplanItems.forEach(item => item.classList.remove('active'));
  masterplanHotspots.forEach(spot => spot.classList.remove('active'));
  const activeItem = document.querySelector(`.masterplan-item[data-id="${id}"]`);
  const activeSpot = document.querySelector(`.masterplan-hotspot[data-id="${id}"]`);
  if (activeItem) activeItem.classList.add('active');
  if (activeSpot) activeSpot.classList.add('active');
}

masterplanItems.forEach(item => {
  item.addEventListener('click', () => activateMasterplanItem(item.dataset.id));
});
masterplanHotspots.forEach(spot => {
  spot.addEventListener('click', () => activateMasterplanItem(spot.dataset.id));
});

// Activate first item by default
if (masterplanItems.length) activateMasterplanItem('1');

// ─── Animated counters ───────────────────────────────────────
function animateCounter(el, target, suffix = '') {
  const duration = 2000;
  const start = performance.now();
  const isFloat = String(target).includes('.');

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = isFloat
      ? (eased * target).toFixed(1)
      : Math.floor(eased * target);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseFloat(el.dataset.target || '0');
      const suffix = el.dataset.suffix || '';
      animateCounter(el, target, suffix);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-counter]').forEach(el => {
  counterObserver.observe(el);
});

// ─── Smooth scroll for nav links ─────────────────────────────
document.querySelectorAll('a[href^="#"], [data-target]').forEach(link => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href')?.replace('#', '') || link.dataset.target;
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      e.preventDefault();
      const offset = navbar ? navbar.offsetHeight + 20 : 80;
      const top = targetEl.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
      closeMobileNav();
    }
  });
});

// ─── Active nav highlighting ─────────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    }
  });
}, { threshold: 0.35 });

sections.forEach(section => sectionObserver.observe(section));

// ─── Language switcher ───────────────────────────────────────
const langBtn = document.querySelector('.nav-lang');
let currentLang = 'TH';

const langData = {
  TH: {
    label: 'TH',
    heroTitle: 'จากพุทธะบามิยัน\nสู่พุทธอุทยานแห่งศรัทธา',
    heroSub: 'ณ โชคชัย นครราชสีมา',
  },
  EN: {
    label: 'EN',
    heroTitle: 'From the Buddhas of Bamiyan\nTo a Park of Faith',
    heroSub: 'Chokchai, Nakhon Ratchasima',
  },
};

if (langBtn) {
  langBtn.addEventListener('click', () => {
    currentLang = currentLang === 'TH' ? 'EN' : 'TH';
    langBtn.textContent = langData[currentLang].label;
    document.querySelectorAll('[data-lang-th]').forEach(el => {
      el.style.display = currentLang === 'TH' ? '' : 'none';
    });
    document.querySelectorAll('[data-lang-en]').forEach(el => {
      el.style.display = currentLang === 'EN' ? '' : 'none';
    });
  });
}

// ─── Parallax hero ───────────────────────────────────────────
const heroBg = document.querySelector('.hero-bg');
if (heroBg) {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (scrolled < window.innerHeight) {
      heroBg.style.transform = `scale(1) translateY(${scrolled * 0.25}px)`;
    }
  }, { passive: true });
}

// ─── Tab system ──────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.dataset.group;
    const target = btn.dataset.tab;
    document.querySelectorAll(`.tab-btn[data-group="${group}"]`).forEach(b => {
      b.classList.toggle('active', b === btn);
    });
    document.querySelectorAll(`.tab-panel[data-group="${group}"]`).forEach(panel => {
      panel.classList.toggle('active', panel.dataset.tab === target);
    });
  });
});

// ─── Dynamic News & Article Reader Modal ──────────────────────
async function loadDynamicNews() {
  const newsGrid = document.getElementById('newsGrid');
  if (!newsGrid || !window.BamiyanNewsDB) return;

  try {
    const list = await window.BamiyanNewsDB.getAllNews();
    if (!list || list.length === 0) return;

    newsGrid.innerHTML = list.map((item, index) => {
      const imgHtml = item.image
        ? `<img src="${item.image}" alt="${escapeHtml(item.title)}" onerror="this.onerror=null;this.parentElement.innerHTML='<span style=\\'font-size:2.5rem;\\'>🖼️</span>';" />`
        : `<span style="font-size:2.5rem;">${item.emoji || '📰'}</span>`;

      return `
        <div class="news-card" data-news-id="${item.id}" style="transition-delay:${index * 0.1}s;">
          <div class="news-card-img">
            ${imgHtml}
            <span class="news-card-category">${escapeHtml(item.category || 'ข่าวกิจกรรม')}</span>
          </div>
          <div class="news-card-body">
            <div class="news-card-date">${escapeHtml(item.date || '')}</div>
            <h3 class="news-card-title">${escapeHtml(item.title || '')}</h3>
            <p class="news-card-excerpt">${escapeHtml(item.excerpt || '')}</p>
          </div>
        </div>
      `;
    }).join('');

    // Attach click to open reader modal
    newsGrid.querySelectorAll('.news-card').forEach(card => {
      card.addEventListener('click', () => {
        openArticleModal(card.dataset.newsId);
      });
    });

  } catch (e) {
    console.error('Failed to load dynamic news:', e);
  }
}

// Modal Reader
const articleModal = document.getElementById('articleModal');
const articleModalClose = document.getElementById('articleModalClose');
const articleModalImgWrap = document.getElementById('articleModalImgWrap');
const articleModalImg = document.getElementById('articleModalImg');
const articleModalTag = document.getElementById('articleModalTag');
const articleModalDate = document.getElementById('articleModalDate');
const articleModalTitle = document.getElementById('articleModalTitle');
const articleModalBody = document.getElementById('articleModalBody');

async function openArticleModal(id) {
  if (!articleModal || !window.BamiyanNewsDB) return;
  const item = await window.BamiyanNewsDB.getNewsById(id);
  if (!item) return;

  articleModalTitle.textContent = item.title || '';
  articleModalTag.textContent = item.category || 'ข่าวกิจกรรม';
  articleModalDate.textContent = item.date ? `📅 ${item.date}` : '';
  articleModalBody.textContent = item.content || item.excerpt || '';

  if (item.image) {
    articleModalImg.src = item.image;
    articleModalImgWrap.style.display = 'block';
  } else {
    articleModalImgWrap.style.display = 'none';
  }

  articleModal.style.display = 'flex';
  requestAnimationFrame(() => {
    articleModal.classList.add('active');
  });
  document.body.style.overflow = 'hidden';
}

function closeArticleModal() {
  if (!articleModal) return;
  articleModal.classList.remove('active');
  setTimeout(() => {
    articleModal.style.display = 'none';
    document.body.style.overflow = '';
  }, 250);
}

if (articleModalClose) {
  articleModalClose.addEventListener('click', closeArticleModal);
}
if (articleModal) {
  articleModal.addEventListener('click', (e) => {
    if (e.target === articleModal) closeArticleModal();
  });
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

window.addEventListener('bamiyan_news_updated', () => {
  loadDynamicNews();
});

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  handleNavbarScroll();
  loadDynamicNews();
  // Add stagger delays to grid children
  document.querySelectorAll('.arch-grid, .dharma-grid, .donate-options, .news-grid').forEach(grid => {
    Array.from(grid.children).forEach((child, i) => {
      if (!child.style.transitionDelay) {
        child.style.transitionDelay = `${i * 0.1}s`;
      }
    });
  });
});

