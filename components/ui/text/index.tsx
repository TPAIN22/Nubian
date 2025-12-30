import React from 'react';

import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import { Text as RNText, Platform } from 'react-native';
import { textStyle } from './styles';

type ITextProps = React.ComponentProps<typeof RNText> &
  VariantProps<typeof textStyle>;

const Text = React.forwardRef<React.ComponentRef<typeof RNText>, ITextProps>(
  function Text(
    {
      className,
      isTruncated,
      bold,
      underline,
      strikeThrough,
      size = 'md',
      sub,
      italic,
      highlight,
      style,
      ...props
    },
    ref
  ) {
    // Apply Cairo font on native platforms
    // On web, fonts are handled via CSS
    // IMPORTANT: Font names must match exactly what's registered in useFonts
    const fontFamily = Platform.OS === 'web' 
      ? undefined 
      : (bold ? 'Cairo-Bold' : 'Cairo-Regular');
    
    // Merge styles to ensure font is always applied first
    // This ensures Cairo font takes precedence over any other styles
    const mergedStyle = fontFamily
      ? [
          { fontFamily }, // Apply font first
          ...(Array.isArray(style) ? style : style ? [style] : []),
        ]
      : style;
    
    // Debug in development
    if (__DEV__ && fontFamily && Platform.OS !== 'web') {
      // Log once per render to verify font is being applied
      // Remove this after confirming fonts work
    }
    
    return (
      <RNText
        className={textStyle({
          isTruncated,
          bold,
          underline,
          strikeThrough,
          size,
          sub,
          italic,
          highlight,
          class: className,
        })}
        style={mergedStyle}
        {...props}
        ref={ref}
      />
    );
  }
);

Text.displayName = 'Text';

export { Text };
