/* Generator CV PDF Shihad (satu halaman A4, layout mengalir).
   Edit data di CV_DATA lalu jalankan ulang:
     $env:NODE_PATH = "<folder node_modules pdfkit>"
     node tools/make-cv-pdf.cjs
   Output: assets/cv-sihad.pdf (dipakai tombol Unduh CV di index.html). */
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "assets", "cv-sihad.pdf");
const PHOTO = path.join(ROOT, "assets", "sihad.jpeg");

const CV_DATA = {
    name: "Sihad",
    role: "Frontend Developer & IoT Enthusiast",
    summary: "Frontend developer dengan fokus pada pembangunan antarmuka web yang responsif, terstruktur, dan mudah digunakan. Terampil menggunakan HTML5, CSS3, dan JavaScript, serta framework Bootstrap dan Tailwind untuk menghadirkan tampilan modern. Terbiasa menerjemahkan kebutuhan pengguna menjadi tampilan digital yang fungsional dan siap tayang.",
    contact: [
        { label: "Email", text: "amsihad0@gmail.com", link: "mailto:amsihad0@gmail.com" },
        { label: "WhatsApp", text: "+62 831 3020 0846", link: "https://wa.me/6283130200846" },
        { label: "LinkedIn", text: "linkedin.com/in/sihad", link: "https://linkedin.com/in/sihad" },
        { label: "GitHub", text: "github.com/sihad24", link: "https://github.com/sihad24" },
        { label: "Lokasi", text: "Indonesia" }
    ],
    skills: ["HTML5", "CSS3", "JavaScript", "Bootstrap 5", "Tailwind CSS"],
    tools: ["Git", "GitHub", "Vercel"],
    projects: [
        {
            title: "Website Portofolio Pribadi",
            year: "2026",
            desc: "Merancang dan membangun website portofolio pribadi dengan tampilan modern, efek 3D interaktif, serta konten yang tersusun rapi.",
            stack: "HTML5, CSS3, JavaScript, Bootstrap"
        },
        {
            title: "Dashboard Informasi",
            year: "2025",
            desc: "Membangun antarmuka dashboard dengan struktur data yang jelas dan tata letak yang nyaman dibaca untuk informasi yang padat.",
            stack: "Bootstrap, Grid Layout, JavaScript"
        },
        {
            title: "Landing Page Promosi",
            year: "2025",
            desc: "Membuat halaman promosi dengan fokus pada pesan utama dan alur visual yang mendukung konversi pengunjung.",
            stack: "Tailwind, CSS Custom, Responsive Design"
        }
    ],
    certificates: [
        { title: "The Bits and Bytes of Computer Networking", meta: "Google via Coursera - 2026" },
        { title: "Foundations of Project Management", meta: "Google via Coursera - 2026" },
        { title: "Webinar: Cloud Native Infrastructure with Docker, Kubernetes & GitOps", meta: "SUHU, Yogyakarta - 2026" },
        { title: "Sertifikat Kompetensi Keahlian", meta: "CV. Wahana Prima - 2023" }
    ]
};

const NAVY = "#0d1b2c";
const NAVY_SOFT = "#16283f";
const ACCENT = "#ff8a3d";
const MINT = "#9ad8c8";
const INK = "#1c2430";
const BODY = "#4a5568";
const MUTED = "#8a93a6";
const SIDEBAR_TEXT = "#d7e1ee";

const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: `CV ${CV_DATA.name}` } });
doc.pipe(fs.createWriteStream(OUT));

const DBG = process.env.CV_DEBUG === "1";
const mark = label => {
    if (DBG) console.log(`${label} -> y terakhir = ${doc.y.toFixed(1)}`);
};

const W = 595.28;
const H = 841.89;
const SB_W = 186;

/* ---------- Kolom kiri (sidebar) ---------- */
doc.rect(0, 0, SB_W, H).fill(NAVY);
doc.rect(0, 0, W, 5).fill(ACCENT);

const PHOTO_BOX = { x: 24, y: 40, w: SB_W - 48, h: 150 };
doc.rect(PHOTO_BOX.x - 4, PHOTO_BOX.y - 4, PHOTO_BOX.w + 8, PHOTO_BOX.h + 8).fill(NAVY_SOFT);
doc.image(PHOTO, PHOTO_BOX.x, PHOTO_BOX.y, { fit: [PHOTO_BOX.w, PHOTO_BOX.h], align: "center", valign: "center" });

const subHeader = "Helvetica-Bold";

const sidebarHeader = (text, y) => {
    doc.fillColor(MINT).font(subHeader).fontSize(9)
        .text(text, 24, y, { characterSpacing: 1.4, width: SB_W - 48 });
    doc.rect(24, y + 13, 40, 1.6).fill(ACCENT);
    return y + 30;
};

let sbY = sidebarHeader("KONTAK", 208);

CV_DATA.contact.forEach(item => {
    doc.fillColor(MINT).font(subHeader).fontSize(7.6)
        .text(item.label.toUpperCase(), 24, sbY, { characterSpacing: 1, width: SB_W - 48 });
    const opts = { width: SB_W - 44, lineGap: 1.2 };
    if (item.link) opts.link = item.link;
    doc.fillColor(SIDEBAR_TEXT).font("Helvetica").fontSize(8.8)
        .text(item.text, 24, sbY + 11.5, opts);
    sbY = doc.y + 13;
});

