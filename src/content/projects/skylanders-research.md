---
title: "Skylanders research"
description: "Research into how the toys to Life gimmick of the skylanders games works"
imgSrc: "@assets/images/projects/skylanders/pop-emu-logo.png"
imgAlt: "The logo for the pop-emu organization on github"
pubDate: 2023-04-24T10:26:40+02:00
tags: ["c", "c#", "typescript"]
---
If you were a child or parent in the 2010's, you have probably heard of Skylanders. The game that sold you physical toys just so you could play more of the game. Personally, I have spent way too much money on those figures when I was a child. So, when I got bored over the summer and needed something to do, I decided that I would reverse-engineer the Toys to Life gimmick of the Skylanders games.

## Research
During my research, I have written several blog posts that can be found [on my posts page](http://marijnkneppers.dev/posts/). These describe my process and my findings.

Although my research is far from finished, I can now confidently describe most of the communication between the game and the Portal of Power used the read the figures.

## Applying my research
Research in itself isn't very useful if you have no way to actually use it. Happily, I have already been able to apply my research in a few places.

### Portal emulation in Dolphin
Something I was planning on doing after my research was finished was adding portal emulation to [the Dolphin Emulator](https://dolphin-emu.org). But before I could do that, [deReeperJosh](https://github.com/deReeperJosh) already opened [a pull request adding portal emulation](https://github.com/dolphin-emu/dolphin/pull/11331). This PR was based on the code from [RPCS3](https://rpcs3.net/). However, their code has a few flaws and some command descriptions were way off. I was ablet o resolve/improve those parts and ended up becoming a co-author of the commit.

#### Improving figure data
deReeperJosh's PR also added the ability to generate figure data. The code used for this used a addition to generate a UID for figures. The problem with this is that this could easily lead to figures having the same ID. Because of that, I opened [a PR that generates random UID's](https://github.com/dolphin-emu/dolphin/pull/11492).

#### Portal audio
A big feature on the portal released alongside Skylanders: Trap Team was the speaker that could play audio. So, after portal emulation was added, a common request was emulation of the speakers. So, deReeperJosh created [a PR adding audio support](https://github.com/dolphin-emu/dolphin/pull/11644). Although I am not directly mention in the PR, I provided the audio format to deReeperJosh through discord.

### Physical portal emulation
A built-in portal emulator is nice, but you can't use that on a real wii. Imagine having your portal break but you still want to play on your wii. What then? Because of that, I decided to buy a [Raspberry Pi Pico W](https://www.raspberrypi.com/products/raspberry-pi-pico/) and program it to emulate a portal. Specifically, the traptanium portal bundled with Skylanders: Trap Team since it supports the most games.

#### The portal emulation
Getting the device to be recognised was quite easy. [The pico SDK](https://github.com/raspberrypi/pico-sdk) provides support for [TinyUSB](https://www.tinyusb.org), a library that allows for, among others, emulating USB devices. After that, I just needed to analyze and write the device descriptors. After that, I just had to emulate the command functionality. All code can be found [in the github project](https://github.com/pop-emu/PicoWPortal).

#### Controlling the emulator
Since the only USB port on the device is already taken up, I needed to find another way to control the device. So, I decided to create a HTTP API. The implementation of this can be found [in Server.cpp on github](https://github.com/pop-emu/PicoWPortal/blob/master/src/Server.cpp). However, I also needed a way for people to easily call that API without needing to manually call it. So, I decided to create a website interface using [Astro](https://astro.build). This can be found [in this repository](https://github.com/pop-emu/portal-interface).
