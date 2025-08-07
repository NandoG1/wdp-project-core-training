const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            enabled: true,
            backgroundColor: 'rgba(44, 62, 80, 0.9)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#3498db',
            borderWidth: 1,
            cornerRadius: 6,
            displayColors: false,
            callbacks: {
                title: function(context) {
                    return context[0].label;
                },
                label: function(context) {
                    const dataPoint = context.raw;
                    const dataset = context.dataset;
                    const dataIndex = context.dataIndex;
                    const additionalInfo = dataset.additionalInfo ? dataset.additionalInfo[dataIndex] : null;
                    
                    let label = `Count: ${dataPoint}`;
                    if (additionalInfo && additionalInfo.description) {
                        label += `\n${additionalInfo.description}`;
                    }
                    
                    return label;
                },
                afterLabel: function(context) {
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = ((context.raw / total) * 100).toFixed(1);
                    return `Percentage: ${percentage}%`;
                }
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                color: '#95a5a6',
                callback: function(value) {
                    return Number.isInteger(value) ? value : '';
                }
            },
            grid: {
                color: '#34495e'
            }
        },
        x: {
            ticks: {
                color: '#95a5a6',
                maxRotation: 45,
                minRotation: 0
            },
            grid: {
                display: false
            }
        }
    },
    interaction: {
        intersect: false,
        mode: 'index'
    },
    animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
    }
};
let chartInstances = {
    channelChart: null,
    messageChart: null,
    serverChart: null
};
async function fetchChartData(type = null) {
    try {
        const url = type ? `chart.php?type=${type}` : 'chart.php';
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching chart data:', error);
        return null;
    }
}
function destroyChart(chartId) {
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        chartInstances[chartId] = null;
    }
}
async function initializeChannelChart() {
    const channelData = await fetchChartData('channels');
    
    if (!channelData) {
        console.error('Failed to load channel data');
        return;
    }
    
    const canvasElement = document.getElementById('channelChart');
    if (!canvasElement) {
        console.error('Canvas element channelChart not found');
        return;
    }
    destroyChart('channelChart');
    
    const ctx = canvasElement.getContext('2d');
    const labels = channelData.map(item => {
        return item.display_name.length > 10 ? 
               item.display_name.substring(0, 8) + '...' : 
               item.display_name;
    });
    
    const counts = channelData.map(item => item.count);
    const colors = ['#3498db', '#5865f2', '#9b59b6']; // Blue, Discord Blue, Purple
    
    chartInstances.channelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: colors.slice(0, counts.length),
                borderRadius: 4,
                borderSkipped: false,
                additionalInfo: channelData.map(item => ({
                    description: `${item.display_name}: ${item.count} channels`,
                    fullName: item.display_name
                }))
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    max: Math.max(...counts) + 5
                }
            }
        }
    });
}
async function initializeMessageChart() {
    const messageData = await fetchChartData('messages');
    
    if (!messageData) {
        console.error('Failed to load message data');
        return;
    }
    
    const canvasElement = document.getElementById('messageChart');
    if (!canvasElement) {
        console.error('Canvas element messageChart not found');
        return;
    }
    destroyChart('messageChart');
    
    const ctx = canvasElement.getContext('2d');
    const labels = messageData.map(item => {
        return item.display_name.length > 10 ? 
               item.display_name.substring(0, 8) + '...' : 
               item.display_name;
    });
    
    const counts = messageData.map(item => item.count);
    const colors = ['#2ecc71', '#27ae60', '#1abc9c']; // Different shades of green
    
    chartInstances.messageChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: colors.slice(0, counts.length),
                borderRadius: 4,
                borderSkipped: false,
                additionalInfo: messageData.map(item => ({
                    description: item.description,
                    fullName: item.display_name
                }))
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    max: Math.max(...counts) + Math.ceil(Math.max(...counts) * 0.1)
                }
            }
        }
    });
}
async function initializeServerChart() {
    const serverData = await fetchChartData('servers');
    
    if (!serverData) {
        console.error('Failed to load server data');
        return;
    }
    
    const canvasElement = document.getElementById('serverChart');
    if (!canvasElement) {
        console.error('Canvas element serverChart not found');
        return;
    }
    destroyChart('serverChart');
    
    const ctx = canvasElement.getContext('2d');
    const labels = serverData.map(item => {
        return item.display_name.length > 10 ? 
               item.display_name.substring(0, 8) + '...' : 
               item.display_name;
    });
    
    const counts = serverData.map(item => item.count);
    const colors = ['#9b59b6', '#8e44ad']; // Purple shades
    
    chartInstances.serverChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: colors.slice(0, counts.length),
                borderRadius: 4,
                borderSkipped: false,
                additionalInfo: serverData.map(item => ({
                    description: item.description,
                    fullName: item.display_name
                }))
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    max: Math.max(...counts) + 5
                }
            }
        }
    });
}
function destroyAllCharts() {
    Object.keys(chartInstances).forEach(chartId => {
        destroyChart(chartId);
    });
}
async function initializeAllCharts() {
    try {
        console.log('Initializing charts with skeleton loading...');
        showSkeletonLoading();
        await new Promise(resolve => setTimeout(resolve, 3000));
        destroyAllCharts();
        await Promise.all([
            initializeChannelChart(),
            initializeMessageChart(),
            initializeServerChart()
        ]);
        hideSkeletonLoading();
        
        console.log('All charts initialized successfully with real data');
    } catch (error) {
        console.error('Error initializing charts:', error);
        hideLoadingIndicators();
        showErrorMessage('Failed to load chart data. Please refresh the page.');
    }
}
function createSkeletonChart(canvasId, type = 'bar') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    let skeletonData;
    if (canvasId === 'channelChart') {
        skeletonData = {
            labels: ['Categories', 'Text Channels', 'Voice Channels'],
            datasets: [{
                data: [12, 18, 8],
                backgroundColor: ['#f0f0f0', '#e8e8e8', '#f0f0f0'],
                borderColor: ['#e0e0e0', '#d8d8d8', '#e0e0e0'],
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false
            }]
        };
    } else if (canvasId === 'messageChart') {
        skeletonData = {
            labels: ['Total Messages', "Today's Messages", 'Previous Messages'],
            datasets: [{
                data: [1850, 124, 1726],
                backgroundColor: ['#f0f0f0', '#e8e8e8', '#f0f0f0'],
                borderColor: ['#e0e0e0', '#d8d8d8', '#e0e0e0'],
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false
            }]
        };
    } else if (canvasId === 'serverChart') {
        skeletonData = {
            labels: ['Public Servers', 'Private Servers'],
            datasets: [{
                data: [7, 4],
                backgroundColor: ['#f0f0f0', '#e8e8e8'],
                borderColor: ['#e0e0e0', '#d8d8d8'],
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false
            }]
        };
    }
    const skeletonChart = new Chart(ctx, {
        type: type,
        data: skeletonData,
        options: {
            ...chartOptions,
            animation: {
                duration: 0 // No animation for skeleton
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false // Disable tooltips for skeleton
                }
            },
            interaction: {
                events: [] // Disable all interactions
            },
            hover: {
                mode: null // Disable hover effects
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#d0d0d0',
                        callback: function(value) {
                            return Number.isInteger(value) ? value : '';
                        }
                    },
                    grid: {
                        color: '#f0f0f0'
                    }
                },
                x: {
                    ticks: {
                        color: '#d0d0d0',
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    const container = canvas.parentElement;
    const overlay = document.createElement('div');
    overlay.className = 'skeleton-overlay';
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.4) 20%,
            rgba(255, 255, 255, 0.6) 50%,
            rgba(255, 255, 255, 0.4) 80%,
            transparent 100%
        );
        animation: shimmer 2s ease-in-out infinite;
        pointer-events: none;
        z-index: 5;
        border-radius: 8px;
    `;
    const pulseOverlay = document.createElement('div');
    pulseOverlay.className = 'skeleton-pulse';
    pulseOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.1);
        animation: pulse 1.5s ease-in-out infinite alternate;
        pointer-events: none;
        z-index: 4;
        border-radius: 8px;
    `;
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'skeleton-loading-text';
    loadingIndicator.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #999;
        font-size: 12px;
        font-weight: 500;
        text-align: center;
        z-index: 6;
        background: rgba(255, 255, 255, 0.9);
        padding: 8px 16px;
        border-radius: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(4px);
        animation: loadingText 1.5s ease-in-out infinite;
    `;
    loadingIndicator.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <div style="
                width: 12px;
                height: 12px;
                border: 2px solid #ddd;
                border-top: 2px solid #666;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            Loading...
        </div>
    `;
    
    container.style.position = 'relative';
    container.appendChild(pulseOverlay);
    container.appendChild(overlay);
    container.appendChild(loadingIndicator);
    
    return skeletonChart;
}
function showSkeletonLoading() {
    if (!document.getElementById('skeleton-style')) {
        const style = document.createElement('style');
        style.id = 'skeleton-style';
        style.textContent = `
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            @keyframes pulse {
                0% { opacity: 0.1; }
                100% { opacity: 0.3; }
            }
            
            @keyframes loadingText {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 1; }
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .skeleton-overlay {
                background: linear-gradient(
                    90deg,
                    transparent 0%,
                    rgba(255, 255, 255, 0.4) 20%,
                    rgba(255, 255, 255, 0.6) 50%,
                    rgba(255, 255, 255, 0.4) 80%,
                    transparent 100%
                ) !important;
            }
            
            .chart-container {
                transition: all 0.3s ease-in-out;
            }
            
            .chart-container.skeleton-loading {
                background: rgba(255, 255, 255, 0.4);
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
    }
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        container.classList.add('skeleton-loading');
    });
    chartInstances.channelChart = createSkeletonChart('channelChart');
    chartInstances.messageChart = createSkeletonChart('messageChart');
    chartInstances.serverChart = createSkeletonChart('serverChart');
}
function hideSkeletonLoading() {
    const overlays = document.querySelectorAll('.skeleton-overlay');
    const pulseOverlays = document.querySelectorAll('.skeleton-pulse');
    const loadingTexts = document.querySelectorAll('.skeleton-loading-text');
    [...overlays, ...pulseOverlays, ...loadingTexts].forEach(element => {
        element.style.transition = 'opacity 0.3s ease-out';
        element.style.opacity = '0';
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
    });
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        setTimeout(() => {
            container.classList.remove('skeleton-loading');
        }, 300);
    });
}
function showLoadingIndicators() {
    showSkeletonLoading();
}
function hideLoadingIndicators() {
    hideSkeletonLoading();
}
function showErrorMessage(message) {
    const existingErrors = document.querySelectorAll('.chart-error-message');
    existingErrors.forEach(error => error.remove());
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'chart-error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        z-index: 1000;
        font-size: 14px;
        max-width: 300px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing charts...');
    initializeAllCharts();
    const activitySection = document.querySelector('.activity-section h2');
    if (activitySection) {
        const existingButton = document.getElementById('refresh-charts');
        if (existingButton) {
            existingButton.remove();
        }
        
        const refreshButton = document.createElement('button');
        refreshButton.id = 'refresh-charts';
        refreshButton.textContent = 'Refresh Charts';
        refreshButton.style.cssText = `
            float: right;
            background-color: #3498db;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-left: 20px;
            transition: background-color 0.3s;
        `;
        refreshButton.onmouseover = function() {
            this.style.backgroundColor = '#2980b9';
        };
        refreshButton.onmouseout = function() {
            this.style.backgroundColor = '#3498db';
        };
        refreshButton.onclick = refreshChartData;
        activitySection.appendChild(refreshButton);
    }
    if (window.innerWidth <= 768) {
        const existingMenuButton = document.querySelector('.mobile-menu-button');
        if (existingMenuButton) {
            existingMenuButton.remove();
        }
        
        const menuButton = document.createElement('button');
        menuButton.className = 'mobile-menu-button';
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
});
window.addEventListener('beforeunload', function() {
    destroyAllCharts();
});
function initializeCharts() {
    initializeAllCharts();
}