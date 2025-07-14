
function updateHandlerInfo() {
    const handlerData = handlersConfigs[handlerSelect.value];
    const handlerNameEl = document.getElementById('right-sidebar-text');
    const handlerDescEl = document.getElementById('handler-description');
    const handlerVersionEl = document.getElementById('handler-version');
    const handlerWorkersEl = document.getElementById('handler-workers');

    if (!handlerData) {
        handlerNameEl.textContent = 'Обработчик не выбран';
        handlerDescEl.textContent = 'Здесь будет отображаться описание обработчика';
        handlerVersionEl.textContent = '0.0.0';
        handlerWorkersEl.textContent = '0';
        handlerInfo.className = 'unavailable';
        return;
    }

    handlerNameEl.textContent = handlerData.name;
    handlerDescEl.textContent = handlerData.description;
    handlerVersionEl.textContent = handlerData.version;
    handlerWorkersEl.textContent = availableHandlers[handlerSelect.value] || 0;
    handlerInfo.className = availableHandlers[handlerSelect.value] > 0 ?
        'available' : 'unavailable';
}

function toggleRightSidebar() {
    rightSidebar.classList.toggle('collapsed');
    baseContainer.classList.toggle('right-sidebar-collapsed')
}

document.addEventListener('DOMContentLoaded', function() {
    updateHandlerInfo()
    const rightToggleBtn = document.getElementById('right-sidebar-toggle-btn');
    const searchRightToggleBtn = document.getElementById('search-right-sidebar-toggle-btn');

    rightToggleBtn.addEventListener('click',  function () {
        toggleRightSidebar();
    });
    searchRightToggleBtn.addEventListener('click',  function () {
        toggleRightSidebar();
    });
    handlerSelect.addEventListener('change', function() {
        updateHandlerInfo();
    });
});
