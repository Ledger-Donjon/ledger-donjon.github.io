---
title: "Photon-Emission-Guided Laser Fault Injection Enables RP2350 Secure Debug"
date: 2026-09-18
excerpt: "Differential photon-emission microscopy localized debug enable register activity and narrow the laser search before SWD-guided injection set the two bits required to restore Secure debug on a RP2350 A4."
image: /blog/rp2350-secure-debug-laser-fault-injection/cover.png
draft: false
---

## TL;DR

— Photon-emission microscopy allowed us to locate a register responsible for the enabling of debug features on the Raspberry Pi microcontroller.

— Laser Pulses at two nearby positions then restored debugger access to the chip's Secure world, even though debug had been permanently disabled.

— Using that access after a rescue reset, we recovered a secret from one-time-programmable memory. The reset halted the chip before firmware could apply its runtime lock, so the page stayed Secure-readable.

— The attack requires physical access, destructive preparation, and approximately **$250,000** of laboratory equipment.

## The RP2350 security model

The RP2350 is Raspberry Pi's dual-core microcontroller : each processor socket can select either an Arm Cortex-M33 or a RISC-V Hazard3 core at boot. Its hardware security features include :
- Secure boot, which authenticates signed firmware against public-key fingerprints provisioned in One-Time Programmable memory (OTP)
- The Armv8-M TrustZone, which separates Secure and Non-secure execution states
- Permanent debug-disable settings
- Glitch detectors intended to detect timing disturbances caused by clock or supply manipulation

Raspberry Pi has actively invited researchers to evaluate these protections through its RP2350 Hacking Challenges. The first challenge ran from August to December 2024 against the original chip. After several findings were addressed, Raspberry Pi released the A4 revision—the version we tested.

The permanent security configuration and boot public key fingerprints are stored in **one-time-programmable (OTP) memory**: each bit can be flipped from `0` to `1` once and never back, so whatever is written there lasts for the lifetime of the chip.

OTP is organised into 128-byte pages protected by two persistent, or **hard**, lock rows: For page n, `PAGEn_LOCK0` configures optional read and write keys and the behaviour when no key is entered, while `PAGEn_LOCK1` contains the hardware-enforced `LOCK_S` and `LOCK_NS` permissions. Those states can advance from read-write to read-only or inaccessible but cannot become more permissive.

