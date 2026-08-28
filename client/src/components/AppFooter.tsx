import FeedbackDialog from "./FeedbackDialog";
import MethodologyDialog from "./MethodologyDialog";

export default function AppFooter() {
  return (
    <footer className="mt-16 border-t border-[#eee7e1] bg-[#fffaf7]">
      <div className="container py-8 text-xs text-[#746e68]">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[#eee7e1] pb-6">
          <div className="space-y-2">
            <p>Dados oficiais do Tribunal Superior Eleitoral.</p>
            <MethodologyDialog />
          </div>
          <div className="font-editorial text-lg font-bold text-[#ff5a00]">terra</div>
        </div>
        <div className="flex justify-center pt-6">
          <FeedbackDialog />
        </div>
      </div>
    </footer>
  );
}
