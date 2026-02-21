import { ShareItem } from "../../api/feedApis";
import { showToast } from "../Helper/ShowToast";

type ShareContentType = "post" | "topic" | "nook_message";

interface ShareOptions {
  contentType: ShareContentType;
  contentId: string;
  title?: string;
}

/**
 * Builds the correct frontend URL for a piece of content.
 */
function getContentUrl(contentType: ShareContentType, contentId: string): string {
  const origin = window.location.origin;
  switch (contentType) {
    case "topic":
      return `${origin}/dashboard/forums/topic/${contentId}`;
    case "nook_message":
      return `${origin}/dashboard/nooks/${contentId}`;
    case "post":
    default:
      return `${origin}/dashboard/feeds/post/${contentId}`;
  }
}

/**
 * Single share handler for all content types.
 * Calls the share API, then uses native share or copies to clipboard.
 */
export async function shareContent({ contentType, contentId, title }: ShareOptions): Promise<boolean> {
  const shareUrl = getContentUrl(contentType, contentId);
  const shareText =
    title
      ? `Check out: ${title}`
      : contentType === "topic"
        ? "Check out this topic"
        : contentType === "nook_message"
          ? "Check out this nook post"
          : "Check out this post";

  // Call share tracking API (non-blocking)
  try {
    await ShareItem(contentType, contentId);
  } catch {
    // Non-blocking
  }

  // Native share or clipboard fallback
  if (navigator.share) {
    try {
      await navigator.share({ title: shareText, url: shareUrl });
      return true;
    } catch {
      return false; // User cancelled
    }
  } else {
    await navigator.clipboard.writeText(shareUrl);
    showToast("Link copied to clipboard!", "success");
    return true;
  }
}
