import { useEffect, useState, type FormEvent } from 'react';
import { Send, X } from 'lucide-react';
import type { Member, WishItem } from '../data/members';

interface WishComposerModalProps {
  members: Member[];
  defaultRecipientId?: string;
  onClose: () => void;
  onSubmitWish: (wish: Omit<WishItem, 'id' | 'createdAt'>) => void;
}

export function WishComposerModal({
  members,
  defaultRecipientId = 'all',
  onClose,
  onSubmitWish,
}: WishComposerModalProps) {
  const [recipientId, setRecipientId] = useState(defaultRecipientId);
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 6) {
      setError('Hãy viết một lời chúc ngắn ít nhất 6 ký tự nhé.');
      return;
    }

    const targetMember = members.find((m) => m.id === recipientId);
    const recipientName = targetMember ? targetMember.name : 'Cả 5 chàng trai';

    onSubmitWish({
      recipientId,
      recipientName,
      author: author.trim() || 'Một người bạn dấu tên',
      message: trimmedMessage,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wish-composer-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-[#f5efe2]/18 bg-[#080a10] p-6 sm:p-8 text-[#f5efe2] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.16em] uppercase text-[#f5efe2]/55">
              Ngày Quốc Tế Đàn Ông · 19/11
            </p>
            <h2
              id="wish-composer-title"
              className="mt-1.5 font-display text-4xl font-normal uppercase tracking-[-0.01em]"
            >
              Gửi lời chúc vào thung lũng
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng biểu mẫu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#f5efe2]/20 text-[#f5efe2]/80 transition-colors hover:bg-[#f5efe2] hover:text-[#151510]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="wish-recipient"
              className="block text-xs font-medium tracking-[0.14em] uppercase text-[#f5efe2]/65"
            >
              Gửi tới
            </label>
            <select
              id="wish-recipient"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-[#f5efe2]/20 bg-[#0d111a] px-4 py-3 text-sm text-[#f5efe2] focus:border-[#f5efe2]"
            >
              <option value="all">Cả 5 chàng trai</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="wish-author"
              className="block text-xs font-medium tracking-[0.14em] uppercase text-[#f5efe2]/65"
            >
              Tên của bạn
            </label>
            <input
              id="wish-author"
              type="text"
              maxLength={48}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Ví dụ: Mai Trang, Hội chị em..."
              className="mt-2 w-full rounded-lg border border-[#f5efe2]/20 bg-[#0d111a] px-4 py-3 text-sm text-[#f5efe2] placeholder:text-[#f5efe2]/35 focus:border-[#f5efe2]"
            />
          </div>

          <div>
            <label
              htmlFor="wish-message"
              className="block text-xs font-medium tracking-[0.14em] uppercase text-[#f5efe2]/65"
            >
              Lời chúc 19/11
            </label>
            <textarea
              id="wish-message"
              rows={4}
              maxLength={360}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (error) setError('');
              }}
              placeholder="Viết lời chúc chân thành gửi đến các chàng trai nhân ngày 19/11..."
              className="mt-2 w-full resize-none rounded-lg border border-[#f5efe2]/20 bg-[#0d111a] px-4 py-3 text-sm leading-relaxed text-[#f5efe2] placeholder:text-[#f5efe2]/35 focus:border-[#f5efe2]"
            />
            {error && <p className="mt-1.5 text-xs text-[#f08c7d]">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#f5efe2]/22 px-5 py-2.5 text-sm font-medium text-[#f5efe2]/80 transition-colors hover:border-[#f5efe2]/55 hover:text-[#f5efe2]"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-[#f5efe2] px-6 py-2.5 text-sm font-medium text-[#151510] transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Send className="h-4 w-4" />
              <span>Gửi lời chúc</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
