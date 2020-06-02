---
layout: page
title: Threat Model - Confidentiality and Integrity
---

The confidentiality and integrity of the OS are also important mostly for IP (Intellectual Property) reasons. Using a Secure Element, Ledger must protect the IP of the Secure Element vendor, some parts being under NDA (Non-Disclosure Agreement).

The confidentiality and the integrity of the code running on the Secure Element are ensured by leveraging the hardware security mechanisms provided by the Secure Element itself. Furthermore, even if third party code can be executed at the app level, apps can't read nor modify the OS private data (such as Ledger attestation) thanks to the [isolation](/threat-model/app-isolation) mechanisms.

Integrity checks are also implemented as additional protection mechanisms against software and hardware attacks.

During upgrades, the firmware is never transmitted unencrypted. Firmware upgrades are signed and sent through a secure channel from the HSM to the Secure element itself. The secure channel provides authentication (attestation), confidentiality (encryption) and integrity properties (MAC).


> **Associated Threats**: Several means could allow an attacker to break confidentiality or integrity at the OS level. Software vulnerabilities in the isolation implementation, cryptographic vulnerabilities in the secure channel implementation, physical attacks to dump the OS are possible threats against these security properties.
