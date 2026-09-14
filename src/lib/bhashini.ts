/**
 * Bhashini API client — server-side only.
 *
 * IMPORTANT: This file must ONLY be imported from server-side API routes.
 * The Bhashini API key and Udyat key must never reach the browser.
 *
 * Architecture:
 *   1. Direct Inference (Preferred & Fast):
 *      Calls Bhashini Dhruva Pipeline (https://dhruva-api.bhashini.gov.in/services/inference/pipeline)
 *      using the provided Inference API Key in the Authorization header.
 *   2. Dynamic Pipeline Config (Fallback):
 *      Queries ULCA pipeline config to discover dynamic callback URLs if direct mode fails.
 */

// In-memory cache for config responses (task+language → config)
const configCache = new Map<
  string,
  { callbackUrl: string; inferenceApiKey: string; cachedAt: number }
>();

const CONFIG_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const BHASHINI_DHRUVA_URL =
  "https://dhruva-api.bhashini.gov.in/services/inference/pipeline";

const BHASHINI_CONFIG_URL =
  "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline";

// Supported language codes for Bhashini
const LANGUAGE_CODE_MAP: Record<string, string> = {
  en: "en",
  as: "as",
  brx: "brx",
  kha: "kha",
  hi: "hi",
  bn: "bn",
};

interface PipelineConfig {
  callbackUrl: string;
  inferenceApiKey: string;
}

/**
 * Returns the configured Inference API Key (checks BHASHINI_INFERENCE_API_KEY or BHASHINI_ULCA_API_KEY).
 */
function getInferenceKey(): string | undefined {
  return (
    process.env.BHASHINI_INFERENCE_API_KEY ||
    process.env.BHASHINI_ULCA_API_KEY
  );
}

/**
 * Returns the configured User/Udyat identifier (checks BHASHINI_UDYAT_KEY or BHASHINI_USER_ID).
 */
function getUdyatKey(): string | undefined {
  return (
    process.env.BHASHINI_UDYAT_KEY ||
    process.env.BHASHINI_USER_ID
  );
}

/**
 * Step 1 (Fallback): Get pipeline config (callback URL + inference key) for a task+language.
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

  const userId = getUdyatKey();
  const ulcaApiKey = getInferenceKey();

  if (!userId || !ulcaApiKey) {
    throw new Error(
      "Bhashini credentials not configured. Set BHASHINI_INFERENCE_API_KEY in .env.local"
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
    throw new Error(`Bhashini config request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  const pipelineResponse = data.pipelineResponseConfig?.[0];
  const callbackUrl =
    pipelineResponse?.config?.[0]?.serviceId
      ? data.pipelineInferenceAPIEndPoint?.callbackUrl
      : null;
  const inferenceApiKey =
    data.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;

  if (!callbackUrl || !inferenceApiKey) {
    throw new Error(
      "Could not extract callback URL or inference key from Bhashini config response"
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
 * Returns base64-encoded audio (WAV format).
 */
export async function textToSpeech(
  text: string,
  language: string
): Promise<string> {
  const langCode = LANGUAGE_CODE_MAP[language] || language;
  const inferenceKey = getInferenceKey();

  if (!inferenceKey) {
    throw new Error(
      "Bhashini Inference API key not configured. Please set BHASHINI_INFERENCE_API_KEY in .env.local"
    );
  }

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

  // 1. Try direct Dhruva inference endpoint first
  try {
    const response = await fetch(BHASHINI_DHRUVA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: inferenceKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const data = await response.json();
      const audioBase64 = data.pipelineResponse?.[0]?.audio?.[0]?.audioContent;
      if (audioBase64) {
        return audioBase64;
      }
    }
  } catch (directErr) {
    console.warn("[Bhashini TTS] Direct Dhruva call error, trying pipeline config fallback:", directErr);
  }

  // 2. Fallback to pipeline config flow if direct call was not successful
  try {
    const config = await getPipelineConfig("tts", langCode);
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
      throw new Error("No audio content returned in Bhashini TTS response");
    }

    return audioBase64;
  } catch (fallbackErr) {
    const msg = fallbackErr instanceof Error ? fallbackErr.message : "TTS failed";
    throw new Error(`Bhashini TTS failed for language '${langCode}': ${msg}`);
  }
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
  const inferenceKey = getInferenceKey();

  if (!inferenceKey) {
    throw new Error(
      "Bhashini Inference API key not configured. Please set BHASHINI_INFERENCE_API_KEY in .env.local"
    );
  }

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

  // 1. Try direct Dhruva inference endpoint first
  try {
    const response = await fetch(BHASHINI_DHRUVA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: inferenceKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const data = await response.json();
      const transcript = data.pipelineResponse?.[0]?.output?.[0]?.source;
      if (transcript !== undefined) {
        return transcript;
      }
    }
  } catch (directErr) {
    console.warn("[Bhashini ASR] Direct Dhruva call error, trying pipeline config fallback:", directErr);
  }

  // 2. Fallback to pipeline config flow
  const config = await getPipelineConfig("asr", langCode);
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

  if (transcript === undefined) {
    throw new Error("No transcript in Bhashini ASR response");
  }

  return transcript;
}
