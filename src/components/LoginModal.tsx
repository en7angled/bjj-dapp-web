'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, User, Building, Key, AlertCircle, Zap, Image as ImageIcon } from 'lucide-react';
import type { BJJBelt, ProfileType } from '../types/api';
import { BeltSystemAPI } from '../lib/api';
import { BrowserWallet, deserializeAddress } from '@meshsdk/core';
import { Address, Transaction, TransactionWitnessSet } from '@emurgo/cardano-serialization-lib-browser';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'signin' | 'create';
  onModeChange?: (mode: 'signin' | 'create') => void;
  initialUsedAddresses?: string[];
  initialChangeAddress?: string;
}

export function LoginModal({ isOpen, onClose, mode = 'signin', onModeChange, initialUsedAddresses, initialChangeAddress }: LoginModalProps) {
  const [profileId, setProfileId] = useState('');
  const [profileType, setProfileType] = useState<ProfileType>('Practitioner');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createImageUri, setCreateImageUri] = useState('');
  const [createBelt, setCreateBelt] = useState<BJJBelt>('White');
  const [usedAddresses, setUsedAddresses] = useState<string>('');
  const [changeAddress, setChangeAddress] = useState<string>('');
  const [txStatus, setTxStatus] = useState<'idle' | 'building' | 'ready' | 'submitting' | 'success' | 'error'>('idle');
  const [txUnsigned, setTxUnsigned] = useState<string>('');
  const [txWitness, setTxWitness] = useState<string>('');
  const [txId, setTxId] = useState<string>('');
  const [debugOpen, setDebugOpen] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [lastStatus, setLastStatus] = useState<number | null>(null);
  
  const { login } = useAuth();
  const [wallet, setWallet] = useState<BrowserWallet | null>(null);
  const [wallets, setWallets] = useState<{ name: string }[]>([]);

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

  function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  type AddressInfo = { hex: string; length: number; type: 'base' | 'enterprise' | 'pointer' | 'reward' | 'byron' | 'unknown' };

  function toHexInfo(addr: string): AddressInfo {
    const trimmed = addr.trim();
    if (!trimmed) return { hex: '', length: 0, type: 'unknown' };
    if (/^[0-9a-fA-F]+$/.test(trimmed)) {
      return { hex: trimmed, length: trimmed.length, type: 'unknown' };
    }
    try {
      const parsed: any = deserializeAddress(trimmed);
      const hex = bytesToHex(parsed.address.to_bytes());
      const type = (parsed.type || 'unknown') as AddressInfo['type'];
      return { hex, length: hex.length, type };
    } catch {
      try {
        // Fallback to CSL directly
        const a = Address.from_bech32(trimmed);
        const hex = bytesToHex(a.to_bytes());
        return { hex, length: hex.length, type: 'unknown' };
      } catch {
        return { hex: trimmed, length: trimmed.length, type: 'unknown' };
      }
    }
  }

  // Ensure a CIP-30 wallet is connected; returns true if connected
  async function ensureWalletConnected(): Promise<boolean> {
    if (wallet) return true;
    try {
      const available = await BrowserWallet.getAvailableWallets();
      setWallets(available);
      if (available.length === 0) {
        setError('No browser wallet found');
        return false;
      }
      const connected = await BrowserWallet.enable(available[0].name);
      setWallet(connected);
      const used = await connected.getUsedAddresses();
      const change = await connected.getChangeAddress();
      // Prefill for interactions
      setUsedAddresses(used.join('\n'));
      setChangeAddress(change);
      return true;
    } catch (e) {
      setError('Failed to connect wallet');
      return false;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signin') {
      if (!profileId.trim()) {
        setError('Profile ID is required');
        return;
      }
      // require wallet connection for sign-in
      const ok = await ensureWalletConnected();
      if (!ok) return;
      setIsLoading(true);
      try {
        await login(profileId.trim(), profileType);
        onClose();
      } catch (error) {
        setError('Login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Create profile flow using Interactions API (build-tx)
    const nameRegex = /^\p{L}+$/u; // letters only (unicode)
    if (!firstName.trim() || !nameRegex.test(firstName.trim())) {
      setError('First name is required and must contain letters only');
      return;
    }
    if (!lastName.trim() || !nameRegex.test(lastName.trim())) {
      setError('Last name is required and must contain letters only');
      return;
    }
    if (middleName.trim() && !nameRegex.test(middleName.trim())) {
      setError('Middle name must contain letters only');
      return;
    }
    if (!changeAddress.trim() || !usedAddresses.trim()) {
      setError('Addresses are required to build the transaction');
      return;
    }
    setIsLoading(true);
    setTxStatus('building');
    try {
      // Convert bech32 addresses to CBOR hex expected by backend
      const usedList = usedAddresses.split(/\s|,|\n/).filter(Boolean);
      const usedInfos = usedList.map(toHexInfo);
      const changeInfo = toHexInfo(changeAddress);
      // quick sanity: testnet mainnet mismatch usually leads to 406 at backend
      if (!wallet) {
        const ok = await ensureWalletConnected();
        if (!ok) return;
      }
      try {
        const nid = await wallet!.getNetworkId();
        if (nid !== 0) {
          setError('Your wallet is on mainnet. Please switch to testnet.');
          return;
        }
      } catch {
        // ignore
      }

      // Build debug context before request
      const lengths = usedInfos.map((u) => u.length);
      const changeLen = changeInfo.length;
      const sample = JSON.stringify({
        profileType,
        belt: profileType === 'Practitioner' ? createBelt : 'White',
        usedCount: usedInfos.length,
        usedLengths: lengths,
        usedTypes: usedInfos.map(u=>u.type),
        changeLen,
        changeType: changeInfo.type,
      }, null, 2);
      // Accept any 114-hex address (base/enterprise) for usedAddresses
      const usedCbor = usedInfos.filter((u) => u.length === 114).map(u=>u.hex);
      // Ensure change address is included among used addresses (some backends require it)
      const usedSet = new Set<string>(usedCbor);
      const changeHex = changeInfo.hex;
      if (changeInfo.length === 114) usedSet.add(changeHex);
      // Try to supplement with additional base addresses from wallet if available
      if (usedSet.size < 1 && wallet) {
        try {
          const more = await wallet.getUsedAddresses();
          for (const m of more) {
            const { hex } = toHexInfo(m);
            if (hex && hex.length === 114) usedSet.add(hex);
            if (usedSet.size >= 1) break;
          }
        } catch {
          // ignore and fall back to what we have
        }
        if (usedSet.size < 1) {
          try {
            const moreUnused = await wallet.getUnusedAddresses();
            for (const m of moreUnused) {
              const { hex } = toHexInfo(m);
              if (hex && hex.length === 114) usedSet.add(hex);
              if (usedSet.size >= 1) break;
            }
          } catch {
            // ignore
          }
        }
      }
      let usedFinal = Array.from(usedSet);
      // If none remain after filtering, fall back to using the change address as the single used address
      if (usedFinal.length < 1 && changeHex && changeHex.length === 114) {
        usedFinal = [changeHex];
      }
      const filteredInfo = JSON.stringify({ usedFilteredCount: usedFinal.length, usedFilteredLengths: usedFinal.map(u=>u.length), changeLen }, null, 2);
      setDebugInfo(`Request preview (converted):\n${sample}\nFiltered summary:\n${filteredInfo}\nFirst used (hex) sample: ${usedInfos[0]?.hex?.slice(0,32)}...\nChange (hex) sample: ${changeInfo.hex?.slice(0,32)}...`);
      if (usedFinal.length === 0) {
        setError('No valid addresses found (expected 114-hex). Please paste an addr_test… that resolves to a 114-hex CBOR address.');
        setTxStatus('error');
        return;
      }
      if (changeInfo.length !== 114) {
        setError('Change address must resolve to 114-hex CBOR.');
        setTxStatus('error');
        return;
      }

      // ISO8601 without milliseconds (some servers enforce a stricter format)
      const isoNoMs = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

      const fullName = `${firstName.trim()}${middleName.trim() ? ' ' + middleName.trim() : ''} ${lastName.trim()}`;
      const interaction = {
        action: {
          tag: 'CreateProfileWithRankAction',
          profileData: {
            name: fullName,
            description: createDescription,
            image_uri: createImageUri || 'https://via.placeholder.com/150'
          },
          profileType,
          creationDate: isoNoMs,
          belt: profileType === 'Practitioner' ? createBelt : 'White'
        },
        userAddresses: {
          usedAddresses: usedFinal,
          changeAddress: changeInfo.hex
        },
        // Optionally include a recipient; leave undefined per API unless needed
      } as const;

      console.debug('Building interaction', interaction);
      const built = await BeltSystemAPI.buildTransaction(interaction);
      setTxUnsigned(built);
      setTxStatus('ready');
    } catch (err) {
      setTxStatus('error');
      try {
        // Ky HTTPError
        // @ts-ignore
        const resp = err?.response;
        setLastStatus(resp?.status ?? null);
        const text = resp ? await resp.text() : '';
        setError(text || 'Failed to build transaction. Check addresses and try again.');
      } catch {
        setError('Failed to build transaction. Check addresses and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError('');
      setProfileId('');
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setCreateDescription('');
      setCreateImageUri('');
      setCreateBelt('White');
      setUsedAddresses('');
      setChangeAddress('');
      setTxStatus('idle');
      setTxUnsigned('');
      setTxWitness('');
      setTxId('');
      onClose();
    }
  };

  // Connect to CIP-30 wallet and prefill addresses
  async function handleConnectWallet() {
    try {
      const available = await BrowserWallet.getAvailableWallets();
      setWallets(available);
      if (available.length === 0) {
        setError('No browser wallet found');
        return;
      }
      const connected = await BrowserWallet.enable(available[0].name);
      setWallet(connected);

      const used = await connected.getUsedAddresses();
      const change = await connected.getChangeAddress();
      setUsedAddresses(used.join('\n'));
      setChangeAddress(change);
    } catch (e) {
      setError('Failed to connect wallet');
    }
  }

  // Ask wallet to sign the unsigned tx CBOR, then submit via backend
  async function signWithWalletAndSubmit() {
    if (!wallet) {
      setError('Connect a wallet first');
      return;
    }
    if (!txUnsigned) {
      setError('No unsigned transaction to sign');
      return;
    }
    setIsLoading(true);
    setTxStatus('submitting');
    try {
      // Ask wallet to sign. Some wallets ignore partial flag and return full signed tx.
      let signed: string;
      try {
        signed = await wallet.signTx(txUnsigned, true);
      } catch (err: any) {
        const msg = err?.message || String(err);
        setTxStatus('error');
        setError(`Wallet signing failed: ${msg}`);
        return;
      }
      // Ensure we send a witness set CBOR hex (map). If a full tx is returned, extract its witness set.
      let witnessHex = signed;
      try {
        // try parse as witness set first
        const _ws = TransactionWitnessSet.from_bytes(Buffer.from(signed, 'hex'));
        // success means it's already a witness set
      } catch {
        try {
          const tx = Transaction.from_bytes(Buffer.from(signed, 'hex'));
          const ws = tx.witness_set();
          witnessHex = Buffer.from(ws.to_bytes()).toString('hex');
        } catch (e) {
          setTxStatus('error');
          setError('Signed data is neither a witness set nor a transaction');
          return;
        }
      }
      // reflect computed witness into UI
      setTxWitness(witnessHex);
      try {
        const res = await BeltSystemAPI.submitTransaction({ tx_unsigned: txUnsigned, tx_wit: witnessHex });
        setTxId(res.id);
        setTxStatus('success');
        onClose();
      } catch (err: any) {
        const msg = err?.message || String(err);
        setTxStatus('error');
        setError(`Submission failed: ${msg}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  // Prefill addresses for create flow if provided
  if (mode === 'create') {
    if (initialUsedAddresses && usedAddresses === '') {
      setUsedAddresses(initialUsedAddresses.join('\n'));
    }
    if (initialChangeAddress && changeAddress === '') {
      setChangeAddress(initialChangeAddress);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                {mode === 'signin' ? <Key className="w-6 h-6 text-white" /> : <Zap className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{mode === 'signin' ? 'Sign In' : 'Create Profile'}</h3>
                <p className="text-sm text-gray-700">{mode === 'signin' ? 'Access your BJJ profile' : 'Build a transaction to create your profile'}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Debug panel toggle */}
            {txStatus === 'error' && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <div className="flex items-center justify-between">
                  <span>Request failed{lastStatus ? ` (HTTP ${lastStatus})` : ''}. <button type="button" className="underline" onClick={() => setDebugOpen((o) => !o)}>{debugOpen ? 'Hide' : 'Show'} debug</button></span>
                </div>
                {debugOpen && (
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-red-900">{debugInfo || 'No debug data yet'}</pre>
                )}
              </div>
            )}
            {/* Profile Type Selection (both modes) */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">Profile Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setProfileType('Practitioner')} className={`flex items-center justify-center space-x-2 px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${profileType === 'Practitioner' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}>
                  <User className="w-4 h-4" />
                  <span>Practitioner</span>
                </button>
                <button type="button" onClick={() => setProfileType('Organization')} className={`flex items-center justify-center space-x-2 px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${profileType === 'Organization' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}>
                  <Building className="w-4 h-4" />
                  <span>Organization</span>
                </button>
              </div>
            </div>

            {mode === 'signin' ? (
              <>
                {/* Profile ID Input */}
                <div>
                  <label htmlFor="profileId" className="block text-sm font-medium text-gray-900 mb-2">Profile ID</label>
                  <input type="text" id="profileId" value={profileId} onChange={(e) => setProfileId(e.target.value)} placeholder={profileType === 'Practitioner' ? 'Enter your practitioner ID' : 'Enter your organization ID'} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={isLoading} />
                  <p className="mt-1 text-xs text-gray-700">{profileType === 'Practitioner' ? 'This is your unique practitioner identifier' : 'This is your unique organization identifier'}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <button type="button" onClick={ensureWalletConnected} className="px-3 py-2 border rounded-md text-sm">
                    {wallet ? 'Wallet Connected' : 'Connect Wallet'}
                  </button>
                   {wallets.length > 0 && !wallet && (
                    <span className="text-xs text-gray-600">Detected {wallets.length} wallet(s)</span>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Create Profile Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">First Name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name (letters only)" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Middle Name (optional)</label>
                  <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Middle name (letters only)" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Last Name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name (letters only)" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                  <textarea value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} rows={3} placeholder="Tell us about this profile" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-600" />
                </div>
                {profileType === 'Practitioner' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Starting Belt</label>
                    <select value={createBelt} onChange={(e) => setCreateBelt(e.target.value as BJJBelt)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900">
                      {['White','Blue','Purple','Brown','Black'].map((b) => (<option key={b} value={b}>{b}</option>))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Image URI (optional)</label>
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                    <input type="url" value={createImageUri} onChange={(e) => setCreateImageUri(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-600" />
                  </div>
                </div>
                <div className="p-3 bg-gray-100 border border-gray-300 rounded-md">
                  <p className="text-xs text-gray-900">Provide the addresses from your wallet to build the transaction.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Used Addresses (one per line)</label>
                  <textarea value={usedAddresses} onChange={(e) => setUsedAddresses(e.target.value)} rows={3} placeholder="Paste used addresses (CBOR hex), one per line" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Change Address</label>
                  <input type="text" value={changeAddress} onChange={(e) => setChangeAddress(e.target.value)} placeholder="Paste change address (CBOR hex)" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-600" />
                </div>

                {txStatus !== 'idle' && (
                  <div className={`p-3 rounded-md ${txStatus === 'error' ? 'bg-red-50 text-red-700' : txStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                    <div className="flex items-center">
                      {txStatus === 'building' && <Key className="h-4 w-4 mr-2" />}
                      {txStatus === 'ready' && <Zap className="h-4 w-4 mr-2" />}
                      {txStatus === 'submitting' && <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />}
                      {txStatus === 'success' && <div className="h-4 w-4 mr-2">✓</div>}
                      {txStatus === 'error' && <div className="h-4 w-4 mr-2">✗</div>}
                      <span className="text-sm font-medium">
                        {txStatus === 'building' && 'Building transaction...'}
                        {txStatus === 'ready' && 'Transaction built. Provide a witness and submit.'}
                        {txStatus === 'submitting' && 'Submitting transaction...'}
                        {txStatus === 'success' && `Submitted! TxId: ${txId}`}
                        {txStatus === 'error' && 'Error occurred'}
                      </span>
                    </div>
                  </div>
                )}

                {txUnsigned && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-900">Unsigned Transaction (hex)</label>
                      <button type="button" onClick={() => copyToClipboard(txUnsigned)} className="text-xs text-blue-600 hover:text-blue-500">Copy</button>
                    </div>
                    <textarea value={txUnsigned} readOnly rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs font-mono leading-snug whitespace-pre-wrap break-all overflow-auto max-h-48 text-gray-900" />
                    <div className="mt-2 flex items-center justify-between">
                      <button type="button" onClick={handleConnectWallet} className="px-3 py-2 border rounded-md text-sm">{wallet ? 'Wallet Connected' : 'Connect Wallet'}</button>
                       {wallets.length > 0 && !wallet && <span className="text-xs text-gray-600">Detected {wallets.length} wallet(s)</span>}
                    </div>
                  </div>
                )}

                {txStatus === 'ready' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-900">Transaction Witness (hex)</label>
                      <button type="button" onClick={() => copyToClipboard(txWitness)} className="text-xs text-blue-600 hover:text-blue-500">Copy</button>
                    </div>
                    <textarea value={txWitness} onChange={(e) => setTxWitness(e.target.value)} rows={5} placeholder="Paste signed witness (hex)" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs font-mono leading-snug whitespace-pre-wrap break-all overflow-auto max-h-48 text-gray-900 placeholder:text-gray-600" />
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={signWithWalletAndSubmit} className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                        <Zap className="w-4 h-4 mr-2" /> Sign with Wallet & Submit
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <div className="flex space-x-3">
              <button type="button" onClick={handleClose} disabled={isLoading} className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">Cancel</button>
              {mode === 'signin' ? (
                <button type="submit" disabled={isLoading || !profileId.trim()} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Signing In...</>) : (<><Key className="w-4 h-4 mr-2" /> Sign In</>)}
                </button>
              ) : txStatus === 'ready' ? (
                <button type="button" onClick={async () => {
                  if (!txUnsigned || !txWitness.trim()) {
                    setError('Unsigned tx and witness are required');
                    return;
                  }
                  setError('');
                  setIsLoading(true);
                  setTxStatus('submitting');
                  try {
                    const result = await BeltSystemAPI.submitTransaction({ tx_unsigned: txUnsigned, tx_wit: txWitness });
                    setTxId(result.id);
                    setTxStatus('success');
                  } catch (err) {
                    setTxStatus('error');
                    setError('Failed to submit transaction');
                  } finally {
                    setIsLoading(false);
                  }
                }} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  <Zap className="w-4 h-4 mr-2" /> Submit Transaction
                </button>
              ) : (
                <button type="submit" disabled={isLoading || !firstName.trim() || !lastName.trim()} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                  {isLoading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Building...</>) : (<><Key className="w-4 h-4 mr-2" /> Build Transaction</>)}
                </button>
              )}
            </div>

            {/* Toggle text removed; auto-sign-in is handled by wallet profile detection */}
          </form>
        </div>
      </div>
    </div>
  );
}
