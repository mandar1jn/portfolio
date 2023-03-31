---
title: "Proving my Skylanders research"
description: "In this post, I will discuss how I have been proving my Skylanders research"
pubDate: 2022-11-27T14:09:35+0200
imgSrc: "@assets/images/blog/skylanders-editor/runic-portal.png"
imgAlt: "A picture of the runic portal from Skylanders: Spyro's adventure"
draft: true
---
It's been a busy few weeks when it comes to my Skylanders research. Until now, a lot was hypethetical, but that has changed. In this article, I will be talking about how I managed to prove my research and some new things that I discovered.

## Proving my research
So, how am I going about proving my research?

### The Dolphin Emulator
On December 8, [deReeperJosh](https://github.com/deReeperJosh) opened [his Pull Request](https://github.com/dolphin-emu/dolphin/pull/11331) to the Dolphin Emulator to add emulation for the Skylanders portal to Dolphin. The original code for this was mostly based on the [RPCS3 Emulator](https://rpcs3.net/) and although it's functional, it has some flaws. So, I decided to make a few contributions. For example, some command implementations were slightly off or described incorrectly in the comments. This implementation coincides with my research on the portal. After this, deReeperJosh went about fixing up some of the underlying usb emulation code and after that, it was ready to merge. deReeperJosh also wrote an article about this [on their website](https://josh-cv.vercel.app/articles/dolphin-emulated-usb-devices)

Finally, on the 24th of January, the PR got merged and it's now an official part of the dolphin emulator

#### Figure data
Alongside the portal emulator, deReeperJosh also added code to generate figure data. This generates a `.sky` file with the bare minimum information required to get a figure to be recognised and loaded by the game. I am currently working on expanding the knowledge about the data on figures.

### A physical emulator
I'm currently working on programming a RaspberryPi Pico W so that it can emulate a real portal. currently, the device has the exact identification of a real portal, but it does not yet support any of the commands. Because of this, the game recognises that a portal is plugged in but it warns that the portal does not support this game.
