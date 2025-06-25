// MyTaxi client-side JavaScript

document.addEventListener('DOMContentLoaded', function() {
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
  
  // Auto-dismiss alerts
  setTimeout(function() {
    var alerts = document.querySelectorAll('.alert-dismissible');
    alerts.forEach(function(alert) {
      var bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    });
  }, 5000);
  
  // Ride request form handling
  var rideRequestForm = document.getElementById('rideRequestForm');
  if (rideRequestForm) {
    rideRequestForm.addEventListener('submit', function(e) {
      var pickupField = document.getElementById('pickup');
      var destinationField = document.getElementById('destination');
      
      if (pickupField.value === destinationField.value) {
        e.preventDefault();
        alert('Pickup and destination cannot be the same location.');
        return false;
      }
    });
    
    // Prefill destination from URL parameter
    var urlParams = new URLSearchParams(window.location.search);
    var destination = urlParams.get('destination');
    if (destination && document.getElementById('destination')) {
      document.getElementById('destination').value = destination;
    }
  }
  
  // Password confirmation validation
  var registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      var password = document.getElementById('password');
      var confirmPassword = document.getElementById('confirmPassword');
      
      if (password.value !== confirmPassword.value) {
        e.preventDefault();
        alert('Passwords do not match.');
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
}); 