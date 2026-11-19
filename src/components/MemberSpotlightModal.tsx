import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, Flower2, PenLine, X } from 'lucide-react';
import type { Member } from '../data/members';
import { downloadMemberCard } from '../utils/cardExporter';

interface MemberSpotlightModalProps {
  member: Member;
  bloomCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSendBloom: (member: Member) => void;
  onWriteWish: (member: Member) => void;
}

export function MemberSpotlightModal({
  member,
  bloomCount,
  onClose,
  onPrev,
  onNext,
  onSendBloom,
  onWriteWish,
}: MemberSpotlightModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [justBloomed, setJustBloomed] = useState(false);
  const [bloomAnimKey, setBloomAnimKey] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
    setJustBloomed(false);
    setBloomAnimKey(0);
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

  const handleBloomClick = () => {
    onSendBloom(member);
    setBloomAnimKey((k) => k + 1);
    setJustBloomed(true);
    window.setTimeout(() => setJustBloomed(false), 1100);
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadMemberCard(member);
    } finally {
      setIsDownloading(false);
    }
  };

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
            <span className="tabular-nums">HUB Network · {member.index} / 05</span>
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

          {/* Tribute Content */}
          <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 lg:p-10 gap-8">
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

            {/* Interactive Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleBloomClick}
                className="inline-flex items-center gap-2.5 rounded-full bg-[#f5efe2] px-5 py-2.5 text-sm font-medium text-[#151510] transition-transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap shrink-0"
              >
                <Flower2 className="h-4 w-4" />
                <span>{justBloomed ? 'Đã thả hoa chúc mừng!' : 'Thả hoa chúc mừng'}</span>
                <span
                  key={bloomAnimKey}
                  className={`tabular-nums text-xs opacity-80 ${
                    bloomAnimKey > 0 ? 'animate-bloom-pop' : ''
                  }`}
                >
                  ({bloomCount})
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 rounded-full border border-[#f5efe2]/28 px-5 py-2.5 text-sm font-medium text-[#f5efe2] transition-colors hover:border-[#f5efe2] hover:bg-[#f5efe2]/10 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <Download className="h-4 w-4" />
                <span>{isDownloading ? 'Đang tạo thiệp...' : 'Tải thiệp 19/11'}</span>
              </button>

              <button
                type="button"
                onClick={() => onWriteWish(member)}
                className="inline-flex items-center gap-2 rounded-full border border-[#f5efe2]/18 px-4 py-2.5 text-sm font-medium text-[#f5efe2]/80 transition-colors hover:border-[#f5efe2]/50 hover:text-[#f5efe2] whitespace-nowrap shrink-0"
              >
                <PenLine className="h-4 w-4" />
                <span>Viết lời chúc riêng</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
