/*!
 * Desktop-note 官网 · 交互
 * 纯原生、无依赖。三件事：导航描边、滚动进场、隐私政策页目录高亮。
 * 所有动效在 prefers-reduced-motion 下自动收敛（CSS 里已收敛表现，这里收敛行为）。
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 导航：滚过首屏后加一条发丝分隔线 ---------- */
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () {
      nav.setAttribute('data-scrolled', window.scrollY > 8 ? 'true' : 'false');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- 2. 滚动进场 ---------- */
  var revealables = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window) || reduceMotion) {
    // 不支持观察器，或用户要求减少动态效果：直接呈现，不做位移
    Array.prototype.forEach.call(revealables, function (el) {
      el.classList.add('is-visible');
    });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          // 进场只用一次，入场后取消观察，避免来回滚动时反复触发
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );
    Array.prototype.forEach.call(revealables, function (el) {
      io.observe(el);
    });
  }

  /* ---------- 3. 隐私政策页：随滚动点亮当前小节 ---------- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.doc-toc a[href^="#"]'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var sectionMap = {};
    var sections = [];

    tocLinks.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      sectionMap[id] = link;
      sections.push(target);
    });

    var visible = new Set();

    var tocIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        });

        // 当前可见集合里最靠前的那一节，才点亮（避免同时高亮好几个）
        var activeId = null;
        for (var i = 0; i < sections.length; i++) {
          if (visible.has(sections[i].id)) {
            activeId = sections[i].id;
            break;
          }
        }

        tocLinks.forEach(function (link) {
          var on = activeId && link.getAttribute('href') === '#' + activeId;
          if (on) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    sections.forEach(function (s) {
      tocIO.observe(s);
    });
  }

  /* ---------- 4. 页脚年份 ---------- */
  var year = document.querySelector('[data-year]');
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }
})();
