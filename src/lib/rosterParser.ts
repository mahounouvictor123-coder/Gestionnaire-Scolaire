import { extractHtmlFromDocx, extractTextFromDocx } from './docxExtractor';
import { cleanPersonName } from './schoolUtils';

export interface ParsedRosterStudent {
  registrationNumber: string;
  lastName: string;
  firstName: string;
  gender: 'M' | 'F';
  dateOfBirth: string;
  placeOfBirth: string;
  parentName: string;
  parentPhone: string;
  bloodGroup: string;
  address?: string;
}

type ColumnType =
  | 'index'
  | 'registrationNumber'
  | 'fullName'
  | 'lastName'
  | 'firstName'
  | 'gender'
  | 'dateOfBirth'
  | 'placeOfBirth'
  | 'parentName'
  | 'parentPhone'
  | 'bloodGroup'
  | 'address'
  | 'ignore';

/**
 * Supprime les accents et met en minuscules pour la comparaison d'en-têtes.
 */
function normalizeKey(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’".,:;!?()\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Supprime les guillemets englobants ("..." ou '...') sur une cellule CSV/Excel.
 */
function stripQuotes(cell: string): string {
  let s = cell.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).replace(/""/g, '"').trim();
  }
  return s;
}

/**
 * Met en forme Titre tout en préservant les traits d'union (ex: JEAN-BAPTISTE -> Jean-Baptiste).
 */
export function cleanTitleCase(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(word =>
      word
        .split('-')
        .map(part => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ''))
        .join('-')
    )
    .join(' ');
}

/**
 * Découpe une ligne délimitée en respectant les guillemets CSV.
 */
function splitDelimitedLine(line: string, delimiter: string): string[] {
  if (delimiter === 'DASH') {
    return line.split(/\s+[-–—]\s+/).map(stripQuotes);
  }
  if (delimiter === '\t' || delimiter === '|') {
    return line.split(delimiter).map(stripQuotes);
  }

  // CSV-aware split pour ',' et ';'
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(stripQuotes(current));
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(stripQuotes(current));
  return cells;
}

/**
 * Détermine le délimiteur dominant sur l'ensemble du texte collé/importé.
 */
function detectDominantDelimiter(lines: string[]): string | null {
  const sample = lines.slice(0, Math.min(15, lines.length));
  const counts = {
    '\t': 0,
    ';': 0,
    '|': 0,
    ',': 0,
    DASH: 0
  };

  for (const line of sample) {
    if (line.includes('\t')) counts['\t']++;
    if (line.includes(';')) counts[';']++;
    if (line.includes('|')) counts['|']++;
    if (line.includes(',')) counts[',']++;
    if (/\s+[-–—]\s+/.test(line)) counts.DASH++;
  }

  const threshold = Math.max(1, Math.floor(sample.length * 0.4));
  if (counts['\t'] >= threshold) return '\t';
  if (counts[';'] >= threshold) return ';';
  if (counts['|'] >= threshold) return '|';
  if (counts[','] >= threshold) return ',';
  if (counts.DASH >= threshold) return 'DASH';
  return null;
}

/**
 * Mappe un intitulé de colonne d'en-tête vers un champ élève exact.
 */
function matchHeaderCell(cell: string): ColumnType | null {
  const k = normalizeKey(cell);
  if (!k) return null;

  // Toujours vérifier matricule en premier avant "numero / n°"
  if (
    k.includes('matricule') ||
    k.includes('educmaster') ||
    k === 'ine' ||
    k === 'mat' ||
    k === 'n mat' ||
    k === 'num mat' ||
    k === 'no mat' ||
    k === 'code eleve' ||
    k === 'id eleve' ||
    k === 'identifiant'
  ) {
    return 'registrationNumber';
  }

  if (k === 'n' || k === 'n°' || k === 'no' || k === 'num' || k === 'numero' || k === 'ordre' || k === '#' || k === 'id') {
    return 'index';
  }

  if (k === 'prenom' || k === 'prenoms' || k === 'prenom eleve' || k === 'prenoms eleve') {
    return 'firstName';
  }

  if (
    (/\bnoms?\b/.test(k) && /\bprenoms?\b/.test(k)) ||
    k === 'nom complet' ||
    k === 'eleve' ||
    k === 'apprenant' ||
    k === 'identite'
  ) {
    return 'fullName';
  }

  if (k === 'nom' || k === 'noms' || k === 'patronyme' || k === 'nom de famille' || k === 'nom eleve') {
    return 'lastName';
  }

  if (k === 'sexe' || k === 'genre' || k === 'sex' || k === 'civilite') {
    return 'gender';
  }

  if (k.includes('lieu') || k === 'ville' || k === 'localite') {
    return 'placeOfBirth';
  }

  if (k.includes('naissance') || k === 'ddn' || k === 'ne le' || k === 'nee le' || k === 'date naiss' || k === 'date') {
    return 'dateOfBirth';
  }

  if (
    k.includes('tel') ||
    k.includes('phone') ||
    k.includes('contact') ||
    k.includes('whatsapp') ||
    k.includes('gsm') ||
    k.includes('mobile') ||
    k.includes('portable')
  ) {
    return 'parentPhone';
  }

  if (k.includes('parent') || k.includes('tuteur') || k.includes('responsable') || k === 'pere' || k === 'mere') {
    return 'parentName';
  }

  if (k.includes('sanguin') || k === 'gs' || k === 'groupe') {
    return 'bloodGroup';
  }

  if (k.includes('adresse') || k.includes('quartier') || k.includes('residence')) {
    return 'address';
  }

  if (
    k === 'classe' ||
    k === 'section' ||
    k === 'niveau' ||
    k === 'cycle' ||
    k === 'statut' ||
    k === 'etat' ||
    k === 'email' ||
    k === 'mail' ||
    k === 'observation' ||
    k === 'observations' ||
    k === 'remarque' ||
    k === 'rang' ||
    k === 'moyenne'
  ) {
    return 'ignore';
  }

  return null;
}

