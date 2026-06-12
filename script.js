/* =============================================
   PORTFOLIO — Nitish Chaurasia
   Interactions & Animations
   ============================================= */

(function () {
  'use strict';

  // ---- Custom Cursor ----
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;

  if (dot && ring && window.innerWidth > 768) {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
      requestAnimationFrame(animateRing);
    }
    animateRing();

    // Enlarge on interactive elements
    const interactives = document.querySelectorAll('a, button, .project-card, .service-card, .stack-item, .cert-item, .social-link, input, textarea');
    interactives.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        dot.style.width = '20px';
        dot.style.height = '20px';
        ring.style.width = '60px';
        ring.style.height = '60px';
        ring.style.borderColor = 'var(--accent-purple)';
      });
      el.addEventListener('mouseleave', () => {
        dot.style.width = '12px';
        dot.style.height = '12px';
        ring.style.width = '40px';
        ring.style.height = '40px';
        ring.style.borderColor = 'var(--accent-teal)';
      });
    });
  }

  // ---- Navbar Scroll Compression ----
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  }, { passive: true });

  // ---- Mobile Hamburger ----
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  // ---- Scroll Reveal (IntersectionObserver) ----
  const revealElements = document.querySelectorAll('.reveal, .reveal-left');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');

          // Stagger children
          const children = entry.target.children;
          Array.from(children).forEach((child, i) => {
            child.style.transitionDelay = (i * 0.1) + 's';
            child.style.opacity = '1';
            child.style.transform = 'translate(0, 0)';
          });

          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  // ---- Hero Parallax on Scroll ----
  const heroOrbs = document.querySelector('.hero-orbs');

  window.addEventListener('scroll', () => {
    if (heroOrbs && window.innerWidth > 768) {
      const scrollY = window.scrollY;
      heroOrbs.style.transform = `translateY(${scrollY * 0.3}px)`;
    }
  }, { passive: true });

  // ---- View More Projects ----
  const viewMoreBtn = document.getElementById('viewMoreBtn');
  if (viewMoreBtn) {
    viewMoreBtn.addEventListener('click', () => {
      document.querySelectorAll('.project-card.hidden-initial').forEach(card => {
        card.classList.remove('hidden-initial');
      });
      viewMoreBtn.style.display = 'none';
    });
  }

  // ---- Project Filter ----
  const filterPills = document.querySelectorAll('.filter-pill');
  const projectCards = document.querySelectorAll('.project-card');

  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      // Update active pill
      filterPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      const filter = pill.dataset.filter;

      if (viewMoreBtn) viewMoreBtn.style.display = 'none';

      projectCards.forEach((card) => {
        card.classList.remove('hidden-initial'); // unhide on filter
        const categories = card.dataset.category || '';
        if (filter === 'all' || categories.includes(filter)) {
          card.style.display = '';
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            });
          });
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // ---- Smooth Scroll for Anchor Links ----
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      e.preventDefault();
      const target = document.querySelector(targetId);
      if (target) {
        const navHeight = navbar ? navbar.offsetHeight : 0;
        const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      }
    });
  });

  // ---- Contact Form (Web3Forms) ----
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('.btn-submit');
      const originalText = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;

      try {
        const formData = new FormData(contactForm);
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (data.success) {
          btn.textContent = 'Sent! ✓';
          btn.style.background = 'linear-gradient(135deg, var(--accent-teal), #00E676)';
          contactForm.reset();
        } else {
          btn.textContent = 'Error — Try Again';
          btn.style.background = 'linear-gradient(135deg, var(--accent-red), #FF4444)';
        }
      } catch (err) {
        btn.textContent = 'Error — Try Again';
        btn.style.background = 'linear-gradient(135deg, var(--accent-red), #FF4444)';
      }

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    });
  }

  // ---- Active Nav Link Highlight ----
  const sections = document.querySelectorAll('.section[id]');
  const navLinksAll = document.querySelectorAll('.nav-links a');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinksAll.forEach((link) => {
            link.style.color = '';
            if (link.getAttribute('href') === '#' + id) {
              link.style.color = 'var(--text)';
            }
          });
        }
      });
    },
    { threshold: 0.3 }
  );

  sections.forEach((sec) => sectionObserver.observe(sec));

})();
