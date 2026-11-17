import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// Files are kept in memory and streamed straight to Cloudinary.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

export function uploadImage(buffer, folder = "messaging-app") {
  if (!process.env.CLOUDINARY_URL) {
    const err = new Error("Image uploads are not configured on the server");
    err.status = 503;
    throw err;
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => (error ? reject(error) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
}
