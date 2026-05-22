import { v2 as cloudinary } from "cloudinary";
const CloudinaryStorage = require("multer-storage-cloudinary");
import multer from "multer";
import { env } from "../../config/env";
import { AppError } from "../errors/AppError";

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// Configuration du stockage simplifié pour éviter les timeouts
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req: any, file: any) => {
    const isVideo = file.mimetype.startsWith("video/");
    return {
      folder: isVideo ? "vote-gbde/videos" : "vote-gbde/images",
      resource_type: isVideo ? "video" : "image",
      allowed_formats: isVideo ? ["mp4", "webm", "mov"] : ["jpg", "jpeg", "png", "webp"],
      // Suppression des transformations lourdes à l'upload pour éviter le pending
      public_id: `${isVideo ? "video" : "image"}_${Date.now()}`,
    };
  },
});

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

export const uploadVideo = uploadMedia;
