// Bestätigungs-Dialog im Design der Seite (statt window.confirm); liefert true, wenn bestätigt wurde.
// Esc, „Abbrechen“ oder ein Klick auf den abgedunkelten Hintergrund brechen ab
let confirmBox;
const confirmDialog = ({ title, message = '', confirmLabel = 'Löschen', cancelLabel = 'Abbrechen' }) => {
    if (!confirmBox) {
        confirmBox = document.createElement('dialog');
        confirmBox.className = 'confirm-dialog';
        confirmBox.setAttribute('aria-labelledby', 'confirm-title');
        confirmBox.setAttribute('aria-describedby', 'confirm-text');
        confirmBox.innerHTML = '<form method="dialog">'
            + '<span class="confirm-icon" aria-hidden="true"></span>'
            + '<h2 id="confirm-title"></h2>'
            + '<p id="confirm-text"></p>'
            + '<div class="confirm-actions">'
            + '<button class="btn btn-outline" value="cancel" autofocus></button>'
            + '<button class="btn btn-confirm" value="confirm"></button>'
            + '</div></form>';
        // Der Inhalt füllt den Dialog ganz aus: ein Klick direkt auf den Dialog ist einer auf den Hintergrund
        let pressedOutside = false;
        confirmBox.addEventListener('pointerdown', (e) => { pressedOutside = e.target === confirmBox; });
        confirmBox.addEventListener('click', (e) => {
            if (pressedOutside && e.target === confirmBox) confirmBox.close();
        });
        document.body.appendChild(confirmBox);
    }
    if (confirmBox.open) return Promise.resolve(false);

    confirmBox.querySelector('h2').textContent = title;
    confirmBox.querySelector('p').textContent = message;
    confirmBox.querySelector('p').hidden = !message;
    confirmBox.querySelector('[value="cancel"]').textContent = cancelLabel;
    confirmBox.querySelector('[value="confirm"]').textContent = confirmLabel;
    confirmBox.returnValue = '';
    confirmBox.showModal();
    return new Promise(resolve => {
        confirmBox.addEventListener('close', () => resolve(confirmBox.returnValue === 'confirm'), { once: true });
    });
};

// Admin: Sicherheitsabfrage vor dem Löschen (Texte stehen in data-confirm-title und data-confirm des Formulars)
document.querySelectorAll('form[data-confirm]').forEach(form => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        confirmDialog({ title: form.dataset.confirmTitle || 'Wirklich löschen?', message: form.dataset.confirm })
            .then(confirmed => { if (confirmed) form.submit(); });
    });
});

// Vorschau für neu ausgewählte Bilder direkt unter dem Dateifeld
// (Karussells sammeln ihre Bilder selbst, Bilder im Bearbeitungsmodus wechseln direkt an ihrer Stelle, s. u.)
document.addEventListener('change', (e) => {
    const input = e.target;
    if (input.type !== 'file' || input.dataset.collect || input.closest('[data-inline-image]')) return;

    let preview = input.nextElementSibling;
    if (!preview || !preview.classList.contains('file-preview')) {
        preview = document.createElement('div');
        preview.className = 'file-preview';
        input.after(preview);
    }
    preview.innerHTML = '';
    [...input.files].filter(file => file.type.startsWith('image/')).forEach(file => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = '';
        preview.appendChild(img);
    });
});

// Wiederholbare Einträge (Projekt-Abschnitte, Lebenslauf-Stationen): hinzufügen, verschieben, entfernen
document.querySelectorAll('[data-repeat-list]').forEach(list => {
    const name = list.dataset.repeatList;

    // Jeder Knopf kann eine eigene Vorlage nutzen (z. B. Abschnitt vom Typ Titel, Text, Bild, Karussell)
    document.querySelectorAll('[data-repeat-add="' + name + '"]').forEach(addButton => {
        const template = document.querySelector('template[data-repeat-template="' + (addButton.dataset.template || name) + '"]');
        if (!template) return;

        addButton.addEventListener('click', () => {
            // Eindeutiger Schlüssel für die Feldnamen des neuen Eintrags
            const key = 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            const wrapper = document.createElement('div');
            wrapper.innerHTML = template.innerHTML.replaceAll('__KEY__', key);
            const item = wrapper.querySelector('[data-repeat-item]');
            list.appendChild(item);
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            item.querySelector('input:not([type="hidden"]), textarea').focus({ preventScroll: true });
        });
    });

    list.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const item = button.closest('[data-repeat-item]');

        if (button.dataset.move === 'up' && item.previousElementSibling) {
            item.previousElementSibling.before(item);
        } else if (button.dataset.move === 'down' && item.nextElementSibling) {
            item.nextElementSibling.after(item);
        } else if ('remove' in button.dataset) {
            // Texte aus data-remove-title und data-remove-confirm der Liste
            confirmDialog({ title: list.dataset.removeTitle || 'Eintrag entfernen?', message: list.dataset.removeConfirm, confirmLabel: 'Entfernen' })
                .then(confirmed => {
                    if (!confirmed) return;
                    item.remove();
                    list.dispatchEvent(new Event('removed', { bubbles: true }));
                });
        }
    });
});

