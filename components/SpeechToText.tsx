"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MicrophoneIcon, StopIcon } from "@heroicons/react/24/solid";

interface SpeechToTextProps {
  onTranscript: (text: string) => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
  prototype: SpeechRecognition;
}

export default function SpeechToText({ onTranscript }: SpeechToTextProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [lastTranscriptTime, setLastTranscriptTime] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window.SpeechRecognition || window.webkitSpeechRecognition) as SpeechRecognitionConstructor | undefined;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = ""; // Empty string for auto language detection

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = Array.from(event.results)
            .map((result: SpeechRecognitionResult) => result[0])
            .map((result: SpeechRecognitionAlternative) => result.transcript)
            .join("");

          if (event.results[0].isFinal) {
            const now = Date.now();
            if (now - lastTranscriptTime > 1000) { // Only process if more than 1 second has passed
              onTranscript(transcript);
              setLastTranscriptTime(now);
            }
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          if (isListening) {
            setTimeout(() => {
              recognition.start();
            }, 100);
          }
        };

        setRecognition(recognition);
      }
    }
  }, [onTranscript, isListening, lastTranscriptTime]);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <Button
      onClick={toggleListening}
      className={`relative flex items-center gap-2 transition-all ${
        isListening ? "bg-red-500 hover:bg-red-600" : "bg-purple-600 hover:bg-purple-700"
      }`}
    >
      {isListening ? (
        <>
          <StopIcon className="h-5 w-5" />
          <div className="absolute -right-1 -top-1 h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
          </div>
        </>
      ) : (
        <MicrophoneIcon className="h-5 w-5" />
      )}
    </Button>
  );
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}