// ---------------------------------------------------------------------------
// Fake Store: FakeProductStockFetchSyncStateStore
// Implementação fake do sync state para testes.
// ---------------------------------------------------------------------------

export class FakeProductStockFetchSyncStateStore {
  private state = {
    id: "global",
    lastSyncAt: new Date("2000-01-01"),
  };

  async getState() {
    return this.state;
  }

  async updateLastSync(date: Date) {
    this.state = { ...this.state, lastSyncAt: date };
    return this.state;
  }
}
