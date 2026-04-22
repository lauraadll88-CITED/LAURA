import "dotenv/config";
const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.log("No key");
} else {
  console.log("Length of key:", key.length, "Starts with:", key.substring(0, 4));
}
