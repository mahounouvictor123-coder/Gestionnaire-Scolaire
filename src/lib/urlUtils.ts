export function getPublicBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const pathname = window.location.pathname;

  // Replace internal development domain (ais-dev-...) with public shared app domain (ais-pre-...)
  // so external users opening the link on WhatsApp/phone do not encounter a Google 403 Forbidden error.
  let publicOrigin = origin;
  if (publicOrigin.includes('ais-dev-')) {
    publicOrigin = publicOrigin.replace('ais-dev-', 'ais-pre-');
  }

  const cleanPathname = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return `${publicOrigin}${cleanPathname}`;
}

export function buildDirectSchoolAccessUrl(school: {
  id: string;
  name?: string;
  city?: string;
  directorName?: string;
  phone?: string;
  accessPassword?: string;
  tempPassword?: string;
}): string {
  const baseUrl = getPublicBaseUrl();
  const pwd = school.accessPassword || school.tempPassword || '12345678';
  const params = new URLSearchParams({
    school_id: school.id,
    pwd: pwd,
    ...(school.name ? { name: school.name } : {}),
    ...(school.city ? { city: school.city } : {}),
    ...(school.directorName ? { dir: school.directorName } : {}),
    ...(school.phone ? { phone: school.phone } : {}),
    autologin: 'true'
  });
  return `${baseUrl}?${params.toString()}`;
}

export function buildStaffRoleAccessUrl(
  school: {
    id: string;
    name?: string;
    city?: string;
  },
  role: string,
  _code?: string,
  staffName?: string
): string {
  const baseUrl = getPublicBaseUrl();
  const params = new URLSearchParams({
    school_id: school.id,
    role: role,
    ...(staffName ? { staff_name: staffName } : {}),
    ...(school.name ? { name: school.name } : {}),
    ...(school.city ? { city: school.city } : {})
  });
  return `${baseUrl}?${params.toString()}`;
}

export function buildStudentBulletinAccessUrl(
  schoolId: string,
  studentId: string,
  trimester: number = 1,
  registrationNumber?: string
): string {
  const baseUrl = getPublicBaseUrl();
  const params = new URLSearchParams({
    school_id: schoolId,
    view: 'student-portal',
    student_id: studentId,
    trimester: trimester.toString(),
    ...(registrationNumber ? { mat: registrationNumber } : {})
  });
  return `${baseUrl}?${params.toString()}`;
}

export function formatWhatsAppBulletinMessage(data: {
  schoolName: string;
  studentName: string;
  className: string;
  trimester: number;
  academicYear: string;
  average: number | string;
  rank?: string | number;
  totalStudents?: number;
  mention?: string;
  appreciation?: string;
  bulletinUrl: string;
}): string {
  const trLabel = data.trimester === 1 ? '1ER TRIMESTRE' : data.trimester === 2 ? '2ÈME TRIMESTRE' : '3ÈME TRIMESTRE';
  const rankStr = data.rank ? `${data.rank}${data.totalStudents ? ` / ${data.totalStudents} élèves` : ''}` : 'En cours de délibération';
  const mentionStr = data.mention ? `\n🎖️ *Mention :* ${data.mention}` : '';
  const appreciationStr = data.appreciation ? `\n💬 *Appréciation :* "${data.appreciation}"` : '';

  return `🎓 *${data.schoolName.toUpperCase()}*
📢 *BULLETIN SCOLAIRE OFFICIEL - ${trLabel} (${data.academicYear})*

Chers parents de l'élève *${data.studentName}*,
Voici les résultats académiques officiels de votre enfant :

📚 *Classe :* ${data.className}
📊 *Moyenne Générale :* ${typeof data.average === 'number' ? data.average.toFixed(2) : data.average} / 20
🏆 *Rang :* ${rankStr}${mentionStr}${appreciationStr}

📲 *Consulter et Télécharger le Bulletin Numérique en ligne :*
👉 ${data.bulletinUrl}

_La Direction de l'Établissement vous remercie pour votre précieux accompagnement éducatif._`;
}

export function formatSmsBulletinMessage(data: {
  schoolName: string;
  studentName: string;
  className: string;
  trimester: number;
  average: number | string;
  rank?: string | number;
  totalStudents?: number;
  bulletinUrl: string;
}): string {
  const trLabel = `T${data.trimester}`;
  const avgStr = typeof data.average === 'number' ? data.average.toFixed(2) : data.average;
  const rankStr = data.rank ? ` Rang: ${data.rank}${data.totalStudents ? `/${data.totalStudents}` : ''}` : '';
  return `[${data.schoolName}] Bulletin ${trLabel} - Eleve: ${data.studentName} (${data.className}). Moyenne: ${avgStr}/20.${rankStr}. Consultez le bulletin en ligne: ${data.bulletinUrl}`;
}

