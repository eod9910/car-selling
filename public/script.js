let cars = JSON.parse(localStorage.getItem('cars')) || [];
console.log("Initial cars array:", cars);

// Function to generate car listings
function generateCarListings(carList = cars) {
  const carListingsContainer = document.querySelector(".car-listings");
  if (!carListingsContainer) return; // Exit if not on a page with car listings
  
  carListingsContainer.innerHTML = ''; // Clear existing listings

  if (carList.length === 0) {
    carListingsContainer.innerHTML = '<p>No cars available. Please add cars through the CMS page.</p>';
    return;
  }

  carList.forEach((car, index) => {
    console.log(`Car ${index} images:`, car.images); // Add this line

    const carListing = document.createElement("div");
    carListing.classList.add("car-listing");

    const carImage = document.createElement("img");
    carImage.src = car.images && car.images.length > 0 ? car.images[0] : 'placeholder.jpg';
    carImage.alt = `${car.make} ${car.model}`;
    carListing.appendChild(carImage);

    const carTitle = document.createElement("h3");
    carTitle.textContent = `${car.make} ${car.model}`;
    carListing.appendChild(carTitle);

    const carInfo = document.createElement("p");
    carInfo.textContent = `${car.year} | $${car.price}`;
    carListing.appendChild(carInfo);

    const carDetailsLink = document.createElement("a");
    carDetailsLink.href = `carDetails.html?id=${car.id}`; // Assuming each car has a unique id
    carDetailsLink.textContent = "View Details";
    carListing.appendChild(carDetailsLink);

    carListingsContainer.appendChild(carListing);
  });
}

// Function to handle search/filter form submission
function handleSearchFilterFormSubmit(event) {
  event.preventDefault();

  const make = document.querySelector("#make").value;
  const model = document.querySelector("#model").value;
  const yearSelect = document.querySelector("#year").value;
  const yearInput = document.querySelector("#year-input").value;
  const year = yearInput || yearSelect; // Use input if provided, otherwise use select
  const price = document.querySelector("#price").value;

  const filteredCars = cars.filter((car) => {
    if (make && car.make.toLowerCase() !== make.toLowerCase()) return false;
    if (model && car.model.toLowerCase() !== model.toLowerCase()) return false;
    if (year && car.year !== parseInt(year)) return false;
    if (price) {
      const [minPrice, maxPrice] = price.split("-").map(Number);
      if (car.price < minPrice || car.price > maxPrice) return false;
    }
    return true;
  });

  generateCarListings(filteredCars);
}

// Ensure this event listener is set up when the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  const searchForm = document.getElementById("search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", handleSearchFilterFormSubmit);
  }
});

// Function to handle CMS form submission
async function handleCMSFormSubmit(event) {
  event.preventDefault();
  console.log("Form submission started");

  const fileInput = document.getElementById('images');
  if (!fileInput) {
    console.error("File input element not found");
    return;
  }
  const files = fileInput.files;
  
  try {
    // Convert images to Base64
    const imagePaths = await Promise.all(Array.from(files).map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = (error) => reject(`Error reading file: ${error}`);
        reader.readAsDataURL(file);
      });
    }));

    console.log('Image paths:', imagePaths);

    const formElements = [
      'make', 'model', 'year', 'price', 'engine', 'transmission', 
      'fuelType', 'mileage', 'exteriorColor', 'interiorColor', 
      'features', 'history', 'dmvBackFees' // Changed from 'lienSaleBackFees' to 'dmvBackFees'
    ];

    const formData = {};
    for (const element of formElements) {
      const input = document.getElementById(element);
      if (!input) {
        console.error(`Element with id '${element}' not found`);
        return;
      }
      formData[element] = input.value;
    }

    const newCar = {
      id: Date.now().toString(),
      make: formData.make,
      model: formData.model,
      year: parseInt(formData.year),
      price: parseInt(formData.price),
      images: imagePaths,
      specifications: {
        engine: formData.engine,
        transmission: formData.transmission,
        fuelType: formData.fuelType,
        mileage: formData.mileage,
        exteriorColor: formData.exteriorColor,
        interiorColor: formData.interiorColor,
      },
      features: formData.features.split(',').map(feature => feature.trim()),
      history: formData.history,
      dmvBackFees: parseFloat(formData.dmvBackFees) || 0 // Changed from 'lienSaleBackFees' to 'dmvBackFees'
    };

    cars.push(newCar);

    localStorage.setItem('cars', JSON.stringify(cars));

    console.log('New car added:', newCar);
    console.log('Current cars array:', cars);

    event.target.reset();
    alert('New car added successfully!');
    generateCMSCarListings();
  } catch (error) {
    console.error('Error processing images:', error);
    alert(`There was an error processing the images: ${error}. Please try again.`);
  }
}

