import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db/index.js", () => ({ query: vi.fn() }));

async function getTestContext() {
  const { query } = await import("../../db/index.js");
  const { UserService } = await import("../../services/user.js");
  const service = new UserService();
  return { query: query as ReturnType<typeof vi.fn>, service };
}

describe("UserService Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUser", () => {
    it("returns a user when address exists", async () => {
      const { query, service } = await getTestContext();
      query.mockResolvedValue([
        { id: 1, address: "GABCDEF", kyc_verified: true, created_at: new Date(), updated_at: new Date() },
      ]);

      const user = await service.getUser("GABCDEF");
      expect(user).not.toBeNull();
      expect(user!.address).toBe("GABCDEF");
      expect(user!.kycVerified).toBe(true);
    });

    it("returns null when address does not exist", async () => {
      const { query, service } = await getTestContext();
      query.mockResolvedValue([]);

      const user = await service.getUser("GUNKNOWN");
      expect(user).toBeNull();
    });
  });

  describe("getUserPortfolio", () => {
    it("returns an array of positions", async () => {
      const { query, service } = await getTestContext();
      query.mockResolvedValue([
        {
          id: 1,
          user_address: "GABCDEF",
          vault_id: 10,
          shares: "1000",
          deposited: "500",
          last_claimed_epoch: 2,
          updated_at: new Date(),
        },
      ]);

      const portfolio = await service.getUserPortfolio("GABCDEF");
      expect(Array.isArray(portfolio)).toBe(true);
      expect(portfolio.length).toBe(1);
      expect(portfolio[0].userAddress).toBe("GABCDEF");
      expect(portfolio[0].shares).toBe("1000");
    });

    it("returns empty array when user has no positions", async () => {
      const { query, service } = await getTestContext();
      query.mockResolvedValue([]);

      const portfolio = await service.getUserPortfolio("GEMPTY");
      expect(Array.isArray(portfolio)).toBe(true);
      expect(portfolio.length).toBe(0);
    });
  });

  describe("searchUsers", () => {
    it("returns matching users by partial address", async () => {
      const { query, service } = await getTestContext();
      query.mockResolvedValue([
        { id: 1, address: "GXYZ123", kyc_verified: false, created_at: new Date(), updated_at: new Date() },
        { id: 2, address: "GXYZ456", kyc_verified: true, created_at: new Date(), updated_at: new Date() },
      ]);

      const users = await service.searchUsers("GXYZ");
      expect(users.length).toBe(2);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("ILIKE"),
        ["%GXYZ%"],
      );
    });

    it("returns empty array when no matches", async () => {
      const { query, service } = await getTestContext();
      query.mockResolvedValue([]);

      const users = await service.searchUsers("NOMATCH");
      expect(users.length).toBe(0);
    });
  });

  describe("countUsers", () => {
    it("returns the total user count", async () => {
      const { query, service } = await getTestContext();
      query.mockResolvedValue([{ count: "5" }]);

      const count = await service.countUsers();
      expect(count).toBe(5);
    });

    it("returns 0 when no users exist", async () => {
      const { query, service } = await getTestContext();
      query.mockResolvedValue([{ count: "0" }]);

      const count = await service.countUsers();
      expect(count).toBe(0);
    });
  });
});

describe("User Controller - search validation", () => {
  it("searchUsers requires at least 4 characters", async () => {
    const { query } = await import("../../db/index.js");

    const { searchUsers } = await import("./users.js");
    const req = { query: { search: "AB" } } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    await searchUsers(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "ValidationError" }),
    );
    expect(query).not.toHaveBeenCalled();
  });
});