/**
 * Vérifie si une ligne découpée est une ligne d'en-tête de tableau.
 */
function detectHeaderRow(cells: string[]): ColumnType[] | null {
  const mapped: (ColumnType | null)[] = cells.map(matchHeaderCell);
  const meaningfulMatches = mapped.filter(m => m !== null && m !== 'ignore' && m !== 'index');
  const anyMatches = mapped.filter(m => m !== null);

  if (meaningfulMatches.length >= 2 || (meaningfulMatches.length >= 1 && anyMatches.length >= 2)) {
    return mapped.map(m => m ?? 'ignore');
  }
  return null;
}

/**
 * Normalise une date (JJ/MM/AAAA, JJ-MM-AAAA, AAAA-MM-JJ, JJ.MM.AAAA) vers YYYY-MM-DD.
 */
function parseDateValue(raw: string): string | null {
  const s = raw.trim();
  // YYYY-MM-DD ou YYYY/MM/DD
  const isoMatch = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    if (y >= 1980 && y <= 2030 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YY
  const frMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (frMatch) {
    const d = Number(frMatch[1]);
    const m = Number(frMatch[2]);
    let y = Number(frMatch[3]);
    if (frMatch[3].length === 2) {
      y = y > 30 ? 1900 + y : 2000 + y;
    }
    if (y >= 1980 && y <= 2030 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Vérifie si une valeur correspond à un genre M/F.
 */
function parseGenderValue(raw: string): 'M' | 'F' | null {
  const clean = normalizeKey(raw);
  if (['f', 'feminin', 'fille', 'femme', 'female'].includes(clean)) return 'F';
  if (['m', 'h', 'g', 'masculin', 'garcon', 'homme', 'male'].includes(clean)) return 'M';
  return null;
}

/**
 * Vérifie si une chaîne correspond à un numéro de téléphone.
 */
function isPhoneValue(raw: string, context: { isFirstCol?: boolean; alreadyHasMatricule?: boolean } = {}): boolean {
  const s = raw.trim();
  if (!s) return false;
  if (parseDateValue(s)) return false;

  const digitsOnly = s.replace(/\D/g, '');
  if (digitsOnly.length < 8 || digitsOnly.length > 15) return false;

  // Commence explicitement par + ou 00 ou indicatif entre parenthèses
  if (/^(\+|00|\(\+?\d{1,4}\))/.test(s)) return true;

  // Format groupé avec espaces/points/tirets réguliers (ex: "97 45 12 00", "01 97 45 12 00")
  if (/^\d{2}(?:[\s.-]\d{2}){3,4}$/.test(s)) return true;

  // Si c'est la 1ère colonne purement numérique sans espace et sans indicatif, c'est généralement un matricule (ex: 20240158 ou 2361077)
  if (context.isFirstCol && /^\d+$/.test(s)) return false;

  // Si on a déjà trouvé le matricule et que la cellule contient 8 à 10 chiffres (ex: 97451200 ou 0197451200)
  if (context.alreadyHasMatricule && /^\d{8,10}$/.test(digitsOnly)) return true;

  return false;
}

/**
 * Vérifie si une chaîne ressemble à un libellé de classe ou mot-clé de statut à ignorer.
 */
function isNoiseClassOrStatus(raw: string): boolean {
  const s = normalizeKey(raw);
  if (['actif', 'inactif', 'transfere', 'abandon', 'exclu', 'primaire', 'maternelle', 'college', 'lycee', 'formation'].includes(s)) {
    return true;
  }
  if (/^(ci|cp|cp1|cp2|ce1|ce2|cm1|cm2|6e|6eme|5e|5eme|4e|4eme|3e|3eme|2nde|seconde|1ere|premiere|tle|terminale)(\s+[a-z0-9]+)?$/.test(s)) {
    return true;
  }
  return false;
}

/**
 * Vérifie si un jeton ou une cellule est un numéro matricule.
 */
function isMatriculeValue(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  if (parseDateValue(s)) return false;
  if (/^(A|B|AB|O)[+-]$/i.test(s)) return false;
  if (isNoiseClassOrStatus(s)) return false;

  // Ne doit pas contenir plusieurs mots alphabétiques (un matricule est un code compact)
  const cleaned = s
    .replace(/^(?:matricule\s*[:=\-]?\s*|mat\.?\s*[:=]\s*|n°\s*(?:mat\.?|educmaster)\s*[:=\-]?\s*|educmaster\s*[:=\-]?\s*|code\s*[:=]\s*|id\s*[:=]\s*)/i, '')
    .trim();
  if (!cleaned || /\s{2,}/.test(cleaned)) return false;
  if (cleaned.split(/\s+/).length > 2) return false;

  // Doit contenir au moins un chiffre
  if (!/\d/.test(cleaned)) return false;

  // Doit être composé uniquement de lettres, chiffres, tirets, underscores ou slashs (ex: 2361077, 2025-COL-001, MAT042, EM-123456)
  if (/^[A-Za-z0-9\-\/_]{3,24}$/.test(cleaned.replace(/\s+/g, ''))) {
    // Exclure un petit numéro d'ordre simple à 1 ou 2 chiffres comme "01" ou "5" s'il n'a pas de lettre ni tiret
    if (/^\d{1,3}$/.test(cleaned)) {
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Nettoie un préfixe éventuel de numéro matricule (ex: "Matricule: 2361077" -> "2361077", tout en conservant "MAT-042").
 */
function cleanMatricule(raw: string): string {
  return raw
    .trim()
    .replace(/^(?:matricule\s*[:=\-]?\s*|mat\.?\s*[:=]\s*|n°\s*(?:mat\.?|educmaster)\s*[:=\-]?\s*|educmaster\s*[:=\-]?\s*|code\s*[:=]\s*|id\s*[:=]\s*)/i, '')
    .trim()
    .toUpperCase();
}

/**
 * Sépare intelligemment un nom complet ("ADANLETE Jean-Baptiste" ou "Jean-Baptiste ADANLETE") en { lastName, firstName }.
 */
export function splitFullName(fullNameRaw: string): { lastName: string; firstName: string } {
  const cleaned = cleanPersonName(fullNameRaw);
  if (!cleaned) return { lastName: '', firstName: '' };

  const words = cleaned.split(' ').filter(Boolean);
  if (words.length === 1) {
    return { lastName: words[0].toUpperCase(), firstName: '' };
  }

  // Identifier les mots entièrement en MAJUSCULES (ex: "ADANLETE", "DOSSOU YOVO")
  // Note: ignorer les mots d'1 lettre comme "A" sauf s'il y en a plusieurs
  const isUpperWord = (w: string) =>
    /[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜ]/.test(w) &&
    w === w.toUpperCase() &&
    !/\d/.test(w) &&
    w.replace(/[^A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜ]/g, '').length >= 2;

  const upperWords = words.filter(isUpperWord);
  const nonUpperWords = words.filter(w => !isUpperWord(w));

  // Cas idéal : mélange clair de MAJUSCULES (Nom) et de Minuscules/Titre (Prénoms)
  if (upperWords.length > 0 && nonUpperWords.length > 0) {
    return {
      lastName: upperWords.join(' ').toUpperCase(),
      firstName: cleanTitleCase(nonUpperWords.join(' '))
    };
  }

  // Cas 2 : Tout en majuscules ou tout en minuscules/titre -> 1er mot = Nom de famille, reste = Prénoms
  return {
    lastName: words[0].toUpperCase(),
    firstName: cleanTitleCase(words.slice(1).join(' '))
  };
}

/**
 * Détermine si une ligne est un titre/pied de page administratif à ignorer.
 */
function isDocumentBannerLine(line: string): boolean {
  const k = normalizeKey(line);
  if (!k) return true;
  if (/^[-=_*#]{3,}$/.test(line.trim())) return true;

  const bannerPrefixes = [
    'republique du benin',
    'ministere de',
    'ministere des',
    'complexe scolaire',
    'etablissement',
    'annee scolaire',
    'liste officielle',
    'liste des eleves',
    'registre matricule',
    'classe :',
    'classe:',
    'effectif',
    'cachet et signature',
    'fait a ',
    'le directeur',
    'le censeur'
  ];

  return bannerPrefixes.some(p => k.startsWith(p));
}

/**
 * Analyse une ligne qui peut contenir un préfixe explicite "Champ: Valeur".
 */
function extractLabeledCell(cell: string): { field: ColumnType; value: string } | null {
  const m = cell.match(/^\s*(matricule|mat\.?|n°\s*mat\.?|nom\s*et\s*pr[eé]noms?|nom|pr[eé]noms?|sexe|genre|date(?:\s*de\s*naiss(?:ance)?)?|n[eé]e?\s*le|lieu(?:\s*de\s*naiss(?:ance)?)?|parent|tuteur|p[eè]re|m[eè]re|t[eé]l(?:[eé]phone)?|contact|phone|groupe\s*sanguin|adresse)\s*[:=]\s*(.+)$/i);
  if (!m) return null;
  const label = normalizeKey(m[1]);
  const val = m[2].trim();

  if (label.includes('mat')) return { field: 'registrationNumber', value: val };
  if (label.includes('nom') && label.includes('prenom')) return { field: 'fullName', value: val };
  if (label === 'nom') return { field: 'lastName', value: val };
  if (label.includes('prenom')) return { field: 'firstName', value: val };
  if (label === 'sexe' || label === 'genre') return { field: 'gender', value: val };
  if (label.includes('lieu')) return { field: 'placeOfBirth', value: val };
  if (label.includes('date') || label.includes('ne')) return { field: 'dateOfBirth', value: val };
  if (label.includes('tel') || label.includes('contact') || label.includes('phone')) return { field: 'parentPhone', value: val };
  if (label.includes('parent') || label.includes('tuteur') || label.includes('pere') || label.includes('mere')) return { field: 'parentName', value: val };
  if (label.includes('sanguin')) return { field: 'bloodGroup', value: val };
  if (label.includes('adresse')) return { field: 'address', value: val };
  return null;
}

/**
 * Vérifie si un texte commence par un titre de parent/tuteur.
 */
function looksLikeParentName(raw: string): boolean {
  return /^(?:m\.|mme|mlle|mr|dr|prof|veuve|vve|parent|tuteur|p[eè]re|m[eè]re)\b/i.test(raw.trim());
}

/**
 * Parse une liste brute d'élèves (copier-coller Excel, CSV, Word, PDF, WhatsApp)
 * en séparant rigoureusement Numéro Matricule, Nom, Prénoms, Sexe, Date, Lieu, Parent et Téléphone.
 */
export function parseStudentRosterText(rawText: string): ParsedRosterStudent[] {
  if (!rawText || !rawText.trim()) return [];

  const cleanedText = rawText.replace(/\u00A0/g, ' ');
  const rawLines = cleanedText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !/^[-=_*#]{3,}$/.test(l));

  if (rawLines.length === 0) return [];

  const delimiter = detectDominantDelimiter(rawLines);
  const results: ParsedRosterStudent[] = [];

  // 1. Cas tableau délimité (Excel TSV, CSV ';', Pipe '|', Virgule ',', ou Tiret ' - ')
  if (delimiter) {
    const allRows = rawLines.map(line => splitDelimitedLine(line, delimiter));

    // Chercher une éventuelle ligne d'en-tête dans les 4 premières lignes
    let headerMap: ColumnType[] | null = null;
    let dataStartIdx = 0;

    for (let i = 0; i < Math.min(4, allRows.length); i++) {
      const candidate = detectHeaderRow(allRows[i]);
      if (candidate) {
        headerMap = candidate;
        dataStartIdx = i + 1;
        break;
      }
    }

    const dataRows = allRows.slice(dataStartIdx).filter((cells, idx) => {
      const joined = cells.join(' ').trim();
      if (!joined) return false;
      if (cells.length === 1 && isDocumentBannerLine(joined)) return false;
      if (idx === 0 && isDocumentBannerLine(joined) && !cells.some(c => isMatriculeValue(c))) return false;
      return true;
    });

    if (dataRows.length === 0) return [];

    // Détecter si la 1ère colonne sans en-tête est simplement un N° d'ordre séquentiel (1, 2, 3...)
    let firstColIsOrderIndex = false;
    if (!headerMap && dataRows.length >= 2) {
      let seqMatches = 0;
      let prevNum = 0;
      for (let r = 0; r < dataRows.length; r++) {
        const c0 = (dataRows[r][0] || '').replace(/[\.\)\-:]$/, '').trim();
        if (/^\d{1,3}$/.test(c0) && dataRows[r].length >= 3) {
          const val = parseInt(c0, 10);
          if (val >= prevNum && val <= dataRows.length + 10) {
            seqMatches++;
            prevNum = val;
          }
        }
      }
      if (seqMatches >= Math.ceil(dataRows.length * 0.7)) {
        firstColIsOrderIndex = true;
      }
    }

    for (const cells of dataRows) {
      let registrationNumber = '';
      let lastName = '';
      let firstName = '';
      let gender: 'M' | 'F' = 'M';
      let dateOfBirth = '2012-05-15';
      let placeOfBirth = 'Cotonou';
      let parentName = '';
      let parentPhone = '+229 97 00 00 00';
      let bloodGroup = 'O+';
      let address = '';

      if (headerMap) {
        // Mapping exact guidé par l'en-tête
        let fullNameBuffer = '';
        for (let c = 0; c < cells.length; c++) {
          const rawVal = (cells[c] || '').trim();
          if (!rawVal) continue;
          const colType = headerMap[c] || 'ignore';

          switch (colType) {
            case 'index':
            case 'ignore':
              break;
            case 'registrationNumber':
              registrationNumber = cleanMatricule(rawVal);
              break;
            case 'lastName': {
              // Sécurité si la cellule "Nom" contient aussi un matricule collé devant
              const tokens = rawVal.split(/\s+/);
              if (!registrationNumber && tokens.length >= 2 && isMatriculeValue(tokens[0])) {
                registrationNumber = cleanMatricule(tokens[0]);
                lastName = cleanPersonName(tokens.slice(1).join(' ')).toUpperCase();
              } else {
                lastName = cleanPersonName(rawVal).toUpperCase();
              }
              break;
            }
            case 'firstName':
              firstName = cleanTitleCase(cleanPersonName(rawVal));
              break;
            case 'fullName':
              fullNameBuffer = rawVal;
              break;
            case 'gender': {
              const g = parseGenderValue(rawVal);
              if (g) gender = g;
              break;
            }
            case 'dateOfBirth': {
              const d = parseDateValue(rawVal);
              if (d) dateOfBirth = d;
              break;
            }
            case 'placeOfBirth':
              placeOfBirth = cleanTitleCase(rawVal);
              break;
            case 'parentPhone':
              parentPhone = rawVal;
              break;
            case 'parentName': {
              // Extraire un éventuel téléphone inclus entre parenthèses
              const phoneInParent = rawVal.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,3}\)?[\s.-]?\d{2,3}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/);
              if (phoneInParent && phoneInParent[0].replace(/\D/g, '').length >= 8) {
                if (parentPhone === '+229 97 00 00 00') {
                  parentPhone = phoneInParent[0].trim();
                }
                parentName = rawVal.replace(phoneInParent[0], '').replace(/[\(\)]/g, '').trim();
              } else {
                parentName = rawVal;
              }
              break;
            }
            case 'bloodGroup':
              if (/^(A|B|AB|O)[+-]$/i.test(rawVal)) bloodGroup = rawVal.toUpperCase();
              break;
            case 'address':
              address = rawVal;
              break;
          }
        }

        // Si la colonne était "Nom et Prénoms" combinés (ou si Nom a été rempli avec plusieurs mots et Prénom absent)
        if (fullNameBuffer && !lastName && !firstName) {
          const tokens = fullNameBuffer.split(/\s+/);
          if (!registrationNumber && tokens.length >= 2 && isMatriculeValue(tokens[0])) {
            registrationNumber = cleanMatricule(tokens[0]);
            const split = splitFullName(tokens.slice(1).join(' '));
            lastName = split.lastName;
            firstName = split.firstName;
          } else {
            const split = splitFullName(fullNameBuffer);
            lastName = split.lastName;
            firstName = split.firstName;
          }
        } else if (lastName && !firstName && lastName.includes(' ')) {
          // Si le fichier n'avait qu'une colonne intitulée "Nom" contenant en réalité "NOM Prénom"
          // On regarde l'original avant toUpperCase dans cells
          const nomColIdx = headerMap.indexOf('lastName');
          const origNom = nomColIdx >= 0 ? (cells[nomColIdx] || '').trim() : '';
          if (origNom && origNom !== origNom.toUpperCase()) {
            const split = splitFullName(origNom);
            lastName = split.lastName;
            firstName = split.firstName;
          }
        }
      } else {
        // Sans ligne d'en-tête : classification sémantique intelligente de chaque cellule !
        const textBeforeMeta: string[] = [];
        const textAfterMeta: string[] = [];
        let seenDateOrGender = false;

        for (let c = 0; c < cells.length; c++) {
          let cell = (cells[c] || '').trim();
          if (!cell) continue;

          if (
            c === 0 &&
            (firstColIsOrderIndex || (/^\d{1,3}[\.\)\-:]?$/.test(cell) && cells.length >= 2))
          ) {
            continue;
          }

          // Retirer un éventuel "1. " collé au début de la première cellule
          if (c === 0) {
            cell = cell.replace(/^\d{1,3}[\.\)]\s+/, '').trim();
          }

          // 0. Étiquette explicite "Matricule: ...", "Parent: ..."
          const labeled = extractLabeledCell(cell);
          if (labeled) {
            switch (labeled.field) {
              case 'registrationNumber':
                registrationNumber = cleanMatricule(labeled.value);
                continue;
              case 'lastName':
                lastName = labeled.value.toUpperCase();
                continue;
              case 'firstName':
                firstName = cleanTitleCase(labeled.value);
                continue;
              case 'fullName': {
                const sp = splitFullName(labeled.value);
                lastName = sp.lastName;
                firstName = sp.firstName;
                continue;
              }
              case 'gender': {
                const g = parseGenderValue(labeled.value);
                if (g) gender = g;
                seenDateOrGender = true;
                continue;
              }
              case 'dateOfBirth': {
                const d = parseDateValue(labeled.value);
                if (d) dateOfBirth = d;
                seenDateOrGender = true;
                continue;
              }
              case 'placeOfBirth':
                placeOfBirth = cleanTitleCase(labeled.value);
                continue;
              case 'parentPhone':
                parentPhone = labeled.value;
                continue;
              case 'parentName': {
                const phoneInParent = labeled.value.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,3}\)?[\s.-]?\d{2,3}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/);
                if (phoneInParent && phoneInParent[0].replace(/\D/g, '').length >= 8) {
                  parentPhone = phoneInParent[0].trim();
                  parentName = labeled.value.replace(phoneInParent[0], '').replace(/[\(\)]/g, '').trim();
                } else {
                  parentName = labeled.value;
                }
                continue;
              }
              case 'bloodGroup':
                bloodGroup = labeled.value.toUpperCase();
                continue;
            }
          }

          // 1. Groupe sanguin
          if (/^(A|B|AB|O)[+-]$/i.test(cell)) {
            bloodGroup = cell.toUpperCase();
            continue;
          }

          // 2. Genre
          const g = parseGenderValue(cell);
          if (g) {
            gender = g;
            seenDateOrGender = true;
            continue;
          }

          // 3. Date de naissance
          const d = parseDateValue(cell);
          if (d) {
            dateOfBirth = d;
            seenDateOrGender = true;
            continue;
          }

          // 4. Téléphone (doit être testé avant matricule si format téléphone explicite)
          if (isPhoneValue(cell, { isFirstCol: c === 0, alreadyHasMatricule: Boolean(registrationNumber) })) {
            parentPhone = cell;
            continue;
          }

          // 5. Classe / Statut isolé (ex: CSV sans en-tête)
          if (isNoiseClassOrStatus(cell)) {
            continue;
          }

          // 6. Numéro Matricule
          if (!registrationNumber && isMatriculeValue(cell)) {
            registrationNumber = cleanMatricule(cell);
            continue;
          }

          // 7. Si la cellule commence par un matricule suivi d'un nom (ex: "2361077 ADANLETE Jean")
          const tokens = cell.split(/\s+/);
          if (!registrationNumber && tokens.length >= 2 && isMatriculeValue(tokens[0])) {
            registrationNumber = cleanMatricule(tokens[0]);
            const rest = tokens.slice(1).join(' ');
            if (rest) {
              if (seenDateOrGender) textAfterMeta.push(rest);
              else textBeforeMeta.push(rest);
            }
            continue;
          }

          // 8. Parent explicite (M. / Mme / Dr ...)
          if (looksLikeParentName(cell)) {
            const phoneInParent = cell.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,3}\)?[\s.-]?\d{2,3}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/);
            if (phoneInParent && phoneInParent[0].replace(/\D/g, '').length >= 8) {
              parentPhone = phoneInParent[0].trim();
              parentName = cell.replace(phoneInParent[0], '').replace(/[\(\)]/g, '').trim();
            } else {
              parentName = cell;
            }
            continue;
          }

          // 9. Cellule texte restante (Nom, Prénom ou Lieu)
          if (seenDateOrGender) {
            textAfterMeta.push(cell);
          } else {
            textBeforeMeta.push(cell);
          }
        }

        // Affectation propre des noms à partir de textBeforeMeta (et textAfterMeta)
        if (!lastName && !firstName) {
          if (textBeforeMeta.length >= 2) {
            lastName = textBeforeMeta[0].toUpperCase();
            firstName = cleanTitleCase(textBeforeMeta.slice(1).join(' '));
          } else if (textBeforeMeta.length === 1) {
            const sp = splitFullName(textBeforeMeta[0]);
            lastName = sp.lastName;
            firstName = sp.firstName;
          } else if (textAfterMeta.length >= 2) {
            lastName = textAfterMeta[0].toUpperCase();
            firstName = cleanTitleCase(textAfterMeta[1]);
          } else if (textAfterMeta.length === 1) {
            const sp = splitFullName(textAfterMeta[0]);
            lastName = sp.lastName;
            firstName = sp.firstName;
          }
        }

        // Affectation lieu de naissance / parent avec les textes restants après la date/sexe
        if (textBeforeMeta.length > 0 && textAfterMeta.length > 0) {
          placeOfBirth = cleanTitleCase(textAfterMeta[0]);
          if (textAfterMeta[1] && !parentName) {
            parentName = textAfterMeta[1];
          }
        }
      }

      // Ne pas créer d'élève si ni nom ni prénom n'est valide
      lastName = cleanPersonName(lastName);
      firstName = cleanPersonName(firstName);
      if (!lastName && !firstName) continue;
      if (!lastName && firstName) {
        const sp = splitFullName(firstName);
        lastName = sp.lastName;
        firstName = sp.firstName;
      }

      results.push({
        registrationNumber,
        lastName: lastName.trim().toUpperCase(),
        firstName: firstName.trim(),
        gender,
        dateOfBirth,
        placeOfBirth: placeOfBirth || 'Cotonou',
        parentName: parentName || (lastName ? `M./Mme ${lastName}` : 'Parent / Tuteur'),
        parentPhone,
        bloodGroup,
        ...(address ? { address } : {})
      });
    }

    return results;
  }

  // 2. Cas lignes non délimitées (texte libre collé depuis Word, PDF ou WhatsApp)
  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];
    if (isDocumentBannerLine(line)) continue;

    // Ignorer une éventuelle ligne d'en-tête texte sans délimiteur (ex: "N° MATRICULE NOM PRENOM")
    const normLine = normalizeKey(line);
    if ((normLine.includes('matricule') || normLine.startsWith('n ')) && normLine.includes('nom')) {
      continue;
    }

    let registrationNumber = '';
    let lastName = '';
    let firstName = '';
    let gender: 'M' | 'F' = 'M';
    let dateOfBirth = '2012-05-15';
    let placeOfBirth = 'Cotonou';
    let parentName = '';
    let parentPhone = '+229 97 00 00 00';
    let bloodGroup = 'O+';

    // Retirer numérotation d'ordre au tout début UNIQUEMENT si suivi d'un point/parenthèse/tiret (ex: "1. ", "02) ", "#3 ")
    // Attention à NE PAS retirer un matricule comme "2361077 " ou "2025-COL-001 " !
    line = line.replace(/^(?:\d{1,3}[\.\)\:]\s+|\#\d{1,3}\s+|[\•\*]\s+|-\s+)/, '').trim();
    if (!line) continue;

    // Extraire segment explicite Parent / Tuteur
    const parentSectionMatch = line.match(/(?:parent|tuteur|p[eè]re|m[eè]re)\s*[:=]\s*(.+)$/i);
    if (parentSectionMatch) {
      let pVal = parentSectionMatch[1].trim();
      const phoneInParent = pVal.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,3}\)?[\s.-]?\d{2,3}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/);
      if (phoneInParent && phoneInParent[0].replace(/\D/g, '').length >= 8) {
        parentPhone = phoneInParent[0].trim();
        pVal = pVal.replace(phoneInParent[0], '').replace(/[\(\)]/g, '').trim();
      }
      parentName = pVal;
      line = line.slice(0, parentSectionMatch.index).trim();
    }

    // Extraire téléphone explicite (+229 ... ou format xx xx xx xx)
    const phoneMatch = line.match(/(?:\+\d{1,3}[\s.-]?|00\d{1,3}[\s.-]?)?(?:\d{2}[\s.-]){3,4}\d{2}|\+\d{8,14}/);
    if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 8) {
      parentPhone = phoneMatch[0].trim();
      line = line.replace(phoneMatch[0], ' ').trim();
    }

    // Extraire date de naissance
    const dateMatch = line.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/);
    if (dateMatch) {
      const parsedDate = parseDateValue(dateMatch[0]);
      if (parsedDate) {
        dateOfBirth = parsedDate;
        line = line.replace(dateMatch[0], ' ').trim();
      }
    }

    // Extraire groupe sanguin
    const bgMatch = line.match(/\b(AB|A|B|O)[+-]\b/i);
    if (bgMatch) {
      bloodGroup = bgMatch[0].toUpperCase();
      line = line.replace(bgMatch[0], ' ').trim();
    }

    // Extraire genre sans toucher aux titres "M." / "Mme"
    if (/\((?:f|féminin|feminin|fille)\)|\b(?:féminin|feminin|fille|femme)\b/i.test(line)) {
      gender = 'F';
      line = line.replace(/\((?:f|féminin|feminin|fille)\)|\b(?:féminin|feminin|fille|femme)\b/gi, ' ').trim();
    } else if (/\((?:m|masculin|garçon|garcon)\)|\b(?:masculin|garçon|garcon|homme)\b/i.test(line)) {
      gender = 'M';
      line = line.replace(/\((?:m|masculin|garçon|garcon)\)|\b(?:masculin|garçon|garcon|homme)\b/gi, ' ').trim();
    } else {
      // Chercher un jeton isolé M ou F (qui n'est PAS suivi d'un point comme "M.")
      const tokensCheck = line.split(/\s+/);
      const genderIdx = tokensCheck.findIndex((t, idx) => idx > 0 && /^(M|F)$/i.test(t));
      if (genderIdx !== -1) {
        gender = tokensCheck[genderIdx].toUpperCase() === 'F' ? 'F' : 'M';
        tokensCheck.splice(genderIdx, 1);
        line = tokensCheck.join(' ');
      }
    }

    // Extraire étiquette matricule explicite si présente ("Matricule: 2361077" ou "Mat: MAT-042")
    const matLabelMatch = line.match(/(?:matricule\s*[:=\-]?\s*|mat\.?\s*[:=]\s*|n°\s*mat\.?\s*[:=\-]?\s*)([A-Za-z0-9\-\/_]{3,24})/i);
    if (matLabelMatch && /\d/.test(matLabelMatch[1])) {
      registrationNumber = matLabelMatch[1].trim().toUpperCase();
      line = line.replace(matLabelMatch[0], ' ').trim();
    }

    // Analyser les jetons restants pour séparer matricule éventuel et nom/prénom
    const remainingTokens = line.replace(/^[\-\–\—\|,:;\s]+|[\-\–\—\|,:;\s]+$/g, '').split(/\s+/).filter(Boolean);
    const nameTokens: string[] = [];

    for (let t = 0; t < remainingTokens.length; t++) {
      const tok = remainingTokens[t].replace(/^[,;|]+|[,;|]+$/g, '');
      if (!tok || /^[-–—|/]$/.test(tok)) continue;

      if (t === 0 && /^\d{1,3}[\.\)\-:]?$/.test(tok) && remainingTokens.length >= 2) {
        continue;
      }

      if (!registrationNumber && isMatriculeValue(tok)) {
        registrationNumber = cleanMatricule(tok);
        continue;
      }

      // Si on a déjà un matricule et qu'un nombre à 8 chiffres apparaît en fin de ligne, c'est un téléphone
      if (registrationNumber && /^\d{8,10}$/.test(tok) && parentPhone === '+229 97 00 00 00') {
        parentPhone = tok;
        continue;
      }

      if (isNoiseClassOrStatus(tok)) continue;

      nameTokens.push(tok);
    }

    if (nameTokens.length === 0) continue;

    const split = splitFullName(nameTokens.join(' '));
    lastName = split.lastName;
    firstName = split.firstName;

    if (!lastName && !firstName) continue;

    results.push({
      registrationNumber,
      lastName: lastName.toUpperCase(),
      firstName,
      gender,
      dateOfBirth,
      placeOfBirth,
      parentName: parentName || (lastName ? `M./Mme ${lastName}` : 'Parent / Tuteur'),
      parentPhone,
      bloodGroup
    });
  }

  return results;
}

