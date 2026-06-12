// @unocss-include
import { getColorPalette, getRgb } from '@sa/color';
import { DARK_CLASS } from '@/constants/app';
import { localStg } from '@/utils/storage';
import { toggleHtmlClass } from '@/utils/common';
import { $t } from '@/locales';

export function setupLoading() {
  const themeColor = localStg.get('themeColor') || '#646cff';
  const darkMode = localStg.get('darkMode') || false;
  const palette = getColorPalette(themeColor);

  const { r, g, b } = getRgb(themeColor);

  const primaryColor = `--primary-color: ${r} ${g} ${b}`;

  const svgCssVars = Array.from(palette.entries())
    .map(([key, value]) => `--logo-color-${key}: ${value}`)
    .join(';');

  const cssVars = `${primaryColor}; ${svgCssVars}`;

  if (darkMode) {
    toggleHtmlClass(DARK_CLASS).add();
  }

  const loadingClasses = [
    'left-0 top-0',
    'left-0 bottom-0 animate-delay-500',
    'right-0 top-0 animate-delay-1000',
    'right-0 bottom-0 animate-delay-1500'
  ];

  const dot = loadingClasses
    .map(item => {
      return `<div class="absolute w-16px h-16px bg-primary rounded-8px animate-pulse ${item}"></div>`;
    })
    .join('\n');

  const loading = `
<div class="fixed-center flex-col bg-layout" style="${cssVars}">
  <div class="w-128px h-128px">
    ${getLogoSvg()}
  </div>
  <div class="w-56px h-56px my-36px">
    <div class="relative h-full animate-spin">
      ${dot}
    </div>
  </div>
  <h2 class="text-28px font-500 text-primary">${$t('system.title')}</h2>
</div>`;

  const app = document.getElementById('app');

  if (app) {
    app.innerHTML = loading;
  }
}

function getLogoSvg() {
  const logoSvg = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:24%;background:radial-gradient(circle at 30% 28%, rgba(255,255,255,0.92), rgba(255,255,255,0.7) 36%, transparent 37%), linear-gradient(145deg, var(--logo-color-50) 0%, var(--logo-color-100) 42%, var(--logo-color-200) 100%);border:1px solid rgba(255,255,255,0.78);box-shadow:0 10px 24px rgba(77,103,133,0.16), inset 0 1px 0 rgba(255,255,255,0.9);position:relative;">
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style="width:68%;height:68%;color:var(--logo-color-700);">
      <path d="M81.28 55.9c-.1-11.67-2.93-22.55-9.37-32.38-1-1.5-2.14-2.86-2.5-4.71a8.1 8.1 0 014-8.61 7.89 7.89 0 019.3 1.23 35.999 35.999 0 015.9 8.83 75.18 75.18 0 018.44 28.58 83.211 83.211 0 01-5.23 36.74 102.983 102.983 0 01-3 7.28 1.2 1.2 0 000 1.41c9.58 13.3 21.76 23 37.85 27.24a54.37 54.37 0 0019.68 1.57 7.72 7.72 0 018.36 6.9 7.903 7.903 0 01-6.7 9 64.744 64.744 0 01-23-1.33 77.68 77.68 0 01-36.93-19.88 93.628 93.628 0 01-11.91-13.71 2.18 2.18 0 00-2.3-1.06 72.744 72.744 0 00-27.38 7.55c-11.6 6-20.67 14.58-26.4 26.45a10.134 10.134 0 01-3.7 4.7 8 8 0 01-9.19-.7 7.86 7.86 0 01-2.36-9.28 60.324 60.324 0 018.72-14.52c12.2-15.43 28.21-24.59 47.32-28.57A85.085 85.085 0 0173.07 87c.524.015 1-.307 1.18-.8a76.06 76.06 0 006.53-22.3c.351-2.652.518-5.325.5-8z" fill="currentColor"/><path d="M136.26 108.34a44.742 44.742 0 01-11.13-2.87 46.108 46.108 0 01-19.66-13.76 8 8 0 015.72-13.22 7.93 7.93 0 016.54 2.93 33.27 33.27 0 0018.87 10.75c1.546.155 3.058.553 4.48 1.18a8.08 8.08 0 013.84 9.21c-.92 3.52-4.13 5.81-8.66 5.78zm-80.6-75.02a7.61 7.61 0 016.64 5 49.139 49.139 0 013.64 17 46.33 46.33 0 01-2.46 17.28c-2 5.77-8.24 7.79-12.89 4.15a8.1 8.1 0 01-2.39-9 31.679 31.679 0 001.68-12.36 35.77 35.77 0 00-2.43-11c-2.1-5.45 1.75-11.07 8.21-11.07zm22.26 93.25a8 8 0 01-6.68 7.86 32.88 32.88 0 00-19.7 12.19 8.13 8.13 0 01-11.21 1.62 8 8 0 01-1.41-11.58A51.043 51.043 0 0154 123.81a45.842 45.842 0 0114-5.1c5.35-1.04 9.91 2.56 9.92 7.86z" fill="currentColor"/>
    </svg>
    <span style="position:absolute;right:14%;bottom:14%;width:16%;height:16%;border-radius:999px;background:linear-gradient(135deg, var(--logo-color-500), var(--logo-color-700));box-shadow:0 0 0 3px rgba(255,255,255,0.9);"></span>
  </div>`;

  return logoSvg;
}
