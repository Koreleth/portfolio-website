// Admin: Sicherheitsabfrage vor dem Löschen (Text steht im data-confirm des Formulars)
document.querySelectorAll('form[data-confirm]').forEach(form => {
    form.addEventListener('submit', (e) => {
        if (!window.confirm(form.dataset.confirm)) {
            e.preventDefault();
        }
    });
});
