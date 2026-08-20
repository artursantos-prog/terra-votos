/**
 * Design reminder: reproduce the supplied Eleições no Terra reference through
 * an editorial white canvas, subtle rules, orange data accents and Lora titles.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

type Candidate = {
  id: string;
  nome: string;
  nomeCompleto: string;
  numero: string;
  partido: string;
  partidoNome: string;
  uf: string;
  cargo: string;
  situacao: string;
  fotoUrl: string;
  pesquisa: string;
};

type CandidateResponse = { candidatos: Candidate[] };

const DATA_URL = "/manus-storage/candidatos-eleicoes-2026_ed6ecc37.json";
const PAGE_SIZE = 12;

const STATE_NAMES: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AM: "Amazonas",
  AP: "Amapá",
  BA: "Bahia",
  BR: "Brasil",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MG: "Minas Gerais",
  MS: "Mato Grosso do Sul",
  MT: "Mato Grosso",
  PA: "Pará",
  PB: "Paraíba",
  PE: "Pernambuco",
  PI: "Piauí",
  PR: "Paraná",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RO: "Rondônia",
  RR: "Roraima",
  RS: "Rio Grande do Sul",
  SC: "Santa Catarina",
  SE: "Sergipe",
  SP: "São Paulo",
  TO: "Tocantins",
};

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function OptionSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <div className="select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" size={15} strokeWidth={2.2} />
      </div>
    </label>
  );
}

function CandidateCard({ candidate, index }: { candidate: Candidate; index: number }) {
  return (
    <article className="candidate-card" style={{ "--card-index": index } as React.CSSProperties}>
      <div className="candidate-topline" />
      <div className="candidate-meta">
        <span>{STATE_NAMES[candidate.uf] ?? candidate.uf} / {candidate.uf}</span>
        <span>{candidate.cargo}</span>
      </div>
      <div className="candidate-main">
        <div>
          <h3>{candidate.nome}</h3>
          <p title={candidate.partidoNome}>{candidate.partido}</p>
        </div>
        <div className="candidate-photo">
          <span>Foto</span>
          <img
            src={candidate.fotoUrl}
            alt={`Foto de ${candidate.nome}`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>
      </div>
      <div className="candidate-number" aria-label={`Número de urna ${candidate.numero}`}>
        <span>Número</span>
        <strong>{candidate.numero}</strong>
      </div>
      <div className="candidate-bottomline">
        <span>{candidate.situacao === "#NE" ? "Candidatura registrada" : candidate.situacao}</span>
        <ArrowUpRight aria-hidden="true" size={17} strokeWidth={2.25} />
      </div>
    </article>
  );
}

export default function Home() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [party, setParty] = useState("");
  const [office, setOffice] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    fetch(DATA_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Não foi possível carregar os dados.");
        return response.json() as Promise<CandidateResponse>;
      })
      .then((response) => {
        if (active) setCandidates(response.candidatos);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const stateOptions = useMemo(
    () => [
      { label: "Todos os estados", value: "" },
      ...Array.from(new Set(candidates.map((candidate) => candidate.uf)))
        .sort((first, second) => (STATE_NAMES[first] ?? first).localeCompare(STATE_NAMES[second] ?? second, "pt-BR"))
        .map((uf) => ({ label: `${STATE_NAMES[uf] ?? uf} (${uf})`, value: uf })),
    ],
    [candidates],
  );

  const partyOptions = useMemo(
    () => [
      { label: "Todos os partidos", value: "" },
      ...Array.from(new Set(candidates.map((candidate) => candidate.partido)))
        .sort((first, second) => first.localeCompare(second, "pt-BR"))
        .map((item) => ({ label: item, value: item })),
    ],
    [candidates],
  );

  const officeOptions = useMemo(
    () => [
      { label: "Todos os cargos", value: "" },
      ...Array.from(new Set(candidates.map((candidate) => candidate.cargo)))
        .sort((first, second) => first.localeCompare(second, "pt-BR"))
        .map((item) => ({ label: item, value: item })),
    ],
    [candidates],
  );

  const filteredCandidates = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    return candidates.filter((candidate) => {
      const matchesQuery = !normalizedQuery || candidate.pesquisa.includes(normalizedQuery);
      const matchesState = !state || candidate.uf === state;
      const matchesParty = !party || candidate.partido === party;
      const matchesOffice = !office || candidate.cargo === office;
      return matchesQuery && matchesState && matchesParty && matchesOffice;
    });
  }, [candidates, office, party, query, state]);

  useEffect(() => setPage(1), [query, state, party, office]);

  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const visibleCandidates = filteredCandidates.slice(pageStart, pageStart + PAGE_SIZE);
  const hasFilters = Boolean(query || state || party || office);

  function clearFilters() {
    setQuery("");
    setState("");
    setParty("");
    setOffice("");
  }

  return (
    <main className="election-page">
      <section className="editorial-shell">
        <header className="site-header" aria-label="Cabeçalho Eleições no Terra">
          <div className="brand-lockup">
            <img src="/manus-storage/terra-election-mark_debb05e3.png" alt="" className="brand-mark" />
            <div className="brand-name" aria-label="Eleições no Terra">
              <span>eleições</span>
              <span>no terra</span>
              <b>PRIMEIRO TURNO</b>
            </div>
          </div>
          <div className="header-rule" />
          <div className="powered-by" aria-label="Powered by Terra">
            <span>Powered by</span>
            <strong>terra</strong>
          </div>
        </header>

        <div className="intro-panel">
          <div className="intro-copy">
            <p className="eyebrow">Eleições 2026</p>
            <h1>Buscador de candidatos</h1>
            <p>Localize candidaturas, partidos e números de urna em todo o Brasil.</p>
          </div>
          <div className="intro-data" aria-label="Informações da base">
            <strong>{loading ? "…" : candidates.length.toLocaleString("pt-BR")}</strong>
            <span>candidaturas<br />na base atual</span>
          </div>
        </div>

        <section className="search-panel" aria-label="Filtros de candidatos">
          <div className="search-panel-heading">
            <div>
              <p className="section-kicker"><SlidersHorizontal size={15} aria-hidden="true" /> Busca refinada</p>
              <h2>Encontre quem você procura</h2>
            </div>
            {hasFilters && (
              <button className="clear-button" type="button" onClick={clearFilters}>
                <X size={15} aria-hidden="true" /> Limpar filtros
              </button>
            )}
          </div>

          <div className="filters-grid">
            <label className="search-field">
              <span>Nome ou número</span>
              <div>
                <Search aria-hidden="true" size={18} strokeWidth={2.1} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Digite o nome ou número"
                  aria-label="Buscar por nome ou número"
                />
              </div>
            </label>
            <OptionSelect label="Estado" value={state} onChange={setState} options={stateOptions} />
            <OptionSelect label="Partido" value={party} onChange={setParty} options={partyOptions} />
            <OptionSelect label="Cargo" value={office} onChange={setOffice} options={officeOptions} />
          </div>
        </section>

        <section className="results-section" aria-live="polite">
          <div className="results-header">
            <div>
              <p className="section-kicker">Resultados da busca</p>
              <h2>
                {loading ? "Carregando candidaturas…" : `${filteredCandidates.length.toLocaleString("pt-BR")} candidatura${filteredCandidates.length === 1 ? "" : "s"}`}
              </h2>
            </div>
            {!loading && filteredCandidates.length > 0 && (
              <p>Exibindo {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filteredCandidates.length)} de {filteredCandidates.length.toLocaleString("pt-BR")}</p>
            )}
          </div>

          {loading && (
            <div className="status-card loading-card">
              <Loader2 className="spinner" size={24} aria-hidden="true" />
              <div><strong>Preparando a base eleitoral</strong><span>Isso pode levar alguns segundos na primeira visita.</span></div>
            </div>
          )}

          {error && (
            <div className="status-card error-card">
              <div><strong>Não foi possível carregar a base de candidatos.</strong><span>Atualize a página para tentar novamente.</span></div>
            </div>
          )}

          {!loading && !error && visibleCandidates.length > 0 && (
            <div className="candidate-grid">
              {visibleCandidates.map((candidate, index) => <CandidateCard candidate={candidate} index={index} key={candidate.id} />)}
            </div>
          )}

          {!loading && !error && visibleCandidates.length === 0 && (
            <div className="empty-state">
              <span>Nenhuma candidatura encontrada</span>
              <p>Revise o nome digitado ou experimente remover algum filtro.</p>
              <button type="button" onClick={clearFilters}>Limpar a busca</button>
            </div>
          )}

          {!loading && !error && filteredCandidates.length > PAGE_SIZE && (
            <nav className="pagination" aria-label="Paginação dos resultados">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Página anterior"><ChevronLeft size={19} /></button>
              <span>Página <b>{page}</b> de {totalPages}</span>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} aria-label="Próxima página"><ChevronRight size={19} /></button>
            </nav>
          )}
        </section>

        <footer className="site-footer">
          <div>
            <p>Base eleitoral oficial atualizada em 20/08/2026</p>
            <span>Fonte: Dados Abertos e DivulgaCandContas — TSE.</span>
          </div>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Voltar aos filtros <ArrowUpRight size={18} aria-hidden="true" />
          </button>
        </footer>
      </section>
    </main>
  );
}
