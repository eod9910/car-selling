document.addEventListener('DOMContentLoaded', function() {
    const carForm = document.getElementById('car-form');
    const cancelButton = document.getElementById('cancelButton');
    const lookupVinButton = document.getElementById('lookup-vin');

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
    lookupVinButton.addEventListener('click', async function() {
        const vin = document.getElementById('vin').value;
        if (vin) {
            try {
                const carDetails = await fetchCarDetailsByVIN(vin);
                populateFormWithCarDetails(carDetails);
            } catch (error) {
                console.error('Error during VIN lookup:', error);
                alert('Failed to lookup VIN. Please try again or enter details manually.');
            }
        } else {
            alert('Please enter a VIN');
        }
    });

    async function fetchCarDetailsByVIN(vin) {
        const response = await fetch(`/api/vin-lookup/${vin}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'VIN lookup failed');
        }
        return await response.json();
    }

    function populateFormWithCarDetails(carDetails) {
        Object.keys(carDetails).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
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
        
        // Handle mileage field
        if (carData.mileage === '' || carData.mileage.toLowerCase() === 'n/a' || carData.mileage.toLowerCase() === 'na') {
            carData.mileage = null;
        } else {
            const mileageNum = Number(carData.mileage);
            if (!isNaN(mileageNum)) {
                carData.mileage = mileageNum;
            }
        }
        
        // Ensure required fields are numbers
        ['year', 'price'].forEach(field => {
            carData[field] = Number(carData[field]);
        });
        
        console.log('Submitting car data:', carData);

        try {
            const response = await fetch('/api/cars', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(carData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save car');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error saving car:', error);
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
        files = files.length ? files : this.files;
        [...files].forEach(previewFile);
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
});
