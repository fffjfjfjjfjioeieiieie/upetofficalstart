/** Homepage-safe instance of the production profile renderer. */
import { ProfileScene } from "../../../redesign/components/ProfileCard.jsx";
import {
  defaultProfile,
  sanitizeRedesignProfile,
} from "../../../redesign/lib/profileModel.js";
import { lampProfile } from "../data/lamp-profile.js";
import styles from "./HomeShared.module.css";

export default function RealProfile({
  design,
  className = "",
  children,
  label = "Lamp profile preview",
}) {
  const radius =
    design?.links === "square" ? 3 : design?.links === "soft" ? 14 : 24;
  const p = sanitizeRedesignProfile(
    {
      ...defaultProfile("lamp"),
      ...lampProfile,
      card: {
        ...defaultProfile("lamp").card,
        ...lampProfile.card,
        accent: design?.accent || lampProfile.card.accent,
        blur: design?.lens ?? lampProfile.card.blur,
        radius,
      },
      media: lampProfile.media,
      effects: {
        ...defaultProfile("lamp").effects,
        ...lampProfile.effects,
        background: "none",
        overlay: "none",
        text: "none",
        decoration: null,
        webgl: {},
      },
      audio: {
        ...defaultProfile("lamp").audio,
        ...lampProfile.audio,
        src: "",
        autoplay: false,
      },
      links: lampProfile.links,
      linkStyle: { ...lampProfile.linkStyle, radius },
    },
    "lamp",
  );
  return (
    <div
      className={`${styles.profile} ${className}`}
      data-font={design?.font}
      data-card={design?.card}
      data-avatar={design?.avatar}
      aria-label={label}
      onClickCapture={(event) => {
        if (event.target.closest("a")) event.preventDefault();
      }}
    >
      <ProfileScene
        p={p}
        scrollable
        fitDesktop
        fitPreview
        className="h-full w-full"
      >
        {children}
      </ProfileScene>
    </div>
  );
}
