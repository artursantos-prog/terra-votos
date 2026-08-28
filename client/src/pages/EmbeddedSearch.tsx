import CandidateSearch from "@/components/CandidateSearch";

type EmbeddedSearchProps = {
  category: "em_disputa" | "fora_da_disputa";
};

/** Página pública para iframe: usa as mesmas consultas e a mesma base oficial da busca publicada. */
export default function EmbeddedSearch({ category }: EmbeddedSearchProps) {
  return <CandidateSearch category={category} embedded />;
}
