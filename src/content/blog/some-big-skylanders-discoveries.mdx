---
title: "Some big Skylanders discoveries"
description: "Some new figure data, new and returning commands, and a wireshark extension"
pubDate: 2022-11-27T14:09:35+0200
imgSrc: "/images/blog/skylanders-editor/runic-portal.png"
imgAlt: "A picture of the runic portal from Skylanders: Spyro's adventure"
---

## Introduction
Well, I've got another massive post for you. And this time, it didn't take me 4 months. In this post, I will be looking at some more figure data, discovering some spicy new commands, and correcting some old ones.

## The Variant ID

In my last post, I mentioned that there had to be some kind of second variable to track what version of the figure you are using. So, I went looking. At first, I couldn't find any trail leading to a possible variant ID. Luckily, dolphin's Filesystem tab came in clutch yet again. Although the files for the normal figures only have a normal ID and no variant ID, the trap files do. Since all the traps of the same element are basically the same, they share the same ID and use different variant IDs. And, happily for us, they have separate files for every trap using the format "Crystal_ID_VARIANTID.bld". So, I used my trap in the Traptanium portal and read its data. Sure enough, there it was at block 0x01 with the offset 0x0C. Putting in my life trap, I got 217 and 3, which lines up with 217_03.bld. This could just be a stroke of luck. So, I looked at the trap ID that there were only 2 of, the Kaos traps with ID 220. I read the data from my ultimate chaos trap and sure enough, ID 220 and variant ID 31, ligning up with "Crystal_220_31.bld". So, let's confirm this behavior with regular figures. Sure enough, my Series 2 Gillgrunt and Cynder both have 1 as their variant ID while my Head Rush, the only figure of its kind, has a 0.

At first, I suspected that the variant ID would be a short, like the figure ID. Alas, this wasn't the case. On my life trap, the bytes before and after the variant ID form 0x00, 0x03, 0x30. For this trap, the variant ID should be 3. Taking 0x00 and 0x03 gave us 0x0300 or 768 in decimals is way too high. 0x03 and 0x30 gives us 0x3003, or 12291 in decimal, is even higher. Because of this, I have come to the conclusing that the variant ID must only be a byte. This might seem small, but this gives activision the ability to release a maximum of 255 figures, which is a lot.

## New commands

### Music
Last weekend, I had a lot of free time on my hand. So, I decided to take a crack at the last big thing I still needed to figure out: Sound. The Traptanium portal introduced a speaker alongside its trap slot. This speaker is used to let the trapped vilains speak to you through the portal and to play sound when you are able to capture a vilain. As for as I know, there is only one person who ever managed something like this and that's a youtube account named obiima that shows this off in [this video](https://youtu.be/8sUMtjrklag). Sadly, they seem to have vanished from the internet, only leaving a [barely functioning website](http://obiima.tk/) behind. So, I booted up Wireshark and Dolphin and I started looking at packets. I inserted a trap into the trap slot of my portal and broccoli guy started speaking. Looking at the packets, there seemed to be 2 commands related to audio, L and M. After some more research, it turned out that only M is really related to music. The M command is used to activate or deactivate the speakers on the portal. It has the following layout:

```js
[{M | 0x4D}, (0x00 | 0x01)]
```

Since it's similar to A, it's very self-explanatory. The first byte is, as always, the command character. The second byte is whether to activate or to deactivate the speaker, where 0x00 is deactivate and 0x01 is activate. The response always mirrors the initial command. As I mentioned, there is only one command related to sound, the M command, So, how does the game load music? Well, it's time to switch the way we transfer data. For all the commands, we used Feature Reports. However, these aren't great for transferring large chunks of data. So, we use the same method the portal uses to send data to the game, interrupts. These can be used to transfer bigger amounts of data. So, to play sound on the portal, we activate the portal, and then we send all the sound data using interrupts. But what is the audio format? Well, glad you asked. I had no idea and I wasn't about to find the data by looking at the packets. So, I asked the Skylanders Reverse Engineering discord and sure enough, I got my answer. I'd like to thank NefariousTechSupport#8517 on discord for helping me out. They informed me that the audio is in the following format:

| Sample rate | Endianness | Compression | Encoding | Channels |
| - | - | - | - | - |
| 8000Hz | little | none | Signed 16-bit PCM | 1 (Mono) |

According to them, the game stores the audio in ".fsb5" files. These are files for fmod studio that I had no way of easily creating. Happily, the format described also matches a ".wav" file. So, I converted an mp3 file to a wav file in the correct format, and... a bunch of static. The portal started playing sound but it was unbearable to listen to for more than a few seconds. I did notice that the sound got louder where it should though. This indicated that I was on the right track. The format NefariousTechSupport provided me with mentions that the endianness needed to be little endian. So, I swapped every set of 2 bytes around and sure enough, music started playing through the portal. Currently, I have to manually enter the position in the file where the data starts. I still need to write a header parser for the wav file.

<iframe width="407" height="724" src="https://www.youtube.com/embed/eMXLjsOEsAQ" title="Just a Trap Team portal playing music" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### Light
As I mentioned while discussing music, there was a second command that seemed related to sound, that being L. At first, I thought it stood for Load, but after discovering the real way music is played, I started doing research. It turns out, L stands for Light. This command is actually very similar to another command, J. Similar to J, the first byte after the command character can be 0x00 and 0x02 for right and left respectively. For the L command, the first byte after the command character can also be 0x01. This turns the LED inside the trap slot on. When the trap is removed from the portal, the LED turns off. The LED immediately turns back on when the trap is re-inserted back into the portal. The bytes after the LED that needs to be controlled are the RGB values. At first, I thought that the L command didn't have any miscellaneous bytes. While writing this post, I discovered that I was wrong. There is a miscellaneous byte that I have observed to be either 0x00 or 0x04. I have no idea what it does for now. This gives us the following structure:

