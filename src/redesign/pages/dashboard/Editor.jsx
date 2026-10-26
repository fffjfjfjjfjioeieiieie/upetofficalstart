import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Wand2, CreditCard, Link2, Music, DoorOpen, Captions } from "lucide-react";
import { PageTitle } from "../../components/Controls";
import EditorPreview from "./editor/EditorPreview";
import MediaTab from "./editor/MediaTab";
import EffectsTab from "./editor/EffectsTab";
import CardTab from "./editor/CardTab";
import LinksTab from "./editor/LinksTab";
import AudioTab from "./editor/AudioTab";
import LyricsTab from "./editor/LyricsTab";
import EntryTab from "./editor/EntryTab";

const TABS = [["media", "Media", Image, MediaTab], ["entry", "Entry", DoorOpen, EntryTab], ["effects", "Effects / VFX", Wand2, EffectsTab], ["card", "Card", CreditCard, CardTab], ["links", "Links", Link2, LinksTab], ["audio", "Audio", Music, AudioTab], ["lyrics", "Lyrics", Captions, LyricsTab]];

export default function Editor() {
  const [tab, setTab] = useState("media");
  const Active = TABS.find((t) => t[0] === tab)[3];
  return (
    <div data-testid="editor-page">
      <PageTitle title="Editor" sub="Every change saves instantly and shows in the live preview." />
      <label className="glass sticky top-20 z-30 mb-4 flex items-center gap-3 rounded-xl px-3 py-2 shadow-lg shadow-black/20 md:hidden">
        <span className="text-xs font-semibold text-muted-foreground">Edit</span>
        <select data-testid="editor-mobile-tab" value={tab} onChange={(event) => setTab(event.target.value)} className="min-w-0 flex-1 bg-transparent py-1 text-sm font-semibold outline-none">
          {TABS.map(([id, label]) => <option key={id} value={id} className="bg-background text-foreground">{label}</option>)}
        </select>
      </label>
      <div className="glass mb-6 hidden flex-wrap gap-1 rounded-full p-1.5 md:inline-flex">
        {TABS.map(([id, label, Icon]) => (
          <button key={id} data-testid={`editor-tab-${id}`} onClick={() => setTab(id)} className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${tab === id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {tab === id && <motion.span layoutId="editor-tab" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
            <Icon className="relative h-4 w-4" /><span className="relative">{label}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_460px] xl:gap-6">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.22 }} className="min-w-0 space-y-3 md:space-y-4">
            <Active />
          </motion.div>
        </AnimatePresence>
        <EditorPreview tab={tab} />
      </div>
    </div>
  );
}
