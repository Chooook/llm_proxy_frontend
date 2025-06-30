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

async function submitFeedback() {
    const textElement = document.getElementById('feedbackText');
    const contactElement = document.getElementById('feedbackContact');

    const text = textElement.value.trim();
    const contact = contactElement.value.trim();

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
            textElement.value = '';
            contactElement.value = '';
        }
    } catch (error) {
        alert('Произошла ошибка при отправке. Попробуйте позже или напишите нам на почту.');
        console.error('Feedback submission error:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeFeedbackModal();
        }
    });
});
