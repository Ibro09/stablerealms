import { Sword } from "lucide-react";
import { TopNavbar } from "./TopNavbar";

export default function Hero({
  onPlay,
  isLoading = false,
}: {
  onPlay: () => void;
  isLoading?: boolean;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background */}
      <img
        src="/map.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/70 md:bg-gradient-to-r md:from-black/80 md:via-black/45 md:to-transparent" />

      <TopNavbar floating={true} />

      {/* Hero */}
      <section className="relative z-20 flex min-h-screen items-center pt-32 pb-10 sm:pt-36 sm:pb-14 md:pt-28">
        <div className="mx-auto flex w-[92%] max-w-7xl">
          <div className="max-w-xl md:max-w-2xl">
            <h1 className="font-serif text-4xl leading-none tracking-[0.24em] sm:text-5xl md:text-6xl">
              STABLEREALMS
            </h1>

            <div className="my-5 h-px w-full bg-white/20 sm:my-6" />

            <p className="text-lg leading-relaxed text-white/85 sm:text-2xl md:text-3xl">
              An isometric MMO where you explore, gather resources, complete
              quests, and earn rewards with friends.
            </p>

            <div className="mt-6 inline-flex max-w-xl rounded-2xl border border-amber-300/30 bg-black/35 px-4 py-3 text-sm text-amber-100/95 backdrop-blur-md sm:mt-8 sm:text-base">
              Best experienced on a big screen. Small screens can browse the
              website, but gameplay is locked.
            </div>

            {/* Buttons */}

            <div className="mt-8 flex flex-col gap-4 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-5">
              <button
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-orange-500 px-6 py-4 text-xl font-bold shadow-xl transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:scale-100 sm:w-auto sm:px-8 sm:py-4 sm:text-2xl md:px-10 md:py-5 md:text-3xl"
                disabled={isLoading}
                onClick={() => {
                  onPlay();
                }}
              >
                <Sword size={28} />
                {isLoading ? "Loading..." : "Play Now"}
              </button>
            </div>

            {/* Stats */}

            <div className="mt-8 flex gap-4 sm:mt-10"></div>

            {/* Contract */}

            {/* <div className="mt-5 flex items-center justify-between rounded-2xl bg-black/60 px-6 py-4 backdrop-blur-lg">
              <span className="truncate text-white/70">
                CA:
                Tq3jyFaagrg7oorpQKVGYR5Zr96RFTanwWfth9bpump
              </span>

              <Copy className="cursor-pointer" />
            </div> */}

            {/* Bottom Cards */}
          </div>
        </div>
      </section>
    </main>
  );
}
