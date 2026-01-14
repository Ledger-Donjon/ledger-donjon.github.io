---
layout: threat-model
title: Threat Model - Secure Display and Inputs
---

Smartphones and personal computers aren't designed to provide a high level of security. If an attacker gains access to the system, there is no way to tell whether what's displayed on the screen is actually modified by a malware. Users cannot also prevent keystrokes from being recorded or injected.

However, having a trusted display is of utmost importance for users, as they must be able to reliably check transaction data or addresses. If transactions displayed on the screen can't be trusted, attackers can display information unrelated to the transaction being processed. Hardware wallets are precisely designed to prevent these threats, ensuring secure display and secure inputs for verifying and granting transactions. It especially ensures the "What you see is what you sign" property.

Similarly, it's equally important to have trusted inputs. It avoids an attacker to bypass user consent for approving a transaction for instance. More information about [the importance of trusted display](https://www.ledger.com/blog/trusted-display/) can be found in this dedicated article.

These security mechanisms are implemented through the genuineness property, the firmware integrity firmware mechanism and the device architecture itself.

> **Associated Threats**: Attacks allowing to run a non legit firmware on the Secure Element, to execute arbitrary code controlling the display or to bypass user's input are some examples of threats against this property.
