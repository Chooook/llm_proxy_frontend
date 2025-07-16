let warning_container = document.getElementById('edge-warning');
let warning_tooltip = document.getElementById('warning-tooltip');

function isEdge() {
    return /Edg|Edge/.test(navigator.userAgent);
}

if (isEdge()) {
    warning_container.style.display = 'block';
}

warning_container.addEventListener('mouseenter', () => {
    warning_tooltip.style.opacity = '1';
});
warning_container.addEventListener('mouseleave', () => {
    warning_tooltip.style.opacity = '0';
});

warning_container.addEventListener('mousemove', (event) => {
    let x = event.clientX;
    let y = event.clientY;
    
    warning_tooltip.style.left = `${x-600}px`;
    warning_tooltip.style.top = `${y+20}px`;
});

