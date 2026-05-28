import type { Epoch } from "../types/index.js";
import { query } from "../db/index.js";

export class YieldService {
  async getVaultEpochs(contractId: string): Promise<Epoch[]> {
    const rows = await query<{
      id: number;
      vault_id: number;
      epoch: number;
      yield_amount: string;
      total_shares: string;
      distributed_at: Date | null;
    }>(
      `SELECT e.id, e.vault_id, e.epoch, e.yield_amount, e.total_shares, e.distributed_at
       FROM epochs e
       JOIN vaults v ON e.vault_id = v.id
       WHERE v.contract_id = $1
       ORDER BY e.epoch ASC`,
      [contractId],
    );

    return rows.map((row) => ({
      id: row.id,
      vaultId: row.vault_id,
      epoch: row.epoch,
      yieldAmount: row.yield_amount,
      totalShares: row.total_shares,
      distributedAt: row.distributed_at,
    }));
  }

  async getUserPendingYield(
    _contractId: string,
    _userAddress: string,
  ): Promise<{ pendingYield: string; epochs: number[] }> {
    throw new Error("Not implemented");
  }

  async recordEpoch(
    _vaultId: number,
    _epoch: number,
    _yieldAmount: string,
    _totalShares: string,
  ): Promise<void> {
    throw new Error("Not implemented");
  }
}
