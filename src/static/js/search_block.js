function startTask() {
    const inputText = document.getElementById('inputParam');
    const questionText = inputText.value;

    if (!questionText.trim()) {
        alert('Пожалуйста, введите вопрос');
        return;
    }

    document.getElementById('inputParam').value = '';
    autoResize(inputText);

    let task = {
        prompt: questionText,
        handler_id: handlerSelect.value
    };

    fetch(`${BACKEND_URL}/api/v1/enqueue`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify(task)
    })
        .then(res => {
            if (res.ok) return res;
            else throw new Error('Ошибка при отправке запроса');
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

    const handlerConfig = handlersConfigs[task['handler_id']];
    let taskId = task['task_id'];

    const taskDiv = document.createElement('div');
    taskDiv.className = 'result-container';
    taskDiv.id = taskId;
    taskDiv.innerHTML = `
<div class="task-header">
    <span class="task-title">Вопрос: ${task['prompt']}</span>
    <span class="task-type">Тип: ${handlerConfig.name} (${handlerConfig.version})</span>
</div>
<div class="status status-queued">
    <span class="status-text">Статус: ожидание</span>
    <img src="/static/loading_dog.gif" class="loading-gif" alt="Загрузка...">
</div>
<div class="result" id="result-${taskId}"></div>
<div class="toggle-container">
<!--<button class="toggle-btn" id="btn-${taskId}" onclick="toggleResult('${taskId}')">-->
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

function updateStatus(taskId, task) {
    const el = document.getElementById(`${taskId}`);
    if (el) {
        const statusEl = el.querySelector('.status');
        const statusText = statusEl.querySelector('.status-text');
        const resultEl = document.getElementById(`result-${taskId}`);
        const loadingGif = statusEl.querySelector('.loading-gif');

        let status = task.status;
        let statusRawText
        let statusClass
        if (status === 'queued') {
            let position = task.current_position;
            if (position > 0) {
                statusRawText = `ожидание, позиция в очереди: ${position}`
            } else {
                statusRawText = 'ожидание, запрос выполняется'
            }
            statusClass = 'status-queued';
        } else if (status === 'failed') {
            statusRawText = 'ошибка';
            statusClass = 'status-error';
        } else if (status === 'completed') {
            statusRawText = 'выполнено';
            statusClass = 'status-done';
        } else if (status === 'running') {
            statusRawText = 'выполняется';
            statusClass = 'status-queued';
        } else if (status === 'pending') {
            statusRawText = 'приостановлено, нет запущенных обработчиков для этого типа задачи';
            statusClass = 'status-pending';
        }

        status = statusRawText
        let result
        if (task.status === 'completed') {
            result = task.result;
        } else {
            result = task.error;
        }

        statusText.textContent = `Статус: ${status}`;
        statusEl.className = 'status';

        if (status.startsWith('ожидание')) {
            if (!loadingGif) {
                const gif = document.createElement('img');
                gif.src = '/static/loading_dog.gif';
                gif.className = 'loading-gif';
                gif.alt = 'Загрузка...';
                statusEl.appendChild(gif);
            }
        } else {
            if (loadingGif) loadingGif.remove();
        }
        statusEl.classList.add(statusClass);
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
    <button class="like-btn" onclick="handleTaskFeedback('${taskId}', 'like', this)">👍</button>
    <button class="dislike-btn" onclick="handleTaskFeedback('${taskId}', 'dislike', this)">👎</button>
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
            } else {
                updateStatus(taskId, data)
            }
        } catch (e) {
            console.error("Ошибка парсинга:", e);
        }
    };

    eventSource.onerror = function(err) {
        console.error("Ошибка SSE для задачи", taskId, err);
        eventSource.close();
        setTimeout(subscribeToTask, 10000, taskId);
    };
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

function updateHandlers(handlersData) {
    // TODO обновить подписи типов существующих задач, грузить список обработчиков до загрузки задач
    availableHandlers = handlersData.available_handlers;
    const newHandlersConfigs = handlersData.configs;
    updateLocalStorageHandlers(newHandlersConfigs)

    while (handlerSelect.options.length > 0) {
        handlerSelect.options.remove(0);
    }

    const defaultOption = document.createElement('option');
    defaultOption.value = 'default';
    defaultOption.textContent = 'Select handler';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    handlerSelect.appendChild(defaultOption);

    for (let handler_id in availableHandlers) {
        const option = document.createElement('option');
        option.value = handler_id;
        const config = handlersConfigs[handler_id];
        option.textContent = `${config.name} (${config.version})`;
        handlerSelect.appendChild(option);
    }

    executeBtn.disabled = !handlerSelect.value;
    statusDiv.textContent = `Обработчики обновлены: ${new Date().toLocaleTimeString()}`;
}

function connectHandlersStream() {
    let handlersStream = new EventSource(`${BACKEND_URL}/api/v1/handlers/stream`);
    handlersStream.onmessage = (event) => {
        updateHandlers(JSON.parse(event.data));
        document.getElementById('status').classList.remove('error')
    };
    handlersStream.onerror = (err) => {
        console.error('EventSource error:', err);
        statusDiv.textContent = 'Связь с сервером потеряна, пытаемся переподключиться...';
        document.getElementById('status').classList.add('error')
        handlersStream.close();
        setTimeout(connectHandlersStream, 10000);
    }
}

function updateLocalStorageHandlers(newData) {
    const storedData = JSON.parse(localStorage.getItem('handlersConfigs') || '{}');

    const updatedData = { ...storedData };
    for (const [key, value] of Object.entries(newData)) {
        updatedData[key] = value;
    }
    localStorage.setItem('handlersConfigs', JSON.stringify(updatedData));
    handlersConfigs = updatedData
}

document.addEventListener('DOMContentLoaded', () => {
    autoResize(textarea);
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
    handlerSelect.addEventListener('change', () => {
        executeBtn.disabled = !handlerSelect.value;
    });
    connectHandlersStream();
});
