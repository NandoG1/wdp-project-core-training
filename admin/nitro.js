let currentCodeId = null;
let currentCodeValue = null;
let selectedUserId = null;
let searchTimeout = null;
$(document).ready(function() {
    initializeEventListeners();
    setTimeout(() => {
        hideSkeletonLoading();
    }, 2000);
});
function showSkeletonLoading() {
    $('.codes-section').removeClass('loaded');
    $('.skeleton-table').show();
    $('.codes-table').hide();
    $('.skeleton-pagination').show();
    $('.pagination-container').hide();
}
function hideSkeletonLoading() {
    $('.codes-section').addClass('loaded');
    $('.skeleton-table').hide();
    $('.codes-table').show();
    $('.skeleton-pagination').hide();
    $('.pagination-container').show();
}
function initializeEventListeners() {
    $('#userSearch').on('input', function() {
        const searchTerm = $(this).val().trim();
        
        clearTimeout(searchTimeout);
        
        if (searchTerm.length < 2) {
            hideSearchDropdown();
            return;
        }
        
        searchTimeout = setTimeout(() => {
            searchUsers(searchTerm);
        }, 300);
    });
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.user-search-container').length) {
            hideSearchDropdown();
        }
    });
    $(document).on('click', '.user-option:not(.disabled)', function() {
        const userId = $(this).data('user-id');
        const username = $(this).data('username');
        const discriminator = $(this).data('discriminator');
        
        selectedUserId = userId;
        $('#userSearch').val(`${username}#${discriminator}`);
        hideSearchDropdown();
    });
    $('#generateBtn').on('click', function() {
        generateCode();
    });
    $('#codeSearch').on('input', debounce(function() {
        applySearchWithLoading();
    }, 500));
    $(document).on('click', '.copy-btn', function() {
        const code = $(this).data('code');
        copyToClipboard(code);
    });
    $(document).on('click', '.delete-btn', function() {
        const codeId = $(this).data('code-id');
        const code = $(this).data('code');
        showDeleteModal(codeId, code);
    });
    $('.modal-close').on('click', function() {
        const modal = $(this).closest('.modal');
        closeModal(modal.attr('id'));
    });
    $('.modal').on('click', function(e) {
        if (e.target === this) {
            closeModal($(this).attr('id'));
        }
    });
    $('#confirmDelete').on('click', function() {
        deleteCode(currentCodeId);
    });
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
            hideSearchDropdown();
        }
    });
}
function searchUsers(searchTerm) {
    $.ajax({
        url: 'nitro.php',
        method: 'POST',
        data: {
            action: 'search_users',
            search_term: searchTerm
        },
        dataType: 'json',
        success: function(response) {
            displaySearchResults(response.users);
        },
        error: function() {
            console.error('Error searching users');
            hideSearchDropdown();
        }
    });
}
function displaySearchResults(users) {
    const dropdown = $('#searchDropdown');
    dropdown.empty();
    
    if (users.length === 0) {
        dropdown.html('<div class="no-results">No users found</div>');
        showSearchDropdown();
        return;
    }
    
    users.forEach(user => {
        const hasNitro = parseInt(user.HasNitro) > 0;
        const isDisabled = hasNitro ? 'disabled' : '';
        
        const userOption = $(`
            <div class="user-option ${isDisabled}" 
                 data-user-id="${user.ID}" 
                 data-username="${user.Username}" 
                 data-discriminator="${user.Discriminator || '0000'}">
                <div class="user-avatar">
                    ${user.AvatarURL ? 
                        `<img src="${user.AvatarURL}" alt="Avatar">` : 
                        `<div class="avatar-placeholder">${user.Username.charAt(0).toUpperCase()}</div>`
                    }
                </div>
                <div class="user-details">
                    <div class="user-name">${user.Username}#${user.Discriminator || '0000'}</div>
                    <div class="user-email">${user.Email}</div>
                </div>
                ${hasNitro ? '<div class="nitro-badge">💎 Has Nitro 🔒</div>' : ''}
            </div>
        `);
        
        dropdown.append(userOption);
    });
    
    showSearchDropdown();
}
function showSearchDropdown() {
    $('#searchDropdown').addClass('active');
}