// Function to handle contact form submission
function handleContactFormSubmit(event) {
  event.preventDefault();

  const name = document.querySelector("#name").value;
  const email = document.querySelector("#email").value;
  const message = document.querySelector("#message").value;

  // Perform contact form submission logic here...

  // Redirect to thank you page
  window.location.href = "thankYou.html";
}

// Function to generate individual car details
function generateCarDetails() {
  const carDetailsContainer = document.querySelector(".car-details");
  if (!carDetailsContainer) return;

  const urlParams = new URLSearchParams(window.location.search);
  const carId = urlParams.get("id");

  const car = cars.find(car => car.id === carId);

  if (!car) {
    carDetailsContainer.innerHTML = '<p>Car not found.</p>';
    return;
  }

  console.log('Car details:', car);
  console.log('Car images:', car.images);

  let carDetailsHTML = `
    <h2>${car.make} ${car.model}</h2>
    <div class="car-images">
      ${car.images && car.images.length > 0 
        ? car.images.map((image, index) => `
            <img src="${image}" alt="${car.make} ${car.model} - Image ${index + 1}" 
                 onerror="this.src='placeholder.jpg'; console.error('Failed to load image:', this.src);"
                 onload="console.log('Image loaded successfully:', this.src)">
          `).join('')
        : '<img src="placeholder.jpg" alt="No image available">'}
    </div>
    <p>Year: ${car.year}</p>
    <p>Price: $${car.price}</p>
    <p>DMV Back Fees: $${car.dmvBackFees ? car.dmvBackFees.toFixed(2) : '0.00'}</p>
    <h3>Specifications</h3>
    <ul>
      <li>Engine: ${car.specifications.engine}</li>
      <li>Transmission: ${car.specifications.transmission}</li>
      <li>Fuel Type: ${car.specifications.fuelType}</li>
      <li>Mileage: ${car.specifications.mileage}</li>
      <li>Exterior Color: ${car.specifications.exteriorColor}</li>
      <li>Interior Color: ${car.specifications.interiorColor}</li>
    </ul>
    <h3>Features</h3>
    <ul>
      ${car.features.map(feature => `<li>${feature}</li>`).join('')}
    </ul>
    <h3>History</h3>
    <p>${car.history}</p>
  `;

  carDetailsContainer.innerHTML = carDetailsHTML;
}

