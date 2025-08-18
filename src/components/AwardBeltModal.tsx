'use client';

import { useState, useMemo } from 'react';
import type { BJJBelt, ProfileType } from '../types/api';
import { BeltSystemAPI } from '../lib/api';
import { useGlobalData } from '../contexts/DashboardDataContext';
import { BrowserWallet, deserializeAddress } from '@meshsdk/core';
import { Address } from '@emurgo/cardano-serialization-lib-browser';
import { Key, Zap, User, Award, X } from 'lucide-react';
import { Transaction, TransactionWitnessSet } from '@emurgo/cardano-serialization-lib-browser';

type AwardBeltModalProps = {
  isOpen: boolean;
  onClose: () => void;
  promotedByProfileId: string; // GYAssetClass of awarding practitioner (current user)
  onSuccess?: (txId: string) => void;
};

export function AwardBeltModal({ isOpen, onClose, promotedByProfileId, onSuccess }: AwardBeltModalProps) {
  const { invalidateBeltData, invalidatePromotionData } = useGlobalData();
  const [recipientId, setRecipientId] = useState('');
  const [belt, setBelt] = useState<BJJBelt>('White');
  const [achievementDate, setAchievementDate] = useState<string>(() => new Date().toISOString().replace(/\..+Z$/, 'Z'));
  const [usedAddresses, setUsedAddresses] = useState<string>('');
  const [changeAddress, setChangeAddress] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'building' | 'ready' | 'submitting' | 'success' | 'error'>('idle');
  const [txUnsigned, setTxUnsigned] = useState('');
  const [txWitness, setTxWitness] = useState('');
  const [txId, setTxId] = useState('');
  const [wallet, setWallet] = useState<BrowserWallet | null>(null);

  if (!isOpen) return null;

  function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  type AddressInfo = { hex: string; length: number };
  // Normalize user-entered address (bech32 or hex) into CBOR hex and record its length
  // Backend requires 114-character CBOR hex for addresses
  function toHexInfo(addr: string): AddressInfo {
    const trimmed = (addr || '').trim();
    if (!trimmed) return { hex: '', length: 0 };
    if (/^[0-9a-fA-F]+$/.test(trimmed)) {
      return { hex: trimmed, length: trimmed.length };
    }
    try {
      const parsed: any = deserializeAddress(trimmed);
      const hex = bytesToHex(parsed.address.to_bytes());
      return { hex, length: hex.length };
    } catch {
      try {
        const a = Address.from_bech32(trimmed);
        const hex = bytesToHex(a.to_bytes());
        return { hex, length: hex.length };
      } catch {
        return { hex: trimmed, length: trimmed.length };
      }
    }
  }

  // Connect to the first available CIP-30 wallet and prefill addresses
  async function ensureWallet() {
    if (wallet) return wallet;
    const available = await BrowserWallet.getAvailableWallets();
    if (!available.length) throw new Error('No browser wallet found');
    const w = await BrowserWallet.enable(available[0].name);
    setWallet(w);
    const used = await w.getUsedAddresses();
    const change = await w.getChangeAddress();
    setUsedAddresses(used.join('\n'));
    setChangeAddress(change);
    return w;
  }

  // Build an unsigned transaction representing a promotion action
  async function buildTx(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setTxStatus('building');
    setIsLoading(true);
    try {
      const w = await ensureWallet();
      const nid = await w.getNetworkId();
      if (nid !== 0) throw new Error('Wallet is on mainnet. Switch to testnet.');

      const usedList = usedAddresses.split(/\s|,|\n/).filter(Boolean).map(toHexInfo).filter((u) => u.length === 114).map((u) => u.hex);
      const changeInfo = toHexInfo(changeAddress);
      if (changeInfo.length !== 114) throw new Error('Change address must be 114-hex CBOR');
      const usedFinal = Array.from(new Set<string>([...usedList, changeInfo.hex])).filter(Boolean);
      if (usedFinal.length < 1) throw new Error('No valid used addresses');

      const action: { tag: 'PromoteProfileAction'; promoted_profile_id: string; promoted_by_profile_id: string; achievement_date: string; promoted_belt: BJJBelt } = {
        tag: 'PromoteProfileAction',
        promoted_profile_id: recipientId.trim(),
        promoted_by_profile_id: promotedByProfileId,
        achievement_date: achievementDate,
        promoted_belt: belt,
      };

      const interaction = {
        action,
        userAddresses: {
          usedAddresses: usedFinal,
          changeAddress: changeInfo.hex,
        },
        recipient: changeInfo.hex,
      } as const;

      console.log('PromoteProfileAction payload:', JSON.stringify(interaction, null, 2));

      // Request unsigned tx from backend using the typed interaction
      const unsigned = await BeltSystemAPI.buildTransaction(interaction);
      setTxUnsigned(unsigned);
      setTxStatus('ready');
    } catch (err: any) {
      setTxStatus('error');
      setError(err?.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }

  // Sign the previously built unsigned tx and submit it via backend
  // If wallet returns a full transaction, extract its witness set prior to submission.
  async function signAndSubmit() {
    setError('');
    setIsLoading(true);
    setTxStatus('submitting');
    try {
      const w = await ensureWallet();
      let signed = await w.signTx(txUnsigned, true);
      // Ensure witness set
      try {
        TransactionWitnessSet.from_bytes(Buffer.from(signed, 'hex'));
      } catch {
        const tx = Transaction.from_bytes(Buffer.from(signed, 'hex'));
        const ws = tx.witness_set();
        signed = Buffer.from(ws.to_bytes()).toString('hex');
      }
      setTxWitness(signed);
      const res = await BeltSystemAPI.submitTransaction({ tx_unsigned: txUnsigned, tx_wit: signed });
      setTxId(res.id);
      setTxStatus('success');
      // Invalidate relevant data to refresh across all pages
      invalidateBeltData();
      invalidatePromotionData();
      // Inform parent and close modal
      try { onSuccess && onSuccess(res.id); } catch {}
      onClose();
    } catch (err: any) {
      setTxStatus('error');
      setError(err?.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 text-gray-900">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Award Belt</h3>
                <p className="text-sm text-gray-800">Create a promotion from your profile</p>
              </div>
            </div>
            <button onClick={onClose} disabled={isLoading} className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={buildTx} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Recipient Profile ID</label>
              <input value={recipientId} onChange={(e) => setRecipientId(e.target.value)} placeholder="policyId.assetNameHex" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Belt</label>
              <select value={belt} onChange={(e) => setBelt(e.target.value as BJJBelt)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                {['White','Blue','Purple','Brown','Black','Black1','Black2','Black3','Black4','Black5','Black6','RedAndBlack','RedAndWhite','Red','Red10'].map(b=> (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Achievement Date</label>
              <input type="datetime-local" value={achievementDate.replace('Z','')} onChange={(e)=> {
                const value = e.target.value;
                if (value) {
                  const date = new Date(value);
                  if (!isNaN(date.getTime())) {
                    setAchievementDate(date.toISOString().replace(/\..+Z$/, 'Z'));
                  }
                }
              }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-700" />
            </div>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => ensureWallet().catch(err=>setError(err.message))} className="px-3 py-2 border rounded-md text-sm">{wallet ? 'Wallet Connected' : 'Connect Wallet'}</button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
            )}

            {txUnsigned && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Unsigned Transaction (hex)</label>
                <textarea value={txUnsigned} readOnly rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-mono max-h-40 text-gray-900" />
              </div>
            )}

            <div className="flex gap-3">
              {txStatus === 'ready' ? (
                <button type="button" onClick={signAndSubmit} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                  <Zap className="w-4 h-4 mr-2"/> Sign & Submit
                </button>
              ) : (
                <button type="submit" disabled={isLoading || !recipientId.trim()} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                  {isLoading ? 'Building...' : (<><Key className="w-4 h-4 mr-2"/> Build Transaction</>)}
                </button>
              )}
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
            </div>
            {txId && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">Submitted. TxId: {txId}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}


