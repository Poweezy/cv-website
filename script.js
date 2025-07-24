// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => console.log('ServiceWorker registered'))
      .catch(err => console.log('ServiceWorker registration failed: ', err));
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // Handle splash screen
  const splashScreen = document.getElementById('splash-screen');
  if (splashScreen) {
    // If the user has visited before, remove splash screen immediately
    if (sessionStorage.getItem('hasVisited')) {
      splashScreen.style.display = 'none';
    } else {
      // First visit - show splash screen with animation
      setTimeout(() => {
        splashScreen.classList.add('fade-out');
        setTimeout(() => {
          splashScreen.style.display = 'none';
        }, 500);
        sessionStorage.setItem('hasVisited', 'true');
      }, 2000);
    }
  }

  // Handle system dark mode preference
  if (window.matchMedia && !localStorage.getItem('theme')) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = prefersDark ? 'dark' : '';
    if (prefersDark) localStorage.setItem('theme', 'dark');
  }

  // Theme management
  const themeToggle = document.getElementById('themeToggle');
  const colorOptions = document.querySelectorAll('.color-option');
  const html = document.documentElement;
  
  // Load saved preferences
  const savedTheme = localStorage.getItem('theme');
  const savedColor = localStorage.getItem('colorTheme');
  
  if (savedTheme) {
    html.dataset.theme = savedTheme;
    updateThemeIcon();
  }
  
  if (savedColor) {
    html.dataset.colorTheme = savedColor;
  }
  
  // Theme toggle
  themeToggle?.addEventListener('click', () => {
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? '' : 'dark';
    localStorage.setItem('theme', html.dataset.theme);
    updateThemeIcon();
  });
  
  function updateThemeIcon() {
    const icon = themeToggle?.querySelector('i');
    if (icon) {
      icon.className = html.dataset.theme === 'dark' 
        ? 'fas fa-moon'
        : 'fas fa-sun';
    }
  }

  // Color theme picker
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      const theme = option.dataset.theme;
      html.dataset.colorTheme = theme;
      localStorage.setItem('colorTheme', theme);
    });
  });
  // Color theme picker
  colorOptions.forEach(option => {
    const theme = option.dataset.theme;
    if (theme === (savedColor || 'blue')) {
      option.classList.add('active');
    }
    
    option.addEventListener('click', () => {
      colorOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      html.dataset.colorTheme = theme;
      localStorage.setItem('colorTheme', theme);
    });
  });

  // Mobile navigation
  const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  mobileNavToggle?.addEventListener('click', () => {
    navLinks?.classList.toggle('active');
    const isExpanded = navLinks?.classList.contains('active');
    mobileNavToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
  });

  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        // Close mobile menu if open
        navLinks?.classList.remove('active');
      }
    });
  });

  // Intersection Observer for scroll animations
  const observerOptions = {
    root: null,
    threshold: 0.1,
    rootMargin: '0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, observerOptions);

  // Observe all major sections and cards
  document.querySelectorAll('section, .project-card, .education-card, .cert-item, .experience-card').forEach(
    element => {
      element.classList.add('animate-on-scroll');
      observer.observe(element);
    }
  );

  // Contact form handling
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('.submit-btn');
      const loadingSpinner = contactForm.querySelector('.loading-spinner');
      const formGroups = contactForm.querySelectorAll('.form-group');
      
      // Reset previous error states
      formGroups.forEach(group => {
        group.classList.remove('error');
        const errorMessage = group.querySelector('.error-message');
        if (errorMessage) {
          errorMessage.remove();
        }
      });

      // Client-side validation
      let isValid = true;
      const formData = new FormData(contactForm);
      
      for (const [name, value] of formData.entries()) {
        const input = contactForm.querySelector(`[name="${name}"]`);
        const formGroup = input?.closest('.form-group');
        
        if (!value.trim()) {
          isValid = false;
          showError(formGroup, 'This field is required');
        } else if (name === '_replyto' && !isValidEmail(value)) {
          isValid = false;
          showError(formGroup, 'Please enter a valid email address');
        }
      }

      if (!isValid) return;

      // Show loading state
      if (submitBtn && loadingSpinner) {
        submitBtn.disabled = true;
        loadingSpinner.style.display = 'inline-block';
      }

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          window.location.href = formData.get('_next') || 'thank-you.html';
        } else {
          throw new Error('Form submission failed');
        }
      } catch (error) {
        console.error('Form submission error:', error);
        // Reset loading state
        if (submitBtn && loadingSpinner) {
          submitBtn.disabled = false;
          loadingSpinner.style.display = 'none';
        }
        // Show error message
        const formContainer = contactForm.closest('.contact-form');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error-message';
        errorDiv.textContent = 'Sorry, there was an error sending your message. Please try again later.';
        formContainer?.insertBefore(errorDiv, contactForm);
      }
    });
  }
});

// Helper functions
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(formGroup, message) {
  if (!formGroup) return;
  formGroup.classList.add('error');
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  formGroup.appendChild(errorDiv);
}
