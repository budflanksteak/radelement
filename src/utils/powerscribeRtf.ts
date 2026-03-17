/**
 * Powerscribe Autotext RTF Generator
 *
 * TypeScript port of psfieldgenerate (psReportGenerator.py + rdeToPsReport.py)
 * Original Python by andrew.gomella@jefferson.edu (11/2022)
 *
 * Converts a CDE set (CDESet) into a Powerscribe-compatible RTF autotext file.
 * The output is a standard RTF document with an embedded {\xml} block that
 * Powerscribe reads to locate and render interactive form fields.
 *
 * Field type mapping:
 *   value_set              → PickList (type 3) — choice list field
 *   integer_value | float_value → Numeric  (type 2) — numeric entry field
 *   (all others)           → Text      (type 1) — free-text entry field
 *
 * Tested format: Powerscribe v4.0 SP1 (build 7.0.111.20)
 */

import { CDESet } from '../types/cde';

// ── RTF helpers ──────────────────────────────────────────────────────────────

/** Strip RTF control words (e.g. \cf1, \par) and count the remaining plain chars.
 *  Mirrors Python: re.sub(r'(\\[^\s]+\s?)', '', rtfString) */
function getRtfLength(rtf: string): number {
  return rtf.replace(/\\[^\s]+\s?/g, '').length;
}

/** Remove newlines and tabs that cause formatting issues inside RTF field names */
function cleanText(s: string): string {
  return s.replace(/[\t\n\r]/g, ' ').trim();
}

/** Escape characters that are special inside XML */
function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── XML field builder ────────────────────────────────────────────────────────

const CUSTOM_PROPS: Record<string, string> = {
  AllCaps: 'False',
  AllowEmpty: 'False',
  ImpressionField: 'False',
  DoesNotIndicateFindings: 'False',
  FindingsCodes: '',
  EnforcePickList: 'False',
};

function buildFieldXml(
  type: '1' | '2' | '3',
  start: number,
  length: number,
  name: string,
  defaultValue: string,
  choices?: Array<{ name: string; value: string }>,
): string {
  let xml = `<field type="${type}" start="${start}" length="${length}">`;
  xml += `<name>${escXml(name)}</name>`;
  xml += `<defaultvalue>${escXml(defaultValue)}</defaultvalue>`;

  if (type === '3' && choices) {
    xml += '<choices>';
    for (const c of choices) {
      xml += `<choice name="${escXml(c.name)}">${escXml(c.value)}</choice>`;
    }
    xml += '</choices>';
  }

  xml += '<customproperties>';
  for (const [k, v] of Object.entries(CUSTOM_PROPS)) {
    xml += `<property><name>${k}</name><value>${v}</value></property>`;
  }
  xml += '</customproperties>';
  xml += '</field>';
  return xml;
}

// ── Main generator ───────────────────────────────────────────────────────────

export function generatePowerscribeRtf(set: CDESet): string {
  // RTF file header — matches Python psReportGenerator.initRtf()
  const header =
    '{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat\\deflang1033{\\fonttbl{\\f0\\fnil Segoe UI;}}\n' +
    '{\\colortbl ;\\red208\\green103\\blue40;\\red178\\green34\\blue34;}\n' +
    '{\\*\\generator Riched20 10.0.22621}\\viewkind4\\uc1 \n';

  let rtf = header;
  let cursor = 0;
  const fieldXmlParts: string[] = [];

  // Set title + ID as plain header text (paragraph break after)
  const titleText = cleanText(`${set.name} (${set.id})`);
  rtf += titleText + '\\par\n';
  cursor += titleText.length + 1; // +1 for the \n following \par

  // Process each element
  for (const element of set.elements) {
    const name = cleanText(element.name || element.id);

    // ── PickList (value_set) ─────────────────────────────────────────────────
    if (element.value_set && element.value_set.values.length > 0) {
      const choices = element.value_set.values.map(v => ({
        name: cleanText(v.name),
        value: cleanText(v.name),
      }));
      const defaultValue = choices[0]?.name ?? '';

      // Prefix text before the field
      const prefix = name + ': ';
      rtf += prefix;
      cursor += prefix.length;

      // PickList field RTF:  "Name :  \cf1 A/B/C\par\n\cf1 "
      const fieldRtf =
        name + ' :  \\cf1 ' +
        choices.map(c => c.name).join('/') +
        '\\par\n\\cf1 ';

      const fieldLen = getRtfLength(fieldRtf);
      fieldXmlParts.push(buildFieldXml('3', cursor, fieldLen, name, defaultValue, choices));
      rtf += fieldRtf;
      cursor += fieldLen + 1; // +1 for implicit next-line advance

    // ── Numeric (integer or float) ───────────────────────────────────────────
    } else if (element.integer_value || element.float_value) {
      const prefix = name + ': ';
      rtf += prefix;
      cursor += prefix.length;

      // Text/Numeric field RTF:  "\cf2 Name\cf1\par "
      const fieldRtf = '\\cf2 ' + name + '\\cf1\\par ';
      const fieldLen = getRtfLength(fieldRtf);
      fieldXmlParts.push(buildFieldXml('2', cursor, fieldLen, name, '0'));
      rtf += fieldRtf;
      cursor += fieldLen + 1;

    // ── Text (free-text / unknown type) ─────────────────────────────────────
    } else {
      const prefix = name + ': ';
      rtf += prefix;
      cursor += prefix.length;

      const fieldRtf = '\\cf2 ' + name + '\\cf1\\par ';
      const fieldLen = getRtfLength(fieldRtf);
      fieldXmlParts.push(buildFieldXml('1', cursor, fieldLen, name, ''));
      rtf += fieldRtf;
      cursor += fieldLen + 1;
    }
  }

  rtf += '}';

  // Embedded XML block that Powerscribe reads for field metadata
  const xmlBlock =
    '<?xml version="1.0" ?>' +
    '<autotext version="2" editMode="2">' +
    '<fields>' + fieldXmlParts.join('') + '</fields>' +
    '<links/><textSource/><snippetGroups/>' +
    '</autotext>';

  return rtf + '\n {\\xml}' + xmlBlock;
}

// ── Browser download trigger ─────────────────────────────────────────────────

export function downloadPowerscribeRtf(set: CDESet): void {
  const content = generatePowerscribeRtf(set);
  const blob = new Blob([content], { type: 'application/rtf;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${set.id}_powerscribe.rtf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
