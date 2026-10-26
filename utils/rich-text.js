/*
 * Zerlegt mehrzeiligen Text aus dem Admin-Bereich für views/parts/rich-text.ejs:
 * - eine Leerzeile beginnt einen neuen Absatz, einfache Zeilenumbrüche bleiben erhalten
 * - Zeilen mit „- “, „* “, „• “, „o “ … am Anfang werden zu einer Aufzählung, „1. “ oder „1) “ zu einer
 *   nummerierten Liste; weiter eingerückte Punkte stehen als Unterpunkte darunter
 * - Adressen mit http:// oder https:// werden zu Links
 * Das Ergebnis enthält nur Text, maskiert wird beim Ausgeben im Template.
 */

// Listenpunkt: Einrückung, dann ein Zeichen (oder eine Zahl mit Punkt/Klammer), Leerzeichen und der Text
const ITEM = /^( *)(?:[-–—*•·◦▪o]|(\d{1,3})[.)])\s+(\S.*)$/;
const ADDRESS = /https?:\/\/[^\s<>"]+/g;

const count = (text, char) => text.split(char).length - 1;

// Satzzeichen am Ende gehören nicht zur Adresse, eine Klammer nur, wenn sie in der Adresse auch geöffnet wurde
// (z. B. „(siehe https://example.com).“)
const trimAddress = (address) => {
    const trimmed = address.replace(/[.,;:!?]+$/, '');
    if (trimmed.endsWith(')') && count(trimmed, ')') > count(trimmed, '(')) {
        return trimAddress(trimmed.slice(0, -1));
    }
    return trimmed;
};

// Eine Zeile in Stücke zerlegen: { text } oder { text, href } für einen Link
const linkify = (line) => {
    const parts = [];
    let last = 0;
    for (const match of line.matchAll(ADDRESS)) {
        const href = trimAddress(match[0]);
        if (match.index > last) parts.push({ text: line.slice(last, match.index) });
        parts.push({ text: href, href });
        last = match.index + href.length;
    }
    if (last < line.length) parts.push({ text: line.slice(last) });
    return parts;
};

/**
 * @param {string} text
 * @returns {Array} - { type: 'p', lines } oder { type: 'list', ordered, start, items: [{ lines, children: [Liste, …] }] };
 *                    jede Zeile ist eine Liste von Stücken aus linkify
 */
const parse = (text) => {
    const nodes = [];
    String(text || '').replace(/\r\n?/g, '\n').split(/\n[ \t]*\n/).forEach(block => {
        let paragraph = null;
        // Offene Listen von außen nach innen, jeweils mit der Einrückung ihrer Punkte
        let open = [];

        block.split('\n').forEach(raw => {
            const line = raw.replace(/\t/g, '    ').trimEnd();
            if (!line.trim()) return;
            const indent = line.length - line.trimStart().length;
            const item = ITEM.exec(line);

            if (!item) {
                const current = open[open.length - 1];
                if (current && indent > current.indent) {
                    // Weiter eingerückte Zeile ohne Zeichen: gehört noch zum Punkt darüber
                    current.list.items[current.list.items.length - 1].lines.push(linkify(line.trim()));
                    return;
                }
                open = [];
                if (!paragraph) {
                    paragraph = { type: 'p', lines: [] };
                    nodes.push(paragraph);
                }
                paragraph.lines.push(linkify(line.trim()));
                return;
            }

            paragraph = null;
            const ordered = item[2] !== undefined;
            // Listen schließen, die weiter eingerückt sind als dieser Punkt
            while (open.length > 0 && indent < open[open.length - 1].indent) open.pop();
            let current = open[open.length - 1];
            // Gleiche Ebene, aber Zahlen statt Zeichen (oder umgekehrt): eine neue Liste daneben
            if (current && indent === current.indent && current.list.ordered !== ordered) {
                open.pop();
                current = open[open.length - 1];
            }
            if (!current || indent > current.indent) {
                // Neue Liste: ganz außen oder als Unterpunkte im letzten Punkt der Liste darüber
                const list = { type: 'list', ordered, start: ordered ? Number(item[2]) : 1, items: [] };
                if (current) {
                    current.list.items[current.list.items.length - 1].children.push(list);
                } else {
                    nodes.push(list);
                }
                current = { list, indent };
                open.push(current);
            }
            current.list.items.push({ lines: [linkify(item[3])], children: [] });
        });
    });
    return nodes;
};

module.exports = {
    parse
}
