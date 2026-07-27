import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Link } from "react-router-dom";

const GUIDE_SECTIONS = [
  { id: "start-here", label: "Start Here" },
  { id: "survival-mode", label: "Survival Mode" },
  { id: "fighting-mode", label: "Fighting Mode" },
  { id: "mini-tasks", label: "Mini Tasks & EXP" },
  { id: "world-discovery", label: "The World" },
  { id: "gathering", label: "Gathering & Building" },
  { id: "economy", label: "Economy & Trading" },
  { id: "quick-tips", label: "Quick Tips" },
];

export function HowToPlayPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <img
        src="/map.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/75 md:bg-gradient-to-r md:from-black/80 md:via-black/60 md:to-black/70" />

      <header className="absolute left-1/2 top-4 z-50 w-[92%] max-w-7xl -translate-x-1/2 sm:top-5">
        <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl sm:px-6 md:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 md:gap-8">
              <h1 className="text-xl font-serif tracking-[0.18em] text-white sm:text-2xl">
                <Link to="/" className="">
                  STABLEREALMS
                </Link>
              </h1>

              <nav className="hidden items-center gap-6 text-sm font-semibold text-white/95 md:flex">
                <Link to="/how-to-play" className="">
                  How to Play
                </Link>
                <Link
                  to="/wallet"
                  className="transition-colors hover:text-white"
                >
                  Wallet
                </Link>
              </nav>
            </div>

            <div className="hidden items-center gap-4 md:flex">
              <a
                href="#"
                className="text-white/90 hover:text-white"
                aria-label="Community"
              >
                <MessageCircle size={16} />
              </a>
              <a
                href="#"
                className="text-white/90 hover:text-white"
                aria-label="Announcements"
              >
                <Send size={16} />
              </a>
              <Link
                to="/wallet"
                className="rounded-xl border border-amber-800/50 bg-orange-500 px-8 py-2.5 text-sm font-black text-slate-900 shadow-xl transition hover:bg-orange-400"
              >
                Connect
              </Link>
            </div>

            <button
              type="button"
              className="rounded-lg border border-white/30 px-3 py-2 text-sm font-bold text-white md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="mt-4 space-y-3 rounded-xl border border-white/20   p-3 md:hidden">
              <Link
                to="/how-to-play"
                className="block rounded-lg px-2 py-2 text-sm font-semibold text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                How to Play
              </Link>

              <Link
                to="/wallet"
                className="block rounded-lg px-2 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                Connect / Wallet
              </Link>
              <Link
                to="/"
                className="block rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-center text-sm font-black text-white hover:bg-white/20"
                onClick={() => setMobileMenuOpen(false)}
              >
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="relative z-20 mx-auto flex w-[92%] max-w-7xl flex-col gap-4 px-1 pb-6 pt-28 sm:pt-32 lg:flex-row lg:items-start">
        <aside className="w-full rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-xl lg:sticky lg:top-6 lg:w-72 lg:shrink-0">
          <p className="mb-2 text-xs font-black tracking-[0.2em] text-white/85">
            HOW TO PLAY
          </p>
          <nav className="space-y-1">
            {GUIDE_SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block rounded-xl px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                {section.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="w-full space-y-4">
          <section className="rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:p-6">
            <p className="text-xs font-black tracking-[0.18em] text-white/75">
              PLAYER GUIDE
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-[0.14em] text-white sm:text-5xl">
              HOW TO PLAY STABLEREALMS
            </h1>
            <p className="mt-4 max-w-3xl text-base font-semibold text-white/90 sm:text-2xl">
              A practical player guide from first spawn to combat mastery,
              written around how this game actually works right now.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-black uppercase text-white/85 sm:grid-cols-5 sm:gap-3">
              <div className="rounded-xl border border-white/15 bg-black/40 p-2">
                🌲 Forests
              </div>
              <div className="rounded-xl border border-white/15 bg-black/40 p-2">
                ⛏️ Mines
              </div>
              <div className="rounded-xl border border-white/15 bg-black/40 p-2">
                ⚔️ Fight
              </div>
              <div className="rounded-xl border border-white/15 bg-black/40 p-2">
                🧱 Build
              </div>
              <div className="rounded-xl border border-white/15 bg-black/40 p-2">
                🎯 Tasks
              </div>
            </div>
          </section>

          <section
            id="start-here"
            className="rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:p-6"
          >
            <h2 className="text-3xl font-black tracking-wide text-white">
              START HERE: YOUR FIRST HOUR
            </h2>
            <p className="mt-3 text-lg font-semibold text-white/90">
              1) Hit Play Now and let the world load fully. 2) Start in Survival
              Mode and learn movement first (WASD / arrows). 3) Walk to nearby
              landmarks and NPCs before taking fights.
            </p>
            <p className="mt-3 text-base font-semibold text-white/80">
              You do not need to rush combat. Early progress is faster when you
              mix exploration, gathering, and mini tasks. Use camera rotate and
              zoom often so you do not get trapped by terrain.
            </p>
            <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-950/20 px-4 py-3 text-sm font-semibold text-emerald-100">
              Tip: Learn the map landmarks first (pond, lake, farm, carnival,
              mine) before switching to Fighting Mode.
            </div>
          </section>

          <section
            id="survival-mode"
            className="rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:p-6"
          >
            <h2 className="text-3xl font-black tracking-wide text-white">
              SURVIVAL MODE
            </h2>
            <p className="mt-3 text-lg font-semibold text-white/90">
              Survival Mode is your economy and map-progression loop. This is
              where you gather resources, interact with NPCs, complete discovery
              objectives, and stack safe EXP.
            </p>
            <p className="mt-3 text-base font-semibold text-white/80">
              Controls that matter most here: left-click for mining/gathering, E
              near NPCs to interact, right-click drag to pan camera, wheel to
              zoom and scout around obstacles.
            </p>
          </section>

          <section
            id="fighting-mode"
            className="rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:p-6"
          >
            <h2 className="text-3xl font-black tracking-wide text-white">
              FIGHTING MODE
            </h2>
            <p className="mt-3 text-lg font-semibold text-white/90">
              Fighting Mode spawns monster waves. Press P (or click the slice
              button) to attack. Pressure scales over time, so spacing and
              timing matter more than button mashing.
            </p>
            <p className="mt-3 text-base font-semibold text-white/80">
              Keep moving in diagonals, pull packs into open areas, then slice
              in controlled bursts. If your HP drops, disengage, reposition, and
              re-enter on your timing.
            </p>
            <div className="mt-4 grid gap-2 text-sm font-bold text-white/90 sm:grid-cols-2">
              <div className="rounded-xl border border-white/15 bg-black/40 p-3">
                Zombie: +1 EXP
              </div>
              <div className="rounded-xl border border-white/15 bg-black/40 p-3">
                Wolf: +2 EXP
              </div>
              <div className="rounded-xl border border-white/15 bg-black/40 p-3">
                Goblin: +3 EXP
              </div>
              <div className="rounded-xl border border-white/15 bg-black/40 p-3">
                Bear: +4 EXP
              </div>
              <div className="rounded-xl border border-white/15 bg-black/40 p-3 sm:col-span-2">
                Elite Boss: +5 EXP
              </div>
            </div>
          </section>

          <section
            id="mini-tasks"
            className="rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:p-6"
          >
            <h2 className="text-3xl font-black tracking-wide text-white">
              MINI TASKS & EXP
            </h2>
            <p className="mt-3 text-lg font-semibold text-white/90">
              Mini tasks rotate while you play and usually reward +10 EXP. They
              are the most consistent leveling source because they chain
              naturally with movement and map discovery.
            </p>
            <p className="mt-3 text-base font-semibold text-white/80">
              Best loop: complete 1-2 mini tasks in Survival, switch to Fighting
              for short wave farming, then return to Survival to refill progress
              and reduce risk.
            </p>
          </section>

          <section
            id="world-discovery"
            className="rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:p-6"
          >
            <h2 className="text-3xl font-black tracking-wide text-white">
              THE WORLD
            </h2>
            <p className="mt-3 text-lg font-semibold text-white/90">
              Discover landmarks to progress exploration. Important places
              include the village pond, fishing lake, cow farm, carnival,
              stables, and mine entrance.
            </p>
            <p className="mt-3 text-base font-semibold text-white/80">
              Treat landmarks as safe route anchors. Plan short runs between
              them so you are always near known terrain and easier exits.
            </p>
          </section>

          <section
            id="gathering"
            className="rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:p-6"
          >
            <h2 className="text-3xl font-black tracking-wide text-white">
              GATHERING & BUILDING
            </h2>
            <p className="mt-3 text-lg font-semibold text-white/90">
              Mine stone and ore, chop logs, pick herbs and crops, and place
              blocks while in build mode. Gathering gives gold and EXP, and
              supports your long-term progression.
            </p>
            <p className="mt-3 text-base font-semibold text-white/80">
              Higher-value nodes (like gold/crystal and treasure) are strong EXP
              and gold spikes. Sweep low-risk areas first, then take deeper
              runs.
            </p>
          </section>

          <section
            id="economy"
            className="rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:p-6"
          >
            <h2 className="text-3xl font-black tracking-wide text-white">
              ECONOMY & TRADING
            </h2>
            <p className="mt-3 text-lg font-semibold text-white/90">
              Gold comes from gathering and combat. Use NPC interactions and
              future wallet features to expand your trading path.
            </p>
            <p className="mt-3 text-base font-semibold text-white/80">
              Stable economy flow: gather base materials continuously, convert
              combat time into bonus gold/EXP, and avoid long death-prone runs.
            </p>
          </section>

          <section
            id="quick-tips"
            className="rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:p-6"
          >
            <h2 className="text-3xl font-black tracking-wide text-white">
              QUICK TIPS
            </h2>
            <div className="mt-3 space-y-2 text-base font-semibold text-white/85">
              <p>1) Start every session in Survival to build safe momentum.</p>
              <p>
                2) Keep mini tasks active at all times for constant EXP flow.
              </p>
              <p>
                3) Use Fighting in controlled bursts; do not overstay low HP.
              </p>
              <p>
                4) Camera rotate + zoom is free awareness. Use it constantly.
              </p>
              <p>
                5) If movement feels blocked, pan and re-approach from a new
                angle.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
