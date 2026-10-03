import React from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Mic } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  currentValue?: string;
  appendMode?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  title?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  currentValue = '',
  appendMode = false,
  className = '',
  size = 'sm',
  title = 'Per Sprache einsprechen',
}) => {
  const { isListening, isSupported, errorMessage, toggleListening } = useSpeechRecognition({
    onTranscript: (text) => {
      onTranscript(text);
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSupported) {
      alert(
        'Spracherkennung wird von diesem Browser leider nicht unterstützt. Du kannst den Text einfach eintippen.'
      );
      return;
    }

    toggleListening(currentValue, appendMode);
  };

  const sizeClasses = {
    xs: 'w-7 h-7 p-1 text-xs',
    sm: 'w-8 h-8 p-1.5 text-xs',
    md: 'w-10 h-10 p-2 text-sm',
  };

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        className={`rounded-xl transition-all flex items-center justify-center shrink-0 ${sizeClasses[size]} ${
          isListening
            ? 'bg-rose-500 text-white shadow-md ring-4 ring-rose-400/30 animate-pulse'
            : 'text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 active:scale-95'
        } ${className}`}
        title={isListening ? 'Höre zu... Tippen zum Stoppen' : title}
        aria-label={isListening ? 'Sprachaufnahme beenden' : title}
      >
        {isListening ? (
          <Mic className={`${iconSizes[size]} animate-bounce`} />
        ) : (
          <Mic className={iconSizes[size]} />
        )}
      </button>

      {/* Pulsing indicator when listening */}
      {isListening && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
        </span>
      )}

      {/* Live recording tooltip */}
      {isListening && (
        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-stone-900/90 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg whitespace-nowrap shadow-lg z-50 flex items-center gap-1.5 animate-in fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
          <span>Höre zu... Jetzt sprechen!</span>
        </div>
      )}

      {/* Error notification tooltip */}
      {errorMessage && !isListening && (
        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-rose-800 text-white text-[10px] rounded-lg whitespace-nowrap shadow-lg z-50">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
