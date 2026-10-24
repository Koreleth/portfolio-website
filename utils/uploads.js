var fs = require('fs');
var path = require('path');
var multer = require('multer');
let store = require('../models/store');
let { slugify } = require('./slugify');

// Zum Verkleinern großer Fotos; fehlt das Paket, werden Bilder unverändert gespeichert
let sharp = null;
try {
    sharp = require('sharp');
    // Kein Datei-Cache: die Datei wird direkt danach überschrieben (unter Windows sonst gesperrt)
    sharp.cache(false);
} catch (err) {
    console.warn('sharp ist nicht installiert – hochgeladene Bilder werden nicht verkleinert.');
}

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const UPLOAD_DIR = path.join(PUBLIC_DIR, 'img', 'uploads');

// Längste Bildkante nach dem Verkleinern; reicht für große Bildschirme und hält die Seite schnell
const MAX_EDGE = 2400;

const RASTER = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
const ICON = { '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };

/**
 * Baut einen Upload für Bilder; Dateien mit falschem Format werden übersprungen und gemerkt.
 * @param {Object} types - erlaubte Endungen mit MIME-Typ
 * @param {string} folder - Unterordner von public/img/uploads
 * @param {number} maxSize - maximale Dateigröße in Byte
 */
const createUpload = (types, folder, maxSize) => multer({
    storage: multer.diskStorage({
        destination: path.join(UPLOAD_DIR, folder),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 6) + '-' + (slugify(path.basename(file.originalname, ext)) || 'bild') + ext);
        }
    }),
    limits: { fileSize: maxSize, files: 40 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (types[ext] && types[ext] === file.mimetype) {
            return cb(null, true);
        }
        req.rejectedFiles = (req.rejectedFiles || []).concat(file.originalname);
        cb(null, false);
    }
});

// Fotos bis 20 MB (werden danach verkleinert), Icons bis 1 MB
const imageUpload = createUpload(RASTER, '', 20 * 1024 * 1024);
const iconUpload = createUpload(ICON, 'icons', 1024 * 1024);

/**
 * Verkleinert ein großes Foto auf höchstens MAX_EDGE Pixel und komprimiert es im selben Format.
 * Die Drehung aus der Kamera wird übernommen, Metadaten (z. B. GPS) fallen weg.
 * Kleine Bilder und GIFs (Animationen) bleiben unverändert.
 */
const optimizeImage = async (file) => {
    const ext = path.extname(file.path).toLowerCase();
    if (!sharp || ext === '.gif') return;

    const meta = await sharp(file.path).metadata();
    const isLarge = meta.width > MAX_EDGE || meta.height > MAX_EDGE || file.size > 1.5 * 1024 * 1024;
    if (!isLarge) return;

    let image = sharp(file.path).rotate().resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true });
    if (ext === '.png') {
        image = image.png({ compressionLevel: 9 });
    } else if (ext === '.webp') {
        image = image.webp({ quality: 85 });
    } else {
        image = image.jpeg({ quality: 85, mozjpeg: true });
    }
    const buffer = await image.toBuffer();
    fs.writeFileSync(file.path, buffer);
    file.size = buffer.length;
};

/**
 * Middleware: Upload-Fehler landen in req.uploadError statt als Serverfehler,
 * die Dateien liegen danach gruppiert nach Feldname in req.filesByField.
 * @param {Function} middleware - multer-Middleware
 * @param {Object} options - maxSize (Text für die Fehlermeldung), optimize (große Fotos verkleinern)
 */
const handleUpload = (middleware, options = {}) => (req, res, next) => {
    middleware(req, res, async (err) => {
        if (err) {
            req.uploadError = err.code === 'LIMIT_FILE_SIZE'
                ? 'Eine Datei ist größer als ' + (options.maxSize || 'erlaubt') + '.'
                : 'Der Upload hat nicht geklappt: ' + err.message;
        } else if (req.rejectedFiles) {
            req.uploadError = 'Dieses Dateiformat ist hier nicht erlaubt: ' + req.rejectedFiles.join(', ');
        }

        const files = [].concat(req.files || [], req.file || []);
        req.filesByField = {};
        files.forEach(file => {
            (req.filesByField[file.fieldname] = req.filesByField[file.fieldname] || []).push(file);
        });

        // Nacheinander, damit mehrere große Fotos nicht gleichzeitig im Speicher liegen
        if (!req.uploadError && options.optimize) {
            try {
                for (const file of files) {
                    await optimizeImage(file);
                }
            } catch (error) {
                req.uploadError = 'Ein Bild konnte nicht verarbeitet werden – ist die Datei beschädigt?';
            }
        }
        next();
    });
};

