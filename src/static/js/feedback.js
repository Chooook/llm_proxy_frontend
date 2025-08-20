// Стили для ошибок (добавляем динамически)
const style = document.createElement('style');
style.textContent = `
  .error-field {
    border: 2px solid #ff4444 !important;
    background-color: #ffeeee !important;
  }
  .error-message {
    color: #ff4444;
    font-size: 0.8rem;
    margin-top: -0.8rem;
    margin-bottom: 1rem;
    display: none;
  }
`;
document.head.appendChild(style);

function handleTaskFeedback(taskId, type, button) {
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

function openFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
    document.body.style.overflow = 'hidden';
    resetValidation();
}

function closeFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
    document.body.style.overflow = '';
}

function resetValidation() {
    document.querySelectorAll('.error-field').forEach(field => {
        field.classList.remove('error-field');
    });
    document.querySelectorAll('.error-message').forEach(msg => {
        msg.style.display = 'none';
    });
}

function showError(field, message) {
    field.classList.add('error-field');
    let errorMsg = field.nextElementSibling;

    if (!errorMsg || !errorMsg.classList.contains('error-message')) {
        errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        field.parentNode.insertBefore(errorMsg, field.nextSibling);
    }

    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
}

function validateField(field) {
    const value = field.value.trim();

    if (field.id === 'feedbackText') {
        if (!value) {
            showError(field, 'Пожалуйста, введите ваше сообщение');
            return false;
        }
    } else if (field.id === 'feedbackContact') {
        const emailRegex = /^[^\s@]+@(omega\.sbrf\.ru|sberbank\.ru|mail\.ca\.sbrf\.ru|sber\.ru)$/i;
        if (!value) {
            showError(field, 'Пожалуйста, введите вашу корпоративную почту');
            return false;
        } else if (!emailRegex.test(value)) {
            showError(field, 'Используйте корпоративную почту)');
            return false;
        }
    }

    field.classList.remove('error-field');
    const errorMsg = field.nextElementSibling;
    if (errorMsg && errorMsg.classList.contains('error-message')) {
        errorMsg.style.display = 'none';
    }
    return true;
}

async function submitFeedback() {
    const textElement = document.getElementById('feedbackText');
    const contactElement = document.getElementById('feedbackContact');

    const isTextValid = validateField(textElement);
    const isContactValid = validateField(contactElement);

    if (!isTextValid || !isContactValid) {
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/feedback`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                text: textElement.value.trim(),
                contact: contactElement.value.trim()
            }),
        });

        if (response.ok) {
            alert('Спасибо за вашу обратную связь!');
            closeFeedbackModal();
            textElement.value = '';
            contactElement.value = '';
        } else {
            throw new Error('Ошибка сервера');
        }
    } catch (error) {
        showError(contactElement, 'Ошибка при отправке. Попробуйте позже.');
        console.error('Feedback submission error:', error);
    }
}

// Инициализация валидации
document.addEventListener('DOMContentLoaded', function() {
    const textElement = document.getElementById('feedbackText');
    const contactElement = document.getElementById('feedbackContact');

// Сбрасываем ошибку при фокусе
    [textElement, contactElement].forEach(field => {
        field.addEventListener('focus', function() {
            this.classList.remove('error-field');
            const errorMsg = this.nextElementSibling;
            if (errorMsg && errorMsg.classList.contains('error-message')) {
                errorMsg.style.display = 'none';
            }
        });

        // Валидация при потере фокуса
        field.addEventListener('blur', function() {
            validateField(this);
        });
    });

    // Закрытие по Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') closeFeedbackModal();
    });
});
