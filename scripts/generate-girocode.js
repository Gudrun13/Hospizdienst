// Erzeugt GiroCode-QR-Codes (EPC069-12, SEPA Credit Transfer) fuer die Bankverbindungen
// auf spenden.html. Einmalig lokal ausfuehren, Ergebnis wird als PNG im Projekt abgelegt.
const QRCode = require('qrcode');
const path = require('path');

const BENEFICIARY = 'Ambulanter Hospizdienst Wilhelmshaven-Friesland e.V.';
const PURPOSE_TEXT = 'Spende';

function buildEpcPayload({ bic, iban }) {
  return [
    'BCD',
    '002',
    '1',
    'SCT',
    bic,
    BENEFICIARY,
    iban.replace(/\s+/g, ''),
    '', // Betrag offen lassen, Spenderin/Spender traegt selbst ein
    '', // Verwendungszweck-Code
    '', // strukturierte Referenz
    PURPOSE_TEXT,
    '',
  ].join('\n');
}

const accounts = [
  { file: 'girocode-sparkasse.png', bic: 'BRLADE21WHV', iban: 'DE58 2825 0110 0002 1980 00' },
  { file: 'girocode-volksbank.png', bic: 'GENODEF1WHV', iban: 'DE05 2829 0063 0000 5030 60' },
];

(async () => {
  for (const acc of accounts) {
    const payload = buildEpcPayload(acc);
    const out = path.join('C:/Users/murin/Desktop/Homepage Hospizdienst', acc.file);
    await QRCode.toFile(out, payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 360,
      color: { dark: '#473C24', light: '#FFFFFF' },
    });
    console.log('geschrieben:', out);
  }
})().catch(e => { console.error(e); process.exit(1); });
