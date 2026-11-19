import type { SwordId } from '../components/WarriorSwords';

export interface Member {
  id: string;
  name: string;
  portrait: string;
  swordId: SwordId;
  swordName: string;
  warriorTitle: string;
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
    name: 'Chí Kiên',
    portrait: '/portraits/chi-kien.jpg',
    swordId: 'tram-phong',
    swordName: 'Kiếm Trầm Phong',
    warriorTitle: 'Chiến binh Hộ Vệ',
    epithet: 'Điềm tĩnh giữa những cơn mưa đêm',
    traits: ['Bản lĩnh', 'Chu đáo', 'Đáng tin cậy'],
    accentHex: '#f6c270',
    accentLabel: 'Ánh Hổ Phách',
    tributeTitle: 'Vững vàng trong từng khoảnh khắc',
    tributeMessage:
      'Cảm ơn Chí Kiên vì dù giữa những buổi sự kiện mưa rơi hay những chặng đường bận rộn nhất, bạn luôn giữ trọn phong thái điềm đạm, nụ cười ấm áp và sự tận tâm khiến mọi người xung quanh luôn thấy vững lòng.',
    signatureWish:
      'Chúc mừng Ngày Quốc tế Đàn ông 19/11! Chúc Chí Kiên thật nhiều sức khỏe, giữ mãi ngọn lửa nhiệt huyết và chinh phục thật nhiều cột mốc rực rỡ phía trước.',
  },
  {
    id: 'hoang-viet',
    name: 'Hoàng Việt',
    portrait: '/portraits/hoang-viet.jpg',
    swordId: 'nhat-quang',
    swordName: 'Kiếm Nhật Quang',
    warriorTitle: 'Chiến binh Tiên Phong',
    epithet: 'Nguồn năng lượng dẫn nhịp sân khấu',
    traits: ['Tự tin', 'Nhiệt huyết', 'Truyền cảm hứng'],
    accentHex: '#f08c7d',
    accentLabel: 'Sắc Đỏ Hoàng Hôn',
    tributeTitle: 'Tỏa sáng mỗi khi cất lên tiếng nói',
    tributeMessage:
      'Cảm ơn Hoàng Việt vì mỗi khi cầm micro đứng trước ánh đèn sân khấu, bạn luôn mang đến nguồn năng lượng trẻ trung, chân thành và đầy cuốn hút — kết nối mọi người bằng chính sự tự tin và tinh thần hết mình.',
    signatureWish:
      'Chúc mừng Ngày Quốc tế Đàn ông 19/11! Chúc Hoàng Việt luôn bùng nổ, giữ vững bản lĩnh trên mọi sân khấu lớn nhỏ của cuộc đời và mãi rạng rỡ nụ cười tự tin.',
  },
  {
    id: 'minh-dang',
    name: 'Minh Đăng',
    portrait: '/portraits/minh-dang.jpg',
    swordId: 'da-ngoc',
    swordName: 'Kiếm Dạ Ngọc',
    warriorTitle: 'Chiến binh Dạ Ảnh',
    epithet: 'Nét trầm lắng đầy cuốn hút về đêm',
    traits: ['Tinh tế', 'Phong thái', 'Chân thành'],
    accentHex: '#7ad8b6',
    accentLabel: 'Sắc Ngọc Đêm',
    tributeTitle: 'Lặng lẽ ghi dấu bằng chất riêng',
    tributeMessage:
      'Cảm ơn Minh Đăng vì sự tinh tế trong từng chi tiết nhỏ, cách cư xử nhẹ nhàng và nét điềm tĩnh rất riêng — không cần ồn ào nhưng luôn đủ sức tạo nên dấu ấn sâu sắc giữa tập thể HUB Network.',
    signatureWish:
      'Chúc mừng Ngày Quốc tế Đàn ông 19/11! Chúc Minh Đăng luôn bình an, giữ trọn phong thái riêng, đón thật nhiều niềm vui bất ngờ và hoàn thành trọn vẹn mọi dự định.',
  },
  {
    id: 'phuc-dang',
    name: 'Phúc Đăng',
    portrait: '/portraits/phuc-dang.jpg',
    swordId: 'tinh-than',
    swordName: 'Kiếm Tinh Thần',
    warriorTitle: 'Chiến binh Ánh Sao',
    epithet: 'Nụ cười rạng rỡ lưu trọn khung hình',
    traits: ['Tích cực', 'Gần gũi', 'Tràn đầy sức sống'],
    accentHex: '#9ec5ff',
    accentLabel: 'Ánh Sao Lam',
    tributeTitle: 'Mang ánh sáng tươi mới đến mọi nơi',
    tributeMessage:
      'Cảm ơn Phúc Đăng vì mỗi khoảnh khắc có bạn đều trở nên nhẹ nhàng và rộn rã tiếng cười hơn. Sự chân thật, năng động và tinh thần lạc quan của bạn luôn là nguồn năng lượng tích cực đáng quý nhất của cả tập thể.',
    signatureWish:
      'Chúc mừng Ngày Quốc tế Đàn ông 19/11! Chúc Phúc Đăng luôn vui vẻ, khỏe mạnh, giữ mãi ánh mắt trong trẻo và nguồn nhiệt huyết tràn đầy này nhé.',
  },
  {
    id: 'quang-minh',
    name: 'Quang Minh',
    portrait: '/portraits/quang-minh.jpg',
    swordId: 'kien-cuong',
    swordName: 'Kiếm Kiên Cương',
    warriorTitle: 'Chiến binh Thép',
    epithet: 'Khí chất người lính, ánh nhìn hướng xa',
    traits: ['Kỷ luật', 'Kiên định', 'Mạnh mẽ'],
    accentHex: '#a8c98a',
    accentLabel: 'Sắc Lục Quân',
    tributeTitle: 'Rắn rỏi và kiên định trước mọi thử thách',
    tributeMessage:
      'Cảm ơn Quang Minh vì sự kỷ luật, rắn rỏi và tinh thần sẵn sàng tiến về phía trước. Sự kiên định cùng trách nhiệm của bạn luôn mang lại cảm giác tin cậy tuyệt đối cho đồng đội trên mọi chặng đường.',
    signatureWish:
      'Chúc mừng Ngày Quốc tế Đàn ông 19/11! Chúc Quang Minh thật nhiều sức khỏe, luôn giữ vững khí chất mạnh mẽ và chinh phục trọn vẹn mọi mục tiêu đã đặt ra.',
  },
  {
    id: 'hieu-vu',
    name: 'Hiếu Vũ',
    portrait: '/portraits/hieu-vu.jpg',
    swordId: 'mong-hoa',
    swordName: 'Kiếm Mộng Hoa',
    warriorTitle: 'Chiến binh Nghệ Sĩ',
    epithet: 'Tâm hồn nghệ sĩ giữa những khung tranh',
    traits: ['Sâu sắc', 'Trầm tĩnh', 'Giàu cảm xúc'],
    accentHex: '#d9b8f0',
    accentLabel: 'Sắc Tím Oải Hương',
    tributeTitle: 'Lặng ngắm để thấu hiểu cái đẹp',
    tributeMessage:
      'Cảm ơn Hiếu Vũ vì góc nhìn chậm rãi, tinh tế và giàu chiều sâu mà bạn mang đến. Sự điềm đạm cùng tâm hồn yêu nghệ thuật của bạn luôn mở ra những cảm hứng mới mẻ và ấm áp cho cả tập thể.',
    signatureWish:
      'Chúc mừng Ngày Quốc tế Đàn ông 19/11! Chúc Hiếu Vũ luôn bình yên, giữ trọn tâm hồn nghệ sĩ và tìm thấy thật nhiều cảm hứng đẹp trên mọi hành trình.',
  },
  {
    id: 'pham-phuong',
    name: 'Phạm Phương',
    portrait: '/portraits/pham-phuong.jpg',
    swordId: 'minh-nguyet',
    swordName: 'Kiếm Minh Nguyệt',
    warriorTitle: 'Chiến binh Trí Tuệ',
    epithet: 'Sự tập trung kiến tạo nên thành quả',
    traits: ['Chỉn chu', 'Sắc bén', 'Tận tụy'],
    accentHex: '#e9d8a6',
    accentLabel: 'Ánh Trăng Ngà',
    tributeTitle: 'Bền bỉ phía sau những thành tựu',
    tributeMessage:
      'Cảm ơn Phạm Phương vì sự chỉn chu, tinh thần cầu tiến và nỗ lực bền bỉ trong từng công việc. Sự tập trung sắc bén và trách nhiệm cao độ của bạn luôn là điểm tựa đáng tự hào của HUB Network.',
    signatureWish:
      'Chúc mừng Ngày Quốc tế Đàn ông 19/11! Chúc Phạm Phương thật nhiều cảm hứng, học tập và công việc luôn hanh thông, và đừng quên dành thời gian nghỉ ngơi thật trọn vẹn cho bản thân.',
  },
];
