document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.getElementById("mainNav");
    const navLinks = Array.from(document.querySelectorAll(".portfolio-link"));
    const revealItems = Array.from(document.querySelectorAll(".reveal"));
    const counters = Array.from(document.querySelectorAll("[data-count]"));
    const filterButtons = Array.from(document.querySelectorAll(".btn-filter"));
    const projectItems = Array.from(document.querySelectorAll(".project-item"));
    const contactForm = document.getElementById("contactForm");
    const backToTop = document.getElementById("backToTop");
    const copyEmailButton = document.getElementById("copyEmail");
    const copyEmailButtons = Array.from(document.querySelectorAll(".btn-copy-email"));
    const downloadCvButton = document.getElementById("downloadCv");
    const copyPortfolioLinkButton = document.getElementById("copyPortfolioLink");
    const currentYear = document.getElementById("currentYear");
    const toastElement = document.getElementById("portfolioToast");
    const toastMessage = document.getElementById("toastMessage");
    const navCollapseElement = document.getElementById("navbarPortfolio");
    const typedRole = document.getElementById("typedRole");
    const messageField = document.getElementById("message");
    const messageCounter = document.getElementById("messageCounter");
    const submitButton = document.getElementById("submitButton");
    const scrollProgressBar = document.getElementById("scrollProgressBar");
    const projectCount = document.getElementById("projectCount");
    const profilePhoto = document.getElementById("profilePhoto");

    const toast = toastElement ? new bootstrap.Toast(toastElement, { delay: 2600 }) : null;

    const showToast = message => {
        if (!toast || !toastMessage) return;
        toastMessage.textContent = message;
        toast.show();
    };

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    if (profilePhoto) {
        profilePhoto.addEventListener("error", () => {
            profilePhoto.src = profilePhoto.dataset.fallbackPhoto || "assets/profile-placeholder.svg";
            profilePhoto.classList.remove("has-photo");
        }, { once: true });
    }

    const words = typedRole ? JSON.parse(typedRole.dataset.words || "[]") : [];

    if (typedRole && words.length) {
        let wordIndex = 0;
        let charIndex = 0;
        let deleting = false;

        const typeLoop = () => {
            const currentWord = words[wordIndex];

            if (!deleting) {
                charIndex += 1;
                typedRole.textContent = currentWord.slice(0, charIndex);

                if (charIndex === currentWord.length) {
                    deleting = true;
                    window.setTimeout(typeLoop, 1400);
                    return;
                }
            } else {
                charIndex -= 1;
                typedRole.textContent = currentWord.slice(0, charIndex);

                if (charIndex === 0) {
                    deleting = false;
                    wordIndex = (wordIndex + 1) % words.length;
                }
            }

            const speed = deleting ? 45 : 85;
            window.setTimeout(typeLoop, speed);
        };

        typedRole.textContent = "";
        typeLoop();
    }

    const updateNavbarState = () => {
        if (!navbar) return;
        navbar.classList.toggle("scrolled", window.scrollY > 24);
    };

    updateNavbarState();
    window.addEventListener("scroll", updateNavbarState, { passive: true });

    const updateScrollProgress = () => {
        if (!scrollProgressBar) return;

        const scrollTop = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

        scrollProgressBar.style.width = `${Math.min(progress, 100)}%`;
    };

    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });

    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("revealed");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.16
        });

        revealItems.forEach(item => revealObserver.observe(item));
    } else {
        revealItems.forEach(item => item.classList.add("revealed"));
    }

    const animateCounter = counter => {
        const target = Number(counter.dataset.count || 0);
        const suffix = counter.dataset.suffix || "";
        const duration = 1400;
        const startTime = performance.now();

        const step = currentTime => {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(target * eased);
            counter.textContent = `${value}${suffix}`;

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    };

    if ("IntersectionObserver" in window) {
        const counterObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            });
        }, {
            threshold: 0.6
        });

        counters.forEach(counter => counterObserver.observe(counter));
    } else {
        counters.forEach(animateCounter);
    }

    const updateProjectCount = () => {
        if (!projectCount) return;

        const visibleProjects = projectItems.filter(card => !card.classList.contains("is-hidden")).length;
        const label = visibleProjects === 1 ? "proyek" : "proyek";
        projectCount.textContent = `Menampilkan ${visibleProjects} ${label}`;
    };

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            const selected = button.dataset.filter || "all";

            filterButtons.forEach(item => item.classList.remove("active"));
            button.classList.add("active");

            projectItems.forEach(card => {
                const category = card.dataset.category || "";
                const shouldShow = selected === "all" || category === selected;

                card.classList.toggle("is-hidden", !shouldShow);
            });

            updateProjectCount();
        });
    });

    updateProjectCount();

    const sectionMap = navLinks
        .map(link => {
            const id = link.getAttribute("href");
            if (!id || !id.startsWith("#")) return null;

            const section = document.querySelector(id);
            if (!section) return null;

            return { link, section };
        })
        .filter(Boolean);

    const setActiveLink = () => {
        const scrollPosition = window.scrollY + 160;

        sectionMap.forEach(({ link, section }) => {
            const start = section.offsetTop;
            const end = start + section.offsetHeight;
            const isActive = scrollPosition >= start && scrollPosition < end;

            link.classList.toggle("active", isActive);
        });
    };

    setActiveLink();
    window.addEventListener("scroll", setActiveLink, { passive: true });

    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            if (!navCollapseElement || !navCollapseElement.classList.contains("show")) return;

            const collapse = bootstrap.Collapse.getOrCreateInstance(navCollapseElement);
            collapse.hide();
        });
    });

    const toggleBackToTop = () => {
        if (!backToTop) return;
        backToTop.classList.toggle("show", window.scrollY > 500);
    };

    toggleBackToTop();
    window.addEventListener("scroll", toggleBackToTop, { passive: true });

    backToTop?.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    const handleCopyEmail = async (el) => {
        const email = el?.dataset?.copy;
        if (!email) return;

        try {
            await navigator.clipboard.writeText(email);
            showToast("Alamat email berhasil disalin.");
        } catch (error) {
            showToast(`Silakan salin manual: ${email}`);
        }
    };

    copyEmailButton?.addEventListener("click", () => handleCopyEmail(copyEmailButton));
    copyEmailButtons.forEach(btn => btn.addEventListener("click", () => handleCopyEmail(btn)));

    downloadCvButton?.addEventListener("click", async () => {
        const downloadBlob = (blob, filename) => {
            const fileUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = fileUrl;
            link.download = filename;
            link.click();

            URL.revokeObjectURL(fileUrl);
        };

        const cvText = [
            "CV - SIHAD",
            "",
            "Nama: Sihad",
            "Peran: Frontend Enthusiast",
            "Fokus: HTML, CSS, JavaScript, Bootstrap, dan Tailwind CSS",
            "",
            "Ringkasan:",
            "Portfolio pribadi untuk mendokumentasikan identitas, skill, dan hasil project frontend.",
            "",
            "Skill:",
            "- HTML5",
            "- CSS3",
            "- JavaScript",
            "- Bootstrap 5",
            "- Tailwind CSS",
            "",
            "Project:",
            "- Website portfolio identitas",
            "- Dashboard data",
            "- Landing page",
            "",
            "Kontak:",
            "- Email: amsihad0@gmail.com",
            "- WhatsApp: +62 83130200846",
            "",
            "Catatan:",
            "File ini adalah ringkasan CV sederhana dari halaman portfolio Sihad."
        ].join("\n");

        try {
            const response = await fetch("assets/cv-sihad.pdf");
            if (!response.ok) throw new Error("PDF belum tersedia");
            const pdfBlob = await response.blob();
            downloadBlob(pdfBlob, "CV_Sihad.pdf");
            showToast("CV PDF berhasil diunduh.");
        } catch (error) {
            downloadBlob(new Blob([cvText], { type: "text/plain;charset=utf-8" }), "cv-sihad.txt");
            showToast("CV PDF belum diunggah — unduh versi teks dulu ya.");
        }
    });

    copyPortfolioLinkButton?.addEventListener("click", async () => {
        const pageUrl = window.location.href;

        try {
            await navigator.clipboard.writeText(pageUrl);
            showToast("Link portfolio berhasil disalin.");
        } catch (error) {
            showToast("Gagal menyalin link portfolio.");
        }
    });

    const updateMessageCounter = () => {
        if (!messageField || !messageCounter) return;
        messageCounter.textContent = `${messageField.value.length}/300`;
    };

    updateMessageCounter();
    messageField?.addEventListener("input", updateMessageCounter);
    
    const certThumbs = document.querySelectorAll(".cert-thumb");

    certThumbs.forEach(img => {
        img.addEventListener("error", () => img.classList.add("d-none"));
        img.addEventListener("load", () => img.classList.remove("d-none"));

        if (img.complete && img.naturalWidth === 0) {
            img.classList.add("d-none");
        }
    });

    /* ---------- Gate akses sertifikat: sandi admin, kode aktivasi top-up, dan enkripsi media ---------- */
    const certGateConfig = {
        adminHash: "bcca50326526a2fe41b49cf0cf4a1e56f2d5aaf42eddb7ff1c0dd90f24b23261",
        media: {
            admin: {
                salt: "LH5ofY4wOVueZvI0JDjxvg==",
                wrapped: "LH5ofY4wOVueZvI0JDjxvhc3DGQRP/OB5rRTl7KtyOyIi+ZqGKm+5dxuFU/UVf74s0QIPDWit7wTKiMnA6t8LrKX6NM+Zfa1LUdIFg=="
            },
            codes: {
                "d43096877d5feb64d0a8ad51cd671eb987b737b12a5a3c7764ebb59c6bd036e3": {
                    salt: "SgQ6e6BWIb37nqd0j0FGwA==",
                    wrapped: "SgQ6e6BWIb37nqd0j0FGwLK8PgLMmFlUbxj2aR1R9sLXqKxUevzkmnXuwxSlGMrCqBu0aFwMAAO8CkCKgdkHEhs2ESpcnMqBNXETIQ=="
                },
                "fbab74d95a76f0a3bd844022994b934614a1b5681a8d084040168fbf7f80c8f1": {
                    salt: "yf+KKZg4CUdGinRZj4ZkcQ==",
                    wrapped: "yf+KKZg4CUdGinRZj4ZkccP/thKtW9uLQEXQxStYsClOvIc1VzhKo599ENTWvSBLFK2fs2SJ6uTql62rcHFrj2S+hNVwaa2WwUk5lA=="
                },
                "c76a9b2d962c6ef8867d489d7d9b94914b21fe54562f81d274aa17733950441b": {
                    salt: "Slsq/T4we1NwtGU58/YCQA==",
                    wrapped: "Slsq/T4we1NwtGU58/YCQKF2DOMjiTQohOi1KxTZm9/kFEtXwYBhiIsYzaYLL8/axuspBRZJXHM+PRuECdNgNe2ZKxSRamFuHk+ikg=="
                },
                "2ce93642d2a379fccc013cb8308ce967e86e8535c29a23018adb936419482a80": {
                    salt: "vdRD24r0aPvJTcr38qCIFw==",
                    wrapped: "vdRD24r0aPvJTcr38qCIF1lGiu51xdB9OwXemDJlPC80Vu66hJOMZv60JvcJ76T/ZeDUUFEI9R/hlA1twG7VyPownxMYSAnKEgWDkA=="
                },
                "ffdcdb0e1d195cc282c93a6c8842484161c0365cf94d6fa2574d1f0878528ae2": {
                    salt: "MzFqxOMDHFvgzvLFPlug6g==",
                    wrapped: "MzFqxOMDHFvgzvLFPlug6qa53HO8/LolbqMVyhjNKE+r83ieDTHEBNRyUrBvow1+K3klEBJNcnJ/Znj8RDaZ4PwK1ss6GcyaOQmzzQ=="
                },
                "88b5f1d5b42760a081ab87bfd1ccdb5a3aa9482e90871126b5ea27aff15b191b": {
                    salt: "5xSZsyAA4DZCwf9uq4PmPg==",
                    wrapped: "5xSZsyAA4DZCwf9uq4PmPp0Kz+RCw2U9+NduXlq3Mm91PGeTFGoPK2BNE+mH/x7jvWaVBwCnIl2ZLv4/Klcg5Fl6r+HHrGn5pbemgg=="
                }
            }
        },
        storageKey: "shihad_cert_access",
        mediaKeyStoreKey: "shihad_cert_media",
        deriveIterations: 250000
    };

    const readCertAccess = () => {
        try {
            const raw = window.localStorage.getItem(certGateConfig.storageKey);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (data && (data.type === "admin" || data.type === "paid")) return data;
            window.localStorage.removeItem(certGateConfig.storageKey);
        } catch (error) {
            /* status penyimpanan tidak valid, abaikan */
        }
        return null;
    };

    const writeCertAccess = state => {
        try {
            window.localStorage.setItem(certGateConfig.storageKey, JSON.stringify(state));
        } catch (error) {
            /* penyimpanan tidak tersedia, abaikan */
        }
    };

    const clearCertAccess = () => {
        try {
            window.localStorage.removeItem(certGateConfig.storageKey);
        } catch (error) {
            /* penyimpanan tidak tersedia, abaikan */
        }
    };

    const hasCertAccess = () => !!readCertAccess() && !!readMediaKey();

    const sha256Hex = async text => {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error("WEB_CRYPTO_HANYA_DI_KONTEKS_SECURE");
        }
        const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
        return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
    };

    const bytesToB64 = bytes => {
        let binary = "";
        const chunk = 0x8000;
        for (let index = 0; index < bytes.length; index += chunk) {
            binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunk));
        }
        return btoa(binary);
    };

    const b64ToBytes = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));

    const readMediaKey = () => {
        try {
            return window.localStorage.getItem(certGateConfig.mediaKeyStoreKey);
        } catch (error) {
            return null;
        }
    };

    const storeMediaKey = value => {
        try {
            window.localStorage.setItem(certGateConfig.mediaKeyStoreKey, value);
        } catch (error) {
            /* penyimpanan tidak tersedia, abaikan */
        }
    };

    const clearMediaKey = () => {
        try {
            window.localStorage.removeItem(certGateConfig.mediaKeyStoreKey);
        } catch (error) {
            /* penyimpanan tidak tersedia, abaikan */
        }
    };

    const deriveMediaKey = async (credential, saltBytes) => {
        const subtle = window.crypto.subtle;
        const material = await subtle.importKey("raw", new TextEncoder().encode(credential), "PBKDF2", false, ["deriveKey"]);
        return subtle.deriveKey(
            { name: "PBKDF2", salt: saltBytes, iterations: certGateConfig.deriveIterations, hash: "SHA-256" },
            material,
            { name: "AES-GCM", length: 256 },
            false,
            ["decrypt"]
        );
    };

    const unwrapMediaKey = async (credential, saltB64, wrappedB64) => {
        const bundle = b64ToBytes(wrappedB64);
        const kek = await deriveMediaKey(credential, bundle.slice(0, 16));
        const plain = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: bundle.slice(16, 28) },
            kek,
            bundle.slice(28)
        );
        return bytesToB64(new Uint8Array(plain));
    };

    const CERT_MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

    const decryptCertFile = async (encPath, mediaKeyB64) => {
        const response = await fetch(encPath);
        if (!response.ok) throw new Error("Gagal memuat file terenkripsi: " + encPath);
        const bundle = new Uint8Array(await response.arrayBuffer());
        const kek = await window.crypto.subtle.importKey("raw", b64ToBytes(mediaKeyB64), { name: "AES-GCM" }, false, ["decrypt"]);
        const plain = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: bundle.slice(0, 12) },
            kek,
            bundle.slice(12)
        );
        const ext = (encPath.replace(/\.enc$/i, "").split(".").pop() || "jpg").toLowerCase();
        const blob = new Blob([plain], { type: CERT_MIME[ext] || "image/jpeg" });
        return URL.createObjectURL(blob);
    };

    const toCertFilename = title => {
        const slug = (title || "sertifikat").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        return (slug || "sertifikat").slice(0, 60);
    };

    const hydrateCertMedia = () => {
        const mediaKey = readMediaKey();
        if (!mediaKey) return;
        document.querySelectorAll(".cert-thumb[data-enc]").forEach(img => {
            if (img.dataset.blob) return;
            decryptCertFile(img.dataset.enc, mediaKey).then(url => {
                img.src = url;
                img.dataset.blob = url;
                const downloadAnchor = img.closest(".cert-card-modern")?.querySelector("a[download]");
                if (downloadAnchor) {
                    downloadAnchor.href = url;
                    const ext = (img.dataset.enc.replace(/\.enc$/i, "").split(".").pop() || "jpg").toLowerCase();
                    downloadAnchor.download = `${toCertFilename(img.dataset.title)}.${ext}`;
                }
            }).catch(() => img.classList.add("d-none"));
        });
    };

    const applyCertLockState = () => {
        const unlocked = hasCertAccess();
        document.body.classList.toggle("cert-locked", !unlocked);
        document.body.classList.toggle("cert-unlocked", unlocked);
        document.getElementById("certRelockBtn")?.classList.toggle("d-none", !unlocked);
        if (unlocked) hydrateCertMedia();
        return unlocked;
    };

    const setupCertGate = () => {
        const accessModalEl = document.getElementById("accessModal");
        const accessModal = accessModalEl ? bootstrap.Modal.getOrCreateInstance(accessModalEl) : null;

        const openAccessTab = paneSelector => {
            if (!accessModal || !accessModalEl) return;
            const trigger = accessModalEl.querySelector(`[data-bs-target="${paneSelector}"]`);
            if (trigger) bootstrap.Tab.getOrCreateInstance(trigger).show();
            accessModal.show();
        };

        document.getElementById("gateBtnPassword")?.addEventListener("click", () => openAccessTab("#panePassword"));
        document.getElementById("gateBtnTopup")?.addEventListener("click", () => openAccessTab("#paneTopup"));

        accessModalEl?.addEventListener("show.bs.modal", () => {
            accessModalEl.querySelectorAll(".access-feedback").forEach(el => {
                el.textContent = "";
                el.classList.remove("text-success", "text-danger");
            });
        });

        const showFeedback = (element, message, ok) => {
            if (!element) return;
            element.textContent = message;
            element.classList.toggle("text-success", ok);
            element.classList.toggle("text-danger", !ok && message !== "");
        };

        const passwordForm = document.getElementById("adminPasswordForm");
        const passwordInput = document.getElementById("adminPasswordInput");
        const passwordFeedback = document.getElementById("adminPasswordFeedback");

        passwordForm?.addEventListener("submit", async event => {
            event.preventDefault();
            if (!passwordInput || !passwordFeedback) return;
            if (!passwordInput.value) {
                showFeedback(passwordFeedback, "Isi sandi dulu ya.", false);
                return;
            }
            try {
                const hash = await sha256Hex(passwordInput.value);
                if (hash === certGateConfig.adminHash) {
                    try {
                        storeMediaKey(await unwrapMediaKey(passwordInput.value, certGateConfig.media.admin.salt, certGateConfig.media.admin.wrapped));
                    } catch (innerError) {
                        showFeedback(passwordFeedback, "Kunci media tidak cocok — bungkus kunci di script.js perlu diperbarui.", false);
                        return;
                    }
                    writeCertAccess({ type: "admin", at: new Date().toISOString() });
                    passwordInput.value = "";
                    showFeedback(passwordFeedback, "", false);
                    applyCertLockState();
                    accessModal?.hide();
                    showToast("Sandi benar. Semua sertifikat terbuka, selamat datang kembali!");
                } else {
                    showFeedback(passwordFeedback, "Sandi salah. Coba lagi.", false);
                }
            } catch (error) {
                showFeedback(
                    passwordFeedback,
                    error.message === "WEB_CRYPTO_HANYA_DI_KONTEKS_SECURE"
                        ? "Verifikasi hanya jalan lewat https:// atau http://localhost — buka lewat situ ya."
                        : "Verifikasi gagal, coba beberapa saat lagi.",
                    false
                );
            }
        });

        const activationForm = document.getElementById("activationCodeForm");
        const activationInput = document.getElementById("activationCodeInput");
        const activationFeedback = document.getElementById("activationCodeFeedback");

        activationForm?.addEventListener("submit", async event => {
            event.preventDefault();
            if (!activationInput || !activationFeedback) return;
            const value = activationInput.value.trim().replace(/\s+/g, "").toUpperCase();
            if (!value) {
                showFeedback(activationFeedback, "Masukkan kode aktivasi dulu ya.", false);
                return;
            }
            try {
                const hash = await sha256Hex(value);
                const wrapEntry = certGateConfig.media.codes[hash];
                if (wrapEntry) {
                    try {
                        storeMediaKey(await unwrapMediaKey(value, wrapEntry.salt, wrapEntry.wrapped));
                    } catch (innerError) {
                        showFeedback(activationFeedback, "Kunci media tidak cocok — bungkus kunci di script.js perlu diperbarui.", false);
                        return;
                    }
                    writeCertAccess({ type: "paid", at: new Date().toISOString() });
                    activationInput.value = "";
                    showFeedback(activationFeedback, "", false);
                    applyCertLockState();
                    accessModal?.hide();
                    showToast("Top-up diterima. Sertifikat terbuka permanen di perangkat ini!");
                } else {
                    showFeedback(activationFeedback, "Kode tidak valid. Pastikan kode kamu benar atau hubungi pemilik.", false);
                }
            } catch (error) {
                showFeedback(
                    activationFeedback,
                    error.message === "WEB_CRYPTO_HANYA_DI_KONTEKS_SECURE"
                        ? "Verifikasi hanya jalan lewat https:// atau http://localhost — buka lewat situ ya."
                        : "Verifikasi gagal, coba beberapa saat lagi.",
                    false
                );
            }
        });

        document.getElementById("certRelockBtn")?.addEventListener("click", () => {
            if (!hasCertAccess()) return;
            if (!window.confirm("Kunci lagi akses sertifikat di perangkat ini?")) return;
            clearCertAccess();
            clearMediaKey();
            applyCertLockState();
            showToast("Akses sertifikat di perangkat ini dikunci kembali.");
        });

        applyCertLockState();
    };

    setupCertGate();

    const formFields = contactForm
        ? Array.from(contactForm.querySelectorAll(".form-control, .form-select"))
        : [];

    formFields.forEach(field => {
        field.addEventListener("input", () => {
            if (field.checkValidity()) {
                field.classList.remove("is-invalid");
            }
        });

        field.addEventListener("change", () => {
            if (field.checkValidity()) {
                field.classList.remove("is-invalid");
            }
        });
    });

