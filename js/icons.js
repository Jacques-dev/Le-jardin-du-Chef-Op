// Icônes (traits 1.8, 24x24)
const I = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;

export const ICONS = {
  home: I('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/>'),
  intention: I('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>'),
  grid: I('<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>'),
  sliders: I('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
  cube: I('<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9Z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>'),
  film: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>'),
  star: I('<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8Z"/>'),
  leaf: I('<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19c3-4 6-7 10-9"/>'),
  clap: I('<path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/><path d="m4 10-.6-3.4 15.7-2.8.6 3.4Z"/><path d="m8 6 2 3.4M13 5.1l2 3.4"/>'),
  share: I('<path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5 12v7.5h14V12"/>'),
  print: I('<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="1.5"/><path d="M7 14h10v6.5H7Z"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  trash: I('<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>'),
  up: I('<path d="m6 15 6-6 6 6"/>'),
  down: I('<path d="m6 9 6 6 6-6"/>'),
  download: I('<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>'),
  upload: I('<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 19.5h14"/>'),
  search: I('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
  back: I('<path d="M15 5 8 12l7 7"/>'),
  copy: I('<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v9A1.5 1.5 0 0 0 5 15.5h3.5"/>'),
  edit: I('<path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>'),
  light: I('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/>'),
  target: I('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'),
  dice: I('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/>'),
  x: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  info: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.1"/>'),
  install: I('<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M12 7v7M9 11l3 3 3-3"/>'),
  zoomin: I('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5M8 11h6M11 8v6"/>'),
  zoomout: I('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5M8 11h6"/>'),
  reset: I('<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/>'),
};

export const LOGO = `<svg viewBox="0 0 48 48" aria-hidden="true">
  <circle cx="24" cy="24" r="21" fill="none" stroke="var(--accent)" stroke-width="2.4"/>
  <g fill="var(--accent)" opacity=".9">
    ${[0, 60, 120, 180, 240, 300].map(a => `<path transform="rotate(${a} 24 24)" d="M24 5.5 L30.5 16.5 L24 17.8 Z" opacity=".55"/>`).join('')}
  </g>
  <path d="M24 34c0-8 3-13 10-15-1 7-4 13-10 15Z" fill="var(--accent)"/>
  <path d="M24 34c0-6-2.5-10-8-12 .5 6 3 10 8 12Z" fill="var(--accent)" opacity=".7"/>
</svg>`;
