export function getTicketHeading(principalOffice: string) {
  return principalOffice === "SENADOR" ? "Suplentes" : "Vice";
}

export function getTicketMemberRole(principalOffice: string, memberOffice: string) {
  return principalOffice === "SENADOR" ? memberOffice.toLocaleLowerCase("pt-BR") : "Vice";
}
