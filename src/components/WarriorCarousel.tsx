import { useEffect, useRef, useState } from 'react';
import { Flower2, Sparkles } from 'lucide-react';
import type { Member } from '../data/members';
import { WarriorSword } from './WarriorSwords';

interface WarriorCarouselProps {
  members: Member[];
  isModalOpen: boolean;
  onSelectMember: (member: Member) => void;
  onFocusAccent: (hex: string | null) => void;
}

/**
 * Infinite Left-to-Right Warrior Card Carousel:
 * - Glides naturally from left to right when idle
 * - Magnifies & illuminates the centered warrior card and its large bespoke forged sword
 * - Mouse steering left/right smoothly pulls desired cards into center; center dead-zone
 *   steadies the card for effortless clicking (plus touch/pointer drag support)
 * - Responsive card proportions & typography tuned for mobile, tablet, laptop, and desktop
 */
export function WarriorCarousel({
  members,
  isModalOpen,
  onSelectMember,
  onFocusAccent,
}: WarriorCarouselProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [centeredMemberId, setCenteredMemberId] = useState<string>(members[0]?.id ?? '');

  // Double list (14 slots) for seamless infinite wrap across ultrawide screens
  const items = [...members, ...members];

  const stateRef = useRef({
    offset: 0,
    velocity: 44, // positive = glides Left -> Right
    mouseInside: false,
    mouseNormX: 0,
    isDragging: false,
    dragLastX: 0,
    dragDistance: 0,
    activeCenterId: members[0]?.id ?? '',
  });

  const modalOpenRef = useRef(isModalOpen);
  modalOpenRef.current = isModalOpen;

  const onFocusAccentRef = useRef(onFocusAccent);
  onFocusAccentRef.current = onFocusAccent;

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const stage = stageRef.current;
      if (stage) {
        const width = stage.clientWidth || window.innerWidth;
        const slotStep = width < 640 ? 272 : width < 1024 ? 324 : 362;
        const totalSpan = items.length * slotStep;
        const halfSpan = totalSpan * 0.5;
        const st = stateRef.current;

        if (!modalOpenRef.current) {
          if (st.isDragging) {
            st.velocity *= Math.exp(-10 * dt);
          } else if (st.mouseInside) {
            const absX = Math.abs(st.mouseNormX);
            const deadZone = 0.22;
            let targetVel = 0;
            if (absX > deadZone) {
              const steer = (absX - deadZone) / (1 - deadZone);
              const curved = Math.pow(steer, 1.35);
              targetVel = -Math.sign(st.mouseNormX) * curved * 480;
            }
            st.velocity += (targetVel - st.velocity) * (1 - Math.exp(-6.5 * dt));
            st.offset += st.velocity * dt;
          } else {
            const idleSpeed = reducedMotion ? 0 : 46;
            st.velocity += (idleSpeed - st.velocity) * (1 - Math.exp(-3.0 * dt));
            st.offset += st.velocity * dt;
          }
        }

        if (st.offset > totalSpan) st.offset -= totalSpan;
        if (st.offset < -totalSpan) st.offset += totalSpan;

        let closestDist = Infinity;
        let closestMember: Member | null = null;

        for (let i = 0; i < items.length; i++) {
          const el = cardRefs.current[i];
          if (!el) continue;

          let rawX = i * slotStep + st.offset;
          rawX = ((((rawX + halfSpan) % totalSpan) + totalSpan) % totalSpan) - halfSpan;

          const absDist = Math.abs(rawX);
          const sigma = slotStep * 1.12;
          const proximity = Math.exp(-(rawX * rawX) / (2 * sigma * sigma));

          if (absDist < closestDist) {
            closestDist = absDist;
            closestMember = items[i];
          }

          const maxScaleBoost = width < 640 ? 0.22 : 0.28;
          const scale = 0.84 + proximity * maxScaleBoost;
          const liftY = -proximity * (width < 640 ? 10 : 16);
          const tiltY = Math.max(-12, Math.min(12, -rawX / 52));
          const opacity = absDist > width * 0.72 ? 0 : 0.52 + proximity * 0.48;
          const zIndex = Math.round(10 + proximity * 40);

          el.style.transform = `translate3d(${rawX.toFixed(1)}px, ${liftY.toFixed(1)}px, 0) perspective(1150px) rotateY(${tiltY.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
          el.style.opacity = opacity.toFixed(3);
          el.style.zIndex = String(zIndex);
          el.dataset.center = proximity > 0.74 ? 'true' : 'false';
        }

        if (closestMember && closestMember.id !== st.activeCenterId) {
          st.activeCenterId = closestMember.id;
          setCenteredMemberId(closestMember.id);
          onFocusAccentRef.current(closestMember.accentHex);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [items.length]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    stateRef.current.mouseInside = true;
    stateRef.current.mouseNormX = Math.max(-1, Math.min(1, normX));

    if (stateRef.current.isDragging) {
      const dx = e.clientX - stateRef.current.dragLastX;
      stateRef.current.dragLastX = e.clientX;
      stateRef.current.dragDistance += Math.abs(dx);
      stateRef.current.offset += dx * 1.15;
      stateRef.current.velocity = dx * 24;
    }
  };

  const handlePointerLeave = () => {
    stateRef.current.mouseInside = false;
    stateRef.current.isDragging = false;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    stateRef.current.isDragging = true;
    stateRef.current.dragLastX = e.clientX;
    stateRef.current.dragDistance = 0;
  };

  const handlePointerUp = () => {
    stateRef.current.isDragging = false;
  };

  const handleCardClick = (member: Member) => {
    if (stateRef.current.dragDistance > 10) return;
    onSelectMember(member);
  };

  const activeMember = members.find((m) => m.id === centeredMemberId) ?? members[0];

  return (
    <div className="relative w-full select-none">
      {/* Interactive Stage */}
      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative mx-auto flex h-[470px] sm:h-[535px] lg:h-[585px] w-full items-center justify-center overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing"
      >
        {/* Soft horizontal edge fades */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-50 w-8 sm:w-20 lg:w-32 bg-gradient-to-r from-[#09070e]/95 via-[#09070e]/45 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-50 w-8 sm:w-20 lg:w-32 bg-gradient-to-l from-[#09070e]/95 via-[#09070e]/45 to-transparent"
        />

        {items.map((member, idx) => (
          <div
            key={`${idx}-${member.id}`}
            ref={(el) => {
              cardRefs.current[idx] = el;
            }}
            data-center="false"
            className="warrior-card-slot absolute left-1/2 top-1/2 -ml-[128px] -mt-[198px] w-[256px] sm:-ml-[148px] sm:-mt-[226px] sm:w-[296px] lg:-ml-[164px] lg:-mt-[246px] lg:w-[328px] will-change-transform"
          >
            <button
              type="button"
              onClick={() => handleCardClick(member)}
              tabIndex={idx >= members.length ? -1 : 0}
              aria-label={`Mở lời chúc 19/11 dành cho ${member.name} — ${member.swordName}`}
              style={{ ['--warrior-accent' as string]: member.accentHex }}
              className="warrior-card group relative flex w-full flex-col overflow-hidden rounded-[16px] border border-[#f5efe2]/20 bg-[#0d0a14]/95 text-left shadow-[0_24px_54px_rgba(4,3,9,0.75)] transition-[border-color,box-shadow] duration-300 focus-visible:outline-none"
            >
              {/* Inner Metallic Hairline Frame */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[6px] z-20 rounded-[11px] border border-[#f5efe2]/12 transition-colors duration-300 group-hover:border-[var(--warrior-accent)]/60"
              />

              {/* Forged Corner Filigree */}
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="pointer-events-none absolute top-2 left-2 z-20 h-4 w-4 opacity-75"
                style={{ color: member.accentHex }}
              >
                <path d="M2 12 V2 H12" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="pointer-events-none absolute top-2 right-2 z-20 h-4 w-4 opacity-75"
                style={{ color: member.accentHex }}
              >
                <path d="M12 2 H22 V12" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="pointer-events-none absolute bottom-2 left-2 z-20 h-4 w-4 opacity-60"
                style={{ color: member.accentHex }}
              >
                <path d="M2 12 V22 H12" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="pointer-events-none absolute bottom-2 right-2 z-20 h-4 w-4 opacity-60"
                style={{ color: member.accentHex }}
              >
                <path d="M12 22 H22 V12" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>

              {/* Top Portrait + Heroic Large Bespoke Forged Sword Showcase */}
              <div className="relative h-[300px] sm:h-[346px] lg:h-[382px] w-full overflow-hidden bg-[#08070f]">
                {/* Member Portrait fills the left/center */}
                {!brokenImages[member.id] ? (
                  <img
                    src={member.portrait}
                    alt={`Chân dung chiến binh ${member.name}`}
                    draggable={false}
                    referrerPolicy="no-referrer"
                    onError={() => setBrokenImages((prev) => ({ ...prev, [member.id]: true }))}
                    className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
                    <Flower2 className="h-8 w-8 text-[#f5efe2]/40" />
                    <span className="font-display text-2xl uppercase">{member.name}</span>
                  </div>
                )}

                {/* Subtle side pedestal gradient so the large ornate sword reads with razor-sharp contrast */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-[#0d0a14]/15 to-[#09070f]/92" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d0a14] via-[#0d0a14]/25 to-[#0d0a14]/40" />

                {/* Top Warrior Crest Title (Zero Index Numbers) */}
                <div className="pointer-events-none absolute inset-x-4 top-3.5 z-20 flex items-center gap-2 pr-[82px] sm:pr-[96px]">
                  <span
                    className="h-1.5 w-1.5 rotate-45 shrink-0"
                    style={{ backgroundColor: member.accentHex }}
                  />
                  <span
                    className="truncate text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-[0.18em] drop-shadow"
                    style={{ color: member.accentHex }}
                  >
                    {member.warriorTitle}
                  </span>
                </div>

                {/* LARGE, ULTRA-DETAILED BESPOKE FORGED SWORD rising along the right edge */}
                <div className="pointer-events-none absolute right-1 sm:right-1.5 top-2 bottom-2 z-20 flex w-[92px] sm:w-[106px] lg:w-[116px] items-center justify-center">
                  {/* Soft gemstone aura behind crossguard */}
                  <div
                    className="absolute top-[24%] h-20 w-16 rounded-full blur-xl opacity-35 transition-opacity duration-500 group-hover:opacity-65"
                    style={{ backgroundColor: member.accentHex }}
                  />
                  <WarriorSword
                    swordId={member.swordId}
                    swordName={member.swordName}
                    orientation="vertical"
                    className="warrior-sword-glow relative h-[96%] w-auto max-w-full transition-transform duration-500 ease-out"
                  />
                </div>

                {/* Member Name & Sword Name cleanly framed on lower-left */}
                <div className="absolute inset-x-4 bottom-3 z-20 pr-[88px] sm:pr-[102px] lg:pr-[112px]">
                  <p
                    className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] drop-shadow"
                    style={{ color: member.accentHex }}
                  >
                    {member.swordName}
                  </p>
                  <h3 className="mt-1 font-display text-[26px] sm:text-[31px] lg:text-[34px] font-medium uppercase leading-[1.06] tracking-[0.01em] text-[#f5efe2] drop-shadow">
                    {member.name}
                  </h3>
                </div>
              </div>

              {/* Card Footer — Epithet & Open Tribute CTA */}
              <div className="relative z-10 flex flex-col gap-2.5 px-4 pt-2.5 pb-4 sm:px-5 sm:pb-4.5">
                <p className="line-clamp-2 min-h-[2.6em] text-[12px] sm:text-[13px] leading-[1.55] text-[#f5efe2]/78">
                  {member.epithet}
                </p>

                <div className="flex items-center justify-between border-t border-[#f5efe2]/12 pt-2.5 text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.14em]">
                  <span className="truncate text-[#f5efe2]/55">{member.accentLabel}</span>
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 font-semibold transition-transform duration-200 group-hover:translate-x-0.5"
                    style={{ color: member.accentHex }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Mở lời chúc
                  </span>
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Centered Active Warrior & Interaction Hint */}
      {activeMember && (
        <div className="mx-auto mt-1 sm:mt-2 flex max-w-2xl flex-col items-center gap-1.5 px-5 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] sm:text-[12.5px] font-medium uppercase tracking-[0.18em] text-[#f5efe2]/88">
            <span>{activeMember.name}</span>
            <span className="text-[#f5efe2]/35" aria-hidden="true">
              ·
            </span>
            <span style={{ color: activeMember.accentHex }}>{activeMember.swordName}</span>
            <span className="hidden sm:inline text-[#f5efe2]/35" aria-hidden="true">
              ·
            </span>
            <span className="hidden sm:inline text-[#f5efe2]/65">{activeMember.warriorTitle}</span>
          </div>
          <p className="text-[11px] sm:text-[12px] leading-relaxed text-[#f5efe2]/58">
            <span className="hidden sm:inline">
              Di chuyển chuột sang trái hoặc phải để chọn thẻ · Bấm vào thẻ ở giữa để đọc lời chúc
            </span>
            <span className="sm:hidden">Vuốt sang trái / phải để chọn · Chạm vào thẻ để mở lời chúc</span>
          </p>
        </div>
      )}
    </div>
  );
}
