const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export function resolveImageUrl(
  imageUrl?: string | null,
  fallback = "https://placehold.co/600x400"
): string {
  if (!imageUrl) {
    return fallback;
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  return `${API_BASE_URL}${imageUrl}`;
}