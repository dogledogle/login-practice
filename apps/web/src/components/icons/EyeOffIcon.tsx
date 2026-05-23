// 隐藏密码图标，与 EyeIcon 成对使用，避免在表单组件中内联 SVG。
export function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.7 5.2A9.3 9.3 0 0 1 12 5c6 0 9.5 7 9.5 7a15.6 15.6 0 0 1-3 4.1" />
      <path d="M6.4 6.4C3.9 8 2.5 12 2.5 12S6 19 12 19c1.8 0 3.3-.5 4.6-1.2" />
      <path d="M9.9 9.9A3 3 0 0 0 14.1 14" />
    </svg>
  );
}
