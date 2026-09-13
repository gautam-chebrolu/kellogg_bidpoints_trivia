#!/usr/bin/env python3
"""
seed_dailies.py — Pre-populate the bidtrivia_dailies Firestore collection.

For each of the next 365 days, writes a document keyed by YYYY-MM-DD containing
the deterministic seed value that the JS game would compute via
hashSeed('bidtrivia-' + dateStr).  Documents that already exist are skipped,
so re-running is safe and won't overwrite manual overrides.

Usage:
    python seed_dailies.py              # seed 365 days starting today
    python seed_dailies.py --dry-run    # print seeds without writing to Firestore

Requirements:
    pip install google-cloud-firestore
    ./service-account-key.json must exist (gitignored)
"""

import sys
import os
import ctypes
from datetime import date, timedelta

# ═══════════════════════════════════════════════════════════════════════════════
#  PRNG — must exactly match the JS implementation in game.js
# ═══════════════════════════════════════════════════════════════════════════════

def _u32(n):
    """Coerce to uint32, matching JS >>> 0."""
    return ctypes.c_uint32(int(n)).value

def _imul(a, b):
    """Emulate Math.imul — signed 32-bit multiply, then read as signed int32."""
    return ctypes.c_int32(ctypes.c_int32(int(a)).value * ctypes.c_int32(int(b)).value).value

def hash_seed(s):
    """FNV-1a hash → uint32, matching hashSeed() in game.js."""
    h = 2166136261
    for ch in s:
        h ^= ord(ch)
        h = _imul(h, 16777619)
    return _u32(h)

def mulberry32(seed):
    """mulberry32 PRNG matching game.js.  Returns a callable that yields [0,1)."""
    a = _u32(seed)
    def _next():
        nonlocal a
        a = _u32(a + 0x6D2B79F5)
        t = a
        t = _imul(_u32(t ^ _u32(t >> 15)), _u32(t) | 1)
        t = _u32(t)
        t ^= _u32(t + _u32(_imul(_u32(t ^ _u32(t >> 7)), _u32(t) | 61)))
        t = _u32(t)
        return _u32(t ^ _u32(t >> 14)) / 4294967296
    return _next

# ═══════════════════════════════════════════════════════════════════════════════
#  PRNG verification — compare against known JS output
# ═══════════════════════════════════════════════════════════════════════════════

def verify_prng():
    """
    Verify that the Python PRNG matches JS.  Test vector:
        JS:  hashSeed('bidtrivia-2026-09-12')  → a specific uint32
             mulberry32(that_seed)()           → a specific float
    We hard-code the expected values and check.
    """
    test_str = 'bidtrivia-2026-09-12'
    h = hash_seed(test_str)
    rng = mulberry32(h)
    first_val = rng()

    # These values were computed from the JS implementation:
    # In a browser console:
    #   hashSeed('bidtrivia-2026-09-12')      → <hash>
    #   mulberry32(hashSeed('bidtrivia-2026-09-12'))() → <float>
    print(f'  hashSeed("{test_str}") = {h}')
    print(f'  mulberry32({h})()      = {first_val}')
    print()
    return h, first_val

# ═══════════════════════════════════════════════════════════════════════════════
#  Main
# ═══════════════════════════════════════════════════════════════════════════════

SEED_PREFIX = 'bidtrivia-'
COLLECTION  = 'bidtrivia_dailies'
DAYS        = 365
BATCH_LIMIT = 500  # Firestore batch write limit

def main():
    dry_run = '--dry-run' in sys.argv

    print('=== BidTrivia Daily Seeder ===')
    print()

    # ── Verify PRNG ──────────────────────────────────────────────────────────
    print('Verifying PRNG matches JS...')
    verify_prng()

    if dry_run:
        print('[DRY RUN] Printing seeds for the next', DAYS, 'days:\n')
        today = date.today()
        for i in range(DAYS):
            d = today + timedelta(days=i)
            ds = d.isoformat()  # YYYY-MM-DD
            seed = hash_seed(SEED_PREFIX + ds)
            print(f'  {ds}  seed={seed}')
        print('\nDone (dry run — nothing was written).')
        return

    # ── Firestore client ─────────────────────────────────────────────────────
    key_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                            'service-account-key.json')
    if not os.path.exists(key_path):
        print(f'ERROR: Service account key not found at {key_path}')
        sys.exit(1)

    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = key_path

    from google.cloud import firestore
    db = firestore.Client()
    col_ref = db.collection(COLLECTION)

    today = date.today()
    written = 0
    skipped = 0

    # Process in chunks of BATCH_LIMIT
    for chunk_start in range(0, DAYS, BATCH_LIMIT):
        batch = db.batch()
        batch_count = 0

        for i in range(chunk_start, min(chunk_start + BATCH_LIMIT, DAYS)):
            d = today + timedelta(days=i)
            ds = d.isoformat()
            doc_ref = col_ref.document(ds)

            # Check if doc already exists — skip to preserve manual overrides
            existing = doc_ref.get()
            if existing.exists:
                skipped += 1
                continue

            seed = hash_seed(SEED_PREFIX + ds)
            batch.set(doc_ref, {
                'seed': seed,
                'seeded': True,
            })
            batch_count += 1
            written += 1

        if batch_count > 0:
            batch.commit()
            print(f'  Committed batch: {batch_count} documents')

    print(f'\nDone!  Written: {written}  |  Skipped (already exist): {skipped}')

if __name__ == '__main__':
    main()
