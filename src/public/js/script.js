// MyTaxi client-side JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Initialize AOS (Animate On Scroll)
  AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    mirror: false
  });
  
  // Initialize Bootstrap tooltips
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Initialize Bootstrap popovers
  var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  var popoverList = popoverTriggerList.map(function(popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
  });
  
  // Navbar scroll effect
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }
  
  // Back to top button
  const backToTopButton = document.getElementById('backToTop');
  if (backToTopButton) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 300) {
        backToTopButton.classList.add('visible');
      } else {
        backToTopButton.classList.remove('visible');
      }
    });
    
    backToTopButton.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
  
  // Auto-dismiss alerts after 5 seconds
  setTimeout(function() {
    var alerts = document.querySelectorAll('.alert-dismissible');
    alerts.forEach(function(alert) {
      var bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    });
  }, 5000);
  
  // Add fade-in animation to cards
  document.querySelectorAll('.card').forEach(function(card, index) {
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-aos-delay', (index * 100).toString());
  });
  
  // Ride request form handling with improved validation
  var rideRequestForm = document.getElementById('rideRequestForm');
  if (rideRequestForm) {
    rideRequestForm.addEventListener('submit', function(e) {
      var pickupField = document.getElementById('pickup');
      var destinationField = document.getElementById('destination');
      var isValid = true;
      
      // Reset previous error messages
      document.querySelectorAll('.invalid-feedback').forEach(function(el) {
        el.remove();
      });
      document.querySelectorAll('.is-invalid').forEach(function(el) {
        el.classList.remove('is-invalid');
      });
      
      // Validate pickup location
      if (!pickupField.value.trim()) {
        isValid = false;
        pickupField.classList.add('is-invalid');
        var errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = 'Please enter a pickup location';
        pickupField.parentNode.appendChild(errorDiv);
      }
      
      // Validate destination
      if (!destinationField.value.trim()) {
        isValid = false;
        destinationField.classList.add('is-invalid');
        var errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = 'Please enter a destination';
        destinationField.parentNode.appendChild(errorDiv);
      }
      
      // Check if pickup and destination are the same
      if (pickupField.value.trim() && destinationField.value.trim() && 
          pickupField.value.toLowerCase() === destinationField.value.toLowerCase()) {
        isValid = false;
        destinationField.classList.add('is-invalid');
        var errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = 'Pickup and destination cannot be the same location';
        destinationField.parentNode.appendChild(errorDiv);
      }
      
      if (!isValid) {
        e.preventDefault();
        return false;
      }
    });
    
    // Prefill destination from URL parameter
    var urlParams = new URLSearchParams(window.location.search);
    var destination = urlParams.get('destination');
    if (destination && document.getElementById('destination')) {
      document.getElementById('destination').value = destination;
    }
    
    // Add autocomplete suggestions for common locations (demo)
    const commonLocations = [
      'UTeM Main Campus',
      'UTeM Library',
      'UTeM Student Center',
      'UTeM Faculty of Engineering',
      'UTeM Faculty of Technology Management',
      'UTeM Sports Complex',
      'UTeM Cafeteria',
      'Melaka Central',
      'AEON Melaka',
      'Dataran Pahlawan'
    ];
    
    function attachAutocomplete(inputField) {
      if (!inputField) return;
      
      inputField.addEventListener('input', function() {
        const val = this.value.toLowerCase();
        let autocompleteList = document.getElementById('autocomplete-list');
        
        if (!autocompleteList) {
          autocompleteList = document.createElement('div');
          autocompleteList.setAttribute('id', 'autocomplete-list');
          autocompleteList.className = 'autocomplete-items';
          this.parentNode.appendChild(autocompleteList);
        }
        
        autocompleteList.innerHTML = '';
        
        if (!val) {
          autocompleteList.style.display = 'none';
          return;
        }
        
        const matches = commonLocations.filter(location => 
          location.toLowerCase().includes(val)
        );
        
        if (matches.length > 0) {
          autocompleteList.style.display = 'block';
          matches.forEach(match => {
            const item = document.createElement('div');
            item.innerHTML = match;
            item.addEventListener('click', function() {
              inputField.value = match;
              autocompleteList.style.display = 'none';
            });
            autocompleteList.appendChild(item);
          });
        } else {
          autocompleteList.style.display = 'none';
        }
      });
      
      // Hide autocomplete when clicking outside
      document.addEventListener('click', function(e) {
        if (e.target !== inputField) {
          const autocompleteList = document.getElementById('autocomplete-list');
          if (autocompleteList) {
            autocompleteList.style.display = 'none';
          }
        }
      });
    }
    
    attachAutocomplete(document.getElementById('pickup'));
    attachAutocomplete(document.getElementById('destination'));
  }
  
  // Password confirmation validation with strength meter
  var registerForm = document.getElementById('registerForm');
  if (registerForm) {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const strengthMeter = document.createElement('div');
    strengthMeter.className = 'password-strength mt-2';
    
    if (password) {
      password.parentNode.appendChild(strengthMeter);
      
      password.addEventListener('input', function() {
        const val = this.value;
        let strength = 0;
        let message = '';
        
        // Update strength based on various criteria
        if (val.length >= 8) strength += 1;
        if (val.match(/[a-z]/) && val.match(/[A-Z]/)) strength += 1;
        if (val.match(/\d/)) strength += 1;
        if (val.match(/[^a-zA-Z\d]/)) strength += 1;
        
        // Display appropriate message
        switch (strength) {
          case 0:
            message = '<div class="progress" style="height: 5px;"><div class="progress-bar bg-danger" style="width: 25%"></div></div><small class="text-danger">Very Weak</small>';
            break;
          case 1:
            message = '<div class="progress" style="height: 5px;"><div class="progress-bar bg-danger" style="width: 25%"></div></div><small class="text-danger">Weak</small>';
            break;
          case 2:
            message = '<div class="progress" style="height: 5px;"><div class="progress-bar bg-warning" style="width: 50%"></div></div><small class="text-warning">Fair</small>';
            break;
          case 3:
            message = '<div class="progress" style="height: 5px;"><div class="progress-bar bg-info" style="width: 75%"></div></div><small class="text-info">Good</small>';
            break;
          case 4:
            message = '<div class="progress" style="height: 5px;"><div class="progress-bar bg-success" style="width: 100%"></div></div><small class="text-success">Strong</small>';
            break;
        }
        
        strengthMeter.innerHTML = message;
      });
    }
    
    registerForm.addEventListener('submit', function(e) {
      if (password && confirmPassword && password.value !== confirmPassword.value) {
        e.preventDefault();
        confirmPassword.classList.add('is-invalid');
        
        let errorDiv = confirmPassword.nextElementSibling;
        if (!errorDiv || !errorDiv.classList.contains('invalid-feedback')) {
          errorDiv = document.createElement('div');
          errorDiv.className = 'invalid-feedback';
          confirmPassword.parentNode.appendChild(errorDiv);
        }
        
        errorDiv.textContent = 'Passwords do not match';
        return false;
      }
    });
  }
  
  // Active navigation link highlighting
  var currentPath = window.location.pathname;
  var navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  navLinks.forEach(function(link) {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
  
  // Initialize any charts if they exist
  const chartElements = document.querySelectorAll('.chart-container');
  if (chartElements.length > 0 && typeof Chart !== 'undefined') {
    chartElements.forEach(function(container) {
      const canvas = container.querySelector('canvas');
      if (!canvas) return;
      
      const chartType = container.dataset.chartType || 'line';
      const chartData = JSON.parse(container.dataset.chartData || '{}');
      
      new Chart(canvas, {
        type: chartType,
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    });
  }
  
  // Add smooth scrolling to all links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href.startsWith('#')) {
        e.preventDefault();
        
        const targetElement = document.querySelector(this.getAttribute('href'));
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 70,
            behavior: 'smooth'
          });
        }
      }
    });
  });
  
  // Add parallax effect to hero section
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    // Scroll effect
    window.addEventListener('scroll', function() {
      const scrollPosition = window.scrollY;
      if (scrollPosition < 600) {
        const heroImage = document.querySelector('.hero-image-container');
        if (heroImage) {
          heroImage.style.transform = `perspective(1000px) rotateY(-5deg) translateY(${scrollPosition * 0.05}px)`;
        }
        
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
          heroContent.style.transform = `translateY(${scrollPosition * 0.03}px)`;
        }
      }
    });
    
    // Mouse movement effect
    heroSection.addEventListener('mousemove', function(e) {
      const heroImageWrapper = document.querySelector('.hero-image-wrapper');
      if (heroImageWrapper) {
        const xPos = (e.clientX / window.innerWidth - 0.5) * 20;
        const yPos = (e.clientY / window.innerHeight - 0.5) * 20;
        
        heroImageWrapper.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        
        const floatingIcons = document.querySelectorAll('.hero-floating-icon');
        floatingIcons.forEach((icon, index) => {
          const factor = (index + 1) * 0.8;
          icon.style.transform = `translate3d(${xPos * factor}px, ${yPos * factor}px, 0)`;
        });
      }
    });
    
    // Reset on mouse leave
    heroSection.addEventListener('mouseleave', function() {
      const heroImageWrapper = document.querySelector('.hero-image-wrapper');
      if (heroImageWrapper) {
        heroImageWrapper.style.transform = 'translate3d(0, 0, 0)';
        
        const floatingIcons = document.querySelectorAll('.hero-floating-icon');
        floatingIcons.forEach(icon => {
          icon.style.transform = 'translate3d(0, 0, 0)';
        });
      }
    });
  }
}); 