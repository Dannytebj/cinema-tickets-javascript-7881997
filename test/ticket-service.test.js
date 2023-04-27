import assert from "assert";
import sinon from "sinon";
import TicketService from "../src/pairtest/TicketService.js";
import TicketPaymentService from "../src/thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../src/thirdparty/seatbooking/SeatReservationService.js";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest.js";
import { TicketTypes, TICKET_TYPE_PRICES } from "../src/pairtest/utils.js";

const mockTicketPaymentService = sinon.mock({
  makePayment: () => {},
});
const mockSeatReservationService = sinon.mock({
  reserveSeats: () => {},
});

const NUMBER_OF_ADULT_TICKETS = 5;
const NUMBER_OF_CHILD_TICKETS = 1;
const NUMBER_OF_INFANT_TICKETS = 2;

describe("TicketService", () => {
  const requestForFiveAdultTickets = new TicketTypeRequest(
    TicketTypes.ADULT,
    NUMBER_OF_ADULT_TICKETS
  );
  const requestForOneChildTickets = new TicketTypeRequest(
    TicketTypes.CHILD,
    NUMBER_OF_CHILD_TICKETS
  );
  const requestForTwoInfantTickets = new TicketTypeRequest(
    TicketTypes.INFANT,
    NUMBER_OF_INFANT_TICKETS
  );
  let ticketService;
  let validAccountId;
  let ticketRequest;
  let ticketRequest2;
  let ticketRequest3;

  describe("purchaseTickets", () => {
    beforeEach(() => {
      ticketService = new TicketService();
      ticketRequest = new TicketTypeRequest(TicketTypes.ADULT, 10);
      ticketRequest2 = new TicketTypeRequest(TicketTypes.CHILD, 5);
      ticketRequest3 = new TicketTypeRequest(TicketTypes.INFANT, 5);
      validAccountId = 1;
    });

    // afterEach(() => {
    //   ticketService = null;
    //   validAccountId = null;
    //   ticketRequest = null;
    //   ticketRequest2 = null;
    //   ticketRequest3 = null;
    // });

    it("should throw an error if accountId is not a positive integer", () => {
      assert.throws(
        () => ticketService.purchaseTickets(-1),
        /accountId must be an integer greater than 0/
      );
    });

    it("should throw an error if no ticketRequests", () => {
      assert.throws(
        () => ticketService.purchaseTickets(validAccountId),
        /Number of tickets purchased must be greater than 0/
      );
    });

    it("should throw an error if number of adult tickets is less than 1", () => {
      const ticketRequest = new TicketTypeRequest(TicketTypes.INFANT, 1);
      assert.throws(
        () => ticketService.purchaseTickets(validAccountId, ticketRequest),
        /Number of adult tickets must be greater than 0/
      );
    });

    it("should throw an error if total number of tickets purchased is greater than 20", () => {
      const ticketRequest4 = new TicketTypeRequest(TicketTypes.INFANT, 2);

      assert.throws(
        () =>
          ticketService.purchaseTickets(
            validAccountId,
            ticketRequest,
            ticketRequest2,
            ticketRequest3,
            ticketRequest4
          ),
        /Number of tickets purchased must be less than or equal to 20/
      );
    });

    it("should purchase tickets successfully", () => {
      assert.ok(() =>
        ticketService.purchaseTickets(
          validAccountId,
          ticketRequest,
          ticketRequest2,
          ticketRequest3
        )
      );
    });

    it("should call makePayment method of TicketPaymentService", () => {
      ticketService.purchaseTickets(validAccountId, ticketRequest);

      mockTicketPaymentService.expects("makePayment").once();
    });

    it("should call reserveSeats method of SeatReservationService", () => {
      ticketService.purchaseTickets(validAccountId, ticketRequest);

      mockSeatReservationService.expects("reserveSeats").once();
    });

    it("should call makePayment method with correct charge", () => {
      const ticketPaymentServiceSpy = sinon.spy(
        TicketPaymentService.prototype,
        "makePayment"
      );

      const totalAmount =
        NUMBER_OF_ADULT_TICKETS * TICKET_TYPE_PRICES[TicketTypes.ADULT] +
        NUMBER_OF_CHILD_TICKETS * TICKET_TYPE_PRICES[TicketTypes.CHILD];
      ticketService.purchaseTickets(
        validAccountId,
        requestForFiveAdultTickets,
        requestForOneChildTickets,
        requestForTwoInfantTickets
      );

      assert(
        ticketPaymentServiceSpy.calledOnceWith(validAccountId, totalAmount)
      );
    });

    it("should only reserve seats for ADULT and CHILD", () => {
      const seatReservationServiceSpy = sinon.spy(
        SeatReservationService.prototype,
        "reserveSeat"
      );

      const totalReservedtSeat =
        NUMBER_OF_ADULT_TICKETS + NUMBER_OF_CHILD_TICKETS;

      ticketService.purchaseTickets(
        validAccountId,
        requestForFiveAdultTickets,
        requestForOneChildTickets,
        requestForTwoInfantTickets
      );

      assert(
        seatReservationServiceSpy.calledOnceWith(
          validAccountId,
          totalReservedtSeat
        )
      );
    });
  });
});
