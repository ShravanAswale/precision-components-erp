/**
 * Grade based on efficiency % = (actualProduction / targetProduction) * 100
 * A = 85%+, B = 70–84%, C = 60–69%, D = below 60%
 */
export function calculateGrade(actualProduction, targetProduction) {
  const actual = Number(actualProduction);
  const target = Number(targetProduction);
  if (isNaN(actual) || isNaN(target) || target <= 0) return "";
  const efficiencyPct = (actual / target) * 100;
  if (efficiencyPct >= 85) return "A";
  if (efficiencyPct >= 70) return "B";
  if (efficiencyPct >= 60) return "C";
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
