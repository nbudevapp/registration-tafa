// Configuration - แก้ไข URL นี้เป็น Google Apps Script Web App URL ของคุณ
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz-dqKFypei7wEKpoxRGwVkUTD6x5IsJsHlCo0JcN_ET8ZAaazkGk-cxbmyoGOlHedc/exec';


// Global Variables
let currentPage = 1;

// Page Navigation
function nextPage() {
    if (currentPage === 1) {
        if (!validatePDPA()) return;
    }
    
    if (currentPage < 3) {
        document.getElementById(`page${currentPage}`).classList.remove('active');
        document.getElementById(`step${currentPage}`).classList.add('completed');
        document.getElementById(`step${currentPage}`).classList.remove('active');
        
        currentPage++;
        
        document.getElementById(`page${currentPage}`).classList.add('active');
        document.getElementById(`step${currentPage}`).classList.add('active');
    }
}

function prevPage() {
    if (currentPage > 1) {
        document.getElementById(`page${currentPage}`).classList.remove('active');
        document.getElementById(`step${currentPage}`).classList.remove('active');
        
        currentPage--;
        
        document.getElementById(`page${currentPage}`).classList.add('active');
        document.getElementById(`step${currentPage}`).classList.remove('completed');
        document.getElementById(`step${currentPage}`).classList.add('active');
    }
}

// Validation Functions
function validatePDPA() {
    const pdpaConsent = document.getElementById('pdpaConsent');
    const pdpaError = document.getElementById('pdpaError');
    
    if (!pdpaConsent.checked) {
        pdpaError.style.display = 'block';
        pdpaConsent.classList.add('error');
        return false;
    }
    
    pdpaError.style.display = 'none';
    pdpaConsent.classList.remove('error');
    return true;
}

function validateForm() {
    let isValid = true;
    
    // Validate required fields
    const requiredFields = ['course', 'firstName', 'lastName', 'email', 'organization', 'position', 'phone'];
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        const error = document.getElementById(fieldId + 'Error');
        
        if (!field.value.trim()) {
            error.style.display = 'block';
            field.classList.add('error');
            isValid = false;
        } else {
            error.style.display = 'none';
            field.classList.remove('error');
        }
    });

    // Validate email format
    const email = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email.value.trim() && !emailRegex.test(email.value)) {
        emailError.textContent = 'รูปแบบอีเมลไม่ถูกต้อง';
        emailError.style.display = 'block';
        email.classList.add('error');
        isValid = false;
    }

    // Validate time selection
    const timeCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="time"]');
    const timeError = document.getElementById('timeError');
    const isTimeSelected = Array.from(timeCheckboxes).some(cb => cb.checked);
    
    if (!isTimeSelected) {
        timeError.style.display = 'block';
        isValid = false;
    } else {
        timeError.style.display = 'none';
    }

    return isValid;
}

// Data Collection
function collectFormData() {
    const timePreferences = [];
    
    if (document.getElementById('time1').checked) {
        timePreferences.push(document.getElementById('time1').value);
    }
    if (document.getElementById('time2').checked) {
        timePreferences.push(document.getElementById('time2').value);
    }
    if (document.getElementById('timeOther').checked) {
        const otherTime = document.getElementById('timeOtherText').value;
        timePreferences.push(otherTime ? `อื่นๆ: ${otherTime}` : 'อื่นๆ');
    }

    return {
        course: document.getElementById('course').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        organization: document.getElementById('organization').value,
        position: document.getElementById('position').value,
        phone: document.getElementById('phone').value,
        timePreferences: timePreferences.join(', '),
        lineId: document.getElementById('lineId').value || 'ไม่ระบุ',
        timestamp: new Date().toLocaleString('th-TH')
    };
}

// Form Submission
async function submitForm() {
    if (!validateForm()) return;

    const loading = document.getElementById('loading');
    loading.style.display = 'block';

    const formData = collectFormData();

    try {
        // ส่งข้อมูลไปยัง Google Apps Script
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // จำเป็นสำหรับ Google Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'saveRegistration',
                data: formData
            })
        });

        // เนื่องจากใช้ no-cors จึงไม่สามารถอ่าน response ได้
        // แต่หากไม่มี error แสดงว่าส่งสำเร็จ
        loading.style.display = 'none';
        console.log('Form data sent:', formData);
        nextPage();

    } catch (error) {
        loading.style.display = 'none';
        console.error('Error sending data:', error);
        
        // Fallback: ใช้ URL parameters แทน
        const params = new URLSearchParams({
            action: 'saveRegistration',
            course: formData.course,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            organization: formData.organization,
            position: formData.position,
            phone: formData.phone,
            timePreferences: formData.timePreferences,
            lineId: formData.lineId,
            timestamp: formData.timestamp
        });

        // เปิดหน้าต่างใหม่เพื่อส่งข้อมูล แล้วปิดทันที
        const popup = window.open(`${GOOGLE_SCRIPT_URL}?${params.toString()}`, '_blank', 'width=1,height=1');
        if (popup) {
            setTimeout(() => {
                popup.close();
                nextPage();
            }, 1000);
        } else {
            alert('กรุณาอนุญาตให้เปิด popup เพื่อส่งข้อมูล');
        }
    }
}