// Function to generate CMS car listings
function generateCMSCarListings() {
  const cmsCarListingsContainer = document.getElementById("cms-car-listings");
  if (!cmsCarListingsContainer) {
    console.log("CMS car listings container not found");
    return;
  }

  console.log("Generating CMS car listings");
  console.log("Current cars array:", cars);

  cmsCarListingsContainer.innerHTML = '';

  if (cars.length === 0) {
    cmsCarListingsContainer.innerHTML = '<p>No cars available. Add cars using the form above.</p>';
    return;
  }

  cars.forEach((car, index) => {
    const carListing = document.createElement("div");
    carListing.classList.add("cms-car-listing");

    const carImage = document.createElement("img");
    carImage.src = car.images[0] || 'placeholder.jpg';
    carImage.alt = `${car.make} ${car.model}`;
    carImage.classList.add("cms-car-image");
    carListing.appendChild(carImage);

    const carInfo = document.createElement("div");
    carInfo.classList.add("cms-car-info");
    carInfo.innerHTML = `
      <h3>${car.make} ${car.model}</h3>
      <p>Year: ${car.year}</p>
      <p>Price: $${car.price}</p>
      <p>DMV Back Fees: $${car.dmvBackFees ? car.dmvBackFees.toFixed(2) : '0.00'}</p>
      <p>Engine: ${car.specifications.engine}</p>
      <p>Transmission: ${car.specifications.transmission}</p>
      <p>Fuel Type: ${car.specifications.fuelType}</p>
      <p>Mileage: ${car.specifications.mileage}</p>
      <p>Exterior Color: ${car.specifications.exteriorColor}</p>
      <p>Interior Color: ${car.specifications.interiorColor}</p>
      <p>Features: ${car.features.join(', ')}</p>
      <p>History: ${car.history}</p>
    `;
    carListing.appendChild(carInfo);

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.classList.add("cms-button", "edit-button");
    editButton.addEventListener("click", () => editCar(index));
    carListing.appendChild(editButton);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("cms-button", "delete-button");
    deleteButton.addEventListener("click", () => deleteCar(index));
    carListing.appendChild(deleteButton);

    cmsCarListingsContainer.appendChild(carListing);
  });

  console.log("CMS car listings generated");
}

// Function to delete a car
function deleteCar(index) {
  if (!isAuthorized) {
    alert("You are not authorized to delete cars.");
    return;
  }

  if (confirm("Are you sure you want to delete this car?")) {
    cars.splice(index, 1);
    localStorage.setItem('cars', JSON.stringify(cars));
    generateCMSCarListings(); // Update the CMS listings
  }
}

// Authorization check
let isAuthorized = sessionStorage.getItem('isAuthorized') === 'true';

function checkAuthorization() {
  const cmsLink = document.getElementById("cms-link");

  if (window.location.href.includes("cms.html") && !isAuthorized) {
    const password = prompt("Enter the CMS password:");
    isAuthorized = (password === "admin123"); // Replace with a secure method in a real app
    
    if (isAuthorized) {
      sessionStorage.setItem('isAuthorized', 'true');
      if (cmsLink) cmsLink.style.display = "block";
    } else {
      alert("Unauthorized access");
      window.location.href = "index.html";
    }
  } else {
    // For non-CMS pages or if already authorized, just show the CMS link if authorized
    if (isAuthorized && cmsLink) {
      cmsLink.style.display = "block";
    }
  }
}

// Add a logout function
function logout() {
  isAuthorized = false;
  sessionStorage.removeItem('isAuthorized');
  document.getElementById("cms-link").style.display = "none";
  if (window.location.href.includes("cms.html")) {
    window.location.href = "index.html";
  }
}

// Call this function when the page loads
document.addEventListener("DOMContentLoaded", () => {
  checkAuthorization();

  console.log("DOM Content Loaded");
  console.log("Current page:", window.location.href);
  console.log("Current cars array:", cars);

  // Generate car listings on the car listings page and search filter page
  if (document.querySelector(".car-listings")) {
    console.log("Generating car listings");
    generateCarListings();
  }

  // Set up search filter form submission
  const searchForm = document.getElementById("search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", handleSearchFilterFormSubmit);
  }

  const cmsForm = document.getElementById("cms-form");
  if (cmsForm) {
    cmsForm.addEventListener("submit", handleCMSFormSubmit);
  }

  if (document.getElementById("cms-car-listings")) {
    console.log("Generating CMS car listings");
    generateCMSCarListings();
  }

  // Add event listener for the VIN lookup button
  const lookupButton = document.getElementById('lookup-vin');
  if (lookupButton) {
    lookupButton.addEventListener('click', lookupVIN);
  }
});

async function lookupVIN() {
  const vin = document.getElementById('vin').value.trim();
  if (vin.length !== 17) {
    alert('Please enter a valid 17-character VIN.');
    return;
  }

  try {
    const carDetails = await getCarDetailsByVIN(vin);
    populateFormWithCarDetails(carDetails);
    alert('Car details populated successfully! Please review and adjust if necessary.');
  } catch (error) {
    console.error('Error looking up VIN:', error);
    alert('Unable to retrieve car details. Please fill in the details manually.');
  }
}

