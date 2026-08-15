/**
 * Share platform utilities for all supported social networks.
 * Generates share URLs for: X, Instagram, Telegram, Facebook, Email
 */

export interface SharePlatformConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const SHARE_PLATFORMS: Record<string, SharePlatformConfig> = {
  native: {
    id: "native",
    label: "Share…",
    icon: "↗",
    color: "#1D1D1F",
    description: "Use your device's native share menu"
  },
  whatsapp: {
    id: "whatsapp",
    label: "WhatsApp",
    icon: "💬",
    color: "#25D366",
    description: "Send directly to contacts via WhatsApp"
  },
  x: {
    id: "x",
    label: "X (Twitter)",
    icon: "𝕏",
    color: "#000000",
    description: "Share on X"
  },
  telegram: {
    id: "telegram",
    label: "Telegram",
    icon: "✈",
    color: "#0088CC",
    description: "Share via Telegram"
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    icon: "f",
    color: "#1877F2",
    description: "Share on Facebook"
  },
  email: {
    id: "email",
    label: "Email",
    icon: "✉",
    color: "#8E8E93",
    description: "Send via email"
  },
  instagram: {
    id: "instagram",
    label: "Instagram DM",
    icon: "📷",
    color: "#E4405F",
    description: "Share via Instagram Direct Message"
  },
  copy: {
    id: "copy",
    label: "Copy Link",
    icon: "📋",
    color: "#5F6065",
    description: "Copy link to clipboard"
  },
};

/**
 * Generate share URL for X (Twitter)
 */
export function getXShareUrl(
  url: string,
  text: string,
  hashtags: string[] = []
): string {
  const params = new URLSearchParams({
    url,
    text,
    ...(hashtags.length > 0 && { hashtags: hashtags.join(",") }),
  });
  return `https://x.com/intent/post?${params.toString()}`;
}

/**
 * Generate share URL for Telegram
 */
export function getTelegramShareUrl(
  url: string,
  text: string
): string {
  const params = new URLSearchParams({
    url,
    text,
  });
  return `https://t.me/share/url?${params.toString()}`;
}

/**
 * Generate share URL for Facebook
 */
export function getFacebookShareUrl(
  url: string,
  quote?: string
): string {
  const params = new URLSearchParams({
    app_id: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "",
    display: "popup",
    href: url,
    ...(quote && { quote }),
  });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

/**
 * Generate mailto link for email sharing
 */
export function getEmailShareUrl(
  subject: string,
  body: string,
  to?: string
): string {
  const params = new URLSearchParams({
    subject,
    body,
    ...(to && { cc: to }),
  });
  return `mailto:?${params.toString()}`;
}

/**
 * Generate Instagram DM share link (Instagram doesn't have direct DM sharing, but we can prompt user)
 * This opens Instagram with a note about manual sharing
 */
export function getInstagramShareText(url: string, recipientName?: string): string {
  return recipientName
    ? `Hi ${recipientName}! Check out this tape I made for you ❤️ ${url}`
    : `A tape was made for me ❤️ ${url}`;
}

/**
 * Unified share handler - calls appropriate function and tracks analytics
 */
export async function shareTowardsPlatform(
  platform: string,
  {
    url,
    title = "A tape was made for you",
    text = "A tape was made for me ❤️",
    recipientName = "",
    tapeId = "",
  }: {
    url: string;
    title?: string;
    text?: string;
    recipientName?: string;
    tapeId?: string;
  }
): Promise<{ success: boolean; url?: string; action?: string }> {
  try {
    switch (platform) {
      case "native":
        if (navigator.share) {
          await navigator.share({
            title,
            text,
            url,
          });
          return { success: true, action: "native_share" };
        }
        return { success: false };

      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
          "_blank"
        );
        return { success: true, url: "whatsapp", action: "whatsapp_share" };

      case "x":
        const xUrl = getXShareUrl(url, text, ["cassette"]);
        window.open(xUrl, "_blank");
        return { success: true, url: xUrl, action: "x_share" };

      case "telegram":
        const telegramUrl = getTelegramShareUrl(url, text);
        window.open(telegramUrl, "_blank");
        return { success: true, url: telegramUrl, action: "telegram_share" };

      case "facebook":
        const fbUrl = getFacebookShareUrl(url, text);
        window.open(fbUrl, "_blank");
        return { success: true, url: fbUrl, action: "facebook_share" };

      case "email":
        const subject = `${recipientName ? `A tape from someone for ${recipientName}` : "A tape was made for you"} ❤️`;
        const body = `${text}\n\nOpen the tape here:\n${url}`;
        const emailUrl = getEmailShareUrl(subject, body);
        window.location.href = emailUrl;
        return { success: true, url: emailUrl, action: "email_share" };

      case "instagram":
        // Instagram DM doesn't have a direct share API - guide user to manual sharing
        const igText = getInstagramShareText(url, recipientName);
        await navigator.clipboard.writeText(igText);
        window.open("https://instagram.com", "_blank");
        return { success: true, action: "instagram_manual_share", url };

      case "copy":
        await navigator.clipboard.writeText(url);
        return { success: true, action: "copy_link" };

      default:
        return { success: false };
    }
  } catch (error) {
    console.error(`Share error for platform ${platform}:`, error);
    return { success: false };
  }
}

/**
 * Get platform-specific emoji/icon
 */
export function getPlatformEmoji(platform: string): string {
  const config = SHARE_PLATFORMS[platform];
  return config?.icon || "📤";
}

/**
 * Get platform-specific color for UI
 */
export function getPlatformColor(platform: string): string {
  const config = SHARE_PLATFORMS[platform];
  return config?.color || "#5F6065";
}
