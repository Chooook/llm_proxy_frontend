const converter = new showdown.Converter({
    tables: true,
    strikethrough: true,
    simplifiedAutoLink: true
});
let BACKEND_URL;

const taskTypeNames = {
    'generate_pm': 'Помощник ЦК PM',
    'generate_spc': 'Помощник ЦК СПК',
    // 'generate_oapso': 'Помощник ОАПСО',
    'generate_local': 'Локальная генерация',
    'dummy': 'Перемешать буквы'
};

const sidebar = document.getElementById('sidebar');
const sidebarContent = document.getElementById('sidebar-content');
const baseContainer = document.getElementById('base-container');
const textarea = document.getElementById("inputParam");

function startTask() {
    const inputText = document.getElementById('inputParam');
    const questionText = inputText.value;
    const taskType = document.getElementById('taskType').value;

    if (!questionText.trim()) {
        alert('Пожалуйста, введите вопрос');
        return;
    }

    document.getElementById('inputParam').value = '';
    autoResize(inputText);

    let task = {
        prompt: questionText,
        task_type: taskType
    };

    fetch(`${BACKEND_URL}/api/v1/enqueue`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify(task)
    })
    .then(res => res.json())
    .then(data => {
        task['task_id'] = data['task_id'];
        task['short_task_id'] = data['short_task_id'];
        addTaskToUI(task);
        subscribeToTask(task['task_id']);
    })
    .catch(error => {
        console.error('Ошибка при отправке запроса:', error);
    });
}

function addTaskToUI(task) {
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.style.display = 'none';

    const taskTypeName = taskTypeNames[task['task_type']];
    let taskId = task['task_id'];

    const taskDiv = document.createElement('div');
    taskDiv.className = 'result-container';
    taskDiv.id = taskId;
    taskDiv.innerHTML = `
<div class="task-header">
    <span class="task-title">Вопрос: ${task['prompt']}</span>
    <span class="task-type">Тип: ${taskTypeName}</span>
</div>
<div class="status status-waiting">
    <span class="status-text">Статус: ожидание</span>
    <img src="/static/loading_dog.gif" class="loading-gif" alt="Загрузка...">
</div>
<div class="result" id="result-${taskId}"></div>
<div class="toggle-container">
<button class="toggle-btn" id="btn-${taskId}" onclick="toggleResult('${taskId}')">
    <span class="icon">−</span>
    </button>
</div>`;
    addSidebarItem(task)
    const container = document.getElementById('tasks');
    container.insertBefore(taskDiv, container.firstChild);

    document.querySelectorAll('.result-container').forEach(taskEl => {
        taskEl.classList.remove('active');
    });
    taskDiv.classList.add('active');

    const divider = document.getElementById('taskDivider');
    if (container.children.length === 1) {
        divider.classList.add('show');
    }

    requestAnimationFrame(() => {
        taskDiv.classList.add('animate');
    });
}

function addSidebarItem(task) {
    const item = document.createElement('div');
    let prompt = task['prompt'];
    item.className = 'sidebar-item';
    item.dataset.fullText = prompt;
    item.dataset.itemNumber = task['task_id'];
    item.dataset.task_type = task['task_type'];

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

    sidebarContent.insertBefore(item, sidebarContent.firstChild);
    item.scrollIntoView({behavior: "smooth", block: "nearest"});
    updateSidebarItemsVisibility();

    return item;
}

