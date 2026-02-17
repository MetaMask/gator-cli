import type { Delegation } from '@metamask/smart-accounts-kit';
import { loadConfig } from '../lib/config.js';
import { getStorageClient } from '../lib/storage.js';
import type { InspectOptions } from '../types.js';

export async function inspect(opts: InspectOptions) {
  const config = loadConfig(opts.profile);
  const storageClient = getStorageClient(config, opts.profile);
  const myAddress = config.account.address;

  if (!opts.from && !opts.to) {
    console.log(`Fetching all delegations for ${myAddress}...\n`);

    const given = await storageClient.fetchDelegations(myAddress, 'GIVEN');
    const received = await storageClient.fetchDelegations(
      myAddress,
      'RECEIVED',
    );

    console.log(`Given (${given.length}):`);
    for (const d of given) {
      printDelegation(d);
    }

    console.log(`\nReceived (${received.length}):`);
    for (const d of received) {
      printDelegation(d);
    }
    return;
  }

  if (opts.from) {
    console.log(`Fetching delegations received from ${opts.from}...\n`);
    const received = await storageClient.fetchDelegations(
      myAddress,
      'RECEIVED',
    );
    const matching = received.filter(
      (d) => d.delegator.toLowerCase() === opts.from!.toLowerCase(),
    );
    console.log(`Found ${matching.length} delegation(s):`);
    for (const d of matching) {
      printDelegation(d);
    }
  }

  if (opts.to) {
    console.log(`Fetching delegations given to ${opts.to}...\n`);
    const given = await storageClient.fetchDelegations(myAddress, 'GIVEN');
    const matching = given.filter(
      (d) => d.delegate.toLowerCase() === opts.to!.toLowerCase(),
    );
    console.log(`Found ${matching.length} delegation(s):`);
    for (const d of matching) {
      printDelegation(d);
    }
  }
}

function printDelegation(d: Delegation) {
  console.log(`  ---------------------------------`);
  console.log(`  From:       ${d.delegator}`);
  console.log(`  To:         ${d.delegate}`);
  console.log(`  Authority:  ${d.authority}`);
  if (d.caveats?.length) {
    console.log(`  Caveats:    ${d.caveats.length}`);
    for (const c of d.caveats) {
      console.log(`    - ${c.enforcer} (${c.terms})`);
    }
  }
  if (d.signature) {
    console.log(`  Signed:     Yes`);
  }
}
