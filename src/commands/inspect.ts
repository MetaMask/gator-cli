import type { Delegation } from '@metamask/smart-accounts-kit';
import { loadConfig } from '../lib/config.js';
import { getStorageClient } from '../lib/storage.js';
import type { InspectOptions } from '../types.js';

export async function inspect(opts: InspectOptions) {
  const config = loadConfig();
  const storageClient = getStorageClient(config);
  const myAddress = config.account.address;

  if (!opts.delegator && !opts.delegate) {
    // Show all delegations for our account
    console.log(`🐊 Fetching all delegations for ${myAddress}...\n`);

    const given = await storageClient.fetchDelegations(myAddress, 'GIVEN');
    const received = await storageClient.fetchDelegations(
      myAddress,
      'RECEIVED',
    );

    console.log(`📤 Given (${given.length}):`);
    for (const d of given) {
      printDelegation(d);
    }

    console.log(`\n📥 Received (${received.length}):`);
    for (const d of received) {
      printDelegation(d);
    }
    return;
  }

  // Filter by specific delegator or delegate
  if (opts.delegator) {
    console.log(`🐊 Fetching delegations received from ${opts.delegator}...\n`);
    const received = await storageClient.fetchDelegations(
      myAddress,
      'RECEIVED',
    );
    const matching = received.filter(
      (d) => d.delegator.toLowerCase() === opts.delegator!.toLowerCase(),
    );
    console.log(`Found ${matching.length} delegation(s):`);
    for (const d of matching) {
      printDelegation(d);
    }
  }

  if (opts.delegate) {
    console.log(`🐊 Fetching delegations given to ${opts.delegate}...\n`);
    const given = await storageClient.fetchDelegations(myAddress, 'GIVEN');
    const matching = given.filter(
      (d) => d.delegate.toLowerCase() === opts.delegate!.toLowerCase(),
    );
    console.log(`Found ${matching.length} delegation(s):`);
    for (const d of matching) {
      printDelegation(d);
    }
  }
}

function printDelegation(d: Delegation) {
  console.log(`  ─────────────────────────────`);
  console.log(`  Delegator:  ${d.delegator}`);
  console.log(`  Delegate:   ${d.delegate}`);
  console.log(`  Authority:  ${d.authority}`);
  if (d.caveats?.length) {
    console.log(`  Caveats:    ${d.caveats.length}`);
    for (const c of d.caveats) {
      console.log(`    - ${c.enforcer} (${c.terms})`);
    }
  }
  if (d.signature) {
    console.log(`  Signed:     ✅`);
  }
}
