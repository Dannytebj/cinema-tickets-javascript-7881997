export const TicketTypes= {
  INFANT: "INFANT",
  CHILD: "CHILD",
  ADULT: "ADULT",
};

export const TICKET_TYPE_PRICES = {
  [TicketTypes.INFANT]: 0,
  [TicketTypes.CHILD]: 10,
  [TicketTypes.ADULT]: 20,
};

export const DEFAULT_TICKET_NUMBER = {
  [TicketTypes.INFANT]: 0,
  [TicketTypes.CHILD]: 0,
  [TicketTypes.ADULT]: 0,
};
