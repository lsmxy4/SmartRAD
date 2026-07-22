"use client";

import { useEffect, useRef, useState } from "react";
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/outline";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";

function authHeaders(): HeadersInit {
  const token = window.localStorage.getItem("accessToken") ?? window.sessionStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content: "안녕하세요! 연차, 급여, 근태 등 본인 정보에 대해 편하게 물어보세요.",
};

const CLOSED_BUTTON_SIZE = 56;
const DEFAULT_EDGE_OFFSET = 24;
const AVOIDANCE_GAP = 12;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rightOffset, setRightOffset] = useState(DEFAULT_EDGE_OFFSET);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // 닫힌 상태의 동그란 버튼이 페이지 하단 콘텐츠(페이지네이션 등)와 겹치면,
  // 페이지 레이아웃은 건드리지 않고 버튼만 딱 겹치지 않을 만큼 왼쪽으로 비켜준다.
  useEffect(() => {
    if (open) {
      setRightOffset(DEFAULT_EDGE_OFFSET);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const computeOffset = () => {
      const viewportWidth = window.innerWidth;
      const centerY = window.innerHeight - DEFAULT_EDGE_OFFSET - CLOSED_BUTTON_SIZE / 2;
      // 페이지네이션처럼 버튼이 여러 개 붙어 있는 경우 위젯의 원래 자리만 훑으면
      // 옆 버튼과 다시 겹칠 수 있으므로, 오른쪽 끝에서부터 넓게(최대 400px) 훑어서
      // 겹치는 컨트롤 중 가장 왼쪽 것 기준으로 한 번에 피한다. 버튼 사이 좁은 틈에서
      // 섣불리 멈추지 않도록 범위 전체를 끝까지 훑는다.
      const scanWidth = 400;
      const step = 12;

      let requiredOffset = DEFAULT_EDGE_OFFSET;
      for (let x = viewportWidth - DEFAULT_EDGE_OFFSET; x >= viewportWidth - DEFAULT_EDGE_OFFSET - scanWidth; x -= step) {
        const stack = document.elementsFromPoint(x, centerY);
        // 배경 div 등은 무시하고, 실제로 누를 수 있는 컨트롤(버튼/링크 등)과 겹칠 때만 회피한다.
        const hit = stack.find((el) => {
          if (container.contains(el)) return false;
          return el.closest("button, a, [role='button'], input, select") !== null;
        });
        if (hit) {
          const control = hit.closest("button, a, [role='button'], input, select") as HTMLElement;
          const rect = control.getBoundingClientRect();
          requiredOffset = Math.max(requiredOffset, viewportWidth - rect.left + AVOIDANCE_GAP);
        }
      }
      setRightOffset(requiredOffset);
    };

    computeOffset();
    window.addEventListener("scroll", computeOffset, true);
    window.addEventListener("resize", computeOffset);
    const interval = window.setInterval(computeOffset, 400);
    return () => {
      window.removeEventListener("scroll", computeOffset, true);
      window.removeEventListener("resize", computeOffset);
      window.clearInterval(interval);
    };
  }, [open]);

  const send = async () => {
    const message = input.trim();
    if (!message || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "AI 비서 응답을 가져오지 못했습니다.");
      }
      const data: { reply: string } = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: error instanceof Error ? error.message : "AI 비서 응답을 가져오지 못했습니다." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 z-[90] flex flex-col items-end transition-[right] duration-200"
      style={{ right: rightOffset }}
    >
      {open && (
        <div className="mb-3 flex h-[480px] w-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 bg-indigo-600 px-4 py-3 text-white">
            <span className="text-sm font-bold">SmartHR AI 비서</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="닫기" className="rounded-md p-1 hover:bg-white/10">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-400">답변을 준비하고 있어요...</div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-3">
            <div className="relative">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                placeholder="예: 연차 며칠 남았어?"
                className="w-full rounded-lg border border-slate-200 py-2 pl-3 pr-10 text-sm outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={send}
                disabled={loading || !input.trim()}
                className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md bg-indigo-600 text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="전송"
              >
                <PaperAirplaneIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-700"
        aria-label="AI 비서 열기"
      >
        {open ? <XMarkIcon className="h-6 w-6" /> : <ChatBubbleLeftRightIcon className="h-6 w-6" />}
      </button>
    </div>
  );
}
