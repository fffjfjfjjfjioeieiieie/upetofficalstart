/** Allowlisted public profiles from a committed, public-only snapshot. */
import { ArrowUpRight, RotateCw } from "lucide-react";
import { HOME_COPY } from "../../../content/home-copy.ts";
import { featuredProfiles } from "../data/lamp-profile.js";
import { SectionIntro, TiltSurface } from "../shared/HomeShared.jsx";
import RealProfile from "../shared/RealProfile.jsx";
import styles from "./ProfileWall.module.css";

export default function ProfileWall({ onRemix }) {
  if (!featuredProfiles.length) return null;
  return (
    <section id="profiles" className={styles.section}>
      <div className={styles.type} aria-hidden="true" />
      <div className={styles.head}>
        <SectionIntro title={HOME_COPY.wall.title} />
        <p>{HOME_COPY.wall.caption}</p>
      </div>
      <div className={styles.wall}>
        {featuredProfiles.map((profile) => (
          <TiltSurface
            key={profile.username}
            className={styles.card}
            cursor={HOME_COPY.cursor.open}
            label={`${profile.displayName} public profile`}
          >
            <RealProfile
              design={{
                accent: profile.card.accent,
                background: "image",
                font: "outfit",
                card: "ink",
                lens: profile.card.blur,
                avatar: "circle",
                links: "round",
              }}
            />
            <div className={styles.overlay}>
              <strong>@{profile.username}</strong>
              <div>
                <a
                  href={`https://user.pet/${profile.username}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {HOME_COPY.wall.view}
                  <ArrowUpRight />
                </a>
                <button type="button" onClick={() => onRemix(profile)}>
                  {HOME_COPY.wall.remix}
                  <RotateCw />
                </button>
              </div>
            </div>
          </TiltSurface>
        ))}
      </div>
    </section>
  );
}
