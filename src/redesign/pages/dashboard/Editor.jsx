import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Wand2, CreditCard, Link2, Music } from "lucide-react";
import { useStore } from "../../lib/store";
import { PageTitle } from "../../components/Controls";
import { ProfileScene } from "../../components/ProfileCard";
import MediaTab from "./editor/MediaTab";
import EffectsTab from "./editor/EffectsTab";
import CardTab from "./editor/CardTab";
import LinksTab from "./editor/LinksTab";
import AudioTab from "./editor/AudioTab";

const TABS = [["media", "Media", Image, MediaTab], ["effects", "Effects / VFX", Wand2, EffectsTab], ["card", "Card", CreditCard, CardTab], ["links", "Links", Link2, LinksTab], ["audio", "Audio", Music, AudioTab]];

export default function Editor() {
  const { user } = useStore();
  const [tab, setTab] = useState("media");
  const Active = TABS.find((t) => t[0] === tab)[3];
  return (
    <div data-testid="editor-page">
      <PageTitle title="Editor" sub="Every change saves instantly and shows in the live preview." />
      <div className="glass mb-6 inline-flex flex-wrap gap-1 rounded-full p-1.5">
        {TABS.map(([id, label, Icon]) => (
          <button key={id} data-testid={`editor-tab-${id}`} onClick={() => setTab(id)} className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${tab === id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {tab === id && <motion.span layoutId="editor-tab" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
            <Icon className="relative h-4 w-4" /><span className="relative">{label}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_460px]">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.22 }} className="min-w-0 space-y-4">
            <Active />
          </motion.div>
        </AnimatePresence>
        <div className="xl:sticky xl:top-8 xl:self-start" data-testid="editor-preview">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground"><span className="uppercase tracking-[0.2em]">Live preview</span><span className="font-mono">user.pet/{user.username}</span></div>
          <ProfileScene p={user.profile} className="h-[680px] rounded-[1.5rem] border" />
        </div>
      </div>
    </div>
  );
}
