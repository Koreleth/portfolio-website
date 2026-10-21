var fs = require('fs');
var path = require('path');

/**
 * Liest und schreibt die JSON-Dateien in diesem Ordner – die "Datenbank" der Seite.
 * Jeder Aufruf liest frisch von der Platte, damit Änderungen (z. B. aus dem
 * späteren Admin-Bereich) ohne Neustart sichtbar sind.
 */
const filePath = (name) => path.join(__dirname, name + '.json');

/**
 * @param {string} name - Dateiname ohne Endung, z. B. 'portfoliowork'.
 * @returns {Array} - Der Inhalt der Datei (leere Liste, wenn die Datei leer ist).
 */
const read = (name) => {
    const data = fs.readFileSync(filePath(name), 'utf8');
    return data.length > 0 ? JSON.parse(data) : [];
};

/**
 * @param {string} name - Dateiname ohne Endung, z. B. 'portfoliowork'.
 * @param {Array} data - Der neue Inhalt der Datei.
 */
const write = (name, data) => {
    fs.writeFileSync(filePath(name), JSON.stringify(data, null, 4) + '\n', 'utf8');
};

module.exports = {
    read,
    write
}
