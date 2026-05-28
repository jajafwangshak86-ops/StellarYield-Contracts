import type { User, UserVaultPosition } from "../types/index.js";
import { query } from "../db/index.js";

export class UserService {
  async getUser(address: string): Promise<User | null> {
    const rows = await query<{
      id: number;
      address: string;
      kyc_verified: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      "SELECT id, address, kyc_verified, created_at, updated_at FROM users WHERE address = $1",
      [address],
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      address: row.address,
      kycVerified: row.kyc_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async upsertUser(address: string, kycVerified?: boolean): Promise<void> {
    await query(
      `INSERT INTO users (address, kyc_verified, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (address)
       DO UPDATE SET
         kyc_verified = COALESCE($2, users.kyc_verified),
         updated_at = NOW()`,
      [address, kycVerified ?? false],
    );
  }

  async getUserPortfolio(address: string): Promise<UserVaultPosition[]> {
    const rows = await query<{
      id: number;
      user_address: string;
      vault_id: number;
      shares: string;
      deposited: string;
      last_claimed_epoch: number;
      updated_at: Date;
    }>(
      `SELECT uvp.id, uvp.user_address, uvp.vault_id, uvp.shares,
              uvp.deposited, uvp.last_claimed_epoch, uvp.updated_at
       FROM user_vault_positions uvp
       WHERE uvp.user_address = $1
       ORDER BY uvp.shares DESC`,
      [address],
    );

    return rows.map((row) => ({
      id: row.id,
      userAddress: row.user_address,
      vaultId: row.vault_id,
      shares: row.shares,
      deposited: row.deposited,
      lastClaimedEpoch: row.last_claimed_epoch,
      updatedAt: row.updated_at,
    }));
  }

  async searchUsers(search: string): Promise<User[]> {
    const rows = await query<{
      id: number;
      address: string;
      kyc_verified: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      "SELECT id, address, kyc_verified, created_at, updated_at FROM users WHERE address ILIKE $1 LIMIT 20",
      [`%${search}%`],
    );

    return rows.map((row) => ({
      id: row.id,
      address: row.address,
      kycVerified: row.kyc_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async countUsers(): Promise<number> {
    const rows = await query<{ count: string }>("SELECT COUNT(*) as count FROM users");
    return parseInt(rows[0]?.count ?? "0", 10);
  }
}
