var express = require('express');
var router = express.Router();
var createError = require('http-errors');

let portfolioController = require('../../controllers/portfolioController');
let categorieController = require('../../controllers/categorieController');
let toolController = require('../../controllers/toolController');
let { sameOrigin } = require('../../middleware/admin');
let { imageUpload, handleUpload, publicPath, discardUploads, isImagePath } = require('../../utils/uploads');

// Beliebig viele Bilder: Titelbild (cover), zweites Bild (second) und die Bilder der Abschnitte
const upload = handleUpload(imageUpload.any(), { maxSize: '20 MB', optimize: true });

const isKey = (key) => /^[a-z0-9]{1,20}$/.test(key);

/**
 * Einen Baustein aus den Formularfeldern lesen: block_<key>_type, _text, _caption,
 * _file (Dateiname beim Codesample), _images (behaltene Bilder, in Reihenfolge) und _files (neue Bilder).
 */
const readBlock = (body, filesByField, key) => {
  const field = (name) => body['block_' + key + '_' + name];
  const type = field('type');
  const kept = [].concat(field('images') || []).filter(isImagePath);
  const uploaded = (filesByField['block_' + key + '_files'] || []).map(publicPath);
  return {
    type,
    text: field('text'),
    file: field('file'),
    caption: field('caption'),
    // Bild: ein neues ersetzt das bisherige; Karussell: neue Bilder kommen hinten dazu
    images: type === 'image' ? (uploaded.length > 0 ? uploaded : kept).slice(0, 1) : [...kept, ...uploaded]
  };
};

/**
 * Abschnitte aus den Formularfeldern lesen. Pro Abschnitt: sectionKeys (Reihenfolge),
 * section_<key>_layout, _valign, _divider (Trennstrich darüber) und je Spalte
 * section_<key>_col<n>_blocks (Bausteine in Reihenfolge).
 */
const readSections = (body, filesByField) => [].concat(body.sectionKeys || [])
  .filter(isKey)
  .map(key => {
    const layout = portfolioController.toLayout(body['section_' + key + '_layout']);
    const columnCount = portfolioController.LAYOUTS[layout];
    return {
      layout,
      valign: body['section_' + key + '_valign'],
      divider: body['section_' + key + '_divider'] === '1',
      columns: Array.from({ length: columnCount }, (_, index) =>
        [].concat(body['section_' + key + '_col' + index + '_blocks'] || [])
          .filter(isKey)
          .map(blockKey => readBlock(body, filesByField, blockKey)))
    };
  });

// Formulardaten für den Controller
const readForm = (req) => {
  const file = (field) => (req.filesByField[field] || [])[0];
  return {
    ...req.body,
    cover: file('cover') ? publicPath(file('cover')) : null,
    second: file('second') ? publicPath(file('second')) : null,
    removeSecond: req.body.removeSecond === '1',
    sections: readSections(req.body, req.filesByField)
  };
};

// Bei einem Fehler: Eingaben wieder anzeigen (ohne die gerade verworfenen Uploads)
const formProject = (req, current) => ({
  ...current,
  title: req.body.title,
  slug: req.body.slug,
  categoryID: parseInt(req.body.categoryID),
  description: req.body.description,
  textTitle: req.body.textTitle,
  text: req.body.text,
  contributors: req.body.contributors,
  contributorsText: req.body.contributorsText,
  tools: [].concat(req.body.tools || []),
  sections: readSections(req.body, {})
});

// Nach dem Speichern (neu oder bearbeitet) auf der Projektseite landen; dort erscheint kurz „Projekt gespeichert“
const savedProjectUrl = (portfolio) => {
  const categorie = categorieController.getCategorieData().data
    .find(element => parseInt(element.id) === portfolio.categoryID);
  return categorie
    ? '/portfolio/' + categorie.slug + '/' + portfolio.slug + '?gespeichert'
    : '/admin?hinweis=projekt-gespeichert#projekte';
};

const renderForm = (res, options) => {
  res.render('admin/project-form', {
    title: options.isNew ? 'Neues Projekt' : 'Projekt bearbeiten',
    categories: categorieController.getCategorieData().data,
    tools: toolController.getToolData().data,
    error: null,
    ...options
  });
};

/* Neues Projekt */
router.route('/neu')
.get((req,res,next)=> {
  renderForm(res, { isNew: true, project: { tools: [], sections: [] } });
})

router.route('/')
.post(sameOrigin, upload, (req,res,next)=> {
  const result = req.uploadError
    ? { status: 400, data: req.uploadError }
    : portfolioController.createPortfolio(readForm(req));

  if (result.status !== 201) {
    discardUploads(req);
    return renderForm(res.status(result.status), { isNew: true, project: formProject(req, { images: [] }), error: result.data });
  }
  res.redirect(savedProjectUrl(result.data));
})

/* Projekt bearbeiten */
router.route('/:id/bearbeiten')
.get((req,res,next)=> {
  const response = portfolioController.getPortfolioById(req.params.id);
  if (response.status === 404) {
    return next(createError(404));
  }
  renderForm(res, { isNew: false, project: response.data });
})

router.route('/:id')
.post(sameOrigin, upload, (req,res,next)=> {
  const current = portfolioController.getPortfolioById(req.params.id);
  if (current.status === 404) {
    discardUploads(req);
    return next(createError(404));
  }

  const result = req.uploadError
    ? { status: 400, data: req.uploadError }
    : portfolioController.updatePortfolio(req.params.id, readForm(req));

  if (result.status !== 200) {
    discardUploads(req);
    return renderForm(res.status(result.status), { isNew: false, project: formProject(req, current.data), error: result.data });
  }
  res.redirect(savedProjectUrl(result.data));
})

/* Projekt löschen */
router.route('/:id/loeschen')
.post(sameOrigin, (req,res,next)=> {
  const result = portfolioController.deletePortfolio(req.params.id);
  if (result.status === 404) {
    return next(createError(404));
  }
  res.redirect('/admin?hinweis=projekt-geloescht#projekte');
})

module.exports = router;
