"use client";

export type KanchhiVoiceRecognitionResult = {
  transcript: string;
  isFinal: boolean;
};

export type KanchhiVoiceSupport = {
  recognition: boolean;
  synthesis: boolean;
};

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = Event & {
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = Event & {
  error?: string;
  message?: string;
};

export type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror:
    ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult:
    ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor =
  new () => SpeechRecognitionInstance;

function getRecognitionConstructor():
  SpeechRecognitionConstructor | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  const browserWindow =
    window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

  return (
    browserWindow.SpeechRecognition ||
    browserWindow.webkitSpeechRecognition ||
    null
  );
}

export function getKanchhiVoiceSupport():
  KanchhiVoiceSupport {
  if (
    typeof window ===
    "undefined"
  ) {
    return {
      recognition: false,
      synthesis: false,
    };
  }

  return {
    recognition:
      getRecognitionConstructor() !== null,

    synthesis:
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window,
  };
}

export function createKanchhiSpeechRecognition(
  language = "en-US",
): SpeechRecognitionInstance | null {
  const Constructor =
    getRecognitionConstructor();

  if (!Constructor) {
    return null;
  }

  const recognition =
    new Constructor();

  recognition.continuous =
    false;

  recognition.interimResults =
    true;

  recognition.lang =
    language;

  recognition.maxAlternatives =
    1;

  return recognition;
}

export function speakKanchhi(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voiceName?: string;
  },
): boolean {
  if (
    typeof window ===
    "undefined" ||
    !("speechSynthesis" in window)
  ) {
    return false;
  }

  const cleaned =
    text.trim();

  if (!cleaned) {
    return false;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        cleaned,
      );

    utterance.rate =
      options?.rate ?? 1;

    utterance.pitch =
      options?.pitch ?? 1;

    utterance.volume =
      options?.volume ?? 1;

    if (
      options?.voiceName
    ) {
      const voices =
        window.speechSynthesis.getVoices();

      const matched =
        voices.find(
          (voice) =>
            voice.name ===
            options.voiceName,
        );

      if (matched) {
        utterance.voice =
          matched;
      }
    }

    window.speechSynthesis.speak(
      utterance,
    );

    return true;
  } catch {
    return false;
  }
}

export function stopKanchhiSpeaking(): void {
  if (
    typeof window ===
      "undefined" ||
    !("speechSynthesis" in window)
  ) {
    return;
  }

  window.speechSynthesis.cancel();
}

export function isKanchhiSpeaking(): boolean {
  if (
    typeof window ===
      "undefined" ||
    !("speechSynthesis" in window)
  ) {
    return false;
  }

  return (
    window.speechSynthesis.speaking
  );
}