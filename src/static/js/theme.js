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

function toggleInitialHeader() {
    const header = document.querySelector('header');
    if (header.classList.contains('initial-header')) {
        header.classList.remove('initial-header');
        header.classList.add('small-header');
        document.body.classList.remove('initial-header');
    }  // TODO сделать отключение большого хэдера по таймауту
}

document.addEventListener('DOMContentLoaded', function() {
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

    // resize header on click:
    const header = document.querySelector('header');
    document.addEventListener('click', function(e) {
        if (e.target.closest('#sidebar') || e.target.closest('footer')) {
            return;
        }

        if (header.classList.contains('initial-header')) {
            header.classList.remove('initial-header');
            header.classList.add('small-header');
            document.body.classList.remove('initial-header');
        }
    });
    setTimeout(() => {
    });
});
