// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => console.log('ServiceWorker registered'))
      .catch(err => console.log('ServiceWorker registration failed: ', err));
  });
}

document.addEventListener('DOMContentLoaded', function() {
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

  // Project search functionality
  const searchToggle = document.getElementById('searchToggle');
  const searchContainer = document.getElementById('projectSearch');
  const searchInput = document.getElementById('searchInput');
  const clearSearch = document.querySelector('.clear-search');
  const projectCards = document.querySelectorAll('.project-card');

  searchToggle?.addEventListener('click', () => {
    searchContainer?.classList.toggle('active');
    searchInput?.focus();
  });

  clearSearch?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    projectCards.forEach(card => card.style.display = 'block');
  });

  searchInput?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    projectCards.forEach(card => {
      const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
      const description = card.querySelector('p')?.textContent.toLowerCase() || '';
      const tags = Array.from(card.querySelectorAll('.project-tags span'))
        .map(tag => tag.textContent.toLowerCase())
        .join(' ');
      
      const content = `${title} ${description} ${tags}`;
      
      card.style.display = content.includes(searchTerm) ? 'block' : 'none';
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
