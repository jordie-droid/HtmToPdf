# HtmlToPdf

HtmlToPdf is a web application built with **Node.js**, **Express.js**, and **Playwright** that enables the generation of high-quality PDF documents from HTML content.

The application leverages the power of **Chromium** through Playwright to accurately render HTML and CSS before converting it into PDF format. This ensures that the generated documents closely match the appearance of modern web browsers.

## 🚀 Features

- Convert HTML content into PDF documents.
- Full support for HTML5 and CSS3.
- Multi-page PDF generation.
- Custom header and footer support.
- Local and remote image rendering.
- Custom font support.
- Simple and lightweight REST API.
- High-fidelity rendering powered by Chromium.
- Optimized for business documents and automated reporting.
- Fast and reliable PDF generation.

## 🛠️ Technologies

- Node.js
- Express.js
- Playwright
- Chromium
- JavaScript

## 📋 Use Cases

- Invoice generation
- Purchase orders
- Business reports
- HR documents
- Contracts and agreements
- Automated reporting solutions
- Power Automate integrations
- Dynamic document generation from HTML templates

## ⚙️ How It Works

1. The client sends HTML content through an HTTP request.
2. The Express server receives and processes the request.
3. Playwright launches a headless Chromium browser.
4. The HTML is rendered exactly as it would appear in a web browser.
5. Chromium generates a PDF from the rendered page.
6. The generated PDF is returned to the client or saved on the server.

## 🎯 Project Goal

The goal of this project is to provide a reliable, scalable, and easy-to-integrate solution for converting dynamic HTML content into professional PDF documents. It is particularly suited for enterprise applications that require automated document generation with consistent formatting and high rendering accuracy.

## 📦 Installation

```bash
git clone https://github.com/jordie-lutundula_CASTEL/htmlToPdf.git
cd htmlToPdf
npm install
```

## ▶️ Getting Started

Run the application:

```bash
npm start
```

Or start it in development mode:

```bash
npm run dev
```

## 📄 API Example

### Request

```http
POST /api/pdf
Content-Type: text/html
```

### Request Body

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Sample PDF</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 40px;
        }

        h1 {
            color: #2c3e50;
        }
    </style>
</head>
<body>
    <h1>Hello World</h1>
    <p>
        This PDF document was generated from HTML using HtmlToPdf.
    </p>
</body>
</html>
```
### Response

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="document.pdf"
Content-Length: 58231
Cache-Control: no-store
X-Request-Id: 7c1f8e2a-4c32-4e91-91e7-5c9f2b8d14a7
Date: Tue, 22 Sep 2026 10:20:15 GMT
Connection: keep-alive
```

The generated PDF file is returned directly in the response.

## 🔒 Benefits

- Fast PDF generation
- Browser-accurate rendering
- Easy integration with existing applications
- Suitable for cloud and on-premises deployments
- Lightweight and scalable architecture
- Consistent output across environments

## 🌟 Why Playwright?

Playwright uses the Chromium rendering engine, allowing PDFs to be generated exactly as pages appear in modern browsers. This guarantees high compatibility with advanced HTML and CSS features, including:

- Flexbox
- CSS Grid
- Custom Fonts
- SVG Graphics
- Media Queries
- Page Break Controls
- Complex Layouts

## 🤝 Contributing

Contributions are welcome.

If you would like to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Submit a pull request.

## 📜 License

This project is released under the MIT License.

## 👨‍💻 Author

**Jordie LUTUNDULA**

HtmlToPdf is a Node.js, Express, and Playwright-based PDF generation service designed to transform dynamic HTML content into professional, print-ready PDF documents with high accuracy, reliability, and performance.
