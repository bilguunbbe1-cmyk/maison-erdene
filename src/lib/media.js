// Campaign photos and videos live in public/media (generated with Gemini).
// Every entry has a fallback from the original artwork, so the site still looks
// complete before a file is added or if one fails to load.
export const MEDIA = {
  hero: {
    video: '/media/hero.mp4',
    poster: '/media/hero.jpg',
    fallback: '/bags/seruun-shoulder-gobi-dark.svg',
    label: 'Говь цуглуулгын кампанит ажлын бичлэг',
  },
  craft: {
    video: '/media/craft.mp4',
    poster: '/media/craft.jpg',
    fallback: '/bags/suld-top-handle-dark.svg',
    label: 'Урлаач арьсыг гараар оёж буй бичлэг',
  },
  // Large photos placed between products in the collection grid.
  editorial: [
    {
      src: '/media/editorial-1.jpg',
      // Wide photo in a tall tile: keep the model and the bag beside her in frame.
      focus: '64% 50%',
      fallback: '/bags/khangai-hobo-dark.svg',
      eyebrow: 'Говь цуглуулга',
      title: 'Элсэн манхны өнгө',
      to: '/shop?collection=gobi',
    },
    {
      src: '/media/editorial-2.jpg',
      fallback: '/bags/suld-top-handle-ivory-dark.svg',
      eyebrow: 'Сонгодог',
      title: 'Гараар урласан Сүлд',
      to: '/shop?collection=classics',
    },
  ],
}
