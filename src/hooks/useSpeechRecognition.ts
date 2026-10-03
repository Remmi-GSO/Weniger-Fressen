import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Normalizes speech recognition results across Android Chrome, iOS Safari and Desktop browsers.
 * Eliminates duplicate snapshots and repeated cumulative phrases.
 */
export function cleanSpeechRecognitionResults(results: any): string {
  if (!results || results.length === 0) return '';
  const phrases: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const item = results[i];
    const text = item[0]?.transcript?.trim();
    if (!text) continue;

    if (phrases.length === 0) {
      phrases.push(text);
      continue;
    }

    const last = phrases[phrases.length - 1];
    const normLast = last.toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();
    const normCurr = text.toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();

    // 1. Exact match / identical repetition
    if (normCurr === normLast) {
      phrases[phrases.length - 1] = text;
    }
    // 2. Current text is a cumulative extension of the previous phrase
    else if (normCurr.startsWith(normLast)) {
      phrases[phrases.length - 1] = text;
    }
    // 3. Current text is shorter than previous (e.g. flickering interim result)
    else if (normLast.startsWith(normCurr)) {
      // Keep previous
    }
    // 4. Truly a new distinct phrase/sentence
    else {
      phrases.push(text);
    }
  }

  let merged = phrases.join(' ').trim();

  // Additional safety pass: collapse any immediate consecutive duplicate phrases
  const phrasePattern = /\b(.{4,60}?)\s+\1\b/gi;
  let prev = '';
  let count = 0;
  while (phrasePattern.test(merged) && count < 10) {
    prev = merged;
    merged = merged.replace(phrasePattern, '$1');
    if (merged === prev) break;
    count++;
  }

  return merged;
}

export interface UseSpeechRecognitionOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  lang?: string;
  continuous?: boolean;
}

export function useSpeechRecognition(options?: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(options?.onTranscript);
  const isListeningRequestedRef = useRef(false);
  const baseTextRef = useRef('');
  const lastFullTextRef = useRef('');
  const restartTimerRef = useRef<any>(null);
  const safetyTimeoutRef = useRef<any>(null);

  useEffect(() => {
    onTranscriptRef.current = options?.onTranscript;
  }, [options?.onTranscript]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    isListeningRequestedRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // ignore
      }
    }
    setIsListening(false);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch {}
    }
  }, []);

  const initAndStartEngine = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = options?.lang || 'de-DE';
      recognition.continuous = options?.continuous ?? true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const cleanedSession = cleanSpeechRecognitionResults(event.results);
        const base = baseTextRef.current;
        const fullText = base ? `${base} ${cleanedSession}`.trim() : cleanedSession.trim();
        lastFullTextRef.current = fullText;

        let isFinal = false;
        if (event.results && event.results.length > 0) {
          isFinal = Boolean(event.results[event.results.length - 1]?.isFinal);
        }

        if (onTranscriptRef.current) {
          onTranscriptRef.current(fullText, isFinal);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          isListeningRequestedRef.current = false;
          setIsListening(false);
          setErrorMessage('Mikrofon-Zugriff verweigert. Bitte erlaube das Mikrofon im Browser.');
          return;
        }

        // 'no-speech' happens on pause/silence. If user still wants to speak, do not abort!
        if (e.error === 'no-speech') {
          return;
        }

        console.warn('Speech recognition warning:', e.error);
      };

      recognition.onend = () => {
        // If the user hasn't explicitly stopped, keep listening by restarting!
        if (isListeningRequestedRef.current) {
          // Carry over what was heard into the base text
          if (lastFullTextRef.current) {
            baseTextRef.current = lastFullTextRef.current;
          }

          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if (isListeningRequestedRef.current) {
              try {
                initAndStartEngine();
              } catch (err) {
                console.warn('Could not re-arm recognition engine:', err);
              }
            }
          }, 60);
          return;
        }

        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Speech engine start error:', err);
    }
  }, [options?.continuous, options?.lang]);

  const startListening = useCallback(
    (prefix: string = '', append: boolean = false) => {
      if (typeof window === 'undefined') return;
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setErrorMessage('Spracherkennung wird von diesem Browser leider nicht unterstützt.');
        return;
      }

      setErrorMessage(null);
      isListeningRequestedRef.current = true;
      baseTextRef.current = append ? prefix : '';
      lastFullTextRef.current = baseTextRef.current;

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch {}
      }

      // Safety: auto-stop after 2 minutes of continuous listening to conserve battery
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = setTimeout(() => {
        if (isListeningRequestedRef.current) {
          stopListening();
        }
      }, 120000);

      initAndStartEngine();
    },
    [initAndStartEngine, stopListening]
  );

  const toggleListening = useCallback(
    (currentValue: string = '', append: boolean = false) => {
      if (isListening || isListeningRequestedRef.current) {
        stopListening();
      } else {
        startListening(currentValue, append);
      }
    },
    [isListening, startListening, stopListening]
  );

  useEffect(() => {
    return () => {
      isListeningRequestedRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    errorMessage,
    startListening,
    stopListening,
    toggleListening,
  };
}
