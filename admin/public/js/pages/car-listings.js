document.addEventListener('DOMContentLoaded', function() {
    fetchCarListings();
});

async function fetchCarListings() {
    const listingsContainer = document.getElementById('car-listings');
    listingsContainer.innerHTML = '<p>Loading car listings...</p>'; // Loading indicator

    try {
        const response = await fetch('/api/cars');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const cars = await response.json();
        
        if (!Array.isArray(cars)) {
            throw new Error('Server did not return an array of cars');
        }
        
        displayCarListings(cars);
    } catch (error) {
        console.error('Error fetching car listings:', error);
        listingsContainer.innerHTML = '<p>Error loading car listings. Please try again later.</p>';
    }
}

function displayCarListings(cars) {
    const listingsContainer = document.getElementById('car-listings');
    listingsContainer.innerHTML = ''; // Clear existing listings

    if (cars.length === 0) {
        listingsContainer.innerHTML = '<p>No cars found.</p>';
        return;
    }

    cars.forEach(car => {
        const carElement = document.createElement('div');
        carElement.className = 'car-item';
        carElement.innerHTML = `
            <h3>${car.year} ${car.make} ${car.model}</h3>
            <p>VIN: ${car.vin}</p>
            <p>Price: $${car.price}</p>
            <p>Mileage: ${car.mileage} miles</p>
            <p>Lot: ${car.lot}</p>
            <div class="car-actions">
                <button class="edit-btn" data-car-id="${car._id}">Edit</button>
                <button class="delete-btn" data-car-id="${car._id}">Delete</button>
            </div>
        `;
        listingsContainer.appendChild(carElement);
    });

    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', handleEdit);
    });
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', handleDelete);
    });
}

function handleEdit(event) {
    const carId = event.target.getAttribute('data-car-id');
    window.location.href = `/car-management?id=${carId}`;
}

async function handleDelete(event) {
    const carId = event.target.getAttribute('data-car-id');
    if (confirm('Are you sure you want to delete this car?')) {
        try {
            const response = await fetch(`/api/cars/${carId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            alert('Car deleted successfully');
            // Refresh the listings after successful deletion
            fetchCarListings();
        } catch (error) {
            console.error('Error deleting car:', error);
            alert('Failed to delete car. Please try again.');
        }
    }
}