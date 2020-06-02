---
layout: page
title: Threat Model - App Isolation
---

One of the main features of Ledger devices is that anyone can load its own app on the Secure Element. Each app is isolated from each other thanks to BOLOS, the Operating System. That essentially means that:

- Apps cannot access to the OS memory.
- Apps cannot read or write the volatile and non-volatile memory from another app.
- Apps can derive keys on their own HD path only, which ensures that cryptocurrency apps cannot steal keys from each other. For instance, the Zcoin app cannot derive keys on the Dogecoin derivation path (`m/44'/3'/`), since its own derivation path is `m/44'/128'/`.

The OS relies on hardware features provided by the Secure Element, either the MPU (Memory Protection Unit) or the MMU (Memory Management Unit), to isolate the apps between them and also to isolate the OS itself from the apps.
