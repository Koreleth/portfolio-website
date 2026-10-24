var express = require('express');
var router = express.Router();
var createError = require('http-errors');

let toolController = require('../../controllers/toolController');
let { sameOrigin } = require('../../middleware/admin');
let { iconUpload, handleUpload, publicPath, discardUploads, listIconFiles } = require('../../utils/uploads');

// Neues Icon: SVG, PNG oder WebP, höchstens 1 MB
const upload = handleUpload(iconUpload.single('iconFile'), { maxSize: '1 MB' });

// Formulardaten für den Controller (ein hochgeladenes Icon hat Vorrang vor der Auswahl)
const readForm = (req) => ({
  ...req.body,
  iconUpload: req.file ? publicPath(req.file) : null
});

const renderForm = (res, options) => {
  res.render('admin/tool-form', {
    title: options.isNew ? 'Neues Tool' : 'Tool bearbeiten',
    iconFiles: listIconFiles(),
    error: null,
    ...options
  });
};

/* Neues Tool */
router.route('/neu')
.get((req,res,next)=> {
  renderForm(res, { isNew: true, tool: { icon: null } });
})

router.route('/')
.post(sameOrigin, upload, (req,res,next)=> {
  const result = req.uploadError
    ? { status: 400, data: req.uploadError }
    : toolController.createTool(readForm(req));

  if (result.status !== 201) {
    discardUploads(req);
    return renderForm(res.status(result.status), { isNew: true, tool: { name: req.body.name, icon: req.body.icon || null }, error: result.data });
  }
  res.redirect('/admin?hinweis=tool-gespeichert#tools');
})

/* Tool bearbeiten */
router.route('/:id/bearbeiten')
.get((req,res,next)=> {
  const response = toolController.getToolById(req.params.id);
  if (response.status === 404) {
    return next(createError(404));
  }
  renderForm(res, { isNew: false, tool: response.data });
})

router.route('/:id')
.post(sameOrigin, upload, (req,res,next)=> {
  const current = toolController.getToolById(req.params.id);
  if (current.status === 404) {
    discardUploads(req);
    return next(createError(404));
  }

  const result = req.uploadError
    ? { status: 400, data: req.uploadError }
    : toolController.updateTool(req.params.id, readForm(req));

  if (result.status !== 200) {
    discardUploads(req);
    return renderForm(res.status(result.status), { isNew: false, tool: { ...current.data, name: req.body.name, icon: req.body.icon || null }, error: result.data });
  }
  res.redirect('/admin?hinweis=tool-gespeichert#tools');
})

/* Tool löschen (wird auch aus allen Projekten entfernt) */
router.route('/:id/loeschen')
.post(sameOrigin, (req,res,next)=> {
  const result = toolController.deleteTool(req.params.id);
  if (result.status === 404) {
    return next(createError(404));
  }
  res.redirect('/admin?hinweis=tool-geloescht#tools');
})

module.exports = router;
