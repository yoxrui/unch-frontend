"use client";
import "./ToggleSwitch.css";

export default function ToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  size = "medium",
  label,
  id,
  className = "",
  ...props
}) {
  const handleChange = (e) => {
    if (!disabled && onChange) {
      onChange(e.target.checked);
    }
  };

  return (
    <div className={`toggle-switch-container ${className}`}>
      {label && (
        <label htmlFor={id} className="toggle-switch-label">
          {label}
        </label>
      )}
      <div className={`toggle-switch ${size} ${disabled ? 'disabled' : ''}`}>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="toggle-switch-input"
          {...props}
        />
        <span className="toggle-switch-slider"></span>
      </div>
    </div>
  );
}
