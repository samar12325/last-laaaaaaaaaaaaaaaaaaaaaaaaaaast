// Employee New Complaint Page JavaScript

// Configuration
const API_BASE_URL = '../backend';
let currentUser = null;
let attachedFiles = [];

// DOM Elements
const elements = {
    // Header
    userName: document.getElementById('userName'),
    notificationIcon: document.getElementById('notificationIcon'),
    notificationBadge: document.getElementById('notificationBadge'),
    profileLink: document.getElementById('profileLink'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Form
    complaintForm: document.getElementById('complaintForm'),
    title: document.getElementById('title'),
    category: document.getElementById('category'),
    priority: document.getElementById('priority'),
    description: document.getElementById('description'),
    location: document.getElementById('location'),
    incidentDate: document.getElementById('incidentDate'),
    attachments: document.getElementById('attachments'),
    fileUploadArea: document.getElementById('fileUploadArea'),
    attachmentsList: document.getElementById('attachmentsList'),
    charCount: document.getElementById('charCount'),
    
    // Buttons
    cancelBtn: document.getElementById('cancelBtn'),
    submitBtn: document.getElementById('submitBtn'),
    
    // Modals
    loadingOverlay: document.getElementById('loadingOverlay'),
    successModal: document.getElementById('successModal'),
    errorModal: document.getElementById('errorModal'),
    errorMessage: document.getElementById('errorMessage'),
    closeErrorModal: document.getElementById('closeErrorModal'),
    closeErrorBtn: document.getElementById('closeErrorBtn'),
    complaintNumber: document.getElementById('complaintNumber'),
    viewComplaintBtn: document.getElementById('viewComplaintBtn'),
    newComplaintBtn: document.getElementById('newComplaintBtn'),
    homeBtn: document.getElementById('homeBtn')
};

// Utility Functions
const showLoading = () => {
    elements.loadingOverlay.classList.add('show');
};

const hideLoading = () => {
    elements.loadingOverlay.classList.remove('show');
};

const showError = (message) => {
    elements.errorMessage.textContent = message;
    elements.errorModal.classList.add('show');
};

const hideError = () => {
    elements.errorModal.classList.remove('show');
};

const showSuccess = (complaintId) => {
    elements.complaintNumber.textContent = complaintId;
    elements.successModal.classList.add('show');
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const validateForm = () => {
    let isValid = true;
    const errors = [];

    // Clear previous errors
    document.querySelectorAll('.form-group.error').forEach(group => {
        group.classList.remove('error');
    });
    document.querySelectorAll('.error-message').forEach(msg => {
        msg.remove();
    });

    // Title validation
    if (!elements.title.value.trim()) {
        showFieldError('title', 'عنوان الشكوى مطلوب');
        isValid = false;
    } else if (elements.title.value.trim().length < 10) {
        showFieldError('title', 'عنوان الشكوى يجب أن يكون 10 أحرف على الأقل');
        isValid = false;
    }

    // Category validation
    if (!elements.category.value) {
        showFieldError('category', 'فئة الشكوى مطلوبة');
        isValid = false;
    }

    // Description validation
    if (!elements.description.value.trim()) {
        showFieldError('description', 'وصف الشكوى مطلوب');
        isValid = false;
    } else if (elements.description.value.trim().length < 20) {
        showFieldError('description', 'وصف الشكوى يجب أن يكون 20 حرف على الأقل');
        isValid = false;
    }

    return isValid;
};

const showFieldError = (fieldName, message) => {
    const field = elements[fieldName];
    const formGroup = field.closest('.form-group');
    formGroup.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
};

// API Functions
const makeRequest = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Authorization': token ? `Bearer ${token}` : ''
        }
    };

    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData)) {
        defaultOptions.headers['Content-Type'] = 'application/json';
    }

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, mergedOptions);
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '../login/login.html';
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
};

