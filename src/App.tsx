import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MEMBERS, type Member } from './data/members';
import { MeadowSceneEngine } from './scene/MeadowSceneEngine';
import { AmbientAudioEngine } from './audio/AmbientAudioEngine';
import { WarriorCarousel } from './components/WarriorCarousel';
import { MemberSpotlightModal } from './components/MemberSpotlightModal';

export default function App() {
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const gallerySectionRef = useRef<HTMLElement | null>(null);
  const valleyRef = useRef<MeadowSceneEngine | null>(null);
  const audioRef = useRef<AmbientAudioEngine | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loaderMounted, setLoaderMounted] = useState(true);
  const [uiVisible, setUiVisible] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);

  const [scrollProgress, setScrollProgress] = useState(0); // 0 = Hero, 1 = Warrior Gallery
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Mount living HD Meadow & Resting Knight artwork + Web Audio
  useEffect(() => {
    const container = canvasHostRef.current;
    if (!container) return;

    const audio = new AmbientAudioEngine();
    audioRef.current = audio;

    const engine = new MeadowSceneEngine(container, {
      onLoaded: () => {
        setIsLoaded(true);
        window.setTimeout(() => setLoaderMounted(false), 900);
      },
      onIntroDone: () => {
        setUiVisible(true);
      },
    });
    valleyRef.current = engine;

    const safetyTimer = window.setTimeout(() => {
      setIsLoaded(true);
      setUiVisible(true);
    }, 1400);

    return () => {
      clearTimeout(safetyTimer);
      engine.dispose();
      valleyRef.current = null;
      audio.dispose();
      audioRef.current = null;
    };
  }, []);

  // Track vertical scroll progress between Hero and Warrior Carousel
  useEffect(() => {
    const scroller = scrollContainerRef.current;
    if (!scroller) return;

    const handleScroll = () => {
      const vh = scroller.clientHeight || window.innerHeight;
      const p = Math.min(1, Math.max(0, scroller.scrollTop / Math.max(vh * 0.72, 1)));
      setScrollProgress(p);
    };

    scroller.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => scroller.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync subtle meadow atmosphere & audio muffle when modal opens or scrolled into gallery
  useEffect(() => {
    const engine = valleyRef.current;
    const audio = audioRef.current;
    if (!engine) return;

    if (selectedMemberId) {
      engine.startHoverTransition();
      audio?.setMuffled(true);
    } else if (scrollProgress > 0.45) {
      engine.startHoverTransition();
      audio?.setMuffled(false);
    } else {
      engine.stopHoverTransition();
      engine.setAccentTint(null);
      audio?.setMuffled(false);
    }
  }, [selectedMemberId, scrollProgress]);

  const scrollToSection = (target: 'hero' | 'gallery') => {
    const el = target === 'hero' ? heroSectionRef.current : gallerySectionRef.current;
    if (!el) return;
    if (target === 'gallery') {
      valleyRef.current?.triggerCelebrationBurst('#f6c270');
      audioRef.current?.playBloomChime();
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleToggleSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const muted = audio.toggleMute();
    setIsSoundOn(!muted);
  };

  const handleSelectMember = (member: Member) => {
    setSelectedMemberId(member.id);
    valleyRef.current?.setAccentTint(member.accentHex);
    valleyRef.current?.triggerCelebrationBurst(member.accentHex);
    audioRef.current?.playBloomChime();
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

  const inGallery = scrollProgress > 0.48;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#120e18] text-[#f5efe2]">
      {/* Fixed Full-Screen Living HD Resting Warrior & Swaying Meadow Backdrop */}
      <div
        id="valley"
        ref={canvasHostRef}
        aria-hidden="true"
        className="fixed inset-0 z-0"
      />

      {/* Dynamic atmospheric scrim: airy & radiant on Hero, deeper cinematic contrast on Warrior Cards */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[5] transition-opacity duration-500"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,8,16,0.36) 0%, rgba(10,8,16,0.14) 42%, rgba(10,8,16,0.52) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[6] bg-[#09070e]"
        style={{ opacity: (scrollProgress * 0.62).toFixed(3) }}
      />

      {/* Fixed Top Navigation */}
      <header
        className={`fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-4 px-4 py-3.5 sm:px-8 sm:py-5 lg:px-12 lg:py-6 transition-opacity duration-[1200ms] ease-out ${
          uiVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          type="button"
          onClick={() => scrollToSection('hero')}
          className="whitespace-nowrap shrink-0 text-left text-[13px] sm:text-[15px] lg:text-[16px] font-semibold uppercase tracking-[0.14em] text-[#f5efe2] drop-shadow transition-opacity hover:opacity-80"
        >
          HUB Network · 19/11
        </button>

        <nav
          aria-label="Điều hướng chính"
          className="flex items-center gap-4 sm:gap-8 lg:gap-10 text-[11px] sm:text-[12px] lg:text-[13px] font-medium uppercase tracking-[0.15em]"
        >
          <button
            type="button"
            onClick={() => scrollToSection('hero')}
            className={`whitespace-nowrap shrink-0 transition-opacity ${
              !inGallery
                ? 'text-[#f5efe2] underline underline-offset-8 decoration-[#f6c270]/85'
                : 'text-[#f5efe2]/75 hover:text-[#f5efe2]'
            }`}
          >
            Mở đầu
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('gallery')}
            className={`whitespace-nowrap shrink-0 transition-opacity ${
              inGallery
                ? 'text-[#f5efe2] underline underline-offset-8 decoration-[#f6c270]/85'
                : 'text-[#f5efe2]/75 hover:text-[#f5efe2]'
            }`}
          >
            Lời chúc thành viên
          </button>
        </nav>
      </header>

      {/* Main Smooth Vertical Scroll Experience (Hero -> Scroll Down -> Warrior Carousel) */}
      <div
        ref={scrollContainerRef}
        className={`relative z-10 h-full w-full overflow-y-auto valley-scroll scroll-smooth snap-y snap-proximity transition-opacity duration-[1200ms] ease-out ${
          uiVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* SECTION 1: HERO — HAPPY MEN'S DAY - HUB NETWORK */}
        <section
          ref={heroSectionRef}
          className="relative flex min-h-[100dvh] w-full snap-start flex-col items-center justify-between px-4 pt-20 pb-8 sm:px-8 sm:pt-24 sm:pb-10 lg:px-12 text-center"
        >
          <div className="my-auto mx-auto flex max-w-4xl flex-col items-center py-4 sm:py-6">
            <p className="hero-eyebrow font-medium uppercase text-[#f6d7b0] drop-shadow">
              19 Tháng 11 · Ngày Quốc tế Đàn ông
            </p>

            <h1 className="hero-title mt-2.5 sm:mt-3 uppercase">HAPPY MEN&apos;S DAY</h1>

            <div className="mt-2.5 sm:mt-3.5 flex items-center justify-center gap-3 sm:gap-4">
              <span className="h-px w-8 sm:w-14 lg:w-20 bg-gradient-to-r from-transparent to-[#f6c270]/80" />
              <span className="hero-brand-sub font-normal uppercase text-[#f6d7b0] drop-shadow">
                HUB NETWORK
              </span>
              <span className="h-px w-8 sm:w-14 lg:w-20 bg-gradient-to-l from-transparent to-[#f6c270]/80" />
            </div>

            <div className="hero-tribute-block mt-5 sm:mt-7 max-w-[36ch] sm:max-w-[54ch] lg:max-w-[60ch] space-y-2.5 sm:space-y-3 text-[#faf5ec]/95">
              <p className="font-semibold text-[#fff8ee]">
                Chúc mừng Ngày Quốc tế Đàn ông 19/11.
              </p>
              <p className="text-[#f5efe2]/92">
                Cảm ơn vì những nỗ lực thầm lặng, sự vững vàng và tinh thần hết mình đã luôn đồng hành cùng tập thể HUB Network.
              </p>
              <p className="text-[#f5efe2]/92">
                Chúc những chiến binh của HUB luôn thật nhiều sức khỏe, bình an, giữ trọn bản lĩnh và rực rỡ trên mọi hành trình phía trước.
              </p>
            </div>
          </div>

          {/* Non-overlapping Scroll-Down Cue anchored cleanly in flex flow */}
          <button
            type="button"
            onClick={() => scrollToSection('gallery')}
            className="group mt-4 flex flex-col items-center gap-2 text-[#f5efe2]/92 transition-opacity hover:opacity-100"
          >
            <span className="text-[10.5px] sm:text-[11.5px] lg:text-[12px] font-medium uppercase tracking-[0.2em] drop-shadow">
              Lướt xuống để xem lời chúc từng thành viên
            </span>
            <span className="scroll-cue-chevron grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full border border-[#f5efe2]/45 bg-[#0d0a14]/50 text-[#f6d7b0] transition-colors group-hover:border-[#f6c270] group-hover:bg-[#f6c270]/15">
              <ChevronDown className="h-4 w-4 stroke-[1.8]" />
            </span>
          </button>
        </section>

        {/* SECTION 2: WARRIOR MEMBERS CAROUSEL */}
        <section
          ref={gallerySectionRef}
          className="relative flex min-h-[100dvh] w-full snap-start flex-col items-center justify-center pt-16 pb-16 sm:pt-20 sm:pb-20"
        >
          <div className="mx-auto w-full max-w-[1320px] px-4 text-center sm:px-8">
            <p className="text-[10.5px] sm:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#f6c270]">
              Những chiến binh của HUB Network
            </p>
            <h2 className="section-heading mt-1.5 sm:mt-2 uppercase text-[#f5efe2]">
              Lời chúc dành riêng từng thành viên
            </h2>
          </div>

          <div className="mt-2 sm:mt-4 w-full">
            <WarriorCarousel
              members={MEMBERS}
              isModalOpen={selectedMemberId !== null}
              onSelectMember={handleSelectMember}
              onFocusAccent={(hex) => {
                if (inGallery && !selectedMemberId) {
                  valleyRef.current?.setAccentTint(hex);
                }
              }}
            />
          </div>
        </section>
      </div>

      {/* Fixed Bottom-Right Sound Toggle & Quick Return */}
      <div
        className={`pointer-events-none fixed right-5 bottom-5 sm:right-[calc(40*var(--u))] sm:bottom-[calc(32*var(--u))] z-30 flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.18em] text-[#f5efe2]/90 transition-opacity duration-[1200ms] ${
          uiVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {inGallery && (
          <>
            <button
              type="button"
              onClick={() => scrollToSection('hero')}
              className="pointer-events-auto transition-opacity hover:opacity-70"
            >
              Lên đầu trang
            </button>
            <span className="h-5 w-px bg-[#f5efe2]/45" aria-hidden="true" />
          </>
        )}

        <button
          type="button"
          onClick={handleToggleSound}
          aria-pressed={isSoundOn}
          aria-label={isSoundOn ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
          className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full border border-[#f5efe2]/25 bg-[#0d0a14]/50 text-[#f5efe2] transition-colors hover:border-[#f6c270]/70 hover:text-[#f6d7b0]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 fill-none stroke-current stroke-[1.6]"
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

      {/* Member Individual Tribute Modal */}
      {selectedMember && (
        <MemberSpotlightModal
          member={selectedMember}
          onClose={() => setSelectedMemberId(null)}
          onPrev={() => handleCycleMember(-1)}
          onNext={() => handleCycleMember(1)}
        />
      )}

      {/* Initial Loader Curtain */}
      {loaderMounted && (
        <div
          aria-hidden="true"
          className={`fixed inset-0 z-50 grid place-items-center bg-[#120e18] pointer-events-none transition-opacity duration-900 ease-out ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <span className="text-xs font-medium uppercase tracking-[0.26em] text-[#f5efe2]/80">
            HAPPY MEN&apos;S DAY · HUB NETWORK
          </span>
        </div>
      )}
    </div>
  );
}
