import React from 'react';
import { TEMPERAMENT_META } from '@/lib/turkish';
import type { Animal } from '@/lib/types';

export function TemperamentChart({ animal }: { animal: Animal }) {
  return (
    <section aria-labelledby="mizac-baslik" className="space-y-4">
      <h2 id="mizac-baslik" className="text-xl font-bold text-[var(--ink-karadeniz)]">
        Karakter ve mizaç
      </h2>

      <dl className="space-y-3">
        {TEMPERAMENT_META.map((item) => {
          const score = animal[item.key];
          const ariaLabel =
            score === null
              ? `${item.label}: Henüz denenmedi`
              : `${item.label}: 5 üzerinden ${score} (${score <= 2 ? item.low : score >= 4 ? item.high : 'Orta'})`;

          return (
            <div
              key={item.key}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-2.5 last:border-b-0 last:pb-0"
            >
              <dt className="text-[15px] font-medium text-[var(--ink-karadeniz)]">
                {item.label}
              </dt>
              <dd className="flex items-center gap-3" aria-label={ariaLabel}>
                {score === null ? (
                  <span className="text-sm italic text-[var(--ink-muted)]">
                    Henüz denenmedi
                  </span>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((dot) => (
                        <span
                          key={dot}
                          className={`h-3 w-3 rounded-full ${
                            dot <= score
                              ? 'bg-[var(--ink-karadeniz)]'
                              : 'bg-[var(--ink-karadeniz)]/15'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-[var(--ink-karadeniz)] w-8 text-right">
                      {score}/5
                    </span>
                  </>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="text-sm text-[var(--ink-muted)] leading-relaxed pt-1">
        Mizaç bilgisi, bakımevi personeli ve gönüllülerin gözlemine dayanır. Kesin değildir;
        tanışarak netleşir.
      </p>
    </section>
  );
}
