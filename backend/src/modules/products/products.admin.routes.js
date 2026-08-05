import { Router } from 'express';
import multer from 'multer';
import { adminList, adminCreate, adminUpdate, adminSetActive, adminSoftDelete, adminUploadImage } from './products.controller.js';

// Image kept in memory (max 5MB) then streamed to Cloudinary — never hits disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed.')),
});

// Wrap multer so its errors surface as clean 400s, not 500s.
function uploadImage(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      err.status = 400;
      if (err.code === 'LIMIT_FILE_SIZE') err.message = 'Image is too large (max 5MB).';
      return next(err);
    }
    next();
  });
}

const router = Router();
router.get('/', adminList);
router.post('/', adminCreate);
router.post('/image', uploadImage, adminUploadImage);
router.put('/:id', adminUpdate);
router.patch('/:id/active', adminSetActive); // toggle active on/off
router.delete('/:id', adminSoftDelete); // soft-delete (sets inactive)
export default router;
