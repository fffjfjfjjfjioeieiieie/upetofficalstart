import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, GripVertical, Lock } from "lucide-react";
import { useStore } from "../../lib/store";
import { BADGES } from "../../lib/catalog";
import { BadgeIcon } from "../../components/ProfileBits";
import { PageTitle } from "../../components/Controls";
import { Switch } from "../../components/ui/switch";

function SortableBadge({ badge, index, total, onMove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: badge.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex min-w-0 items-center gap-2 rounded-xl border border-primary/20 bg-background/55 p-2 ${isDragging ? "z-20 opacity-70 shadow-xl" : ""}`}
      data-testid={`badge-order-${badge.id}`}
    >
      <button type="button" className="touch-none cursor-grab rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary active:cursor-grabbing" aria-label={`Drag ${badge.label} badge`} {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <BadgeIcon id={badge.id} size={15} />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{badge.label}</span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label={`Move ${badge.label} left`} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-25"><ChevronLeft className="h-3.5 w-3.5" /></button>
        <button type="button" disabled={index === total - 1} onClick={() => onMove(index, index + 1)} aria-label={`Move ${badge.label} right`} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-25"><ChevronRight className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

export default function Badges() {
  const { user, updateProfile, saveState } = useStore();
  const p = user.profile;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ownedIds = [
    ...(p.badgeOrder || []).filter((id) => id !== "owner" && p.badges.includes(id)),
    ...p.badges.filter((id) => id !== "owner" && !(p.badgeOrder || []).includes(id)),
  ].filter((id, index, rows) => rows.indexOf(id) === index);
  const ownedBadges = ownedIds.map((id) => BADGES.find((badge) => badge.id === id)).filter(Boolean);
  const lockedBadges = BADGES.filter((badge) => !ownedIds.includes(badge.id));

  const saveOrder = (badgeOrder) => {
    const hidden = new Set(p.hiddenBadges || []);
    updateProfile({
      badgeOrder,
      badges: badgeOrder,
      shownBadges: badgeOrder.filter((id) => !hidden.has(id)),
    });
  };

  const setBadgeVisible = (badgeId, visible) => {
    const hidden = new Set(Array.isArray(p.hiddenBadges)
      ? p.hiddenBadges
      : ownedIds.filter((id) => !p.shownBadges.includes(id)));
    if (visible) hidden.delete(badgeId);
    else hidden.add(badgeId);
    updateProfile({
      hiddenBadges: [...hidden],
      badgeOrder: ownedIds,
      badges: ownedIds,
      shownBadges: ownedIds.filter((id) => !hidden.has(id)),
    });
  };

  const moveBadge = (from, to) => saveOrder(arrayMove(ownedIds, from, to));

  return (
    <div data-testid="badges-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle title="Badges" sub="Show, hide and arrange your unlocked badges. The order here is the order visitors see." />
        <span className={`mb-5 rounded-full border px-3 py-1.5 text-xs md:mb-8 ${saveState === "error" ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-primary/20 bg-primary/10 text-primary"}`}>
          {saveState === "saving" ? "Saving badges…" : saveState === "error" ? "Badges could not save" : "Badges synced"}
        </span>
      </div>

      {ownedBadges.length > 0 && (
        <section className="glass mb-5 rounded-2xl p-4 md:p-5" data-testid="badge-order-panel">
          <div className="mb-4">
            <h2 className="font-display text-sm font-semibold">Profile order</h2>
            <p className="mt-1 text-xs text-muted-foreground">Drag badges into place, or use the arrow buttons.</p>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
            if (!over || active.id === over.id) return;
            moveBadge(ownedIds.indexOf(active.id), ownedIds.indexOf(over.id));
          }}>
            <SortableContext items={ownedIds} strategy={rectSortingStrategy}>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {ownedBadges.map((badge, index) => <SortableBadge key={badge.id} badge={badge} index={index} total={ownedBadges.length} onMove={moveBadge} />)}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...ownedBadges, ...lockedBadges].map((badge) => {
          const owned = ownedIds.includes(badge.id);
          const visible = owned && (Array.isArray(p.hiddenBadges) ? !p.hiddenBadges.includes(badge.id) : p.shownBadges.includes(badge.id));
          return (
            <section key={badge.id} data-testid={`badge-card-${badge.id}`} className={`glass rounded-2xl p-5 transition-colors ${owned ? "border-primary/25" : "opacity-55"}`}>
              <div className="flex items-start justify-between gap-3">
                <BadgeIcon id={badge.id} size={22} />
                {owned ? (
                  <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>{visible ? "Visible" : "Hidden"}</span>
                    <Switch checked={visible} onCheckedChange={(checked) => setBadgeVisible(badge.id, checked)} aria-label={`${visible ? "Hide" : "Show"} ${badge.label} badge`} data-testid={`badge-toggle-${badge.id}`} />
                  </label>
                ) : <Lock className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="mt-4 font-semibold">{badge.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{badge.desc}</div>
              <div className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-primary">{owned ? "Unlocked" : "Locked"}</div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
