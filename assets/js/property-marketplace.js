document.addEventListener('DOMContentLoaded', function() {
    // Property search functionality
    const searchInput = document.getElementById('propertySearch');
    const searchButton = document.getElementById('searchButton');
    const propertyItems = document.querySelectorAll('.property-item');

    function performSearch() {
        const searchValue = searchInput.value.toLowerCase().trim();

        propertyItems.forEach(item => {
            const propertyText = item.textContent.toLowerCase();
            item.style.display = propertyText.includes(searchValue) ? '' : 'none';
        });
    }

    // Add animation order to property items for staggered animation
    propertyItems.forEach((item, index) => {
        item.style.setProperty('--animation-order', index);
    });

    // Search on button click
    searchButton.addEventListener('click', performSearch);

    // Search on enter key
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Property details modal functionality
    const propertyDetailsModal = document.getElementById('propertyDetailsModal');
    const propertyDetailsContent = document.getElementById('propertyDetailsContent');
    const viewDetailsButtons = document.querySelectorAll('.view-details');

    // Preload images to check if they exist
    function checkImageExists(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    viewDetailsButtons.forEach(button => {
        button.addEventListener('click', function() {
            const propertyId = this.getAttribute('data-id');
            const propertyName = this.getAttribute('data-name');
            const propertyRent = this.getAttribute('data-rent');
            const propertyRooms = this.getAttribute('data-rooms');
            const propertyAddress = this.getAttribute('data-address');
            const propertyVacant = this.getAttribute('data-vacant') === '1';
            const propertyDescription = this.getAttribute('data-description');
            const reservationStatus = this.getAttribute('data-reservation-status');
            const imagesJson = this.getAttribute('data-images');
            let propertyImages = [];

            try {
                propertyImages = JSON.parse(imagesJson);
                console.log('Parsed images:', propertyImages); // Debug log
                if (!Array.isArray(propertyImages) || propertyImages.length === 0) {
                    propertyImages = ['/ROME/assets/img/default-property.jpg'];
                }
            } catch (e) {
                console.error('Error parsing images JSON:', e);
                propertyImages = ['/ROME/assets/img/default-property.jpg'];
            }

            const modalCarouselContainer = document.getElementById('modalCarouselContainer');
            const modalDetailsContainer = document.getElementById('modalDetailsContainer');
            const carouselId = `modalCarousel_${propertyId}`;

            // Generate carousel items for ALL images
            const carouselHTML = `
                <div id="${carouselId}" class="carousel slide" data-ride="carousel">
                    <ol class="carousel-indicators">
                        ${propertyImages.map((_, index) => `
                            <li data-target="#${carouselId}"
                                data-slide-to="${index}"
                                class="${index === 0 ? 'active' : ''}"
                                aria-label="Slide ${index + 1}">
                            </li>
                        `).join('')}
                    </ol>
                    <div class="carousel-inner">
                        ${propertyImages.map((imgSrc, index) => `
                            <div class="carousel-item ${index === 0 ? 'active' : ''}">
                                <img src="${imgSrc}"
                                     class="d-block w-100"
                                     alt="${propertyName} - Image ${index + 1}"
                                     onerror="this.onerror=null; this.src='/ROME/assets/img/default-property.jpg';">
                            </div>
                        `).join('')}
                    </div>
                    ${propertyImages.length > 1 ? `
                        <a class="carousel-control-prev" href="#${carouselId}" role="button" data-slide="prev">
                            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span class="sr-only">Previous</span>
                        </a>
                        <a class="carousel-control-next" href="#${carouselId}" role="button" data-slide="next">
                            <span class="carousel-control-next-icon" aria-hidden="true"></span>
                            <span class="sr-only">Next</span>
                        </a>
                    ` : ''}
                </div>
            `;

            // --- Generate Details HTML ---
            const detailsHTML = `
                <h3>${propertyName}</h3>
                <h4 class="h4 mb-3">₱${Number(propertyRent).toLocaleString()}/month</h4>
                <div class="detail-item mb-2">
                    <span class="badge badge-${propertyVacant ? 'success' : 'danger'}">
                        ${propertyVacant ? 'Available' : 'Occupied'}
                    </span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt fa-fw"></i>
                    <span class="text-muted">${propertyAddress}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-home fa-fw"></i>
                    <span class="text-muted">${propertyRooms} Rooms</span>
                </div>
                <div class="description">
                    <h5>Description</h5>
                    <p>${propertyDescription || 'No description provided.'}</p>
                </div>
                <div class="actions">
                    <button class="btn btn-primary btn-block mb-2 ${reservationStatus === 'approved' ? 'd-none' : ''}" id="rentNowBtn">
                        Rent Now
                    </button>
                    <div class="d-flex flex-column gap-2">
                        <button class="btn btn-block reserve-button ${
                            reservationStatus === 'pending' ? 'btn-warning' :
                            reservationStatus === 'approved' ? 'btn-success' :
                            'btn-primary'
                        }" data-property-id="${propertyId}" data-property-name="${propertyName}"
                        ${reservationStatus === 'approved' ? 'disabled' : ''}>
                            ${getReservationButtonText(reservationStatus)}
                        </button>
                        <button class="btn btn-outline-secondary btn-block add-to-favorites">
                            <i class="fas fa-heart" data-id="${propertyId}"></i> Add to Favorites
                        </button>
                    </div>
                </div>
            `;

            // Update modal content
            modalCarouselContainer.innerHTML = carouselHTML;
            modalDetailsContainer.innerHTML = detailsHTML;

            // Re-initialize Bootstrap Carousel for the new content
            $(`#${carouselId}`).carousel();

            // Initialize favorite button functionality within the modal
            initFavoriteButtons(modalDetailsContainer); // Pass container

            // Add event listener for Rent Now button within the modal
            const rentNowBtn = modalDetailsContainer.querySelector('#rentNowBtn');
            if (rentNowBtn) {
                rentNowBtn.addEventListener('click', function() {
                    // Rent Now should likely trigger a payment flow or different confirmation
                    // For now, let's show a distinct SweetAlert
                    Swal.fire({
                        title: 'Rent Now', // Correct title
                        text: 'Proceed to payment for ' + propertyName + '?', // Example text
                        icon: 'info',
                        showCancelButton: true,
                        confirmButtonColor: '#28a745', // Green for confirm
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, proceed!'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            // Placeholder for payment initiation logic
                            console.log('Proceeding to payment for property ID:', propertyId);
                            // Example: window.location.href = `/ROME/payment?property_id=${propertyId}`;
                            showToast('Redirecting to payment...', 'info');
                        }
                    });
                });
            }

            // Add event listener for Reserve button within the modal
            const reserveButton = modalDetailsContainer.querySelector('.reserve-button');
            if (reserveButton) { // Check if button exists
                reserveButton.addEventListener('click', function() {
                    const propertyId = this.getAttribute('data-property-id');
                    const propertyName = this.getAttribute('data-property-name');
                    const currentStatus = this.getAttribute('data-reservation-status');

                    if (currentStatus === 'approved') {
                        // Redirect to payment page
                        Swal.fire({
                            title: 'Reservation Approved!',
                            text: 'Your reservation for ' + propertyName + ' is approved. Proceed to payment?',
                            icon: 'success',
                            showCancelButton: true,
                            confirmButtonColor: '#28a745',
                            cancelButtonColor: '#6c757d',
                            confirmButtonText: 'Yes, Pay Now!',
                            cancelButtonText: 'Later'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                window.location.href = `/ROME/tenant/payment.php?property_id=${propertyId}`;
                            }
                        });
                    } else if (currentStatus === 'pending') {
                        // Existing cancel logic
                        Swal.fire({
                            title: 'Cancel Reservation',
                            text: 'Are you sure you want to cancel your pending reservation for ' + propertyName + '?',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#d33',
                            cancelButtonColor: '#6c757d',
                            confirmButtonText: 'Yes, cancel it!',
                            cancelButtonText: 'No, keep it'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                cancelReservation(propertyId, this); // Pass the button element
                            }
                        });
                    } else {
                        // Existing reserve logic
                        Swal.fire({
                            title: 'Make Reservation',
                            text: 'Would you like to reserve ' + propertyName + '?',
                            icon: 'question',
                            showCancelButton: true,
                            confirmButtonColor: '#007bff',
                            cancelButtonColor: '#6c757d',
                            confirmButtonText: 'Yes, reserve it!',
                            cancelButtonText: 'Not now'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                makeReservation(propertyId, this); // Pass the button element
                            }
                        });
                    }
                });
            }

            // Update button appearance based on status when modal opens
            const reserveBtnElement = modalDetailsContainer.querySelector('.reserve-button');
            if (reserveBtnElement) {
                const status = reserveBtnElement.getAttribute('data-reservation-status');
                reserveBtnElement.innerHTML = getReservationButtonText(status);
                reserveBtnElement.classList.remove('btn-primary', 'btn-warning', 'btn-success'); // Clear existing status classes
                const rentNowBtn = modalDetailsContainer.querySelector('#rentNowBtn');

                if (status === 'pending') {
                    reserveBtnElement.classList.add('btn-warning');
                    if(rentNowBtn) rentNowBtn.style.display = 'block'; // Show Rent Now if pending
                } else if (status === 'approved') {
                    reserveBtnElement.classList.add('btn-success');
                    if(rentNowBtn) rentNowBtn.style.display = 'none'; // Hide Rent Now if approved
                } else {
                    reserveBtnElement.classList.add('btn-primary');
                    if(rentNowBtn) rentNowBtn.style.display = 'block'; // Show Rent Now if not reserved/approved
                }
                // No need to disable if approved, as it now leads to payment
            }

            // Show the modal
            $(propertyDetailsModal).modal('show');
        });
    });

    function getReservationButtonText(status) {
        switch(status) {
            case 'pending':
                return '<i class="fas fa-clock"></i> Pending Approval';
            case 'approved':
                return '<i class="fas fa-check"></i> Approved - Proceed to Payment';
            case 'rejected':
                return '<i class="fas fa-times"></i> Reservation Rejected';
            default:
                return '<i class="fas fa-calendar-check"></i> Reserve';
        }
    }

    // Initialize favorite buttons (consider passing a container)
    function initFavoriteButtons(container = document) {
        const favoriteButtons = container.querySelectorAll('.add-to-favorites');

        favoriteButtons.forEach(button => {
            // Check initial favorite status (requires backend data)
            // For now, assume not favorited initially
            const heartIcon = button.querySelector('i');
            // Ensure correct initial state if needed (e.g., check a data attribute)
            // heartIcon.classList.add('far'); // Assuming default is not favorited
            // button.innerHTML = '<i class="far fa-heart"></i> Add to Favorites';

            // Remove previous listeners to avoid duplicates if called multiple times
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);

            newButton.addEventListener('click', function() {
                const propertyId = this.dataset.id || this.querySelector('i')?.dataset.id;
                if (!propertyId) {
                    console.error('Favorite button missing property ID');
                    return;
                }

                const currentHeartIcon = this.querySelector('i');
                const isFavorited = currentHeartIcon.classList.contains('fas');

                if (!isFavorited) {
                    // Add to favorites
                    currentHeartIcon.classList.replace('far', 'fas');
                    this.innerHTML = `<i class="fas fa-heart" data-id="${propertyId}"></i> Added to Favorites`;
                    this.classList.replace('btn-outline-secondary', 'btn-primary');
                    toggleFavorite(propertyId, 'addFavorite');
                } else {
                    // Remove from favorites
                    currentHeartIcon.classList.replace('fas', 'far');
                    this.innerHTML = `<i class="far fa-heart" data-id="${propertyId}"></i> Add to Favorites`;
                    this.classList.replace('btn-primary', 'btn-outline-secondary');
                    toggleFavorite(propertyId, 'removeFavorite');
                }
            });
        });
    }

    // Toggle favorite function (unified add/remove)
    function toggleFavorite(propertyId, action) {
        // Use the API router endpoint
        fetch(`/ROME/api/index.php?endpoint=properties&action=${action}&property_id=${propertyId}`, {
            method: 'POST', // POST is often used for state changes
            credentials: 'same-origin'
        })
        .then(response => {
            if (!response.ok) {
                 // Handle non-JSON error responses (like 403)
                 return response.text().then(text => { throw new Error(text || `HTTP error! status: ${response.status}`) });
            }
            return response.json();
        })
        .then(data => {
            if (data.success || data.status === 'success') { // Check both possible success keys
                showToast(data.message || `Property ${action === 'addFavorite' ? 'added to' : 'removed from'} favorites!`, 'success');
            } else {
                showToast(data.message || `Error ${action === 'addFavorite' ? 'adding to' : 'removing from'} favorites`, 'error');
                // Revert UI change on error if needed
                const button = document.querySelector(`.add-to-favorites [data-id="${propertyId}"]`)?.closest('button');
                if (button) {
                    const heartIcon = button.querySelector('i');
                    if (action === 'addFavorite') {
                        heartIcon.classList.replace('fas', 'far');
                        button.innerHTML = `<i class="far fa-heart" data-id="${propertyId}"></i> Add to Favorites`;
                        button.classList.replace('btn-primary', 'btn-outline-secondary');
                    } else {
                        heartIcon.classList.replace('far', 'fas');
                        button.innerHTML = `<i class="fas fa-heart" data-id="${propertyId}"></i> Added to Favorites`;
                        button.classList.replace('btn-outline-secondary', 'btn-primary');
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error toggling favorite:', error);
            showToast(`Error toggling favorite: ${error.message}`, 'error');
            // Revert UI change on error
             const button = document.querySelector(`.add-to-favorites [data-id="${propertyId}"]`)?.closest('button');
                if (button) {
                    const heartIcon = button.querySelector('i');
                    if (action === 'addFavorite') {
                        heartIcon.classList.replace('fas', 'far');
                        button.innerHTML = `<i class="far fa-heart" data-id="${propertyId}"></i> Add to Favorites`;
                        button.classList.replace('btn-primary', 'btn-outline-secondary');
                    } else {
                        heartIcon.classList.replace('far', 'fas');
                        button.innerHTML = `<i class="fas fa-heart" data-id="${propertyId}"></i> Added to Favorites`;
                        button.classList.replace('btn-outline-secondary', 'btn-primary');
                    }
                }
        });
    }

    // Call initFavoriteButtons on initial load for buttons outside the modal
    initFavoriteButtons();

    // --- Reservation Functionality ---
    function makeReservation(propertyId, buttonElement = null) {
        // Show loading state
        if (buttonElement) {
            buttonElement.disabled = true;
            buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        }

        // Make AJAX call to reserve property
        $.ajax({
            url: '/ROME/api/make_reservation.php',
            method: 'POST',
            data: {
                property_id: propertyId,
                action: 'reserve'
            },
            success: function(response) {
                if (response.success) {
                    // Show success message
                    Swal.fire({
                        title: 'Success!',
                        text: response.message || 'Your reservation has been submitted successfully.',
                        icon: 'success'
                    }).then(() => {
                        // Reload page to update UI
                        location.reload();
                    });
                } else {
                    // Show error message
                    Swal.fire({
                        title: 'Error',
                        text: response.message || 'Failed to make reservation. Please try again.',
                        icon: 'error'
                    });
                }
            },
            error: function(xhr, status, error) {
                // Show error message
                Swal.fire({
                    title: 'Error',
                    text: 'An error occurred while processing your request. Please try again.',
                    icon: 'error'
                });
                console.error('Reservation error:', error);
            },
            complete: function() {
                // Reset button state
                if (buttonElement) {
                    buttonElement.disabled = false;
                    buttonElement.innerHTML = '<i class="fas fa-calendar-check"></i> Reserve';
                }
            }
        });
    }

    function cancelReservation(propertyId, buttonElement = null) {
        // Show loading state
        if (buttonElement) {
            buttonElement.disabled = true;
            buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        }

        // Make AJAX call to cancel reservation
        $.ajax({
            url: '/ROME/api/make_reservation.php',
            method: 'POST',
            data: {
                property_id: propertyId,
                action: 'cancel'
            },
            success: function(response) {
                if (response.success) {
                    // Show success message
                    Swal.fire({
                        title: 'Cancelled!',
                        text: response.message || 'Your reservation has been cancelled.',
                        icon: 'success'
                    }).then(() => {
                        // Reload page to update UI
                        location.reload();
                    });
                } else {
                    // Show error message
                    Swal.fire({
                        title: 'Error',
                        text: response.message || 'Failed to cancel reservation. Please try again.',
                        icon: 'error'
                    });
                }
            },
            error: function(xhr, status, error) {
                // Show error message
                Swal.fire({
                    title: 'Error',
                    text: 'An error occurred while processing your request. Please try again.',
                    icon: 'error'
                });
                console.error('Cancellation error:', error);
            },
            complete: function() {
                // Reset button state
                if (buttonElement) {
                    buttonElement.disabled = false;
                    buttonElement.innerHTML = '<i class="fas fa-calendar-check"></i> Reserve';
                }
            }
        });
    }

    // Sorting functionality
    const sortLinks = document.querySelectorAll('.sort-properties');
    sortLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sortType = this.getAttribute('data-sort');
            sortProperties(sortType);
        });
    });

    function sortProperties(sortType) {
        const container = document.getElementById('propertyContainer');
        const items = Array.from(container.querySelectorAll('.property-item'));

        items.sort((a, b) => {
            const priceA = parseInt(a.getAttribute('data-price'));
            const priceB = parseInt(b.getAttribute('data-price'));
            const idA = parseInt(a.getAttribute('data-id'));
            const idB = parseInt(b.getAttribute('data-id'));

            if (sortType === 'price-low') {
                return priceA - priceB;
            } else if (sortType === 'price-high') {
                return priceB - priceA;
            } else if (sortType === 'newest') {
                return idB - idA; // Assuming higher IDs are newer
            }
            return 0;
        });

        // Clear container and append sorted items
        container.innerHTML = '';
        items.forEach(item => container.appendChild(item));
    }

    // Filter functionality
    const filterLinks = document.querySelectorAll('.filter-properties');
    filterLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const filterType = this.getAttribute('data-filter');
            filterProperties(filterType);
        });
    });

    function filterProperties(filterType) {
        const items = document.querySelectorAll('.property-item');

        items.forEach(item => {
            if (filterType === 'all') {
                item.style.display = '';
            } else if (filterType === 'available') {
                const badge = item.querySelector('.yt-badge');
                item.style.display = badge && badge.textContent.trim() === 'Available' ? '' : 'none';
            }
        });
    }

    // Toast notification function (ensure it's defined or imported)
    function showToast(message, type = 'info', duration = 3000) {
        // Check if the utility function exists, otherwise use alert
        if (typeof window.showToast === 'function') {
            window.showToast(message, type, duration);
        } else if (typeof toastr !== 'undefined') {
            // Fallback to toastr if available
            toastr[type](message);
        } else {
            // Basic alert fallback
            console.log(`Toast [${type}]: ${message}`);
            // alert(`[${type.toUpperCase()}] ${message}`); // Avoid disruptive alerts if possible
        }
    }

    // Re-run initFavoriteButtons if modal content changes dynamically elsewhere
    // Example: If properties are loaded via AJAX after initial page load

}); // End DOMContentLoaded

// Ensure jQuery dependent code runs after jQuery is loaded
// This $(document).ready() is redundant if all code is inside DOMContentLoaded
// but can be useful if mixing vanilla JS and jQuery outside the main listener.

function handlePayment(propertyId) {
    window.location.href = `/ROME/tenant/payment.php?room_id=${propertyId}`;
}

// Update the Rent Now button click handler
$('#rentNowBtn').on('click', function() {
    const propertyId = $(this).data('property-id');
    const propertyName = $(this).data('property-name');

    Swal.fire({
        title: 'Confirm Rental',
        text: `Are you sure you want to rent ${propertyName}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, proceed to payment!'
    }).then((result) => {
        if (result.isConfirmed) {
            handlePayment(propertyId);
        }
    });
});