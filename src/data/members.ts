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
  },
  {
    id: 'quang-minh',
    index: '05',
    name: 'Quang Minh',
    portrait: '/portraits/quang-minh.jpg',
    epithet: 'Khí chất người lính, ánh nhìn hướng xa',
    traits: ['Kỷ luật', 'Kiên định', 'Mạnh mẽ'],
    accentHex: '#a8c98a',
    accentLabel: 'Sắc lục quân',
    tributeTitle: 'Rắn rỏi như màu áo xanh',
    tributeMessage:
      'Quang Minh mang trong mình nét rắn rỏi, kỷ luật và một ánh nhìn luôn hướng về phía trước. Sự kiên định và tinh thần sẵn sàng của cậu khiến mọi người luôn yên tâm khi có Minh đồng hành.',
    signatureWish:
      'Chúc Quang Minh ngày 19/11 thật nhiều sức khỏe, luôn giữ vững khí chất mạnh mẽ và chinh phục mọi mục tiêu đã đặt ra.',
  },
  {
    id: 'hieu-vu',
    index: '06',
    name: 'Hiếu Vũ',
    portrait: '/portraits/hieu-vu.jpg',
    epithet: 'Tâm hồn nghệ sĩ giữa những khung tranh',
    traits: ['Sâu sắc', 'Trầm tĩnh', 'Giàu cảm xúc'],
    accentHex: '#d9b8f0',
    accentLabel: 'Sắc tím oải hương',
    tributeTitle: 'Lặng ngắm để thấu hiểu',
    tributeMessage:
      'Hiếu Vũ có một cách nhìn thế giới rất riêng — chậm rãi, tinh tế và đầy chiều sâu. Sự điềm đạm cùng tâm hồn yêu cái đẹp của Hiếu luôn mang đến những góc nhìn mới mẻ cho cả tập thể.',
    signatureWish:
      'Chúc Hiếu Vũ ngày 19/11 luôn bình yên, giữ trọn tâm hồn nghệ sĩ và tìm thấy thật nhiều cảm hứng trên mọi hành trình.',
  },
  {
    id: 'pham-phuong',
    index: '07',
    name: 'Phạm Phương',
    portrait: '/portraits/pham-phuong.jpg',
    epithet: 'Sự tập trung kiến tạo nên thành quả',
    traits: ['Chỉn chu', 'Sắc bén', 'Tận tụy'],
    accentHex: '#e9d8a6',
    accentLabel: 'Ánh trăng ngà',
    tributeTitle: 'Bền bỉ phía sau những tấm bằng khen',
    tributeMessage:
      'Từ những giờ miệt mài bên chiếc máy tính đến những dấu ấn ghi nhận bằng sự nỗ lực không ngừng, Phạm Phương là hình mẫu của sự chỉn chu, cầu tiến và tinh thần trách nhiệm cao độ.',
    signatureWish:
      'Chúc Phạm Phương ngày 19/11 thật nhiều cảm hứng, công việc và học tập luôn hanh thông, và đừng quên dành chút thời gian nghỉ ngơi cho bản thân.',
  },
];
