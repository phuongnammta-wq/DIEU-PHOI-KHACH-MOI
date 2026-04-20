# Tra cứu ghế khách mời

Web app tĩnh để tra cứu nhanh ghế ngồi của khách mời trên điện thoại. Có thể đưa thẳng lên **GitHub Pages**.

## Tính năng
- Tìm theo **tên khách mời**
- Hỗ trợ gõ **không dấu**
- Hiện **ghế ngồi nổi bật** ở đầu màn hình
- Dùng tốt trên điện thoại
- Có thể dùng **offline** sau khi mở một lần

## Cấu trúc dữ liệu
Dữ liệu đang lấy từ file `guests.js`, được tạo từ CSV với các cột:
- `rank_name`
- `position`
- `seat`

Hiện có **214** khách mời.

## Cách đưa lên GitHub Pages
1. Tạo repository mới trên GitHub.
2. Upload toàn bộ file trong thư mục này lên repository.
3. Vào **Settings → Pages**.
4. Ở mục **Build and deployment**, chọn:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (hoặc `master`) / `/root`
5. Lưu lại. Sau đó GitHub sẽ cấp một link web để mở trên điện thoại.

## Cập nhật dữ liệu
Khi có CSV mới, chỉ cần thay nội dung trong `guests.js` hoặc chạy lại bước chuyển CSV sang JS.

## Gợi ý tên repo
- `tra-cuu-ghe-khach-moi`
- `anh-hung-seat-lookup`