async function getCarDetailsByVIN(vin) {
  // In a real implementation, you would call a VIN decoding API here.
  // For this example, we'll use the NHTSA API which is free but provides limited information.
  const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
  const data = await response.json();
  
  // Extract relevant information from the API response
  const results = data.Results;
  const getValueByVariable = (variable) => {
    const item = results.find(item => item.Variable === variable);
    return item ? item.Value : '';
  };

  return {
    make: getValueByVariable('Make'),
    model: getValueByVariable('Model'),
    year: getValueByVariable('Model Year'),
    engine: getValueByVariable('Engine Model'),
    transmission: getValueByVariable('Transmission Style'),
    fuelType: getValueByVariable('Fuel Type - Primary'),
    // Add more fields as needed
  };
}

function populateFormWithCarDetails(carDetails) {
  document.getElementById('make').value = carDetails.make;
  document.getElementById('model').value = carDetails.model;
  document.getElementById('year').value = carDetails.year;
  document.getElementById('engine').value = carDetails.engine;
  document.getElementById('transmission').value = carDetails.transmission;
  document.getElementById('fuelType').value = carDetails.fuelType;
  // Populate other fields as needed
}

function editCar(index) {
  const car = cars[index];
  
  // Populate the form with the car's current data
  document.getElementById('make').value = car.make;
  document.getElementById('model').value = car.model;
  document.getElementById('year').value = car.year;
  document.getElementById('price').value = car.price;
  document.getElementById('engine').value = car.specifications.engine;
  document.getElementById('transmission').value = car.specifications.transmission;
  document.getElementById('fuelType').value = car.specifications.fuelType;
  document.getElementById('mileage').value = car.specifications.mileage;
  document.getElementById('exteriorColor').value = car.specifications.exteriorColor;
  document.getElementById('interiorColor').value = car.specifications.interiorColor;
  document.getElementById('features').value = car.features.join(', ');
  document.getElementById('history').value = car.history;
  document.getElementById('dmvBackFees').value = car.dmvBackFees || ''; // Add this line

  // Change the form submit button to "Done"
  const submitButton = document.querySelector('#cms-form button[type="submit"]');
  submitButton.textContent = 'Done';
  submitButton.onclick = (event) => updateCar(event, index);

  // Add a cancel button
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.type = 'button';
  cancelButton.classList.add('cms-button'); // Add this line
  cancelButton.onclick = resetForm;
  submitButton.insertAdjacentElement('afterend', cancelButton);

  // Scroll to the form
  document.getElementById('cms-form').scrollIntoView({ behavior: 'smooth' });
}

function updateCar(event, index) {
  event.preventDefault();

  const updatedCar = {
    ...cars[index], // Preserve the original id and images
    make: document.getElementById('make').value,
    model: document.getElementById('model').value,
    year: parseInt(document.getElementById('year').value),
    price: parseInt(document.getElementById('price').value),
    specifications: {
      engine: document.getElementById('engine').value,
      transmission: document.getElementById('transmission').value,
      fuelType: document.getElementById('fuelType').value,
      mileage: document.getElementById('mileage').value,
      exteriorColor: document.getElementById('exteriorColor').value,
      interiorColor: document.getElementById('interiorColor').value,
    },
    features: document.getElementById('features').value.split(',').map(feature => feature.trim()),
    history: document.getElementById('history').value,
    dmvBackFees: parseFloat(document.getElementById('dmvBackFees').value) || 0 // Add this line
  };

  cars[index] = updatedCar;
  localStorage.setItem('cars', JSON.stringify(cars));

  alert('Car updated successfully!');
  
  resetForm();
  generateCMSCarListings();
}

function resetForm() {
  const form = document.getElementById('cms-form');
  form.reset();
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.textContent = 'Add Car';
  submitButton.onclick = handleCMSFormSubmit;
  
  const cancelButton = form.querySelector('button[type="button"]');
  if (cancelButton) cancelButton.remove();
}
