---
layout: threat-model
title: Threat Model - Genuineness
---

The ability to prove genuineness of the device is one of the main security features, from both hardware and firmware points of view. The hardware wallet must have a secure mechanism for this, and this is at the utmost importance. An attacker could otherwise have replaced a genuine device by a fake and backdoored one (through supply chain or evil maid attacks for instance). In this case, he would be able to access to the crypto assets afterwards.

Anti-tampering seals (or holographic seals) can give a false sense of security: not only are they trivial to clone, but it is also easy to open and close a package without damaging the seal.

### Ledger Genuine Check

To prove the genuineness of Ledger devices, the following steps take place during the manufacturing (in secure environment):
- Each Ledger device generates a unique pair of keys: a public key and a private key. The private key is kept secret to the device only and cannot be exported nor retrieved.
- The device sends its public key to Ledger’s HSM (Hardware Security Module). Our HSM signs the public key with the Ledger Root of Trust and sends it back to the device. This signed public key is the device’s attestation, which is stored inside the device.

After manufacturing, this attestation allows the user (through Ledger Live) to verify if the device is genuine. The HSM sends a challenge which must be signed by the device and sent back along the attestation. This allows the HSM to verify the attestation and the challenge signature and eventually tell whether the device is genuine or not. More details can be found in [this blogpost](https://www.ledger.com/a-closer-look-into-ledger-security-the-root-of-trust/).

### End User Physical Verification

We have designed the Ledger Nano S to be easily openable, so users can check the integrity of their devices by themselves as detailed of [this support article](https://support.ledger.com/hc/en-us/articles/115005321449-Check-hardware-integrity).
The Ledger Nano X uses a different architecture and the instructions that enable users to check the integrity of their devices by themselves is detailed [here](https://support.ledger.com/hc/en-us/articles/360019352834-Check-hardware-integrity).


> **Associated Threats**: An attack allowing to extract a device is a major threat to device genuineness security mechanism. Generally speaking, any attack allowing a non genuine device to pass the genuine check is a valid attack.
