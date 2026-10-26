let hljs = require('highlight.js/lib/common');

// Ohne Dateiendung rät highlight.js nur zwischen gängigen Sprachen (bei allen liegt es bei kurzem Code oft daneben)
const GUESS_LANGUAGES = ['javascript', 'typescript', 'xml', 'css', 'scss', 'csharp', 'java', 'python', 'cpp', 'c',
    'php', 'sql', 'json', 'bash', 'kotlin', 'swift', 'go', 'rust', 'ruby', 'lua', 'yaml'];

/**
 * Codesample für die Projektseite farbig hervorheben – nur zur Anzeige, der Code wird nie ausgeführt.
 * Die Endung des Dateinamens bestimmt die Sprache (z. B. karte.js, Player.cs, main.py),
 * ohne bekannte Endung wird geraten. html ist fertig maskiert und darf direkt ausgegeben werden.
 * @param {string} code - der Code
 * @param {string} fileName - optional, z. B. 'karte.js'
 * @returns {{ html: string, lines: number }}
 */
const highlight = (code, fileName) => {
    const text = String(code || '');
    const extension = (/\.([a-z0-9]+)$/i.exec(String(fileName || '')) || [])[1];
    const result = extension && hljs.getLanguage(extension)
        ? hljs.highlight(text, { language: extension.toLowerCase(), ignoreIllegals: true })
        : hljs.highlightAuto(text, GUESS_LANGUAGES);
    return {
        html: result.value,
        lines: text.split('\n').length
    };
};

module.exports = {
    highlight
}
