export const buildAttendanceCompositeId = (studentId: string, date: string, session: string): string => {
  return `${studentId}:${date}:${session}`;
};

export const isDuplicateAttendance = (
  existingCompositeIds: Set<string>,
  studentId: string,
  date: string,
  session: string,
): boolean => {
  const key = buildAttendanceCompositeId(studentId, date, session);
  return existingCompositeIds.has(key);
};