// Open certificate lightbox from card element
function openCertFromElement(cardEl) {
    if (!hasCertAccess()) {
        showToast("Sertifikat terkunci: masuk dengan sandi atau top-up dahulu.");
        return;
    }
    if (!cardEl) return;
    var img = cardEl.querySelector('.cert-thumb');
    if (!img) return;
    var src = img.dataset.blob || img.getAttribute('src');
    var title = img.dataset.title || img.alt || '';
    var organizer = img.dataset.organizer || '';
    var year = img.dataset.year || '';
    var verify = img.dataset.verify || '#';
    var ext = ((img.dataset.enc || '').replace(/\.enc$/i, '').split('.').pop() || 'jpg').toLowerCase();

    openCert(src, title, organizer, year, verify, `${toCertFilename(title)}.${ext}`);
}

// openCert now accepts metadata and populates lightbox controls
function openCert(src, title, organizer, year, verify, filename) {
    if (!hasCertAccess()) {
        showToast("Sertifikat terkunci: masuk dengan sandi atau top-up dahulu.");
        return;
    }
    var modalEl = document.getElementById('certModal');
    if (!modalEl) return;
    var modalTitle = document.getElementById('certModalTitle');
    var modalMeta = document.getElementById('certModalMeta');
    var modalImage = document.getElementById('certModalImage');
    var downloadBtn = document.getElementById('certDownloadBtn');
    var openBtn = document.getElementById('certOpenBtn');
    var zoomBtn = document.getElementById('certZoomBtn');

    modalTitle.textContent = title || '';
    modalMeta.textContent = (organizer ? organizer + ' · ' : '') + (year || '');
    modalImage.src = src || '';
    modalImage.classList.remove('zoomed');
    downloadBtn.href = src || '#';
    if (filename) {
        downloadBtn.download = filename;
    }
    openBtn.href = src || '#';

    // show bootstrap modal
    var certModal = new bootstrap.Modal(modalEl);
    certModal.show();

    // zoom toggle
    zoomBtn.onclick = function () {
        modalImage.classList.toggle('zoomed');
    };
}

