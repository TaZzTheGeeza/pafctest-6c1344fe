// Canonical age group ordering across the tournament feature.
// Sorts by the numeric age extracted from the label (e.g. "U7", "U8s", "U10 Gold").
// Unknown labels are pushed to the end and sorted alphabetically.
export function ageGroupSortValue(label: string | null | undefined): number {
  if (!label) return 9999;
  const match = String(label).match(/\d+/);
  return match ? parseInt(match[0], 10) : 9999;
}

export function sortByAgeGroup<T extends { age_group?: string | null }>(items: T[] | null | undefined): T[] {
  if (!items) return [];
  return [...items].sort((a, b) => {
    const av = ageGroupSortValue(a.age_group);
    const bv = ageGroupSortValue(b.age_group);
    if (av !== bv) return av - bv;
    return String(a.age_group ?? "").localeCompare(String(b.age_group ?? ""));
  });
}
