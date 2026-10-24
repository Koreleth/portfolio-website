var express = require('express');
var router = express.Router();

let aboutController = require('../../controllers/aboutController');
let personaldataController = require('../../controllers/personaldataController');
let { sameOrigin } = require('../../middleware/admin');
let { imageUpload, handleUpload, publicPath, discardUploads } = require('../../utils/uploads');

const upload = handleUpload(imageUpload.single('photo'), { maxSize: '20 MB', optimize: true });

/**
 * Lebenslauf-Stationen aus den Formularfeldern lesen. Pro Station gibt es einen Schlüssel
 * (cvKeys, in Reihenfolge) und die Felder cv_<key>_time, _title und _description.
 */
const readEntries = (body) => [].concat(body.cvKeys || [])
  .filter(key => /^[a-z0-9]{1,20}$/.test(key))
  .map(key => ({
    time: body['cv_' + key + '_time'],
    title: body['cv_' + key + '_title'],
    description: body['cv_' + key + '_description']
  }));

const renderForm = (res, options) => {
  res.render('admin/about-form', {
    title: 'Über mich bearbeiten',
    error: null,
    ...options
  });
};

/* GET /admin/ueber-mich */
router.route('/')
.get((req,res,next)=> {
  renderForm(res, {
    about: aboutController.getAboutData().data,
    lifeline: personaldataController.getLifeline().data
  });
})
.post(sameOrigin, upload, (req,res,next)=> {
  const entries = readEntries(req.body);
  const result = req.uploadError
    ? { status: 400, data: req.uploadError }
    : aboutController.updateAbout({
        ...req.body,
        photo: req.file ? publicPath(req.file) : null,
        removePhoto: req.body.removePhoto === '1',
        entries
      });

  if (result.status !== 200) {
    discardUploads(req);
    // Eingaben wieder anzeigen; das Foto bleibt das bisherige
    const current = aboutController.getAboutData().data;
    return renderForm(res.status(result.status), {
      about: { ...current, photoCaption: req.body.photoCaption, fileName: req.body.fileName, code: req.body.code },
      lifeline: entries,
      error: result.data
    });
  }
  res.redirect('/admin?hinweis=ueber-mich-gespeichert#ueber-mich');
})

module.exports = router;
