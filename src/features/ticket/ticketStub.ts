/**
 * Placeholder for ticket lookup / sharing via your new backend.
 */

export type TicketLookupResult = {
  found: false;
  message: string;
};

export async function lookupTicket(ticketId: string): Promise<TicketLookupResult> {
  void ticketId;
  return {
    found: false,
    message: 'Ticket service will connect to your new API.',
  };
}
