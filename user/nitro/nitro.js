let isRedeeming = false;
$(document).ready(function() {
    initializeEventListeners();
    formatCodeInput();
});
function initializeEventListeners() {
    $('#nitroCode').on('input', function() {
        formatCodeInput();
    });
    $('#redeemBtn').on('click', function() {
        redeemCode();
    });
    $('#nitroCode').on('keypress', function(e) {
        if (e.which === 13) {
            redeemCode();
        }
    });
    $('.modal').on('click', function(e) {
        if (e.target === this) {
            closeAllModals();
        }
    });
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}
function formatCodeInput() {
    const input = $('#nitroCode');
    let value = input.val().replace(/[^A-Z0-9]/g, '').toUpperCase();
    if (value.length > 16) {
        value = value.substring(0, 16);
    }
    
    input.val(value);
}
function redeemCode() {
    if (isRedeeming) return;
    
    const code = $('#nitroCode').val().trim();
    
    if (!code) {
        showToast('Please enter a code', 'error');
        return;
    }
    
    if (code.length !== 16) {
        showToast('Code must be 16 characters long', 'error');
        return;
    }
    
    isRedeeming = true;
    const btn = $('#redeemBtn');
    const originalText = btn.html();
    
    btn.prop('disabled', true).html('<span class="btn-icon">⏳</span>Redeeming...');
    
    $.ajax({
        url: 'nitro.php',
        method: 'POST',
        data: {
            action: 'redeem_code',
            code: code
        },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showSuccessModal();
                triggerConfetti();
                $('#nitroCode').val('');
                
                showToast(response.message, 'success');
            } else {
                showToast(response.message, 'error');
            }
        },
        error: function() {
            showToast('Failed to redeem code. Please try again.', 'error');
        },
        complete: function() {
            isRedeeming = false;
            btn.prop('disabled', false).html(originalText);
        }
    });
}
function showSuccessModal() {
    $('#successModal').addClass('active');
    $('body').css('overflow', 'hidden');
}
function closeSuccessModal() {
    $('#successModal').removeClass('active');
    $('body').css('overflow', '');
}
function showSubscriptionModal() {
    $('#subscriptionModal').addClass('active');
    $('body').css('overflow', 'hidden');
}
function closeSubscriptionModal() {
    $('#subscriptionModal').removeClass('active');
    $('body').css('overflow', '');
}
function closeAllModals() {
    $('.modal').removeClass('active');
    $('body').css('overflow', '');
}
function triggerConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        }));
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        }));
    }, 250);
    setTimeout(() => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#7c3aed', '#a855f7', '#00d26a', '#ff6b9d', '#3498db']
        });
    }, 500);
    setTimeout(() => {
        confetti({
            particleCount: 150,
            spread: 120,
            origin: { y: 0.4 },
            colors: ['#7c3aed', '#a855f7', '#00d26a', '#ff6b9d', '#3498db']
        });
    }, 1500);
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
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);