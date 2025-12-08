import { css } from '@emotion/react';

export const utilityStyles = css`
  /* Typography Base Styles */
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading, var(--font-montserrat)), sans-serif;
    font-weight: var(--heading-weight, 700);
    text-transform: var(--heading-transform, none);
    line-height: 1.1;
    letter-spacing: 0.02em;
    margin-bottom: 0.5em;
  }

  h1 { font-size: var(--text-5xl); }
  h2 { font-size: var(--text-4xl); }
  h3 { font-size: var(--text-3xl); }
  h4 { font-size: var(--text-2xl); }
  h5 { font-size: var(--text-xl); }
  h6 { font-size: var(--text-lg); }

  p {
    margin-bottom: 1em;
    line-height: 1.6;
  }

  /* Generated Utilities */
  ${(() => {
    const utils = [];

    // Typography Sizes
    const textSizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'];
    textSizes.forEach(size => {
      utils.push(`.text-${size} { font-size: var(--text-${size}); }`);
    });

    // Font Weights
    const weights = ['thin', 'extralight', 'light', 'regular', 'medium', 'semibold', 'bold', 'extrabold', 'black'];
    weights.forEach(weight => {
      utils.push(`.font-${weight} { font-weight: var(--font-${weight}); }`);
    });

    // Colors (Text & Background)
    const colors = ['primary', 'secondary', 'muted', 'success', 'warning', 'error', 'background', 'foreground'];
    colors.forEach(color => {
      // Text Colors
      utils.push(`.text-${color} { color: var(--${color}); }`);
      // Background Colors
      utils.push(`.bg-${color} { background-color: var(--${color}); }`);
    });
    
    // Special Text Colors
    utils.push('.text-muted { color: var(--muted-foreground); }');

    // Z-Index
    const zIndices = {
      '0': 'var(--z-base)',
      '10': 'var(--z-elevated)',
      '40': 'var(--z-header)',
      '50': 'var(--z-dropdown)',
      'modal': 'var(--z-modal)',
      'tooltip': 'var(--z-tooltip)'
    };
    Object.entries(zIndices).forEach(([key, value]) => {
      utils.push(`.z-${key} { z-index: ${value}; }`);
    });

    // Opacity (0-100, step 10)
    for (let i = 0; i <= 100; i += 10) {
      utils.push(`.opacity-${i} { opacity: ${i / 100}; }`);
    }

    // Spacing (Margin, Padding, Width, Height)
    const MAX_SPACING = 10;
    for (let i = 0; i <= MAX_SPACING; i++) {
      const value = i === 0 ? '0' : `${i * 0.25}rem`;
      
      // Margin & Padding
      utils.push(`
        .m-${i} { margin: ${value}; }
        .mt-${i} { margin-top: ${value}; }
        .mb-${i} { margin-bottom: ${value}; }
        .ml-${i} { margin-left: ${value}; }
        .mr-${i} { margin-right: ${value}; }
        .mx-${i} { margin-left: ${value}; margin-right: ${value}; }
        .my-${i} { margin-top: ${value}; margin-bottom: ${value}; }
        
        .p-${i} { padding: ${value}; }
        .pt-${i} { padding-top: ${value}; }
        .pb-${i} { padding-bottom: ${value}; }
        .pl-${i} { padding-left: ${value}; }
        .pr-${i} { padding-right: ${value}; }
        .px-${i} { padding-left: ${value}; padding-right: ${value}; }
        .py-${i} { padding-top: ${value}; padding-bottom: ${value}; }
      `);

      // Width & Height (Spacing Scale)
      utils.push(`
        .w-${i} { width: ${value}; }
        .h-${i} { height: ${value}; }
      `);
    }

    // Width Percentages
    const widthPercentages = {
      '1/4': '25%',
      '2/4': '50%',
      '1/2': '50%',
      '3/4': '75%',
      'full': '100%'
    };
    Object.entries(widthPercentages).forEach(([key, value]) => {
      utils.push(`.w-${key} { width: ${value}; }`);
    });

    return utils.join('\n');
  })()}

  /* Manual Overrides & Extras */
  
  /* Text Extras */
  .italic { font-style: italic; }
  .uppercase { text-transform: uppercase; }
  .capitalize { text-transform: capitalize; }
  .block { display: block; }
  .tracking-wide { letter-spacing: 0.05em; }
  .tracking-widest { letter-spacing: 0.1em; }
  .leading-none { line-height: 1; }
  .text-left { text-align: left; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }

  /* Flex */
  .flex { display: flex; }
  .flex-wrap { flex-wrap: wrap; }
  .align-self-start { align-self: flex-start; }
  .items-center { align-items: center; }
  .justify-center { justify-content: center; }
  .justify-between { justify-content: space-between; }

  /* Grid */
  .grid { display: grid; }
  .col-span-full { grid-column: 1 / -1; }

  /* Layout & Sizing Extras */
  .w-fit { width: fit-content; }
  .min-w-fit { min-width: fit-content;}
  .w-32 { width: 8rem; } /* Kept for compatibility, though covered by w-32 generator if we went that high */
  .h-full { height: 100%; }
  .hidden { display: none; }

  /* Positioning */
  .relative { position: relative; }
  .absolute { position: absolute; }
  .fixed { position: fixed; }
  .top-0 { top: 0; }
  .top-4 { top: 1rem; }
  .right-0 { right: 0; }
  .right-4 { right: 1rem; }
  .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }

  /* Backgrounds & Borders Extras */
  .bg-black-50 { background-color: rgba(0, 0, 0, 0.5); }
  .bg-slate-50 { background-color: #f8fafc; }
  .bg-transparent { background-color: transparent; }
  .bg-amber-100 { background-color: #fef3c7; }
  .bg-blue-100 { background-color: #dbeafe; }
  
  .border-slate-100 { border-color: #f1f5f9; }
  .border-b-2 { border-bottom-width: 2px; }
  .border-t-2 { border-top-width: 2px; }
  .border-2 { border-width: 2px; }
  .border-brand { border-width: var(--border-width); }
  .border-black { border-color: #000000; }
  .rounded-lg { border-radius: var(--radius); }

  /* Effects */
  .backdrop-blur-sm { backdrop-filter: blur(4px); }
  .shadow-hard { box-shadow: var(--shadow-hard); }
  .shadow-hover { box-shadow: var(--shadow-hover); }

  /* Overflow */
  .overflow-hidden { overflow: hidden; }

  /* Max Width */
  .max-w-md { max-width: 500px; }

  /* Transforms & Transitions */
  .transition-all { transition: all 0.2s ease; }
  .duration-200 { transition-duration: 200ms; }
  .translate-x-\[-2px\] { transform: translateX(-2px); }
  .translate-y-\[-2px\] { transform: translateY(-2px); }
  .hover\:translate-y-\[-2px\]:hover { transform: translateY(-2px); }
  .hover\:shadow-hover:hover { box-shadow: var(--shadow-hover); }
  .cursor-pointer { cursor: pointer; }
  .cursor-not-allowed { cursor: not-allowed; }
`;