The OTP subsystem uses redundant encodings for security-related fields: critical flags are "encoded with a three-of-eight vote across eight consecutive OTP rows", and OTP lock bits are "triple-redundant with a majority vote", according to the [RP2350 datasheet](https://pip.raspberrypi.com/documents/RP-008373-DS-rp2350-datasheet.pdf).

At an OTP reset, the persistent `LOCK_S` and `LOCK_NS` values initialise a per-page **runtime lock**, also called a soft lock. Firmware can tighten this lock until the next OTP reset, but cannot loosen it. The runtime change does not survive that reset.

An external debugger communicates with the RP2350 through Arm's **Serial Wire Debug (SWD)** interface. Requests first reach the Serial Wire Debug Port (SW-DP) and are then routed to access ports. In the Cortex-M33 configuration used here, each core has a memory access port (Mem-AP) connected to its system bus; an enabled Mem-AP lets the debugger read and write permitted memory and peripherals. A separate always-on access port, the RP-AP, exposes a small set of reset and recovery controls.

**Secure debug** refers to Mem-AP access with Secure attribution. The debugger can then transact with Secure memory-mapped resources the access-control logic permits, and halt or inspect a core running in the Secure state.

The permanent `CRIT1.DEBUG_DISABLE` flag is intended to close this path. When set, it drives the enable signals for both cores' Mem-APs to zero, which "prevents the APs from performing any bus accesses at all", and disables the factory-test JTAG interface and the RISC-V debug module's access port. The SW-DP and RP-AP still respond, but neither core Mem-AP can access the system bus.

There is, however, an override : the memory-mapped `DEBUGEN` register lets Secure software re-enable each core's Mem-AP and, separately, Secure accesses through it. The datasheet states that `DEBUG_DISABLE` "can be fully overridden by setting all bits of this register".

This critical override in the enforcement chain is what made the debug interface our target. Gaining access to Secure debug on a Mem-AP is a general-purpose primitive to read and write Secure memory, halt and single-step a core, and inspect its registers. Whether that register could be set by a fault is the question the rest of this post answers.

## Experimental setup

### Target configuration

Raspberry Pi's RP2350 Hacking Challenge asked participants to extract a 128-bit secret stored in OTP[^1]. At startup, the signed challenge firmware ensures that page 48 has the expected persistent lock, then applies a runtime lock that denies both Secure and Non-secure access to the secret until the next OTP reset.

We replicated this vendor-defined configuration on our own revision **A4** device:

- Programmed the SHA-256 fingerprint of our public key into `BOOTKEY0`
- Set `BOOT_FLAGS1.KEY_VALID` to `0x1` and `BOOT_FLAGS1.KEY_INVALID` to `0xe`
- Enabled secure boot (`CRIT1.SECURE_BOOT_ENABLE = 1`)
- Permanently disabled debug (`CRIT1.DEBUG_DISABLE = 1`)
- Enabled the glitch detectors at maximum sensitivity (`CRIT1.GLITCH_DETECTOR_ENABLE = 1`, `CRIT1.GLITCH_DETECTOR_SENS = 3`)
- Configured the persistent locks for pages 1 and 2 according to the challenge configuration
- Set the page 48 persistent lock to `PAGE48_LOCK1 = 0x3c3c3c`, which denied Non-secure access (`LOCK_NS = INACCESSIBLE`) while retaining Secure read-write access (`LOCK_S = READ_WRITE`)

Enabling secure boot permits only the Cortex-M33 cores, so both processor sockets used Arm for these experiments.

### Sample preparation and bench

The device was **backside decapsulated**, so that infrared light reaches the transistors through the silicon substrate rather than being blocked by the metal layers on the front. The chip was then soldered back onto a daughterboard connected to [Scaffold](https://github.com/Ledger-Donjon/scaffold), Ledger Donjon's open source platform for driving and monitoring devices under test.


![Backside-decapsulated RP2350 mounted on the analysis daughterboard. The copper wire restores the GND connection lost with the removal of the lead frame on the backside of the chip.[^3]](/blog/rp2350-secure-debug-laser-fault-injection/backside_decap.jpg)


![Experimental bench used for the attack](/blog/rp2350-secure-debug-laser-fault-injection/bench.jpg)


## `DEBUGEN`: overriding permanent debug disable

`DEBUGEN` has five functional bits:


| Bit | Name           | Effect                                                                                                     |
| --- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| 0   | `PROC0`        | Enable core 0's memory access port                                                                         |
| 1   | `PROC0_SECURE` | Permit Secure accesses through core 0's memory access port                                                 |
| 2   | `PROC1`        | Enable core 1's memory access port                                                                         |
| 3   | `PROC1_SECURE` | Permit Secure accesses through core 1's memory access port                                                 |
| 8   | `MISC`         | Enable additional debug components, including the cross-trigger interface and the RISC-V debug access port |


Secure debug on a core needs both of its bits: the one that enables the Mem-AP, and the one that permits Secure accesses through it.

In contrast to the redundant encoding used for OTP security fields, the datasheet documents no bit redundancy, parity or majority vote for `DEBUGEN`.

We therefore tested whether laser pulses could set `DEBUGEN` bits on the secured device described above.

## Photon-emission-guided localization

That test first requires knowing where to aim. Setting an individual `DEBUGEN` bit means hitting the storage of a single register bit, a needle in a haystack. This is a harder targeting problem than the instruction-skip faults common in laser fault injection, where disturbing any of the many flip-flops in a core pipeline can produce the same skip: that spreads the sensitive area widely enough for a random scan to find it. A blind scan for one `DEBUGEN` bit is impractical.

Switching transistors emit faint near-infrared photons correlated with their activity, so collecting that emission over repeated execution can reveal where a selected control changes state. This made photon-emission microscopy (PEM) a good fit for `DEBUGEN`: as a memory-mapped register, Secure software can toggle exact bits in a loop, driving the repeated state changes the measurement needs. We used it as the first localization stage, and the resulting map constrained the subsequent laser scan to a region of a few micrometers.

We compared loops that repeatedly toggled selected `DEBUGEN` bits on and off, differing only in the bits they targeted. A register's photon emission is faint next to the camera's own noise and sensitive to slowly drifting ambient conditions such as temperature, so a single frame reveals nothing. Averaging many frames of each loop suppressed random sensor noise, and subtracting the two mean stacks cancelled everything the loops shared: static background, sensor offset, thermal emission, and switching unrelated to the selected bits. Interleaving the two values during acquisition kept slow drift from biasing that subtraction. What remained was the emission that tracked the selected bits.



<figure>
  <img
    src="/blog/rp2350-secure-debug-laser-fault-injection/photon-emission-raw-difference.png"
    alt="Mean stacks of 200 full-view photon-emission captures for DEBUGEN masks 0x3 and 0xc followed by their signed difference."
  />
  <figcaption>Mean stacks of all 200 mask 0x3 and mask 0xc acquisitions, followed by their signed difference. Red is positive, indicating greater emission for 0x3; blue is negative, indicating greater emission for 0xc. The localization maps below additionally balance acquisition order before combining matched differences.</figcaption>
</figure>

Repeated comparisons across different bit masks exposed compact sites associated with `DEBUGEN` bits 0–3 across three regions of the camera field.



<figure>
  <img
    src="/blog/rp2350-secure-debug-laser-fault-injection/photon-emission-debugen-bit-overlays.png"
    alt="Infrared overview of the die with three marked regions, plus zooms of those regions overlaid with colored DEBUGEN bit sites."
  />
  <figcaption>Infrared overview of the camera field, with three marked regions. Coloured pixels mark sites associated with `DEBUGEN` bits 0-3.</figcaption>
</figure>

These zones show switching activity associated with each `DEBUGEN` bit, it does not directly identify storage cells. The multiple hotspots observed for each bit may arise from both the storage element or related logic. Without layout data, we cannot distinguish between the two. However, these zones still significantly reduce the search space.

## Finding 1 — faulting `DEBUGEN` gives Secure debug

For Laser fault injection (LFI)  we used a pulsed laser at 980 nm with 2.97 W maximum optical power, operated at roughly 40% (about 1.2 W), with a 100 ns pulse width through a 50x objective. After each pulse, we probed the debug access ports over SWD.

Within the area found from PEM, we ran a LFI scan and used that SWD feedback to calibrate two responsive positions a few micrometres apart. At one position, pulses enabled bus access through core 1's Mem-AP, indicating that `PROC1` was set. At the other, the Mem-AP's Control/Status Word reported `SDeviceEn = 1`, a state-guided signal that `PROC1_SECURE` was likely set. We checked both indicators after every pulse.


<figure>
  <img
    src="/blog/rp2350-secure-debug-laser-fault-injection/photon-emission-vs-lfi.png"
    alt="Side-by-side infrared views with PEM bit sites on the left and LFI fault points on the right."
  />
  <figcaption>Left: PEM sites associated with `DEBUGEN` bits. Right: laser-fault points on the LFI infrared view.</figcaption>
</figure>

A pulse that set one bit could clear the other, so setting both required an iterative sequence. Our script pulsed the `PROC1` position until bus access was available, then pulsed the `PROC1_SECURE` position until `SDeviceEn = 1`, returning to the first position whenever bus access was lost. Once the positions and pulse parameters were calibrated, the sequence enabled Secure debug within seconds. Interestingly, we could not reproduce this sequence using a 20x objective. Because the two positions are only a few micrometers apart, that wider spot likely hit both the region that sets a bit and the one that clears it, so it was not possible to obtain the correct value.

Once both bits were set, they remained set without further pulses or software writes. Reading the Secure-only `DEBUGEN` register through core 1's Mem-AP then returned `0xc`; because `DEBUGEN` is Secure-only, that successful read confirms the transaction was Secure-attributed.

Enabling Secure accesses through core 1's Mem-AP allows the debugger to read and write memory-mapped resources whose `ACCESSCTRL` permissions admit the debugger as a bus manager and whose target-specific controls admit Secure AHB transactions. Independently of those direct reads, the debugger can halt and single-step the core and inspect or modify its registers, compromising TrustZone runtime isolation through Secure-core-mediated extraction. This does not make the boot ROM accept unauthenticated firmware: when firmware boots normally, secure boot still authenticates it, but cannot protect runtime state that remains accessible to the debugger after verification.

## Application to the Hacking Challenge configuration

The Secure-attributed Mem-AP access described above exposes Secure runtime state, but the challenge's page 48 runtime lock still prevents access to the secret after firmware has run. The page's persistent lock, `PAGE48_LOCK1 = 0x3c3c3c`, denies Non-secure reads but leaves `LOCK_S` at `READ_WRITE`, so it remains readable through Secure-attributed accesses before the runtime lock is tightened.

During each boot, the firmware writes the most restrictive binary value, `0b1111`, to the runtime lock `otp_hw->sw_lock[48]`. That register then makes the page inaccessible to both Secure and Non-secure accesses, including Secure debug, and therefore prevents Secure transactions from the Mem-AP from reading the secret.

As documented, software locks "are initialised from the OTP lock pages at reset", and a write only advances the state "until next reset". Resetting the OTP block discards `0b1111` and restores the value derived from `PAGE48_LOCK1`, for which `LOCK_S = READ_WRITE`.

The remaining question is how to reset a locked chip without allowing firmware to re-apply the runtime lock. The RP-AP remains "always accessible, even when external debug is disabled". Setting `CTRL.RESCUE_RESTART` triggers a rescue reset: a full system reset that also flags the boot ROM to halt before any user software runs.

The [boot ROM](https://github.com/raspberrypi/pico-bootrom-rp2350) checks `POWMAN_CHIP_RESET.RESCUE_FLAG` before watchdog, flash or USB boot, clears it, then holds core 0 in an interrupt-disabled wait loop and core 1 in its wait-for-vector path.[^2] The datasheet documents no restriction on `CTRL.RESCUE_RESTART`.

We proceed in the following sequence:

1. **Rescue reset.** Set `CTRL.RESCUE_RESTART` to `1`, then clear it to `0` through the RP-AP. The chip resets and remains in boot-ROM wait paths. The signed firmware never runs, so `sw_lock[48]` is never tightened and stays at the permissive value derived from `PAGE48_LOCK1` — `LOCK_S = READ_WRITE`.
2. **Fault `DEBUGEN` to `0xc`.** With both cores in boot-ROM wait paths, set `PROC1` and `PROC1_SECURE` as described above; these two set bits produce the value `0xc`.
3. **Halt core 1** through its Debug Halting Control and Status Register (`DHCSR`) over the now-Secure Mem-AP.
4. **Read the secret** from OTP rows `0xc08`–`0xc0f` through the guarded read interface.

We ran this sequence on the tested device and recovered the complete challenge secret.

## `DEBUGEN_LOCK` does not prevent laser-induced changes

`DEBUGEN_LOCK` blocks software writes to the corresponding `DEBUGEN` bits: each lock bit is "Write 1 to lock the [...] bit of DEBUGEN. Can't be cleared once set". The datasheet presents this as a way "to avoid accidental writes".

In trials with the target `DEBUGEN` bit at `0` and its lock bit at `1`, a pulse could still set `DEBUGEN` while the lock remained `1`. Pulses also set lock bits, with or without a corresponding `DEBUGEN` change. In successful sequences, all five functional lock bits were `1` by the time `PROC1` and `PROC1_SECURE` were both set. We never saw a lock bit return from `1` to `0`, so a later write of `DEBUGEN = 0` cannot restore the disabled state once the fault has set the corresponding lock.


## Limits of software-based mitigations

Once Secure accesses through the Mem-AP are enabled, Secure attribution alone no longer separates the debugger from Secure firmware. This access does not override hard OTP locks or peripheral-specific controls. `ACCESSCTRL` can block direct debugger-manager transactions to particular targets, but it does not by itself prevent a debugger controlling the Secure core from causing core-originated accesses or extracting loaded values through core registers. After a rescue reset, `ACCESSCTRL` returns to its all-open reset-time defaults before firmware can reconfigure it. `ACCESSCTRL` therefore reduces direct Mem-AP exposure rather than forming a standalone confidentiality boundary.

Firmware can nevertheless reduce post-boot exposure by denying the debugger access to sensitive targets in `ACCESSCTRL`, then setting the debugger bit in `ACCESSCTRL.LOCK` so that debugger transactions cannot reopen those permissions. Secure firmware can also check `DEBUGEN` periodically and, on an unexpected value, trigger a fail-safe reset that clears the processor-cold reset domain. These measures are best-effort runtime mitigations: an enabled debugger may halt the core before the next check, and rescue reset stops before firmware can configure `ACCESSCTRL` or run the monitor. They therefore do not prevent the pre-firmware secret read demonstrated here.

RP2350's documented encrypted-boot flow illustrates the pre-firmware limitation of runtime locks and the post-boot limitation of debugger-manager filtering in two distinct machine states. **After rescue reset**, the boot ROM halts before decryption: no plaintext payload exists yet, but the decryption key may be directly readable if the OTP page's persistent permissions allow Secure access and no other target control blocks the transaction. **After normal encrypted boot**, plaintext exists in SRAM: direct Mem-AP reads depend on debugger-manager permissions in `ACCESSCTRL`, while Secure-core control may permit core-mediated extraction even when direct reads are denied. This is architectural analysis, not a tested encrypted-boot result; encrypted boot still protects external flash from offline inspection.

## Impact and attack requirements

The demonstrated sequence provides Secure-attributed memory access, control over Secure-world execution, and access to the challenge secret after resetting its runtime page lock. It requires the following resources:

- **Destructive physical access.** Backside decapsulation permanently modifies the package and leaves the die exposed.
- **Specialised laboratory equipment.** The complete setup described above costs approximately **$250,000**.
- **Hardware-security expertise.** The procedure requires sample preparation, die navigation, laser parameter selection, and coordinated laser control, stage positioning, and SWD measurement.


## Conclusion

The RP2350 encodes critical debug-disable flags in OTP with redundant voting, but `DEBUGEN` can override their effect and has no equivalent protection documented in the datasheet. In our experiments, laser pulses changed `DEBUGEN` despite `DEBUGEN_LOCK` and could set a lock bit that prevented firmware from restoring the disabled value. Separately, the RP-AP rescue reset restored the challenge's runtime page lock to its persistent value while preventing user firmware from executing. The software-visible mechanisms each performed their documented function, but their interaction with the laser fault enabled Secure debug and recovery of the challenge secret. Differential PEM first isolated bit-dependent `DEBUGEN` activity, guided LFI converted that spatial lead into persistent Secure debug. The system-level lesson is that security analysis must cover the complete enforcement path, from persistent OTP configuration through mutable control registers and reset behaviour, because system security depends on that path rather than on individual mechanisms in isolation.


## Disclosure and acknowledgements

We disclosed this fault to Raspberry Pi on 28 July 2026. We thank the Raspberry Pi team for their engagement in the disclosure discussions and for their transparent approach to security research.



---

*Antoine Plin, Hardware Security Intern at Ledger Donjon*

[^1]: [https://github.com/raspberrypi/rp2350_hacking_challenge](https://github.com/raspberrypi/rp2350_hacking_challenge) The RP2350 Hacking Challenge repository, containing the reference lockdown configuration and firmware we replicated.

[^2]: The rescue check is step 1 of the core 0 boot path in `src/main/arm/varm_boot_path.c`; in `src/main/arm/arm8_bootrom_rt0.S`, `varm_wait_rescue` enters the interrupt-disabled `varm_dead_quiet` WFI loop while core 1 remains in the boot ROM's wait-for-vector path.

[^3]: Courk, [Laser Fault Injection on a Budget: RP2350 Edition](https://courk.cc/rp2350-challenge-laser).
