(function() {
    // Feature detection
    if (!document.querySelector || !window.fetch) {
        console.log('Browser does not support required features');
        return;
    }

    // Function to safely get elements
    function $(selector) {
        return document.querySelector(selector);
    }

    // Function to create and append an element
    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    }

    // Function to fetch car details
    async function fetchCarDetails(carId) {
        try {
            const response = await fetch(`/api/cars/${carId}`);
            if (!response.ok) throw new Error('Failed to fetch car details');
            return await response.json();
        } catch (error) {
            console.error('Error fetching car details:', error);
            $('#car-info').textContent = 'Failed to load car details.';
        }
    }

    // Function to display car details
    function displayCarDetails(car) {
        const carInfo = $('#car-info');
        carInfo.innerHTML = ''; // Clear existing content

        // Add car details
        carInfo.appendChild(createElement('h2', '', `${car.year} ${car.make} ${car.model}`));
        carInfo.appendChild(createElement('p', '', `Price: $${car.price.toLocaleString()}`));
        carInfo.appendChild(createElement('p', '', `VIN: ${car.vin}`));
        carInfo.appendChild(createElement('p', '', `Mileage: ${car.mileage ? car.mileage.toLocaleString() + ' miles' : 'N/A'}`));
        carInfo.appendChild(createElement('p', '', `Engine: ${car.engine || 'N/A'}`));
        carInfo.appendChild(createElement('p', '', `Transmission: ${car.transmission || 'N/A'}`));
        carInfo.appendChild(createElement('p', '', `Fuel Type: ${car.fuelType || 'N/A'}`));
        carInfo.appendChild(createElement('p', '', `Exterior Color: ${car.exteriorColor || 'N/A'}`));
        carInfo.appendChild(createElement('p', '', `Lot: ${car.lot || 'N/A'}`));

        // Display features and history if available
        if (car.features) carInfo.appendChild(createElement('p', '', `Features: ${car.features}`));
        if (car.history) carInfo.appendChild(createElement('p', '', `History: ${car.history}`));
        if (car.dmvBackFees) carInfo.appendChild(createElement('p', '', `DMV Back Fees: $${car.dmvBackFees.toLocaleString()}`));

        // Display images (if available)
        const carImages = $('#car-images');
        if (carImages) {
            carImages.innerHTML = ''; // Clear existing images
            if (car.images && car.images.length > 0) {
                car.images.forEach(imageSrc => {
                    const img = createElement('img', 'car-image');
                    img.src = imageSrc;
                    img.alt = `${car.year} ${car.make} ${car.model}`;
                    carImages.appendChild(img);
                });
            } else {
                carImages.appendChild(createElement('p', '', 'No images available'));
            }
        }

        // Add edit and delete buttons
        const actionButtons = createElement('div', 'action-buttons');
        const editButton = createElement('button', 'btn btn-primary', 'Edit');
        editButton.onclick = () => window.location.href = `/car-management?id=${car._id}`;
        const deleteButton = createElement('button', 'btn btn-danger', 'Delete');
        deleteButton.onclick = () => confirmDelete(car._id);
        actionButtons.appendChild(editButton);
        actionButtons.appendChild(deleteButton);
        carInfo.appendChild(actionButtons);
    }

    function confirmDelete(carId) {
        if (confirm('Are you sure you want to delete this car? This action cannot be undone.')) {
            deleteCar(carId);
        }
    }

    async function deleteCar(carId) {
        try {
            const response = await fetch(`/api/cars/${carId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete car');
            }
            alert('Car deleted successfully');
            window.location.href = '/car-listings'; // Redirect to car listings page
        } catch (error) {
            console.error('Error deleting car:', error);
            alert('Failed to delete car. Please try again.');
        }
    }

    // Main execution
    document.addEventListener('DOMContentLoaded', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const carId = urlParams.get('id');
        if (carId) {
            fetchCarDetails(carId).then(car => {
                if (car) displayCarDetails(car);
            });
        } else {
            document.getElementById('car-info').textContent = 'No car ID provided.';
        }
    });
})();
