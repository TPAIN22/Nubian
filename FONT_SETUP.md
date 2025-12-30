# Cairo Font Setup

## Font Files Required

Please add the following font files to `/assets/fonts/`:

1. **Cairo-Regular.ttf** - Regular weight font
2. **Cairo-Bold.ttf** - Bold weight font

You can download Cairo font from:
- Google Fonts: https://fonts.google.com/specimen/Cairo
- Or any other reliable font source

## Setup Complete ✅

The font loading infrastructure is already configured:

1. ✅ Font loading hook created (`hooks/useFonts.ts`)
2. ✅ Fonts loaded in app root (`app/_layout.tsx`)
3. ✅ Default font set for React Native Text components
4. ✅ Tailwind config updated with Cairo fonts
5. ✅ Global CSS updated for web support
6. ✅ Text component wrapper updated to use Cairo
7. ✅ Heading component uses Cairo-Bold

## How It Works

- **React Native**: All `<Text>` components automatically use `Cairo-Regular` by default
- **Bold Text**: When `bold` prop is used, automatically switches to `Cairo-Bold`
- **Headings**: All `<Heading>` components use `Cairo-Bold`
- **Web**: Fonts loaded via CSS `@font-face` declarations
- **RTL Support**: Cairo font supports both Arabic and English text

## Usage

No code changes needed! The fonts are applied automatically:
- Regular text → Cairo-Regular
- Bold text → Cairo-Bold
- Headings → Cairo-Bold

## Next Steps

1. Add `Cairo-Regular.ttf` and `Cairo-Bold.ttf` to `/assets/fonts/`
2. Restart your development server
3. The fonts will be loaded automatically



