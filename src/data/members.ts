export interface Member {
  id: string;
  index: string;
  name: string;
  portrait: string;
  epithet: string;
  traits: string[];
  accentHex: string;
  accentLabel: string;
  tributeTitle: string;
  tributeMessage: string;
  signatureWish: string;
  initialBlooms: number;
}

export interface WishItem {
  id: string;
  recipientId: string; // 'all' or member.id
  recipientName: string;
  author: string;
  message: string;
  createdAt: string;
}

export const MEMBERS: Member[] = [
  {
    id: 'chi-kien',
    index: '01',
    name: 'Chí Kiên',
    portrait: '/portraits/chi-kien.jpg',
    epithet: 'Điềm tĩnh giữa những cơn mưa đêm',
    traits: ['Bản lĩnh', 'Chu đáo', 'Đáng tin cậy'],
    accentHex: '#f6c270',
    accentLabel: 'Ánh hổ phách',
    tributeTitle: 'Vững vàng trong từng khoảnh khắc',
    tributeMessage:
      'Dù giữa những buổi sự kiện mưa rơi hay những chặng đường bận rộn nhất, Chí Kiên luôn giữ được phong thái điềm đạm, nụ cười ấm áp và sự tận tâm khiến mọi người xung quanh luôn cảm thấy an tâm.',
    signatureWish:
      'Chúc Chí Kiên ngày 19/11 thật nhiều sức khỏe, giữ mãi ngọn lửa nhiệt huyết và gặt hái thật nhiều cột mốc rực rỡ phía trước.',
    initialBlooms: 19,
  },
  {
    id: 'hoang-viet',
    index: '02',
    name: 'Hoàng Việt',
    portrait: '/portraits/hoang-viet.jpg',
    epithet: 'Nguồn năng lượng dẫn nhịp sân khấu',
    traits: ['Tự tin', 'Nhiệt huyết', 'Truyền cảm hứng'],
    accentHex: '#f08c7d',
    accentLabel: 'Sắc đỏ hoàng hôn',
    tributeTitle: 'Tỏa sáng mỗi khi cất lên tiếng nói',
    tributeMessage:
      'Mỗi lần cầm micro đứng trước ánh đèn sân khấu, Hoàng Việt luôn mang đến một nguồn năng lượng trẻ trung, chân thành và đầy sức hút — kết nối mọi người bằng chính sự tự tin và tinh thần hết mình.',
    signatureWish:
      'Chúc Hoàng Việt 19/11 thật bùng nổ, luôn bản lĩnh trên mọi sân khấu lớn nhỏ của cuộc đời và giữ mãi nụ cười rạng rỡ.',
    initialBlooms: 22,
  },
  {
    id: 'minh-dang',
    index: '03',
    name: 'Minh Đăng',
    portrait: '/portraits/minh-dang.jpg',
    epithet: 'Nét trầm lắng đầy cuốn hút về đêm',
    traits: ['Tinh tế', 'Phong thái', 'Chân thành'],
    accentHex: '#7ad8b6',
    accentLabel: 'Sắc ngọc đêm',
    tributeTitle: 'Lặng lẽ ghi dấu bằng chất riêng',
    tributeMessage:
      'Không cần quá ồn ào, Minh Đăng luôn để lại ấn tượng bởi gu thẩm mỹ tinh tế, sự nhẹ nhàng trong cách cư xử và nét điềm tĩnh rất riêng — như một bông hoa nở lặng lẽ nhưng đủ làm bừng sáng cả góc phố đêm.',
    signatureWish:
      'Chúc Minh Đăng ngày Quốc Tế Đàn Ông thật bình an, luôn giữ trọn chất riêng, gặp nhiều niềm vui bất ngờ và đạt được mọi dự định.',
    initialBlooms: 18,
  },
  {
    id: 'phuc-dang',
    index: '04',
    name: 'Phúc Đăng',
    portrait: '/portraits/phuc-dang.jpg',
    epithet: 'Nụ cười rạng rỡ lưu trọn khung hình',
    traits: ['Tích cực', 'Gần gũi', 'Tràn đầy sức sống'],
    accentHex: '#9ec5ff',
    accentLabel: 'Ánh sao lam',
    tributeTitle: 'Mang ánh sáng tươi mới đến mọi nơi',
    tributeMessage:
      'Khoảnh khắc nào có Phúc Đăng cũng trở nên nhẹ nhàng và rộn rã tiếng cười hơn. Sự chân thật, năng động và tinh thần lạc quan của cậu luôn là liều vitamin tích cực nhất cho cả tập thể.',
    signatureWish:
      'Chúc Phúc Đăng 19/11 luôn vui vẻ, khỏe mạnh, giữ mãi ánh mắt trong trẻo và tinh thần nhiệt thành đáng quý này nhé.',
    initialBlooms: 24,
  },
  {
    id: 'quang-minh',
    index: '05',
    name: 'Quang Minh',
    portrait: '/portraits/quang-minh.jpg',
    epithet: 'Sự tập trung kiến tạo nên thành quả',
    traits: ['Kỷ luật', 'Sắc bén', 'Tận tụy'],
    accentHex: '#e9d8a6',
    accentLabel: 'Ánh trăng ngà',
    tributeTitle: 'Bền bỉ phía sau những tấm bằng khen',
    tributeMessage:
      'Từ những giờ miệt mài bên chiếc máy tính đến những dấu ấn ghi nhận bằng sự nỗ lực không ngừng, Quang Minh là hình mẫu của sự chỉn chu, cầu tiến và tinh thần trách nhiệm cao độ.',
    signatureWish:
      'Chúc Quang Minh ngày 19/11 thật nhiều cảm hứng, công việc và học tập luôn hanh thông, và đừng quên dành chút thời gian nghỉ ngơi cho bản thân.',
    initialBlooms: 21,
  },
];

