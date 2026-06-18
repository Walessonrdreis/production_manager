import { FakeOmieCustomerStore } from "./fake-omie-customer.store";
import { FakeCustomerCommandStore } from "./fake-customer-command.store";

/** Singleton compartilhado entre todas as rotas — estado persiste in-memory entre requests */
export const fakeOmieCustomerStore = new FakeOmieCustomerStore();
export const fakeCustomerCommandStore = new FakeCustomerCommandStore();
