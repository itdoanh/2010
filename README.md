# 🌷 Chúc Mừng Ngày Phụ Nữ Việt Nam — 20.10.2026

> Trang web chúc mừng 20/10 dành tặng **tất cả phái đẹp Việt** — sáng sủa, tinh tế, nhiều hoa!

🌐 **Live demo:** [https://itdoanh.github.io/2010](https://itdoanh.github.io/2010)

---

## 💐 Điểm đặc biệt

- ✨ Toàn bộ **2D** (SVG + CSS animation), không WebGL, không cần build tool
- 🌸 **Nền gradient giấy** + **hoa trang trí** mọi góc + **cánh hoa rơi** liên tục (6 loại)
- 💐 **365 bó hoa** khác nhau lưu template-thủ tục, mỗi ngày lại 1 bó + shuffle bất kỳ
- 🌹 9 loại hoa: hoa hồng, tulip, hướng dương, cúc, mẫu đơn, ly, lan, anh đào, lavender
- 🎨 15 palettes: hồng xuân, đỏ hoàng gia, hoàng hôn, lavender, vàng lemon, pastel, cầu vồng...
- 🌷 Cá nhân hoá - người xem gõ tên mình → lời chúc đổi theo tên **ngay lập tức**
- 📱 Responsive hoàn toàn — đẹp trên mobile, tablet, desktop

---

## 📂 Cấu trúc

```
2010/
├── index.html          # 4 trang chuyển tiếp mượt
├── README.md
├── css/
│   └── style.css       # Tất cả style + animation, gradient giấy, sparkle, petals
├── js/
│   ├── bouquet.js      # Generator + SVG renderer cho 365 bó hoa
│   └── main.js         # Splash, petals, sparkle, navigation, personalize
└── data/
    └── bouquets.template.json   # Template palettes + flower types
```

---

## 🚀 Cài đặt

Không cần cài gì! Mở `index.html` bằng trình duyệt là chạy, hoặc:

```bash
# Serve local
python -m http.server 8000
# Mở http://localhost:8000
```

---

## 🎨 Trình tự trang

1. **Splash** — countdown `20.10.2026` (3 giây)
2. **Thư mở đầu** — lá thư giấy gửi "Người phụ nữ tuyệt vời"
3. **Lời chúc** — bài chúc chính, 9 đoạn với quote cách điệu
4. **Trang kết** — **bó hoa SVG to giữa màn hình**, tên người nhận, nút shuffle

---

## 💐 Cách chọn bó hoa

- **Mặc định**: bó hoa theo *ngày trong năm* (mỗi ngày 1 bó, lặp 365)
- **Shuffle**: 🎲 Đổi bó hoa khác → chọn ngẫu nhiên trong 365 mẫu

---

## 🌷 15 Palettes

| ID | Tên | Tông |
|---|---|---|
| `spring-pink` | Hồng Xuân | ngọt ngào |
| `royal-red` | Đỏ Hoàng Gia | cổ điển |
| `sunset` | Hoàng Hôn | cam-đỏ |
| `lavender-dream` | Mộng Lavender | tím-xanh |
| `lemon-yellow` | Vàng Lemon | tươi sáng |
| `rose-pastel` | Pastel Rose | dịu dàng |
| `tulip-rainbow` | Cầu Vồng | nhiều màu |
| `cherry-blossom` | Hoa Anh Đào | Nhật |
| `warm-peach` | Đào Ấm | cam-cam |
| `ocean-breeze` | Biển Mát | xanh-lam |
| `moonlit-white` | Trăng Trắng | trắng-kem |
| `vintage-burgundy` | Burgundy Cổ Điển | rượu vang |
| `garden-mix` | Vườn Xanh | hồng-vàng |
| `candy-pop` | Kẹo Ngọt | hồng-kem |
| `rose-gold` | Rose Gold | vàng-hồng |

---

## 🌹 9 Loại hoa SVG

Rose · Tulip · Sunflower · Daisy · Peony · Lily · Orchid · Cherry · Lavender

Tất cả vẽ **100% inline SVG** (không ảnh), tự render trong `bouquet.js`.

---

## 📜 Lời chúc

Toàn bộ lời chúc viết tay bằng tiếng Việt, dành tặng **tất cả phái đẹp Việt Nam** —
không riêng ai, đọc là cảm được.

---

**Made with 💖 for Vietnamese Women's Day · 20.10.2026**
