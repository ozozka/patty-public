"use client";

import { Logo } from "./Logo";

export function PhoneMockup() {
  return (
    <div className="relative">
      {/* Floating decorative elements */}
      <div
        className="absolute -left-16 top-10 z-10 animate-float-y"
        style={{ animationDelay: "0ms" }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 shadow-clay">
          <span className="text-2xl">🦴</span>
        </div>
      </div>

      <div
        className="absolute -right-12 bottom-20 z-10 animate-float-y"
        style={{ animationDelay: "500ms" }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-400 shadow-clay">
          <span className="text-xl">🐾</span>
        </div>
      </div>

      <div
        className="absolute -left-8 bottom-10 z-10 animate-float-y"
        style={{ animationDelay: "1000ms" }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-400 shadow-clay-sm">
          <span className="text-lg">❤️</span>
        </div>
      </div>

      {/* Main phone */}
      <div className="relative animate-fade-in-scale">
        {/* Phone body */}
        <div className="relative mx-auto h-[560px] w-[280px] rounded-[48px] border-[10px] border-gray-900 bg-gray-900 shadow-2xl dark:border-gray-700">
          {/* Dynamic island */}
          <div className="absolute left-1/2 top-2 h-7 w-24 -translate-x-1/2 rounded-full bg-gray-800 dark:bg-gray-700" />

          {/* Screen */}
          <div className="relative h-full overflow-hidden rounded-[38px] bg-gradient-to-b from-rose-50 to-rose-100 dark:from-rose-950/40 dark:to-rose-900/30">
            {/* App header */}
            <div className="flex items-center justify-between px-4 pt-8">
              <div className="flex items-center gap-2">
                <Logo size={32} />
                <span className="font-heading text-lg font-bold text-rose-600 dark:text-rose-400">
                  Patty
                </span>
              </div>
              <div className="h-2 w-2 rounded-full bg-rose-500" />
            </div>

            {/* Swipe cards area */}
            <div className="mt-4 px-3">
              <div className="relative h-[340px] rounded-3xl bg-white shadow-lg dark:bg-gray-800">
                {/* Card image placeholder */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-rose-200 to-orange-200 dark:from-rose-800 dark:to-orange-900/50">
                  <div className="flex h-full items-center justify-center">
                    <span className="text-6xl">🐕</span>
                  </div>
                </div>

                {/* Card info */}
                <div className="absolute bottom-0 left-0 right-0 rounded-b-3xl bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="font-heading text-xl font-bold text-white">
                        Max
                      </h3>
                      <p className="text-sm text-white/80">
                        Golden Retriever • 2 yaş
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        <span className="text-lg">✕</span>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 shadow-lg">
                        <span className="text-xl">❤️</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Like badge */}
                <div className="absolute left-4 top-8 -rotate-12 animate-fade-in-scale">
                  <div className="rounded-lg border-4 border-rose-500 bg-white/90 px-3 py-1">
                    <span className="font-heading text-2xl font-bold text-rose-500">
                      LOVE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom nav */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around rounded-b-[38px] bg-white/80 px-6 py-4 backdrop-blur-md dark:bg-gray-900/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                <span className="text-lg">🔥</span>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 shadow-clay">
                <span className="text-2xl">❤️</span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <span className="text-lg">💬</span>
              </div>
            </div>
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-1 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full bg-gray-700" />
        </div>

        {/* Reflection effect */}
        <div className="pointer-events-none absolute inset-0 rounded-[48px] bg-gradient-to-tr from-white/10 to-transparent" />
      </div>

      {/* Bottom decoration */}
      <div
        className="absolute -right-10 -top-5 z-10 animate-float-y"
        style={{ animationDelay: "2000ms" }}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400 shadow-clay">
          <span className="text-2xl">🎾</span>
        </div>
      </div>
    </div>
  );
}
