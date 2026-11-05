// Generates the original bag illustrations in public/bags (npm run art).
// The demo catalogue needs pictures, and the course rules forbid using other
// brands' images without permission. Real photos can replace these any time by
// uploading them in the admin panel.
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = new URL('../public/bags/', import.meta.url)
mkdirSync(OUT, { recursive: true })

const GOLD = ['#efd9a6', '#b08d57', '#7c5f33']

const COLORS = {
  black: ['#3a3532', '#1b1816', '#0b0908'],
  ivory: ['#f4ecdc', '#ddd0b8', '#b6a688'],
  burgundy: ['#7c2a33', '#561922', '#340c13'],
  sand: ['#dcc095', '#bd9b6b', '#8d6f46'],
  brown: ['#8a5a3a', '#603b24', '#3b2314'],
  green: ['#39594a', '#223d31', '#11241c'],
  camel: ['#c99a62', '#a07440', '#6f4e28'],
  gold: ['#ecd49c', '#c0995a', '#856534'],
}

const defs = ([light, mid, dark], id) => `
  <defs>
    <linearGradient id="body-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${light}"/><stop offset=".5" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/>
    </linearGradient>
    <linearGradient id="flap-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${mid}"/>
    </linearGradient>
    <linearGradient id="gold-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${GOLD[0]}"/><stop offset=".55" stop-color="${GOLD[1]}"/><stop offset="1" stop-color="${GOLD[2]}"/>
    </linearGradient>
    <filter id="soft-${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter>
  </defs>`

// The house clasp: a sun disc, not based on any existing brand's mark.
const clasp = (cx, cy, id, r = 17) => `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#gold-${id})"/>
  <circle cx="${cx}" cy="${cy}" r="${r - 5}" fill="none" stroke="${GOLD[2]}" stroke-width="1.2"/>
  <circle cx="${cx}" cy="${cy}" r="${r - 10}" fill="${GOLD[0]}"/>`

const stitch = (d, color) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" stroke-dasharray="6 5" opacity=".55"/>`

const SHAPES = {
  topHandle: (id, c) => `
    <path d="M300 245 C300 120 500 120 500 245" fill="none" stroke="${c[2]}" stroke-width="21" stroke-linecap="round"/>
    <path d="M300 245 C300 120 500 120 500 245" fill="none" stroke="${c[0]}" stroke-width="5" opacity=".45" stroke-linecap="round"/>
    <path d="M190 255 Q190 235 212 235 H588 Q610 235 610 255 L632 575 Q634 600 608 600 H192 Q166 600 168 575 Z" fill="url(#body-${id})"/>
    <path d="M186 240 H614 L612 390 Q400 470 188 390 Z" fill="url(#flap-${id})"/>
    ${stitch('M198 250 H602 L600 382 Q400 456 200 382 Z', c[0])}
    ${stitch('M182 586 H618', c[0])}
    ${clasp(400, 424, id)}`,

  shoulder: (id, c) => `
    <path d="M230 300 C210 90 590 90 570 300" fill="none" stroke="url(#gold-${id})" stroke-width="7" stroke-dasharray="15 6"/>
    <path d="M160 315 Q155 285 190 285 H610 Q645 285 640 315 L625 560 Q622 590 590 590 H210 Q178 590 175 560 Z" fill="url(#body-${id})"/>
    <path d="M152 300 Q152 280 180 280 H620 Q648 280 648 300 L640 400 Q400 505 160 400 Z" fill="url(#flap-${id})"/>
    ${stitch('M166 296 H634 L628 392 Q400 490 172 392 Z', c[0])}
    ${clasp(400, 447, id, 15)}`,

  hobo: (id, c) => `
    <path d="M258 320 C230 95 570 95 542 320" fill="none" stroke="${c[2]}" stroke-width="24" stroke-linecap="round"/>
    <path d="M190 330 Q400 410 610 330 Q685 480 620 575 Q590 620 400 620 Q210 620 180 575 Q115 480 190 330 Z" fill="url(#body-${id})"/>
    <path d="M190 330 Q400 410 610 330 Q400 372 190 330 Z" fill="${c[2]}"/>
    ${stitch('M205 356 Q400 428 595 356', c[0])}
    ${clasp(400, 455, id, 13)}`,

  tote: (id, c) => `
    <path d="M285 300 V170 Q285 135 320 135 H345 Q380 135 380 170 V300" fill="none" stroke="${c[2]}" stroke-width="17"/>
    <path d="M420 300 V170 Q420 135 455 135 H480 Q515 135 515 170 V300" fill="none" stroke="${c[2]}" stroke-width="17"/>
    <path d="M165 275 H635 L605 615 Q603 632 585 632 H215 Q197 632 195 615 Z" fill="url(#body-${id})"/>
    ${stitch('M178 292 H622', c[0])}
    ${stitch('M208 618 H592', c[0])}
    <rect x="265" y="292" width="40" height="72" rx="3" fill="${c[2]}"/>
    <rect x="495" y="292" width="40" height="72" rx="3" fill="${c[2]}"/>
    ${clasp(400, 440, id, 14)}`,

  crossbody: (id, c) => `
    <path d="M222 300 C160 60 640 60 578 300" fill="none" stroke="${c[2]}" stroke-width="10"/>
    <path d="M205 300 Q205 270 240 270 H560 Q595 270 595 300 V540 Q595 575 560 575 H240 Q205 575 205 540 Z" fill="url(#body-${id})"/>
    <path d="M205 300 Q205 270 240 270 H560 Q595 270 595 300 V375 Q595 400 400 400 Q205 400 205 375 Z" fill="url(#flap-${id})"/>
    ${stitch('M218 300 Q218 284 240 284 H560 Q582 284 582 300 V372 Q582 386 400 386 Q218 386 218 372 Z', c[0])}
    ${clasp(400, 402, id, 16)}`,

  bucket: (id, c) => `
    <path d="M285 245 C265 90 535 90 515 245" fill="none" stroke="${c[2]}" stroke-width="12"/>
    <ellipse cx="400" cy="250" rx="165" ry="36" fill="${c[2]}"/>
    <path d="M235 250 Q400 310 565 250 L600 575 Q604 625 545 625 H255 Q196 625 200 575 Z" fill="url(#body-${id})"/>
    <path d="M238 292 Q400 348 562 292" fill="none" stroke="${GOLD[1]}" stroke-width="5"/>
    <path d="M400 322 V410" stroke="${GOLD[1]}" stroke-width="4"/>
    ${clasp(400, 424, id, 13)}
    ${stitch('M210 600 H590', c[0])}`,

  clutch: (id, c) => `
    <path d="M135 300 Q135 275 165 275 H635 Q665 275 665 300 V505 Q665 535 635 535 H165 Q135 535 135 505 Z" fill="url(#body-${id})"/>
    <path d="M135 300 Q135 275 165 275 H635 Q665 275 665 300 L660 330 L400 442 L140 330 Z" fill="url(#flap-${id})"/>
    <path d="M140 330 L400 442 L660 330" fill="none" stroke="${GOLD[1]}" stroke-width="3"/>
    <rect x="135" y="520" width="530" height="5" fill="${GOLD[1]}" opacity=".8"/>
    ${clasp(400, 442, id, 15)}`,
}

