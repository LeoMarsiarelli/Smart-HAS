/** Formats an ISO-8601 timestamp (as returned by the backend) for display. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Builds a DiceBear "initials" avatar URL for a given display name. */
export function avatarUrlFor(name: string): string {
  const seed = encodeURIComponent(name || 'Smart HAS');
  return `https://api.dicebear.com/7.x/initials/png?seed=${seed}&backgroundType=gradientLinear`;
}
