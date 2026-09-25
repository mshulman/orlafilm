document.addEventListener('DOMContentLoaded', () => {
  
  // =========================================================================
  // 0. Password Gate Speedbump
  // =========================================================================
  const gateOverlay = document.getElementById('gate-overlay');
  const gateForm = document.getElementById('gate-form');
  const gatePassword = document.getElementById('gate-password');
  const gateError = document.getElementById('gate-error');
  const CORRECT_PASSWORD = 'orlawpf';

  if (gateOverlay && gateForm && gatePassword) {
    const isAuth = sessionStorage.getItem('orla_gate_auth') === 'true';
    if (!isAuth) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => gatePassword.focus(), 100);
    } else {
      gateOverlay.classList.add('unlocked');
      document.body.style.overflow = '';
    }

    gateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const entered = (gatePassword.value || '').trim();
      if (entered.toLowerCase() === CORRECT_PASSWORD.toLowerCase()) {
        sessionStorage.setItem('orla_gate_auth', 'true');
        gateOverlay.classList.add('unlocked');
        document.body.style.overflow = '';
        if (gateError) gateError.textContent = '';
        gatePassword.classList.remove('input-error');
      } else {
        if (gateError) gateError.textContent = 'Incorrect password. Please try again.';
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

    // Scroll Spy
    let currentActive = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        currentActive = section.getAttribute('id');
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
      menuToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
    });

    // Close mobile menu on link click
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        navMenu.classList.remove('open');
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
  let autoPlayTimer = null;

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

  const startAutoPlay = () => {
    autoPlayTimer = setInterval(nextSlide, 6000);
  };

  const resetAutoPlay = () => {
    clearInterval(autoPlayTimer);
    startAutoPlay();
  };

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      resetAutoPlay();
    });
    nextBtn.addEventListener('click', () => {
      nextSlide();
      resetAutoPlay();
    });
  }

  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-slide'), 10);
      showSlide(index);
      resetAutoPlay();
    });
  });

  // Initialize Carousel AutoPlay
  if (slides.length > 0) {
    startAutoPlay();
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
});
