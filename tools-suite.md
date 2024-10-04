---
layout: page
title: Donjon Tools Suite
permalink: /tools-suite/
---

## Ledger Donjon's Tools Suite

The Security Team working in the Donjon develops their own tools for
their research and assessments. Most of these tools are intended to
be shared with the community by providing their source code in
order to allow people to contribute to their development.

This page presents these tools in different categories,
[Software](#software-tools) and [Hardware](#hardware-tools) related.

You can also check out the [Ledger-Donjon Git organization](https://github.com/Ledger-Donjon).

### Software Attack & Analysis Tools {#software-tools}

<div class="tool-cards-container">
<div class="tool-card" markdown="1">

#### cargo-checkct

Written in Rust, it verifies formally if a software is compiled down to
constant-time machine code.  
More information in [this article](https://www.ledger.com/blog-cargo-checkct-our-home-made-tool-guarding-against-timing-attacks-is-now-open-source).

[Repository](https://github.com/Ledger-Donjon/cargo-checkct).

</div>
</div>

### Hardware Attack & Analysis Tools {#hardware-tools}

#### Boards

<div class="tool-cards-container">
<div class="tool-card" markdown="1">

#### Scaffold

![Scaffold's photograph](/assets/img/tools-suite/scaffold-board.png)

Multi-purpose board to control devices with embedded features such as:

- current consumption measurement,
- multiple communication protocols (SPI, I<sup>2</sup>C, UART...),
- command triggering,
- pulse generators...

[Repository](https://github.com/Ledger-Donjon/scaffold/)

</div>
<div class="tool-card" markdown="1">

#### Curmea

![Curmea](/assets/img/tools-suite/curmeaH.png)

Simple board for differential current consumption measurement.

[Repository](https://github.com/Ledger-Donjon/curmea/)

</div>
<div class="tool-card" markdown="1">

#### Silicon Toaster

![Silicon Toaster's photograph](/assets/img/tools-suite/silicontoaster.png)

Board to inject electromagnetic pulses from a bank of capacitors, that can be
loaded to a programmable level of voltage, and discharged with a triggering
input source.

[Repository](https://github.com/Ledger-Donjon/silicontoaster/)

</div>
</div>

#### Software and utilities

Useful utilities while performing hardware attacks.

<div class="tool-cards-container">
<div class="tool-card" markdown="1">

#### Laser Studio

Multi-environment python3 software controlling hardware benches
to conduct automatized evaluations.

[Repository](https://github.com/Ledger-Donjon/laserstudio/)

</div>
<div class="tool-card" markdown="1">

#### pystages

![Pystages logo](/assets/img/tools-suite/pystages.png)

Python module for managing the positions of physical actuators,
such as CNCs, Corvus, or Newport.

Also provides a simple User Interface.

[Repository](https://github.com/Ledger-Donjon/pystages/)

</div>
<div class="tool-card" markdown="1">

#### pyPDM

This python module can control the
[Pulse-on-Demand Modules](https://www.alphanov.com/en/products-services/pdm-laser-sources)
from [ALPhA<sup>NOV</sup>](https://www.alphanov.com/).

[Repository](https://github.com/Ledger-Donjon/pypdm/)

</div>
<div class="tool-card" markdown="1">

#### Quicklog

Python module for creating logs during a fault injection campaign.

It can link each entry to curve as binary data, for instance retrieved
from an oscilloscope.

[Repository](https://github.com/Ledger-Donjon/quicklog/)

</div>
<div class="tool-card" markdown="1">

#### Quicklog Explorer

GUI utility for viewing, filtering and plotting generated with [Quicklog](#quicklog).

[Repository](https://github.com/Ledger-Donjon/quicklog-explorer/)

</div>
<div class="tool-card" markdown="1">

#### Visplot

![Visplot](/assets/img/tools-suite/visplot.gif)

A side-channel traces visualizer based on [vispy](https://github.com/vispy).

[Repository](https://github.com/Ledger-Donjon/visplot/)

</div>
</div>

#### Side-channel Tools

<div class="tool-cards-container">
<div class="tool-card" markdown="1">

#### Muscat

Side-channel analysis tool written in Rust for performance
optimizations.

[Repository](https://github.com/Ledger-Donjon/muscat/)

</div>
<div class="tool-card" markdown="1">

#### Scadl

Side-channel analysis tool with Deep-Learning features.

[Repository](https://github.com/Ledger-Donjon/scadl/)

</div>
<div class="tool-card" markdown="1">

#### Lascar

Side-channel python3 library.

[Repository](https://github.com/Ledger-Donjon/lascar/)

</div>
</div>
