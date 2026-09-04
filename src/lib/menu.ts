export function findMenuEvent<T extends { type: string; isAyce: boolean; menuItems: { id: string; name: string }[] }>(
  events: T[],
  invitationCategory: string
): T | null {
  return events.find((e) => invitationCategory.includes(e.type) && e.isAyce && e.menuItems.length > 0) ?? null;
}
