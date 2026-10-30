#!/usr/bin/env node
import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes, createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, renameSync } from "node:fs";
import { dirname, join, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(TOOL_DIR, "..");
const SRC_DIR = join(WEB_ROOT, "assets", "certs");
const OUT_DIR = join(SRC_DIR, "enc");
const BACKUP_DIR = resolve(process.env.USERPROFILE || "C:\\Users\\hadwe", "Documents", "backup-sertifikat-asli");

const ITER = 250000;
const MEDIA_EXT = [".jpg", ".jpeg", ".png", ".webp"];
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

const argValue = flag => {
    const index = process.argv.indexOf(flag);
    return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : null;
};

let cachedReport = null;

const adminPassword = argValue("--admin");
const codesArg = argValue("--codes");
const keyPath = argValue("--key");
const keyOutPath = argValue("--keyout");
const mode = argValue("--mode") || "encrypt";

if (mode === "selftest") {
    await runSelftest();
} else if (mode === "wrap") {
    runWrapOnly();
} else {
    runEncrypt();
}

function sha256(bytes) {
    return createHash("sha256").update(bytes).digest("hex");
}

function buildWrap(credential, mediaKey) {
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const kek = pbkdf2Sync(Buffer.from(credential, "utf8"), salt, ITER, 32, "sha256");
    const cipher = createCipheriv("aes-256-gcm", kek, iv);
    const ct = Buffer.concat([cipher.update(mediaKey), cipher.final()]);
    return {
        salt: salt.toString("base64"),
        wrapped: Buffer.concat([salt, iv, ct, cipher.getAuthTag()]).toString("base64"),
        hash: sha256(Buffer.from(credential, "utf8"))
    };
}

function loadMasterKey() {
    if (!keyPath || !existsSync(keyPath)) throw new Error("Wajib --key <file-kunci-master>");
    const masterKey = Buffer.from(readFileSync(keyPath, "utf8").trim(), "base64");
    if (masterKey.length !== 32) throw new Error("File kunci master tidak valid (harus 32 byte base64).");
    return masterKey;
}

function runWrapOnly() {
    const masterKey = loadMasterKey();
    const reportPath = join(BACKUP_DIR, "enkripsi-report.json");
    const report = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, "utf8")) : { iter: ITER, masterKeyB64: masterKey.toString("base64"), files: [], admin: null, codes: [] };
    report.iter = ITER;
    report.masterKeyB64 = masterKey.toString("base64");

    if (adminPassword) {
        report.admin = buildWrap(adminPassword, masterKey);
    }
    if (codesArg) {
        report.codes = [];
        for (const code of codesArg.split(",").map(item => item.trim()).filter(Boolean)) {
            report.codes.push(buildWrap(code, masterKey));
        }
    }
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
}

function runEncrypt() {
    if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
    if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

    let masterKey;
    if (keyPath && existsSync(keyPath)) {
        masterKey = loadMasterKey();
    } else {
        masterKey = randomBytes(32);
    }
    if (keyOutPath) {
        writeFileSync(keyOutPath, masterKey.toString("base64"));
    }

    const files = readdirSync(SRC_DIR)
        .filter(name => MEDIA_EXT.includes(extname(name).toLowerCase()));
    if (!files.length) throw new Error("Tidak ada gambar sertifikat di " + SRC_DIR);

    const fileReports = [];
    for (const name of files) {
        const original = readFileSync(join(SRC_DIR, name));
        const iv = randomBytes(12);
        const cipher = createCipheriv("aes-256-gcm", masterKey, iv);
        const ct = Buffer.concat([cipher.update(original), cipher.final()]);
        const blob = Buffer.concat([iv, ct, cipher.getAuthTag()]);
        const outName = name + ".enc";
        writeFileSync(join(OUT_DIR, outName), blob);
        renameSync(join(SRC_DIR, name), join(BACKUP_DIR, name));
        fileReports.push({ src: "assets/certs/enc/" + outName, originalSha256: sha256(original), bytes: blob.length });
    }

    const report = {
        iter: ITER,
        masterKeyB64: masterKey.toString("base64"),
        files: fileReports,
        admin: null,
        codes: []
    };

    if (adminPassword) {
        report.admin = buildWrap(adminPassword, masterKey);
    }
    if (codesArg) {
        for (const code of codesArg.split(",").map(item => item.trim()).filter(Boolean)) {
            report.codes.push(buildWrap(code, masterKey));
        }
    }

    console.log(JSON.stringify(report, null, 2));
    writeFileSync(join(BACKUP_DIR, "enkripsi-report.json"), JSON.stringify(report, null, 2));
}

async function runSelftest() {
    const masterKeyB64 = readFileSync(keyPath, "utf8").trim();
    const masterKey = Buffer.from(masterKeyB64, "base64");
    const adminPassword = argValue("--admin");
    const codeValue = argValue("--code");
    let failures = 0;

    const files = readdirSync(OUT_DIR).filter(name => name.endsWith(".enc"));
    for (const name of files) {
        const encBytes = readFileSync(join(OUT_DIR, name));
        const iv = encBytes.subarray(0, 12);
        const tag = encBytes.subarray(encBytes.length - 16);
        const ct = encBytes.subarray(12, encBytes.length - 16);
        const decipher = createDecipheriv("aes-256-gcm", masterKey, iv);
        decipher.setAuthTag(tag);
        const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
        const backupName = name.replace(/\.enc$/, "");
        const original = readFileSync(join(BACKUP_DIR, backupName));
        const ok = plain.equals(original);
        if (!ok) failures++;
        console.log("node-decrypt", name, ok ? "MATCH backup" : "MISMATCH");
    }

    for (const credential of [adminPassword, codeValue].filter(Boolean)) {
        const wrapEntry = findWrapForSelftest(credential);
        const subtle = globalThis.crypto.subtle;
        const material = await subtle.importKey("raw", new TextEncoder().encode(credential), "PBKDF2", false, ["deriveKey"]);
        const kek = await subtle.deriveKey(
            { name: "PBKDF2", salt: Uint8Array.from(Buffer.from(wrapEntry.salt, "base64")), iterations: ITER, hash: "SHA-256" },
            material,
            { name: "AES-GCM", length: 256 },
            false,
            ["decrypt"]
        );
        const bundle = Uint8Array.from(Buffer.from(wrapEntry.wrapped, "base64"));
        const plain = await subtle.decrypt({ name: "AES-GCM", iv: bundle.slice(16, 28) }, kek, bundle.slice(28));
        const ok = Buffer.from(plain).toString("base64") === masterKeyB64;
        if (!ok) failures++;
        console.log("webcrypto-unwrap", credential.slice(0, 6) + "***", ok ? "MATCH" : "MISMATCH");
    }

    console.log(failures === 0 ? "SELFTEST PASS" : "SELFTEST FAIL (" + failures + ")");
    if (failures !== 0) process.exitCode = 1;
}

function findWrapForSelftest(credential) {
    if (!cachedReport) {
        cachedReport = JSON.parse(readFileSync(join(BACKUP_DIR, "enkripsi-report.json"), "utf8"));
    }
    const hash = sha256(Buffer.from(credential, "utf8"));
    if (cachedReport.admin && cachedReport.admin.hash === hash) return cachedReport.admin;
    const found = cachedReport.codes.find(item => item.hash === hash);
    if (!found) throw new Error("Report tidak memuat credential " + credential);
    return found;
}
