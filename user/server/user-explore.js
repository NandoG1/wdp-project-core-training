let currentPage = 1
let isLoading = false
let hasMoreServers = true
let currentCategory = "all"
let currentSearch = ""
let currentSort = "a_to_z"
let currentServerId = null
let allServersFromDB = [] // Store all servers from database
let displayedServersCount = 0 // Track how many servers we've displayed
let endOfDBReached = false // Track if we've reached the end of database servers
const $ = window.jQuery // Declare the $ variable
$(document).ready(() => {
  initializeEventListeners()
  loadCategories()
  loadServers(true)
  $('body').append('<button id="testDuplication" style="position:fixed;top:10px;right:10px;z-index:9999;background:red;color:white;padding:10px;">TEST DUPLICATION</button>')
  $('#testDuplication').on('click', () => {
    console.log("=== MANUAL DUPLICATION TEST ===")
    console.log("allServersFromDB:", allServersFromDB.length)
    console.log("displayedServersCount:", displayedServersCount)
    console.log("currentPage:", currentPage)
    console.log("endOfDBReached:", endOfDBReached)
    duplicateServers()
  })
})
function initializeEventListeners() {
  $(document).on("click", ".category-item", function () {
    const category = $(this).data("category")
    selectCategory(category)
  })
  $("#searchInput").on(
    "input",
    debounce(function () {
      const newSearch = $(this).val().trim()
      console.log("Search triggered:", newSearch) // Debug line
      if (newSearch !== currentSearch) {
        currentSearch = newSearch
        resetAndLoadServers()
      }
    }, 300), // Reduced debounce time for better responsiveness
  )
  $("#sortBtn").on("click", (e) => {
    e.stopPropagation()
    $("#sortDropdown").toggleClass("active")
  })

  $(document).on("click", ".sort-option", function () {
    const sort = $(this).data("sort")
    selectSort(sort)
  })
  $(document).on("click", (e) => {
    if (!$(e.target).closest('.sort-container').length) {
      $("#sortDropdown").removeClass("active")
    }
  })
  $(document).on("click", ".server-card", function () {
    const serverId = $(this).data("server-id")
    showServerDetails(serverId)
  })
  $(document).on("click", ".join-btn", function (e) {
    e.stopPropagation()
    const serverId = $(this).closest(".server-card").data("server-id")
    joinServer(serverId)
  })

  $("#joinServerBtn").on("click", () => {
    joinServer(currentServerId)
  })
  $("#inviteSubmitBtn").on("click", () => {
    joinByInvite()
  })

  $("#inviteCodeInput").on("keypress", (e) => {
    if (e.which === 13) {
      joinByInvite()
    }
  })
  $(".modal-close").on("click", () => {
    closeAllModals()
  })

  $(".modal").on("click", function (e) {
    if (e.target === this) {
      closeAllModals()
    }
  })
  $(window).on("scroll", throttle(() => {
    handleInfiniteScroll()
  }, 100)) // Throttle scroll events
  $(document).on("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals()
    }
  })
}
function handleInfiniteScroll() {
  const scrollTop = $(window).scrollTop()
  const windowHeight = $(window).height()
  const documentHeight = $(document).height()
  const distanceFromBottom = documentHeight - (scrollTop + windowHeight)
  if (distanceFromBottom <= 10 && !isLoading && hasMoreServers && scrollTop > 0) {
    console.log("🎯 User reached bottom - Triggering load...")
    console.log(`Scroll details: scrollTop=${scrollTop}, distanceFromBottom=${distanceFromBottom}`)
    
    if (!endOfDBReached) {
      console.log("📡 Loading more servers from database...")
      loadServers(true)
    } else if (allServersFromDB.length > 0) {
      console.log("🔄 Database exhausted - Duplicating servers...")
      duplicateServers()
    }
  }
}
function loadCategories() {
  $.ajax({
    url: "user-explore.php",
    method: "POST",
    data: { action: "get_categories" },
    dataType: "json",
    success: (response) => {
      if (response && response.categories) {
        displayCategories(response.categories, response.total_servers)
      }
    },
    error: (xhr, status, error) => {
      console.error("Failed to load categories:", error)
      showToast("Failed to load categories", "error")
    },
  })
}
function displayCategories(categories, totalServers) {
  const categoriesList = $("#categoriesList")
  $("#totalCount").text(totalServers || 0)
  categories.forEach((category) => {
    const categoryIcon = getCategoryIcon(category.Category)
    const categoryItem = $(`
            <div class="category-item" data-category="${category.Category}">
                <div class="category-icon">${categoryIcon}</div>
                <span class="category-name">${formatCategoryName(category.Category)}</span>
                <span class="category-count">${category.server_count}</span>
            </div>
        `)

    categoriesList.append(categoryItem)
  })
}
function getCategoryIcon(category) {
  const icons = {
    Gaming: "🎮",
    Music: "🎵",
    Education: "📚",
    "Science & Tech": "🔬",
    Entertainment: "🎬",
    Community: "👥",
    Art: "🎨",
    Sports: "⚽",
    Technology: "💻",
    Anime: "🌸",
  }
  return icons[category] || "📁"
}
function formatCategoryName(category) {
  if (!category || category === null || category === undefined) {
    return 'General'
  }
  const categoryStr = String(category)
  return categoryStr.charAt(0).toUpperCase() + categoryStr.slice(1)
}
function selectCategory(category) {
  currentCategory = category
  $(".category-item").removeClass("active")
  $(`.category-item[data-category="${category}"]`).addClass("active")

  resetAndLoadServers()
}
function selectSort(sort) {
  currentSort = sort
  $(".sort-option").removeClass("active")
  $(`.sort-option[data-sort="${sort}"]`).addClass("active")
  $("#sortDropdown").removeClass("active")

  resetAndLoadServers()
}
function resetAndLoadServers() {
  currentPage = 1
  hasMoreServers = true
  endOfDBReached = false
  allServersFromDB = [] // Reset the stored servers
  displayedServersCount = 0 // Reset displayed count
  $("#serversGrid").empty()
  $("#noMoreServers").hide()
  loadServers(true)
}
function loadServers(showLoading = false) {
  if (isLoading) {
    console.log("Already loading, skipping...")
    return
  }

  isLoading = true
  console.log(`Loading servers - Page: ${currentPage}, Search: "${currentSearch}", Category: ${currentCategory}, Sort: ${currentSort}`)

  if (showLoading) {
    $("#loadingIndicator").show()
  }

  $.ajax({
    url: "user-explore.php",
    method: "POST",
    data: {
      action: "get_servers",
      page: currentPage,
      category: currentCategory,
      search: currentSearch,
      sort: currentSort,
    },
    dataType: "json",
    timeout: 10000, // 10 second timeout
    success: (response) => {
      console.log("AJAX Response:", response) // Debug line
      if (!response || typeof response !== 'object') {
        console.error('Invalid response format:', response)
        showToast("Invalid server response", "error")
        return
      }
      
      if (!response.servers || !Array.isArray(response.servers)) {
        console.error('Invalid servers array in response:', response)
        showToast("No servers data received", "error")
        return
      }
      if (response.servers.length > 0) {
        allServersFromDB = allServersFromDB.concat(response.servers)
        displayedServersCount += response.servers.length
        console.log(`Added ${response.servers.length} servers to allServersFromDB. Total: ${allServersFromDB.length}`)
      }
      
      displayServers(response.servers)
      const serversPerPage = 12
      if (response.servers.length < serversPerPage) {
        console.log("Reached end of database servers (got", response.servers.length, "servers)")
        endOfDBReached = true
      }
      if (currentPage === 1 && response.servers.length === 0) {
        showNoServersMessage()
        hasMoreServers = false // Don't allow scrolling if no servers at all
        console.log("No servers found, disabling infinite scroll")
      } else {
        hasMoreServers = true
      }

      console.log(`Page ${currentPage} loaded. Moving to page ${currentPage + 1}`)
      currentPage++
      updateServerCount()
    },
    error: (xhr, status, error) => {
      console.error("AJAX Error:", xhr.responseText, status, error)
      let errorMessage = "Failed to load servers"
      
      if (status === 'timeout') {
        errorMessage = "Request timed out. Please try again."
      } else if (xhr.status === 0) {
        errorMessage = "Network error. Please check your connection."
      } else if (xhr.status >= 500) {
        errorMessage = "Server error. Please try again later."
      }
      
      showToast(errorMessage, "error")
      if (currentPage === 1) {
        showErrorMessage("Unable to load servers. Please refresh the page.")
        hasMoreServers = false
      }
    },
    complete: () => {
      isLoading = false
      $("#loadingIndicator").hide()
      if (currentPage === 2) { // currentPage gets incremented before complete()
        setTimeout(() => {
          checkIfPageNeedsMoreContent()
        }, 500)
      }
    },
  })
}
function checkIfPageNeedsMoreContent() {
  const documentHeight = $(document).height()
  const windowHeight = $(window).height()
  const canScroll = documentHeight > windowHeight + 100 // More conservative check
  
  console.log(`Document height: ${documentHeight}, Window height: ${windowHeight}, Can scroll: ${canScroll}`)
  if (!canScroll && allServersFromDB.length > 0 && !isLoading && currentPage <= 3) {
    console.log("Initial page too short for scrolling, adding one more batch...")
    if (!endOfDBReached) {
      loadServers(true)
    } else {
      duplicateServers()
    }
  }
}
function createSkeletonCard() {
  return $(`
    <div class="skeleton-server-card">
      <div class="skeleton-banner"></div>
      <div class="skeleton-header">
        <div class="skeleton-icon"></div>
        <div class="skeleton-text">
          <div class="skeleton-title"></div>
          <div class="skeleton-description"></div>
          <div class="skeleton-category"></div>
        </div>
      </div>
      <div class="skeleton-meta">
        <div class="skeleton-meta-item"></div>
        <div class="skeleton-meta-item"></div>
      </div>
      <div class="skeleton-button"></div>
    </div>
  `)
}
function duplicateServers() {
  if (allServersFromDB.length === 0) {
    console.log("❌ No servers to duplicate - allServersFromDB is empty")
    return
  }
  
  if (isLoading) {
    console.log("❌ Already loading, skipping duplication")
    return
  }
  
  isLoading = true
  
  console.log("🔄 === DUPLICATION DEBUG ===")
  console.log("Duplicating servers for infinite scroll...")
  console.log("Current displayed count:", displayedServersCount)
  console.log("Available servers in DB:", allServersFromDB.length)
  console.log("Current page:", currentPage)
  const serversPerPage = 12
  const serversGrid = $("#serversGrid")
  $("#loadingIndicator").show()
  console.log("Showing skeleton loading cards...")
  const skeletonCards = []
  for (let i = 0; i < serversPerPage; i++) {
    const skeletonCard = createSkeletonCard()
    skeletonCards.push(skeletonCard)
    serversGrid.append(skeletonCard)
  }
  setTimeout(() => {
    console.log("Replacing skeleton cards with actual server cards...")
    skeletonCards.forEach(card => card.remove())
    
    let serversToShow = []
    for (let i = 0; i < serversPerPage; i++) {
      const cycleIndex = (displayedServersCount + i) % allServersFromDB.length
      const sourceServer = allServersFromDB[cycleIndex]
      
      console.log(`Duplicating server ${cycleIndex}: ${sourceServer.Name}`)
      const duplicatedServer = {
        ...sourceServer,
        ID: `${sourceServer.ID}_dup_${displayedServersCount + i}`, // Unique display ID
        originalID: sourceServer.ID // Keep original ID for join functionality
      }
      
      serversToShow.push(duplicatedServer)
    }
    displayedServersCount += serversPerPage
    
    console.log("✅ Showing duplicated servers:", serversToShow.length)
    console.log("New displayed count:", displayedServersCount)
    displayServers(serversToShow)
    currentPage++
    updateServerCount()
    isLoading = false
    $("#loadingIndicator").hide()
    setTimeout(() => {
      checkIfPageNeedsMoreContent()
    }, 300)
    
    console.log("🔄 === END DUPLICATION DEBUG ===")
  }, 1500) // 1.5 second delay
}
function displayServers(servers) {
  const serversGrid = $("#serversGrid")

  if (!servers || !Array.isArray(servers)) {
    console.error('Invalid servers data:', servers)
    return
  }

  servers.forEach((server, index) => {
    try {
      const serverCard = createServerCard(server)
      serversGrid.append(serverCard)
    } catch (error) {
      console.error(`Error creating server card for server ${index}:`, error, server)
    }
  })
}
function createServerCard(server) {
  if (!server || !server.ID) {
    console.error('Invalid server data:', server)
    return $('<div></div>') // Return empty div if server data is invalid
  }
  
  const memberText = (server.member_count == 1) ? "member" : "members"
  const joinButtonText = (server.is_joined == 1) ? "JOINED" : "JOIN SERVER"
  const joinButtonClass = (server.is_joined == 1) ? "join-btn joined" : "join-btn"
  const joinButtonIcon = (server.is_joined == 1) ? "✓" : "+"
  const serverName = server.Name || 'Unnamed Server'
  const serverDescription = server.Description || "No description available"
  const serverCategory = server.Category || "General"
  const memberCount = server.member_count || 0
  const serverIdForJoin = server.originalID || server.ID

  return $(`
        <div class="server-card" data-server-id="${serverIdForJoin}" data-display-id="${server.ID}">
            <div class="server-card-banner">
                ${
                  server.BannerServer
                    ? `<img src="${server.BannerServer}" alt="Server Banner">`
                    : ""
                }
            </div>
            <div class="server-card-content">
                <div class="server-header">
                    <div class="server-icon">
                        ${
                          server.IconServer
                            ? `<img src="${server.IconServer}" alt="Server Icon">`
                            : serverName.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="server-basic-info">
                        <h3 class="server-name">${escapeHtml(serverName)}</h3>
                        <p class="server-description">${escapeHtml(serverDescription)}</p>
                        <div class="server-category">${formatCategoryName(serverCategory)}</div>
                    </div>
                </div>
                
                <div class="server-meta">
                    <div class="server-created">
                        <span>🗓️</span>
                        <span>Created ${formatDate(server.originalID || server.ID)}</span>
                    </div>
                    <div class="server-members">
                        <span>👥</span>
                        <span>${memberCount} ${memberText}</span>
                    </div>
                </div>
                
                <button class="${joinButtonClass}" onclick="event.stopPropagation()">
                    <span class="btn-icon">${joinButtonIcon}</span>
                    <span class="btn-text">${joinButtonText}</span>
                </button>
            </div>
        </div>
    `)
}
function showNoServersMessage() {
  const serversGrid = $("#serversGrid")
  const message = currentSearch 
    ? `No servers found matching "${currentSearch}"`
    : "No servers available"
    
  serversGrid.html(`
    <div class="no-servers-message">
      <div class="no-servers-icon">🔍</div>
      <h3>${message}</h3>
      <p>Try adjusting your search terms or browse different categories.</p>
    </div>
  `)
}
function showErrorMessage(message) {
  const serversGrid = $("#serversGrid")
  serversGrid.html(`
    <div class="error-message">
      <div class="error-icon">⚠️</div>
      <h3>Error Loading Servers</h3>
      <p>${message}</p>
    </div>
  `)
}
function showServerDetails(serverId) {
  currentServerId = serverId

  $.ajax({
    url: "user-explore.php",
    method: "POST",
    data: {
      action: "get_server_details",
      server_id: serverId,
    },
    dataType: "json",
    success: (response) => {
      if (response.success) {
        displayServerDetails(response.server)
        $("#serverDetailModal").addClass("active")
        $("body").css("overflow", "hidden")
      } else {
        showToast(response.message, "error")
      }
    },
    error: () => {
      showToast("Failed to load server details", "error")
    },
  })
}
function displayServerDetails(server) {
  if (!server) {
    console.error('No server data provided to displayServerDetails')
    return
  }
  if (server.BannerServer) {
    $("#serverBanner").html(`<img src="${server.BannerServer}" alt="Server Banner">`)
  } else {
    $("#serverBanner").html('<div class="default-banner">No banner available</div>')
  }
  if (server.IconServer) {
    $("#serverAvatar").html(`<img src="${server.IconServer}" alt="Server Icon">`)
  } else {
    const serverName = server.Name || 'Server'
    $("#serverAvatar").html(`<div class="default-avatar">${serverName.charAt(0).toUpperCase()}</div>`)
  }
  $("#serverName").text(server.Name || 'Unnamed Server')
  $("#serverMemberCount").text(`${server.member_count || 0} members`)
  $("#serverDescription").text(server.Description || "No description available")
  if (server.is_joined == 1) {
    $("#joinServerBtn").hide()
    $("#joinedBtn").show()
  } else {
    $("#joinServerBtn").show()
    $("#joinedBtn").hide()
  }
}
function joinServer(serverId) {
  if (!serverId) {
    showToast("Invalid server ID", "error")
    return
  }
  const joinBtn = $(`.server-card[data-server-id="${serverId}"] .join-btn`)
  const modalJoinBtn = $("#joinServerBtn")
  
  joinBtn.prop('disabled', true)
  modalJoinBtn.prop('disabled', true)

  $.ajax({
    url: "user-explore.php",
    method: "POST",
    data: {
      action: "join_server",
      server_id: serverId,
    },
    dataType: "json",
    success: (response) => {
      if (response.success) {
        showToast(response.message, "success")
        updateServerJoinStatus(serverId, true)
        if (currentServerId == serverId) {
          $("#joinServerBtn").hide()
          $("#joinedBtn").show()
        }
      } else {
        showToast(response.message, "error")
      }
    },
    error: (xhr, status, error) => {
      console.error("Join server error:", xhr.responseText, status, error)
      showToast("Failed to join server. Please try again.", "error")
    },
    complete: () => {
      joinBtn.prop('disabled', false)
      modalJoinBtn.prop('disabled', false)
    }
  })
}
function joinByInvite() {
  const inviteCode = $("#inviteCodeInput").val().trim()

  if (!inviteCode) {
    showToast("Please enter an invite code", "error")
    return
  }
  $("#inviteSubmitBtn").prop('disabled', true)

  $.ajax({
    url: "user-explore.php",
    method: "POST",
    data: {
      action: "join_by_invite",
      invite_code: inviteCode,
    },
    dataType: "json",
    success: (response) => {
      if (response.success) {
        showToast(response.message, "success")
        closeAllModals()
        $("#inviteCodeInput").val("")
        resetAndLoadServers()
      } else {
        showToast(response.message, "error")
      }
    },
    error: () => {
      showToast("Failed to join server", "error")
    },
    complete: () => {
      $("#inviteSubmitBtn").prop('disabled', false)
    }
  })
}
function updateServerJoinStatus(serverId, isJoined) {
  const serverCards = $(`.server-card[data-server-id="${serverId}"]`)
  
  serverCards.each(function() {
    const joinBtn = $(this).find(".join-btn")
    
    if (isJoined) {
      joinBtn.addClass("joined")
      joinBtn.find(".btn-icon").text("✓")
      joinBtn.find(".btn-text").text("JOINED")
    } else {
      joinBtn.removeClass("joined")
      joinBtn.find(".btn-icon").text("+")
      joinBtn.find(".btn-text").text("JOIN SERVER")
    }
  })
  allServersFromDB.forEach(server => {
    if (server.ID == serverId) {
      server.is_joined = isJoined ? 1 : 0
    }
  })
}
function showJoinServerModal() {
  $("#joinServerModal").addClass("active")
  $("body").css("overflow", "hidden")
  $("#inviteCodeInput").focus()
}
function closeAllModals() {
  $(".modal").removeClass("active")
  $("body").css("overflow", "")
  currentServerId = null
}
function updateServerCount() {
  const totalCards = $(".server-card").length
  const uniqueServers = allServersFromDB.length
  
  if (uniqueServers > 0 && totalCards > uniqueServers) {
    $("#serverCount").text(`${totalCards} servers available (${uniqueServers} unique servers)`)
  } else {
    $("#serverCount").text(`${totalCards} servers available`)
  }
}
function formatDate(id) {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 365) + 1
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}
function escapeHtml(text) {
  if (!text || text === null || text === undefined) {
    return ''
  }
  const div = document.createElement("div")
  div.textContent = String(text) // Convert to string to prevent undefined issues
  return div.innerHTML
}
function showToast(message, type = "info") {
  const toastContainer = $("#toastContainer")

  const toast = $(`<div class="toast ${type}">${escapeHtml(message)}</div>`)
  toastContainer.append(toast)
  setTimeout(() => {
    toast.css("animation", "toastSlideOut 0.3s ease forwards")
    setTimeout(() => {
      toast.remove()
    }, 300)
  }, 5000)
  toast.on("click", function () {
    $(this).css("animation", "toastSlideOut 0.3s ease forwards")
    setTimeout(() => {
      $(this).remove()
    }, 300)
  })
}
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func.apply(this, args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
function throttle(func, limit) {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
const style = document.createElement("style")
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
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .server-card {
        animation: fadeInUp 0.3s ease forwards;
    }
    
    .no-servers-message,
    .error-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        text-align: center;
        color: #72767d;
        grid-column: 1 / -1;
    }
    
    .no-servers-icon,
    .error-icon {
        font-size: 48px;
        margin-bottom: 16px;
    }
    
    .no-servers-message h3,
    .error-message h3 {
        margin: 0 0 8px 0;
        color: #ffffff;
        font-size: 20px;
    }
    
    .no-servers-message p,
    .error-message p {
        margin: 0;
        font-size: 14px;
    }
    
    .default-banner {
        width: 100%;
        height: 120px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 500;
    }
    
    .default-avatar {
        width: 80px;
        height: 80px;
        background: #5865f2;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 32px;
        font-weight: 600;
    }
    
    .join-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    #inviteSubmitBtn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .loading-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        color: #72767d;
        font-size: 14px;
        grid-column: 1 / -1;
    }
    
    .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #72767d;
        border-top: 2px solid #5865f2;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 10px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Add a subtle visual indicator for duplicated servers */
    .server-card[data-display-id*="_dup_"] {
        position: relative;
    }
    
    .server-card[data-display-id*="_dup_"]::before {
        content: "";
        position: absolute;
        top: 8px;
        right: 8px;
        width: 6px;
        height: 6px;
        background: #5865f2;
        border-radius: 50%;
        opacity: 0.3;
        z-index: 1;
    }
    
    /* Skeleton loading styles */
    .skeleton-server-card {
        background: #2f3136;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        animation: skeletonPulse 1.5s ease-in-out infinite alternate;
    }
    
    .skeleton-banner {
        width: 100%;
        height: 120px;
        background: #36393f;
        border-radius: 6px;
        margin-bottom: 12px;
    }
    
    .skeleton-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
    }
    
    .skeleton-icon {
        width: 50px;
        height: 50px;
        background: #36393f;
        border-radius: 50%;
        margin-right: 12px;
    }
    
    .skeleton-text {
        flex: 1;
    }
    
    .skeleton-title {
        width: 60%;
        height: 20px;
        background: #36393f;
        border-radius: 4px;
        margin-bottom: 8px;
    }
    
    .skeleton-description {
        width: 80%;
        height: 14px;
        background: #36393f;
        border-radius: 4px;
        margin-bottom: 6px;
    }
    
    .skeleton-category {
        width: 40%;
        height: 12px;
        background: #36393f;
        border-radius: 4px;
    }
    
    .skeleton-meta {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
    }
    
    .skeleton-meta-item {
        width: 30%;
        height: 12px;
        background: #36393f;
        border-radius: 4px;
    }
    
    .skeleton-button {
        width: 100%;
        height: 36px;
        background: #36393f;
        border-radius: 6px;
    }
    
    @keyframes skeletonPulse {
        0% {
            opacity: 0.6;
        }
        100% {
            opacity: 0.9;
        }
    }
`