// Karussell-Bilder umsortieren: die Reihenfolge der Bilder im Formular ist die Reihenfolge im Karussell
document.addEventListener('click', (e) => {
    const button = e.target.closest('[data-image-move]');
    if (!button) return;
    const tile = button.closest('.image-keep');

    if (button.dataset.imageMove === 'left' && tile.previousElementSibling) {
        tile.previousElementSibling.before(tile);
    } else if (button.dataset.imageMove === 'right' && tile.nextElementSibling) {
        tile.nextElementSibling.after(tile);
    }
});

/* ---------- Projekt-Abschnitte: Spalten-Layout und Bausteine ---------- */

// Feldnamen der Bausteine an ihre aktuelle Spalte anpassen (nach Hinzufügen, Verschieben, Layout-Wechsel)
const syncSection = (section) => {
    const key = section.querySelector('input[name="sectionKeys"]').value;
    section.querySelectorAll('[data-col]').forEach((column, index) => {
        column.querySelectorAll('[data-block-ref]').forEach(ref => {
            ref.name = 'section_' + key + '_col' + index + '_blocks';
        });
    });
};

// Anzahl der Spalten des gewählten Layouts, z. B. '2-1' -> 2
const columnCount = (section) => {
    const checked = section.querySelector('[data-layout-input]:checked');
    return checked ? checked.value.split('-').length : 1;
};

// Layout wechseln: Spalten ein-/ausblenden; Bausteine aus ausgeblendeten Spalten wandern in die letzte sichtbare
document.addEventListener('change', (e) => {
    if (!e.target.matches('[data-layout-input]')) return;
    const section = e.target.closest('[data-repeat-item]');
    section.querySelector('[data-layout]').dataset.layout = e.target.value;

    const columns = [...section.querySelectorAll('[data-col]')];
    const count = columnCount(section);
    const lastVisible = columns[count - 1].querySelector('[data-col-blocks]');
    columns.slice(count).forEach(column => {
        column.querySelectorAll('[data-block]').forEach(block => lastVisible.appendChild(block));
    });
    syncSection(section);
});

// Baustein (Titel, Text, Bild, Karussell) in eine Spalte einsetzen
document.addEventListener('click', (e) => {
    const button = e.target.closest('[data-add-block]');
    if (!button) return;
    const template = document.querySelector('template[data-block-template="' + button.dataset.addBlock + '"]');
    if (!template) return;

    const key = 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = template.innerHTML.replaceAll('__BLOCK__', key);
    const block = wrapper.querySelector('[data-block]');
    button.closest('[data-col]').querySelector('[data-col-blocks]').appendChild(block);
    syncSection(button.closest('[data-repeat-item]'));

    const field = block.querySelector('input:not([type="hidden"]):not([type="file"]), textarea');
    if (field) field.focus();
});

// Name der Bausteine im Dialog, z. B. „Bild entfernen?“
const BLOCK_NAMES = { title: 'Zwischenüberschrift', text: 'Text', image: 'Bild', carousel: 'Karussell' };

