# Tra cứu ghế khách mời 21.4

Web app tĩnh để tra cứu nhanh ghế ngồi khách mời trên điện thoại từ file CSV `DANH_SACH_KHACH_MOI_TRA_CUU_GHE_21_4.csv`.

## Tính năng
- Mở ra là thấy toàn bộ danh sách khách mời
- Gõ tên là lọc ngay theo thời gian thực
- Gõ không dấu vẫn tìm được
- Chạm vào một dòng để làm nổi bật ghế và thông tin khách mời
- Có thể dùng như web app trên điện thoại
- Hỗ trợ dùng offline sau khi đã mở một lần

## Cấu trúc file
- `index.html`: giao diện chính
- `styles.css`: giao diện mobile
- `app.js`: logic tìm kiếm và hiển thị
- `guests.js`: dữ liệu khách mời mà website sử dụng
- `DANH_SACH_KHACH_MOI_TRA_CUU_GHE_21_4.csv`: file nguồn dữ liệu
- `convert_csv_to_guests_js.py`: script chuyển CSV thành `guests.js`
- `manifest.webmanifest`, `sw.js`: hỗ trợ cài ra màn hình chính và dùng offline

## Cách đưa lên GitHub Pages
1. Tạo một repository GitHub mới.
2. Upload toàn bộ file trong thư mục này lên nhánh `main`.
3. Vào **Settings** → **Pages**.
4. Ở mục **Build and deployment**, chọn:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Lưu lại và chờ GitHub Pages xuất link.

Link thường có dạng:
`https://TEN-USERNAME.github.io/TEN-REPO/`

## Cập nhật danh sách khách mời
Khi dữ liệu ghế thay đổi:
1. Thay file CSV nguồn bằng file CSV mới.
2. Chạy script:
   ```bash
   python convert_csv_to_guests_js.py
   ```
3. Upload lại file `guests.js` mới lên GitHub.
4. Tăng phiên bản cache trong `sw.js` nếu muốn điện thoại nhận dữ liệu mới ngay.

## Dữ liệu hiện tại
- Tổng số bản ghi: 216
- File nguồn: `DANH_SACH_KHACH_MOI_TRA_CUU_GHE_21_4.csv`
