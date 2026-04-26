import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, ExternalLink, MapPin, Zap, Navigation } from "lucide-react";
import wildcatsLogo from "@/assets/wildcats-logo.png";

const FA_BOOKING_URL = "https://book.englandfootball.com/Book/e38c054b-8343-4c32-ba55-b743e9c117a9?venue=peterboroughathleticyouth0";

// Wildcats palette (from sticker artwork)
const TEAL = "#3DD9C8";
const BLUE = "#5B8DEF";
const PURPLE = "#8B6FE8";
const DEEP_PURPLE = "#2D1B5E";
const PINK = "#FF4D7E";
const YELLOW = "#FFD23F";
const RED = "#E74C3C";

// Sticker text — chunky rounded letters with white outline + drop shadow
function Sticker({
  children,
  color,
  className = "",
  rotate = 0,
}: {
  children: React.ReactNode;
  color: string;
  className?: string;
  rotate?: number;
}) {
  return (
    <span
      className={`inline-block font-black tracking-tight ${className}`}
      style={{
        color,
        WebkitTextStroke: "6px white",
        paintOrder: "stroke fill",
        filter: `drop-shadow(0 6px 0 ${DEEP_PURPLE}) drop-shadow(0 10px 20px rgba(45,27,94,0.35))`,
        transform: `rotate(${rotate}deg)`,
        fontFamily: "'Fredoka', 'Baloo 2', system-ui, sans-serif",
        letterSpacing: "-0.02em",
      }}
    >
      {children}
    </span>
  );
}

