import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const singleUpload = upload.single("file");
export const resumeUpload = upload.single("resume");