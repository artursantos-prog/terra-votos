const bundleUrl = "https://divulgacandcontas.tse.jus.br/divulga/main.fa26d702058874e6.js";
const source = await (await fetch(bundleUrl)).text();
const matches = [...source.matchAll(/.{0,140}(?:arquivo|download|anexo).{0,180}/gi)]
  .map(match => match[0])
  .filter((value, index, array) => array.indexOf(value) === index)
  .slice(0, 80);

console.log(JSON.stringify({ matchCount: matches.length, matches }, null, 2));
