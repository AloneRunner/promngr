
/**
 * Calculates brightness of a hex color (0-255).
 * Uses YIQ formula: (R*299 + G*587 + B*114)/1000
 */
export const getBrightness = (hex: string): number => {
    // Expand shorthand (e.g. "03F") to full form ("0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 128; // Default medium brightness

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    return ((r * 299) + (g * 587) + (b * 114)) / 1000;
};

/**
 * Returns either black or white based on background color brightness for maximum readability.
 * @param hexColor Background color in hex format
 * @returns '#000000' (black) or '#FFFFFF' (white)
 */
export const getContrastColor = (hexColor: string): string => {
    return getBrightness(hexColor) > 128 ? '#000000' : '#FFFFFF';
};

/**
 * Ensures text color is readable on background color.
 * If contrast is poor, returns black or white depending on background brightness.
 * Otherwise returns the original text color.
 */
export const ensureContrast = (bgColor: string, textColor: string): string => {
    const bgBright = getBrightness(bgColor);
    const textBright = getBrightness(textColor);

    // Check contrast ratio approximation (simple brightness diff)
    const diff = Math.abs(bgBright - textBright);

    // If difference is too small (< 100), execute overrides
    if (diff < 100) {
        return getContrastColor(bgColor);
    }

    return textColor;
};
