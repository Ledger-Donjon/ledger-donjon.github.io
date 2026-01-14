---
layout: threat-model
title: Threat Model - Random Number Generation
---

One of the main security features of Ledger devices is the capability to generate high quality randomness. The master seed, which is generated from random numbers during the setup of a wallet, is used to derive almost every secret of a wallet. Having a low quality randomness has terrible consequences because it allows attackers, in the worst case, to recreate the seed without any specific knowledge. For instance, some [Android wallets were cleared out](https://bitcoinmagazine.com/articles/critical-vulnerability-found-in-android-wallets-1376273924) in 2013 because of a bug in the random generator of Android itself. It is thus especially important to guarantee a high quality randomness.

However, ensuring the true randomness of a Random Number Generator is especially difficult because pseudo-randomness is statistically indistinguishable from true randomness, but can still be predictable for attackers.

Hardware wallets are built with Integrated Circuit (IC) and inside the circuit there is often a specific part of electronics named the TRNG, which stands for True Random Number Generator. Different kinds of designs can be found, they often rely on free oscillators which run in parallel and are sampled at a very specific timing. This very tiny source of entropy is amplified by different means and the result is used to feed the Random Number Generator. For TRNG that can be found in Secure Elements, the high quality of the randomness is verified during mandatory security evaluations. These evaluations are performed by a 3rd party laboratory to obtain the highest level certifications EAL5+, AIS-31. This methodology includes a mathematical proof of randomness and very large number of tests. The RNG is tested under various conditions of temperatures, frequency, voltage and must pass all the statistical tests. It also includes randomness defects and attacks detection mechanisms.

On Ledger devices, a True Random Number Generator is used for seed generation, ephemeral key generation and countermeasures.


> **Associated Threats**: Any mean allowing an attacker to reduce the entropy, predict seed/keys value without detection is a valid attack.
