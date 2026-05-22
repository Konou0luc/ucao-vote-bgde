import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { env } from "../../config/env";
import { AppError } from "../errors/AppError";

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// Utilisation de memoryStorage pour un meilleur contrôle
const storage = multer.memoryStorage();

// Filtre pour n'accepter que les vidéos et images
const mediaFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("video/") || file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new AppError("Seuls les fichiers vidéo et image sont autorisés", 400), false);
  }
};

export const uploadMedia = multer({
  storage: storage,
  fileFilter: mediaFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Limite à 50 Mo
  },
});

/**
 * Upload manuel vers Cloudinary avec gestion de timeout
 */
export async function uploadToCloudinary(file: Express.Multer.File): Promise<string> {
  return new Promise((resolve, reject) => {
    const isVideo = file.mimetype.startsWith("video/");
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: isVideo ? "vote-gbde/videos" : "vote-gbde/images",
        resource_type: isVideo ? "video" : "image",
        allowed_formats: isVideo ? ["mp4", "webm", "mov"] : ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(new AppError("Erreur lors de l'upload vers Cloudinary", 500));
        }
        if (!result) {
          return reject(new AppError("Pas de résultat de Cloudinary", 500));
        }
        resolve(result.secure_url || result.url);
      }
    );

    uploadStream.end(file.buffer);
  });
}

export const uploadVideo = uploadMedia;
