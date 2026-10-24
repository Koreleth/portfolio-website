/**
 * Macht aus einem Titel einen URL-Namen, z. B. "Café Eisberg" -> "cafe-eisberg".
 * @param {string} text
 * @returns {string}
 */
const slugify = (text) => String(text || '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Hängt -2, -3 … an, bis der URL-Name noch nicht vergeben ist.
 * @param {string} base - gewünschter URL-Name
 * @param {Function} isTaken - (kandidat) => true, wenn schon vergeben
 * @returns {string}
 */
const uniqueSlug = (base, isTaken) => {
    let slug = base;
    for (let n = 2; isTaken(slug); n++) {
        slug = base + '-' + n;
    }
    return slug;
};

module.exports = {
    slugify,
    uniqueSlug
}
