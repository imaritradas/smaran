/**
 * Simple internationalization for the patient-facing app.
 *
 * Supported languages: English (en), Assamese (as), Bodo (brx), Khasi (kha).
 *
 * Placeholder translations for NER languages are marked with [TODO] —
 * these need native speakers to provide accurate translations.
 * The structure is ready for complete localization.
 */

import { SupportedLanguage } from "./types";

const strings: Record<string, Record<SupportedLanguage, string>> = {
  // App-wide
  "app.name": {
    en: "Smaran",
    as: "স্মৰণ",
    brx: "स्मरण",
    kha: "Smaran",
  },
  "app.tagline": {
    en: "Memory & Mind Wellness",
    as: "স্মৃতি আৰু মানসিক সুস্থতা",
    brx: "सोमोन्दो आरो मन गोसो जानाय",
    kha: "Ka Jingialang bad ka Mynsiem",
  },

  // Pairing
  "pair.title": {
    en: "Enter Your Code",
    as: "আপোনাৰ ক'ড দিয়ক",
    brx: "नोंथांनि कड हो",
    kha: "Pynbna ka Code",
  },
  "pair.placeholder": {
    en: "6-digit code",
    as: "৬-সংখ্যাৰ ক'ড",
    brx: "6-अंखो कड",
    kha: "6-digit code",
  },
  "pair.button": {
    en: "Start",
    as: "আৰম্ভ কৰক",
    brx: "जागाय",
    kha: "Sdang",
  },
  "pair.error": {
    en: "Invalid code. Please try again.",
    as: "ভুল ক'ড। আকৌ চেষ্টা কৰক।",
    brx: "गोरोन्थि कड। फिन नাजा।",
    kha: "Code sih. Pyrshah biang.",
  },

  // Language selection
  "lang.title": {
    en: "Choose Your Language",
    as: "আপোনাৰ ভাষা বাছনি কৰক",
    brx: "नोंथांनि रोंबो सानजा",
    kha: "Jied ka Ktien",
  },

  // Game hub
  "hub.title": {
    en: "Let's Play!",
    as: "আহক খেলো!",
    brx: "आव गेलेनो!",
    kha: "Wan ia ka leng!",
  },
  "hub.memory": {
    en: "Memory Match",
    as: "স্মৃতি মিলোৱা",
    brx: "सोमोन्दो मेलाय",
    kha: "Jingialang Match",
  },
  "hub.attention": {
    en: "Spot & Tap",
    as: "চিনাক্ত কৰক",
    brx: "नुथाय आरो थाप",
    kha: "Ioh & Thoh",
  },
  "hub.sequence": {
    en: "Follow the Pattern",
    as: "আৰ্হি অনুসৰণ কৰক",
    brx: "ढालाय मानना",
    kha: "Bud ka Pattern",
  },
  "hub.routine": {
    en: "Daily Routine",
    as: "দৈনিক ৰুটিন",
    brx: "सान्नायफोर मोनदांथि",
    kha: "Ka Rukom Sngi",
  },
  "hub.family": {
    en: "Family Faces",
    as: "পৰিয়ালৰ মুখ",
    brx: "हानजानि मुसुख",
    kha: "Ki Mat Kynmaw",
  },

  // Game common
  "game.start": {
    en: "Tap to begin",
    as: "আৰম্ভ কৰিবলৈ টেপ কৰক",
    brx: "जागायनो थाप हो",
    kha: "Thoh ban sdang",
  },
  "game.done": {
    en: "Well done!",
    as: "ভাল হৈছে!",
    brx: "मोजां जादों!",
    kha: "Bha snam!",
  },
  "game.tryAgain": {
    en: "Try Again",
    as: "আকৌ চেষ্টা কৰক",
    brx: "फिन नাজा",
    kha: "Pyrshah biang",
  },
  "game.back": {
    en: "Back to Games",
    as: "খেললৈ উভতক",
    brx: "गेलेननायाव थां",
    kha: "Phai sha ki Leng",
  },

  // Memory Match specific
  "memory.instruction": {
    en: "Find the matching pairs! Tap a card to flip it.",
    as: "মিল থকা যোৰ বিচাৰক! এখন কাৰ্ডত টেপ কৰক।",
    brx: "मेलायजों नुथायो! कार्ड-आव थाप हो।",
    kha: "Ioh ki jingialang! Thoh ka card.",
  },

  // Spot & Tap specific
  "spot.instruction": {
    en: "Tap the star when you see it! Ignore the other shapes.",
    as: "তৰা দেখিলে টেপ কৰক! আন আকৃতি এৰি দিয়ক।",
    brx: "सिरि नुहातलै थाप हो! गुबुन फोरमायाव नांगौ।",
    kha: "Thoh ka sur! Wanrah ki bynta jingkynmaw.",
  },

  // Sequence Recall specific
  "sequence.instruction": {
    en: "Watch the pattern, then repeat it!",
    as: "আৰ্হিটো চাওক, তাৰ পিছত পুনৰাবৃত্তি কৰক!",
    brx: "ढालाय नायो, उनसिम मानना!",
    kha: "Iohi ka pattern, bad im!",
  },

  // Routine Recall specific
  "routine.instruction": {
    en: "Put these daily activities in the right order!",
    as: "এই দৈনিক কামবোৰ সঠিক ক্ৰমত ৰাখক!",
    brx: "बे सान्नायफोरखौ गेजेर लाइनाव दोन!",
    kha: "Pyniaid ki kam sngi ha ka rukom ibiang!",
  },

  // Family Faces specific
  "family.instruction": {
    en: "Who is this person?",
    as: "এই ব্যক্তিজন কোন?",
    brx: "बे सोर?",
    kha: "Tymmen une?",
  },
  "family.correct": {
    en: "That's right!",
    as: "ঠিক!",
    brx: "गेबें!",
    kha: "Bha!",
  },
  "family.tryAgainHint": {
    en: "Not quite — take another look!",
    as: "সম্পূৰ্ণ ঠিক নহয় — আকৌ চাওক!",
    brx: "गोरोन्थि — फिन नायो!",
    kha: "Ym bha — iohi biang!",
  },
  "family.noPhotos": {
    en: "No family photos set up yet. Ask your caregiver to add them.",
    as: "পৰিয়ালৰ ফটো এতিয়াও যোগ কৰা হোৱা নাই।",
    brx: "हानजानि फटो गैया। देखानायगिरिखौ बुंथि हो।",
    kha: "Ym don ki jingshisha. Ong ia u nongialang ban pyndonkam.",
  },

  // Offline
  "offline.indicator": {
    en: "Offline — your progress is saved",
    as: "অফলাইন — আপোনাৰ প্ৰগতি সংৰক্ষিত",
    brx: "अफलाइन — नोंथांनि गोहो खालामजा",
    kha: "Offline — don da ki kam",
  },
  "online.indicator": {
    en: "Connected",
    as: "সংযুক্ত",
    brx: "जथायजानाय",
    kha: "Jingkynmaw",
  },

  // Routine items (culturally familiar NER daily activities)
  "routine.wakeUp": {
    en: "Wake Up",
    as: "সাৰ পোৱা",
    brx: "गोसोख",
    kha: "Jingiasaid",
  },
  "routine.medicine": {
    en: "Take Medicine",
    as: "দৰব খোৱা",
    brx: "दाबै जा",
    kha: "Ba dawai",
  },
  "routine.breakfast": {
    en: "Breakfast",
    as: "ৰাতিপুৱাৰ জলপানি",
    brx: "सुबुंनि जानाय",
    kha: "Jingbuh mynstep",
  },
  "routine.walk": {
    en: "Morning Walk",
    as: "ৰাতিপুৱাৰ খোজকাঢ়া",
    brx: "सুबुंनि हان्था",
    kha: "Ka jingsan mynstep",
  },
  "routine.lunch": {
    en: "Lunch",
    as: "দুপৰীয়াৰ আহাৰ",
    brx: "सानजानि जानाय",
    kha: "Jingbuh Sngi",
  },
  "routine.nap": {
    en: "Afternoon Rest",
    as: "দুপৰীয়াৰ জিৰণি",
    brx: "सान्जानि खोमा",
    kha: "Jingiasaid sngi",
  },
  "routine.dinner": {
    en: "Dinner",
    as: "ৰাতিৰ আহাৰ",
    brx: "मोनाबनि जानाय",
    kha: "Jingbuh miet",
  },
  "routine.sleep": {
    en: "Sleep",
    as: "শোৱা",
    brx: "खोमা",
    kha: "Jingiasaid",
  },
};

