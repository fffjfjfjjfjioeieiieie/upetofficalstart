export const Logo = ({ className = '', compact = false }) => (
  <span className={`upet-logo ${className}`.trim()}>
    <img src="/brand/userpet-logo.svg" alt="" width="34" height="34" aria-hidden="true" />
    {!compact && <span>user.pet</span>}
  </span>
);
