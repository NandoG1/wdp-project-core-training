let currentServerId = null;
let currentServerName = null;
let isLoading = false;
document.addEventListener('DOMContentLoaded', function() {
    showSkeletonLoading();
    setTimeout(() => {
        hideSkeletonLoading();
        initializeEventListeners();
    }, 2000); // 2 second loading simulation
});
function showSkeletonLoading() {
    isLoading = true;
    document.getElementById('realServersTable').style.display = 'none';
    document.getElementById('skeletonServersTable').classList.add('active');
    document.getElementById('serversContainer').classList.add('loading');
}
function hideSkeletonLoading() {
    isLoading = false;
    document.getElementById('skeletonServersTable').classList.remove('active');
    setTimeout(() => {
        document.getElementById('realServersTable').style.display = 'block';
        document.getElementById('serversContainer').classList.remove('loading');
    }, 100);
}
function applySearchWithLoading() {
    showSkeletonLoading();
    setTimeout(() => {
        applySearch();
    }, 800);
}
function initializeEventListeners() {
    document.getElementById('searchInput').addEventListener('input', debounce(function() {
        if (isLoading) return;
        applySearchWithLoading();
    }, 500));
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            const btn = e.target.classList.contains('delete-btn') ? e.target : e.target.closest('.delete-btn');
            const serverId = btn.dataset.serverId;
            const serverName = btn.dataset.serverName;
            showDeleteModal(serverId, serverName);
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
    document.getElementById('confirmDelete').addEventListener('click', function() {
        deleteServer(currentServerId);
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}
function applySearch() {
    const search = document.getElementById('searchInput').value;
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    params.set('page', '1'); // Reset to first page
    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.location.href = newUrl;
}
function changePage(page) {
    showSkeletonLoading();
    
    setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', page);
        window.location.href = window.location.pathname + '?' + params.toString();
    }, 500);
}
function showDeleteModal(serverId, serverName) {
    currentServerId = serverId;
    currentServerName = serverName;
    
    document.getElementById('deleteServerName').textContent = serverName;
    showModal('deleteModal');
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
    currentServerId = null;
    currentServerName = null;
}
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
    currentServerId = null;
    currentServerName = null;
}
async function deleteServer(serverId) {
    if (!serverId) return;
    
    try {
        const response = await fetch('servers.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=delete_server&server_id=${serverId}`
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            closeModal('deleteModal');
            showSkeletonLoading();
            
            setTimeout(() => {
                removeServerFromTable(serverId);
                hideSkeletonLoading();
            }, 800);
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting server:', error);
        showToast('Failed to delete server. Please try again.', 'error');
    }
}
function removeServerFromTable(serverId) {
    const row = document.querySelector(`[data-server-id="${serverId}"]`)?.closest('tr');
    if (row) {
        row.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            row.remove();
            updatePaginationInfo();
            const remainingRows = document.querySelectorAll('.servers-table tbody tr').length;
            if (remainingRows === 0 && window.location.search.includes('page=')) {
                const params = new URLSearchParams(window.location.search);
                const currentPage = parseInt(params.get('page')) || 1;
                if (currentPage > 1) {
                    changePage(currentPage - 1);
                } else {
                    window.location.reload();
                }
            }
        }, 300);
    }
}
function updatePaginationInfo() {
    const paginationInfo = document.querySelector('.pagination-info');
    const remainingRows = document.querySelectorAll('.servers-table tbody tr').length;
    
    if (paginationInfo) {
        const currentText = paginationInfo.textContent;
        const match = currentText.match(/Showing \d+ of (\d+) servers/);
        if (match) {
            const total = parseInt(match[1]) - 1;
            paginationInfo.textContent = `Showing ${remainingRows} of ${total} servers`;
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
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(-20px);
        }
    }
`;
document.head.appendChild(style);
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