sbY = sidebarHeader("KEAHLIAN", sbY + 12);
CV_DATA.skills.forEach(skill => {
    doc.fillColor(ACCENT).font(subHeader).fontSize(9)
        .text("•", 26, sbY, { continued: true });
    doc.fillColor(SIDEBAR_TEXT).font("Helvetica").fontSize(9.2)
        .text(`  ${skill}`, { continued: false, lineGap: 2.5, width: SB_W - 60 });
    sbY = doc.y + 6.5;
});

sbY = sidebarHeader("ALAT KERJA", sbY + 12);
CV_DATA.tools.forEach(tool => {
    doc.fillColor(ACCENT).font(subHeader).fontSize(9)
        .text("•", 26, sbY, { continued: true });
    doc.fillColor(SIDEBAR_TEXT).font("Helvetica").fontSize(9.2)
        .text(`  ${tool}`, { continued: false, lineGap: 2.5, width: SB_W - 60 });
    sbY = doc.y + 6.5;
});

/* ---------- Kolom kanan (isi utama) ---------- */
const MAIN_X = SB_W + 26;
const MAIN_W = W - MAIN_X - 26;

const sectionHeader = (text, y) => {
    doc.rect(MAIN_X, y + 1.5, 3.4, 13).fill(ACCENT);
    doc.fillColor(INK).font(subHeader).fontSize(11)
        .text(text, MAIN_X + 10, y, { characterSpacing: 1.2, width: MAIN_W - 10 });
    doc.rect(MAIN_X, y + 20, MAIN_W, 0.7).fill("#e3e7ee");
    return y + 36;
};

let y = 58;

doc.fillColor(INK).font(subHeader).fontSize(21)
    .text(CV_DATA.name, MAIN_X, y, { width: MAIN_W, characterSpacing: 0.5 });

doc.fillColor(ACCENT).font(subHeader).fontSize(11)
    .text(CV_DATA.role, MAIN_X, 86, { width: MAIN_W });

doc.rect(MAIN_X, 105, 46, 3).fill(ACCENT);
mark('nama+role (harus < 105):');

doc.fillColor(BODY).font("Helvetica").fontSize(9.4)
    .text(CV_DATA.summary, MAIN_X, 120, { width: MAIN_W, lineGap: 3 });

y = doc.y + 24;
mark('ringkasan-bottom:');

y = sectionHeader("PENGALAMAN PROYEK", y);

CV_DATA.projects.forEach(project => {
    doc.fillColor(INK).font(subHeader).fontSize(10.4)
        .text(project.title, MAIN_X, y, { width: MAIN_W - 48 });
    doc.fillColor(MUTED).font(subHeader).fontSize(9)
        .text(project.year, MAIN_X, y, { width: MAIN_W, align: "right" });
    doc.fillColor(MUTED).font("Helvetica").fontSize(8.2)
        .text(project.stack.toUpperCase(), MAIN_X, doc.y + 3, { width: MAIN_W, characterSpacing: 0.8 });
    doc.fillColor(BODY).font("Helvetica").fontSize(9.2)
        .text(project.desc, MAIN_X, doc.y + 4, { width: MAIN_W, lineGap: 2.4 });
    y = doc.y + 15;
});
mark('proyek-bottom:');

y = sectionHeader("SERTIFIKASI & PELATIHAN", y + 8);
mark('cert-header-start:');

CV_DATA.certificates.forEach(cert => {
    doc.fillColor(ACCENT).font(subHeader).fontSize(8)
        .text("•", MAIN_X, y, { continued: true });
    doc.fillColor(INK).font(subHeader).fontSize(9.4)
        .text(`  ${cert.title}`, MAIN_X + 4, y, { continued: false, width: MAIN_W - 4, lineGap: 1.5 });
    doc.fillColor(MUTED).font("Helvetica").fontSize(8.4)
        .text(`  ${cert.meta}`, MAIN_X + 4, doc.y + 1.5, { width: MAIN_W - 4 });
    y = doc.y + 9;
});
mark('sertifikat-bottom:');

/* ---------- Kredit bawah ---------- */
const creditY = Math.max(doc.y + 20, H - 92);
mark('kredit-start:');
doc.rect(MAIN_X, creditY, MAIN_W, 0.7).fill("#e3e7ee");
doc.fillColor(MUTED).font("Helvetica-Oblique").fontSize(7.8)
    .text(`Karya dan referensi sumber: github.com/sihad24  ·  Diunduh dari portofolio ${CV_DATA.name}`, MAIN_X, creditY + 10, {
        width: MAIN_W
    });

doc.end();

const waitClosed = new Promise(resolve => {
    doc.on("end", resolve);
});

waitClosed.then(() => {
    const bytes = fs.statSync(OUT).size;
    console.log(`OK: ${OUT} (${(bytes / 1024).toFixed(1)} KB)`);
}).catch(error => {
    console.error("Gagal membuat PDF:", error);
    process.exitCode = 1;
});
