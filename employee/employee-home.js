// Employee Home Page JavaScript

// Configuration
const API_BASE_URL = '../backend';
let currentUser = null;

// DOM Elements
const elements = {
    userName: document.getElementById('userName'),
    notificationIcon: document.getElementById('notificationIcon'),
    notificationBadge: document.getElementById('notificationBadge'),
    notificationsPanel: document.getElementById('notificationsPanel'),
    notificationsList: document.getElementById('notificationsList'),
    closeNotifications: document.getElementById('closeNotifications'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    errorModal: document.getElementById('errorModal'),
    errorMessage: document.getElementById('errorMessage'),
    closeErrorModal: document.getElementById('closeErrorModal'),
    closeErrorBtn: document.getElementById('closeErrorBtn'),
    
    // Stats
    totalComplaints: document.getElementById('totalComplaints'),
    pendingComplaints: document.getElementById('pendingComplaints'),
    completedComplaints: document.getElementById('completedComplaints'),
    unreadNotifications: document.getElementById('unreadNotifications'),
    
    // Recent complaints
    recentComplaintsList: document.getElementById('recentComplaintsList'),
    
    // Action buttons
    newComplaintBtn: document.getElementById('newComplaintBtn'),
    viewComplaintsBtn: document.getElementById('viewComplaintsBtn'),
    newComplaintCard: document.getElementById('newComplaintCard'),
    myComplaintsCard: document.getElementById('myComplaintsCard'),
    assignedComplaintsCard: document.getElementById('assignedComplaintsCard'),
    notificationsCard: document.getElementById('notificationsCard'),
    viewAllComplaints: document.getElementById('viewAllComplaints'),
    
    // Profile
    profileLink: document.getElementById('profileLink'),
    logoutBtn: document.getElementById('logoutBtn')
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

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getStatusClass = (status) => {
    const statusClasses = {
        'مفتوحة/جديدة': 'status-open',
        'قيد المعالجة': 'status-pending',
        'معلقة': 'status-pending',
        'مكتملة': 'status-completed',
        'مغلقة': 'status-completed'
    };
    return statusClasses[status] || 'status-open';
};

// API Functions
const makeRequest = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        }
    };

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
                // Unauthorized - redirect to login
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

