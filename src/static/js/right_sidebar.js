
function updateHandlerInfo() {
    const handlerInfo = handlersConfigs[handlerSelect.value];
    const handlerNameEl = document.getElementById('currentModeDisplay');
    const handlerDescEl = document.getElementById('handlerDescription');
    const handlerVersionEl = document.getElementById('handlerVersion');
    const handlerWorkersEl = document.getElementById('handlerWorkers');

    if (!handlerInfo) {
        handlerDescEl.textContent = '';
        handlerVersionEl.textContent = '';
        handlerWorkersEl.textContent = '';
        handlerWorkersEl.className = 'handler-workers unavailable';
        return;
    }

    handlerNameEl.textContent = handlerInfo.name;
    handlerDescEl.textContent = handlerInfo.description;
    handlerVersionEl.textContent = handlerInfo.version;
    handlerWorkersEl.textContent = availableHandlers[handlerSelect.value] || 0;
    handlerWorkersEl.className = availableHandlers[handlerSelect.value] > 0 ?
        'handler-workers available' : 'handler-workers unavailable';
}

function toggleRightSidebar() {
    const sidebar = document.getElementById('right-sidebar');
    sidebar.classList.toggle('collapsed');
}

document.addEventListener('DOMContentLoaded', function() {
    const rightToggleBtn = document.getElementById('right-toggle-btn');
    const rightSidebar = document.getElementById('right-sidebar');
    const baseContainer = document.getElementById('base-container');

    rightToggleBtn.addEventListener('click', function() {
        rightSidebar.classList.toggle('right-sidebar-collapsed');

        // if (rightSidebar.classList.contains('right-sidebar-collapsed')) {
        //     baseContainer.style.marginRight = '0';
        // } else {
        //     baseContainer.style.marginRight = '250px';
        // }
    });
    handlerSelect.addEventListener('change', function() {
        // updateCurrentModeDisplay();
        updateHandlerInfo();
    });
});
