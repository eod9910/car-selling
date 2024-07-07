document.addEventListener('DOMContentLoaded', function() {
    const carForm = document.getElementById('car-form');
    const cancelButton = document.getElementById('cancelButton');
    const lookupVinButton = document.getElementById('lookup-vin');
    const addCarButton = document.getElementById('addCarButton');

    let isEditing = false;
    let editingCarId = null;

    let existingImages = [];

    async function loadCarDetails(carId) {
        const response = await fetch(`/api/cars/${carId}`);
        const car = await response.json();
        // Populate form fields with car data
        document.getElementById('make').value = car.make;
        document.getElementById('model').value = car.model;
        // ... populate other fields

        existingImages = car.images || [];
        displayExistingImages();
    }

    function displayExistingImages() {
        const container = document.getElementById('existing-images');
        container.innerHTML = '';
        existingImages.forEach((imageSrc, index) => {
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'image-wrapper';
            
            const img = document.createElement('img');
            img.src = imageSrc;
            img.alt = 'Car Image';
            img.className = 'thumbnail';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => removeImage(index);
            
            imgWrapper.appendChild(img);
            imgWrapper.appendChild(deleteBtn);
            container.appendChild(imgWrapper);
        });
    }

    function removeImage(index) {
        existingImages.splice(index, 1);
        displayExistingImages();
    }

    // VIN Lookup
    async function getCarDetailsByVIN(vin) {
        const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`;
        console.log('Fetching VIN data from:', url); // Debugging line
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`VIN lookup failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        
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
        };
    }

    // Update the VIN lookup event listener
    lookupVinButton.addEventListener('click', async function() {
        const vin = document.getElementById('vin').value.trim();
        if (vin) {
            try {
                document.getElementById('vin-loading').style.display = 'block';
                const carDetails = await getCarDetailsByVIN(vin);
                populateFormWithCarDetails(carDetails);
            } catch (error) {
                console.error('Error during VIN lookup:', error);
                alert(`Failed to lookup VIN: ${error.message}. Please try again or enter details manually.`);
            } finally {
                document.getElementById('vin-loading').style.display = 'none';
            }
        } else {
            alert('Please enter a VIN');
        }
    });

    function populateFormWithCarDetails(carDetails) {
        Object.keys(carDetails).forEach(key => {
            const input = document.getElementById(key);
            if (input && carDetails[key]) {
                input.value = carDetails[key];
            }
        });
    }

    // Form Submission
    carForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        formData.append('existingImages', JSON.stringify(existingImages));
        
        const carId = new URLSearchParams(window.location.search).get('id');
        const method = carId ? 'PUT' : 'POST';
        const url = carId ? `/api/cars/${carId}` : '/api/cars';

        try {
            console.log('Submitting car data:', Object.fromEntries(formData));
            const response = await fetch(url, {
                method: method,
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save car');
            }
            
            const result = await response.json();
            console.log('Car saved successfully:', result);
            alert('Car saved successfully!');
            resetForm(); // Clear form and previews after successful submission
            window.location.href = '/car-listings';
        } catch (error) {
            console.error('Error saving car:', error);
            console.error('Error details:', error.message);
            alert('Failed to save car: ' + error.message);
        }
    });

    // Cancel button functionality
    cancelButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
            resetForm();
        }
    });

    function resetForm() {
        carForm.reset();
        clearImagePreviews();
        existingImages = []; // Clear existing images array
        displayExistingImages(); // Update the display of existing images
    }

    function clearImagePreviews() {
        const previewContainer = document.getElementById('preview-container');
        previewContainer.innerHTML = '';
        const fileInput = document.getElementById('carImages');
        fileInput.value = ''; // Reset the file input
    }

    async function submitCarForm() {
        const formData = new FormData(carForm);
        const carData = Object.fromEntries(formData);
        
        console.log('Submitting car data:', carData);

        try {
            const response = await fetch('/api/cars', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(carData)
            });

            console.log('Response status:', response.status);
            const responseData = await response.json();
            console.log('Response data:', responseData);

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to save car');
            }

            return responseData;
        } catch (error) {
            console.error('Error in submitCarForm:', error);
            throw error;
        }
    }

    function validateForm() {
        const requiredFields = carForm.querySelectorAll('[required]');
        for (let field of requiredFields) {
            if (!field.value.trim()) {
                alert(`Please fill out the ${field.name} field.`);
                return false;
            }
        }
        return true;
    }

    // Drag and Drop functionality
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('carImages');
    const previewContainer = document.getElementById('preview-container');

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);

    // Handle selected files
    fileInput.addEventListener('change', handleFiles);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        preventDefaults(e);
        dropZone.classList.add('dragover');
    }

    function unhighlight(e) {
        preventDefaults(e);
        dropZone.classList.remove('dragover');
    }

    function handleDrop(e) {
        preventDefaults(e);
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        files = files.length ? Array.from(files) : Array.from(this.files);
        files.forEach(previewFile);
    }

    function previewFile(file) {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function() {
            let img = document.createElement('img');
            img.src = reader.result;
            img.className = 'image-preview';
            previewContainer.appendChild(img);
        }
    }

    // Load car details if editing an existing car
    const carId = new URLSearchParams(window.location.search).get('id');
    if (carId) {
        loadCarDetails(carId);
    }

    // Setup VIN drag and drop
    function setupVinDragDrop() {
        const vinInput = document.getElementById('vin');
        
        vinInput.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.style.background = '#e9ecef';
        });

        vinInput.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.style.background = '';
        });

        vinInput.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.style.background = '';
            
            const dt = e.dataTransfer;
            const text = dt.getData('text');
            
            this.value = text;
            // Optionally trigger VIN lookup here
            lookupVinButton.click();
        });
    }

    setupVinDragDrop();

    addCarButton.addEventListener('click', async function(e) {
        e.preventDefault();
        if (validateForm()) {
            try {
                const result = await submitCarForm();
                console.log('Car added successfully:', result);
                alert('Car added successfully!');
                resetForm();
                window.location.href = '/car-listings';
            } catch (error) {
                console.error('Error adding car:', error);
                alert('Failed to add car: ' + error.message);
            }
        }
    });
});