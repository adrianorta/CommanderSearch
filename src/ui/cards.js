export function imageFor(card) {
  if (card.image_uris?.normal) return card.image_uris.normal;
  if (card.card_faces?.[0]?.image_uris?.normal) return card.card_faces[0].image_uris.normal;
  return '';
}

export function typeFor(card) {
  return card.type_line || card.card_faces?.[0]?.type_line || '';
}

export function facesFor(card) {
  const printed = (card.card_faces || []).filter((face) => face.image_uris?.normal);
  if (printed.length > 1) {
    return printed.map((face) => ({
      img: face.image_uris.normal,
      name: face.name || card.name,
      type: face.type_line || typeFor(card),
    }));
  }
  return [{ img: imageFor(card), name: card.name, type: typeFor(card) }];
}

export function priceFromObj(prices) {
  const nums = ['usd', 'usd_foil', 'usd_etched']
    .map((key) => parseFloat(prices && prices[key]))
    .filter((number) => Number.isFinite(number) && number >= 0);
  return nums.length ? Math.min.apply(null, nums) : null;
}

export function formatPrice(value) {
  if (value == null) return '—';
  return '$' + value.toFixed(2);
}
