/**
 * Grade based on accepted % = ((qtyTested - qtyRejected) / qtyTested) * 100
 * A = 85%+, B = 70–84%, C = 60–69%, D = below 60%
 */
export function calculateGrade(actualProduction, rejectedQty = 0) {
  const actual = Number(actualProduction);
  const rejected = Number(rejectedQty || 0);
  if (isNaN(actual) || actual <= 0) return "";
  const acceptedPct = ((actual - rejected) / actual) * 100;
  if (acceptedPct >= 85) return "A";
  if (acceptedPct >= 70) return "B";
  if (acceptedPct >= 60) return "C";
  return "D";
}

/**
 * Return a Tailwind badge-style class string for a given grade.
 */
export function gradeColorClass(grade) {
  switch (grade) {
    case "A": return "bg-green-100 text-green-800";
    case "B": return "bg-blue-100 text-blue-800";
    case "C": return "bg-amber-100 text-amber-800";
    case "D": return "bg-red-100 text-red-800";
    default:  return "bg-gray-100 text-gray-800";
  }
}
