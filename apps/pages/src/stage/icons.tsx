const box = { width: 20, height: 20, viewBox: "0 0 24 24", "aria-hidden": true } as const;

export const Icons = {
  replay: (
    <svg
      {...box}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4 4.5v4h4" />
    </svg>
  ),
  prev: (
    <svg {...box} fill="currentColor">
      <rect x="4" y="5" width="2.6" height="14" rx="1" />
      <path d="M19.5 5.8v12.4a1 1 0 0 1-1.55.83L9.2 13a1.2 1.2 0 0 1 0-2l8.75-6.03a1 1 0 0 1 1.55.83z" />
    </svg>
  ),
  next: (
    <svg {...box} fill="currentColor">
      <rect x="17.4" y="5" width="2.6" height="14" rx="1" />
      <path d="M4.5 5.8v12.4a1 1 0 0 0 1.55.83L14.8 13a1.2 1.2 0 0 0 0-2L6.05 4.97a1 1 0 0 0-1.55.83z" />
    </svg>
  ),
  pause: (
    <svg {...box} width={24} height={24} fill="currentColor">
      <rect x="6" y="4.5" width="4" height="15" rx="1.2" />
      <rect x="14" y="4.5" width="4" height="15" rx="1.2" />
    </svg>
  ),
  play: (
    <svg {...box} width={24} height={24} fill="currentColor">
      <path d="M7 4.9v14.2a1 1 0 0 0 1.5.86l11.6-7.1a1 1 0 0 0 0-1.72L8.5 4.04A1 1 0 0 0 7 4.9z" />
    </svg>
  ),
  share: (
    <svg
      {...box}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.5v11" />
      <path d="M8 7.2l4-3.9 4 3.9" />
      <path d="M8.5 10.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6.5a2 2 0 0 0-2-2h-1.5" />
    </svg>
  ),
  sun: (
    <svg {...box} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </svg>
  ),
  moon: (
    <svg {...box} fill="currentColor">
      <path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a.6.6 0 0 0-.78-.73A9.5 9.5 0 1 0 21.23 15.4a.6.6 0 0 0-.73-.8z" />
    </svg>
  ),
};
