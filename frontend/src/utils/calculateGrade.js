/**
 * Calculate grade from actual production number.
 * D = below 60, C = 60-69, B = 70-84, A = 85+
 */
export function calculateGrade(actualProduction) {
  const val = Number(actualProduction);
  if (isNaN(val)) return '';
  if (val < 60) return 'D';
  if (val < 70) return 'C';
  if (val < 85) return 'B';
  return 'A';
}

/**
 * Return a Tailwind badge-style class string for a given grade.
 */
export function gradeColorClass(grade) {
  switch (grade) {
    case 'A':
      return 'bg-green-100 text-green-800';
    case 'B':
      return 'bg-blue-100 text-blue-800';
    case 'C':
      return 'bg-amber-100 text-amber-800';
    case 'D':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
