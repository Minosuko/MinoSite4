(function () {
  'use strict';

  const nav = document.getElementById('nav');
  const navItems = document.querySelectorAll('.nav-item');
  const indicator = document.getElementById('navIndicator');
  let tabs = {
    home: document.getElementById('tab-home'),
    project: document.getElementById('tab-project'),
    contract: document.getElementById('tab-contract'),
    commission: document.getElementById('tab-commission'),
  };
  const themeToggle = document.getElementById('themeToggle');
  const themeTransition = document.querySelector('.theme-transition');

  let currentTab = 'home';
  let switchTimer;

  function getStorageTheme() {
    try {
      return localStorage.getItem('mino-theme');
    } catch (e) {
      return null;
    }
  }

  function setStorageTheme(theme) {
    try {
      localStorage.setItem('mino-theme', theme);
    } catch (e) {}
  }

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function initTheme() {
    var saved = getStorageTheme();
    if (saved) {
      applyTheme(saved);
    } else {
      applyTheme(getSystemTheme());
    }
  }

  themeToggle.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    themeTransition.classList.add('active');
    setStorageTheme(next);
    setTimeout(function () {
      applyTheme(next);
      setTimeout(function () {
        themeTransition.classList.remove('active');
      }, 50);
    }, 150);
  });

  function updateIndicator(target) {
    var glass = nav.querySelector('.nav-glass');
    var pad = parseFloat(getComputedStyle(indicator).left) || 0;
    var offset = target.offsetLeft - pad;
    indicator.style.setProperty('--indicator-offset', offset + 'px');
    indicator.style.setProperty('--indicator-width', target.offsetWidth + 'px');
  }

  function switchTab(tabId) {
    if (tabId === currentTab) return;
    if (switchTimer) clearTimeout(switchTimer);

    var oldTab = tabs[currentTab];
    var newTab = tabs[tabId];

    for (var key in tabs) {
      if (tabs[key]) tabs[key].classList.remove('leaving', 'entering');
    }

    oldTab.classList.add('leaving');
    oldTab.classList.remove('active');

    navItems.forEach(function (item) {
      item.classList.toggle('active', item.dataset.tab === tabId);
    });

    updateIndicator(document.querySelector('.nav-item[data-tab="' + tabId + '"]'));

    currentTab = tabId;

    switchTimer = setTimeout(function () {
      oldTab.classList.remove('leaving');
      newTab.classList.add('entering');
      newTab.classList.add('active');
      switchTimer = setTimeout(function () {
        newTab.classList.remove('entering');
      }, 380);
    }, 350);
  }

  navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      var tabId = item.dataset.tab;
      if (tabs[tabId]) {
        switchTab(tabId);
      } else {
        navigateTo('index.html');
      }
    });
  });

  function refreshIndicator() {
    var activeItem = document.querySelector('.nav-item.active');
    if (activeItem) updateIndicator(activeItem);
  }

  function initNav() {
    var found = false;
    for (var key in tabs) {
      if (tabs[key] && tabs[key].classList.contains('active')) {
        currentTab = key;
        navItems.forEach(function (item) {
          item.classList.toggle('active', item.dataset.tab === key);
        });
        found = true;
        break;
      }
    }
    if (!found) {
      var firstKey = null;
      for (var k in tabs) { firstKey = k; break; }
      if (firstKey && tabs[firstKey]) {
        tabs[firstKey].classList.add('active');
        currentTab = firstKey;
        navItems[0].classList.add('active');
      } else {
        currentTab = 'home';
      }
    }
    refreshIndicator();
  }

  function handleResize() {
    var activeItem = document.querySelector('.nav-item.active');
    if (activeItem) updateIndicator(activeItem);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 100);
  });

  var systemThemeQuery = window.matchMedia('(prefers-color-scheme: light)');
  systemThemeQuery.addEventListener('change', function () {
    if (!getStorageTheme()) {
      applyTheme(getSystemTheme());
    }
  });

  initTheme();
  initNav();

  function navigateTo(url) {
    var overlay = document.getElementById('pageOverlay');
    if (!overlay) { window.location.href = url; return; }
    overlay.classList.add('active');
    setTimeout(function () { window.location.href = url; }, 350);
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-nav]');
    if (!link) return;
    e.preventDefault();
    navigateTo(link.getAttribute('href'));
  });

  function loadCommissionData() {
    fetch('commstatus.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        function fillCard(section, secData) {
          var priceEl = document.getElementById(section + 'Price');
          var descEl = document.getElementById(section + 'Desc');
          var typesEl = document.getElementById(section + 'Types');
          var delEl = document.getElementById(section + 'Delivery');
          var statusEl = document.getElementById(section + 'Status');
          if (priceEl) priceEl.textContent = secData.price;
          if (descEl) descEl.textContent = secData.description;
          if (typesEl) {
            typesEl.innerHTML = '';
            if (secData.types) {
              secData.types.forEach(function (t) {
                var tag = document.createElement('span');
                tag.className = 'comm-type-tag';
                tag.textContent = t;
                typesEl.appendChild(tag);
              });
            }
          }
          if (delEl && secData.delivery) {
            delEl.innerHTML = '<span class="material-symbols-outlined">schedule</span> ' + secData.delivery;
          }
          if (statusEl && secData.status !== undefined) {
            var dot = statusEl.querySelector('.comm-status-dot');
            if (dot) dot.setAttribute('data-status', String(secData.status));
            var labels = ['Closed', 'Open', 'Temporarily closed', 'Queue full'];
            if (statusEl.lastChild) statusEl.lastChild.textContent = labels[secData.status] || 'Unknown';
          }
        }

        if (data.art) fillCard('art', data.art);
        if (data.dev) fillCard('dev', data.dev);

        var notesEl = document.getElementById('commNotes');
        if (notesEl && data.details && data.details.notes) {
          notesEl.textContent = data.details.notes;
        }

        var contactEl = document.getElementById('commOrderContact');
        if (contactEl && data.details) contactEl.textContent = data.details.contact || '';
      })
      .catch(function () {
        var els = document.querySelectorAll('.comm-card-status');
        els.forEach(function (e) { if (e.lastChild) e.lastChild.textContent = 'Unavailable'; });
      });
  }

  var OUTER = 10;
  var INNER = 8;
  var loadingDone = false;
  var loaderStart = Date.now();
  var loaderEl = document.getElementById('loader');
  var lotus = document.getElementById('lotus');
  var lotusGlow = document.getElementById('lotusGlow');
  var pond = document.getElementById('lotusPond');

  var gradPool = [
    'linear-gradient(to top, var(--petal-base), var(--teal))',
    'linear-gradient(to top, var(--petal-base), var(--steel))',
    'linear-gradient(to top, var(--petal-base), var(--rose))',
    'linear-gradient(to top, var(--petal-base), var(--teal))',
  ];

  function makePetal(layer, i, total) {
    var angle = (i / total) * 360;
    var off = layer === 'inner' ? 18 : 0;
    var isOuter = layer === 'outer';
    var g = gradPool[i % gradPool.length];

    var el = document.createElement('div');
    el.className = 'lotus-petal lotus-petal--' + layer;
    el.style.setProperty('--r', (angle + off) + 'deg');
    el.style.setProperty('--o', isOuter ? '0.65' : '0.8');
    el.style.animationDelay = (0.06 * i) + 's';
    el.style.background = g;
    el.style.zIndex = isOuter ? '1' : '3';
    el.style.boxShadow = 'inset 0 -4px 8px rgba(0,0,0,0.08)';
    lotus.appendChild(el);
  }

  function buildLotus() {
    for (var i = 0; i < OUTER; i++) makePetal('outer', i, OUTER);
    for (var i = 0; i < INNER; i++) makePetal('inner', i, INNER);

    var c = document.createElement('div');
    c.className = 'lotus-center';
    c.id = 'lotusCenter';
    lotus.appendChild(c);

    for (var r = 0; r < 3; r++) {
      var rip = document.createElement('div');
      rip.className = 'lotus-ripple';
      pond.appendChild(rip);
    }
  }

  function fireRipple() {
    var rips = pond.querySelectorAll('.lotus-ripple');
    rips.forEach(function (r, idx) {
      r.classList.remove('active');
      void r.offsetWidth;
      r.style.animationDelay = (idx * 0.25) + 's';
      r.classList.add('active');
    });
  }

  function sparkleCenter() {
    var c = document.getElementById('lotusCenter');
    if (!c) return;
    c.classList.remove('sparkle');
    void c.offsetWidth;
    c.classList.add('sparkle');
  }

  function onLotusTap() {
    if (loadingDone) return;
    fireRipple();
    sparkleCenter();
  }

  lotus.addEventListener('click', onLotusTap);
  lotus.addEventListener('touchend', function (e) {
    e.preventDefault();
    onLotusTap();
  });

  function hideLoader() {
    if (loadingDone) return;
    loadingDone = true;

    var elapsed = Date.now() - loaderStart;
    var remaining = Math.max(0, 600 - elapsed);

    setTimeout(function () {
      var allPetals = lotus.querySelectorAll('.lotus-petal');
      allPetals.forEach(function (p) {
        var r = p.style.getPropertyValue('--r') || '0deg';
        p.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        p.style.transform = 'rotate(' + r + ') scaleY(0) scaleX(0.3)';
        p.style.opacity = '0';
      });

      var center = document.getElementById('lotusCenter');
      if (center) {
        center.style.transition = 'transform 0.3s ease';
        setTimeout(function () {
          center.style.transform = 'scale(0)';
        }, 750);
      }

      lotusGlow.style.transition = 'opacity 0.6s ease';
      lotusGlow.style.opacity = '0';

      setTimeout(function () {
        loaderEl.classList.add('hidden');
        document.body.classList.remove('loading');
        refreshIndicator();
        setTimeout(refreshIndicator, 200);
      }, 900);
    }, remaining);
  }

  buildLotus();

  if (document.querySelector('.comm-grid')) {
    loadCommissionData();
  }

  document.fonts.ready.then(function () {
    var elapsed = Date.now() - loaderStart;
    if (elapsed < 1800) {
      setTimeout(hideLoader, 1800 - elapsed);
    } else {
      setTimeout(hideLoader, 200);
    }
  });
  setTimeout(hideLoader, 6000);
})();
