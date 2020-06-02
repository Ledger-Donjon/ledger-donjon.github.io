---
layout: page
title: Threat Model - Transport Security
---

USB is the only way to communicate with the Ledger Nano S while the Ledger Nano X also features Bluetooth Low Energy (BLE) connectivity.

As these protocols expose a broad attack surface, there is a dedicated and untrusted piece of hardware, the MCU, whose main role is to implement these communication protocols. Once the packets are decoded by the MCU, their content is forwarded to the Secure Element which has little to no knowledge about the original communication protocol. Specifically, under Ledger devices threat model, USB and BLE transports are considered as the outside world (cf. [Security model of BLE for Nano X](https://www.ledger.com/ledger-nano-x-bluetooth-security-model-of-a-wireless-hardware-wallet/)). No security assumption is done on the data coming from them.


> **Associated Threats**: The Operating System of the user can be compromised and send ill-formed USB/BLE packets. This could be leveraged by an attacker to exploit vulnerabilities, eventually leading to arbitrary code execution on the MCU and to access to the communication channel with the Secure Element. If doing so increases the attack surface of the Secure Element (compared to communicating with the Secure Elements over USB or BLE), it would be a threat against this property.
