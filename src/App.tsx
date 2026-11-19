import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Flower2 } from 'lucide-react';
import { MEMBERS } from './data/members';
import { MeadowSceneEngine } from './scene/MeadowSceneEngine';
import { AmbientAudioEngine } from './audio/AmbientAudioEngine';
import { MemberSpotlightModal } from './components/MemberSpotlightModal';

type ActiveView = 'hero' | 'portraits';

export default function App() {
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const valleyRef = useRef<MeadowSceneEngine | null>(null);
  const audioRef = useRef<AmbientAudioEngine | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loaderMounted, setLoaderMounted] = useState(true);
  const [uiVisible, setUiVisible] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);

  const [activeView, setActiveView] = useState<ActiveView>('hero');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Mount isolated 3D Sunset Wildflower Meadow & Resting Warrior engine + procedural Web Audio
  useEffect(() => {
    const container = canvasHostRef.current;
    if (!container) return;

    const audio = new AmbientAudioEngine();
    audioRef.current = audio;

    const engine = new MeadowSceneEngine(container, {
      onLoaded: () => {
        setIsLoaded(true);
        window.setTimeout(() => setLoaderMounted(false), 1100);
      },
      onIntroDone: () => {
        setUiVisible(true);
      },
    });
    valleyRef.current = engine;

    const safetyTimer = window.setTimeout(() => {
      setIsLoaded(true);
      setUiVisible(true);
    }, 1500);

    return () => {
      clearTimeout(safetyTimer);
      engine.dispose();
      valleyRef.current = null;
      audio.dispose();
      audioRef.current = null;
    };
  }, []);

  // Synchronize 3D valley scroll lock & dispersion state with active UI view/modal
  useEffect(() => {
    const engine = valleyRef.current;
    const audio = audioRef.current;
    if (!engine) return;

    const overlayActive = activeView !== 'hero' || selectedMemberId !== null;
    engine.setScrollLocked(overlayActive);

    if (selectedMemberId) {
      engine.startHoverTransition();
      audio?.setMuffled(true);
    } else if (activeView !== 'hero') {
      engine.stopHoverTransition();
      audio?.setMuffled(false);
    } else {
      engine.stopHoverTransition();
      engine.setAccentTint(null);
      audio?.setMuffled(false);
    }
  }, [activeView, selectedMemberId]);

  const handleToggleSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const muted = audio.toggleMute();
    setIsSoundOn(!muted);
  };

  const handleHeroArrowEnter = () => {
    valleyRef.current?.startHoverTransition();
    audioRef.current?.setMuffled(true);
  };

  const handleHeroArrowLeave = () => {
    if (activeView === 'hero' && !selectedMemberId) {
      valleyRef.current?.stopHoverTransition();
      audioRef.current?.setMuffled(false);
    }
  };

  const handleEnterPortraits = () => {
    valleyRef.current?.triggerCelebrationBurst('#f6bfd0');
    audioRef.current?.playBloomChime();
    setActiveView('portraits');
  };

  const selectedMember = useMemo(
    () => MEMBERS.find((m) => m.id === selectedMemberId) ?? null,
    [selectedMemberId]
  );

  const handleCycleMember = (direction: -1 | 1) => {
    if (!selectedMember) return;
    const currentIdx = MEMBERS.findIndex((m) => m.id === selectedMember.id);
    const nextIdx = (currentIdx + direction + MEMBERS.length) % MEMBERS.length;
    const nextMember = MEMBERS[nextIdx];
    setSelectedMemberId(nextMember.id);
    valleyRef.current?.setAccentTint(nextMember.accentHex);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#18141d] text-[#f5efe2]">
      {/* Isolated Full-Screen 3D Sunset Flower Meadow & Resting Warrior WebGL Container */}
      <div
        id="valley"
        ref={canvasHostRef}
        aria-hidden="true"
        className="fixed inset-0 z-0"
      />

      {/* Subtle top & bottom gradient scrim so typography stays legible without muting the artwork */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[5] bg-gradient-to-b from-black/28 via-transparent to-black/38"
      />

      {/* Semantic Interface Layer (pointer-events-none so canvas stays interactive everywhere) */}
      <div
        className={`fixed inset-0 z-10 pointer-events-none transition-opacity duration-[1500ms] ease-out ${
          uiVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Bar */}
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-6 px-[18px] pt-[18px] sm:px-[calc(44*var(--u))] sm:pt-[calc(24*var(--u))]">
          <button
            type="button"
            onClick={() => setActiveView('hero')}
            className="pointer-events-auto whitespace-nowrap shrink-0 text-left text-[19px] sm:text-[calc(25*var(--u))] font-medium tracking-[-0.02em] text-[#f5efe2] drop-shadow transition-opacity hover:opacity-80"
          >
            HUB Network · 19.11
          </button>

          <nav
            aria-label="Điều hướng chính"
            className="pointer-events-auto flex items-center gap-5 sm:gap-[calc(42*var(--u))] text-[12px] sm:text-[calc(14*var(--u))] font-medium uppercase tracking-[0.16em]"
          >
            <button
              type="button"
              onClick={() => setActiveView('hero')}
              className={`whitespace-nowrap shrink-0 transition-opacity ${
                activeView === 'hero'
                  ? 'text-[#f5efe2] underline underline-offset-8 decoration-[#f5efe2]/70'
                  : 'text-[#f5efe2]/80 hover:opacity-65'
              }`}
            >
              Khởi đầu
            </button>
            <button
              type="button"
              onClick={() => setActiveView('portraits')}
              className={`whitespace-nowrap shrink-0 transition-opacity ${
                activeView === 'portraits'
                  ? 'text-[#f5efe2] underline underline-offset-8 decoration-[#f5efe2]/70'
                  : 'text-[#f5efe2]/80 hover:opacity-65'
              }`}
            >
              HUB Men
            </button>
          </nav>
        </header>

        {/* VIEW 1: Full-Screen Cinematic Hero over the Resting Warrior & Sunset Flower Field */}
        {activeView === 'hero' && (
          <main className="pointer-events-none absolute inset-x-5 sm:inset-x-0 top-1/2 -translate-y-[46%] flex flex-col items-center text-center">
            <h1 className="hero-title">Bản lĩnh, rạng ngời.</h1>
            <p className="hero-caption">
              Chúc mừng Ngày Quốc Tế Đàn Ông 19/11.
              <br />
              Gửi những người đàn ông của HUB Network luôn tỏa sáng theo cách riêng.
            </p>
            <button
              type="button"
              onClick={handleEnterPortraits}
              onPointerEnter={handleHeroArrowEnter}
              onPointerLeave={handleHeroArrowLeave}
              aria-label="Xem thiệp chúc mừng những người đàn ông của HUB Network"
              className="hero-go pointer-events-auto"
            >
              <ArrowRight className="h-[22px] w-[22px] sm:h-[calc(22*var(--u))] sm:w-[calc(22*var(--u))] stroke-[1.6]" />
            </button>
          </main>
        )}

        {/* VIEW 2: Greeting Cards — Những người đàn ông của HUB Network */}
        {activeView === 'portraits' && (
          <main className="pointer-events-auto absolute inset-0 overflow-y-auto valley-scroll bg-[#08070d]/58 pt-24 pb-28 sm:pt-28 sm:pb-28">
            <div className="mx-auto max-w-[1320px] px-5 sm:px-10 lg:px-14">
              {/* Section Heading */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-[#f5efe2]/20 pb-6">
                <div>
                  <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#f5efe2]/72">
                    Ngày Quốc Tế Đàn Ông · 19 Tháng 11
                  </p>
                  <h1 className="mt-2 font-display text-4xl sm:text-5xl lg:text-6xl font-normal uppercase leading-[0.95] tracking-[-0.01em] text-[#f5efe2]">
                    Những người đàn ông của HUB Network
                  </h1>
                </div>
                <div className="text-xs sm:text-sm text-[#f5efe2]/80">
                  <span className="tabular-nums">{MEMBERS.length} thành viên</span>
                </div>
              </div>
            </div>

            {/* Horizontal Marquee Row (moving Left -> Right) */}
            <div className="relative mt-10 w-full overflow-hidden py-3">
              <div className="marquee-ltr-track">
                {[0, 1].map((loopIdx) => (
                  <div
                    key={loopIdx}
                    aria-hidden={loopIdx === 1}
                    className="flex shrink-0 items-stretch gap-6 pr-6"
                  >
                    {MEMBERS.map((member) => (
                      <article
                        key={`${loopIdx}-${member.id}`}
                        onMouseEnter={() => valleyRef.current?.setAccentTint(member.accentHex)}
                        onMouseLeave={() => valleyRef.current?.setAccentTint(null)}
                        className="group relative flex w-[260px] sm:w-[290px] shrink-0 flex-col overflow-hidden rounded-lg border border-[#f5efe2]/18 bg-[#0b0a12]/90 transition-transform duration-300 ease-out hover:-translate-y-1.5 hover:border-[#f5efe2]/50"
                      >
                        <button
                          type="button"
                          tabIndex={loopIdx === 1 ? -1 : 0}
                          onClick={() => {
                            setSelectedMemberId(member.id);
                            valleyRef.current?.setAccentTint(member.accentHex);
                            audioRef.current?.playBloomChime();
                          }}
                          className="flex flex-1 flex-col text-left focus-visible:outline-none"
                        >
                          {/* Cropped 3:4 Portrait */}
                          <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0a0d14]">
                            {!brokenImages[member.id] ? (
                              <img
                                src={member.portrait}
                                alt={`Ảnh chân dung ${member.name}`}
                                referrerPolicy="no-referrer"
                                onError={() =>
                                  setBrokenImages((prev) => ({ ...prev, [member.id]: true }))
                                }
                                className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
                                <Flower2 className="h-8 w-8 text-[#f5efe2]/40" />
                                <span className="font-display text-2xl uppercase">{member.name}</span>
                              </div>
                            )}

                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b0a12] via-[#0b0a12]/25 to-transparent" />

                            <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between text-[11px] font-medium tracking-[0.18em] uppercase text-[#f5efe2]/88">
                              <span className="tabular-nums drop-shadow">{member.index}</span>
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: member.accentHex }}
                                aria-hidden="true"
                              />
                            </div>

                            <div className="absolute inset-x-4 bottom-3.5">
                              <h2 className="font-display text-3xl font-normal uppercase leading-none tracking-[-0.01em] text-[#f5efe2]">
                                {member.name}
                              </h2>
                              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#f5efe2]/82">
                                {member.epithet}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 border-t border-[#f5efe2]/12 px-4 py-3 text-xs text-[#f5efe2]/78">
                            <span className="inline-flex items-center gap-1.5 font-medium text-[#f5efe2] transition-transform duration-200 group-hover:translate-x-0.5">
                              Mở thiệp
                              <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </button>
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}

        {/* Bottom-Right Corner HUD */}
        <div className="pointer-events-none fixed inset-x-5 bottom-6 sm:inset-x-auto sm:right-[calc(44*var(--u))] sm:bottom-[calc(40*var(--u))] z-20 flex items-center justify-center sm:justify-end gap-[18px] text-[11px] sm:text-[calc(12.5*var(--u))] font-medium uppercase tracking-[0.16em] text-[#f5efe2]/95">
          {activeView === 'hero' ? (
            <span>Chạm nhẹ vào làn gió hoa</span>
          ) : (
            <button
              type="button"
              onClick={() => setActiveView('hero')}
              className="pointer-events-auto transition-opacity hover:opacity-70"
            >
              Về cánh đồng hoa
            </button>
          )}

          <span className="h-[22px] sm:h-[calc(26*var(--u))] w-px bg-[#f5efe2]/55" aria-hidden="true" />

          <button
            type="button"
            onClick={handleToggleSound}
            aria-pressed={isSoundOn}
            aria-label={isSoundOn ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
            className="pointer-events-auto grid h-[28px] w-[28px] sm:h-[calc(28*var(--u))] sm:w-[calc(28*var(--u))] place-items-center text-[#f5efe2] transition-opacity hover:opacity-75"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-full w-full fill-none stroke-current stroke-[1.5]"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5Z" />
              <path
                d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
                className={`transition-opacity duration-300 ${isSoundOn ? 'opacity-100' : 'opacity-0'}`}
              />
              <path
                d="m16 10 4 4m0-4-4 4"
                className={`transition-opacity duration-300 ${isSoundOn ? 'opacity-0' : 'opacity-100'}`}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Member Greeting Card Modal */}
      {selectedMember && (
        <MemberSpotlightModal
          member={selectedMember}
          total={MEMBERS.length}
          onClose={() => setSelectedMemberId(null)}
          onPrev={() => handleCycleMember(-1)}
          onNext={() => handleCycleMember(1)}
        />
      )}

      {/* Initial Loader Curtain (fades cleanly once WebGL boots) */}
      {loaderMounted && (
        <div
          aria-hidden="true"
          className={`fixed inset-0 z-50 grid place-items-center bg-[#18141d] pointer-events-none transition-opacity duration-1000 ease-out ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <span className="text-xs font-medium uppercase tracking-[0.26em] text-[#f5efe2]/80">
            HUB Network · 19.11
          </span>
        </div>
      )}
    </div>
  );
}
