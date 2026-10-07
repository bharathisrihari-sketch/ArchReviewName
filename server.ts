import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Architecture Recovery API endpoint using Gemini 3.8 Flash
app.post('/api/recover-architecture', async (req, res) => {
  try {
    const { content, systemName = 'Analyzed Data Estate' } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Empty system artifacts provided. Please provide SQL, ETL script, or code content.',
      });
    }

    if (!aiClient) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check environment variables or use the built-in sample system.',
      });
    }

    const systemInstruction = `You are a Principal Data Architect and Reverse-Engineering specialist for enterprise data estates.
Your task is to analyze SQL scripts, ETL DAGs, and code snippets, discover components, extract realistic read/write dependencies, flag unverified links for review, and propose a target architecture.

RULES:
1. NEVER fabricate or hallucinate components or dependencies that are not in the input.
2. For each dependency edge, assign a realistic confidence score between 0.0 and 1.0 based on explicit syntax (e.g., direct foreign keys, INSERT INTO ... SELECT, explicit SQL joins have 0.90-1.0; indirect or inferred references have 0.50-0.75).
3. If you are unsure about any dependency or if it represents an undocumented legacy direct query, mark needsReview: true.
4. Flag unused components (orphan tables/jobs with no downstream consumers) as isUnusedCandidate: true.
5. Flag duplicate candidate tables as isDuplicateCandidate: true.
6. Propose a modern 5-layer target architecture (source, staging, curated, reporting, apps) and logical domain service boundaries with clear rationales.`;

    const prompt = `Analyze the following system artifacts and reverse-engineer its architecture:

SYSTEM NAME: ${systemName}

ARTIFACTS CONTENT:
${content.slice(0, 45000)}

Respond with a JSON object strictly following this structure:
{
  "name": "${systemName}",
  "description": "Architecture model recovered from artifacts",
  "components": [
    {
      "id": "unique_component_id",
      "name": "display_name",
      "type": "table" | "view" | "job" | "report" | "app",
      "layer": "source" | "staging" | "curated" | "reporting" | "apps",
      "description": "Brief non-technical description of role",
      "isUnusedCandidate": boolean,
      "isDuplicateCandidate": boolean,
      "duplicateOf": "optional_name_if_duplicate",
      "notes": "optional notes"
    }
  ],
  "dependencies": [
    {
      "id": "dep-1",
      "source": "source_component_id",
      "target": "target_component_id",
      "confidence": 0.95,
      "needsReview": false,
      "type": "reads" | "writes" | "invokes" | "queries",
      "rationale": "Why this dependency exists"
    }
  ],
  "serviceBoundaries": [
    {
      "id": "srv-1",
      "name": "Domain name (e.g., Customer Domain)",
      "description": "Domain responsibility",
      "suggestedComponents": ["comp_id_1", "comp_id_2"],
      "rationale": "Why these components belong together",
      "targetLayer": "curated"
    }
  ]
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini model returned an empty response.');
    }

    const parsedData = JSON.parse(responseText);
    return res.json(parsedData);
  } catch (err: any) {
    console.error('Error during architecture recovery:', err);
    return res.status(500).json({
      error: err.message || 'Failed to analyze system artifacts with Gemini AI.',
    });
  }
});

// Setup Vite in development or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QuantumLens server running on port ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
  });
}

startServer();
