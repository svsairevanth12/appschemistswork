"use client";

import CodeViewer from "@/components/code-viewer";
import { useScrollTo } from "@/hooks/use-scroll-to";
import { ArrowLongRightIcon } from "@heroicons/react/20/solid";
import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useState, KeyboardEvent } from "react";
import LoadingDots from "../../components/loading-dots";
import SpeechToText from "@/components/SpeechToText";
import { Button } from "@/components/ui/button";

function removeCodeFormatting(code: string): string {
  return code.replace(/```(?:typescript|javascript|tsx)?\n([\s\S]*?)```/g, '$1').trim();
}

interface Message {
  role: string;
  content: string;
}

export default function Home() {
  const [status, setStatus] = useState<
    "initial" | "creating" | "created" | "updating" | "updated"
  >("initial");
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [ref, scrollTo] = useScrollTo();
  const [messages, setMessages] = useState<Message[]>([]);

  const loading = status === "creating" || status === "updating";

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!prompt.trim()) return;

    if (status !== "initial") {
      scrollTo({ delay: 0.5 });
    }

    setStatus("creating");
    setGeneratedCode("");

    const res = await fetch("/api/generateCode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash-exp",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    if (!res.body) {
      throw new Error("No response body");
    }

    const reader = res.body.getReader();
    let receivedData = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      receivedData += new TextDecoder().decode(value);
      const cleanedData = removeCodeFormatting(receivedData);
      setGeneratedCode(cleanedData);
    }

    setMessages([{ role: "user", content: prompt }]);
    setStatus("created");
  };

  const handleSpeechInput = (transcript: string) => {
    setPrompt((prev) => prev + ' ' + transcript);
  };

  useEffect(() => {
    const el = document.querySelector(".cm-scroller");
    if (el && loading) {
      const end = el.scrollHeight - el.clientHeight;
      el.scrollTo({ top: end });
    }
  }, [loading, generatedCode]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-gradient-to-b from-gray-900 to-black text-center">
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="relative mt-16 w-full max-w-5xl px-4">
        <h1 className="mx-auto mb-8 max-w-3xl bg-gradient-to-r from-purple-400 via-orange-500 to-purple-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
          What do you want to build?
        </h1>

        <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-400">
          Prompt, run, edit, and deploy full-stack web apps in seconds
        </p>

        <form className="w-full" onSubmit={handleSubmit}>
          <fieldset disabled={loading} className="disabled:opacity-75">
            <div className="relative">
              <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-purple-600 to-orange-600 opacity-75 blur transition duration-1000 group-hover:opacity-100" />
              <div className="relative flex overflow-hidden rounded-3xl bg-gray-900 shadow-2xl">
                <div className="relative flex flex-grow items-stretch focus-within:z-10">
                  <textarea
                    rows={3}
                    required
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={handleKeyPress}
                    name="prompt"
                    className="w-full resize-none bg-transparent px-6 py-5 text-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Build me a calculator app..."
                  />
                </div>
                <div className="flex items-center gap-2 px-4">
                  <SpeechToText onTranscript={handleSpeechInput} />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="relative inline-flex items-center gap-x-1.5 bg-purple-600 px-6 text-sm font-semibold text-gray-200 transition-colors hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-600"
                  >
                    {status === "creating" ? (
                      <LoadingDots color="white" style="large" />
                    ) : (
                      <>
                        <span>Send</span>
                        <ArrowLongRightIcon className="size-6" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </fieldset>
        </form>
      </div>

      {status !== "initial" && (
        <motion.div
          initial={{ height: 0 }}
          animate={{
            height: "auto",
            overflow: "hidden",
            transitionEnd: { overflow: "visible" },
          }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          className="w-full flex-1 px-4 pb-[10vh] pt-16"
          onAnimationComplete={() => scrollTo()}
          ref={ref}
        >
          <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
            <div className="isolate">
              <CodeViewer code={generatedCode} showEditor />
            </div>

            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={status === "updating" ? { x: "100%" } : undefined}
                  animate={status === "updating" ? { x: "0%" } : undefined}
                  exit={{ x: "100%" }}
                  transition={{
                    type: "spring",
                    bounce: 0,
                    duration: 0.85,
                    delay: 0.5,
                  }}
                  className="absolute inset-x-0 bottom-0 top-1/2 flex items-center justify-center rounded-r border border-gray-800 bg-gradient-to-br from-gray-900 to-black md:inset-y-0 md:left-1/2 md:right-0"
                >
                  <p className="animate-pulse bg-gradient-to-r from-purple-400 to-orange-500 bg-clip-text text-3xl font-bold text-transparent">
                    {status === "creating"
                      ? "Building your app..."
                      : "Updating your app..."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </main>
  );
}