// Small presentation helpers shared by AppHeader and MobileNav for
// rendering a consistent avatar/name for the signed-in Supabase user.

export type UserMeta = {
  email?: string | null;
  id?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
};

const AVATAR_COLOURS = [
  "bg-red-600",
  "bg-blue-600",
  "bg-green-600",
  "bg-purple-600",
  "bg-orange-500",
  "bg-teal-600",
  "bg-pink-600",
  "bg-indigo-600",
];

export function avatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length];
}

export function avatarUrl(user: UserMeta): string | null {
  return user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;
}

export function initials(user: UserMeta): string {
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  const email = user.email ?? "";
  return email.slice(0, 1).toUpperCase() || "?";
}

export function displayName(user: UserMeta): string {
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (name) return name.trim();
  const email = user.email ?? "";
  return email.split("@")[0] || email;
}
