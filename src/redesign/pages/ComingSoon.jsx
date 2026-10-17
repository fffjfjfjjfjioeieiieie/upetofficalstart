import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Hourglass } from "lucide-react";

export default function ComingSoon({ name }) {
  return (
    <section data-testid={`coming-soon-${name.toLowerCase()}`} className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-start justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass mb-6 grid h-14 w-14 place-items-center rounded-2xl">
        <Hourglass className="h-6 w-6 text-primary" />
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-4xl font-black sm:text-5xl lg:text-6xl">
        <span className="text-3d inline-block">Coming soon</span>{" "}
        <span className="text-3d-accent inline-block">{name}</span>
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-6 max-w-md text-base text-muted-foreground">
        We are still polishing this one. Check back shortly.
      </motion.p>
      <Link to="/" data-testid="coming-soon-home" className="mt-8 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-primary/10"><ArrowLeft className="h-4 w-4" />Back home</Link>
    </section>
  );
}
