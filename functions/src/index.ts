import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

// Secrets — set via: firebase functions:config:set elevenlabs.key="sk-..." gemini.key="..."
const ELEVENLABS_KEY = defineSecret("ELEVENLABS_KEY");
const GEMINI_KEY = defineSecret("GEMINI_KEY");

// ---------- Transcription (ElevenLabs) ----------

interface TranscribeRequest {
  audioBase64: string;
  mimeType?: string;
}

export const transcribeAudio = onRequest(
  { cors: true, secrets: [ELEVENLABS_KEY] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const apiKey = ELEVENLABS_KEY.value();
    if (!apiKey) {
      res.status(500).json({ error: "ElevenLabs API key not configured" });
      return;
    }

    const { audioBase64, mimeType = "audio/m4a" } = req.body as TranscribeRequest;
    if (!audioBase64) {
      res.status(400).json({ error: "Missing audioBase64 in request body" });
      return;
    }

    try {
      // Convert base64 to buffer for multipart upload
      const audioBuffer = Buffer.from(audioBase64, "base64");

      const formData = new FormData();
      formData.append(
        "file",
        new Blob([audioBuffer], { type: mimeType }),
        "recording.m4a"
      );
      formData.append("model_id", "scribe_v2");
      formData.append("language_code", "my");

      const response = await fetch(
        "https://api.elevenlabs.io/v1/speech-to-text",
        {
          method: "POST",
          headers: { "xi-api-key": apiKey },
          body: formData,
        }
      );

      if (!response.ok) {
        const errBody = await response.text();
        console.error("[transcribeAudio] ElevenLabs error:", response.status, errBody);
        res.status(response.status).json({
          error: `Transcription failed (${response.status}): ${errBody}`,
        });
        return;
      }

      const result = (await response.json()) as { text: string };
      res.json({ text: result.text });
    } catch (err) {
      console.error("[transcribeAudio] Unexpected error:", err);
      res.status(500).json({ error: "Internal transcription error" });
    }
  }
);

// ---------- Categorization (Gemini) ----------

interface CategorizeRequest {
  transcript: string;
}

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>;
  };
}

export const categorizeEntry = onRequest(
  { cors: true, secrets: [GEMINI_KEY] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const apiKey = GEMINI_KEY.value();
    if (!apiKey) {
      res.status(500).json({ error: "Gemini API key not configured" });
      return;
    }

    const { transcript } = req.body as CategorizeRequest;
    if (!transcript) {
      res.status(400).json({ error: "Missing transcript in request body" });
      return;
    }

    const prompt = `Categorize this entry into: money, feelings, work, health, ideas, or other.
Return JSON: { "category": "...", "summary": "English summary", "items": ["item1"], "mood": "mood", "date": "today" }
Entry: "${transcript}"`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!response.ok) {
        const errBody = await response.text();
        console.error("[categorizeEntry] Gemini error:", response.status, errBody);
        res.status(response.status).json({
          error: `Categorization failed (${response.status}): ${errBody}`,
        });
        return;
      }

      const result = (await response.json()) as {
        candidates?: GeminiCandidate[];
      };

      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        // Return safe default for blocked/empty responses
        res.json({
          category: "other",
          summary: transcript.slice(0, 100),
          items: [],
          mood: "neutral",
          date: "today",
        });
        return;
      }

      const parsed = JSON.parse(
        text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      );

      const validCategories = [
        "money", "feelings", "work", "health", "ideas", "other",
      ];
      res.json({
        category: validCategories.includes(parsed.category)
          ? parsed.category
          : "other",
        summary: parsed.summary || "",
        items: parsed.items || [],
        mood: parsed.mood || "neutral",
        date: parsed.date || "today",
      });
    } catch (err) {
      console.error("[categorizeEntry] Unexpected error:", err);
      res.status(500).json({ error: "Internal categorization error" });
    }
  }
);
