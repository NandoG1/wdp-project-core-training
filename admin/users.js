let currentUserId = null;
let currentUsername = null;
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeViewToggle();
});
function initializeEventListeners() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            toggleView(view);
        });
    });
    document.getElementById('userFilter').addEventListener('change', function() {
        applyFilters();
    });
    document.getElementById('searchInput').addEventListener('input', debounce(function() {
        applyFilters();
    }, 500));
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('ban-btn')) {
            const userId = e.target.dataset.userId;
            const username = e.target.dataset.username;
            showBanModal(userId, username);
        }
        
        if (e.target.classList.contains('unban-btn')) {
            const userId = e.target.dataset.userId;
            const username = e.target.dataset.username;
            showUnbanModal(userId, username);
        }
    });
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
    document.getElementById('confirmBan').addEventListener('click', function() {
        banUser(currentUserId);
    });

    document.getElementById('confirmUnban').addEventListener('click', function() {
        unbanUser(currentUserId);
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}
function initializeViewToggle() {
    const savedView = localStorage.getItem('userManagementView') || 'table';
    toggleView(savedView);
}
function toggleView(view) {
    const tableView = document.getElementById('tableView');
    const gridView = document.getElementById('gridView');
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    if (view === 'table') {
        tableView.classList.add('active');
        gridView.classList.remove('active');
    } else {
        tableView.classList.remove('active');
        gridView.classList.add('active');
    }
    localStorage.setItem('userManagementView', view);
}
function applyFilters() {
    const filter = document.getElementById('userFilter').value;
    const search = document.getElementById('searchInput').value;
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('filter', filter);
    if (search.trim()) params.set('search', search.trim());
    params.set('page', '1'); // Reset to first page
    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.location.href = newUrl;
}
function changePage(page) {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page);
    window.location.href = window.location.pathname + '?' + params.toString();
}
function showBanModal(userId, username) {
    currentUserId = userId;
    currentUsername = username;
    
    document.getElementById('banUsername').textContent = username;
    showModal('banModal');
}
function showUnbanModal(userId, username) {
    currentUserId = userId;
    currentUsername = username;
    
    document.getElementById('unbanUsername').textContent = username;
    showModal('unbanModal');
}
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const firstButton = modal.querySelector('button:not(.modal-close)');
    if (firstButton) {
        setTimeout(() => firstButton.focus(), 100);
    }
}
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentUserId = null;
    currentUsername = null;
}
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
    currentUserId = null;
    currentUsername = null;
}
async function banUser(userId) {
    if (!userId) return;
    
    try {
        const response = await fetch('users.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=ban_user&user_id=${userId}`
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            closeModal('banModal');
            updateUserStatus(userId, 'banned');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error banning user:', error);
        showToast('Failed to ban user. Please try again.', 'error');
    }
}
async function unbanUser(userId) {
    if (!userId) return;
    
    try {
        const response = await fetch('users.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=unban_user&user_id=${userId}`
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            closeModal('unbanModal');
            updateUserStatus(userId, 'active');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error unbanning user:', error);
        showToast('Failed to unban user. Please try again.', 'error');
    }
}
function updateUserStatus(userId, newStatus) {
    const tableRow = document.querySelector(`tr [data-user-id="${userId}"]`)?.closest('tr');
    if (tableRow) {
        const statusBadge = tableRow.querySelector('.status-badge');
        const actionBtn = tableRow.querySelector('.action-btn');
        
        if (statusBadge) {
            statusBadge.className = `status-badge ${newStatus}`;
            statusBadge.textContent = newStatus === 'banned' ? 'Banned' : 'Active';
        }
        
        if (actionBtn) {
            if (newStatus === 'banned') {
                actionBtn.className = 'action-btn unban-btn';
                actionBtn.textContent = 'Unban';
            } else {
                actionBtn.className = 'action-btn ban-btn';
                actionBtn.textContent = 'Ban';
            }
        }
    }
    const gridCard = document.querySelector(`.user-card [data-user-id="${userId}"]`)?.closest('.user-card');
    if (gridCard) {
        const actionBtn = gridCard.querySelector('.action-btn');
        
        if (actionBtn) {
            if (newStatus === 'banned') {
                actionBtn.className = 'action-btn unban-btn';
                actionBtn.textContent = 'Unban';
            } else {
                actionBtn.className = 'action-btn ban-btn';
                actionBtn.textContent = 'Ban';
            }
        }
    }
}
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
    toast.addEventListener('click', () => {
        toast.style.animation = 'toastSlideOut 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    });
}
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
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}
if (window.innerWidth <= 768) {
    const menuButton = document.createElement('button');
    menuButton.innerHTML = '☰';
    menuButton.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1001;
        background: #3498db;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 4px;
        font-size: 18px;
        cursor: pointer;
    `;
    menuButton.onclick = toggleSidebar;
    document.body.appendChild(menuButton);
}
