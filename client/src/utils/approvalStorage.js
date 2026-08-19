export const approvalStorageKey = 'nexttask:local-approvals';

export function getStoredApprovalRequests() {
  if (typeof window === 'undefined') return [];

  try {
    const storedApprovals = JSON.parse(window.localStorage.getItem(approvalStorageKey) || '[]');
    return Array.isArray(storedApprovals) ? storedApprovals : [];
  } catch {
    return [];
  }
}

export function storeApprovalRequest(approval) {
  if (typeof window === 'undefined' || !approval) return;

  const current = getStoredApprovalRequests();
  const next = [approval, ...current.filter((item) => !(item.entityType === approval.entityType && item.entityId === approval.entityId))];
  window.localStorage.setItem(approvalStorageKey, JSON.stringify(next));
}

export function updateStoredApprovalRequest(id, updates) {
  if (typeof window === 'undefined') return;

  const next = getStoredApprovalRequests().map((approval) =>
    approval.id === id ? { ...approval, ...updates, updatedAt: new Date().toISOString() } : approval,
  );
  window.localStorage.setItem(approvalStorageKey, JSON.stringify(next));
}