// Baustein verschieben (hoch/runter in der Spalte, links/rechts in die Nachbarspalte) oder entfernen
document.addEventListener('click', (e) => {
    const button = e.target.closest('[data-block-move], [data-block-remove]');
    if (!button) return;
    const block = button.closest('[data-block]');
    const section = block.closest('[data-repeat-item]');

    if ('blockRemove' in button.dataset) {
        const type = block.querySelector('input[name$="_type"]').value;
        confirmDialog({
            title: (BLOCK_NAMES[type] || 'Baustein') + ' entfernen?',
            message: 'Der Baustein wird aus dem Abschnitt entfernt. Endgültig ist das erst nach dem Speichern.',
            confirmLabel: 'Entfernen'
        }).then(confirmed => {
            if (!confirmed) return;
            block.remove();
            section.dispatchEvent(new Event('removed', { bubbles: true }));
        });
        return;
    }

    const columns = [...section.querySelectorAll('[data-col]')].slice(0, columnCount(section));
    const index = columns.indexOf(block.closest('[data-col]'));
    const move = button.dataset.blockMove;
    if (move === 'up' && block.previousElementSibling) {
        block.previousElementSibling.before(block);
    } else if (move === 'down' && block.nextElementSibling) {
        block.nextElementSibling.after(block);
    } else if (move === 'left' && columns[index - 1]) {
        columns[index - 1].querySelector('[data-col-blocks]').appendChild(block);
    } else if (move === 'right' && columns[index + 1]) {
        columns[index + 1].querySelector('[data-col-blocks]').appendChild(block);
    }
    syncSection(section);
});

// Vor dem Absenden alle Feldnamen sicherheitshalber noch einmal abgleichen
document.querySelectorAll('form.admin-form').forEach(form => {
    form.addEventListener('submit', () => {
        form.querySelectorAll('[data-repeat-list="section"] [data-repeat-item]').forEach(syncSection);
    });
});

/* ---------- Bilder sammeln (Bild- und Karussell-Bausteine) ---------- */

// Pro Dateifeld die gesammelten Dateien; ein neuer Klick auf "hinzufügen" ersetzt sie nicht, sondern ergänzt sie
const collectedFiles = new WeakMap();

const applyFiles = (input, files) => {
    const transfer = new DataTransfer();
    files.forEach(file => transfer.items.add(file));
    input.files = transfer.files;
    collectedFiles.set(input, files);

    // Vorschau der neuen Bilder, jedes mit "x" zum Entfernen vor dem Speichern
    const list = input.closest('[data-uploader]').querySelector('[data-uploader-new]');
    list.innerHTML = '';
    files.forEach((file, index) => {
        const tile = document.createElement('div');
        tile.className = 'uploader-tile';
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = '';
        const badge = document.createElement('span');
        badge.textContent = 'neu';
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = '×';
        remove.title = file.name + ' nicht hochladen';
        remove.setAttribute('aria-label', file.name + ' nicht hochladen');
        remove.addEventListener('click', () => applyFiles(input, files.filter((_, i) => i !== index)));
        tile.append(img, badge, remove);
        list.appendChild(tile);
    });
};

document.addEventListener('change', (e) => {
    const input = e.target;
    if (input.type !== 'file' || !input.dataset.collect) return;
    const chosen = [...input.files];
    // Abbrechen im Dateidialog leert das Feld in manchen Browsern – dann bleibt die bisherige Auswahl
    if (chosen.length === 0) {
        applyFiles(input, collectedFiles.get(input) || []);
        return;
    }
    const files = input.dataset.collect === 'single' ? chosen.slice(-1) : [...(collectedFiles.get(input) || []), ...chosen];
    applyFiles(input, files);
});

/* ---------- Bearbeitungsmodus: Projekt direkt im Layout der Projektseite bearbeiten ---------- */

// Textfelder wachsen mit ihrem Inhalt, wie der Text auf der Seite
const autosize = (field) => {
    field.style.height = 'auto';
    field.style.height = field.scrollHeight + 'px';
};
const autosizeAll = () => document.querySelectorAll('textarea[data-autosize]').forEach(autosize);
autosizeAll();
document.fonts.ready.then(autosizeAll);
window.addEventListener('resize', autosizeAll);
document.addEventListener('input', (e) => {
    if (e.target.matches('textarea[data-autosize]')) autosize(e.target);
});

// Einzeilige Felder (Titel): Enter beginnt keine neue Zeile
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('[data-single-line]')) e.preventDefault();
});

