---
layout: page
title: Bug Bounty Program
permalink: /bounty/
---

Ledger believes in better security through openness. We welcome and value technical reports of vulnerabilities that could substantially affect the confidentiality or integrity of user data on Ledger devices or the security of our infrastructure. If you believe that you have discovered such a vulnerability, please report it at `bounty -at- ledger.fr` ([GPG key](/assets/ledger-bounty.asc) if necessary). The Ledger Security Team will work with you to investigate, resolve the issue promptly and reward the first reporter of a vulnerability.


## Eligibility

Ledger Bug Bounty Program covers our hardware devices as well as our web services.


### Devices Bug Bounty Program 📟

We are mainly interested in vulnerabilities that would eventually allow attackers to steal crypto assets from Ledger devices.

#### Scopes

- Hardware attacks on the Ledger Nanos S, Ledger Nano X and Ledger Blue
- Software attacks on the firmware of the Ledger Nanos S, Ledger Nano X and Ledger Blue
- Vulnerabilities in apps available through Ledger Live (vulnerabilities in apps developed by 3rd parties should also be reported to Ledger)

#### In-Scope Vulnerabilities

Examples of vulnerabilities that are in-scope:

- Bypass of the PIN
- Arbitrary code execution on the SE
- Arbitrary code execution on the MCU (without physical access)
- Privilege escalation from an app
- Bypass of user confirmation to issue a transaction
- Sensitive memory leak


### Web Bug Bounty Program 🌐

We are interested in critical vulnerabilities in our infrastructure. In a nutshell, we are interested in real vulnerabilities, not in output of automated scanners. **Due tu the large amount of emails received daily, we might not be able to respond to all reports for out-of-scope vulnerabilities.**

#### Out-of-scope Vulnerabilities

These vulnerabilities are **out-of-scope**:

- Presence/absence of SPF/DMARC records.
- Lack of CSRF tokens.
- Clickjacking issues.
- Missing security headers which do not lead directly to a vulnerability.
- Missing best practices (we require evidence of a security vulnerability).
- Reports from automated tools or scans.
- Reports of insecure SSL/TLS ciphers (unless you have a working proof of concept, and not just a report from a scanner).
- Absence of rate limiting.
- Editable Github wikis.
- Outdated software without any noteworthy vulnerability.


## Responsible Disclosure Policy

At Ledger, we believe that Coordinated Vulnerability Disclosure is the right approach to better protect users. When submitting a vulnerability report, you enter a form of cooperation in which you allow Ledger the opportunity to diagnose and remedy the vulnerability before disclosing its details to third parties and/or the general public.

In return, Ledger commits that security researchers reporting bugs will be protected from legal liability, so long as they follow responsible disclosure guidelines and principles.

In identifying potential vulnerabilities, we ask that all security researchers stick to the following principles:

- Do not engage in testing that:
  - Degrades Ledger’s information systems and products.
  - Results in you, or any third party, accessing, storing, sharing or destroying Ledger or user data.
  - May impact Ledger users, such as denial of service, social engineering or spam.
- Do not exploit vulnerabilities on our infrastructure. The Bounty Program is about improving security for Ledger users, not deliberately trying to put the community at risk.


## Submission Process

Submission reports should include a detailed description of your discovery with clear, concise steps allowing us to reproduce the issue, or a working proof-of-concept.

Low quality reports, such as those that include inadequate information to investigate, may incur significant delays in the disclosure process, which is in nobody’s interest. Please only submit one report per issue.

All communications between you and Ledger should go through `bounty -at - ledger.fr`. Please use our [GPG key](/assets/ledger-bounty.asc) as necessary.

Do not use personal emails, social media accounts, or other private connections to contact a member of the Ledger Security Team regarding vulnerabilities or any issue related to the Bounty program, unless you have been instructed to do so by Ledger.

The Ledger Security Team will be in touch, usually within 24 hours.

When submitting a vulnerability report you agree that you may not publicly disclose your findings or the contents of your submission to any third parties in any way without Ledger’s prior written approval.


## Remediation & Disclosure

After triage, we will send an expected timeline, and commit to being as transparent as possible about the remediation timeline as well as on issues or challenges that may extend it. You may receive updates with significant events such as the validation of the vulnerability, requests for additional information or your qualification for a reward.

Bug reporters allow Ledger the opportunity to diagnose and offer fully tested updates, workarounds, or other corrective measures before any party discloses detailed vulnerability or exploit information to the public.

Once the security issue is fixed or mitigated, the Ledger Security Team will contact you. Prior to any public announcement of a vulnerability, and to the extent permitted by the law, we will share the draft description of the vulnerability with you. In case of disagreement, we would explore mediation mechanisms.


## Reward

You may be eligible to receive a reward if:

- (i) you are the first person to submit a given vulnerability;
- (ii) that vulnerability is determined to be a valid security issue by the Ledger Security Team;
- (iii) you have complied with the Ledger Bug Bounty program policy and guidelines.

The decision to grant a reward for the discovery of a valid security issue is at Ledger’s sole discretion. The amount of each bounty is based on the classification and sensitivity of the data impacted, the completeness of your Submission report, ease of exploit and overall risk for Ledger’s users and brand.

Bounties will be paid directly to the researcher using Bitcoin.

You will be responsible for any tax implications related to bounty payments you receive, as determined by the laws of your jurisdiction of residence or citizenship.

To be eligible for a reward, you must not:

- Be a resident of, or make your vulnerability submission from, a country against which France has issued export sanctions or other trade restrictions,
- Be in violation of any national, state, or local law or regulation,
- Be employed by Ledger or its subsidiaries or affiliates,
- Be an immediate family member of a person employed by Ledger or its subsidiaries or affiliates,
- Be less than 18 years of age. If you are under 18 years old, or considered a minor in your place of residence, you must get your parents’ or legal guardian’s permission prior to participating in the program.


## Hall of Fame

In mutual consultation, we can, if you desire, display a researcher’s name or its pseudonym as the discoverer of the reported vulnerability on our website’s [Hall of Fame](/hall-of-fame/).


*This is an experimental and discretionary rewards program. We may modify the terms of this program or terminate this program at any time without notice.*

*Parts of the program are inspired by [Dropbox Bug Bounty Program](https://hackerone.com/dropbox).*
