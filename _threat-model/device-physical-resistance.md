---
layout: page
title: Threat Model - Physical Resistance
---

Once an attacker gains physical access to a device (for instance by stealing it), a wide range of attacks become possible. It is thus important to build protections to prevent access to the device secrets. For instance, the number of PIN tries should be limited, otherwise an attacker could try every combination possible. That’s why hardware wallets usually wipe the device memory after a low threshold is reached.

Hardware wallets can also be targeted by more sophisticated attacks such as fault injection or side-channel attacks. Side-channel attacks are a wide range of attacks that consist of exploiting physical leakages of a device handling sensitive information. These attacks focus on measurable information obtained from the implementation of an algorithm, rather than weaknesses in the algorithm itself. For instance, an attacker with physical access to a security device could measure the power consumption or electromagnetic emanations of the circuit to extract information that could lead to the secret manipulated by the device.

Ledger devices use Secure Elements along with software especially developed to prevent these kinds of attacks.


> **Associated Threats**:  An attacker with a physical access to the device with a high potential (expertise, time, equipment) is the typical threats the Ledger devices shall counter. This includes laser and electromagnetic attacks, glitch fault injection, side channel attacks, hardware reverse engineering, etc. Any physical attack allowing to extract sensitive information such as seeds, PIN or firmware is a valid attack.