// Der Titel steht auch im Seitenpfad und über dem Projekttext
const titleField = document.querySelector('.page-editor [name="title"]');
if (titleField) {
    titleField.addEventListener('input', () => {
        document.querySelectorAll('[data-mirror="title"]').forEach(element => {
            element.textContent = titleField.value.trim() || 'Neues Projekt';
        });
    });
}

// Gewählte Tools erscheinen sofort so wie auf der Seite
const selectedTools = document.querySelector('[data-tools-selected]');
if (selectedTools) {
    document.addEventListener('change', (e) => {
        if (e.target.name !== 'tools') return;
        const checked = [...document.querySelectorAll('.page-editor input[name="tools"]:checked')];
        selectedTools.replaceChildren(...checked.map(box => {
            const item = document.createElement('li');
            item.className = 'tool';
            item.append(box.closest('.tool-option').querySelector('.tool-icon').cloneNode(true), box.dataset.name);
            return item;
        }));
    });
}

// Bild direkt an seiner Stelle austauschen (Titelbild, zweites Bild, Bild-Baustein)
const chosenImages = new WeakMap();
document.addEventListener('change', (e) => {
    const input = e.target;
    const box = input.type === 'file' ? input.closest('[data-inline-image]') : null;
    if (!box) return;
    const file = input.files[0];
    if (!file) {
        // Abbrechen im Dateidialog leert das Feld in manchen Browsern – dann bleibt die bisherige Auswahl
        const previous = chosenImages.get(input);
        if (previous) {
            const transfer = new DataTransfer();
            transfer.items.add(previous);
            input.files = transfer.files;
        }
        return;
    }
    chosenImages.set(input, file);
    box.querySelector('img').src = URL.createObjectURL(file);
    box.classList.remove('is-empty', 'is-fallback', 'is-missing');
    box.querySelector('.inline-image-btn span').textContent = 'Bild ändern';
});

// Zweites Bild entfernen: auf der Seite steht dann wieder das Titelbild
document.addEventListener('change', (e) => {
    if (e.target.name === 'removeSecond') {
        e.target.closest('[data-inline-image]').classList.toggle('is-removed', e.target.checked);
    }
});

// Ausrichtung eines Abschnitts sofort im Raster zeigen
document.addEventListener('change', (e) => {
    if (e.target.matches('[data-valign-input]')) {
        const section = e.target.closest('[data-repeat-item]').querySelector('.psection');
        section.classList.toggle('psection--center', e.target.value === 'center');
    }
});

// Speichern: ein neues Projekt braucht ein Titelbild (das Dateifeld steckt unsichtbar im Bild);
// wer die Seite mit ungespeicherten Änderungen verlässt, wird gefragt
document.querySelectorAll('form.page-editor').forEach(form => {
    let changed = false;
    form.addEventListener('input', () => { changed = true; });
    form.addEventListener('change', () => { changed = true; });
    form.addEventListener('click', (e) => {
        if (e.target.closest('[data-add-block], [data-block-move], [data-repeat-add], [data-move], [data-image-move]')) {
            changed = true;
        }
    });
    // Entfernen zählt erst, wenn es im Dialog bestätigt wurde
    form.addEventListener('removed', () => { changed = true; });

    form.addEventListener('submit', (e) => {
        const cover = form.querySelector('[data-required-image]');
        if (cover && cover.classList.contains('is-empty')) {
            e.preventDefault();
            cover.classList.add('is-missing');
            cover.scrollIntoView({ block: 'center', behavior: 'smooth' });
            return;
        }
        changed = false;
    });

    // Links (Alle Projekte, Abbrechen, Ansehen, …) fragen im eigenen Dialog nach.
    // Schließen oder Neuladen des Tabs kann nur der Browser selbst abfragen (beforeunload)
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!changed || !link || e.defaultPrevented || link.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        confirmDialog({
            title: 'Änderungen verwerfen?',
            message: 'Du hast ungespeicherte Änderungen an diesem Projekt. Wenn du die Seite jetzt verlässt, gehen sie verloren.',
            confirmLabel: 'Verwerfen',
            cancelLabel: 'Weiter bearbeiten'
        }).then(confirmed => {
            if (!confirmed) return;
            changed = false;
            location.href = link.href;
        });
    });

    window.addEventListener('beforeunload', (e) => {
        if (changed) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
});
