# HtmlToPdf

HtmlToPdf is a web application built with **Node.js**, **Express.js**, and **Playwright** that enables the generation of high-quality PDF documents from HTML content.

The application leverages the power of **Chromium** through Playwright to accurately render HTML and CSS before converting it into a PDF. This ensures that the generated document closely matches the appearance of a modern web browser.

## 🚀 Features

- Convert HTML content to PDF documents.
- Full support for HTML5 and CSS3.
- Multi-page PDF generation.
- Custom header and footer support.
- Local and remote image rendering.
- Custom font support.
- REST API for easy integration.
- High-fidelity rendering powered by Chromium.
- Ideal for business documents and automated reporting.

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
4. The HTML is rendered exactly as it would be in a browser.
5. Chromium generates a PDF from the rendered page.
6. The PDF is returned to the client or saved on the server.

## 🎯 Project Goal

The goal of this project is to provide a reliable, scalable, and easy-to-integrate solution for converting dynamic HTML content into professional PDF documents. It is particularly suited for enterprise applications that require automated document generation with consistent formatting and high rendering accuracy.

## 📦 Installation

```bash
git clone https://github.com/jordie-lutundula_CASTEL/htmlToPdf.git
cd htmlToPdf
npm install
```

## ▶️ Getting Started

```bash
npm start
```

Or run in development mode:

```bash
npm run dev
```

## 📄 API Example

```http
POST /api/pdf
Content-Type: application/json

{
  "html": "<h1>Hello World</h1>"
}
```

## 🔒 Benefits

- Fast PDF generation
- Browser-accurate rendering
- Easy integration with existing applications
- Suitable for cloud and on-premises deployments
- Lightweight and scalable architecture

## 📜 License

This project is released under the MIT License.

## 👨‍💻 Author

**Jordie LUTUNDULA**

A Node.js, Express, and Playwright-based PDF generation service designed to transform dynamic HTML content into professional, print-ready PDF documents with high accuracy and performance.
