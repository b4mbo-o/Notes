document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  applyCardTilt();
  initSearch();
  initSort();
  initViewCount();
  initNav();
});

function initTheme() {
  const themeBtn = document.getElementById('theme-toggle');
  const setTheme = (nextTheme) => {
    document.body.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (themeBtn) themeBtn.setAttribute('aria-pressed', nextTheme === 'dark' ? 'true' : 'false');
  };

  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme || document.body.getAttribute('data-theme') || 'dark';
  setTheme(initialTheme);

  themeBtn?.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  });
}

function applyCardTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll('.link-card').forEach((card) => {
    if (card.dataset.tiltBound === '1') return;
    card.dataset.tiltBound = '1';

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
  });
}

function initSearch() {
  const toggle = document.querySelector('[data-search-toggle]');
  const overlay = document.getElementById('search-overlay');
  const closeBtn = document.querySelector('[data-search-close]');
  const input = document.getElementById('search-input');
  const resultsEl = document.getElementById('search-results');
  let index = [];
  let loaded = false;

  const renderResults = (items, keyword) => {
    if (!items.length) {
      resultsEl.innerHTML = `<p class="muted">「${keyword}」に一致する記事がありません</p>`;
      return;
    }
    resultsEl.innerHTML = items
      .map(
        (item) => `
        <a class="card link-card note-card" href="${item.url}">
          <div class="card-top">
            <span class="service-name">${item.title}</span>
            <span class="status-dot"></span>
          </div>
          <p class="service-desc">${item.description}</p>
          <div class="tags">${item.tags.map((t) => `<span class="tag-pill">#${t}</span>`).join('')}</div>
          <div class="card-footer">🗓 ${new Date(item.published).toLocaleDateString('ja-JP')}</div>
        </a>`
      )
      .join('');
  };

  const open = async () => {
    if (!loaded) {
      try {
        const res = await fetch('/posts.json');
        index = await res.json();
        loaded = true;
      } catch (e) {
        resultsEl.innerHTML = '<p class="muted">検索インデックスの取得に失敗しました</p>';
      }
    }
    overlay?.classList.add('active');
    overlay?.setAttribute('aria-hidden', 'false');
    input?.focus();
  };

  const close = () => {
    overlay?.classList.remove('active');
    overlay?.setAttribute('aria-hidden', 'true');
    if (input) input.value = '';
    resultsEl.innerHTML = '<p class="muted">キーワードを入力してください</p>';
  };

  toggle?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      open();
    }
  });

  input?.addEventListener('input', (e) => {
    const keyword = e.target.value.trim();
    if (!keyword) {
      resultsEl.innerHTML = '<p class="muted">キーワードを入力してください</p>';
      return;
    }
    const lower = keyword.toLowerCase();
    const hits = index.filter((item) => {
      return (
        item.title.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower) ||
        (item.tags || []).some((t) => t.toLowerCase().includes(lower))
      );
    });
    renderResults(hits, keyword);
  });
}

function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const panel = document.querySelector('[data-nav-panel]');
  const nav = document.querySelector('[data-nav]');
  const overlay = document.querySelector('[data-nav-overlay]');
  if (!toggle || !panel) return;

  const close = () => {
    panel.classList.remove('open');
    toggle.classList.remove('open');
    overlay?.classList.remove('show');
    toggle.querySelectorAll('span').forEach((s) => (s.style.opacity = '1'));
  };

  toggle.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    overlay?.classList.toggle('show', isOpen);
    toggle.querySelectorAll('span').forEach((s, i) => {
      // 中央のバーはX化時に完全非表示
      s.style.opacity = isOpen && i === 1 ? '0' : '1';
    });
  });

  panel.querySelectorAll('a, button').forEach((el) => {
    el.addEventListener('click', close);
  });

  document.addEventListener('click', (e) => {
    if (!panel.classList.contains('open')) return;
    if (!panel.contains(e.target) && !toggle.contains(e.target) && !nav?.contains(e.target)) {
      close();
    }
  });
}

function initSort() {
  const buttons = document.querySelectorAll('.sort-btn');
  const viewCounts = getViewCounts();

  const applySort = (targetId, mode) => {
    const wrapper = document.getElementById(targetId);
    if (!wrapper) return;
    const cards = Array.from(wrapper.children).filter((el) => el.classList.contains('link-card'));
    const sorted = cards.sort((a, b) => {
      if (mode === 'popular') {
        const ca = viewCounts[a.dataset.slug] || 0;
        const cb = viewCounts[b.dataset.slug] || 0;
        if (cb !== ca) return cb - ca;
      }
      const da = Number(a.dataset.date || 0);
      const db = Number(b.dataset.date || 0);
      return db - da;
    });
    wrapper.innerHTML = '';
    sorted.forEach((c) => wrapper.appendChild(c));
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      const mode = btn.dataset.sort;
      if (!target || !mode) return;
      buttons.forEach((b) => {
        if (b.dataset.target === target) b.classList.remove('active');
      });
      btn.classList.add('active');
      applySort(target, mode);
    });
  });
}

function initViewCount() {
  if (document.body.dataset.page !== 'post') return;
  const slug = document.body.dataset.slug;
  if (!slug) return;
  const counts = getViewCounts();
  counts[slug] = (counts[slug] || 0) + 1;
  localStorage.setItem('view-counts', JSON.stringify(counts));
  const label = document.querySelector('[data-view-count]');
  if (label) label.textContent = `閲覧数: ${counts[slug]}`;
}

function getViewCounts() {
  try {
    const raw = localStorage.getItem('view-counts');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