// Öffentlicher Pfad einer hochgeladenen Datei, z. B. /img/uploads/123-bild.png
const publicPath = (file) => '/' + path.relative(PUBLIC_DIR, file.path).split(path.sep).join('/');

// Hochgeladene Dateien wieder entfernen, wenn nicht gespeichert wird
const discardUploads = (req) => {
    [].concat(req.files || [], req.file || []).forEach(file => fs.unlink(file.path, () => {}));
};

// Nur eigene Bildpfade unter /img zulassen (z. B. aus versteckten Formularfeldern)
const isImagePath = (value) => typeof value === 'string'
    && /^\/img\/[\w\-. /]+$/.test(value)
    && !value.includes('..');

/**
 * Sammelt alle Bildpfade aus Projekt-Abschnitten – egal in welchem Format:
 * Abschnitte mit Spalten ({ columns: [[baustein, …], …] }), einzelne Bausteine
 * oder ältere Abschnitte ({ images: [...] }).
 * @param {*} value - Abschnitte, Spalten oder Bausteine
 * @param {Set} paths - wird mit den gefundenen Pfaden gefüllt
 * @returns {Set}
 */
const collectImages = (value, paths = new Set()) => {
    if (Array.isArray(value)) {
        value.forEach(item => collectImages(item, paths));
    } else if (value && typeof value === 'object') {
        (value.images || []).forEach(image => typeof image === 'string' && paths.add(image));
        if (value.columns) {
            collectImages(value.columns, paths);
        }
    }
    return paths;
};

// Alle Bildpfade, die irgendwo in den Daten verwendet werden
const usedPaths = () => {
    const paths = new Set();
    store.read('portfoliowork').forEach(portfolio => {
        (portfolio.images || []).forEach(image => paths.add(image));
        collectImages(portfolio.sections || [], paths);
    });
    store.read('categorie').forEach(categorie => (categorie.images || []).forEach(image => paths.add(image)));
    store.read('tools').forEach(tool => tool.icon && paths.add(tool.icon));
    const about = store.read('about');
    if (about.photo) {
        paths.add(about.photo);
    }
    return paths;
};

/**
 * Löscht hochgeladene Dateien, die nach einer Änderung nirgends mehr verwendet werden.
 * Dateien außerhalb von public/img/uploads werden nie angefasst.
 * @param {Array} candidates - Bildpfade, die eventuell nicht mehr gebraucht werden
 */
const removeUnusedUploads = (candidates) => {
    const used = usedPaths();
    candidates
        .filter(image => isImagePath(image) && image.startsWith('/img/uploads/') && !used.has(image))
        .forEach(image => {
            const file = path.join(PUBLIC_DIR, image);
            if (file.startsWith(UPLOAD_DIR + path.sep)) {
                fs.unlink(file, () => {});
            }
        });
};

// Alle Icon-Dateien unter public/img (für die Auswahl beim Tool)
const listIconFiles = () => {
    const result = [];
    const walk = (dir) => {
        fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            } else if (/\.svg$/i.test(entry.name) || (full.startsWith(path.join(UPLOAD_DIR, 'icons')) && ICON[path.extname(entry.name).toLowerCase()])) {
                result.push('/' + path.relative(PUBLIC_DIR, full).split(path.sep).join('/'));
            }
        });
    };
    walk(path.join(PUBLIC_DIR, 'img'));
    return result.sort((a, b) => a.localeCompare(b, 'de'));
};

module.exports = {
    imageUpload,
    iconUpload,
    handleUpload,
    publicPath,
    discardUploads,
    isImagePath,
    collectImages,
    removeUnusedUploads,
    listIconFiles
}
