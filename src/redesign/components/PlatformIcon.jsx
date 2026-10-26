import { Globe } from 'lucide-react';
import {
  SiCashapp,
  SiDiscord,
  SiGithub,
  SiInstagram,
  SiKick,
  SiLinktree,
  SiNamemc,
  SiPaypal,
  SiPinterest,
  SiReddit,
  SiRoblox,
  SiSnapchat,
  SiSoundcloud,
  SiSpotify,
  SiSteam,
  SiTelegram,
  SiTiktok,
  SiTwitch,
  SiX,
  SiYoutube,
} from '@icons-pack/react-simple-icons';

const ICONS = {
  cashapp: SiCashapp,
  discord: SiDiscord,
  github: SiGithub,
  instagram: SiInstagram,
  kick: SiKick,
  linktree: SiLinktree,
  namemc: SiNamemc,
  paypal: SiPaypal,
  pinterest: SiPinterest,
  reddit: SiReddit,
  roblox: SiRoblox,
  snapchat: SiSnapchat,
  soundcloud: SiSoundcloud,
  spotify: SiSpotify,
  steam: SiSteam,
  telegram: SiTelegram,
  tiktok: SiTiktok,
  twitch: SiTwitch,
  x: SiX,
  youtube: SiYoutube,
};

export default function PlatformIcon({ platform, color = 'currentColor', size = 20, className = '', style }) {
  const Icon = ICONS[platform];
  if (!Icon) return <Globe aria-hidden="true" className={className} style={{ width: size, height: size, color, ...style }} />;
  return <Icon aria-hidden="true" title="" color={color} size={size} className={className} style={style} />;
}