// Form Reset
function resetForm() {
    // Reset form
    document.getElementById('registrationForm').reset();
    document.getElementById('pdpaConsent').checked = false;
    
    // Reset pages
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active', 'completed');
    });
    
    currentPage = 1;
    document.getElementById('page1').classList.add('active');
    document.getElementById('step1').classList.add('active');
    
    // Clear errors
    document.querySelectorAll('.error-message').forEach(error => error.style.display = 'none');
    document.querySelectorAll('.form-input').forEach(input => input.classList.remove('error'));
}

// Real-time validation and event handlers
document.addEventListener('DOMContentLoaded', function() {
    // Real-time validation for inputs
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.hasAttribute('required') && !this.value.trim()) {
                this.classList.add('error');
                const errorElement = document.getElementById(this.id + 'Error');
                if (errorElement) {
                    errorElement.style.display = 'block';
                }
            } else {
                this.classList.remove('error');
                const errorElement = document.getElementById(this.id + 'Error');
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
            }
        });

        // Remove error on focus
        input.addEventListener('focus', function() {
            this.classList.remove('error');
            const errorElement = document.getElementById(this.id + 'Error');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        });
    });

    // Handle "อื่นๆ" checkbox
    const timeOtherCheckbox = document.getElementById('timeOther');
    const timeOtherText = document.getElementById('timeOtherText');
    
    if (timeOtherCheckbox && timeOtherText) {
        timeOtherCheckbox.addEventListener('change', function() {
            if (this.checked) {
                timeOtherText.focus();
            } else {
                timeOtherText.value = '';
            }
        });
    }

    // Handle Enter key navigation
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            if (currentPage === 1) {
                nextPage();
            } else if (currentPage === 2) {
                submitForm();
            }
        }
    });

    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            // Remove non-numeric characters
            let value = this.value.replace(/\D/g, '');
            
            // Format phone number (Thai format)
            if (value.length >= 3) {
                if (value.length <= 6) {
                    value = value.replace(/(\d{3})(\d+)/, '$1-$2');
                } else if (value.length <= 10) {
                    value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
                } else {
                    value = value.substring(0, 10);
                    value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
                }
            }
            
            this.value = value;
        });
    }

    // Email validation on input
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const emailError = document.getElementById('emailError');
            
            if (this.value && !emailRegex.test(this.value)) {
                this.classList.add('error');
                emailError.textContent = 'รูปแบบอีเมลไม่ถูกต้อง';
                emailError.style.display = 'block';
            } else {
                this.classList.remove('error');
                emailError.style.display = 'none';
            }
        });
    }

    // Time checkbox validation
    const timeCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="time"]');
    const timeError = document.getElementById('timeError');
    
    timeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const isAnyChecked = Array.from(timeCheckboxes).some(cb => cb.checked);
            if (isAnyChecked) {
                timeError.style.display = 'none';
            }
        });
    });

    // Auto-save form data to localStorage (optional)
    const saveFormData = () => {
        const formData = {
            course: document.getElementById('course').value,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            organization: document.getElementById('organization').value,
            position: document.getElementById('position').value,
            phone: document.getElementById('phone').value,
            lineId: document.getElementById('lineId').value,
            pdpaConsent: document.getElementById('pdpaConsent').checked,
            time1: document.getElementById('time1').checked,
            time2: document.getElementById('time2').checked,
            timeOther: document.getElementById('timeOther').checked,
            timeOtherText: document.getElementById('timeOtherText').value
        };
        
        localStorage.setItem('nbu_registration_draft', JSON.stringify(formData));
    };

    // Load saved form data
    const loadFormData = () => {
        const savedData = localStorage.getItem('nbu_registration_draft');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                Object.keys(data).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) {
                        if (element.type === 'checkbox') {
                            element.checked = data[key];
                        } else {
                            element.value = data[key];
                        }
                    }
                });
            } catch (error) {
                console.error('Error loading saved form data:', error);
            }
        }
    };

    // Auto-save on input change
    const allInputs = document.querySelectorAll('input, select, textarea');
    allInputs.forEach(input => {
        input.addEventListener('change', saveFormData);
        input.addEventListener('input', debounce(saveFormData, 1000));
    });

    // Load saved data on page load
    loadFormData();

    // Clear saved data on successful submission
    window.addEventListener('beforeunload', function() {
        if (currentPage === 3) {
            localStorage.removeItem('nbu_registration_draft');
        }
    });
});

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show success message
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        font-family: 'Prompt', sans-serif;
        font-weight: 500;
    `;
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        font-family: 'Prompt', sans-serif;
        font-weight: 500;
    `;
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}