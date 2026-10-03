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
  const prefixTextRef = useRef('');

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
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // ignore
      }
    }
    setIsListening(false);
    prefixTextRef.current = '';
  }, []);

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
      prefixTextRef.current = append ? prefix : '';

      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {
            // ignore
          }
        }

        const recognition = new SpeechRecognition();
        recognition.lang = options?.lang || 'de-DE';
        recognition.continuous = options?.continuous ?? true;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate(40);
            } catch {
              // ignore
            }
          }
        };

        recognition.onresult = (event: any) => {
          const cleaned = cleanSpeechRecognitionResults(event.results);
          const base = prefixTextRef.current;
          const fullText = base ? `${base} ${cleaned}`.trim() : cleaned.trim();

          let isFinal = false;
          if (event.results && event.results.length > 0) {
            isFinal = Boolean(event.results[event.results.length - 1]?.isFinal);
          }

          if (onTranscriptRef.current) {
            onTranscriptRef.current(fullText, isFinal);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e.error);
          if (e.error === 'not-allowed') {
            setErrorMessage('Mikrofon-Zugriff wurde verweigert. Bitte erlaube das Mikrofon in deinen Browser-Einstellungen.');
          } else if (e.error === 'no-speech') {
            // No speech detected, silently end
          } else {
            setErrorMessage(`Spracherkennung: ${e.error || 'Fehler'}`);
          }
          setIsListening(false);
          prefixTextRef.current = '';
        };

        recognition.onend = () => {
          setIsListening(false);
          prefixTextRef.current = '';
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.error('Failed to start speech recognition:', err);
        setIsListening(false);
        setErrorMessage('Konnte Spracherkennung nicht starten.');
      }
    },
    [options?.continuous, options?.lang]
  );

  const toggleListening = useCallback(
    (currentValue: string = '', append: boolean = false) => {
      if (isListening) {
        stopListening();
      } else {
        startListening(currentValue, append);
      }
    },
    [isListening, startListening, stopListening]
  );

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
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
