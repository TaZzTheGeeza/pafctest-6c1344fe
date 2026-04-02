import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ShowcaseProps, ShowcasePlayer, ShowcaseCoach } from "./types";

type Person = (ShowcasePlayer | ShowcaseCoach) & { isCoach?: boolean };

export function ShowcaseCarousel({ teamName, players, coaches }: ShowcaseProps) {
  const people: Person[] = [
    ...players.map((p) => ({ ...p, isCoach: false })),
    ...coaches.map((c) => ({ ...c, number: 0, isCoach: true })),
  ];

  const [current, setCurrent] = useState(0);
  const person = people[current];
  const isCoach = person.isCoach;

  return (
    <div className="max-w-md mx-auto">
      {/* Card */}
      <div className="relative bg-card border border-border rounded-xl overflow-hidden">
        <div className="h-1 bg-gold-gradient" />

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            {/* Photo */}
            <div className="relative aspect-[3/4] overflow-hidden">
              <img
                src={person.photo}
                alt={person.name}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

              {/* Name overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                {"number" in person && !isCoach && (
                  <span className="font-display text-5xl font-bold text-primary/30 absolute right-6 bottom-12">
                    {(person as ShowcasePlayer).number}
                  </span>
                )}
                <h2 className="font-display text-3xl font-bold">{person.name}</h2>
                <p className="text-sm text-primary font-display tracking-widest uppercase">
                  {person.role}
                </p>

                {/* Stats for players */}
                {!isCoach && (
                  <div className="flex gap-6 mt-4">
                    {[
                      { label: "Apps", value: (person as ShowcasePlayer).appearances ?? 0 },
                      { label: "Goals", value: (person as ShowcasePlayer).goals ?? 0 },
                      { label: "Assists", value: (person as ShowcasePlayer).assists ?? 0 },
                      { label: "POTM", value: (person as ShowcasePlayer).potm ?? 0 },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xl font-bold">{value}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          size="icon"
          disabled={current === 0}
          onClick={() => setCurrent((c) => c - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-xs text-muted-foreground">
          {current + 1} / {people.length}
        </span>
        <Button
          variant="outline"
          size="icon"
          disabled={current === people.length - 1}
          onClick={() => setCurrent((c) => c + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