export default function WildcatsPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${BLUE} 50%, ${PURPLE} 100%)` }}>
      {/* Google fonts for sticker typography */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Baloo+2:wght@700;800&display=swap"
        rel="stylesheet"
      />

      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Floating sticker decorations (hidden on small screens) */}
        <div className="hidden md:block absolute top-32 left-[8%] animate-[float_6s_ease-in-out_infinite]">
          <Sticker color={PINK} className="text-5xl lg:text-6xl" rotate={-8}>
            Play
            <br />
            Football
          </Sticker>
        </div>
        <div className="hidden md:block absolute top-36 right-[10%] animate-[float_7s_ease-in-out_infinite_0.5s]">
          <Sticker color={TEAL} className="text-5xl lg:text-6xl" rotate={6}>
            Have
            <br />
            Fun!
          </Sticker>
        </div>
        <div className="hidden md:block absolute top-[58%] right-[6%] animate-[float_5.5s_ease-in-out_infinite_1s]">
          <Sticker color={PURPLE} className="text-5xl lg:text-6xl" rotate={-4}>
            Make
            <br />
            Friends
          </Sticker>
        </div>

        {/* Decorative shapes */}
        <div
          className="hidden md:block absolute top-24 left-[28%] w-16 h-8 rounded-t-full"
          style={{
            background: `linear-gradient(180deg, ${PURPLE}, ${PINK}, ${YELLOW}, ${TEAL})`,
            border: `4px solid white`,
            boxShadow: `0 4px 0 ${DEEP_PURPLE}`,
            transform: "rotate(-12deg)",
          }}
        />
        <div
          className="hidden md:block absolute top-[55%] left-[18%] w-12 h-12 rounded-full bg-white border-4"
          style={{ borderColor: DEEP_PURPLE, boxShadow: `0 4px 0 ${DEEP_PURPLE}` }}
        >
          <div className="w-full h-full rounded-full" style={{
            background: "radial-gradient(circle at 30% 30%, white 30%, transparent 31%), conic-gradient(from 0deg, white 0 20%, " + DEEP_PURPLE + " 20% 25%, white 25% 45%, " + DEEP_PURPLE + " 45% 50%, white 50% 70%, " + DEEP_PURPLE + " 70% 75%, white 75% 95%, " + DEEP_PURPLE + " 95% 100%)",
          }} />
        </div>
        <Zap
          className="hidden md:block absolute top-[40%] right-[36%] h-14 w-14 animate-[float_4s_ease-in-out_infinite_0.3s]"
          style={{
            color: RED,
            stroke: "white",
            strokeWidth: 1.5,
            fill: RED,
            filter: `drop-shadow(0 4px 0 ${DEEP_PURPLE})`,
            transform: "rotate(15deg)",
          }}
        />

        {/* Center content */}
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <img
              src={wildcatsLogo}
              alt="FA Wildcats Girls' Football"
              className="mx-auto h-56 md:h-72 lg:h-80 w-auto mb-8 animate-[float_5s_ease-in-out_infinite]"
              style={{ filter: `drop-shadow(0 16px 32px rgba(45,27,94,0.45))` }}
            />
            <p
              className="text-xl md:text-2xl font-bold mb-10 max-w-xl mx-auto"
              style={{
                color: "white",
                textShadow: `2px 2px 0 ${DEEP_PURPLE}, 0 4px 12px rgba(45,27,94,0.4)`,
                fontFamily: "'Fredoka', system-ui, sans-serif",
              }}
            >
              An FA initiative for girls aged 5–11 to play, learn and have fun in a safe, friendly environment.
            </p>

            <a href={FA_BOOKING_URL} target="_blank" rel="noopener noreferrer" className="inline-block">
              <button
                className="group relative px-8 py-5 rounded-full text-xl font-black transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: PINK,
                  color: "white",
                  border: `4px solid white`,
                  boxShadow: `0 8px 0 ${DEEP_PURPLE}, 0 14px 30px rgba(45,27,94,0.4)`,
                  fontFamily: "'Fredoka', 'Baloo 2', system-ui, sans-serif",
                  letterSpacing: "0.02em",
                }}
              >
                <span className="flex items-center gap-2">
                  Book via The FA <ExternalLink className="h-5 w-5" />
                </span>
              </button>
            </a>
            <p className="text-sm mt-4 font-semibold" style={{ color: "white", textShadow: `1px 1px 0 ${DEEP_PURPLE}` }}>
              All bookings are managed through the official FA Wildcats portal
            </p>
          </div>
        </div>
      </section>

      {/* Session details — sticker cards */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Sticker color={YELLOW} className="text-4xl md:text-5xl">
              Session Details
            </Sticker>
          </div>
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Calendar, label: "When", value: "Every Thursday", color: PINK, href: null },
              { icon: Clock, label: "Time", value: "1730 – 1830", color: TEAL, href: null },
              { icon: Users, label: "Ages", value: "Girls 5 – 11", color: PURPLE, href: null },
              {
                icon: Navigation,
                label: "Where",
                value: "Itter Park",
                color: YELLOW,
                href: "https://share.google/TY1FK0vA79qvStxjJ",
              },
            ].map(({ icon: Icon, label, value, color, href }, i) => {
              const rotations = [-2, 1, -1, 2];
              const card = (
                <div
                  className="rounded-3xl p-6 text-center transition-transform hover:-translate-y-2 h-full"
                  style={{
                    background: "white",
                    border: `5px solid ${DEEP_PURPLE}`,
                    boxShadow: `0 10px 0 ${DEEP_PURPLE}, 0 18px 40px rgba(45,27,94,0.25)`,
                    transform: `rotate(${rotations[i]}deg)`,
                  }}
                >
                  <div
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{
                      background: color,
                      border: `4px solid ${DEEP_PURPLE}`,
                      boxShadow: `0 4px 0 ${DEEP_PURPLE}`,
                    }}
                  >
                    <Icon className="h-8 w-8 text-white" strokeWidth={2.5} />
                  </div>
                  <p
                    className="text-xs font-black tracking-widest uppercase mb-2"
                    style={{ color: DEEP_PURPLE, fontFamily: "'Fredoka', system-ui, sans-serif" }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-xl font-black"
                    style={{ color: DEEP_PURPLE, fontFamily: "'Baloo 2', system-ui, sans-serif" }}
                  >
                    {value}
                  </p>
                  {href && (
                    <p
                      className="text-xs font-bold mt-2 inline-flex items-center gap-1"
                      style={{ color: DEEP_PURPLE, fontFamily: "'Fredoka', system-ui, sans-serif" }}
                    >
                      Get directions <ExternalLink className="h-3 w-3" />
                    </p>
                  )}
                </div>
              );
              return href ? (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="block">
                  {card}
                </a>
              ) : (
                <div key={label}>{card}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What to expect */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Sticker color={PINK} className="text-4xl md:text-5xl">
              What To Expect
            </Sticker>
          </div>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {[
              { title: "Fun First", desc: "A welcoming, pressure-free environment focused on enjoyment and friendships.", color: TEAL },
              { title: "Learn To Play", desc: "Develop football skills through age-appropriate games and activities.", color: PINK },
              { title: "Make Friends", desc: "Meet other girls who love football and build lasting connections.", color: PURPLE },
              { title: "FA Approved", desc: "Delivered by FA-qualified coaches following the official Wildcats programme.", color: YELLOW },
            ].map(({ title, desc, color }, i) => (
              <div
                key={title}
                className="rounded-3xl p-6 transition-transform hover:-translate-y-1"
                style={{
                  background: "white",
                  border: `5px solid ${DEEP_PURPLE}`,
                  boxShadow: `0 8px 0 ${DEEP_PURPLE}, 0 14px 30px rgba(45,27,94,0.2)`,
                  transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)`,
                }}
              >
                <div
                  className="inline-block px-4 py-1 rounded-full mb-3 text-white font-black text-sm tracking-wide"
                  style={{
                    background: color,
                    border: `3px solid ${DEEP_PURPLE}`,
                    boxShadow: `0 3px 0 ${DEEP_PURPLE}`,
                    fontFamily: "'Fredoka', system-ui, sans-serif",
                  }}
                >
                  {title.toUpperCase()}
                </div>
                <p
                  className="text-base font-semibold leading-snug"
                  style={{ color: DEEP_PURPLE, fontFamily: "'Fredoka', system-ui, sans-serif" }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking CTA */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6">
            <Sticker color={TEAL} className="text-4xl md:text-6xl">
              Ready To Join?
            </Sticker>
          </div>
          <p
            className="max-w-2xl mx-auto mb-10 text-lg font-semibold"
            style={{
              color: "white",
              textShadow: `2px 2px 0 ${DEEP_PURPLE}`,
              fontFamily: "'Fredoka', system-ui, sans-serif",
            }}
          >
            Bookings for our Wildcats sessions are handled directly by The FA. Tap below to find PAFC on the official Wildcats finder.
          </p>
          <a href={FA_BOOKING_URL} target="_blank" rel="noopener noreferrer" className="inline-block">
            <button
              className="px-10 py-6 rounded-full text-2xl font-black transition-transform hover:scale-105 active:scale-95"
              style={{
                background: YELLOW,
                color: DEEP_PURPLE,
                border: `5px solid white`,
                boxShadow: `0 10px 0 ${DEEP_PURPLE}, 0 18px 40px rgba(45,27,94,0.4)`,
                fontFamily: "'Fredoka', 'Baloo 2', system-ui, sans-serif",
              }}
            >
              <span className="flex items-center gap-3">
                Book on The FA Site <ExternalLink className="h-6 w-6" />
              </span>
            </button>
          </a>
          <p
            className="text-sm mt-6 font-bold flex items-center justify-center gap-2"
            style={{ color: "white", textShadow: `1px 1px 0 ${DEEP_PURPLE}` }}
          >
            <MapPin className="h-4 w-4" /> Search for "Peterborough Athletic FC" on the FA portal
          </p>
        </div>
      </section>

      <Footer />

      {/* Float animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
          50% { transform: translateY(-12px) rotate(var(--r, 0deg)); }
        }
      `}</style>
    </div>
  );
}
