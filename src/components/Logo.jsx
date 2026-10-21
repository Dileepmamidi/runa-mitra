import { useId } from "react";

// The Runa Mitra mark (two pieces: teal and orange) drawn inline so it stays
// sharp and can animate. `animated` plays the opening animation: the pieces
// come together and the shadow band fades in.
const TEAL = "M320 440 C300 440 292 388 245 388 C205 388 182 416 182 445 C182 476 202 500 234 500 C266 500 292 466 320 466 C348 466 374 500 406 500 C438 500 462 476 462 445 C462 416 435 388 395 388 C350 388 340 440 320 440 Z";
const ORANGE = "M320 583 C300 583 292 635 245 635 C205 635 182 607 182 578 C182 546 202 522 236 522 C270 522 298 488 320 486 C342 488 370 522 404 522 C438 522 462 546 462 578 C462 607 435 635 395 635 C350 635 340 583 320 583 Z";
const BAND = "M190 478 C210 500 236 502 262 492 C286 482 300 466 320 466 C340 466 354 482 378 492 C404 502 430 500 454 478 L 456 540 C440 528 422 522 404 522 C370 522 342 488 320 486 C298 488 270 522 236 522 C218 522 202 528 188 540 Z";

export function Logo({ size = 40, animated = false, className = "", title = "Runa Mitra" }) {
  const id = useId().replace(/:/g, "");
  const anim = (name, delay) => (animated ? { animation: `${name} 700ms cubic-bezier(.2,.8,.2,1) ${delay}ms both` } : undefined);
  return (
    <svg
      viewBox="172 378 300 268"
      width={size}
      height={Math.round((size * 268) / 300)}
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={`t${id}`} x1="182" y1="388" x2="462" y2="500" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a7d73" />
          <stop offset="1" stopColor="#16424a" />
        </linearGradient>
        <linearGradient id={`o${id}`} x1="182" y1="520" x2="462" y2="640" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#eeaa2f" />
          <stop offset="1" stopColor="#a65733" />
        </linearGradient>
        <linearGradient id={`b${id}`} x1="0" y1="470" x2="0" y2="535" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0f2f33" />
          <stop offset="0.55" stopColor="#1d3a3a" />
          <stop offset="1" stopColor="#8a5a2a" />
        </linearGradient>
        <clipPath id={`c${id}`}>
          <rect x="204" y="462" width="236" height="80" rx="40" />
        </clipPath>
      </defs>
      <path d={ORANGE} fill={`url(#o${id})`} style={anim("logo-rise", 0)} />
      <path d={BAND} fill={`url(#b${id})`} clipPath={`url(#c${id})`} style={anim("logo-fade", 380)} />
      <path d={TEAL} fill={`url(#t${id})`} style={anim("logo-drop", 0)} />
    </svg>
  );
}
