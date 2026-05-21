import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { env } from "../../config/env";
import { AppError } from "../errors/AppError";

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// Configuration du stockage avec transformation automatique
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "vote-gbde/videos",
      resource_type: "video",
      allowed_formats: ["mp4", "webm", "mov"],
      // Transformation pour optimiser la vidéo :
      // - bit_rate: "1m" limite le débit à 1 Mbps
      // - width: 720 redimensionne en 720p max
      // - crop: "limit" ne redimensionne que si c'est plus grand
      // - quality: "auto" optimise automatiquement le poids
      transformation: [
        { width: 720, crop: "limit" },
        { quality: "auto", bit_rate: "1m" },
        { fetch_format: "mp4" }
      ],
      public_id: `video_${Date.now()}`,
    };
  },
});

// Filtre pour n'accepter que les vidéos
const videoFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new AppError("Seuls les fichiers vidéo sont autorisés", 400), false);
  }
};

export const uploadVideo = multer({
  storage: storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Limite à 50 Mo
  },
});
