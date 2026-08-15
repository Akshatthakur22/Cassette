/**
 * Accessibility utilities for CASSETTE
 * Provides helpers for ARIA labels, semantic markup, and screen reader support
 */

/**
 * Generate stable image number from ID
 * Ensures same result on server and client (no hydration mismatch)
 * @param id - Unique identifier (tape ID, etc)
 * @param maxImageNumber - Maximum image number available
 * @returns Stable image number 1-maxImageNumber
 */
export function getStableImageNumber(id: string, maxImageNumber: number = 13): number {
  if (!id) return 1;
  // Use first character code to derive consistent number
  return Math.abs(id.charCodeAt(0)) % maxImageNumber + 1;
}

/**
 * Generate accessible label for tape styling
 */
export function getTapeStyleAriaLabel(style: string): string {
  const labels: Record<string, string> = {
    vintage: "Vintage style cassette tape with warm brown tones",
    neon: "Neon style cassette tape with bright fluorescent colors",
    pastel: "Pastel style cassette tape with soft, gentle colors",
    sunset: "Sunset style cassette tape with orange and purple gradient",
    school: "School style cassette tape with navy and slate tones",
    summer: "Summer style cassette tape with warm orange and amber colors",
  };
  return labels[style] || `${style} style cassette tape`;
}

/**
 * Generate accessible label for relationship type
 */
export function getRelationshipAriaLabel(relationship: string): string {
  const labels: Record<string, string> = {
    friend: "For a friend",
    family: "For family",
    romantic: "For someone romantic",
    colleague: "For a colleague",
    mentor: "For a mentor or role model",
    self: "For yourself",
  };
  return labels[relationship] || relationship;
}

/**
 * Generate accessible description for tape actions
 */
export function getTapeActionAriaLabel(action: string): string {
  const labels: Record<string, string> = {
    play: "Play this tape. Will start audio playback of all songs",
    pause: "Pause the current tape playback",
    next: "Skip to the next song on this tape",
    previous: "Go back to the previous song",
    share: "Share this tape on social media or copy the link",
    report: "Report this tape for inappropriate content",
    download: "Download this tape as a file",
    like: "Like or favorite this tape",
  };
  return labels[action] || action;
}

/**
 * Generate accessible label for player controls
 */
export function getPlayerControlAriaLabel(
  control: string,
  currentValue?: string | number
): string {
  const labels: Record<string, string> = {
    volume: `Volume control, currently set to ${currentValue}%`,
    progress: `Song progress bar, ${currentValue} of total duration`,
    shuffle: "Toggle shuffle mode for random song order",
    repeat: "Toggle repeat mode. Options: off, all, one",
    playlist: "Show playlist of all songs on this tape",
  };
  return labels[control] || control;
}

/**
 * Skip links for keyboard navigation (goes at top of body)
 */
export function getSkipLinksHTML(): string {
  return `
<div class="sr-only">
  <a href="#main-content">Skip to main content</a>
  <a href="#player">Skip to player controls</a>
  <a href="#tape-list">Skip to tape list</a>
</div>
  `.trim();
}

/**
 * Screen reader only CSS class
 * Hides element visually but keeps it for screen readers
 */
export const srOnlyStyles = `
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:active,
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
`;

/**
 * Common ARIA attributes for interactive elements
 */
export const ariaAttributes = {
  button: {
    role: "button",
    tabIndex: 0,
  } as const,
  
  link: {
    role: "link",
    tabIndex: 0,
  } as const,
  
  menuitem: {
    role: "menuitem",
    tabIndex: -1,
  } as const,
  
  tab: {
    role: "tab",
    ariaSelected: false,
    tabIndex: -1,
  } as const,
  
  tabpanel: {
    role: "tabpanel",
    ariaLabelledby: "",
  } as const,
};

/**
 * Accessible heading structure
 */
export interface AccessibleHeading {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  id?: string;
  visuallyHidden?: boolean;
}

/**
 * Generate semantic heading with proper nesting
 */
export function createHeading(heading: AccessibleHeading): string {
  const tag = `h${heading.level}` as const;
  const hiddenClass = heading.visuallyHidden ? 'class="sr-only"' : "";
  const idAttr = heading.id ? `id="${heading.id}"` : "";
  
  return `<${tag} ${idAttr} ${hiddenClass}>${heading.text}</${tag}>`;
}

/**
 * Keyboard event helpers
 */
export const keyboardHelpers = {
  isEnter: (e: KeyboardEvent) => e.key === "Enter" || e.code === "Space",
  isEscape: (e: KeyboardEvent) => e.key === "Escape",
  isArrowUp: (e: KeyboardEvent) => e.key === "ArrowUp",
  isArrowDown: (e: KeyboardEvent) => e.key === "ArrowDown",
  isArrowLeft: (e: KeyboardEvent) => e.key === "ArrowLeft",
  isArrowRight: (e: KeyboardEvent) => e.key === "ArrowRight",
  isTab: (e: KeyboardEvent) => e.key === "Tab",
  isSpace: (e: KeyboardEvent) => e.code === "Space",
};

/**
 * Focus management helpers
 */
export function manageFocus(options: {
  trapFocus?: boolean;
  restoreFocus?: boolean;
  initialFocus?: HTMLElement;
}) {
  const previousActiveElement = document.activeElement as HTMLElement;

  return {
    restoreFocus: () => {
      if (options.restoreFocus && previousActiveElement?.focus) {
        previousActiveElement.focus();
      }
    },
    
    setInitialFocus: () => {
      if (options.initialFocus) {
        options.initialFocus.focus();
      }
    },

    trapFocus: (container: HTMLElement) => {
      if (!options.trapFocus) return;

      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      return (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      };
    },
  };
}

/**
 * Announce messages to screen readers using aria-live
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite"
) {
  // Find or create announcement region
  let announcer = document.getElementById("sr-announcer");
  
  if (!announcer) {
    announcer = document.createElement("div");
    announcer.id = "sr-announcer";
    announcer.className = "sr-only";
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    document.body.appendChild(announcer);
  }

  announcer.setAttribute("aria-live", priority);
  announcer.textContent = message;

  // Clear after announcement is read
  setTimeout(() => {
    announcer!.textContent = "";
  }, 1000);
}

/**
 * Semantic color contrast checker (basic)
 * Returns true if contrast ratio is sufficient for accessibility
 */
export function hasGoodContrast(
  foreground: string,
  background: string
): boolean {
  // This is a simplified check - in production, use a library like polished
  // For now, just check if colors are sufficiently different
  const fgLum = getLuminance(foreground);
  const bgLum = getLuminance(background);
  const contrast = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
  
  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  return contrast >= 4.5;
}

/**
 * Calculate relative luminance for color contrast
 */
function getLuminance(color: string): number {
  // Simplified calculation - converts hex/rgb to luminance
  // In production, use a proper color library
  return 0.5; // Placeholder
}