const render = ({ slug, shape, color }, dark) => {
  const c = COLORS[color]
  const id = `${slug}${dark ? '-d' : ''}`
  const bg = dark ? ['#25201c', '#100e0c'] : ['#fbf8f2', '#ebe4d6']
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" role="img" aria-label="${slug}">
  ${defs(c, id)}
  <defs><radialGradient id="bg-${id}" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></radialGradient></defs>
  <rect width="800" height="800" fill="url(#bg-${id})"/>
  <ellipse cx="400" cy="648" rx="265" ry="24" fill="#000" opacity="${dark ? 0.6 : 0.2}" filter="url(#soft-${id})"/>
  ${SHAPES[shape](id, c)}
</svg>
`
}

const BAGS = [
  { slug: 'suld-top-handle', shape: 'topHandle', color: 'black' },
  { slug: 'suld-top-handle-ivory', shape: 'topHandle', color: 'ivory' },
  { slug: 'manan-mini', shape: 'crossbody', color: 'burgundy' },
  { slug: 'seruun-shoulder', shape: 'shoulder', color: 'black' },
  { slug: 'seruun-shoulder-gobi', shape: 'shoulder', color: 'sand' },
  { slug: 'khangai-hobo', shape: 'hobo', color: 'brown' },
  { slug: 'kherlen-tote', shape: 'tote', color: 'brown' },
  { slug: 'kherlen-tote-green', shape: 'tote', color: 'green' },
  { slug: 'nuudel-crossbody', shape: 'crossbody', color: 'camel' },
  { slug: 'nuudel-bucket', shape: 'bucket', color: 'burgundy' },
  { slug: 'od-clutch', shape: 'clutch', color: 'black' },
  { slug: 'od-clutch-gold', shape: 'clutch', color: 'gold' },
]

for (const bag of BAGS) {
  writeFileSync(new URL(`${bag.slug}.svg`, OUT), render(bag, false))
  writeFileSync(new URL(`${bag.slug}-dark.svg`, OUT), render(bag, true))
}
console.log(`Wrote ${BAGS.length * 2} illustrations`)