function updateSidebarItemsVisibility() {
    const isCollapsed = sidebar.classList.contains('collapsed');
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

function updateStatus(taskId, task) {
    const el = document.getElementById(`${taskId}`);
    if (el) {
        const statusEl = el.querySelector('.status');
        const statusText = statusEl.querySelector('.status-text');
        const resultEl = document.getElementById(`result-${taskId}`);
        const loadingGif = statusEl.querySelector('.loading-gif');

        let status = task.status;
        let queuedText
        if (status === 'queued') {
            let position = task.current_position;
            if (position > 0) {
                queuedText = `ожидание, позиция в очереди: ${position}`
            } else {
                queuedText = 'ожидание, запрос выполняется'
            }
        }
        status = task.status === 'completed' ? 'выполнено' :
            task.status === 'failed' ? 'ошибка' : queuedText;
        let result
        if (task.status === 'completed') {
            result = task.result;
        } else {
            result = task.error;
        }

        statusText.textContent = `Статус: ${status}`;
        statusEl.className = 'status';

        if (status.startsWith('ожидание')) {
            statusEl.classList.add('status-waiting');
            if (!loadingGif) {
                const gif = document.createElement('img');
                gif.src = '/static/loading_dog.gif';
                gif.className = 'loading-gif';
                gif.alt = 'Загрузка...';
                statusEl.appendChild(gif);
            }
        } else if (status === 'выполнено') {
            statusEl.classList.add('status-done');
            if (loadingGif) loadingGif.remove();
        } else if (status === 'ошибка') {
            statusEl.classList.add('status-error');
            if (loadingGif) loadingGif.remove();
        }
        let resultText = result.text

        const relevantDocs = result.relevant_docs;
        for (let doc in relevantDocs) {
            resultText += `<div class="relevant-doc">${doc}: ${relevantDocs[doc]}</div>`;
        }
        const result_md = converter.makeHtml(resultText.trim());

        if (result_md.trim() !== '') {
            try {
                resultEl.innerHTML = `
<div class="result-text">${result_md}</div>
<div class="result-raw-text" style="display: none">${resultText.trim()}</div>
<div class="result-actions">
    <button class="like-btn" onclick="handleFeedback('${taskId}', 'like', this)">👍</button>
    <button class="dislike-btn" onclick="handleFeedback('${taskId}', 'dislike', this)">👎</button>
    <button class="copy-btn" onclick="fallbackCopyToClipboard('${taskId}', this)">📋</button>
</div>`;
                const feedback = task.feedback.feedback
                if (feedback !== 'neutral') {
                    const button = resultEl.querySelector(`.${feedback}-btn`);
                    button.classList.add('active');
                }
            } catch (e) {
                resultEl.textContent = result;
            }
        }
    }
}

function toggleResult(taskId) {
    const resultEl = document.getElementById(`result-${taskId}`);
    const icon = document.querySelector(`#btn-${taskId} .icon`);

    if (!resultEl) return;

    if (resultEl.classList.contains('show')) {
        resultEl.classList.remove('show');

        setTimeout(() => {}, 300);

        icon.textContent = '▼';
    } else {
        resultEl.classList.add('show');
        icon.textContent = '▲';
    }
}

function subscribeToTask(taskId) {
    const eventSource = new EventSource(`${BACKEND_URL}/api/v1/subscribe/${taskId}`);
    const sidebarItem = document.querySelector(`.sidebar-item[data-item-number="${taskId}"]`);
    eventSource.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.status === 'completed') {
                updateStatus(taskId, data);
                sidebarItem.classList.add('completed');
                eventSource.close();
            } else if (data.status === 'failed') {
                updateStatus(taskId, data);
                sidebarItem.classList.add('error');
                eventSource.close();
            } else if (data.status === 'queued') {
                updateStatus(taskId, data)
            }
        } catch (e) {
            console.error("Ошибка парсинга:", e);
        }
    };

    eventSource.onerror = function(err) {
        console.error("Ошибка SSE для задачи", taskId, err);
        eventSource.close();
    };
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const themeIcon = document.getElementById('theme-icon');

    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeIcon.textContent = '🔆';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeIcon.textContent = '☾';
    }
}

function toggleSidebar() {
    const currentStateCollapsed = sidebar.classList.contains('collapsed');

    if (currentStateCollapsed) {
        sidebar.classList.remove('collapsed');
        baseContainer.classList.remove('collapsed');
        localStorage.setItem('currentState', 'not-collapsed');
    } else {
        sidebar.classList.add('collapsed');
        baseContainer.classList.add('collapsed');
        localStorage.setItem('currentState', 'collapsed');
    }
    updateSidebarItemsVisibility();
}

function handleFeedback(taskId, type, button) {
    fetch(`${BACKEND_URL}/api/v1/feedback/${taskId}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({ feedback: type })
    }).then(response => {
        if (response.ok) {
            console.log(`Поставлен "${type}" задаче ${taskId}`);
            const parent = button.parentElement;
            [...parent.children].forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        } else {
            console.error(`Ошибка при отправке оценки для задачи ${taskId}`);
        }
    }).catch(error => {
        console.error(`Ошибка при отправке оценки для задачи ${taskId}: ${error}`);
    });
}

function fallbackCopyToClipboard(taskId, button) {
    const text = document.querySelector(`#result-${taskId} .result-raw-text`).textContent;
    let textArea = document.createElement("textarea");
    textArea.value = text;

    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
    button.textContent = '✅';
    setTimeout(() => {
        button.textContent = '📋';
    }, 1500);
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    const maxHeight = 300;
    const scrollHeight = textarea.scrollHeight;

    if (scrollHeight > maxHeight) {
        textarea.style.height = maxHeight + 'px';
        textarea.style.overflowY = 'auto';
    } else {
        textarea.style.height = scrollHeight + 'px';
        textarea.style.overflowY = 'hidden';
    }
}

function openFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
    document.body.style.overflow = '';
}

