// E3: the sample avatar set — 32 static local SVGs (8 colors x 4 faces),
// generated once and served from /avatars. Stored on the user as the
// profilePicture URL string (tiny payload, no upload system needed).
export const AVATAR_OPTIONS: string[] = Array.from(
  { length: 32 },
  (_, i) => `/avatars/av-${String(i + 1).padStart(2, "0")}.svg`
);
