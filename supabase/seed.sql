-- Maison Erdene · demo catalogue. Run once after the migrations.
-- Images are original illustrations from /public/bags (scripts/generate-bag-art.mjs).

insert into public.categories (name, slug) values
  ('Гар цүнх', 'top-handle'),
  ('Мөрний цүнх', 'shoulder'),
  ('Тоут цүнх', 'tote'),
  ('Кроссбоди', 'crossbody'),
  ('Клатч', 'clutch');

insert into public.collections (name, slug) values
  ('Шинэ цуглуулга', 'new-arrivals'),
  ('Говь', 'gobi'),
  ('Хязгаарлагдмал хувилбар', 'limited'),
  ('Сонгодог', 'classics');

insert into public.products
  (category_id, name, slug, description, material, color, dimensions, price, stock, created_at)
select c.id, v.name, v.slug, v.description, v.material, v.color, v.dimensions, v.price, v.stock,
       now() - (v.age_days || ' days')::interval
from (values
  ('top-handle', 'Сүлд гар цүнх', 'suld-top-handle',
   'Хатуу хийцтэй, нэг бариултай гар цүнх. Алтан түгжээ нь тал нутгийн нарны дүрсээс сэдэвлэсэн.',
   'Тугалын арьс', 'Хар', '25 × 19 × 11 см', 4850, 4, 2),
  ('top-handle', 'Сүлд гар цүнх · Цагаан', 'suld-top-handle-ivory',
   'Сүлд загварын зааны ясан өнгөт хувилбар. Гараар хийсэн ирмэг будалттай.',
   'Тугалын арьс', 'Зааны яс', '25 × 19 × 11 см', 4850, 2, 12),
  ('top-handle', 'Манан мини', 'manan-mini',
   'Өдөр, оройн хувцаст адилхан зохицох жижиг хэмжээний гар цүнх.',
   'Ямааны арьс', 'Гүн улаан', '18 × 14 × 8 см', 3900, 5, 5),
  ('shoulder', 'Сэрүүн мөрний цүнх', 'seruun-shoulder',
   'Гинжин оосортой, зөөлөн хэлбэртэй мөрний цүнх. Дотроо гурван тасалгаатай.',
   'Хурганы арьс', 'Хар', '28 × 17 × 7 см', 5400, 3, 1),
  ('shoulder', 'Сэрүүн мөрний цүнх · Говь', 'seruun-shoulder-gobi',
   'Говийн элсний өнгөөр будсан хязгаарлагдмал хувилбар.',
   'Хурганы арьс', 'Элсэн шаргал', '28 × 17 × 7 см', 5650, 1, 3),
  ('shoulder', 'Хангай хоб', 'khangai-hobo',
   'Зөөлөн унжсан хэлбэртэй, өдөр тутмын том мөрний цүнх.',
   'Бугын арьс', 'Хүрэн', '34 × 26 × 12 см', 4200, 6, 20),
  ('tote', 'Хэрлэн тоут', 'kherlen-tote',
   'Зөөврийн компьютер багтах том хэмжээтэй, хос бариултай тоут цүнх.',
   'Үрэлттэй тугалын арьс', 'Хүрэн', '38 × 30 × 15 см', 3650, 7, 8),
  ('tote', 'Хэрлэн тоут · Ногоон', 'kherlen-tote-green',
   'Хэрлэн загварын гүн ногоон өнгөт хувилбар.',
   'Үрэлттэй тугалын арьс', 'Гүн ногоон', '38 × 30 × 15 см', 3650, 4, 15),
  ('crossbody', 'Нүүдэл кроссбоди', 'nuudel-crossbody',
   'Аялалд зориулсан, хөнгөн, тохируулгатай оосортой цүнх.',
   'Тугалын арьс', 'Шаргал', '21 × 15 × 7 см', 2950, 8, 4),
  ('crossbody', 'Нүүдэл шанага', 'nuudel-bucket',
   'Утсаар татдаг амтай, шанага хэлбэрийн цүнх.',
   'Хурганы арьс', 'Гүн улаан', '20 × 24 × 18 см', 3250, 5, 25),
  ('clutch', 'Од клатч', 'od-clutch',
   'Оройн хувцсанд зориулсан, алтан ирмэгтэй нарийн клатч.',
   'Торгон арьс', 'Хар', '24 × 12 × 4 см', 2400, 6, 30),
  ('clutch', 'Од клатч · Алт', 'od-clutch-gold',
   'Гэрэлтсэн алтан өнгөлгөөтэй, хязгаарлагдмал тоотой клатч.',
   'Металл өнгөлгөөт арьс', 'Алтлаг', '24 × 12 × 4 см', 2750, 1, 6)
) as v(category_slug, name, slug, description, material, color, dimensions, price, stock, age_days)
join public.categories c on c.slug = v.category_slug;

-- Two views per bag: the studio shot and the dark campaign shot.
insert into public.product_images (product_id, url, position)
select p.id, '/bags/' || p.slug || '.svg', 0 from public.products p;
insert into public.product_images (product_id, url, position)
select p.id, '/bags/' || p.slug || '-dark.svg', 1 from public.products p;

insert into public.product_collections (product_id, collection_id)
select p.id, c.id
from (values
  ('suld-top-handle', 'classics'),
  ('suld-top-handle', 'new-arrivals'),
  ('suld-top-handle-ivory', 'classics'),
  ('manan-mini', 'new-arrivals'),
  ('seruun-shoulder', 'new-arrivals'),
  ('seruun-shoulder', 'classics'),
  ('seruun-shoulder-gobi', 'gobi'),
  ('seruun-shoulder-gobi', 'limited'),
  ('khangai-hobo', 'gobi'),
  ('kherlen-tote', 'classics'),
  ('kherlen-tote-green', 'gobi'),
  ('nuudel-crossbody', 'gobi'),
  ('nuudel-crossbody', 'new-arrivals'),
  ('nuudel-bucket', 'classics'),
  ('od-clutch', 'classics'),
  ('od-clutch-gold', 'limited')
) as v(product_slug, collection_slug)
join public.products p on p.slug = v.product_slug
join public.collections c on c.slug = v.collection_slug;
