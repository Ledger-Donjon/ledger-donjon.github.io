---
layout: page
title: Threat Model - PIN Security Mechanism
---

An attacker with a physical access to a device (e.g. stolen device) might get a full control over the device, meaning that sensitive operations can be processed.

To prevent this, a PIN security mechanism is implemented. During the boot of Ledger devices, the end user must prove that she is the owner of her device thanks to her PIN (Personal Identification Number). This security function is the first interaction between the end user and the device and is critical because it gives access to all services. For instance, all cryptocurrency apps are available, meaning cryptocurrency transfer is available. Note that all other apps (for instance Password Manager, FIDO) are also available as soon as the PIN verification is successfully performed.

<p align="center">
<img src="/assets/oled-vuln/pin5invert-small.jpg">
</p>

PIN is defined by the end user during the on-boarding stage. Its length must be between 4 and 8 digits. The PIN Try Counter (PTC), whose default value is set to 3, counteracts brute-force attacks revealing the value of the PIN. It shall be noticed that a PIN is not ultimate protection: it lets an attacker 3 tries to find the user's PIN value. With a 4-digit PIN, if PIN values were equally distributed, it would leave 0.03% of chance to find the user's PIN value. That's why common PIN values should be avoided: some studies show that 10% of PIN values are `1234`.

As soon as the PTC exceeds its limit, the device wipes the following sensitive assets:

- The PIN
- The seed
- Secret Data

Thanks to this security mechanism, the device cannot be used because the current state is not operational anymore. A new initialization process (either in normal mode or restore mode) is then required.


> **Associated Threats**: Any attack allowing to bypass the PIN verification to guess the correct value of the user's PIN or to extract it is a valid attack.
