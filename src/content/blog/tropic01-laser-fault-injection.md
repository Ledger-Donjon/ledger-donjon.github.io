---
title: "Laser Fault Injection on the TROPIC01 Open-Source Secure Element"
date: 2026-06-03
excerpt: "We used laser fault injection to bypass Ed25519 signature verification on the <mark>TROPIC01 open-source secure element</mark>, achieving arbitrary firmware execution."
draft: false
---

## Introduction

The [TROPIC01](https://tropicsquare.com/) is a secure element designed by Tropic Square with a distinctive philosophy: its hardware design (RTL) and firmware source code are publicly available.[^1] This transparency is commendable and invites third-party scrutiny, which is exactly what we did.

In this post, we describe how we used laser fault injection (LFI) to bypass the Ed25519 signature verification on the TROPIC01, enabling arbitrary firmware execution. We also discuss why, despite achieving code execution, the chip's hardware-backed secret storage proved remarkably resilient to further exploitation. We performed this work as part of a security evaluation using commercial TROPIC01 samples running bootloader v2.0.1, and worked on a Coordinated Vulnerability Disclosure with Tropic Square.

## Signature Verification

### Identifying signature verification in power consumption traces

The TROPIC01 SoC delegates all asymmetric cryptography to a dedicated coprocessor called SPECT (Secure Processor of Elliptic Curves for TROPIC01). SPECT is architecturally separate from the main RISC-V CPU: it has its own instruction set (32 general-purpose 256-bit registers, a dedicated constant ROM, and crypto-optimized instructions like `MUL25519`, `HASH`, and `REDP`), its own boot ROM, and its own updatable firmware.

When monitoring the chip's power consumption during normal operation, SPECT activity stands out clearly. The coprocessor draws noticeably less current than the CPU subsystem, and signature verification operations involve a lot of computations, and therefore produce a power consumption pattern that is very easy to identify in the oscilloscope traces.

![Normal boot power trace. The repeated lower-power activity windows (like the one centered on the 160ms mark) correspond to SPECT-assisted signature verification during boot; in the normal case we observe three such verification patterns before the device goes into idle.](/blog/tropic01-laser-fault-injection/boot.before.png)

At boot time, we observe three distinct SPECT signature verification patterns in the power trace on a normal boot. We interpret these as:

1. Vendor public key signature verification[^3]
2. CPU firmware signature verification
3. SPECT firmware signature verification

### Understanding the implementation from source

While the CPU boot ROM is not open source, the SPECT coprocessor boot ROM is. Since the signature verification is executed by SPECT, we can therefore study the exact Ed25519 verification implementation from the published source code.

The ROM for SPECT ([`boot_main.s`](https://github.com/tropicsquare/ts-spect-fw/blob/f5ec240b4d05370d1130b52ead977f25e2b75cff/src/boot_main.s)) is minimal: it reads a configuration word, checks for the `eddsa_verify` operation ID (`0x4B`), and jumps to the verification routine.

The verification itself ([`eddsa_verify.s`](https://github.com/tropicsquare/ts-spect-fw/blob/f5ec240b4d05370d1130b52ead977f25e2b75cff/src/ecc_crypto/eddsa_verify.s)) implements standard RFC 8032 Ed25519 verification:

1. Compute Q1 = S * B (scalar multiplication of the signature scalar with the base point)
2. Compute E = SHA-512(ENC(R) || ENC(A) || M) mod q (the challenge hash)
3. Compute Q2 = E * A (scalar multiplication of the challenge with the public key)
4. Compute Q = Q1 - Q2 (point subtraction)
5. Compress Q and compare with R

The final comparison is where it gets interesting from a fault injection perspective (`eddsa_verify.s`, lines 120–156):

```asm
; ==============================================================================
;   Final comparison -> ENC(R) = ENC(S.B - SHA512(R, A, M).A)
; ==============================================================================
    CMPI        r31,  0     ; Clear zero flag (r31 is for sure not 0)
.ifdef SPECT_ISA_VERSION_1
    LD          r31, ca_ffff
    SUBP        r2,  r23, r8
    CMPA        r2,  0
.endif
.ifdef SPECT_ISA_VERSION_2
    XOR         r2,  r23, r8
.endif
    BRZ         eddsa_verify_success
eddsa_verify_fail:
    MOVI        r2,  1
    ST          r2,  eddsa_verify_output_result
    JMP         set_res_word
eddsa_verify_success:
    MOVI        r2,  0xBA
    ROL8        r2,  r2
    ORI         r2,  r2,  0x11
    ROL8        r2,  r2
    ORI         r2,  r2,  0xFA
    ROL8        r2,  r2
    ORI         r2,  r2,  0xDE
    ROL8        r2,  r2
    ORI         r2,  r2,  0x0B
    ROL8        r2,  r2
    ORI         r2,  r2,  0x5E
    ROL8        r2,  r2
    ORI         r2,  r2,  0x55
    ROL8        r2,  r2
    ORI         r2,  r2,  0xED
    ST          r2,  eddsa_verify_output_result
    JMP         set_res_word
```

On ISA v2, the compressed points R and Q are XORed together. If the result is zero (points are equal), the branch `BRZ eddsa_verify_success` is taken, and the success value is constructed byte-by-byte and stored at the output. On failure, a simple `1` is stored instead.

This creates a particularly attractive target for fault injection: near the end of verification, a small number of instructions decide whether the failure value remains in place or the success value is written instead. For example, skipping the failure-path `JMP set_res_word` would allow execution to fall through into the success path.

It is worth noting that the SPECT application firmware's EdDSA *signing* routine (`eddsa_finish.s`) includes a self-verification step that performs the comparison twice as a fault injection countermeasure:

```asm
    ; Compare twice to prevent FI attempts
    CMPI        r31,  0     ; Clear zero flag
    XOR         r2,  r8,  r4
    BRNZ        eddsa_finish_fail_verify
    CMPI        r31,  0     ; Clear zero flag
    XOR         r2,  r8,  r4
    BRNZ        eddsa_finish_fail_verify
```

The boot ROM verification routine does not have this double-check.

### The firmware update chain of trust

The TROPIC01 uses a blockchain-like chained hash scheme for firmware updates, implemented in the [fw-packager](https://github.com/tropicsquare/ts-tr01-app/tree/10c1c3aff4a5b9b1c955acfdcbf78d14678fd037/fw-packager).

An update consists of a sequence of L2 protocol messages:

1. First message (`Mutable_FW_Update`, command `0xB0`): Contains a 64-byte Ed25519 signature, a 32-byte SHA-256 hash, the firmware type, header version, and firmware version.
2. Subsequent messages (`Mutable_FW_Update_Data`, command `0xB1`): Each contains a 32-byte hash, a 2-byte offset, and up to 220 bytes of firmware data.

The hash chain works as follows: each data chunk's hash field contains the SHA-256 digest of the *next* chunk. The chain is built in reverse during [packaging](https://github.com/tropicsquare/ts-tr01-app/tree/10c1c3aff4a5b9b1c955acfdcbf78d14678fd037/fw-packager) -- starting from the last chunk (whose hash field is all zeros) and working backward. The first chunk's expected hash is stored in the initial `Mutable_FW_Update` message. The Ed25519 signature in that first message covers `SHA-256(hash || type || padding || header_version || version)`.

This means the entire update image is cryptographically bound to the signature in the first message. If the signature verification passes, the bootloader accepts the first chunk and will then accept each subsequent data chunk as long as the hash chain verifies. The signature is the only asymmetric operation; all subsequent integrity checks are SHA-256 hash comparisons.

This is a smart design, which normally makes it impossible to commit any non-authentic data to non-volatile memory. However if we can fault the signature verification of this first message, we can then send the entire modified firmware image. The hash chain will verify correctly because we recompute it for our modified binary (the chain is not signed per-chunk -- only the root hash is signed in the first message).

## Laser Fault Injection

### Characterizing SPECT location with laser sensors disabled

For our initial characterization, we used samples in T1XX configuration (catalog part number TR01-C2P-T10X) that Tropic Square provided to us. Laser detectors are enabled in R-Config but not fused on in I-Config,[^2] and can therefore be disabled. This allowed us to perform initial characterization without the constraint of avoiding detection.

We exposed the silicon from the backside of the QFN package without thinning it, and used a 1064 nm laser (Alphanov PDM+) focused to a spot of approximately 5 micrometers in diameter.

![Backside infrared image of the exposed TROPIC01 die after opening the QFN package. The upper right corner is dark because we accidentally chipped the silicon there during sample preparation.](/blog/tropic01-laser-fault-injection/die-backside-ir.jpeg)

To locate where SPECT logic resides on the die, we used a systematic approach:

1. Initiate a firmware update with a valid signature
2. Fire laser pulses at various positions across the die during the signature verification window
3. Observe where the laser causes the signature verification to fail, while the rest of the chip continues operating normally

When a laser pulse hits SPECT logic during execution, it (often) corrupts the computation, causing the (otherwise valid) signature verification to fail. But the chip itself, and in particular the main CPU, does not crash -- it simply reports a verification failure and continues operating. By scanning across the die and recording which positions caused failures, we built a map of the SPECT logic location.

### Forcing signature verifications to succeed

Having located the SPECT logic, and having previously formulated the hypothesis -- from reading the open-source assembly -- that the signature verification might be vulnerable to a single fault near the end of its execution, where the final comparison and branch decision are made. We thus targeted the last ~10 microseconds of the SPECT signature verification pattern visible in the power trace, and fired a single laser pulse during that window.

![Firmware-update power trace during a successful fault attempt. The trace captures the signature-verification window for the first update message; the narrow high-amplitude power consumption peak just before the 24ms mark is caused by the laser pulse.](/blog/tropic01-laser-fault-injection/update.fault.png)

![Zoom on the same update trace around the laser pulse. The pattern we get is exactly what we expect a valid signature verification to look like.](/blog/tropic01-laser-fault-injection/update.fault.zoom.png)

It worked. By firing a pulse at the right time and position, we were able to make an invalid signature pass as valid. We do not know the exact underlying mechanism: it may be an instruction skip, corrupted data, or something else entirely. What matters for the attack is that, at this timing and position, the effect is repeatable in practice.

During the firmware update process, this means:

1. We power cycle the chip and enter MAINTENANCE mode
2. We send the `Mutable_FW_Update` message (command `0xB0`) containing our modified firmware's recomputed hash chain but with an invalid signature, while simultaneously firing the laser pulse
3. If the fault succeeds (the L2 status response is `0x01`  --  `REQUEST_OK`), we proceed to send all the data chunks

The data chunks are accepted because their hash chain is internally consistent -- we recomputed it using the same backward-chaining SHA-256 scheme that the legitimate packager uses. The only cryptographic check that needs to be bypassed is the Ed25519 signature on the first message.

### Bypassing laser detectors

All of the above was performed with all sensors disabled. Having identified working fault parameters, we switched to a fresh sample (still in the same T1XX configuration) with default R-Config (and, in particular, enabled laser detectors) to test whether the attack was still viable.

As it happens, the fault still worked on a subset of the previously identified fault positions, for the same timing and laser pulse parameters. It is additionally possible to inject faults without ever triggering an alarm.

### End-to-end arbitrary firmware execution

But loading a modified firmware is only half the battle. The signature is also verified at boot time: the bootloader authenticates the firmware before allowing it to execute. If the signature check fails (which it will, since our firmware is not signed with the vendor key), the device remains in the bootloader's MAINTENANCE/Start-up state.

On the power consumption traces, we observe four signature verification patterns (instead of the usual three on a normal boot) when the firmware signature fails. We were not able to definitively determine what the additional verification corresponds to, but we know that the second verification in this sequence is the CPU firmware check, because we can fault it and make the chip boot into our modified firmware.

![Boot-time power trace for the modified-firmware case. The second verification in this sequence is the one we targeted to make the CPU firmware check pass.](/blog/tropic01-laser-fault-injection/boot.after.png)

The key insight is that the exact same fault works at boot: the boot-time signature verification apparently uses the same SPECT code path (`eddsa_verify.s`).

The complete attack therefore requires two sequential (but otherwise independent) faults:

1. Fault during update: bypass signature verification of the first update chunk to load modified firmware into flash
2. Fault during boot: bypass signature verification of the CPU firmware image to make the chip execute our code

Without dynamic synchronization on the power consumption traces, performing both faults takes about one hour on average.

To verify successful code execution, we modified the firmware to return `HACK` (ASCII `0x4841434B`) in the first four bytes of the `GET_INFO` chip ID response. After successfully faulting both the update and the boot, we confirmed:

```
4841434b0000000000000000000000000000000001000000000000ff...
```

The first four bytes spell `HACK` -- our modified firmware is running.

## MAC-and-Destroy

### Why arbitrary code execution is not equivalent to secret recovery

Having achieved arbitrary firmware execution, a natural next step is to examine whether this enables recovery of the secrets stored on the chip. The TROPIC01 includes a hardware block called MAC-and-Destroy (MACANDD), which functions as a key-to-secret store: given the correct 32-byte input, it releases a corresponding 32-byte secret. In the Trezor Safe 7, this mechanism underpins PIN verification. The number of attempts is limited in hardware, and once the threshold is exceeded, the secret can no longer be recovered.

Critically, the CPU has no direct access to MACANDD state. The cryptographic keys used internally by the block are composed of bits from OTP fuses and a PUF (Physical Unclonable Function), assembled by dedicated key-distribution hardware, and never exposed to CPU-accessible memory. The reference data and stored secrets live in a flash partition behind a hardware firewall that the CPU cannot read or write.

In essence, even an attacker with full control over the CPU cannot read, modify, or bypass the MACANDD mechanism. The security boundary is not in firmware -- it is in silicon.

### What we tried within a limited timeframe

We gave ourselves a one-month window to explore this. Our main approach was to attempt laser fault injection on the flash access control from the CPU, trying to gain read/write access to the MACANDD backup flash region, which is normally not accessible from the CPU. Despite systematic attempts, we could not find a successful fault within the allotted time.

The MACANDD mechanism therefore seems very well designed: even a complete compromise of the CPU firmware does not immediately cascade into a compromise of user secrets. As far as we can tell, the remaining barriers are in hardware, and breaking them requires (we believe) additional, independent fault injection vulnerabilities -- which may well be feasible, but would require further effort and time.

> Following the disclosure of the above fault injection vulnerability to Tropic Square, they performed further internal security analysis of the CPU / MACANDD boundary. In doing so they found an attack vector compromising the confidentiality of the data protected by the MACANDD mechanism (from an arbitrary firmware execution primitive), and chose to communicate on it transparently, but without revealing the attack vector they found yet so as not to put users at risk until a new silicon revision is available -- see their [blogpost](https://tropicsquare.com/blogs).  
>  \
> This of course piqued our curiosity, and after Tropic Square shared the existence of an attack vector unknown to us on the MACANDD from arbitrary firmware, we returned to poking this security boundary. We were then able to find vulnerabilities which, combined, allow to completely compromise the MACANDD mechanism. However this is, to the best of our knowledge, only possible to do if an attacker is able to run arbitrary firmware on the chip in the first place (which we did thanks to the above laser fault injection). We have disclosed the full details of our findings confidentially with Tropic Square, on the off-chance that the vulnerabilities we found are not the same ones as they did, and will observe the same public disclosure timeline as Tropic Square.

## Mitigation

After we disclosed our findings confidentially to Tropic Square, they proposed disabling MAINTENANCE mode in `R-Config` as a field mitigation and sent us five production-like samples (TR01-C2P-T310) configured this way. They also provided a challenge firmware update package signed with an invalid key: the update was expected to fail at signature verification, but if we managed to install and boot it, the firmware would expose a secret through its `Get_Info_Req` handler.

Theoretically, this is a very good mitigation. Indeed, the original attack starts from MAINTENANCE mode, where firmware updates are accepted. With MAINTENANCE mode disabled, an attacker first needs to find a way to force the chip into MAINTENANCE mode despite the `R-Config` setting, before the update-signature fault can even be attempted.

Our hypothesis was that we could do this by faulting the boot-time CPU firmware signature verification in the opposite direction: not to accept an invalid firmware, but to make a valid firmware verification fail. We expected this to produce the same four-signature-verification boot pattern we observed with an invalid firmware image, and then to fall back to MAINTENANCE mode regardless of the `R-Config` setting. This hypothesis turned out to be correct in practice.

The mitigation therefore does raise the bar in exactly the intended way: the first stage of the attack, loading a modified firmware image, now requires two chained faults instead of one. The attacker must first fault boot to reach MAINTENANCE mode, then fault the update mechanism to accept the invalidly signed firmware. The success rate is therefore reduced multiplicatively. However, on our setup, the first fault was easier and faster to reproduce than expected, with a success rate close to 90% and many retry opportunities per second (because it occurs early at boot). As a result, the combined attack was slower than before the mitigation, but remained practical and could still be performed consistently in under an hour.

## Timeline

### Work timeline

- December 23, 2025: Project started
- January 26, 2026: First successful attack
- February 2026: MACANDD analysis

### Disclosure timeline

- 27th January 2026: Confidential disclosure to Tropic Square
- April 21, 2026: Mitigation samples and challenge firmware received from Tropic Square
- May 6, 2026: Mitigation test results communicated to Tropic Square
- May 7, 2026: Common agreement to disclose the findings publicly on June 3, 2026

### A note on Tropic Square's response

Tropic Square's response to our disclosure has been exemplary. They acknowledged the vulnerability promptly, engaged in substantive technical discussion, asked pertinent follow-up questions about attack complexity, and moved quickly toward a remediation plan. Their decision to support public disclosure demonstrates a genuine commitment to security transparency that is consistent with their open-source philosophy.

## Conclusion

We demonstrated a practical laser fault injection attack against the TROPIC01 secure element that bypasses Ed25519 signature verification, enabling arbitrary firmware execution.

---

*Charles Christen and Leo Benito, Ledger Donjon*

[^1]: Notable exceptions include laser detectors on the hardware side and the CPU boot ROM on the software side, both of which are proprietary.
[^2]: `R-Config` is the reversible configuration layer; `I-Config` is the irreversible one-time-programmable configuration layer. Settings present only in `R-Config` are therefore not permanent.
[^3]: In Tropic Square's terminology, the vendor key is the Ed25519 key used to sign the firmware. The corresponding public key is stored in OTP, and is signed by Tropic Square so that its authenticity and integrity can be verified.