function hideSearchDropdown() {
    $('#searchDropdown').removeClass('active');
}
function generateCode() {
    const btn = $('#generateBtn');
    btn.prop('disabled', true).text('Generating...');
    
    $.ajax({
        url: 'nitro.php',
        method: 'POST',
        data: {
            action: 'generate_code',
            user_id: selectedUserId
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showToast(response.message, 'success');
                $('#userSearch').val('');
                selectedUserId = null;
                hideSearchDropdown();
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showToast(response.message, 'error');
            }
        },
        error: function() {
            showToast('Failed to generate code. Please try again...', 'error');
        },
        complete: function() {
            btn.prop('disabled', false).text('Generate Code');
        }
    });
}
function applySearchWithLoading() {
    showSkeletonLoading();
    $('#codeSearch').prop('disabled', true);
    
    setTimeout(() => {
        applySearch();
    }, 800);
}
function applySearch() {
    const search = $('#codeSearch').val();
    
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    params.set('page', '1');
    
    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.location.href = newUrl;
}
function changePageWithLoading(page) {
    showSkeletonLoading();
    
    setTimeout(() => {
        changePage(page);
    }, 500);
}
function changePage(page) {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page);
    window.location.href = window.location.pathname + '?' + params.toString();
}
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Code copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('Code copied to clipboard!', 'success');
    } catch (err) {
        showToast('Failed to copy code', 'error');
    }
    
    document.body.removeChild(textArea);
}
function showDeleteModal(codeId, code) {
    currentCodeId = codeId;
    currentCodeValue = code;
    
    $('#deleteCodeValue').text(code);
    showModal('deleteModal');
}
function showModal(modalId) {
    $(`#${modalId}`).addClass('active');
    $('body').css('overflow', 'hidden');
}
function closeModal(modalId) {
    $(`#${modalId}`).removeClass('active');
    $('body').css('overflow', '');
    
    currentCodeId = null;
    currentCodeValue = null;
}
function closeAllModals() {
    $('.modal').removeClass('active');
    $('body').css('overflow', '');
    currentCodeId = null;
    currentCodeValue = null;
}
function deleteCode(codeId) {
    if (!codeId) return;
    const deleteBtn = $('#confirmDelete');
    deleteBtn.prop('disabled', true).text('Deleting...');
    
    $.ajax({
        url: 'nitro.php',
        method: 'POST',
        data: {
            action: 'delete_code',
            code_id: codeId
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showToast(response.message, 'success');
                closeModal('deleteModal');
                removeCodeFromTable(codeId);
            } else {
                showToast(response.message, 'error');
            }
        },
        error: function() {
            showToast('Failed to delete code. Please try again.', 'error');
        },
        complete: function() {
            deleteBtn.prop('disabled', false).text('Delete Code');
        }
    });
}
function removeCodeFromTable(codeId) {
    const row = $(`.delete-btn[data-code-id="${codeId}"]`).closest('tr');
    if (row.length) {
        row.fadeOut(300, function() {
            $(this).remove();
            updatePaginationInfo();
            const remainingRows = $('.codes-table tbody tr').length;
            if (remainingRows === 0 && window.location.search.includes('page=')) {
                const params = new URLSearchParams(window.location.search);
                const currentPage = parseInt(params.get('page')) || 1;
                if (currentPage > 1) {
                    changePage(currentPage - 1);
                } else {
                    window.location.reload();
                }
            }
        });
    }
}
function updatePaginationInfo() {
    const paginationInfo = $('.pagination-info');
    const remainingRows = $('.codes-table tbody tr').length;
    
    if (paginationInfo.length) {
        const currentText = paginationInfo.text();
        const match = currentText.match(/Showing \d+ of (\d+) codes/);
        if (match) {
            const total = parseInt(match[1]) - 1;
            paginationInfo.text(`Showing ${remainingRows} of ${total} codes`);
        }
    }
}
function showToast(message, type = 'info') {
    const toastContainer = $('#toastContainer');
    
    const toast = $(`<div class="toast ${type}">${message}</div>`);
    toastContainer.append(toast);
    setTimeout(() => {
        toast.css('animation', 'toastSlideOut 0.3s ease forwards');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
    toast.on('click', function() {
        $(this).css('animation', 'toastSlideOut 0.3s ease forwards');
        setTimeout(() => {
            $(this).remove();
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