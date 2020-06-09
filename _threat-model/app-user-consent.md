---
layout: threat-model
title: Threat Model - User Consent
---

The device security design is strengthened by the end user. As soon as a
sensitive operation is required (PIN validation, transaction confirmation,
etc.), the end user must confirm the operation via a manual action: button press
on the Nano S/X or finger touch on the Blue.

The rationale is pretty simple: if user consent wasn't required for signing
important data, an attacker could use the device as a signing black box. Even if
the private keys never leaves the device, an attacker could sign whatever he
wants.

That's why user approval is always required for signing transactions and
messages.
