import { SchoolClass } from '../types';

/**
 * Détermine si une classe appartient au cycle Primaire ou Maternelle.
 * Utilisé pour filtrer et exclure rigoureusement les classes du primaire de l'Espace Professeur (secondaire : collège & lycée).
 */
export function isPrimaryClass(c?: SchoolClass | { level?: string; name?: string; stream?: string } | null): boolean {
  if (!c) return false;
  
  // 1. Niveau explicite du modèle de données (insensible à la casse)
  const levelUpper = (c.level || '').trim().toUpperCase();
  if (
    levelUpper === 'PRIMAIRE' || 
    levelUpper === 'MATERNELLE' || 
    levelUpper === 'PRIMARY' || 
    levelUpper === 'NURSERY' ||
    levelUpper.includes('PRIMAIRE') ||
    levelUpper.includes('MATERNELLE')
  ) {
    return true;
  }
  
  // 2. Détection par libellé standard du cycle primaire africain francophone
  const name = (c.name || '').trim().toLowerCase();
  if (
    /^(ci|cp|cp1|cp2|ce|ce1|ce2|cm|cm1|cm2|sil)\b/i.test(name) ||
    /\b(ci|cp|cp1|cp2|ce1|ce2|cm1|cm2|sil)\b/i.test(name) ||
    name.includes('cours d\'initiation') ||
    name.includes('cours préparatoire') ||
    name.includes('cours élémentaire') ||
    name.includes('cours moyen') ||
    name.includes('primaire') ||
    name.includes('maternelle') ||
    name.includes('petite section') ||
    name.includes('moyenne section') ||
    name.includes('grande section') ||
    name.includes('crèche') ||
    name.includes('garderie')
  ) {
    return true;
  }
  
  // 3. Détection par filière / section
  const stream = (c.stream || '').toLowerCase();
  if (stream.includes('primaire') || stream.includes('maternelle') || stream.includes('cep')) {
    return true;
  }
  
  return false;
}
