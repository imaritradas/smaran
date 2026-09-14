/**
 * Bhashini API client — server-side only.
 *
 * IMPORTANT: This file must ONLY be imported from API routes.
 * The Bhashini API key must never reach the browser.
 *
 * VERIFICATION NOTICE: The two-step pipeline flow below (config → callback)
 * is based on Bhashini's documented architecture as of the project's design
 * date. Government API portals can change their schema — if integration
 * fails, verify the current endpoint shape at:
 *   https://bhashini.gov.in/ulca
 *   https://meity-auth.ulcacontrib.org (ULCA API docs)
 *
 * The flow is:
 *   1. POST to the config endpoint with userID + ulcaApiKey headers
 *      to get a callback URL + inference key for a given task + language
 *   2. POST the actual audio/text payload to that callback URL
 */

// In-memory cache for config responses (task+language → config)
const configCache = new Map<
  string,
  { callbackUrl: string; inferenceApiKey: string; cachedAt: number }
>();

const CONFIG_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const BHASHINI_CONFIG_URL =
  "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline";

// Bhashini language codes for supported NER languages
const LANGUAGE_CODE_MAP: Record<string, string> = {
  en: "en",
  as: "as",
  brx: "brx",
  kha: "kha",
};

interface PipelineConfig {
  callbackUrl: string;
  inferenceApiKey: string;
}

/**
 * Step 1: Get pipeline config (callback URL + inference key) for a task+language.
 * Caches the response to avoid redundant config calls.
 */
async function getPipelineConfig(
  task: "asr" | "tts",
  language: string
): Promise<PipelineConfig> {
  const langCode = LANGUAGE_CODE_MAP[language] || language;
  const cacheKey = `${task}:${langCode}`;

  const cached = configCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CONFIG_CACHE_TTL_MS) {
    return {
      callbackUrl: cached.callbackUrl,
      inferenceApiKey: cached.inferenceApiKey,
    };
  }

  const userId = process.env.BHASHINI_USER_ID;
  const ulcaApiKey = process.env.BHASHINI_ULCA_API_KEY;

  if (!userId || !ulcaApiKey) {
    throw new Error(
      "Bhashini credentials not configured. Set BHASHINI_USER_ID and BHASHINI_ULCA_API_KEY in .env.local"
    );
  }

  const taskType = task === "asr" ? "asr" : "tts";

  const pipelineRequestBody = {
    pipelineTasks: [{ taskType, config: { language: { sourceLanguage: langCode } } }],
    pipelineRequestConfig: {
      pipelineId: "64392f96daac500b55c543cd",
    },
  };

  const response = await fetch(BHASHINI_CONFIG_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      userID: userId,
      ulcaApiKey: ulcaApiKey,
    },
    body: JSON.stringify(pipelineRequestBody),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Bhashini config request failed (${response.status}): ${text}. ` +
      `Verify the endpoint shape at https://bhashini.gov.in/ulca`
    );
  }

  const data = await response.json();

  // Extract callback URL and inference key from the pipeline response
  // NOTE: This structure should be verified against current Bhashini docs
  const pipelineResponse = data.pipelineResponseConfig?.[0];
  const callbackUrl =
    pipelineResponse?.config?.[0]?.serviceId
      ? data.pipelineInferenceAPIEndPoint?.callbackUrl
      : null;
  const inferenceApiKey =
    data.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;

  if (!callbackUrl || !inferenceApiKey) {
    throw new Error(
      "Could not extract callback URL or inference key from Bhashini config response. " +
      "The API response shape may have changed — verify at https://bhashini.gov.in/ulca"
    );
  }

  configCache.set(cacheKey, {
    callbackUrl,
    inferenceApiKey,
    cachedAt: Date.now(),
  });

  return { callbackUrl, inferenceApiKey };
}

/**
 * Text-to-Speech: convert text to audio via Bhashini.
 * Returns base64-encoded audio.
 */
export async function textToSpeech(
  text: string,
  language: string
): Promise<string> {
  const langCode = LANGUAGE_CODE_MAP[language] || language;
  const config = await getPipelineConfig("tts", langCode);

  const requestBody = {
    pipelineTasks: [
      {
        taskType: "tts",
        config: {
          language: { sourceLanguage: langCode },
          gender: "female",
        },
      },
    ],
    inputData: {
      input: [{ source: text }],
    },
  };

  const response = await fetch(config.callbackUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: config.inferenceApiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Bhashini TTS failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const audioBase64 = data.pipelineResponse?.[0]?.audio?.[0]?.audioContent;

  if (!audioBase64) {
    throw new Error(
      "No audio content in Bhashini TTS response — API shape may have changed"
    );
  }

  return audioBase64;
}

/**
 * Speech-to-Text: convert audio to text via Bhashini.
 * Expects base64-encoded audio input.
 */
export async function speechToText(
  audioBase64: string,
  language: string
): Promise<string> {
  const langCode = LANGUAGE_CODE_MAP[language] || language;
  const config = await getPipelineConfig("asr", langCode);

  const requestBody = {
    pipelineTasks: [
      {
        taskType: "asr",
        config: {
          language: { sourceLanguage: langCode },
        },
      },
    ],
    inputData: {
      audio: [{ audioContent: audioBase64 }],
    },
  };

  const response = await fetch(config.callbackUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: config.inferenceApiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Bhashini ASR failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const transcript = data.pipelineResponse?.[0]?.output?.[0]?.source;

  if (!transcript) {
    throw new Error(
      "No transcript in Bhashini ASR response — API shape may have changed"
    );
  }

  return transcript;
}
