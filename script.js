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
    html.dataset.theme = savedColor;
  }
  
  // Theme toggle
  themeToggle.addEventListener('click', () => {
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? '' : 'dark';
    localStorage.setItem('theme', html.dataset.theme);
    updateThemeIcon();
  });
  
  function updateThemeIcon() {
    const icon = themeToggle.querySelector('i');
    icon.className = html.dataset.theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
  }
  
  // Color theme switcher
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      const theme = option.dataset.theme;
      html.dataset.theme = theme;
      localStorage.setItem('colorTheme', theme);
    });
  });
  
  // Project search
  const searchContainer = document.getElementById('projectSearch');
  const searchInput = document.getElementById('searchInput');
  const projectCards = document.querySelectorAll('.project-card');
  const clearSearch = document.querySelector('.clear-search');
  
  function filterProjects(query) {
    const searchTerm = query.toLowerCase();
    projectCards.forEach(card => {
      const title = card.querySelector('h3').textContent.toLowerCase();
      const tags = Array.from(card.querySelectorAll('.project-tags span'))
        .map(tag => tag.textContent.toLowerCase());
      
      const isVisible = title.includes(searchTerm) || 
        tags.some(tag => tag.includes(searchTerm));
      
      card.style.display = isVisible ? '' : 'none';
    });
  }
  
  searchInput?.addEventListener('input', (e) => filterProjects(e.target.value));
  clearSearch?.addEventListener('click', () => {
    searchInput.value = '';
    filterProjects('');
  });
  
  // Intersection Observer for animations
  const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  };
  
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver(observerCallback, observerOptions);
  
  // Add animation classes to elements
  document.querySelectorAll('section > *:not(h2)').forEach(element => {
    element.classList.add('fade-up');
    observer.observe(element);
  });
  
  // Mobile menu toggle
  const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  mobileNavToggle?.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const isExpanded = navLinks.classList.contains('active');
    mobileNavToggle.setAttribute('aria-expanded', isExpanded);
  });

  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        // Close mobile menu if open
        navLinks.classList.remove('active');
      }
    });
  });

  // Contact form handling
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault(); // Prevent default form submission
      
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
        const formGroup = input.closest('.form-group');
        
        if (!value.trim()) {
          isValid = false;
          showError(formGroup, 'This field is required');
        } else if (name === '_replyto' && !isValidEmail(value)) {
          isValid = false;
          showError(formGroup, 'Please enter a valid email address');
        }
      }

      if (!isValid) {
        return;
      }

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
          // Redirect to thank you page
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
        formContainer.insertBefore(errorDiv, contactForm);
      }
    });
  }

  // Email validation helper
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Error display helper
  function showError(formGroup, message) {
    formGroup.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    formGroup.appendChild(errorDiv);
  }

  // Scroll spy for navigation
  let prevSection = '';
  window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-links a');
    
    let current = prevSection;
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (scrollY >= (sectionTop - sectionHeight / 3)) {
        current = section.getAttribute('id');
      }
    });

    if (current !== prevSection) {
      navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href').slice(1) === current) {
          item.classList.add('active');
        }
      });
      prevSection = current;
    }
  });
});
