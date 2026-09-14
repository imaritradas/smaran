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
  "app.cognitiveCompanion": {
    en: "Cognitive Companion",
    as: "জ্ঞান সংগী",
    brx: "सोमोन्दो गोसोगिरि",
    kha: "Ka Jingiaseng Mynsiem",
  },

  // ── Navigation ──
  "nav.home": {
    en: "Home",
    as: "ঘৰ",
    brx: "न'",
    kha: "Ing",
  },
  "nav.memoryMatch": {
    en: "Memory Match",
    as: "স্মৃতি মিলোৱা",
    brx: "सोमोन्दो मेलाय",
    kha: "Jingialang Match",
  },
  "nav.spotAndTap": {
    en: "Spot and Tap",
    as: "চিনাক্ত আৰু টেপ",
    brx: "नुथाय आरो थाप",
    kha: "Ioh bad Thoh",
  },
  "nav.sequenceRecall": {
    en: "Sequence Recall",
    as: "ক্ৰম মনত ৰাখক",
    brx: "ढालाय मोनदांथि",
    kha: "Jingialang Pattern",
  },
  "nav.routineRecall": {
    en: "Routine Recall",
    as: "ৰুটিন মনত ৰাখক",
    brx: "सान्नायफोर मोनदांथि",
    kha: "Jingialang Rukom",
  },
  "nav.familyFaces": {
    en: "Family Faces",
    as: "পৰিয়ালৰ মুখ",
    brx: "हानजानि मुसुख",
    kha: "Ki Mat Kynmaw",
  },
  "nav.reminders": {
    en: "Reminders",
    as: "সোঁৱৰণী",
    brx: "गोसोखांथि",
    kha: "Ki Jingkynmaw",
  },
  "nav.notifications": {
    en: "Notifications",
    as: "জাননী",
    brx: "खौरां",
    kha: "Ki Jingpynbna",
  },
  "nav.language": {
    en: "Language",
    as: "ভাষা",
    brx: "रोंबो",
    kha: "Ktien",
  },
  "nav.lightMode": {
    en: "Light Mode",
    as: "পোহৰ ম'ড",
    brx: "फोथार मड",
    kha: "Sngi Mode",
  },
  "nav.darkMode": {
    en: "Dark Mode",
    as: "আন্ধাৰ ম'ড",
    brx: "मिथिंगा मड",
    kha: "Um Mode",
  },
  "nav.activities": {
    en: "Activities",
    as: "কাৰ্যকলাপ",
    brx: "खामानि",
    kha: "Ki Kam",
  },

  // ── Reminders Section ──
  "reminders.title": {
    en: "Daily Routine Reminders",
    as: "দৈনিক সোঁৱৰণী",
    brx: "सान्फ्रोमनि गोसोखांथि",
    kha: "Ki Jingkynmaw Sngi",
  },
  "reminders.subtitle": {
    en: "Caregiver-scheduled care: medicines, water, walks, and meals.",
    as: "যত্নশীলৰ দ্বাৰা নিৰ্ধাৰিত: ঔষধ, পানী, খোজ আৰু আহাৰ।",
    brx: "जाहाथायनि दोननाय: मुलि, दै, हान्था आरो जानाय।",
    kha: "Ki jingleh na u nongsumar: dawai, um, jingiaid bad jingbam.",
  },
  "reminders.markDone": {
    en: "Mark as Done",
    as: "সম্পূৰ্ণ হ'ল",
    brx: "जाफुंबाय",
    kha: "La Dep",
  },
  "reminders.completed": {
    en: "Completed",
    as: "সম্পন্ন হৈছে",
    brx: "जाफुंबाय",
    kha: "La Pyndep",
  },
  "reminders.readAloud": {
    en: "Read All Reminders",
    as: "সকলো সোঁৱৰণী পঢ়ক",
    brx: "गासैबो फराय",
    kha: "Pule Baroh",
  },
  "reminders.noReminders": {
    en: "No reminders scheduled for today yet.",
    as: "আজিৰ বাবে কোনো সোঁৱৰণী নাই।",
    brx: "दिनै जेबो गोसोखांथि गैया।",
    kha: "Ym don jingkynmaw mynta ka sngi.",
  },

  // ── Notifications Section ──
  "notifications.title": {
    en: "Notifications & Alerts",
    as: "জাননী আৰু সতৰ্কবাৰ্তা",
    brx: "खौरां आरो साबसिन",
    kha: "Ki Jingpynbna bad Jingmaham",
  },
  "notifications.subtitle": {
    en: "Important caregiver messages, routine reminders, and wellness updates.",
    as: "যত্নশীলৰ গুৰুত্বপূৰ্ণ বাৰ্তা আৰু স্বাস্থ্য সতৰ্কবাৰ্তা।",
    brx: "गोनांथार खौरां आरो देहा मोजां जानायनि साबसिन।",
    kha: "Ki khubor ba kongsan na u nongsumar bad jingkoit jingkhiah.",
  },
  "notifications.markRead": {
    en: "Mark as Read",
    as: "পঢ়া হ'ল",
    brx: "फरायबाय",
    kha: "La Pule",
  },
  "notifications.readAloud": {
    en: "Read Out Loud",
    as: "উচ্চাৰণ কৰি শুনক",
    brx: "गोसोयै खोनासं",
    kha: "Sngap Jam",
  },
  "notifications.noNotifications": {
    en: "No new notifications right now. Everything is peaceful!",
    as: "বৰ্তমান কোনো নতুন জাননী নাই। সকলো ঠিকেই আছে!",
    brx: "दा जेबो गोदान खौरां गैया। गासैबो मोजां!",
    kha: "Ym don jingpynbna bathymmai mynta. Baroh ka suk!",
  },

  // ── Home Page ──
  "home.selectActivity": {
    en: "Select an activity to begin",
    as: "আৰম্ভ কৰিবলৈ এটা কাৰ্যকলাপ বাছক",
    brx: "जागायनो मोनसे खामानि सायख",
    kha: "Jied ka kam ban sdang",
  },
  "home.activitiesAvailable": {
    en: "5 Activities Available",
    as: "৫ কাৰ্যকলাপ উপলব্ধ",
    brx: "5 खामानि दं",
    kha: "5 ki Kam",
  },
  "home.changeLanguage": {
    en: "Change Language",
    as: "ভাষা সলনি কৰক",
    brx: "रोंबो सोलायनाय",
    kha: "Pynbiang ka Ktien",
  },
  "home.encouragement": {
    en: "Play anytime at your own comfortable pace. There are no wrong answers — every moment of engagement strengthens and exercises your mind.",
    as: "আপোনাৰ নিজৰ আৰামদায়ক গতিত যিকোনো সময়ত খেলক। কোনো ভুল উত্তৰ নাই — প্ৰতিটো মুহূৰ্তই আপোনাৰ মনক শক্তিশালী কৰে।",
    brx: "नोंथांनि गोसो मोजां जानाय गेजेराव जेबो समावनो गेलेनो। गोरोन्थि फिन्नाय गैया — गासैबो खेबनि नोंथांनि मनखौ गोहो खालामो।",
    kha: "Leng mynno ha ka rukom jingkynmaw jong phi. Ym don ki jingpyrshah sih — baroh ka por ka jingialang ka pynkynmaw ia ka mynsiem.",
  },
  "home.code": {
    en: "Code",
    as: "ক'ড",
    brx: "कड",
    kha: "Code",
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
    brx: "गोरोन्थि कड। फिन नाजा।",
    kha: "Code sih. Pyrshah biang.",
  },

  // Language selection
  "lang.title": {
    en: "Choose Your Language",
    as: "আপোনাৰ ভাষা বাছনি কৰক",
    brx: "नोंथांनि रोंबो सानजा",
    kha: "Jied ka Ktien",
  },
  "lang.continue": {
    en: "Continue",
    as: "আগবাঢ়ক",
    brx: "आगान हो",
    kha: "Kynmaw",
  },
  "lang.listenSample": {
    en: "Listen to sample",
    as: "নমুনা শুনক",
    brx: "नमुना खोना",
    kha: "Sngew ka sample",
  },
  "lang.playing": {
    en: "Playing...",
    as: "বজাই আছে...",
    brx: "खोनाय जादों...",
    kha: "Leng noh...",
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
    brx: "फिन नाजा",
    kha: "Pyrshah biang",
  },
  "game.back": {
    en: "Back",
    as: "উভতি যাওক",
    brx: "थां",
    kha: "Phai",
  },
  "game.playAgain": {
    en: "Play Again",
    as: "আকৌ খেলক",
    brx: "फिन गेलेनो",
    kha: "Leng biang",
  },
  "game.allActivities": {
    en: "All Activities",
    as: "সকলো কাৰ্যকলাপ",
    brx: "गासै खामानि",
    kha: "Baroh ki Kam",
  },
  "game.seeAgain": {
    en: "See Again",
    as: "আকৌ চাওক",
    brx: "फिन नायो",
    kha: "Iohi biang",
  },
  "game.next": {
    en: "Next",
    as: "পৰৱৰ্তী",
    brx: "उनसिम",
    kha: "Kaba la",
  },
  "game.finish": {
    en: "Finish Activity",
    as: "কাৰ্যকলাপ শেষ কৰক",
    brx: "खामानि जोबनाय",
    kha: "Joh ka Kam",
  },

  // ── Game subtitles (shown in header) ──
  "game.memory.subtitle": {
    en: "Find matching pairs of symbols",
    as: "মিল থকা চিহ্নৰ যোৰ বিচাৰক",
    brx: "सिन-सानजौनि मेलायजों नुथायो",
    kha: "Ioh ki jingialang ki symbol",
  },
  "game.spot.subtitle": {
    en: "Find and tap the blue star",
    as: "নীলা তৰাটো বিচাৰি টেপ কৰক",
    brx: "गोजौ सिरिखौ नुहातलै थाप हो",
    kha: "Ioh bad thoh ka sur khun",
  },
  "game.sequence.subtitle": {
    en: "Watch the lights and tap in order",
    as: "পোহৰবোৰ চাওক আৰু ক্ৰমত টেপ কৰক",
    brx: "आरजाफोर नायो आरो ढालायनि रोदा थाप हो",
    kha: "Iohi ki hynniew bad thoh ha ka rukom",
  },
  "game.routine.subtitle": {
    en: "Order your daily activities",
    as: "আপোনাৰ দৈনিক কামবোৰ ক্ৰমত সজাওক",
    brx: "नोंथांनि सान्नायफोर ढालायनि रोदा दोन",
    kha: "Pyniaid ki kam sngi ha ka rukom",
  },
  "game.family.subtitle": {
    en: "Recognize your beloved family",
    as: "আপোনাৰ মৰমৰ পৰিয়ালক চিনি পাওক",
    brx: "नोंथांनि मोजां हानजानिखौ सिनायथि हो",
    kha: "Tip ia ki kynmaw jong phi",
  },

  // ── Game-specific strings ──
  "game.memory.matches": {
    en: "Matches",
    as: "মিল",
    brx: "मेलायजों",
    kha: "Match",
  },
  "game.memory.found": {
    en: "A match!",
    as: "মিল পালে!",
    brx: "मेलायजों मोनदों!",
    kha: "Match!",
  },
  "game.memory.complete": {
    en: "All pairs found! Great memory!",
    as: "সকলো যোৰ পোৱা গ'ল! দারুণ স্মৃতিশক্তি!",
    brx: "गासै मेलायजों मोनदों! गोहो सोमोन्दो!",
    kha: "Baroh ki match! Ka jingialang babha!",
  },
  "game.spot.round": {
    en: "Round",
    as: "ৰাউণ্ড",
    brx: "खेब",
    kha: "Round",
  },
  "game.spot.foundIt": {
    en: "Found it!",
    as: "পালে!",
    brx: "मोनदों!",
    kha: "Ioh da!",
  },
  "game.spot.complete": {
    en: "Great focus and sharp attention!",
    as: "দারুণ মনোযোগ আৰু তীক্ষ্ণ দৃষ্টি!",
    brx: "मोजां सावराय आरो गेजेर नुजाथि!",
    kha: "Ka jingialang babha bad ka jingkhih!",
  },
  "game.sequence.watch": {
    en: "Watch the pattern...",
    as: "আৰ্হিটো চাওক...",
    brx: "ढालाय नायो...",
    kha: "Iohi ka pattern...",
  },
  "game.sequence.yourTurn": {
    en: "Your turn! Repeat the pattern.",
    as: "আপোনাৰ পাল! আৰ্হিটো পুনৰাবৃত্তি কৰক।",
    brx: "नोंथांनि सम! ढालाय मानना।",
    kha: "Ka por jong phi! Im ka pattern.",
  },
  "game.sequence.complete": {
    en: "Amazing pattern memory!",
    as: "অসাধাৰণ আৰ্হি স্মৃতিশক্তি!",
    brx: "गोब्राब ढालाय सोमोन्दो!",
    kha: "Ka jingialang pattern babha snam!",
  },
  "game.routine.timeline": {
    en: "Your Timeline (Morning to Night)",
    as: "আপোনাৰ সময়সূচী (ৰাতিপুৱাৰ পৰা ৰাতিলৈ)",
    brx: "नोंथांनि समफोर (सुबुं निफ्राय मोनाबनि)",
    kha: "Ka Jingwan (Mynstep haduh Miet)",
  },
  "game.routine.tapNext": {
    en: "Tap the next activity in your day:",
    as: "আপোনাৰ দিনৰ পৰৱৰ্তী কামটো টেপ কৰক:",
    brx: "नोंथांनि सान्नि उनसिम खामानि थाप हो:",
    kha: "Thoh ka kam kaba la ha ka sngi jong phi:",
  },
  "game.routine.step": {
    en: "Step",
    as: "পদক্ষেপ",
    brx: "थाखो",
    kha: "Thoh",
  },
  "game.routine.slot": {
    en: "Slot",
    as: "স্থান",
    brx: "बिमा",
    kha: "Jaka",
  },
  "game.routine.complete": {
    en: "You ordered your daily activities clearly from morning to night!",
    as: "আপুনি ৰাতিপুৱাৰ পৰা ৰাতিলৈ দৈনিক কাম স্পষ্টকৈ সজালে!",
    brx: "नों सुबुं निफ्राय मोनाबनि सान्नायफोर गेजेर लाइनाव दोनदों!",
    kha: "Phi lah pyniaid ki kam mynstep haduh miet!",
  },
  "game.family.recognize": {
    en: "Do you recognize this dear family member?",
    as: "আপুনি এই মৰমৰ পৰিয়ালৰ সদস্যক চিনি পায়নে?",
    brx: "नों बे मोजां हानजा सोरखौ सिनायथि हो नामा?",
    kha: "Phi tip ia une kynmaw?",
  },
  "game.family.yesRemember": {
    en: "Yes, I remember",
    as: "হয়, মনত আছে",
    brx: "ओं, मोनदों",
    kha: "Hooid, ngam tip",
  },
  "game.family.tellMe": {
    en: "Tell me who it is",
    as: "কওক কোন এওঁ",
    brx: "बुंथि हो सोर बे",
    kha: "Ong ia nga une tymmen",
  },
  "game.family.your": {
    en: "Your",
    as: "আপোনাৰ",
    brx: "नोंथांनि",
    kha: "Jong phi",
  },
  "game.family.nextMember": {
    en: "Next Family Member",
    as: "পৰৱৰ্তী পৰিয়ালৰ সদস্য",
    brx: "उनसिम हानजा",
    kha: "Kaba la kynmaw",
  },
  "game.family.complete": {
    en: "How lovely it is to see and remember our family!",
    as: "পৰিয়ালক চিনি পোৱাটো কিমান আনন্দৰ!",
    brx: "हानजानिखौ सिनायथि हो नायोब्ला मोजां मोन!",
    kha: "Ka babha ban tip ia ki kynmaw jong ngi!",
  },

  // ── Voice prompts ──
  "voice.correct": {
    en: "Correct!",
    as: "শুদ্ধ!",
    brx: "गेबें!",
    kha: "Bha!",
  },
  "voice.tryAgain": {
    en: "Try again!",
    as: "আকৌ চেষ্টা কৰক!",
    brx: "फिन नाजा!",
    kha: "Pyrshah biang!",
  },
  "voice.foundIt": {
    en: "Found it!",
    as: "পালে!",
    brx: "मोनदों!",
    kha: "Ioh da!",
  },
  "voice.goingBack": {
    en: "Going back",
    as: "উভতি যাওঁ আছো",
    brx: "थां फैगौ",
    kha: "Phai sha ing",
  },
  "voice.letsPlay": {
    en: "Let's play",
    as: "আহক খেলো",
    brx: "आव गेलेनो",
    kha: "Wan ia ka leng",
  },
  "voice.lookAtPhoto": {
    en: "Look at the photo of your family member",
    as: "আপোনাৰ পৰিয়ালৰ সদস্যৰ ফটো চাওক",
    brx: "नोंथांनि हानजा सोरनि फटो नायो",
    kha: "Iohi ka jingshisha jong ki kynmaw",
  },
  "voice.thisIs": {
    en: "This is",
    as: "এওঁ হ'ল",
    brx: "बे मा",
    kha: "Une ta u",
  },
  "voice.orderRoutine": {
    en: "Put your daily routine in order from morning to night",
    as: "আপোনাৰ দৈনিক ৰুটিন ৰাতিপুৱাৰ পৰা ৰাতিলৈ সজাওক",
    brx: "नोंथांनि सान्नायफोर सुबुं निफ्राय मोनाबनि ढालायनि रोदा दोन",
    kha: "Pyniaid ki kam sngi mynstep haduh miet",
  },
  "voice.lovelyFamily": {
    en: "How lovely to see family members!",
    as: "পৰিয়ালৰ সদস্যসকলক দেখি কিমান ভাল লাগিল!",
    brx: "हानजानि सोरफोरखौ नुहातलै मोजां मोनदों!",
    kha: "Ka babha ban iohi ki kynmaw!",
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

  // ── Routine items (expanded to 8 culturally familiar NER daily activities) ──
  "routine.wakeUp": {
    en: "Wake Up & Wash Face",
    as: "সাৰ পাই মুখ ধুই",
    brx: "गोसोख आरो मुग्रा सिरो",
    kha: "Jingiasaid bad Pynkhuid",
  },
  "routine.morningTea": {
    en: "Morning Tea",
    as: "ৰাতিপুৱাৰ চাহ",
    brx: "सुबुंनि सा",
    kha: "Sha Mynstep",
  },
  "routine.prayer": {
    en: "Morning Prayer / Walk",
    as: "ৰাতিপুৱাৰ প্ৰাৰ্থনা / খোজকাঢ়া",
    brx: "सुबुंनि फ्रायना / हान्था",
    kha: "Jingiaseng Mynstep / Jingsan",
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
    brx: "सुबुंनि हान्था",
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
  "routine.eveningTea": {
    en: "Evening Tea & Snacks",
    as: "সন্ধিয়াৰ চাহ আৰু জলপানি",
    brx: "बेलासिनि सा आरो जानाय",
    kha: "Sha Jingniut bad Jingbuh",
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
    brx: "खोमा",
    kha: "Jingiasaid",
  },

  // ── Period labels ──
  "period.morning": {
    en: "Morning",
    as: "ৰাতিপুৱা",
    brx: "सुबुं",
    kha: "Mynstep",
  },
  "period.afternoon": {
    en: "Afternoon",
    as: "দুপৰীয়া",
    brx: "सान्जा",
    kha: "Sngi",
  },
  "period.evening": {
    en: "Evening",
    as: "সন্ধিয়া",
    brx: "बेलासि",
    kha: "Jingniut",
  },
  "period.night": {
    en: "Night",
    as: "ৰাতি",
    brx: "मोनाब",
    kha: "Miet",
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
    game_memory_match: "hub.memory",
    game_spot_and_tap: "hub.attention",
    game_sequence_recall: "hub.sequence",
    game_routine_recall: "hub.routine",
    game_family_faces: "hub.family",
    tap_to_start: "game.start",
    well_done: "game.done",
    back: "game.back",
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
