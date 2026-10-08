document.addEventListener('DOMContentLoaded', () => {
  
  // =========================================================================
  // 0. Password Gate Speedbump
  // =========================================================================
  const gateOverlay = document.getElementById('gate-overlay');
  const gateForm = document.getElementById('gate-form');
  const gatePassword = document.getElementById('gate-password');
  const gateError = document.getElementById('gate-error');

  // Story-based invite tokens mapped to their canonical hyphenated form
  const INVITE_TOKENS = {
    // 1. Sneaky's Grave
    'sneakysgrave': 'sneakys-grave',
    'sneakygrave': 'sneakys-grave',
    // 2. Orla's Bike
    'orlasbike': 'orlas-bike',
    'orlabike': 'orlas-bike',
    // 3. Fantasmo
    'fantasmo': 'fantasmo',
    // 4. Stranger's Blanket
    'strangersblanket': 'strangers-blanket',
    'strangerblanket': 'strangers-blanket',
    // 5. Canal Bridge
    'canalbridge': 'canal-bridge',
    // 6. Twilight Circus
    'twilightcircus': 'twilight-circus',
    // 7. Stone Barn
    'stonebarn': 'stone-barn',
    // 8. River Crossing
    'rivercrossing': 'river-crossing',
    // 9. Morecambe Bay
    'morecambebay': 'morecambe-bay',
    // 10. Irish Sea
    'irishsea': 'irish-sea',
    // 11. Stranger's Chair
    'strangerschair': 'strangers-chair',
    'strangerchair': 'strangers-chair',
    // 12. Circus Tent
    'circustent': 'circus-tent',
    // 13. Turtledove
    'turtledove': 'turtledove',
    // Master fallback
    'orlawpf': 'orlawpf'
  };

  const normalizeToken = (input) => {
    if (!input) return '';
    return input
      .toLowerCase()
      .replace(/['’`"\-_]/g, '')
      .replace(/\s+/g, '')
      .trim();
  };

  if (gateOverlay && gateForm && gatePassword) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('lock') || urlParams.has('logout') || urlParams.has('relock')) {
      sessionStorage.removeItem('orla_gate_auth');
      sessionStorage.removeItem('orla_user_phrase');
      // Clean query param from URL bar without reloading
      urlParams.delete('lock');
      urlParams.delete('logout');
      urlParams.delete('relock');
      const cleanUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '') + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    }

    const isAuth = sessionStorage.getItem('orla_gate_auth') === 'true';
    if (!isAuth) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => gatePassword.focus(), 100);
    } else {
      gateOverlay.classList.add('unlocked');
      document.body.style.overflow = '';
      const savedUserPhrase = sessionStorage.getItem('orla_user_phrase');
      if (savedUserPhrase && typeof gtag === 'function') {
        gtag('set', 'user_properties', { user_id: savedUserPhrase });
        gtag('config', 'G-0G6Q78W4M6', { user_id: savedUserPhrase });
      }
    }

    gateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const entered = (gatePassword.value || '').trim();
      const normalized = normalizeToken(entered);
      const canonicalToken = INVITE_TOKENS[normalized];

      if (canonicalToken) {
        sessionStorage.setItem('orla_gate_auth', 'true');
        sessionStorage.setItem('orla_user_phrase', canonicalToken);
        if (typeof gtag === 'function') {
          gtag('set', 'user_properties', { 
            user_id: canonicalToken,
            invite_token: canonicalToken
          });
          gtag('config', 'G-0G6Q78W4M6', { 
            user_id: canonicalToken,
            invite_token: canonicalToken
          });
          gtag('event', 'login', {
            method: 'invite_token',
            invite_token: canonicalToken,
            token: canonicalToken,
            user_id: canonicalToken
          });
        }
        gateOverlay.classList.add('unlocked');
        document.body.style.overflow = '';
        if (gateError) gateError.textContent = '';
        gatePassword.classList.remove('input-error');
      } else {
        if (gateError) gateError.textContent = 'Incorrect phrase. Please try again.';
        gatePassword.classList.remove('input-error');
        void gatePassword.offsetWidth;
        gatePassword.classList.add('input-error');
        gatePassword.select();
      }
    });

    gatePassword.addEventListener('input', () => {
      if (gatePassword.classList.contains('input-error')) {
        gatePassword.classList.remove('input-error');
        if (gateError) gateError.textContent = '';
      }
    });
  }

  // =========================================================================
  // 1. Header Scroll Spy & Active States
  // =========================================================================
  const header = document.getElementById('site-header');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section');

  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Scroll Spy: track chapter sections corresponding to visible nav links
    const visibleNavLinks = Array.from(navLinks).filter(link => {
      const href = link.getAttribute('href');
      return href && href.startsWith('#') && link.style.display !== 'none';
    });

    let currentActive = '';
    visibleNavLinks.forEach(link => {
      const targetId = link.getAttribute('href').slice(1);
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        const sectionTop = targetSection.offsetTop - 150;
        if (window.scrollY >= sectionTop) {
          currentActive = targetId;
        }
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentActive}`) {
        link.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Initialize on load

  // =========================================================================
  // 2. Mobile Navigation Toggle
  // =========================================================================
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close mobile menu on link click
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        navMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // =========================================================================
  // 3. Characters Section (Static display - no modal)
  // =========================================================================

  // =========================================================================
  // 4. Praise Slider / Testimonial Carousel
  // =========================================================================
  const slides = document.querySelectorAll('.praise-slide');
  const dots = document.querySelectorAll('.dot');
  const prevBtn = document.getElementById('prev-quote');
  const nextBtn = document.getElementById('next-quote');
  let currentSlide = 0;

  const showSlide = (index) => {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
  };

  const nextSlide = () => {
    showSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    showSlide(currentSlide - 1);
  };

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
    });
    nextBtn.addEventListener('click', () => {
      nextSlide();
    });
  }

  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-slide'), 10);
      showSlide(index);
    });
  });

  // Initialize Carousel (Manual navigation only)
  if (slides.length > 0) {
    showSlide(0);
  }

  // =========================================================================
  // 4b. World of Orla 2.35:1 Cinematic Carousel (Manual Navigation)
  // =========================================================================
  const worldSlides = document.querySelectorAll('.world-desktop-only .world-slide');
  const worldDotsContainer = document.getElementById('world-dots');
  const worldPrevBtn = document.getElementById('world-prev-btn');
  const worldNextBtn = document.getElementById('world-next-btn');
  const worldCarouselFrame = document.querySelector('.world-desktop-only .world-carousel-frame');
  let currentWorldSlide = 0;

  if (worldSlides.length > 0) {
    // Preload all 9 desktop carousel slide images immediately to guarantee instant display and prevent missing slides
    worldSlides.forEach(slide => {
      const img = slide.querySelector('img');
      if (img && img.src) {
        const preloader = new Image();
        preloader.src = img.src;
      }
    });

    // Generate pagination dots (for desktop carousel)
    if (worldDotsContainer) {
      worldDotsContainer.innerHTML = '';
      worldSlides.forEach((slide, idx) => {
        const dot = document.createElement('button');
        dot.className = `world-dot ${idx === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Go to scene slide ${idx + 1} of ${worldSlides.length}`);
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
        dot.addEventListener('click', () => {
          showWorldSlide(idx);
        });
        worldDotsContainer.appendChild(dot);
      });
    }

    const worldDots = document.querySelectorAll('.world-dot');

    const showWorldSlide = (index) => {
      worldSlides.forEach(slide => {
        slide.classList.remove('active');
        slide.setAttribute('aria-hidden', 'true');
      });
      worldDots.forEach(dot => {
        dot.classList.remove('active');
        dot.setAttribute('aria-selected', 'false');
      });

      currentWorldSlide = (index + worldSlides.length) % worldSlides.length;
      worldSlides[currentWorldSlide].classList.add('active');
      worldSlides[currentWorldSlide].setAttribute('aria-hidden', 'false');
      if (worldDots[currentWorldSlide]) {
        worldDots[currentWorldSlide].classList.add('active');
        worldDots[currentWorldSlide].setAttribute('aria-selected', 'true');
      }
    };

    const nextWorldSlide = () => {
      showWorldSlide(currentWorldSlide + 1);
    };

    const prevWorldSlide = () => {
      showWorldSlide(currentWorldSlide - 1);
    };

    if (worldPrevBtn) {
      worldPrevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        prevWorldSlide();
      });
    }

    if (worldNextBtn) {
      worldNextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        nextWorldSlide();
      });
    }

    // Touch swipe support (desktop / tablet carousel)
    if (worldCarouselFrame) {
      let touchStartX = 0;
      worldCarouselFrame.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      worldCarouselFrame.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const diffX = touchEndX - touchStartX;
        if (Math.abs(diffX) > 45) {
          if (diffX < 0) {
            nextWorldSlide();
          } else {
            prevWorldSlide();
          }
        }
      }, { passive: true });
    }

    // Keyboard navigation when World section is in view (desktop only)
    document.addEventListener('keydown', (e) => {
      if (window.innerWidth < 768) return;
      const worldSection = document.getElementById('world');
      if (!worldSection) return;
      const rect = worldSection.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) {
        if (e.key === 'ArrowLeft') {
          prevWorldSlide();
        } else if (e.key === 'ArrowRight') {
          nextWorldSlide();
        }
      }
    });

    // Explicitly initialize World carousel to slide 0
    showWorldSlide(0);

    // Reset to image 1 whenever navigating to World section on desktop
    document.querySelectorAll('a[href="#world"]').forEach(link => {
      link.addEventListener('click', () => {
        showWorldSlide(0);
      });
    });

    // Reset on pageshow
    window.addEventListener('pageshow', () => {
      showWorldSlide(0);
    });

    // Handle viewport resize: re-sync active slide state
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth >= 768) {
          showWorldSlide(currentWorldSlide);
        }
      }, 150);
    });

    // Mobile Progressive Disclosure (View All 9 Locations / Show Less)
    const worldExpandBtn = document.getElementById('world-expand-btn');
    const worldExpandBtnText = document.querySelector('.world-expand-btn-text');
    const worldSecondarySlides = document.getElementById('world-secondary-slides');

    if (worldExpandBtn && worldSecondarySlides) {
      worldExpandBtn.addEventListener('click', () => {
        const isExpanded = worldExpandBtn.getAttribute('aria-expanded') === 'true';
        if (isExpanded) {
          // Collapse
          worldExpandBtn.setAttribute('aria-expanded', 'false');
          worldSecondarySlides.classList.remove('is-expanded');
          worldSecondarySlides.setAttribute('aria-hidden', 'true');
          if (worldExpandBtnText) {
            worldExpandBtnText.textContent = 'View All 9 Locations (+5)';
          }
          // Smoothly scroll back to button if scrolled below it
          const btnRect = worldExpandBtn.getBoundingClientRect();
          if (btnRect.top < 60) {
            worldExpandBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          // Expand
          worldExpandBtn.setAttribute('aria-expanded', 'true');
          worldSecondarySlides.classList.add('is-expanded');
          worldSecondarySlides.setAttribute('aria-hidden', 'false');
          if (worldExpandBtnText) {
            worldExpandBtnText.textContent = 'Show Less';
          }
        }
      });
    }
  }

  // =========================================================================
  // 5. Accordions (Bios Info Expand/Collapse)
  // =========================================================================
  const accordionTriggers = document.querySelectorAll('.accordion-trigger');

  accordionTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      const panel = document.getElementById(trigger.id.replace('trigger', 'panel'));
      
      // Close other accordions
      accordionTriggers.forEach(otherTrigger => {
        if (otherTrigger !== trigger) {
          otherTrigger.setAttribute('aria-expanded', 'false');
          const otherPanel = document.getElementById(otherTrigger.id.replace('trigger', 'panel'));
          if (otherPanel) {
            otherPanel.style.maxHeight = null;
            otherPanel.setAttribute('aria-hidden', 'true');
          }
        }
      });

      // Toggle current accordion
      if (isExpanded) {
        trigger.setAttribute('aria-expanded', 'false');
        panel.style.maxHeight = null;
        panel.setAttribute('aria-hidden', 'true');
      } else {
        trigger.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + "px";
        panel.setAttribute('aria-hidden', 'false');
      }
    });
  });

  // =========================================================================
  // 6. Contact Form Submissions Handlers
  // =========================================================================
  const contactForm = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');
  const submitBtn = document.getElementById('submit-btn');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Disable submit button while submitting
      submitBtn.disabled = true;
      submitBtn.innerText = "Sending...";

      const formData = new FormData(contactForm);
      const object = Object.fromEntries(formData);
      const json = JSON.stringify(object);

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: json
      })
      .then(async (response) => {
        let resJson = await response.json();
        if (response.status === 200) {
          // Show success message with dynamic visual class
          formSuccess.classList.add('active');
          contactForm.reset();
        } else {
          console.error(response);
          alert(resJson.message || "Form submission failed. Please try again.");
        }
      })
      .catch(error => {
        console.error(error);
        alert("Failed to send message. Please check your internet connection.");
      })
      .then(() => {
        submitBtn.disabled = false;
        submitBtn.innerText = "Send Message";
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          formSuccess.classList.remove('active');
        }, 5000);
      });
    });
  }

  // =========================================================================
  // 12. Robust Image Error Recovery & Automatic Fallback Handler
  // =========================================================================
  // Listens in capture phase so that if any image fails to load (e.g. network glitch,
  // stale mobile browser cache, or missing mobile crop on remote server), it automatically
  // recovers by switching to data-fallback or retrying with a cache-busting timestamp.
  window.addEventListener('error', (event) => {
    const target = event.target;
    if (target && target.tagName === 'IMG') {
      // 1. If explicit fallback is declared and not yet tried, switch immediately
      if (target.dataset.fallback && !target.dataset.fallbackAttempted) {
        target.dataset.fallbackAttempted = 'true';
        console.warn(`[Image Recovery] Failed: ${target.src} -> Falling back to: ${target.dataset.fallback}`);
        target.src = target.dataset.fallback;
        return;
      }
      // 2. Retry once with timestamp to bust stale mobile browser 404 cache
      if (!target.dataset.retryAttempted) {
        target.dataset.retryAttempted = 'true';
        const cleanSrc = target.src.split('?')[0];
        console.warn(`[Image Recovery] Retrying ${target.src} with cache-buster...`);
        target.src = `${cleanSrc}?retry=${Date.now()}`;
      }
    }
  }, true);
});
