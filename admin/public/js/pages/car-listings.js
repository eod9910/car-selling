document.addEventListener('DOMContentLoaded', function() {
    fetchCarListings();
});

async function fetchCarListings() {
    try {
        const response = await fetch('/api/cars');
        if (!response.ok) {
            throw new Error('Failed to fetch car listings');
        }
        const data = await response.json();
        displayCarListings(data.cars);
    } catch (error) {
        console.error('Error fetching car listings:', error);
        document.getElementById('car-listings').innerHTML = '<p>Error loading car listings.</p>';
    }
}

function displayCarListings(cars) {
    const listingsContainer = document.getElementById('car-listings');
    if (!listingsContainer) {
        console.error('Car listings container not found');
        return;
    }

    listingsContainer.innerHTML = ''; // Clear existing listings

    cars.forEach(car => {
        const listingElement = createCarElement(car);
        listingsContainer.appendChild(listingElement);
    });
}

function createCarElement(car) {
    const listingElement = document.createElement('div');
    listingElement.className = 'car-item';
    
    const saleDate = new Date(car.createdAt);
    const daysSinceSale = Math.floor((new Date() - saleDate) / (1000 * 60 * 60 * 24));

    listingElement.innerHTML = `
        <div class="vehicle">${car.year} ${car.make} ${car.model}</div>
        <div class="status">Days Stored: ${daysSinceSale}</div>
        <div class="tow-source">Lot: ${car.lot || 'N/A'}</div>
        <div class="reason">VIN: ${car.vin}</div>
        <div class="driver">Sale Date: ${saleDate.toLocaleDateString()}</div>
        <div class="account">Price: $${car.price.toLocaleString()}</div>
        <div class="balance">DMV Fees: $${car.dmvBackFees ? car.dmvBackFees.toLocaleString() : 'N/A'}</div>
        <div class="car-actions">
            <button class="btn-edit" onclick="editCar('${car._id}')">Edit</button>
            <button class="btn-delete" onclick="deleteCar('${car._id}')">Delete</button>
        </div>
    `;

    return listingElement;
}

function editCar(carId) {
    window.location.href = `/car-management?id=${carId}`;
}

async function deleteCar(carId) {
    if (confirm('Are you sure you want to delete this car?')) {
        try {
            const response = await fetch(`/api/cars/${carId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error('Failed to delete car');
            }
            fetchCarListings(); // Refresh the list after deletion
        } catch (error) {
            console.error('Error deleting car:', error);
            alert('Error deleting car. Please try again.');
        }
    }
}
