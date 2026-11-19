import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Flower2, X } from 'lucide-react';
import type { Member } from '../data/members';
import { WarriorSword } from './WarriorSwords';

interface MemberSpotlightModalProps {
  member: Member;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function MemberSpotlightModal({
  member,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/84 p-3 sm:p-5 md:p-8 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spotlight-member-name"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[1040px] max-h-[92vh] overflow-y-auto valley-scroll rounded-2xl border border-[#f5efe2]/18 bg-[#0b0912] text-[#f5efe2] shadow-[0_32px_96px_rgba(0,0,0,0.88)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar (zero index numbers) */}
        <div className="flex items-center justify-between gap-3 border-b border-[#f5efe2]/12 px-4 py-3.5 sm:px-7 sm:py-4">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10.5px] sm:text-xs font-medium tracking-[0.16em] uppercase text-[#f5efe2]/72">
            <span>HAPPY MEN&apos;S DAY · HUB NETWORK</span>
            <span aria-hidden="true" className="hidden sm:inline text-[#f5efe2]/35">
              ·
            </span>
            <span style={{ color: member.accentHex }}>{member.swordName}</span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onPrev}
              aria-label="Xem thành viên trước"
              className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full border border-[#f5efe2]/20 text-[#f5efe2]/80 transition-colors hover:border-[#f5efe2] hover:text-[#f5efe2]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Xem thành viên tiếp theo"
              className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full border border-[#f5efe2]/20 text-[#f5efe2]/80 transition-colors hover:border-[#f5efe2] hover:text-[#f5efe2]"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng thiệp chúc mừng"
              className="ml-1 sm:ml-2 grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full border border-[#f5efe2]/20 text-[#f5efe2]/80 transition-colors hover:bg-[#f5efe2] hover:text-[#151510]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 2-Column Editorial Split: Integrated Portrait + Overlaid Sword | Tribute Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Portrait Frame with Integrated Large Bespoke Forged Sword (matching the card aesthetic) */}
          <div className="relative lg:col-span-5 bg-[#07060d] overflow-hidden min-h-[340px] sm:min-h-[430px] lg:min-h-[520px]">
            {!imgError ? (
              <img
                src={member.portrait}
                alt={`Chân dung ${member.name}`}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center">
                <Flower2 className="h-10 w-10 text-[#f5efe2]/40" />
                <span className="font-display text-3xl uppercase tracking-wide">{member.name}</span>
              </div>
            )}

            {/* Smooth atmospheric edge gradients so the portrait & forged sword blend seamlessly */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-[#0b0912]/12 to-[#0b0912]/90" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b0912] via-transparent to-[#0b0912]/35 lg:bg-gradient-to-t lg:from-[#0b0912]/65 lg:via-transparent lg:to-[#0b0912]/30" />

            {/* Subtle Forged Filigree Corner Accents inside Portrait */}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="pointer-events-none absolute top-3 left-3 z-20 h-4 w-4 opacity-70"
              style={{ color: member.accentHex }}
            >
              <path d="M2 12 V2 H12" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="pointer-events-none absolute bottom-3 left-3 z-20 h-4 w-4 opacity-60 hidden lg:block"
              style={{ color: member.accentHex }}
            >
              <path d="M2 12 V22 H12" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>

            {/* Integrated Large Bespoke Forged Sword directly overlaid on right side of portrait */}
            <div className="pointer-events-none absolute right-2 sm:right-3 top-3 bottom-3 lg:top-4 lg:bottom-4 z-20 flex w-[112px] sm:w-[132px] lg:w-[146px] items-center justify-center">
              <div
                className="absolute top-[24%] h-28 w-20 rounded-full blur-2xl opacity-40"
                style={{ backgroundColor: member.accentHex }}
              />
              <WarriorSword
                swordId={member.swordId}
                swordName={member.swordName}
                orientation="vertical"
                className="relative h-[96%] w-auto max-w-full drop-shadow-[0_10px_22px_rgba(0,0,0,0.92)]"
              />
            </div>

            {/* Subtle Sword Name Tag anchored on bottom-left of portrait */}
            <div className="pointer-events-none absolute left-4 bottom-3.5 z-20 hidden lg:flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rotate-45"
                style={{ backgroundColor: member.accentHex }}
              />
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.18em] drop-shadow"
                style={{ color: member.accentHex }}
              >
                {member.swordName}
              </span>
            </div>
          </div>

          {/* Tribute & Personalized 19/11 Wish Content */}
          <div className="lg:col-span-7 flex flex-col justify-center p-5 sm:p-8 lg:p-10">
            <div className="space-y-4 sm:space-y-5">
              <div>
                <p
                  className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase"
                  style={{ color: member.accentHex }}
                >
                  {member.warriorTitle} · {member.accentLabel}
                </p>

                <h2
                  id="spotlight-member-name"
                  className="mt-2 font-display text-[36px] sm:text-[48px] lg:text-[54px] font-medium uppercase leading-[1.06] tracking-[0.005em] text-[#f5efe2]"
                >
                  {member.name}
                </h2>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] sm:text-[13px] text-[#f5efe2]/72">
                  <span style={{ color: member.accentHex }} className="font-semibold">
                    {member.swordName}
                  </span>
                  <span aria-hidden="true" className="text-[#f5efe2]/30">
                    ·
                  </span>
                  <span>{member.traits.join('  ·  ')}</span>
                </div>
              </div>

              <div className="h-px w-full bg-[#f5efe2]/12" />

              <div className="space-y-2">
                <h3 className="text-[16px] sm:text-[18px] font-semibold leading-snug text-[#f5efe2]">
                  {member.tributeTitle}
                </h3>
                <p className="text-[14px] sm:text-[15.5px] leading-[1.72] text-[#f5efe2]/82">
                  {member.tributeMessage}
                </p>
              </div>

              <div
                className="rounded-xl border bg-[#f5efe2]/[0.03] p-4 sm:p-5"
                style={{ borderColor: `${member.accentHex}45` }}
              >
                <p
                  className="text-[11px] sm:text-xs font-semibold tracking-[0.15em] uppercase"
                  style={{ color: member.accentHex }}
                >
                  Lời chúc 19/11 dành riêng cho {member.name}
                </p>
                <p className="mt-2 text-[14px] sm:text-[15.5px] leading-[1.7] text-[#f5efe2]">
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
