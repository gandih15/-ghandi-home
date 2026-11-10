#!/usr/bin/env python3
"""Harden + brand Ghandi.exe (Electron 22, win32):
   1) Electron fuses: no RunAsNode, no NODE_OPTIONS, no --inspect, only load the app from app.asar
   2) replace the embedded icons in place with the Ghandi icon (PNG-in-ICO, Vista/7+)
   3) replace "Electron" in the version-info strings with same-length text"""
import struct, sys, subprocess, io, os

exe, svg = sys.argv[1], sys.argv[2]
d = bytearray(open(exe, 'rb').read())

# ---------- 1) fuses ----------
S = b'dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX'
i = d.find(S); assert i > 0, 'fuse sentinel not found'
ver, n = d[i + 32], d[i + 33]
want = list(d[i + 34:i + 34 + n])
setv = {0: ord('0'), 2: ord('0'), 3: ord('0'), 5: ord('1')}  # RunAsNode, NodeOptions, NodeCliInspect, OnlyLoadAppFromAsar
for k, v in setv.items():
    if k < n and want[k] != ord('r'): want[k] = v
d[i + 34:i + 34 + n] = bytes(want)
print('fuses:', bytes(want).decode())

# ---------- PE resource walk ----------
pe = struct.unpack_from('<I', d, 0x3c)[0]
nsec = struct.unpack_from('<H', d, pe + 6)[0]; optsz = struct.unpack_from('<H', d, pe + 20)[0]
secs = []
for k in range(nsec):
    o = pe + 24 + optsz + k * 40
    vs, va, rs, rp = struct.unpack_from('<IIII', d, o + 8); secs.append((d[o:o + 8].rstrip(b'\0'), va, vs, rp, rs))
rsrc = [s for s in secs if s[0] == b'.rsrc'][0]
RVA, RAW = rsrc[1], rsrc[3]
off = lambda rva: rva - RVA + RAW

def entries(dir_off):
    named, ids = struct.unpack_from('<HH', d, RAW + dir_off + 12)
    out = []
    for k in range(named + ids):
        name, data = struct.unpack_from('<II', d, RAW + dir_off + 16 + k * 8)
        out.append((name, data))
    return out

def leaf(data):  # follow until data entry
    while data & 0x80000000:
        data = entries(data & 0x7fffffff)[0][1]
    return RAW + data  # offset of IMAGE_RESOURCE_DATA_ENTRY

res = {}
for typ, sub in entries(0):
    if typ in (3, 14, 16):
        for nid, sub2 in entries(sub & 0x7fffffff):
            res.setdefault(typ, {})[nid] = leaf(sub2)

# ---------- 2) icons ----------
def png(size):
    return subprocess.run(['node', '-e', '''
const sharp=require("/opt/npm-tools/node_modules/sharp");
sharp(process.argv[1]).resize(+process.argv[2],+process.argv[2]).png({compressionLevel:9,palette:+process.argv[2]<=48}).toBuffer().then(b=>process.stdout.write(b));''', svg, str(size)], capture_output=True, check=True).stdout

if 14 in res and 3 in res:
    for gid, ge in res[14].items():
        grva, gsize = struct.unpack_from('<II', d, ge)
        g = off(grva); cnt = struct.unpack_from('<H', d, g + 4)[0]
        for k in range(cnt):
            e = g + 6 + k * 14
            w, h = d[e] or 256, d[e + 1] or 256
            iid = struct.unpack_from('<H', d, e + 12)[0]
            de = res[3].get(iid)
            if de is None: continue
            irva, isize = struct.unpack_from('<II', d, de)
            img = png(w)
            if len(img) > isize:
                print('  icon %dx%d: new image too big (%d > %d) — kept original' % (w, h, len(img), isize)); continue
            o = off(irva); d[o:o + isize] = img + b'\0' * (isize - len(img))
            struct.pack_into('<I', d, de + 4, len(img))
            struct.pack_into('<HH', d, e + 4, 1, 32)          # planes, bitcount
            struct.pack_into('<I', d, e + 8, len(img))        # bytes in res
            print('  icon %dx%d replaced (%d bytes)' % (w, h, len(img)))

# ---------- 3) version strings ----------
if 16 in res:
    vrva, vsize = struct.unpack_from('<II', d, res[16][1] if 1 in res[16] else list(res[16].values())[0])
    v = off(vrva); blob = bytes(d[v:v + vsize])
    for old, new in [('Electron', 'Ghandi  '), ('GitHub, Inc.', 'Eng.M.Ali   '), ('Copyright (C) 2015 GitHub, Inc. All rights reserved.', 'Ghandi POS - Eng. Mohamed Ali - 01098811581        ')]:
        ob, nb = old.encode('utf-16-le'), new[:len(old)].ljust(len(old)).encode('utf-16-le')
        blob = blob.replace(ob, nb)
    d[v:v + vsize] = blob
    print('version strings patched')

open(exe, 'wb').write(d)
print('Ghandi.exe patched')
