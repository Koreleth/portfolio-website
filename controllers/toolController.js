let store = require('../models/store');
let { slugify, uniqueSlug } = require('../utils/slugify');
let { isImagePath, removeUnusedUploads } = require('../utils/uploads');

// Alle Tools (Programme) mit Name und Icon
const getToolData = () => {
    return { status: 200, data: store.read('tools') };
}

/* ---------- Admin: Tools verwalten ---------- */

// Alle Tools mit der Anzahl der Projekte, die sie verwenden
const getToolsForAdmin = () => {
    const portfolios = store.read('portfoliowork');
    const tools = store.read('tools').map(tool => ({
        ...tool,
        usageCount: portfolios.filter(portfolio => (portfolio.tools || []).includes(tool.id)).length
    }));
    return { status: 200, data: tools };
}

const getToolById = (id) => {
    const tool = store.read('tools').find(element => element.id === id);
    if (!tool) {
        return { status: 404, data: "Tool not found" };
    }
    return { status: 200, data: tool };
}

/**
 * Prüft die Formulardaten eines Tools.
 * @param {Object} input - name, icon (gewählte Datei), iconUpload (neu hochgeladen)
 * @returns {Object} - { values } oder { error }
 */
const validateTool = (input) => {
    const name = String(input.name || '').trim();
    // Ein neu hochgeladenes Icon hat Vorrang vor der Auswahl; leer = kein Icon (Kürzel)
    const icon = input.iconUpload || (isImagePath(input.icon) ? input.icon : null);

    if (!name) return { error: 'Bitte gib einen Namen ein.' };
    return { values: { name, icon } };
}

const createTool = (input) => {
    const tools = store.read('tools');
    const result = validateTool(input);
    if (result.error) {
        return { status: 400, data: result.error };
    }

    const baseId = slugify(result.values.name);
    if (!baseId) {
        return { status: 400, data: 'Der Name braucht mindestens einen Buchstaben oder eine Zahl.' };
    }

    // Die ID bleibt danach fest, damit die Projekte das Tool weiter finden
    const tool = { id: uniqueSlug(baseId, candidate => tools.some(element => element.id === candidate)), ...result.values };
    tools.push(tool);
    store.write('tools', tools);
    return { status: 201, data: tool };
}

const updateTool = (id, input) => {
    const tools = store.read('tools');
    const index = tools.findIndex(element => element.id === id);
    if (index === -1) {
        return { status: 404, data: "Tool not found" };
    }

    const result = validateTool(input);
    if (result.error) {
        return { status: 400, data: result.error };
    }

    const previous = tools[index];
    tools[index] = { ...previous, ...result.values };
    store.write('tools', tools);
    removeUnusedUploads([previous.icon]);
    return { status: 200, data: tools[index] };
}

// Löschen entfernt das Tool auch aus allen Projekten
const deleteTool = (id) => {
    const tools = store.read('tools');
    const tool = tools.find(element => element.id === id);
    if (!tool) {
        return { status: 404, data: "Tool not found" };
    }

    store.write('tools', tools.filter(element => element !== tool));
    const portfolios = store.read('portfoliowork');
    if (portfolios.some(portfolio => (portfolio.tools || []).includes(id))) {
        store.write('portfoliowork', portfolios.map(portfolio => ({
            ...portfolio,
            tools: (portfolio.tools || []).filter(toolId => toolId !== id)
        })));
    }
    removeUnusedUploads([tool.icon]);
    return { status: 200, data: tool };
}

module.exports = {
    getToolData,
    getToolsForAdmin,
    getToolById,
    createTool,
    updateTool,
    deleteTool
}