// Load user profile
const loadUserProfile = async () => {
    try {
        const response = await makeRequest('/employee/profile');
        if (response.success) {
            currentUser = response.data;
            elements.userName.textContent = currentUser.FullName;
            return currentUser;
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        showError('حدث خطأ في تحميل معلومات المستخدم');
    }
};

// File upload handling
const handleFileUpload = () => {
    const uploadArea = elements.fileUploadArea;
    const fileInput = elements.attachments;

    // Click to select files
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
};

const handleFiles = (files) => {
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    Array.from(files).forEach(file => {
        // Check file size
        if (file.size > maxFileSize) {
            showError(`الملف ${file.name} كبير جداً. الحد الأقصى هو 10 ميجابايت`);
            return;
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
            showError(`نوع الملف ${file.name} غير مدعوم`);
            return;
        }

        // Check if file already exists
        if (attachedFiles.find(f => f.name === file.name && f.size === file.size)) {
            showError(`الملف ${file.name} مرفق مسبقاً`);
            return;
        }

        // Add file to list
        attachedFiles.push(file);
        renderAttachmentsList();
    });
};

const renderAttachmentsList = () => {
    elements.attachmentsList.innerHTML = '';

    attachedFiles.forEach((file, index) => {
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'attachment-item';
        
        const fileIcon = getFileIcon(file.type);
        
        attachmentItem.innerHTML = `
            <div class="attachment-info">
                <i class="${fileIcon}"></i>
                <div>
                    <div class="attachment-name">${file.name}</div>
                    <div class="attachment-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button type="button" class="remove-attachment" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add remove handler
        attachmentItem.querySelector('.remove-attachment').addEventListener('click', () => {
            removeAttachment(index);
        });

        elements.attachmentsList.appendChild(attachmentItem);
    });
};

const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'fas fa-image';
    if (mimeType === 'application/pdf') return 'fas fa-file-pdf';
    if (mimeType.includes('word')) return 'fas fa-file-word';
    return 'fas fa-file';
};

const removeAttachment = (index) => {
    attachedFiles.splice(index, 1);
    renderAttachmentsList();
};

// Character counter
const updateCharCounter = () => {
    const count = elements.description.value.length;
    const maxLength = 2000;
    
    elements.charCount.textContent = count;
    
    const counter = elements.charCount.parentElement;
    counter.classList.remove('warning', 'danger');
    
    if (count > maxLength * 0.9) {
        counter.classList.add('danger');
    } else if (count > maxLength * 0.75) {
        counter.classList.add('warning');
    }
};

// Form submission
const submitComplaint = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }

    showLoading();
    elements.submitBtn.disabled = true;

    try {
        // Prepare form data
        const formData = new FormData();
        formData.append('title', elements.title.value.trim());
        formData.append('category', elements.category.value);
        formData.append('priority', elements.priority.value);
        formData.append('description', elements.description.value.trim());
        
        if (elements.location.value.trim()) {
            formData.append('location', elements.location.value.trim());
        }
        
        if (elements.incidentDate.value) {
            formData.append('incidentDate', elements.incidentDate.value);
        }

        // Add attachments
        attachedFiles.forEach((file, index) => {
            formData.append(`attachments`, file);
        });

        // Submit complaint
        const response = await makeRequest('/employee/complaints', {
            method: 'POST',
            body: formData
        });

        if (response.success) {
            showSuccess(response.data.complaintId);
        } else {
            throw new Error(response.message || 'فشل في تقديم الشكوى');
        }

    } catch (error) {
        console.error('Error submitting complaint:', error);
        showError('حدث خطأ في تقديم الشكوى. يرجى المحاولة مرة أخرى.');
    } finally {
        hideLoading();
        elements.submitBtn.disabled = false;
    }
};

// Event Listeners
const initEventListeners = () => {
    // Form events
    elements.complaintForm.addEventListener('submit', submitComplaint);
    elements.description.addEventListener('input', updateCharCounter);
    
    // File upload
    handleFileUpload();
    
    // Buttons
    elements.cancelBtn.addEventListener('click', () => {
        if (confirm('هل أنت متأكد من إلغاء تقديم الشكوى؟ ستفقد جميع البيانات المدخلة.')) {
            window.location.href = 'employee-home.html';
        }
    });
    
    // Error modal
    elements.closeErrorModal.addEventListener('click', hideError);
    elements.closeErrorBtn.addEventListener('click', hideError);
    
    // Success modal buttons
    elements.viewComplaintBtn.addEventListener('click', () => {
        const complaintId = elements.complaintNumber.textContent;
        window.location.href = `employee-complaint-details.html?id=${complaintId}`;
    });
    
    elements.newComplaintBtn.addEventListener('click', () => {
        window.location.reload();
    });
    
    elements.homeBtn.addEventListener('click', () => {
        window.location.href = 'employee-home.html';
    });
    
    // Profile and logout
    elements.profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '../login/profile.html';
    });
    
    elements.logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            localStorage.removeItem('token');
            window.location.href = '../login/login.html';
        }
    });
};

// Initialize page
const initPage = async () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login/login.html';
        return;
    }
    
    try {
        // Load user profile
        await loadUserProfile();
        
        // Initialize event listeners
        initEventListeners();
        
        // Set initial character count
        updateCharCounter();
        
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('حدث خطأ في تحميل الصفحة');
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initPage);
