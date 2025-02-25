# CMU-CS 445 RIS (2025S)

Dự án Express.js đơn giản sử dụng EJS làm công cụ template cùng với tính năng tự động tải lại trang khi phát triển.

## Tính năng

- **Express.js**: Framework web cho Node.js.
- **EJS**: Template sử dụng JavaScript nhúng.
- **Express EJS Layouts**: Hỗ trợ layout cho template EJS.
- **Live Reload**: Tự động tải lại trình duyệt khi có thay đổi tệp.
- **Prettier**: Công cụ định dạng mã nguồn hỗ trợ EJS.

## Yêu cầu

- Node.js v14 trở lên
- npm (Node Package Manager)

## Cài đặt

1. **Clone dự án**:

   ```bash
   git clone https://github.com/InnovForge/CMU-CS-445-RIS_2025S.git
   cd CMU-CS-445-RIS_2025S
   ```

2. **Cài đặt các gói phụ thuộc**:

   ```bash
   npm install
   ```

3. **sao chép file .env.example thành .env**:

   ```bash
   npm run setup
   ```

## Phát triển

- **Chạy server phát triển với live reload** (tự động tải lại trang khi có thay đổi):

  ```bash
  npm run dev
  ```

- **Định dạng mã nguồn với Prettier**:

  ```bash
  npm run format
  ```

- **Xoá dependencies**:

  ```bash
  npm run clean

  ```
## Cấu trúc dự án

```
ejs-demo/
├── views/              # Template EJS
│   ├── layouts/        # Template layout
│   ├── pages/          # Trang riêng lẻ
│   └── partials/       # Template dùng chung
├── public/             # Tệp tĩnh (CSS, JS, hình ảnh)
├── server.js           # Tệp chính của server
├── nodemon.json        # Cấu hình Nodemon
└── package.json        # Cấu hình dự án
```

## Sử dụng

1. **Chạy server phát triển**:

   ```bash
   npm run dev
   ```

2. **Mở trình duyệt và truy cập**:

   ```
   http://localhost:8090
   ```

## Dependencies

- **[express](https://www.npmjs.com/package/express)**: Framework web nhanh, linh hoạt cho Node.js.
- **[ejs](https://www.npmjs.com/package/ejs)**: Template sử dụng JavaScript nhúng.
- **[express-ejs-layouts](https://www.npmjs.com/package/express-ejs-layouts)**: Hỗ trợ layout cho template EJS.

## Dev Dependencies

- **[nodemon](https://www.npmjs.com/package/nodemon)**: Tự động khởi động lại server khi có thay đổi tệp.
- **[livereload](https://www.npmjs.com/package/livereload)**: Hỗ trợ live reload khi phát triển.
- **[connect-livereload](https://www.npmjs.com/package/connect-livereload)**: Middleware cho live reload.
- **[prettier](https://www.npmjs.com/package/prettier)**: Công cụ định dạng mã nguồn.
- **[prettier-plugin-ejs](https://www.npmjs.com/package/prettier-plugin-ejs)**: Plugin Prettier cho tệp EJS.