async function submitFeedback() {
    const text = document.getElementById('feedbackText').value.trim();
    const contact = document.getElementById('feedbackContact').value.trim();

    if (!text) {
        alert('Пожалуйста, введите ваше сообщение');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, contact }),
        });

        if (response.ok) {
            alert('Спасибо за вашу обратную связь!');
            closeFeedbackModal();
            document.getElementById('feedbackText').value = '';
            document.getElementById('feedbackContact').value = '';
        }
    } catch (error) {
        alert('Произошла ошибка при отправке. Попробуйте позже или напишите нам на почту.');
        console.error('Feedback submission error:', error);
    }
}



document.addEventListener('DOMContentLoaded', function() {
    // TODO: добавить функционал подключения к endpoint /api/v1/handlers/stream.
    //  функцию по обновлению выпадающего меню реализовать отдельно, выше.
    //  учесть ситуации, когда хэндлеров нет совсем (добавить висящее сообщение с информацией об этом)
    //  соответственно, не давать пользователю запускать задачи без хэндлера
    //  подтягивать в правый сайдбар информацию о хэндлере (схема ответа в backend/schemas/handler)
    autoResize(textarea);
    const toggleBtn = document.getElementById('toggle-btn');

    toggleBtn.addEventListener('click', function () {
        toggleSidebar();
    });
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeFeedbackModal();
        }
    });
    textarea.addEventListener(
        'keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                setTimeout(() => {
                    textarea.value = textarea.value.replace(/\n$/, "");
                }, 0);
                startTask();
            }
        }
    );

    document.body.classList.add('initial-header');
    const savedTheme = localStorage.getItem('theme') || 'light';
    const themeIcon = document.getElementById('theme-icon');

    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☾';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.textContent = '🔆';
    }

    document.addEventListener('click', function(e) {
        if (e.target.closest('#sidebar') || e.target.closest('footer')) {
            return;
        }

        const header = document.querySelector('header');
        if (header.classList.contains('initial-header')) {
            header.classList.remove('initial-header');
            header.classList.add('small-header');
            document.body.classList.remove('initial-header');
        }
    });

    const savedSidebarState = localStorage.getItem('currentState') || 'not-collapsed';

    if (savedSidebarState === 'collapsed') {
        sidebar.classList.add('collapsed');
        baseContainer.classList.add('collapsed');
        localStorage.setItem('currentState', 'collapsed');
    } else {
        sidebar.classList.remove('collapsed');
        baseContainer.classList.remove('collapsed');
        localStorage.setItem('currentState', 'not-collapsed');
    }
    updateSidebarItemsVisibility();


    fetch('/config').then(res => res.json()).then(config => {
        BACKEND_URL = config['BACKEND_URL'];
        return BACKEND_URL;
    })
    .then(() => {
        return fetch(`${BACKEND_URL}/`, {
            credentials: 'include'
        })
    })
    .then(response => {
        if (response.ok) {
          console.log('Автоматический вход выполнен');
        } else {
          console.error('Ошибка авто-логина');
        }
    })
    .then(() => {
        return fetch(`${BACKEND_URL}/api/v1/tasks`, { credentials: 'include' });
    })
    .then(response => {
        if (!response.ok) throw new Error('Network error');
        if (response.status === 204) return [];
        return response.json();
    })
    .then(tasks => {
        if (!tasks || tasks.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
            return;
        }

        let lastAddedItem = null;

        tasks.forEach(task => {
            try {
                task = JSON.parse(task);
                const taskId = task['task_id'];
                addTaskToUI(task);

                lastAddedItem = document.querySelector(`.sidebar-item[data-item-number="${taskId}"]`);
                const position = task.current_position
                let queuedText
                if (position > 0) {
                    queuedText = `ожидание, позиция в очереди: ${position}`
                } else {
                    queuedText = 'ожидание, запрос выполняется'
                }
                const status = task.status === 'completed' ? 'выполнено' :
                    task.status === 'failed' ? 'ошибка' : queuedText;
                updateStatus(taskId, task);

                const sidebarItem = document.querySelector(`.sidebar-item[data-item-number="${taskId}"]`);
                if (status === 'выполнено') sidebarItem.classList.add('completed');
                if (status === 'ошибка') sidebarItem.classList.add('error');

                if (status.startsWith('ожидание')) subscribeToTask(taskId);
            } catch (e) {
                console.error('Error loading task:', e);
            }
        });

        if (lastAddedItem) {
            lastAddedItem.classList.add('active');
            const taskId = lastAddedItem.dataset.itemNumber;
            const taskEl = document.getElementById(`${taskId}`);
            if (taskEl) {
                taskEl.classList.add('active');
            }
        }
    })
    .catch(error => {
        console.error('Network error:', error);
        document.getElementById('emptyState').style.display = 'block';
    });
});