// Expose for inline onclick handlers in certificates.html
window.openCertFromElement = openCertFromElement;

    const CONTACT_CONFIG = {
        accessKey: "",
        ownerEmail: "amsihad0@gmail.com",
        endpoint: "https://api.web3forms.com/submit"
    };

    contactForm?.addEventListener("submit", event => {
        event.preventDefault();

        formFields.forEach(field => {
            field.classList.toggle("is-invalid", !field.checkValidity());
        });

        if (!contactForm.checkValidity()) {
            return;
        }

        const nameInput = document.getElementById("fullName");
        const emailInput = document.getElementById("email");
        const topicInput = document.getElementById("service");
        const notesInput = document.getElementById("budget");
        const messageInput = document.getElementById("message");

        const userName = nameInput?.value.trim() || "teman";
        const email = emailInput?.value.trim() || "";
        const topic = topicInput?.value.trim() || "";
        const notes = notesInput?.value.trim() || "";
        const msg = messageInput?.value.trim() || "";
        const defaultText = submitButton?.textContent || "Kirim Pesan";

        const resetForm = () => {
            contactForm.reset();
            formFields.forEach(field => field.classList.remove("is-invalid"));
            updateMessageCounter();
            if (submitButton) {
                submitButton.textContent = defaultText;
                submitButton.classList.remove("is-submitting");
            }
        };

        const fallbackMailto = () => {
            const subject = encodeURIComponent(`Pesan Portfolio: ${topic}`);
            const body = encodeURIComponent(`Nama: ${userName}\nEmail: ${email}\nTopik: ${topic}\nCatatan: ${notes}\n\nPesan:\n${msg}`);
            window.location.href = `mailto:${CONTACT_CONFIG.ownerEmail}?subject=${subject}&body=${body}`;
            showToast("Membuka aplikasi email kamu dengan pesan terisi.");
        };

        if (submitButton) {
            submitButton.textContent = "Mengirim...";
            submitButton.classList.add("is-submitting");
        }

        if (!CONTACT_CONFIG.accessKey) {
            fallbackMailto();
            showToast("Form belum terhubung ke layanan email — masukkan access key Web3Forms di script.js biar terkirim langsung.");
            resetForm();
            return;
        }

        fetch(CONTACT_CONFIG.endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                access_key: CONTACT_CONFIG.accessKey,
                subject: `Pesan Portfolio: ${topic}`,
                from_name: "Portofolio Shihad",
                name: userName,
                email: email,
                topic: topic,
                notes: notes,
                message: msg
            })
        })
            .then(response => response.json().then(data => ({ ok: response.ok, data })))
            .then(({ ok, data }) => {
                if (!ok || !data.success) throw new Error("Kirim gagal");
                showToast(`Terima kasih ${userName}, pesanmu sudah terkirim ke email Shihad.`);
                resetForm();
            })
            .catch(() => {
                fallbackMailto();
                resetForm();
            });
    });

    /* ---------- Lightbox screenshot proyek + guard link demo placeholder ---------- */
    const projectModalEl = document.getElementById("projectModal");
    const projectModal = projectModalEl ? bootstrap.Modal.getOrCreateInstance(projectModalEl) : null;

    document.querySelectorAll(".project-shot").forEach(img => {
        img.classList.add("project-shot-clickable");

        img.addEventListener("click", () => {
            const modalImage = document.getElementById("projectModalImage");
            const modalTitle = document.getElementById("projectModalTitle");
            if (!projectModal || !modalImage) return;
            modalImage.src = img.getAttribute("src");
            if (modalTitle) modalTitle.textContent = (img.alt || "").replace("Screenshot proyek ", "");
            projectModal.show();
        });
    });

    document.querySelectorAll('#projectGrid a[href^="https://ganti-"]').forEach(anchor => {
        anchor.addEventListener("click", event => {
            event.preventDefault();
            showToast("Link demo belum dipasang — ganti href tombol ini di index.html (cari 'ganti-dengan-link-demo').");
        });
    });

    /* ============================================================
       3D & INTERACTION ENHANCEMENTS
       ============================================================ */

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    /* ---------- Preloader ---------- */
    const preloader = document.getElementById("preloader");

    if (preloader) {
        const hidePreloader = () => preloader.classList.add("preloader--done");

        if (document.readyState === "complete") {
            window.setTimeout(hidePreloader, 300);
        } else {
            window.addEventListener("load", () => window.setTimeout(hidePreloader, 350));
        }

        window.setTimeout(hidePreloader, 2600);
        preloader.addEventListener("transitionend", () => preloader.remove(), { once: true });
    }

    /* ---------- Custom cursor glow (desktop only) ---------- */
    const cursorDot = document.getElementById("cursorDot");
    const cursorRing = document.getElementById("cursorRing");

    if (finePointer && cursorDot && cursorRing) {
        const cursor = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            ringX: window.innerWidth / 2,
            ringY: window.innerHeight / 2
        };
        let cursorRaf = null;

        const updateCursorRing = () => {
            cursor.ringX += (cursor.x - cursor.ringX) * 0.16;
            cursor.ringY += (cursor.y - cursor.ringY) * 0.16;
            cursorRing.style.transform = `translate(${cursor.ringX}px, ${cursor.ringY}px) translate(-50%, -50%)`;
            cursorRaf = null;
        };

        document.addEventListener("mousemove", (event) => {
            cursor.x = event.clientX;
            cursor.y = event.clientY;
            cursorDot.style.transform = `translate(${cursor.x}px, ${cursor.y}px) translate(-50%, -50%)`;

            if (!cursorRaf) {
                cursorRaf = window.requestAnimationFrame(updateCursorRing);
            }
        }, { passive: true });

        const hoverSelector = "a, button, input, select, textarea, .btn, .tech-chip, .tool-badge";
        document.addEventListener("mouseover", (event) => {
            cursorRing.classList.toggle("is-hover", Boolean(event.target.closest(hoverSelector)));
        }, { passive: true });
    }

    /* ---------- 3D tilt cards with glare ---------- */
    const tiltSelector = ".project-card, .service-card, .skill-card, .value-card, .process-card, .hero-card, .form-card, .cert-card-modern";

    if (finePointer) {
        document.querySelectorAll(tiltSelector).forEach((card) => {
            card.classList.add("tilt-3d");

            const glare = document.createElement("span");
            glare.className = "tilt-glare";
            card.appendChild(glare);

            card.addEventListener("mousemove", (event) => {
                const rect = card.getBoundingClientRect();
                const px = (event.clientX - rect.left) / rect.width;
                const py = (event.clientY - rect.top) / rect.height;
                const rotX = (0.5 - py) * 9;
                const rotY = (px - 0.5) * 11;

                card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-4px)`;
                glare.style.opacity = "1";
                glare.style.background = `radial-gradient(circle at ${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%, rgba(255,255,255,0.14), transparent 55%)`;
            }, { passive: true });

            card.addEventListener("mouseleave", () => {
                card.style.transform = "";
                glare.style.opacity = "0";
            });
        });
    }

    /* ---------- Magnetic buttons ---------- */
    if (finePointer) {
        document.querySelectorAll(".btn-brand, .btn-outline-light, .hero-social-pill").forEach((el) => {
            el.classList.add("magnetic");

            el.addEventListener("mousemove", (event) => {
                const rect = el.getBoundingClientRect();
                const dx = (event.clientX - rect.left - rect.width / 2) * 0.22;
                const dy = (event.clientY - rect.top - rect.height / 2) * 0.28;
                const limit = 9;

                el.style.transform = `translate(${Math.max(-limit, Math.min(limit, dx)).toFixed(1)}px, ${Math.max(-limit, Math.min(limit, dy)).toFixed(1)}px)`;
            }, { passive: true });

            el.addEventListener("mouseleave", () => {
                el.style.transform = "";
            });
        });
    }

    /* ---------- Scroll-driven 3D depth (whole page) ---------- */
    const scroll3dSelector = ".section-heading, .project-item, .timeline-item, .cta-band, .col-sm-6, .col-md-6, .col-lg-4, .col-lg-5, .col-lg-6, .col-lg-7, .footer-wrap .container";
    const scroll3dEls = Array.from(document.querySelectorAll(scroll3dSelector)).filter((el) => {
        return !el.closest(".form-card") && !el.closest(".portfolio-nav") && !el.classList.contains("scroll-3d");
    });

    scroll3dEls.forEach((el) => {
        el.classList.add("scroll-3d");

        /* Per-element drama multiplier: cards "fan out" like a deck of cards */
        let a = 1;
        if (el.classList.contains("project-item")) a = 2.6;
        else if (el.closest(".modern-gallery")) a = 2.2;
        else if (el.classList.contains("section-heading")) a = 1.8;
        else if (el.classList.contains("cta-band")) a = 1.4;
        else if (el.closest(".hero-section")) a = 1.3;

        if (a !== 1) el.dataset.s3amp = String(a);
    });

    /* ---------- Deck stack 3D (cards pile on top of each other) ---------- */
    const deckItems = Array.from(document.querySelectorAll(".deck-item"));

    const updateDeck3d = () => {
        if (!deckItems.length) return;

        deckItems.forEach((item) => {
            const sibling = item.nextElementSibling;
            const next = sibling && sibling.classList.contains("deck-item") ? sibling : null;

            if (!next) {
                item.style.transform = "";
                item.style.opacity = "";
                return;
            }

            const stickyTop = parseFloat(window.getComputedStyle(item).top) || 96;
            const nextRect = next.getBoundingClientRect();
            const progress = Math.min(1, Math.max(0, (stickyTop - nextRect.top) / (nextRect.height * 0.85)));

            if (progress <= 0) {
                item.style.transform = "";
                item.style.opacity = "";
                return;
            }

            item.style.transform = `perspective(900px) scale(${(1 - progress * 0.08).toFixed(3)}) rotateX(${(progress * -6).toFixed(2)}deg) translateY(${(progress * -8).toFixed(1)}px)`;
            item.style.opacity = (1 - progress * 0.45).toFixed(2);
        });
    };

    const updateScroll3d = () => {
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        const amp = vw < 768 ? 0.55 : 1;

        scroll3dEls.forEach((el) => {
            const rect = el.getBoundingClientRect();

            if (rect.bottom < -160 || rect.top > vh + 160) return;

            const centerY = rect.top + rect.height / 2;
            const depth = Math.max(-1, Math.min(1, (centerY - vh / 2) / (vh / 2 + rect.height / 2)));
            const side = (rect.left + rect.width / 2) / vw - 0.5;
            const a = amp * (parseFloat(el.dataset.s3amp) || 1);

            el.style.setProperty("--sr", (depth * 6 * a).toFixed(2) + "deg");
            el.style.setProperty("--syr", (side * -5 * a).toFixed(2) + "deg");
            el.style.setProperty("--sz", (depth * -36 * a).toFixed(1) + "px");
            el.style.setProperty("--sfs", Math.max(0.86, 1 - Math.abs(depth) * 0.05 * a).toFixed(3));
            el.style.setProperty("--sfo", Math.max(0.5, 1 - Math.abs(depth) * 0.18 * a).toFixed(3));
        });

        updateDeck3d();
    };

    if (scroll3dEls.length || deckItems.length) {
        let scroll3dTick = false;

        const requestScroll3d = () => {
            if (scroll3dTick) return;
            scroll3dTick = true;
            window.requestAnimationFrame(() => {
                updateScroll3d();
                scroll3dTick = false;
            });
        };

        window.addEventListener("scroll", requestScroll3d, { passive: true });
        window.addEventListener("resize", requestScroll3d, { passive: true });
        updateScroll3d();
    }

    /* ---------- 3D scene toggle ---------- */
    const sceneToggle = document.getElementById("sceneToggle");

    if (sceneToggle && window.__hero3D) {
        const sceneLabel = sceneToggle.querySelector("span");
        let sceneOn = true;

        try {
            sceneOn = window.localStorage.getItem("hero3d") !== "off";
        } catch (error) {
            sceneOn = true;
        }

        const applySceneState = (on) => {
            sceneToggle.classList.toggle("is-off", !on);
            sceneToggle.setAttribute("aria-pressed", on ? "true" : "false");
            if (sceneLabel) sceneLabel.textContent = on ? "3D Aktif" : "3D Mati";
            window.__hero3D.setEnabled(on);
        };

        applySceneState(sceneOn);

        sceneToggle.addEventListener("click", () => {
            sceneOn = !sceneOn;
            try {
                window.localStorage.setItem("hero3d", sceneOn ? "on" : "off");
            } catch (error) {
                /* storage unavailable, ignore */
            }
            applySceneState(sceneOn);
        });
    }
});
