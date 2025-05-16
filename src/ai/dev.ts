
import { config } from 'dotenv';
config(); // Load .env variables

// Ensure Genkit flows are registered
// import '@/ai/flows/suggest-stronger-passwords.ts'; // Removed

// If you add more flows, import them here as well.
// For example:
// import '@/ai/flows/another-flow.ts';

console.log("Genkit development server started.");
// If you had other flows, they would be registered above.
// Currently, no flows are active after removing suggest-stronger-passwords.
