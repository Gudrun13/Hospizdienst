// Rohfotos (beliebiges Format/Groesse) auf einheitliche, web-taugliche
// Bilder fuer die Homepage bringen.
//
// Aufruf:
//   node process-fotos.js <input-ordner> <output-ordner> <round|landscape>
//
// round      -> quadratisch zugeschnitten, fuer die runden Team-Karten
// landscape  -> 4:3 zugeschnitten, fuer die Foto-Bereiche im Fliesstext
//
// Jede Datei im Input-Ordner wird verarbeitet und unter einem
// bereinigten Dateinamen (Kleinbuchstaben, Umlaute ausgeschrieben,
// Leerzeichen zu Bindestrichen) als .jpg im Output-Ordner abgelegt.

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SPECS = {
  round: { width: 320, height: 320, quality: 78 },
  landscape: { width: 900, height: 675, quality: 80 },
};

const SUPPORTED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".tif", ".tiff"];

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const [, , inputDir, outputDir, type] = process.argv;

  if (!inputDir || !outputDir || !SPECS[type]) {
    console.error("Aufruf: node process-fotos.js <input-ordner> <output-ordner> <round|landscape>");
    process.exit(1);
  }

  const spec = SPECS[type];
  fs.mkdirSync(outputDir, { recursive: true });

  const files = fs.readdirSync(inputDir).filter((f) =>
    SUPPORTED_EXT.includes(path.extname(f).toLowerCase())
  );

  if (files.length === 0) {
    console.log("Keine unterstuetzten Bilddateien gefunden in", inputDir);
    return;
  }

  console.log(`Verarbeite ${files.length} Foto(s) als "${type}" (${spec.width}x${spec.height})...\n`);

  const results = [];
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const baseName = slugify(path.parse(file).name);
    const outputPath = path.join(outputDir, `${baseName}.jpg`);

    try {
      await sharp(inputPath)
        .rotate() // EXIF-Ausrichtung von Handyfotos automatisch korrigieren
        .resize(spec.width, spec.height, { fit: "cover", position: "attention" })
        .jpeg({ quality: spec.quality, mozjpeg: true })
        .toFile(outputPath);

      const { size } = fs.statSync(outputPath);
      results.push({ file, outputPath, sizeKb: (size / 1024).toFixed(0), ok: true });
    } catch (err) {
      results.push({ file, error: err.message, ok: false });
    }
  }

  console.log("Ergebnis:");
  for (const r of results) {
    if (r.ok) {
      console.log(`  OK    ${r.file}  ->  ${path.basename(r.outputPath)}  (${r.sizeKb} KB)`);
    } else {
      console.log(`  FEHLER ${r.file}: ${r.error}`);
    }
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.log(`\n${failed.length} Datei(en) konnten nicht verarbeitet werden.`);
    process.exit(1);
  }
}

main();
