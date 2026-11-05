"use server";

import {
  getVaultsFromDb as _getVaultsFromDb,
  getVaultByIdFromDb as _getVaultByIdFromDb,
  createVaultAction as _createVaultAction,
  updateVaultAction as _updateVaultAction,
  deleteVaultAction as _deleteVaultAction,
  addVaultFileAction as _addVaultFileAction,
  getActivitiesFromDb as _getActivitiesFromDb,
  getCheckInStatusFromDb as _getCheckInStatusFromDb,
  performCheckInAction as _performCheckInAction,
  resetCheckInDemoAction as _resetCheckInDemoAction,
  type CheckInState,
  type CreateVaultActionInput,
  type UpdateVaultActionInput,
} from "@/lib/actions/vault-actions";
import {
  getRecipientsFromDb as _getRecipientsFromDb,
  getRecipientByIdFromDb as _getRecipientByIdFromDb,
  createRecipientAction as _createRecipientAction,
  updateRecipientAction as _updateRecipientAction,
  deleteRecipientAction as _deleteRecipientAction,
  type RecipientWithVaults,
} from "@/lib/actions/recipient-actions";
import type { VaultItem } from "@/components/VaultCard";
import type { ActivityItem } from "@/components/ActivityList";

export type {
  CheckInState,
  CreateVaultActionInput,
  UpdateVaultActionInput,
  RecipientWithVaults,
};

export async function getVaultsFromDb(): Promise<VaultItem[]> {
  return _getVaultsFromDb();
}

export async function getVaultByIdFromDb(id: string): Promise<VaultItem | null> {
  return _getVaultByIdFromDb(id);
}

export async function createVaultAction(input: CreateVaultActionInput) {
  return _createVaultAction(input);
}

export async function updateVaultAction(id: string, input: UpdateVaultActionInput) {
  return _updateVaultAction(id, input);
}

export async function deleteVaultAction(id: string) {
  return _deleteVaultAction(id);
}

export async function addVaultFileAction(
  vaultId: string,
  input: { name: string; size: string; cipher?: string }
) {
  return _addVaultFileAction(vaultId, input);
}

export async function getRecipientsFromDb(): Promise<RecipientWithVaults[]> {
  return _getRecipientsFromDb();
}

export async function getRecipientByIdFromDb(id: string): Promise<RecipientWithVaults | null> {
  return _getRecipientByIdFromDb(id);
}

export async function createRecipientAction(input: {
  name: string;
  role: string;
  email: string;
}) {
  return _createRecipientAction(input);
}

export async function updateRecipientAction(
  id: string,
  input: {
    name: string;
    role: string;
    email: string;
  }
) {
  return _updateRecipientAction(id, input);
}

export async function deleteRecipientAction(id: string) {
  return _deleteRecipientAction(id);
}

export async function getActivitiesFromDb(): Promise<ActivityItem[]> {
  return _getActivitiesFromDb();
}

export async function getCheckInStatusFromDb(): Promise<CheckInState> {
  return _getCheckInStatusFromDb();
}

export async function performCheckInAction() {
  return _performCheckInAction();
}

export async function resetCheckInDemoAction() {
  return _resetCheckInDemoAction();
}