export const INITIAL_WISHES: WishItem[] = [
  {
    id: 'wish-1',
    recipientId: 'all',
    recipientName: 'Cả 5 chàng trai',
    author: 'Hội chị em 19/11',
    message:
      'Chúc mừng Ngày Quốc Tế Đàn Ông! Cảm ơn cả 5 chàng trai vì đã luôn đồng hành, sẻ chia và mang đến thật nhiều năng lượng tuyệt vời trong suốt thời gian qua. Mong các bạn luôn mạnh mẽ, hạnh phúc và rực rỡ như thung lũng hoa đêm nay.',
    createdAt: '19/11/2026',
  },
  {
    id: 'wish-2',
    recipientId: 'chi-kien',
    recipientName: 'Chí Kiên',
    author: 'Ban Tổ Chức',
    message:
      'Cảm ơn Chí Kiên vì sự tận tâm và bản lĩnh trong mọi chương trình. Chúc Kiên một ngày 19/11 thật ấm áp, luôn vững vàng trước mọi thử thách.',
    createdAt: '19/11/2026',
  },
  {
    id: 'wish-3',
    recipientId: 'hoang-viet',
    recipientName: 'Hoàng Việt',
    author: 'Team Truyền Thông',
    message:
      'Chúc Việt 19/11 luôn giữ được chất giọng truyền cảm và nguồn nhiệt huyết bùng nổ mỗi khi lên sân khấu nhé!',
    createdAt: '19/11/2026',
  },
  {
    id: 'wish-4',
    recipientId: 'minh-dang',
    recipientName: 'Minh Đăng',
    author: 'Những người bạn đồng hành',
    message:
      'Chúc Minh Đăng ngày 19/11 thật nhiều niềm vui, luôn giữ mãi phong thái điềm đạm, tinh tế và gặp thật nhiều điều may mắn trên hành trình sắp tới.',
    createdAt: '19/11/2026',
  },
  {
    id: 'wish-5',
    recipientId: 'phuc-dang',
    recipientName: 'Phúc Đăng',
    author: 'Team Hậu Cần',
    message:
      'Chúc Phúc Đăng 19/11 lúc nào cũng tươi rói như trong khung hình máy ảnh, tràn đầy sức trẻ và thành công với mọi dự định!',
    createdAt: '19/11/2026',
  },
  {
    id: 'wish-6',
    recipientId: 'quang-minh',
    recipientName: 'Quang Minh',
    author: 'Đồng đội văn phòng',
    message:
      'Chúc Quang Minh 19/11 thật nhiều sức khỏe, tiếp tục chinh phục thêm thật nhiều bằng khen mới và có một buổi tối thư giãn thật trọn vẹn.',
    createdAt: '19/11/2026',
  },
];
