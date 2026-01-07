import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});

const { CLOUD_NAME, API_KEY, API_SECRET } = process.env;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    const missingKeys = [
        !CLOUD_NAME ? "CLOUD_NAME" : null,
        !API_KEY ? "API_KEY" : null,
        !API_SECRET ? "API_SECRET" : null,
    ].filter(Boolean);

    throw new Error(
        `Missing Cloudinary configuration value(s): ${missingKeys.join(", ")}. ` +
        "Please add them to hiring/backend/.env and restart the server."
    );
}

cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
});

export default cloudinary;