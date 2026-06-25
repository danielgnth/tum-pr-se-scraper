const TYPE_BY_COURSE_NUMBER: Record<string, string> = {
  IN0012: 'Praktikum',
  IN0014: 'Seminar',
  IN2106: 'Master-Praktikum',
  IN2107: 'Master-Seminar',
}

export function typeForCourseNumber(courseNumber: string): string {
  return TYPE_BY_COURSE_NUMBER[courseNumber] ?? courseNumber
}
