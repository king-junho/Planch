const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export function resolveImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) {
    return "https://placehold.co/258x194";
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  return `${API_BASE_URL}${imageUrl}`;
}