```js
[{L | 0x4C}, (0x00 - 0x02), (0x00 - 0xFF), (0x00 - 0xFF), (0x00 - 0xFF), (0x00 | 0x04)]
```

Just like the J command, no response is expected to this command.

### Status
This is one of the most important commands of the portal, the Status command. This is what the game uses to know if figures are present on the portal. Once activated, the portal will constantly send this command, even when not requested. This way, the game can just read the packets and know if the status has changed without needing to request an update every time. The layout for this command is quite easy. As always, we start with the command character, S. After that, we get 4 bytes that are essentially used as a 32-bit array where every entry is 2 bits. The first entry is the last 2 bits of the first byte. every next entry moves 2 bits to the left. When the end of the byte is reached, it moves on to the next byte and starts with the last 2 bits again. The least significant of the 2 bits is always set when a figure is present on the portal. If the figure has just been added to the portal, both bits are set. If the figure was removed from the portal, only the most significant bit is set as a signal. After the 4 bytes comes a counter. This counter will increase by one every packet and loop around to 0x00 once it reaches 0xFF. This counter can be used to check if a command came before or after another command. This counter should be reset to 0 when the Reset command is recieved. After the counter, the final byte is 0x00 when the portal is deactivated and 0x01 when the portal is activated. This information gives us the following command:

```js
[{S | 0x53}]
```

And the following response:

```js
[{S | 0x53}, (0x00, 0xFF), (0x00, 0xFF), (0x00, 0xFF), (0x00, 0xFF), (0x00, 0xFF), (0x00 | 0x01)]
```

### The V command
This is the only command that is still a mystery to me. It can be seen when starting up Skylanders Trap Team. Previous games don't have it and I have no way of checking if Imaginators has it too. I have only ever seen it in the following form

```js
[{V | 0x56}, 0x00, 0x01, 0x3F]
```

My guess is that V stands for Version but I'm not sure. I have no idea what the function of this command is. One theory I had was that V stood for volume, but the portal doesn't actually know the volume. The game just multiplies/divides the audio data.

## corrections

### The J command
After doing more research on the J command, I have to correct some of my earlier statements. I already mentioned 0x00 and 0x02 controlling right and left respectively. However, I never mentioned the fact that you can also send 0x01 to change both sides at the same time. I have also managed to dissect the second one of the two miscellaneous bytes. The second of the bytes is the during it takes to reach the desired color. This value isn't in seconds and I don't know what it is. I just know that regardless of the value of the first byte, increasing the second byte increases the duration.

### Reset
In my previous posts, I have referred to the R command as Ready. After doing some more research, I have come to the conclusion that reset is a more applicable name. This command seems to tell the portal to reset the figures that it has loaded, essentailly rescanning for them. It's also worth noting that the portal always responds with a Status command before responding with a Reset command.

## The Wireshark dissector
As I have mentioned before, I used Wireshark to look at the packet data being sent. Although it was a vital tool in my research, I found that Wireshark lacked a way for me to see what every byte in any given command was used for. If I looked at a Wireshark packet, had to know the bytes from the top of my head or resort to my own posts. This was tedious and time-consuming. Happily, someone pointed out that Wireshark supports custom plugins that allow you to dissect commands inside Wireshark. Wireshark has [a basic page explaining dissectors](https://wiki.wireshark.org/Lua/Dissectors) and there is a [article series by Mika](https://mika-s.github.io/wireshark/lua/dissector/usb/2019/07/23/creating-a-wireshark-usb-dissector-in-lua-1.html). Sadly, these alone are not enough to write a dissector. Happily, they also have [lua API references](https://www.wireshark.org/docs/wsdg_html_chunked/wsluarm_modules.html). With all this, I started working on a dissector. The API references were a help, but I really think Wireshark should improve their dissector documentation/tooling. I used visual studio code with a Lua extension, but I kept getting warnings because the extension had no way of checking type definitions. Regardless of this, I managed to get a dissector working that, as far as I know, can dissect every command. With this dissector, I have a clear overview of how commands work and which commands I still need to give a bit of attention to. If you want to use the dissector or just take a look at it, you can check out [the dissector on github](https://github.com/mandar1jn/portal-dissector).

## What's next?
Now that I know most information about all the commands, what's next? Well, I might know all commands but as I said, I still have some work to do to verify all their functions. I also have all the toy data to uncover. Something else I'll probably work on is parsing the dissector results to, for example, generate audio files from the data being sent. And, of cource, my skylanders editor still needs a lot of work. It's currently written to do assume some conditions I cannot guarantee to be the case for other people and it's overall not user-friendly. That's something that I'm planning on working on. Either way, I'm not even close to done. With all the things I still want to do, I've only just started.

## The end
Well, congratulations for reading through this beast of a post. The closer I get to understanding everything, the more I get excited. I'll probably go and spend some time refining my knowledge of unknown bits of data in commands like J and Light. As always, the source code for this project can be found [on github](https://github.com/mandar1jn/SkylandersEditor). I wish you all the best and I hope to see you again in the next post.
