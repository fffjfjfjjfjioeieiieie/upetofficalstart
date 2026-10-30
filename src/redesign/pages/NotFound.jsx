/** Catch-all page for paths that are not valid profiles or application routes. */
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#08070b] px-6 text-center text-white">
      <div>
        <div className="mx-auto mb-8 grid h-20 w-20 rotate-3 place-items-center rounded-3xl border border-white/20 bg-[#6d4c91] text-4xl font-black shadow-[12px_12px_0_#eee7d9]">
          U
        </div>
        <h1 className="font-display text-5xl font-black tracking-[-.05em] md:text-7xl">
          That page wandered off.
        </h1>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-xl bg-[#eee7d9] px-5 py-3 font-bold text-[#08070b]"
        >
          Back to the homepage
        </Link>
      </div>
    </main>
  );
}
