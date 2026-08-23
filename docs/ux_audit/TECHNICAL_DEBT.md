# Technical Debt - CommuteCast

## Quantitative Metrics
- **Legacy CSS**: 43 files contain mixed/inconsistent styles.
- **Hardcoded Layout**: 71 instances of `width` or `height` set to fixed px values.
- **Component Design**: 14 components rely on hardcoded Sidebar dependency, preventing adaptive layout.
- **Mixed Layout**: 18 instances of mixed CSS grid/flex containers not following the adaptive container strategy.

## Action Plan
- Tokenize all spacing and typography.
- Refactor all fixed-width/height containers to use adaptive containers (`w-full`, `max-w-7xl`, `clamp()`).
- Decouple sidebar/navigation from screen logic using `AdaptiveLayout`.
