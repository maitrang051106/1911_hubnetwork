import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Flower2, X } from 'lucide-react';
import type { Member } from '../data/members';

interface MemberSpotlightModalProps {
  member: Member;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function MemberSpotlightModal({
  member,
  total,
  onClose,
  onPrev,
  onNext,
}: MemberSpotlightModalProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [member.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 sm:p-6 md:p-10 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spotlight-member-name"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto valley-scroll rounded-xl border border-[#f5efe2]/15 bg-[#080a10] text-[#f5efe2] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar inside modal */}
        <div className="flex items-center justify-between gap-4 border-b border-[#f5efe2]/12 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3 text-xs tracking-[0.16em] uppercase text-[#f5efe2]/65">
            <span className="tabular-nums">
              HUB Network · {member.index} / {String(total).padStart(2, '0')}
            </span>
            <span aria-hidden="true">·</span>
            <span>19 Tháng 11</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrev}
              aria-label="Thành viên trước"
              className="grid h-9 w-9 place-items-center rounded-full border border-[#f5efe2]/20 text-[#f5efe2]/80 transition-colors hover:border-[#f5efe2] hover:text-[#f5efe2]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Thành viên tiếp theo"
              className="grid h-9 w-9 place-items-center rounded-full border border-[#f5efe2]/20 text-[#f5efe2]/80 transition-colors hover:border-[#f5efe2] hover:text-[#f5efe2]"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="ml-2 grid h-9 w-9 place-items-center rounded-full border border-[#f5efe2]/20 text-[#f5efe2]/80 transition-colors hover:bg-[#f5efe2] hover:text-[#151510]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 2-Column Editorial Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Portrait Frame */}
          <div className="relative lg:col-span-5 bg-[#05070c] overflow-hidden min-h-[340px] sm:min-h-[420px]">
            {!imgError ? (
              <img
                src={member.portrait}
                alt={`Chân dung ${member.name}`}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover object-top lg:h-full"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center">
                <Flower2 className="h-10 w-10 text-[#f5efe2]/40" />
                <span className="font-display text-3xl uppercase tracking-wide">{member.name}</span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#080a10] via-[#080a10]/45 to-transparent lg:hidden" />
          </div>

          {/* Tribute Card Content */}
          <div className="lg:col-span-7 flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="space-y-5">
              <div>
                <p
                  className="text-xs font-medium tracking-[0.16em] uppercase"
                  style={{ color: member.accentHex }}
                >
                  {member.accentLabel}
                </p>
                <h2
                  id="spotlight-member-name"
                  className="mt-2 font-display text-5xl sm:text-6xl font-normal uppercase leading-[0.95] tracking-[-0.01em] text-[#f5efe2]"
                >
                  {member.name}
                </h2>
                <p className="mt-3 text-sm text-[#f5efe2]/68">{member.traits.join('  ·  ')}</p>
              </div>

              <div className="h-px w-full bg-[#f5efe2]/12" />

              <div className="space-y-3">
                <h3 className="text-lg font-medium text-[#f5efe2]">{member.tributeTitle}</h3>
                <p className="text-[15px] leading-relaxed text-[#f5efe2]/78">
                  {member.tributeMessage}
                </p>
              </div>

              <div className="rounded-lg border border-[#f5efe2]/12 bg-[#f5efe2]/[0.03] p-5">
                <p className="text-xs tracking-[0.14em] uppercase text-[#f5efe2]/50">
                  Lời chúc 19/11 dành riêng cho {member.name}
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-[#f5efe2]">
                  “{member.signatureWish}”
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
