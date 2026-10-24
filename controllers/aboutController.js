let store = require('../models/store');
let { removeUnusedUploads } = require('../utils/uploads');

/*
 * "Über mich" in models/about.json:
 *   photo, photoCaption – das kleine Polaroid-Foto
 *   fileName, code      – das Code-Fenster, das Zeile für Zeile getippt wird
 * Der Lebenslauf steht weiter in models/lifeline.json.
 */
const DEFAULTS = { photo: null, photoCaption: '', fileName: 'about-me.js', code: '' };

const getAboutData = () => {
    return { status: 200, data: { ...DEFAULTS, ...store.read('about') } };
}

/**
 * Speichert "Über mich" samt Lebenslauf.
 * @param {Object} input - photo (neu hochgeladen), removePhoto, photoCaption, fileName, code,
 *                         entries: [{ time, title, description }] in der gewünschten Reihenfolge
 * @returns {Object} - { status, data }
 */
const updateAbout = (input) => {
    const current = getAboutData().data;

    // Leere Stationen fallen weg, jede andere braucht einen Titel
    const entries = (input.entries || [])
        .map(entry => ({
            title: String(entry.title || '').trim(),
            time: String(entry.time || '').trim(),
            description: String(entry.description || '').trim()
        }))
        .filter(entry => entry.title || entry.time || entry.description);
    if (entries.some(entry => !entry.title)) {
        return { status: 400, data: 'Jede Station im Lebenslauf braucht einen Titel.' };
    }

    const about = {
        photo: input.photo || (input.removePhoto ? null : current.photo),
        photoCaption: String(input.photoCaption || '').trim(),
        fileName: String(input.fileName || '').trim() || DEFAULTS.fileName,
        // Zeilenumbrüche vereinheitlichen; Einrückungen am Zeilenanfang bleiben erhalten
        code: String(input.code || '').replace(/\r\n/g, '\n').replace(/\s+$/, '')
    };
    const lifeline = entries.map((entry, index) => ({ id: index + 1, ...entry }));

    store.write('about', about);
    store.write('lifeline', lifeline);
    removeUnusedUploads([current.photo]);
    return { status: 200, data: { about, lifeline } };
}

module.exports = {
    getAboutData,
    updateAbout
}
