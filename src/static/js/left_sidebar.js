function toggleSidebar() {
    const currentStateCollapsed = leftSidebar.classList.contains('collapsed');

    if (currentStateCollapsed) {
        leftSidebar.classList.remove('collapsed');
        baseContainer.classList.remove('left-sidebar-collapsed');
        localStorage.setItem('currentState', 'not-collapsed');
    } else {
        leftSidebar.classList.add('collapsed');
        baseContainer.classList.add('left-sidebar-collapsed');
        localStorage.setItem('currentState', 'collapsed');
    }
    updateSidebarItemsVisibility();
}

function updateSidebarItemsVisibility() {
    const isCollapsed = leftSidebar.classList.contains('collapsed');
    const items = document.querySelectorAll('.sidebar-item');

    items.forEach(item => {
        const number = item.querySelector('.item-number');
        const text = item.querySelector('.sidebar-text');

        if (isCollapsed) {
            number.style.display = 'block';
            text.style.display = 'none';
        } else {
            number.style.display = 'none';
            text.style.display = 'block';
        }
    });
}

function addSidebarItem(task) {
    const item = document.createElement('div');
    let prompt = task['prompt'];
    item.className = 'sidebar-item';
    item.dataset.fullText = prompt;
    item.dataset.itemNumber = task['task_id'];
    item.dataset.handler_id = task['handler_id'];

    const numberSpan = document.createElement('span');
    numberSpan.className = 'item-number';
    numberSpan.textContent = task['short_task_id'];

    const textSpan = document.createElement('span');
    textSpan.className = 'sidebar-text';
    textSpan.textContent = prompt.length > 20 ? prompt.substring(0, 20) + '...' : prompt;

    item.appendChild(numberSpan);
    item.appendChild(textSpan);

    item.addEventListener('click', function() {
        document.querySelectorAll('.sidebar-item, .result-container').forEach(el => {
            el.classList.remove('active');
        });

        this.classList.add('active');
        const taskEl = document.getElementById(`${task['task_id']}`);
        if (taskEl) {
            taskEl.classList.add('active');
        }
    });
    document.querySelectorAll('.sidebar-item, .result-container').forEach(el => {
        el.classList.remove('active');
    });
    item.classList.add('active');

    leftSidebarContent.insertBefore(item, leftSidebarContent.firstChild);
    item.scrollIntoView({behavior: "smooth", block: "nearest"});
    updateSidebarItemsVisibility();

    return item;
}

document.addEventListener('DOMContentLoaded', function() {
    const leftSidebarToggleBtn = document.getElementById('left-sidebar-toggle-btn');
    leftSidebarToggleBtn.addEventListener('click', function () {
        toggleSidebar();
    });
    const savedSidebarState = localStorage.getItem('currentState') || 'not-collapsed';

    if (savedSidebarState === 'collapsed') {
        leftSidebar.classList.add('collapsed');
        baseContainer.classList.add('left-sidebar-collapsed');
        localStorage.setItem('currentState', 'collapsed');
    } else {
        leftSidebar.classList.remove('collapsed');
        baseContainer.classList.remove('left-sidebar-collapsed');
        localStorage.setItem('currentState', 'not-collapsed');
    }
    updateSidebarItemsVisibility();
});
