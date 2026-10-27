var express = require('express');
var router = express.Router();
var createError = require('http-errors');

let categorieController = require('../../controllers/categorieController');
let { sameOrigin } = require('../../middleware/admin');
let { imageUpload, handleUpload, publicPath, discardUploads } = require('../../utils/uploads');

const upload = handleUpload(imageUpload.single('image'), { maxSize: '20 MB', optimize: true });

// Formulardaten für den Controller (neues Kachelbild, falls hochgeladen)
const readForm = (req) => ({
  ...req.body,
  image: req.file ? publicPath(req.file) : null
});

const renderForm = (res, options) => {
  res.render('admin/category-form', {
    title: options.isNew ? 'Neue Kategorie' : 'Kategorie bearbeiten',
    error: null,
    ...options
  });
};

/* Neue Kategorie */
router.route('/neu')
.get((req,res,next)=> {
  renderForm(res, { isNew: true, categorie: { images: [] } });
})

router.route('/')
.post(sameOrigin, upload, (req,res,next)=> {
  const result = req.uploadError
    ? { status: 400, data: req.uploadError }
    : categorieController.createCategorie(readForm(req));

  if (result.status !== 201) {
    discardUploads(req);
    return renderForm(res.status(result.status), { isNew: true, categorie: { ...req.body, images: [] }, error: result.data });
  }
  res.redirect('/admin?hinweis=kategorie-gespeichert#kategorien');
})

/* Kategorie bearbeiten */
router.route('/:id/bearbeiten')
.get((req,res,next)=> {
  const response = categorieController.getCategorieById(req.params.id);
  if (response.status === 404) {
    return next(createError(404));
  }
  renderForm(res, { isNew: false, categorie: response.data });
})

router.route('/:id')
.post(sameOrigin, upload, (req,res,next)=> {
  const current = categorieController.getCategorieById(req.params.id);
  if (current.status === 404) {
    discardUploads(req);
    return next(createError(404));
  }

  const result = req.uploadError
    ? { status: 400, data: req.uploadError }
    : categorieController.updateCategorie(req.params.id, readForm(req));

  if (result.status !== 200) {
    discardUploads(req);
    return renderForm(res.status(result.status), { isNew: false, categorie: { ...current.data, ...req.body, featured: req.body.featured === '1' }, error: result.data });
  }
  res.redirect('/admin?hinweis=kategorie-gespeichert#kategorien');
})

/* Kategorie löschen (nur ohne Projekte) */
router.route('/:id/loeschen')
.post(sameOrigin, (req,res,next)=> {
  const result = categorieController.deleteCategorie(req.params.id);
  if (result.status === 404) {
    return next(createError(404));
  }
  if (result.status === 409) {
    return res.redirect('/admin?hinweis=kategorie-nicht-leer#kategorien');
  }
  res.redirect('/admin?hinweis=kategorie-geloescht#kategorien');
})

module.exports = router;
