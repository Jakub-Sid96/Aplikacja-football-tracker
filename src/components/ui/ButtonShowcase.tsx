import React from "react";
import { PremiumButton } from "./PremiumButton";
import type { PremiumButtonVariant } from "./PremiumButton.types";

/* ---- Inline SVG icons (no icon library in project) ---- */
const IconPlus = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconCheck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconArrow = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconStar = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const variants: PremiumButtonVariant[] = ["navy", "blue", "emerald", "violet", "rose", "amber"];

const sectionStyle: React.CSSProperties = {
  marginBottom: "2.5rem",
};

const headingStyle: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: 600,
  marginBottom: "1rem",
  color: "#cbd5e1",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  alignItems: "center",
};

export function ButtonShowcase() {
  return (
    <div style={{ padding: "2rem", maxWidth: 900 }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "2rem", color: "#f0f2f5" }}>
        PremiumButton Showcase
      </h2>

      {/* Variants */}
      <div style={sectionStyle}>
        <h3 style={headingStyle}>Variants</h3>
        <div style={rowStyle}>
          {variants.map((v) => (
            <PremiumButton key={v} variant={v} icon={IconStar}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </PremiumButton>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div style={sectionStyle}>
        <h3 style={headingStyle}>Sizes</h3>
        <div style={rowStyle}>
          <PremiumButton variant="blue" size="sm" icon={IconCheck}>Small</PremiumButton>
          <PremiumButton variant="blue" size="md" icon={IconCheck}>Medium</PremiumButton>
          <PremiumButton variant="blue" size="lg" icon={IconCheck}>Large</PremiumButton>
        </div>
      </div>

      {/* Icon positions */}
      <div style={sectionStyle}>
        <h3 style={headingStyle}>Icon Positions</h3>
        <div style={rowStyle}>
          <PremiumButton variant="emerald" icon={IconPlus} iconPosition="left">
            Icon Left
          </PremiumButton>
          <PremiumButton variant="emerald" icon={IconArrow} iconPosition="right">
            Icon Right
          </PremiumButton>
        </div>
      </div>

      {/* Icon-only */}
      <div style={sectionStyle}>
        <h3 style={headingStyle}>Icon Only</h3>
        <div style={rowStyle}>
          {variants.map((v) => (
            <PremiumButton key={v} variant={v} icon={IconPlus} iconOnly>
              Add
            </PremiumButton>
          ))}
        </div>
      </div>

      {/* Disabled */}
      <div style={sectionStyle}>
        <h3 style={headingStyle}>Disabled</h3>
        <div style={rowStyle}>
          <PremiumButton variant="blue" icon={IconStar} disabled>
            Disabled
          </PremiumButton>
          <PremiumButton variant="rose" icon={IconPlus} iconOnly disabled>
            Add
          </PremiumButton>
        </div>
      </div>
    </div>
  );
}

export default ButtonShowcase;
