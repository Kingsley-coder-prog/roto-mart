// Raw Cloudinary client — receives an image buffer, returns the hosted URL.
// No business logic (folder name is the only config). Secret stays server-side.
import { v2 as cloudinary } from 'cloudinary';

let configured = false;
function config() {
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    configured = true;
  }
}

/** Upload an image buffer to the rotomart folder; resolves to its secure URL. */
export function uploadImage(buffer) {
  config();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'rotomart', resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result.secure_url)),
    );
    stream.end(buffer);
  });
}
