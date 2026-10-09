/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#35251F',
    tint: '#654234',
    background: '#F7F2EB',
    foreground: '#35251F',
    card: '#FFFCF8',
    cardForeground: '#35251F',
    primary: '#54352A',
    primaryForeground: '#FFF9F2',
    primaryMuted: '#EAD8C3',
    secondary: '#EFE6DB',
    secondaryForeground: '#48352B',
    muted: '#EEE7DF',
    mutedForeground: '#8A776A',
    accent: '#F0DFCB',
    accentForeground: '#5C3D2D',
    destructive: '#A74838',
    destructiveForeground: '#FFFFFF',
    success: '#E0EBDD',
    successForeground: '#3E6640',
    warning: '#F7E8D3',
    warningBorder: '#E8CBA8',
    warningForeground: '#855525',
    border: '#E7DDD2',
    input: '#E7DDD2',
  },
  dark: {
    text: '#F5EDE5',
    tint: '#D9A677',
    background: '#211814',
    foreground: '#F5EDE5',
    card: '#30241E',
    cardForeground: '#F5EDE5',
    primary: '#D9A677',
    primaryForeground: '#281913',
    primaryMuted: '#76573E',
    secondary: '#3C2F28',
    secondaryForeground: '#F5EDE5',
    muted: '#3C2F28',
    mutedForeground: '#B7A496',
    accent: '#473226',
    accentForeground: '#F2D8BA',
    destructive: '#E18B7B',
    destructiveForeground: '#281913',
    success: '#334633',
    successForeground: '#BBD5B4',
    warning: '#4B3A27',
    warningBorder: '#685136',
    warningForeground: '#E8BC83',
    border: '#493930',
    input: '#493930',
  },

  radius: 16,
};

export default colors;
