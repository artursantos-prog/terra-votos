import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import { Link } from "wouter";

const sources = [
  { label: "Candidatos 2026", url: "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip" },
  { label: "Informações complementares 2026", url: "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand_complementar/consulta_cand_complementar_2026.zip" },
  { label: "Redes sociais de candidatos 2026", url: "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/rede_social_candidato_2026.zip" },
];

export default function Methodology() {
  return (
    <div className="min-h-screen bg-white text-[#1f1d1b]">
      <AppHeader />
      <main className="container max-w-4xl py-12 md:py-16">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#ff5a00]">Transparência</p>
        <h1 className="mt-3 font-editorial text-4xl font-bold tracking-[-0.04em]">Metodologia e fontes</h1>
        <div className="mt-8 space-y-7 text-[15px] leading-7 text-[#4c4641]">
          <p>O buscador utiliza exclusivamente os três arquivos oficiais do Tribunal Superior Eleitoral listados abaixo. Nenhuma informação de candidatura, perfil social, foto ou plano de governo é obtida de outras fontes.</p>
          <p>Na sincronização, as candidaturas são classificadas como <strong>fora da disputa</strong> somente quando a situação oficial é Indeferido, Renúncia, Cassado, Cancelado, Falecido ou Pedido não conhecido. Os demais registros permanecem na busca principal até uma situação terminal ser informada no arquivo oficial.</p>
          <p>Planos de governo e redes sociais só aparecem no detalhe de uma candidatura quando o respectivo registro estiver presente nos arquivos complementares oficiais sincronizados.</p>
          <section>
            <h2 className="font-editorial text-2xl font-semibold text-[#1f1d1b]">Arquivos oficiais</h2>
            <ul className="mt-3 space-y-2">
              {sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" className="font-semibold text-[#b63f00] underline underline-offset-4">{source.label}</a></li>)}
            </ul>
          </section>
          <p><Link href="/" className="font-semibold text-[#b63f00] underline underline-offset-4">Voltar ao buscador</Link></p>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
