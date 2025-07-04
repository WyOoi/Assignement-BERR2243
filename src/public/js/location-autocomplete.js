// Location autocomplete functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('Location autocomplete script loaded');
  
  // Get form elements
  const pickupInput = document.getElementById('pickup');
  const pickupLat = document.getElementById('pickup_lat');
  const pickupLon = document.getElementById('pickup_lon');
  const pickupSuggestions = document.getElementById('pickup-suggestions');
  const pickupError = document.getElementById('pickup-error');
  
  const destinationInput = document.getElementById('destination');
  const destinationLat = document.getElementById('destination_lat');
  const destinationLon = document.getElementById('destination_lon');
  const destinationSuggestions = document.getElementById('destination-suggestions');
  const destinationError = document.getElementById('destination-error');
  
  // Check if elements exist
  if (!pickupInput || !destinationInput) {
    console.log('Pickup or destination inputs not found, skipping autocomplete setup');
    return;
  }
  
  console.log('Pickup input exists:', !!pickupInput);
  console.log('Pickup suggestions exists:', !!pickupSuggestions);
  console.log('Destination input exists:', !!destinationInput);
  console.log('Destination suggestions exists:', !!destinationSuggestions);
  
  // Add CSS styles directly to the page
  addStyles();
  
  // Store the original input values to detect manual changes
  let lastValidPickupValue = '';
  let lastValidDestinationValue = '';
  
  // Flag to track if location was selected from dropdown
  let pickupSelectedFromDropdown = false;
  let destinationSelectedFromDropdown = false;
  
  // Cache for search results to avoid redundant API calls
  const searchCache = {};
  
  // Debounce function to limit API calls
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
  
  // Fallback data for testing when API fails
  const fallbackLocations = [
    {
      display_name: "Universiti Teknikal Malaysia Melaka (UTeM) Main Campus, Jalan UTEM, Hang Tuah Jaya Municipal Council, Alor Gajah, Malacca, 76100, Malaysia",
      lat: "2.3139",
      lon: "102.3197"
    },
    {
      display_name: "Kuala Lumpur International Airport (KLIA), Sepang, Selangor, Malaysia",
      lat: "2.7456",
      lon: "101.7099"
    },
    {
      display_name: "Kuala Lumpur City Centre, Kuala Lumpur, Federal Territory of Kuala Lumpur, Malaysia",
      lat: "3.1502",
      lon: "101.7077"
    },
    {
      display_name: "Melaka Sentral, Jalan Tun Razak, Peringgit, Malacca City, Malacca, Malaysia",
      lat: "2.2343",
      lon: "102.2465"
    },
    {
      display_name: "Dataran Pahlawan Melaka Megamall, Jalan Merdeka, Banda Hilir, Malacca City, Malacca, Malaysia",
      lat: "2.1905",
      lon: "102.2501"
    }
  ];
  
  // Make searchLocations globally accessible
  window.searchLocations = searchLocations;
  
  // Search OpenStreetMap for locations
  async function searchLocations(query, suggestionElement, errorElement, useAPI = true) {
    console.log('Searching for:', query);
    
    if (!suggestionElement) {
      console.error('Suggestion element not found');
      return;
    }
    
    if (query.length < 1) {
      suggestionElement.innerHTML = '<div class="location-no-results">Type at least 1 character to search</div>';
      suggestionElement.style.display = 'block';
      console.log('Query too short');
      return;
    }
    
    // Always append Malaysia to the query if not already included
    if (!query.toLowerCase().includes('malaysia')) {
      query = query + ' Malaysia';
    }
    
    // Check cache first
    const cacheKey = query + (useAPI ? '-api' : '-fallback');
    if (searchCache[cacheKey]) {
      console.log('Using cached results for:', query);
      displaySearchResults(searchCache[cacheKey], query, suggestionElement, errorElement);
      return;
    }
    
    suggestionElement.innerHTML = '<div class="location-searching"><div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>Searching locations...</div>';
    suggestionElement.style.display = 'block';
    console.log('Showing loading indicator');
    
    try {
      let data = [];
      
      if (useAPI) {
        try {
          console.log('Fetching from Nominatim API');
          // Add a timestamp to prevent caching
          const timestamp = new Date().getTime();
          
          // Set a timeout for the fetch operation
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
          
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&_=${timestamp}`, {
            headers: {
              'User-Agent': 'MyTaxiApp/1.0',
              'Accept-Language': 'en'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
          }
          
          data = await response.json();
          console.log('Search results from API:', data);
          
          // Cache the results
          searchCache[cacheKey] = data;
          
          // If no results from API, use fallback data
          if (data.length === 0) {
            console.log('No results from API, using fallback data');
            data = fallbackLocations.filter(loc => 
              loc.display_name.toLowerCase().includes(query.toLowerCase())
            );
            // Cache fallback results too
            searchCache[cacheKey] = data;
          }
        } catch (apiError) {
          console.error("API Error:", apiError);
          // If API fails, use fallback data
          console.log('Using fallback data due to API error');
          data = fallbackLocations.filter(loc => 
            loc.display_name.toLowerCase().includes(query.toLowerCase())
          );
          // Cache fallback results
          searchCache[cacheKey] = data;
        }
      } else {
        // Use fallback data directly
        console.log('Using fallback data (API disabled)');
        data = fallbackLocations.filter(loc => 
          loc.display_name.toLowerCase().includes(query.toLowerCase())
        );
        // Cache fallback results
        searchCache[cacheKey] = data;
      }
      
      displaySearchResults(data, query, suggestionElement, errorElement);
      
    } catch (error) {
      console.error("Search error:", error);
      suggestionElement.innerHTML = '<div class="location-no-results">Error searching. Using fallback locations.</div>';
      if (errorElement) {
        errorElement.textContent = "Error searching for locations. Please try again.";
        errorElement.classList.remove('d-none');
      }
      
      // Try with fallback data if main search fails
      if (useAPI) {
        console.log('Retrying with fallback data');
        searchLocations(query, suggestionElement, errorElement, false);
      }
    }
  }
  
  // Function to display search results
  function displaySearchResults(data, query, suggestionElement, errorElement) {
    if (data.length === 0) {
      suggestionElement.innerHTML = `<div class="location-no-results">No locations found for "${query}"</div>`;
      if (errorElement) {
        errorElement.textContent = `No locations found for "${query}"`;
        errorElement.classList.remove('d-none');
      }
      console.log('No results found');
    } else {
      if (errorElement) {
        errorElement.classList.add('d-none');
      }
      
      let html = '';
      data.forEach(location => {
        // Format display name to be more readable
        let displayName = location.display_name;
        let mainName = displayName.split(',')[0];
        let address = displayName.split(',').slice(1, 3).join(',').trim();
        
        html += `
          <div class="location-suggestion-item" data-lat="${location.lat}" data-lon="${location.lon}" data-name="${displayName}">
            <div class="location-name">${mainName}</div>
            <div class="location-address">${address}</div>
          </div>
        `;
      });
      
      suggestionElement.innerHTML = html;
      console.log('Populated suggestions with', data.length, 'items');
      
      // Add click event listeners to suggestion items
      const items = suggestionElement.querySelectorAll('.location-suggestion-item');
      items.forEach(item => {
        item.addEventListener('click', function() {
          const lat = this.dataset.lat;
          const lon = this.dataset.lon;
          const name = this.dataset.name;
          console.log('Selected location:', name, lat, lon);
          
          if (suggestionElement === pickupSuggestions) {
            pickupInput.value = name.split(',')[0]; // Just show the main name in the input
            pickupLat.value = lat;
            pickupLon.value = lon;
            lastValidPickupValue = name.split(',')[0];
            pickupSelectedFromDropdown = true;
            if (pickupError) pickupError.classList.add('d-none');
          } else if (suggestionElement === destinationSuggestions) {
            destinationInput.value = name.split(',')[0]; // Just show the main name in the input
            destinationLat.value = lat;
            destinationLon.value = lon;
            lastValidDestinationValue = name.split(',')[0];
            destinationSelectedFromDropdown = true;
            if (destinationError) destinationError.classList.add('d-none');
          }
          
          // Hide suggestions
          suggestionElement.style.display = 'none';
        });
      });
    }
  }
  
  // Debounced search functions with shorter delay
  const debouncedPickupSearch = debounce((query) => {
    searchLocations(query, pickupSuggestions, pickupError);
  }, 200);
  
  const debouncedDestinationSearch = debounce((query) => {
    searchLocations(query, destinationSuggestions, destinationError);
  }, 200);
  
  // Input event listeners
  if (pickupInput) {
    pickupInput.addEventListener('input', function() {
      console.log('Pickup input changed:', this.value);
      const query = this.value.trim();
      if (query.length > 0) {
        pickupSelectedFromDropdown = false;
        debouncedPickupSearch(query);
      }
    });
  }
  
  if (destinationInput) {
    destinationInput.addEventListener('input', function() {
      console.log('Destination input changed:', this.value);
      const query = this.value.trim();
      if (query.length > 0) {
        destinationSelectedFromDropdown = false;
        debouncedDestinationSearch(query);
      }
    });
  }
  
  // Focus event listeners
  if (pickupInput) {
    pickupInput.addEventListener('focus', function() {
      console.log('Pickup input focused');
      if (this.value.trim().length >= 1) {
        debouncedPickupSearch(this.value.trim());
      } else if (this.value.trim() === '') {
        pickupSuggestions.innerHTML = '<div class="location-no-results">Type at least 1 character to search</div>';
        pickupSuggestions.style.display = 'block';
      }
    });
  }
  
  if (destinationInput) {
    destinationInput.addEventListener('focus', function() {
      console.log('Destination input focused');
      if (this.value.trim().length >= 1) {
        debouncedDestinationSearch(this.value.trim());
      } else if (this.value.trim() === '') {
        destinationSuggestions.innerHTML = '<div class="location-no-results">Type at least 1 character to search</div>';
        destinationSuggestions.style.display = 'block';
      }
    });
  }
  
  // Blur event listeners
  if (pickupInput) {
    pickupInput.addEventListener('blur', function() {
      console.log('Pickup input blur');
      // Delay hiding suggestions to allow for selection
      setTimeout(() => {
        pickupSuggestions.style.display = 'none';
        
        // If not selected from dropdown and value changed, show warning
        if (!pickupSelectedFromDropdown && this.value !== lastValidPickupValue && this.value.trim() !== '') {
          if (pickupError) {
            pickupError.classList.remove('d-none');
            pickupError.textContent = "Please select a location from the suggestions";
          }
          
          // Reset to last valid value if there was one
          if (lastValidPickupValue) {
            this.value = lastValidPickupValue;
            if (pickupError) pickupError.classList.add('d-none');
          } else {
            this.value = '';
          }
        }
      }, 200);
    });
  }
  
  if (destinationInput) {
    destinationInput.addEventListener('blur', function() {
      console.log('Destination input blur');
      // Delay hiding suggestions to allow for selection
      setTimeout(() => {
        destinationSuggestions.style.display = 'none';
        
        // If not selected from dropdown and value changed, show warning
        if (!destinationSelectedFromDropdown && this.value !== lastValidDestinationValue && this.value.trim() !== '') {
          if (destinationError) {
            destinationError.classList.remove('d-none');
            destinationError.textContent = "Please select a location from the suggestions";
          }
          
          // Reset to last valid value if there was one
          if (lastValidDestinationValue) {
            this.value = lastValidDestinationValue;
            if (destinationError) destinationError.classList.add('d-none');
          } else {
            this.value = '';
          }
        }
      }, 200);
    });
  }
  
  // Add search buttons
  addSearchButtons();
  
  // Trigger a test search for debugging
  setTimeout(() => {
    // Use fallback data for initial test
    if (pickupInput && pickupInput.value.trim().length >= 1) {
      searchLocations(pickupInput.value.trim(), pickupSuggestions, pickupError);
    } else if (pickupSuggestions) {
      searchLocations('universiti', pickupSuggestions, pickupError);
    }
  }, 500);
  
  console.log('Location autocomplete initialized');
  
  // Function to add search buttons
  function addSearchButtons() {
    console.log('Adding search buttons');
    
    if (pickupInput) {
      const pickupSearchButton = document.createElement('button');
      pickupSearchButton.type = 'button';
      pickupSearchButton.className = 'search-button';
      pickupSearchButton.innerHTML = '<i class="fas fa-search"></i>';
      pickupSearchButton.style.position = 'absolute';
      pickupSearchButton.style.right = '0';
      pickupSearchButton.style.top = '0';
      pickupSearchButton.style.bottom = '0';
      pickupSearchButton.style.background = 'transparent';
      pickupSearchButton.style.border = 'none';
      pickupSearchButton.style.color = '#6c757d';
      pickupSearchButton.style.fontSize = '1.25rem';
      pickupSearchButton.style.padding = '0 15px';
      pickupSearchButton.style.zIndex = '5';
      pickupSearchButton.style.cursor = 'pointer';
      pickupSearchButton.style.display = 'flex';
      pickupSearchButton.style.alignItems = 'center';
      pickupSearchButton.style.justifyContent = 'center';
      
      pickupSearchButton.addEventListener('click', function() {
        if (pickupInput.value.trim().length >= 1) {
          searchLocations(pickupInput.value.trim(), pickupSuggestions, pickupError);
        } else {
          alert('Please enter at least 1 character to search');
        }
      });
      
      // Make sure the parent has position relative
      pickupInput.parentNode.style.position = 'relative';
      pickupInput.parentNode.appendChild(pickupSearchButton);
    }
    
    if (destinationInput) {
      const destinationSearchButton = document.createElement('button');
      destinationSearchButton.type = 'button';
      destinationSearchButton.className = 'search-button';
      destinationSearchButton.innerHTML = '<i class="fas fa-search"></i>';
      destinationSearchButton.style.position = 'absolute';
      destinationSearchButton.style.right = '0';
      destinationSearchButton.style.top = '0';
      destinationSearchButton.style.bottom = '0';
      destinationSearchButton.style.background = 'transparent';
      destinationSearchButton.style.border = 'none';
      destinationSearchButton.style.color = '#6c757d';
      destinationSearchButton.style.fontSize = '1.25rem';
      destinationSearchButton.style.padding = '0 15px';
      destinationSearchButton.style.zIndex = '5';
      destinationSearchButton.style.cursor = 'pointer';
      destinationSearchButton.style.display = 'flex';
      destinationSearchButton.style.alignItems = 'center';
      destinationSearchButton.style.justifyContent = 'center';
      
      destinationSearchButton.addEventListener('click', function() {
        if (destinationInput.value.trim().length >= 1) {
          searchLocations(destinationInput.value.trim(), destinationSuggestions, destinationError);
        } else {
          alert('Please enter at least 1 character to search');
        }
      });
      
      // Make sure the parent has position relative
      destinationInput.parentNode.style.position = 'relative';
      destinationInput.parentNode.appendChild(destinationSearchButton);
    }
  }
  
  // Function to add CSS styles
  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .input-group-with-suggestions {
        position: relative;
      }
      
      .location-suggestions {
        position: absolute;
        width: 100%;
        max-height: 250px;
        overflow-y: auto;
        background: white;
        border: 1px solid #ddd;
        border-radius: 0.25rem;
        z-index: 1000;
        box-shadow: 0 5px 10px rgba(0,0,0,0.2);
        display: none;
        top: 100%;
        left: 0;
      }
      
      .location-suggestion-item {
        padding: 10px 15px;
        border-bottom: 1px solid #eee;
        cursor: pointer;
      }
      
      .location-suggestion-item:hover {
        background-color: #f8f9fa;
      }
      
      .location-suggestion-item:last-child {
        border-bottom: none;
      }
      
      .location-name {
        font-weight: 500;
      }
      
      .location-address {
        font-size: 0.85rem;
        color: #6c757d;
      }
      
      .location-searching {
        padding: 10px 15px;
        text-align: center;
        color: #6c757d;
      }
      
      .location-no-results {
        padding: 10px 15px;
        text-align: center;
        color: #6c757d;
        font-style: italic;
      }
      
      .search-button {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        background: transparent;
        border: none;
        color: #6c757d;
        font-size: 1.25rem;
        padding: 0 15px;
        z-index: 5;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .search-button:hover {
        color: #0d6efd;
      }
      
      .invalid-feedback-custom {
        display: none;
        width: 100%;
        margin-top: 0.25rem;
        font-size: 0.875em;
        color: #dc3545;
      }
      
      .invalid-feedback-custom:not(.d-none) {
        display: block;
      }
    `;
    document.head.appendChild(style);
  }
}); 