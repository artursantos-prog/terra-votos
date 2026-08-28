import { reconcileOfficialSenateTicketMembers } from "../server/electionSync";

const result = await reconcileOfficialSenateTicketMembers();
console.log(JSON.stringify(result, null, 2));