// Load statistics
const loadStatistics = async () => {
    try {
        const response = await makeRequest('/employee/complaints?limit=1000');
        if (response.success) {
            const complaints = response.data.complaints;
            
            // Calculate statistics
            const totalCount = complaints.length;
            const pendingCount = complaints.filter(c => 
                c.Status === 'قيد المعالجة' || c.Status === 'معلقة'
            ).length;
            const completedCount = complaints.filter(c => 
                c.Status === 'مكتملة' || c.Status === 'مغلقة'
            ).length;
            
            // Update UI
            elements.totalComplaints.textContent = totalCount;
            elements.pendingComplaints.textContent = pendingCount;
            elements.completedComplaints.textContent = completedCount;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
};

// Load notifications
const loadNotifications = async () => {
    try {
        const response = await makeRequest('/employee/notifications?limit=5');
        if (response.success) {
            const { notifications, unreadCount } = response.data;
            
            // Update notification badge
            elements.notificationBadge.textContent = unreadCount;
            elements.notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
            elements.unreadNotifications.textContent = unreadCount;
            
            // Update notifications list
            elements.notificationsList.innerHTML = '';
            
            if (notifications.length === 0) {
                elements.notificationsList.innerHTML = `
                    <div class="notification-item">
                        <p style="text-align: center; color: #666;">لا توجد إشعارات</p>
                    </div>
                `;
                return;
            }
            
            notifications.forEach(notification => {
                const notificationElement = document.createElement('div');
                notificationElement.className = `notification-item ${!notification.IsRead ? 'unread' : ''}`;
                notificationElement.innerHTML = `
                    <div class="notification-title">${notification.Title || 'إشعار'}</div>
                    <div class="notification-message">${notification.Message}</div>
                    <div class="notification-time">${formatDate(notification.CreatedAt)}</div>
                `;
                
                // Add click handler to mark as read
                notificationElement.addEventListener('click', () => {
                    if (!notification.IsRead) {
                        markNotificationAsRead(notification.NotificationID);
                    }
                    
                    // If related to complaint, navigate to complaint details
                    if (notification.ComplaintID) {
                        window.location.href = `employee-complaint-details.html?id=${notification.ComplaintID}`;
                    }
                });
                
                elements.notificationsList.appendChild(notificationElement);
            });
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
};

// Mark notification as read
const markNotificationAsRead = async (notificationId) => {
    try {
        await makeRequest(`/employee/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
        // Reload notifications to update the UI
        loadNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

// Load recent complaints
const loadRecentComplaints = async () => {
    try {
        const response = await makeRequest('/employee/complaints?limit=5');
        if (response.success) {
            const complaints = response.data.complaints;
            
            elements.recentComplaintsList.innerHTML = '';
            
            if (complaints.length === 0) {
                elements.recentComplaintsList.innerHTML = `
                    <div class="complaint-item">
                        <p style="text-align: center; color: #666;">لا توجد شكاوى</p>
                    </div>
                `;
                return;
            }
            
            complaints.forEach(complaint => {
                const complaintElement = document.createElement('div');
                complaintElement.className = 'complaint-item';
                complaintElement.innerHTML = `
                    <div class="complaint-header">
                        <div>
                            <div class="complaint-title">${complaint.Title}</div>
                            <div class="complaint-date">${formatDate(complaint.CreatedAt)}</div>
                        </div>
                        <span class="complaint-status ${getStatusClass(complaint.Status)}">
                            ${complaint.Status}
                        </span>
                    </div>
                    <div class="complaint-description">
                        ${complaint.Description.length > 100 ? 
                          complaint.Description.substring(0, 100) + '...' : 
                          complaint.Description}
                    </div>
                    <div class="complaint-meta">
                        <span>الفئة: ${complaint.Category}</span>
                        <span>الردود: ${complaint.ResponseCount || 0}</span>
                    </div>
                `;
                
                // Add click handler to view complaint details
                complaintElement.addEventListener('click', () => {
                    window.location.href = `employee-complaint-details.html?id=${complaint.ComplaintID}`;
                });
                
                elements.recentComplaintsList.appendChild(complaintElement);
            });
        }
    } catch (error) {
        console.error('Error loading recent complaints:', error);
    }
};

// Event Listeners
const initEventListeners = () => {
    // Notification panel
    elements.notificationIcon.addEventListener('click', () => {
        elements.notificationsPanel.classList.toggle('open');
    });
    
    elements.closeNotifications.addEventListener('click', () => {
        elements.notificationsPanel.classList.remove('open');
    });
    
    // Close notifications when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.notificationsPanel.contains(e.target) && 
            !elements.notificationIcon.contains(e.target)) {
            elements.notificationsPanel.classList.remove('open');
        }
    });
    
    // Error modal
    elements.closeErrorModal.addEventListener('click', hideError);
    elements.closeErrorBtn.addEventListener('click', hideError);
    
    // Navigation buttons
    elements.newComplaintBtn.addEventListener('click', () => {
        window.location.href = 'employee-newcomplaint.html';
    });
    
    elements.viewComplaintsBtn.addEventListener('click', () => {
        window.location.href = 'employee-followup.html';
    });
    
    elements.newComplaintCard.addEventListener('click', () => {
        window.location.href = 'employee-newcomplaint.html';
    });
    
    elements.myComplaintsCard.addEventListener('click', () => {
        window.location.href = 'employee-followup.html?filter=my';
    });
    
    elements.assignedComplaintsCard.addEventListener('click', () => {
        window.location.href = 'employee-followup.html?filter=assigned';
    });
    
    elements.notificationsCard.addEventListener('click', () => {
        elements.notificationsPanel.classList.add('open');
    });
    
    elements.viewAllComplaints.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'employee-followup.html';
    });
    
    // Profile and logout
    elements.profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'employee-profile.html';
    });
    
    elements.logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
};

// Logout function
const logout = () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem('token');
        window.location.href = '../login/login.html';
    }
};

// Initialize page
const initPage = async () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login/login.html';
        return;
    }
    
    showLoading();
    
    try {
        // Load all data
        await Promise.all([
            loadUserProfile(),
            loadStatistics(),
            loadNotifications(),
            loadRecentComplaints()
        ]);
        
        // Initialize event listeners
        initEventListeners();
        
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('حدث خطأ في تحميل الصفحة');
    } finally {
        hideLoading();
    }
};

// Auto-refresh notifications every 30 seconds
setInterval(() => {
    if (currentUser) {
        loadNotifications();
    }
}, 30000);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initPage);