/**
 * Look up a translated string. Falls back to English if the key
 * or language is missing.
 */
export function t(key: string, language: SupportedLanguage = "en"): string {
  const entry = strings[key];
  if (!entry) return key;
  return entry[language] || entry["en"] || key;
}

/** All available languages for the language picker. */
export const LANGUAGES: {
  code: SupportedLanguage;
  nativeLabel: string;
  englishLabel: string;
}[] = [
  { code: "en", nativeLabel: "English", englishLabel: "English" },
  { code: "as", nativeLabel: "অসমীয়া", englishLabel: "Assamese" },
  { code: "brx", nativeLabel: "बड़ो", englishLabel: "Bodo" },
  { code: "kha", nativeLabel: "Khasi", englishLabel: "Khasi" },
];

/** Friendly alias for getTranslation */
export function getTranslation(language: SupportedLanguage, key: string): string {
  // Map common game keys to translation strings
  const keyMap: Record<string, string> = {
    welcome: "app.tagline",
    game_memory_match: "games.memory-match",
    game_spot_and_tap: "games.spot-and-tap",
    game_sequence_recall: "games.sequence-recall",
    game_routine_recall: "games.routine-recall",
    game_family_faces: "games.family-faces",
    tap_to_start: "pair.button",
    well_done: "games.wellDone",
    back: "games.back",
  };

  const actualKey = keyMap[key] || key;
  return t(actualKey, language);
}

/** Client-side TTS speaker using browser Web Speech API or Bhashini proxy */
export async function speakPrompt(text: string, language: SupportedLanguage = "en"): Promise<void> {
  if (typeof window === "undefined") return;

  // 1. Try Bhashini proxy if online
  if (navigator.onLine) {
    try {
      const res = await fetch("/api/bhashini/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
          await audio.play();
          return;
        }
      }
    } catch {
      // Fallback to browser synthesis
    }
  }

  // 2. Offline fallback: browser SpeechSynthesis
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<SupportedLanguage, string> = {
      en: "en-IN",
      as: "as-IN",
      brx: "hi-IN",
      kha: "en-IN",
    };
    utterance.lang = langMap[language] || "en-IN";
    utterance.rate = 0.85; // Slightly slower for elderly comprehension
    window.speechSynthesis.speak(utterance);
  }
}

