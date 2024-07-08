document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('id');
    const formTitle = document.getElementById('form-title');
    const carForm = document.getElementById('carForm');
    const submitButton = document.getElementById('submitButton');
    const addCarButton = document.getElementById('addCarButton');
    const cancelButton = document.getElementById('cancelButton');
    const lookupVinButton = document.getElementById('lookupVinButton');
    let existingImages = [];

    console.log('Car ID:', carId);

    if (carId) {
        console.log('Editing car with ID:', carId);
        if (formTitle) formTitle.textContent = 'Edit Car';
        loadCarDetails(carId);
    } else {
        console.log('Adding a new car');
        if (formTitle) formTitle.textContent = 'Add New Car';
    }

    if (carForm) {
        carForm.addEventListener('submit', submitCarForm);
    }

    if (addCarButton) {
        addCarButton.addEventListener('click', handleAddCar);
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', handleCancel);
    }

    if (lookupVinButton) {
        lookupVinButton.addEventListener('click', handleVinLookup);
    }

    setupVinDragDrop();
    setupDragAndDrop();

    async function loadCarDetails(carId) {
        try {
            console.log('Loading car details for ID:', carId);
            const response = await fetch(`/api/cars/${carId}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', response.status, errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            
            const car = await response.json();
            console.log('Loaded car details:', car);

            if (!car || typeof car !== 'object') {
                throw new Error('Invalid car data received from server');
            }

            // Populate form fields
            const fields = ['vin', 'make', 'model', 'year', 'price', 'mileage', 'lot', 'engine', 'transmission', 'fuelType'];
            fields.forEach(field => {
                const input = document.getElementById(field);
                if (input) {
                    input.value = car[field] || '';
                    console.log(`Set ${field} to:`, input.value);
                } else {
                    console.warn(`Field ${field} not found in the form`);
                }
            });

            // Handle existing images
            existingImages = car.images || [];
            displayExistingImages();
            
            if (submitButton) {
                submitButton.textContent = 'Update Car';
                console.log('Changed submit button text to "Update Car"');
            }

            console.log('Car details loaded successfully');
        } catch (error) {
            console.error('Error loading car details:', error);
            alert('Failed to load car details. Please try again. Error: ' + error.message);
        }
    }

    async function submitCarForm(event) {
        if (event) event.preventDefault();
        
        console.log('Submitting car form...');
        const carForm = document.getElementById('carForm');
        console.log('Car form element:', carForm);
        
        if (!carForm) {
            console.error('Car form not found');
            alert('Error: Car form not found');
            return;
        }
        
        const formData = new FormData(carForm);
        
        // Handle file inputs
        const fileInput = document.getElementById('carImages');
        if (fileInput && fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('carImages', fileInput.files[i]);
            }
        }
        
        // Append existing images
        formData.append('existingImages', JSON.stringify(existingImages));
        
        // Append newly added images from the preview container
        const previewContainer = document.getElementById('preview-container');
        const newImagePreviews = previewContainer.querySelectorAll('.image-preview');
        newImagePreviews.forEach((img, index) => {
            if (img.src.startsWith('data:')) {
                // This is a newly added image
                const blob = dataURLtoBlob(img.src);
                formData.append('carImages', blob, `new_image_${index}.jpg`);
            }
        });

        const vin = formData.get('vin');
        let url = '/api/cars';
        let method = 'POST';

        try {
            if (carId) {
                method = 'PUT';
                url = `/api/cars/${carId}`;
            } else {
                // Check if the car with this VIN already exists
                const checkResponse = await fetch(`/api/cars/check-vin/${vin}`);
                const { exists, carId: existingCarId } = await checkResponse.json();

                if (exists) {
                    method = 'PUT';
                    url = `/api/cars/${existingCarId}`;
                    console.log(`Car with VIN ${vin} already exists. Updating existing record.`);
                }
            }

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
            alert(carId ? 'Car updated successfully!' : 'Car added successfully!');
            window.location.href = '/car-listings';
        } catch (error) {
            console.error('Error in submitCarForm:', error);
            alert('Error saving car: ' + error.message);
        }
    }

    function handleAddCar(e) {
        e.preventDefault();
        if (validateForm()) {
            submitCarForm();
        }
    }

    function handleCancel() {
        if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
            resetForm();
            window.location.href = '/car-listings';
        }
    }

    async function handleVinLookup() {
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
    }

    function setupVinDragDrop() {
        const vinInput = document.getElementById('vin');
        if (!vinInput) return;
        
        vinInput.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            vinInput.style.background = '#e9ecef';
        });

        vinInput.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            vinInput.style.background = '';
        });

        vinInput.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            vinInput.style.background = '';
            const text = e.dataTransfer.getData('text');
            vinInput.value = text;
            document.getElementById('lookupVinButton').click();
        });
    }

    function setupDragAndDrop() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('carImages');
        const previewContainer = document.getElementById('preview-container');

        if (!dropZone || !fileInput || !previewContainer) {
            console.error('Required elements for drag and drop not found');
            return;
        }

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            handleFiles(files);
        });

        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            handleFiles(files);
        });

        // Add click event to the drop zone to trigger file input
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });
    }

    function handleFiles(files) {
        const previewContainer = document.getElementById('preview-container');
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = createImagePreview(e.target.result);
                    previewContainer.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        }
    }

    function createImagePreview(src) {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';

        const img = document.createElement('img');
        img.src = src;
        img.className = 'image-preview';
        wrapper.appendChild(img);

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => wrapper.remove();
        wrapper.appendChild(removeButton);

        return wrapper;
    }

    function displayExistingImages() {
        const previewContainer = document.getElementById('preview-container');
        if (!previewContainer) return;
        
        previewContainer.innerHTML = '';
        existingImages.forEach((image, index) => {
            const img = document.createElement('img');
            if (image.data) {
                // Convert binary data to base64
                const base64Image = btoa(String.fromCharCode.apply(null, new Uint8Array(image.data.data)));
                img.src = `data:${image.contentType};base64,${base64Image}`;
            } else {
                img.src = image; // Fallback to using image path if no binary data
            }
            img.className = 'image-preview';
            
            const wrapper = document.createElement('div');
            wrapper.className = 'image-wrapper';
            wrapper.appendChild(img);
            
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.onclick = () => removeImage(index);
            wrapper.appendChild(removeButton);
            
            previewContainer.appendChild(wrapper);
        });
    }

    function removeImage(index) {
        existingImages.splice(index, 1);
        displayExistingImages();
    }

    function resetForm() {
        const carForm = document.getElementById('carForm');
        if (carForm) carForm.reset();
        existingImages = [];
        displayExistingImages();
    }

    // ... (any other functions you need)
});