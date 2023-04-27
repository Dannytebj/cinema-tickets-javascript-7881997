import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../thirdparty/seatbooking/SeatReservationService.js";
import {TicketTypes, TICKET_TYPE_PRICES, DEFAULT_TICKET_NUMBER} from "./utils.js";


export default class TicketService {
  #ticketPaymentService;
  #seatReservationService;

  constructor() {
    // Initialize services
    this.#ticketPaymentService = new TicketPaymentService();
    this.#seatReservationService = new SeatReservationService();
  }

  /**
   * Should only have private methods other than the one below.
   */

  purchaseTickets(accountId, ...ticketTypeRequests) {
    // validate accountId
    if (!Number.isInteger(accountId) || accountId < 0) {
      throw new InvalidPurchaseException(
        "accountId must be an integer greater than 0"
      );
    }

    const ticketTypeRequestsArray = [...ticketTypeRequests];

    // validate ticketTypeRequests
    if (ticketTypeRequestsArray.length === 0) {
      throw new InvalidPurchaseException(
        "Number of tickets purchased must be greater than 0"
      );
    }

    const numberOfTicketsByType =
      this.#getNumberOfTicketsPurchasedByType(ticketTypeRequestsArray);

    if (
      (numberOfTicketsByType[TicketTypes.INFANT] > 0 ||
        numberOfTicketsByType[TicketTypes.CHILD] > 0) &&
      numberOfTicketsByType[TicketTypes.ADULT] < 1
    ) {
      throw new InvalidPurchaseException(
        "Number of adult tickets must be greater than 0"
      );
    }

    const totalNumberOfTicketRequests = this.#getTotalNumberOfTicketRequests(
      numberOfTicketsByType
    );

    if (totalNumberOfTicketRequests > 20) {
      throw new InvalidPurchaseException(
        "Number of tickets purchased must be less than or equal to 20"
      );
    }
    const totalAmountToPay = this.#getTotalAmountToPay(numberOfTicketsByType);

    // Make payments for tickets
    this.#ticketPaymentService.makePayment(accountId, totalAmountToPay);

    const numberOfSeatsToBeReserved = this.#getNumberOfSeatsToBeReserved(
      numberOfTicketsByType
    );

    // reserve seats
    this.#seatReservationService.reserveSeat(accountId, numberOfSeatsToBeReserved);
  }

  /**
   *
   * @param {*} ticketTypeRequests
   * @returns {object} number of tickets purchased by type
   */
  #getNumberOfTicketsPurchasedByType(ticketTypeRequests) {
    const numberOfTicketsPurchasedByType = Object.assign({}, DEFAULT_TICKET_NUMBER);

    ticketTypeRequests.forEach((ticketTypeRequest) => {
      if (ticketTypeRequest instanceof TicketTypeRequest) {
        const ticketType = ticketTypeRequest.getTicketType();
        const noOfTickets = ticketTypeRequest.getNoOfTickets();

        numberOfTicketsPurchasedByType[ticketType] += noOfTickets;
      }
    });
    return numberOfTicketsPurchasedByType;
  }

  /**
   *
   * @param {*} numberOfTicketsByType
   * @returns {number} total number of tickets purchased
   */
  #getTotalNumberOfTicketRequests(numberOfTicketsByType) {
    return Object.values(numberOfTicketsByType).reduce(
      (total, current) => total + current,
      0
    );
  }

  /**
   *
   * @param {*} numberOfTicketsByType
   * @returns {number} total amount to pay
   */
  #getTotalAmountToPay(numberOfTicketsByType) {
    return Object.entries(numberOfTicketsByType).reduce(
      (total, [ticketType, numberOfTickets]) =>
        total + numberOfTickets * TICKET_TYPE_PRICES[ticketType],
      0
    );
  }

  /**
   *
   * @param {*} numberOfTicketsByType
   * @returns {number} number of seats to be reserved
   */
  #getNumberOfSeatsToBeReserved(numberOfTicketsByType) {
    return Object.entries(numberOfTicketsByType).reduce(
      (total, [ticketType, numberOfTickets]) => {
        let numberOfSeatsToBeReserved = 0;
        if (ticketType !== TicketTypes.INFANT) {
          numberOfSeatsToBeReserved = total + numberOfTickets;
        }
        return numberOfSeatsToBeReserved;
      },
      0
    );
  }
}