/**
 * Extrait le texte structuré d'un fichier CSV, TSV, TXT ou Word (.docx)
 * en préservant les colonnes des tableaux Word (séparées par tabulation).
 */
export async function extractRosterTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.docx')) {
    const html = await extractHtmlFromDocx(file);
    if (html && typeof DOMParser !== 'undefined') {
      try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const rows = Array.from(doc.querySelectorAll('table tr'));
        if (rows.length > 0) {
          const tableLines = rows
            .map(tr => {
              const cells = Array.from(tr.querySelectorAll('th, td')).map(td =>
                (td.textContent || '').replace(/\s+/g, ' ').trim()
              );
              return cells.join('\t');
            })
            .filter(l => l.replace(/\t/g, '').trim().length > 0);
          if (tableLines.length > 0) {
            return tableLines.join('\n');
          }
        }
      } catch {
        // Fallback to raw text below
      }
    }
    return await extractTextFromDocx(file);
  }

  // Fichier texte / CSV / TSV
  const buffer = await file.arrayBuffer();
  let text = new TextDecoder('utf-8').decode(buffer);
  // Si des caractères invalides UTF-8 () sont détectés (ex: CSV Excel encodé Windows-1252/Latin1)
  if (text.includes('\uFFFD')) {
    try {
      text = new TextDecoder('windows-1252').decode(buffer);
    } catch {
      // keep utf-8 fallback
    }
  }
  return text.replace(/^\uFEFF/, '').trim();
}
