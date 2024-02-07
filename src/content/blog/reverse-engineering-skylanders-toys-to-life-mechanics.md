---
title: "Reverse engineering Skylanders' Toys-to-life mechanics"
description: "From hardware to software, this post covers everything I have managed to uncover about Skylanders' Toys-to-life mechanics."
pubDate: 2022-11-09T20:08:27+0200
imgSrc: "@assets/images/blog/skylanders-mega-post/skylanders-collection.png"
imgAlt: "My full collection of Skylanders figures placed on top of a table"
---
This is an adaptation of a paper I wrote for highschool.

# Introduction
Arthur C. Clarke once wrote: “Any sufficiently advanced technology is indistinguishable from magic”. This is exactly what Skylanders felt like for millions of kids around the world. Released on the 12th of October 2011, Skylanders: Spyro’s Adventure immediately managed to capture the hearts of children all around the world. Never before could you play with a physical toy one moment, while playing as that character depicted by the toy a few seconds later after putting it on a portal. Although not the first of its kind, Skylanders popularized what would later be called toys-to-life, selling physical toys that can be used alongside a game. This success led other companies to publish similar games in hopes of capitalizing on the success of Skylanders. This gave us games like Disney Infinity, Lego Dimensions, and Starlink: Battle for Atlas. But how does the technology behind this revolutionary game work? During my research, I will try to answer the question “How do Skylanders’ toys-to-life mechanics work?”

# Motivation
For me, this research is not only something that I am required to do but also something that has a personal meaning to it. Not only did Skylanders bring me a lot of joy as a child, but it’s also what got me interested in programming. Back then it was all magic to me, but it was magic that I hoped that I could one day understand.

This research is not all personal though. Another big aspect is preservation. As with all technology, hardware can fail. Because of this, people have developed emulators for all popular, and even some unpopular, gaming consoles. But what if, besides the console itself, a game also needs accessories that have not been reverse-engineered? Slowly but surely, these accessories will break or be thrown away. This will eventually lead to a game becoming unplayable. My goal with this research is to further expand our knowledge of how Skylanders’ toys-to-Life mechanics work and to create a basic emulation layer so that these games can be preserved and remain playable in the future.

# Scope
Given the amount of different versions of Skylanders games that exist, alongside the large number of figures and figure types released, I quickly realized that I needed to limit the scope of this project to something that I could actually manage.

All the data in this paper will be limited to the Wii version of all Skylanders games, meaning that both the normal version of Skylanders: Superchargers, any version of Skylanders: Imaginators, mobile-exclusive games, and any alternative game for the 3DS will not be discussed and that this research, specifically the parts related to portal communication, might not apply.

Nearly every Skylander game shipped with a new portal, which all have some slight differences. The Traptanium Portal, released alongside Skylanders: Trap Team has all the functions any other portal has and can be used on any game for a console with a USB port. Although commands have been verified on other portals where possible, most of the research was done on a Traptanium Portal.

# Game to portal communication
The first thing anyone who played Skylanders has encountered is the portal, a USB device that acts as an NFC reader and is responsible for every user interaction that can't be done with a normal controller. This also means that, before we even look at the Skylanders figures, we should understand the portal and its protocol.

## Previous research
Nowadays, whenever you search for "Skylanders portal protocol" the first website that you get is my own website with blog posts. Just a few months ago, this wasn't the case. Before I even started researching Skylanders, multiple people had already decided to look into the workings of the Skylanders games and their portals. At first, I assumed that their research was sound and used it as factual information. However, as my research continued and my knowledge of the portals increased, I started noticing flaws, oversights, or blatant mistakes in their research. Although I occasionally used the older research as guidance, it can be assumed that everything in this paper has either been found or independently verified by me unless stated otherwise.

## Capturing packets
The first challenge I encountered when researching the portal was how to actually read the information being sent between the portal and the game/console. My first idea was to use a USB logic analyzer to read the data being sent, but these are either wildly expensive or require me to modify my portal in some way. With these methods out of the way, I started looking for different options. This is when I remembered that Dolphin exists. Dolphin is the leading emulator for the Nintendo Wii and allows USB-passthrough, meaning that I could extract the game files from my own discs to be used within Dolphin. This allowed me to play the Skylanders games on my PC without a need for the console itself.

After getting Skylanders running I had to figure out a way to read the data being sent. Luckily, this was easily done using Wireshark and an extension called USBPCap. Wireshark is a program designed to capture and analyze data being sent over the network and USBPCap extends its capabilities to reading the communication to and from specific USB devices. With this, I could freely read all data being sent to and from the portal alongside some other useful information like timing. To make this process easier, I built a Wireshark dissector which I will discuss later.

![Data being sent to and from a Skylanders portal as seen in Wireshark when using my dissector](@assets/images/blog/skylanders-mega-post/wireshark.png)

## HID device
If you have ever used a keyboard or mouse, you have used the same type of device as the Skylanders portal. They all use a USB standard called HID (Human Interface Device). This specification describes how to send and receive packets of data, often containing human input.

Whenever I plug a portal into my PC, it shows up as a generic HID. To establish communication between a program and a portal, I needed to know what the vendor and product identifiers were. Happily, these are reported by Windows' device manager. For every Skylanders portal, the vendor ID is 0x1430 and the product ID is 0x0150. Looking at the [Windows driver vendor list](https://github.com/microsoft/Windows-driver-samples/blob/main/usb/usbview/vndrlist.h), the vendor ID does indeed map to Activision. This is also confirmed when we look at the descriptor string. The first two are "Activision" and "Spyro Porta".

Looking at the descriptors, we can see that every portal has 2 endpoints. The direction of endpoint 0 is IN and the direction of endpoint 1 is OUT. These directions are not from the perspective of the device but from the perspective of the host. In this case, that would be my PC or, when the device is being used on a console, the console. Both endpoints use the interrupt transfer type.

There is a third endpoint that is not reported by any descriptor. Every USB device is required to have a default endpoint. The purpose of this endpoint is to retrieve descriptor data, configure the device, and perform operations specific to this device. Transfers to this endpoint are called control transfers.

## Commands
The games and portals communicate with each other with what I call commands, 32 byte-long packets of data which all share some common elements. The first byte in every command dictates which command it is. This byte encodes a capital ASCII character. This first byte will from now on be referred to as the command character. Most commands can be given a name where the command character is the first character of the name.

As previously mentioned, every command is 32 bytes long. Most of this space goes unused since no command is 32 bytes long. When generating the data for a command, all bytes of the 32-byte long buffer are set to 0x00. When emulating either a portal or a console, a buffer with just the length of the data can be sent, but padding the buffer to 32 bytes is recommended for the most accurate emulation.

Command requests are sent by the game over the default endpoint as control transfers. Responses, on the other hand, are sent as interrupt transfers over endpoint 0.

Using data captured using Wireshark, I decided to plot the time between responses to see if there was a set interval at which the portals handled incoming and outgoing data.

![A point graph of the time between reponses in milliseconds](@assets/images/blog/skylanders-mega-post/response-delay-data.png)

As can be seen, there are two distinct lines around the 0.02-0.03 seconds. The median of all my data points gave me 0.020003 seconds or about 20 milliseconds. This means that the portal tries checking for incoming commands, or sending a Status response, 50 times per second, although this can vary quite a bit. The lowest time between responses was 0.000993 seconds, or 0.993 milliseconds, whilst the highest time between responses was 1.539001 seconds or 1539 milliseconds.

Although it is recommended that any device aiming to emulate a Skylanders portal adheres to the timing of 50 Hertz, all the games are fully capable of handling packets sent at a higher rate or even a slightly lower rate.

### The Activate command
One of the first commands sent by the game is the Activate command. This command is used to activate the portal and many of its features. This command should be used before any other commands with the exception of the Ready command. Although some commands will still work, others like the Query and Write command will not.

When the portal is activated, it will periodically send out Status responses even when no Status request has been sent. If the portal has not been activated, or if it has been deactivated again, Status responses will still be sent when requested. If a Deactivate request is received by a portal, all LEDs will turn off. They can be turned on again by their respective commands.

The Activate request is very simple. It is the command character followed by a boolean dictating whether to turn the portal on or off. For this boolean, and every other boolean in the communication protocol, 0x01 is true and 0x00 is false.

The response mirrors the first two bytes of the request followed by the constant bytes 0xFF and 0x77. The function of these constants is unknown.
The Color command
One of the easiest commands, but one whose effects are also the most easily visible. Except for the portal that accompanies Skylanders: Superchargers, every portal has one or more LEDs which are used to illuminate the base of the portal. By default, these LEDs cycle through a range of colors. Using this command, the color can be set to a specific color.

Just like every other command, the Color command starts with a command character, that being ‘C’. This is followed by 3 bytes. These bytes represent an RGB color, which the LEDs will be set to. If a portal has more than one LED to light up its base, both LEDs will be set to the same color.

This command is one of a few which only go one way. After receiving this command, any portal containing LEDs will set its colors. No response is sent, regardless of whether the portal has LEDs or not.

In Skylanders: Trap Team, this command is only used once when the initial connection between the portal and the game is made to set the color of both LED’s to #000000. Instead, the successor of the Color command, the J command, is used.

### The J command
As I mentioned before, the J command was introduced in Skylanders: Trap Team as a successor to the Color command.

Alongside Skylanders: Trap Team, a new portal was released called the Traptanium Portal. Alongside a lot of other cool features like a speaker and a slot for a trap figurine, the portal features a ring that lights up from two sides instead of having a single LED in the base. These LEDs can be controlled separately. This is what the J command is for.

The first argument after the command character is the side to light up. When orienting the portal so that the speaker faces towards you, an argument of 0x00 means left, and an argument of 0x02 means right. For a while, I assumed 0x01 would set both sides to the same color, but this turned out to be a mistake in my implementation of this command in my program.

The next three bytes form the RGB value that the LED should be set to and work the same as the color command.

Another new feature of the J command is the ability to fade between colors. The Color command immediately switches an LED to the designated color, whereas the J command can fade between the current and the desired color. This is what the last two bytes are for. These bytes, stored as a little-endian u16, represent how long the fade should last in milliseconds.

Unlike the Color command, the J command does require a response. This is because of the timing of the fades. The game needs to know when a command was received so it can calculate when to send the next command. The response is the command character without any additional data.

### The Light command
The Light command was introduced alongside the J command in Skylanders: Trap Team and, while it has some similarities, it does also have its unique use case: the trap light.

The Light command has a similar structure to the J command.

The first argument is the side, where 0x00 and 0x02 represent the same sides as in the J command. This time, however, there is a third “side”: the trap slot, represented by hexadecimal 0x01.

After the side, the command deviates based on which side was provided. If either left or right was specified, the next 3 bytes form an RGB color, just like in the Color and J commands. However, if the trap slot was specified, only one extra byte is provided, the brightness. The LED in the trap slot will only ever output the color white. The only thing that can be changed is the brightness.

Unlike the J command, the Light command does not have any extra arguments after the color or brightness. Both the changes to the LEDs in the base and the LED in the trap slot will happen instantaneously. This also means that the command does not need a response from the portal.

Another caveat with this command, and something that made this command incredibly difficult to reverse engineer at first, is that the light will only be on if there is currently a figure being read by the trap slot, be that a trap inserted into it or a normal figure right on top of it. If this is not the case, or if one is removed, the light will immediately turn off. The state is still stored and the light will turn on with the right brightness once the trap slot starts reading a figure again.

### The Music command
The Music command is somewhat similar to the Activate command in the sense that it activates and deactivates the speakers. This means that the structure for the request is also the same, that being the command character followed by either a 0x00 or 0x01 depending on whether the speakers need to be turned on or off.

The Music command is weird in that it does require a response, but it does not need to be instantaneous. After having sent a few activation commands, the game starts sending music data. Meanwhile, the game will keep sending more Music requests. This means that, until the portal sends a response, the game is unable to send any other commands and therefore will cease to function properly.

The response for this command still contains some mysteries. Just like the Activate command, the first two bytes mimic the request. After that, there are two more bytes in the response. The first one can be the full range 0x00 - 0xFF while the second byte is constant and set to 0x19. I have not been able to figure out the function of these bytes.
The Query command
The Query command is responsible for reading data from the figures. The request structure is as follows: start with the command character, followed by the figure index in the range 0x00-0x0F, and finally followed by the block index in the range 0x00-0x3F. For a full read, this command needs to be sent 64 times. Once for each block of data on the portal.

At this point, we would expect the response to start with a copy of the first 3 bytes of the request. In this case, however, there are some changes. It is possible that the game tries to query data from a figure index that is currently not being tracked by the portal, or that something goes wrong while reading the data. In this case, the first byte after the command character is set to 0x01. If no issues were encountered, the first byte after the command character is 0x10 plus the command character. Regardless of whether an error occurred or not, the following byte reflects the requested block index. Following this, there are 0x10 (16) more bytes. This is the data stored in the block that was requested by the game.

By sending this command 64 times, once for each block, the game will have all the data stored on a figure. 64 blocks and 16 bytes per block gives us a total of 1024 bytes, or one kilobyte, of data stored by every single figure. We will delve deeper into this data later on.

### The Ready command
The Ready command is the first command that is sent by the games. It is used to make sure that the connection to the portal works and that the device that is connected is actually a portal. Another function of this command is to determine whether the connected portal supports the game that is currently running.

The request is the most basic request there is, as it is only the command request. The response contains 2 extra bytes. The first one of those is always either 0x00 or 0x01 while the second byte can seemingly be anything from 0x00 to 0xFF. Every portal type has a different set of values for these bytes. When we send the bytes for a portal that is not supported by the game we get a warning that the portal is not supported. This tells us that these bytes either encode the features supported by a portal or directly identify a portal variant.

The Status command
The Status command is one of the most important commands because, without this, there would be no way for the games to tell whether a figure is on the portal or not. Whenever the portal is active, Status responses will automatically be sent every tick whenever no other response is queued up.

The Status request is one of the simplest as it only consists of the command character. The response on the other hand is one of, if not the most complex responses in this entire protocol. As always the response starts with the command character. This is directly followed by what I call the character status array. 

The character status array consists of 4 bytes being read as a little-endian 32-bit integer. This integer is essentially an array consisting of 16 entries where each entry is 2 bytes and index 0 is the right-most bit pair and index 15 is the left-most bit pair. Within every pair the right bit is used to represent the state and the leftmost bit is an event indicator. For the right bit, this means that it is 0b0 if no figure is present and 0b1 if a figure is present. For the left bit, this means that if the state has no changes it is set to 0b0 and when the state has changed it is set to 0b1. This essentially forms an enum as seen below.

```c
enum Status {
    NOT_PRESENT = 0b00,
    PRESENT = 0b01,
    ADDED = 0b11,
    REMOVED = 0b10
};
```

Although the protocol has always used an array with 16 entries, this does not mean that every portal is capable of handling that many figures. Some of the earlier portals can only handle four figures at a time. This was, however, not enough to handle the swappers that were introduced in Skylanders: Swap Force. These figures needed 2 chips, one for the top half and one for the bottom half. This means that, since the introduction of the swap force portal, all portals have been able to handle up to 16 figures at a time. Even this limit is nearly unreachable during normal gameplay. The game that comes closest is Skylanders: Superchargers. When using 2 swappers alongside 2 vehicles and having a trap placed in the trap slot, a total of 7 tags need to be handled by the portal. Using a magic item brings that to 8, but magic items only award decorations in Skylanders: Superchargers and can immediately be removed after use. This means that during normal gameplay the reasonable maximum is 7 tags at a time.

On the topic of swappers, these are special in the fact that one swapper takes up two indexes. Both the top and bottom of a swapper contain separate tags. These tags are read separately to allow for data retention when swapping tops and bottoms. This means that these tags also take up separate slots in the figure data array. These slots are not always sequential. It can be assumed that the pairs the game recognizes are based on the timing of when the tags were picked up by the portal.

The portal actually stores the NUID of the figure related to a certain index even after being removed. This means that if you place the first figure it will have index 0, but if you then remove it and place another figure, it will get index 1. If you then remove that figure and place the original figure back it will once again get index 0. This increase in the index continues until after index 15. If a new figure is placed on the portal after having reached index 15, the first available index will be used starting from index 0.

After the figure status array comes a byte-long counter. This counter is put in place to make sure Status responses are received in the correct order. This counter is increased every time a response is sent. This means that if the game first receives a response with the counter 0x33 telling it that a figure was removed and right after that receives a response with the counter 0x32 telling it that a figure at that index was added, it would ignore the second response. Whenever you are implementing a program that interfaces with a portal, keep in mind that the counter is only one byte long. This means that after the value 0xFF, it overflows back to 0x00. Since these are so far apart, it can be assumed that 0x00 is newer than anything in the range 0xF0 - 0xFF.

The last byte is a boolean to indicate whether or not the Ready command has been called on this portal since being plugged into the device.

### The Write command
The write command is nearly the opposite of the Query command. For the request, we start with the command byte. After that comes the index of the figure that we want to write to. Just like in the Query command, the data sent by the request is 0x10 + index. This is followed by the block index and finally the 16 bytes of data that need to be written to the block.

The response mirrors the command character and the block index, but not the figure index. This means that the byte between these two is always set to 0. The data being written to the figure is also not being mirrored by the response.

To be absolutely sure that the data was written correctly, the game immediately queries the block that was just written to. If the returned data does not match what was expected, the game writes the data again. This repeats until the queried data matches the data being written.

## Music data
After I discovered the Music command, my next order of business was figuring out how audio data was being sent, if at all. The other possibility I considered was all audio was stored on the portal itself and the music command just sent the ID for the correct audio clip. However, after thinking about the added complexity of needing to store a large number of audio clips in different languages on a portal, I realized the data would probably be streamed from the game disk itself. After looking at my Wireshark capture of a moment when the portal was playing sounds, I noticed a lot of data was being sent from the game to the portal without ever being responded to right after the music command was sent. This data was being sent in blocks of 64 bytes, the maximum set for every endpoint on a portal. As you might remember, there is one endpoint that we have not yet discussed, that being endpoint 1, with the direction OUT, this is the endpoint that is used by the game to send audio data. Unlike the way commands are sent, audio data is sent using interrupt transfers over endpoint 1 instead of control transfers over the default endpoint.

Looking at this data didn’t tell me much. The first 4 and a half packets were all just 0’s and even after that, it all seemed like gibberish. From what I knew of audio file formats, most file formats start with a header which contains some data about the file. These headers are often marked with an ASCII string. Something like this was not present here. This told me that what was being sent was probably just the raw audio data. Another assumption I made was that the portal probably did not have a powerful processor. This means that the audio data is probably not encrypted. One of the audio formats that meets this requirement is the WAV audio format. Sadly, I was unable to decipher the exact audio type used. So, I consulted someone who goes by the alias “NefariousTechSupport”. They have a deep understanding of how the games themselves work which was a huge help at times. They told me that the audio data is indeed the data sector of a WAV file. They also specified that the audio is single channel (mono), 16-bit, and that the sample rate was 8000Hz.

With this knowledge, I ran one of my favorite songs, [Rebels of the Sun by Ben Ambergen](https://open.spotify.com/track/0lATEvmAb77iuzskkzeTT4?si=c81adf858b5b4d90), through [cloudconvert](https://cloudconvert.com). This gave me a WAV file that I could use. However, when sending the audio data in blocks of 64 bytes, all that I got was noise. I initially assumed that this meant something else was done to the audio, but I did notice volume changes in the places where I would expect it. WAV files always store their data in a little-endian format. Because of this, I assumed that I would not need to swap the bytes around. This turned out to be exactly what I needed to do. By swapping the bytes around for every byte pair, we essentially send 32 big endian u16s instead of 32 little endian u16s. It can be assumed that the portal reads these back again as little endian. Using this knowledge, [we can successfully play music on a portal](https://youtube.com/shorts/eMXLjsOEsAQ?feature=share).

# Figures
Figures are the second core part of Skylanders’ toys-to-life mechanics as they are, well, the toys. When placed on a portal, these figures will appear in the game and become playable. After you are done, you can take them to a friend's house and continue there with the data persisting between locations. But how does that work? And what data is stored on the figures? In this section, I will set out to answer all those questions.

## Tag type
One of the first things we need to know before we get started with figuring out the data being stored on a tag is what tag is actually being used inside a Skylander. Without this, it is nearly impossible to figure out any potential exploits and to write custom programs to interface with the tags. This is because, without knowing the tag type, I am unable to look up references, datasheets, or previous research into exploits for the tags.

For the longest time, the Skylanders community has assumed that MIFARE Classic EV1 1K tags have been used. There is, however, no definitive proof that this is or isn’t the case. In his talk called “Owning NFC toys I own: A case study”, Vitorio Miliano correctly concludes that the MIFARE Classic EV1 1K is indeed the closest approximation of the tag that is being used inside Skylanders. He did, however, miss a small detail that slightly further our understanding of the tags.

From [a video posted on the NXP website](https://www.nxp.com/video/nfc-brings-skylanders-spyro-action-figures-to-life-gaming-demo-at-cartes-2011:NFC-SKYLANDERS-GAMING-DEMO), we can learn that the tags used inside Skylanders are, indeed, manufactured by NXP, the same company that created the MIFARE Classic EV1 1K tag. In his talk, Vitorio Miliano shows us that, using an Android phone, the tags used in Skylanders show up as the type “TNP(P)3xxx”. If we enter the query “site:nxp.com TNP(P)3xxx” into Google, we get no result. However, if we remove the “(P)”, we get the query “site:nxp.com TNP3xxx”, then we get a single result.

![The result when entring "site:nxp.com TNP(P)3xxx" into google](@assets/images/blog/skylanders-mega-post/tnp3-search.png)

This is a slightly updated version of the document used in Vitorio Miliano’s talk. When we look for the string “TNP3xxx'' in this document, we get a single hit. That being the description of revision 3.3, stating “Update for TNP3xxx''. The date for this revision is 28-09-2011, a little under 2 months before the release of Skylanders: Spyro’s Adventure. This timeline reinforces the idea that this tag was specifically made for Skylanders. Sadly, there aren’t any more references to TNP3xxx. Looking through the document, the first thing that caught my eye was figure 1, a flowchart outlining how to identify all MIFARE card types.

Since we now know that the card used inside Skylanders is part of the MIFARE family, we can use a program like Mifare Windows Tool and a compatible NFC reader, in my case the ACR122U, to gather some more information about the tags. This immediately tells us that the UID for the tags used inside Skylanders is 4 bytes long, the ATQA is 0F 01, and the SAK is 01 in hexadecimal. Following the flowchart in figure 1, this leads us to a tag type called TagNPlay. If we take the capital letters from this name, we get TNP as in TNP3xxx. The name TagNPlay also lines up with the fact that these tags are used within figures you can use to both play with physically and play with in a game.

Sadly, there are no other references to TagNPlay, TNP3xxx, or TNP(P)3xxx on either the nxp.com site or anywhere else on the internet except for a few implementations of the MIFARE identification procedure. Sadly, this also means that there is no documentation on how the tags work, which also means that there is no actual benefit to knowing the tag type.

The flowchart divides the tags into 2 sections, one labeled “ISO 14443-3” and one labeled “ISO 14443-4”. In this context, ISO stands for International Organization of Standardization. If I wanted access to these standards, that would cost me about 200 euros each. I don’t have that kind of money for this research. Happily, the meaning of these standards in the flowchart is somewhat explained in section 1.3.1. This section explains that all cards are compliant with ISO 14443-2 and ISO 14443-3, but that only the tags in the section with the label “ISO 14443-4” are also compliant with that standard. ISO 14443-4 describes a transmission protocol. Section 1.3.1 also mentions that the tags that are only compliant with ISO 14443-3 use the MIFARE protocol. Since the TagNPlay type is also in this area, we can assume that those also utilize the MIFARE protocol.

By looking at the portal communication protocol, we already know that every tag is split into 64 blocks, all with 16 bytes of data for a total of 1024 bytes. The only other tag with this memory layout and storage size is the MIFARE Classic 1K.

More supporting evidence is that we can look up what chip was used in at least some portals to handle NFC communication. By law, any device that sends out any type of frequency needs to be certified by the Federal Communications Commission (FCC for short) before being allowed to be released in America. These procedures are documented online and can be freely accessed by anyone. Proprietary information like schematics has been marked as confidential, meaning I was unable to access it, but the internal photos are not. Although the internal photos for most of the devices are too low quality to make out any text, the internal photos for the portal released alongside Skylanders: Giants for the 3DS contains a picture dedicated to the NFC chip.

![The internals of the wireless portal for the 3DS showcasing the NFC chip](@assets/images/blog/skylanders-mega-post/internal-picture.png)
*(“84154790 Portal of Power for Nintendo 3DS Teardown Internal Photos Activision Publishing”)*

Although the print is slightly damaged, we can still clearly read the name “MFRC53001T'' alongside the NXP logo. Although the datasheet for this chip is no longer available on the NXP website, looking up the “MFRC53001T datasheet” gives us several websites where the archived datasheet can be freely accessed. Most of the datasheet documents internal workings and is not interesting to us, but the very first page states “The MFRC530 supports all variants of the MIFARE Classic, MIFARE 1K and MIFARE 4K RF identification protocols” (MFRC530 datasheet revision 3.3, 2010).

At this point, we can be quite sure that TagNPlay tags are just MIFARE Classic 1K tags in disguise. With this knowledge, I decided to buy so-called magic MIFARE Classic 1K cards. With these cards, you can write to blocks that would otherwise always be write-locked. With this, we can change the way these cards identify themselves to line up with the way that Skylanders tags identify themselves. After this is done and we place a tag on the portal, instead of not reacting to it at all, we now get a message that something is wrong with the figure. At no point in my research have I had issues with using these magic cards as ways to test data. So, for the rest of this research, I will work under the assumption that the TagNPlay tags used inside Skylanders are just obfuscated MIFARE Classic 1K EV1 tags.

## Data
Just as important as the portal protocol is the data being stored on the figures. This tells the game what figure is present. According to the Skylanders Toy FAQ, the following data, alongside other things, is stored on the figure:
* Experience points
* Nickname
* Owner
* Gold
* Quests completed
* Treasures
* Currently equipped Hats and Trinkets
* Stat boosts
* Skill upgrades

Along with the list of things stored on a Skylander, it also lists when data is being written to a Skylander. This happens whenever:
* 30 seconds have passed since the last write
* A Skylander gains a level
* 100 gold pieces have been collected by a Skylander
* A Skylander gets a skill upgrade
* The currently equipped Hat or Trinket equipped by a Skylander is changed
* The owner of a Skylander is changed
* The nickname of a Skylander is changed
* A Skylander is reset
* A Skylander is placed on a portal for the first time
* A Skylander gets a stat boost after completing a challenge
*(Skylanders Toy FAQ)*

At some point during my research, the Skylanders Toy FAQ website started returning an error page, presumably because it was intentionally removed from the site by Activision. An archived version of the FAQ can be found at https://web.archive.org/web/20220525044625/https://support.activision.com/articles/skylanders-toy-faq. 

Knowing what data is stored on a figure saves us a lot of work when deciphering the figure data since we already know some things that we can look for.

Since we know what tag the tags inside Skylanders are based on, we also have some more information about the data being stored on the tag. From the portal protocol we already knew that there were 64 blocks of data. What we now know is that these blocks are split into pairs of 4, forming 16 sectors.

### Endianness
In computer science, the endianness of a number refers to the order in which the bytes are stored. A number can be stored either in little-endian or big-endian. In the little-endian configuration, bytes are stored in order from least significant to most significant while in big-endian format, bytes are stored in order from most significant to least significant. Formats like hexadecimal always show numbers in big-endian format, while most desktop processors store data in little-endian format. A representation of how both formats store the number 0x54FEBA96 can be seen below:

| Type          | Byte 0 | Byte 1 | Byte 2 | Byte 3 |
| ------------- | ------ | ------ | ------ | ------ |
| Little-endian | 0x96   | 0xBA   | 0xFE   | 0x54   |
| Big-endian    | 0x54   | 0xFE   | 0xBA   | 0x96   |

Unless stated otherwise, it should be assumed that data stored on the figures is in the little-endian format.

### Sector Trailer
As mentioned before, every figure is split up into 16 sectors, each consisting of 4 blocks of data. The last block of every sector is called the Sector Trailer according to the [Mifare Classic 1K datasheet](https://www.nxp.com/docs/en/data-sheet/MF1S50YYX_V1.pdf). Using a program like my own SkylandersToolkit, we can use a real portal to view all the data on the portal and see what these sector trailers look like on a Skylander.

On every Skylander, the sector trailer of block 0 is set to all 0’s, except the middle four bytes. These are set to *0F 0F 0F 69*. On every other block, these four bytes are set to *7F 0F 08 69*. The rest is still all 0’s. Sector trailers are split into 3 parts. Key A, Access bits, and Key B.

#### Access Bits
In the middle of both keys, there is a set of 4 bytes called the Access Bits. These are meant to indicate what keys are required to perform certain actions like reading and writing to a block.

![A diagram of the access conditions for a data sector](@assets/images/blog/skylanders-mega-post/internal-picture.png)
*(“MIFARE Classic EV1 1K - Mainstream Contactless Smart Card IC for Fast and Easy Solution Development”)*

In the figure above, you can see that the first 3 bytes are responsible for the actual access rules, while the last byte is called “user data”. This byte is always set to 0x69 and does not seem to be used.

For the first three bytes, we can see that every bit has the name Cn<sub>x</sub> with the constraints 1 ≤ n ≤ 3 and 0 ≤ x ≤ 4. Every pair of bits that share the same x and contain the full range of n together form an access rule that applies to block x, where x is the offset from the start of the sector. So, bit 1 of block 2 (offset 1) would be C1<sub>1</sub>. Every bit also has a counterpart with a line above it. These are the inverted versions of the one without a line above it. So, if C1<sub>1</sub> is set to 1, then <span style="text-decoration: overline">C1</span><sub>1</sub> should be set to 0.

Using table 7 from the datasheet, we can infer the access rules for the sector trailer block in a sector. The binary sequence for the sector trailer block is *0 1 0*. This tells us that key A can neither be read nor written to and both the access bits and key B can be read using key A, but can never be written to.

Although key B being readable seems like a vulnerability, it is not. The first reason for this is that we still need to know key A to read key B and, as we will later find out, we need either key A or key B for every operation. This means that to read key B, we already need to have a key that can be used for every operation on a normal block. Another reason that being able to read key B is not an issue is that we can not use it to authenticate with. Below table 8, there is a note that says “If key B may be read in the corresponding Sector Trailer it cannot serve for authentication”. Every other block shares the same sequence of access bits, being *0 0 0*. We can look these up in table 8 and see that this means that we should be able to perform any action on a block using either key A or key B. But, because key B is readable, we are only allowed to use key A.

As I mentioned before, the first sector of every figure has a different set of access bits. There is, however, something off about this sequence of access bits. They are invalid. If we look at the access bits for block 0, we can see that those are *1 1 0*. Although this is a different configuration, it’s still a valid one. When we start looking at the inverted bits, things start to fall apart. We would expect these to be *0 0 1*. However, they are set to *1 0 1*. This means that these access bits are invalid.

In the datasheet, under 8.7.1, we can see the following remark: “With each memory access the internal logic verifies the format of the access conditions. If it detects a format violation the whole sector is irreversibly blocked.”. This means that, while we can still read the sector, we are unable to write to it under any circumstances. As we’ll find out later, this was done as a clever way to block tinkerers from modifying which character a figure identifies as.

#### Key A
As we just discovered, key A is what is used to read and write to Skylanders. Since the portal needs to be able to read from the figures, we can assume that the keys are mathematically derived from some data on the tag, or that the keys are constant for every figure. When key A is being read by any reader, its value is set to 0. This is because, as we previously discovered, the access bits forbid reading key A. This means that we can’t infer key A by looking at the communication between the portal and the game.

When looking into the MIFARE classic tags, I found that there are several exploits that can be used to find the keys for MIFARE tags using only a single key. While we don’t have a key, it is possible that Activision used a default key that would show up in a key list. Sure enough, when I try to read a figure using Mifare Windows Tool using the std and extended-std key lists, we get a hit for the key of sector 0. For every figure, key A for sector 0 is set to the constant *4B 0B 20 10 7C CB*. Converted to decimals, this is *82511154674891*, which is the product of the prime numbers *73*, *2017* and *560,381,651*.

Using this key, Mifare Windows Tool can extrapolate the keys for every other sector on a figure. These are, however, different between every figure. So, it can be assumed that there is an algorithm that can be used to calculate the keys for every block. Thankfully, someone has done previous research into the algorithm behind calculating the key A for every sector. On NFC.toys, Vitorio Miliano presents the following [cleanroom](https://en.wikipedia.org/wiki/Clean_room_design) description of the algorithm used to calculate the key A for every sector:
> The key A for sector 0 is always the 6-byte (12-character) hexadecimal representation of the integer computed by the multiplication of the three prime numbers 73 and 2017 and 560,381,651
>
> For all other sectors, let a big-endian, most-significant-bit first, 48-bit CRC computation use the ECMA-182 polynomial of 0x42f0e1eba9ea3693, and not be reflected or reversed or have a final register XOR value; this is equivalent to a CRC64-ECMA-182 with left shift, MSB check and remainder trim reduced from 64 to 48 bits
>
> Let the initial value of the CRC48 register be the value of the integer computed by the multiplication of the five prime numbers 2 and 2 and 3 and 1103 and 12,868,356,821
>
> Compute the CRC48 of the 5 bytes encoded by the 10-character hexadecimal concatenation of the UID and the sector number in hexadecimal
The key A for that sector is 6 bytes, represented in hexadecimal as 12 characters: the result of the CRC48 with the hexadecimal bytes' order reversed

*(Owning NFC Toys I Own: A Case Study)*

When applied to figures I own, this algorithm does indeed result in the correct key A’s for every sector.

A sample implementation of this algorithm can be found in Appendix A.

#### Key B
The process for finding key B is a lot simpler than finding key A. We already know that key B should be readable using key A. This means that the 0’s we saw when intercepting portal communication are indeed key B. It is possible that the portal strips these bytes out, but when using Mifare Windows Tools to dump all the data off of a tag using our freshly generated key A’s, we get the same results. Therefore, we can conclude that all bytes of key B are indeed set to 0.

### Cryptography
Although that would make my life a lot easier, the basic function of the tag is not the only part where cryptography is used. The parts of data stored on the tags also contain a considerable amount of cryptographic data. There are 2 types of cryptography used by the games, those being encryption and checksums.

#### Encryption
Skylanders figures utilize encryption to make it harder to modify the data that is stored on them. My method of research did not include reverse engineering or decompiling the games themselves, meaning that deciphering this encryption method would have been nearly impossible for me to crack with my current level of knowledge. Luckily, one of the earlier research documents that I have mentioned previously does contain a description of the encryption algorithm used.

> Every block from 0x08 onward (with the exception of the access control
blocks) is encrypted using a key unique to that block. The algorithm is
128-bit AES, ECB mode and zero-byte padding. As that's a symmetric key
algorithm, the same key is used to both encrypt and decrypt.
>
> The key itself is the MD5 hash of the following 0x56 bytes:
>
> <first 0x20 bytes of sector 0> <1-byte block index> <0x35-byte constant>

*(“Skylanders RFID Protocol - Pastebin.com”)*

```c
unsigned char hashConst[] = {
	0x20, 0x43, 0x6F, 0x70, 0x79, 0x72, 0x69, 0x67, 0x68, 0x74, 0x20, 0x28, 0x43, 0x29, 0x20, 0x32, // Copyright (C) 2
	0x30, 0x31, 0x30, 0x20, 0x41, 0x63, 0x74, 0x69, 0x76, 0x69, 0x73, 0x69, 0x6F, 0x6E, 0x2E, 0x20, // 010 Activision.
	0x41, 0x6C, 0x6C, 0x20, 0x52, 0x69, 0x67, 0x68, 0x74, 0x73, 0x20, 0x52, 0x65, 0x73, 0x65, 0x72, // All Rights Reser
	0x76, 0x65, 0x64, 0x2E, 0x20 // ved.
};
```

If you want to use a string instead of a char table, it should be noted that the 35-byte constant’s first character is a space character. The full string is “ Copyright (C) 2010 Activision. All Rights Reserved.”.

After having tested this algorithm, it does indeed work for encrypting and decrypting figures. A sample implementation can be found in Appendix D.

#### Checksums
Checksums are all over the data being stored on Skylanders. As a game primarily targeted at young kids, it is important that everything works with as little issues as possible. This means that it is important that the game is able to detect when the data on a figure gets corrupted. This is the function of checksums. Checksums pass an array of data through some kind of algorithm and store it on the tag. When the game reads the data from a tag, it passes the same region of data through the checksum function. If these results do not match, the data has become corrupted and the game is able to handle that. There are two different checksum types used within a Skylander: BCC and CRC.

##### BCC
The first checksum you encounter is actually not one implemented by the developers, but one native to the tags used inside Skylanders. Every tag has a 4-byte long NUID. This NUID is a core part of how the tag operates and should under no circumstances be corrupted. To avoid continued operation when the NUID is corrupted, the tags employ a Block Check Character (BCC). When this BCC does not match the NUID of the tag, the tag ceases to function.

Calculating a BCC is quite simple. It’s an XOR of all bytes of the bloc you want to check. In our case, assuming the NUID is stored as an array consisting of 4 bytes, you would calculate the BCC like this: `nuid[0] ⊕ nuid[1] ⊕ nuid[2] ⊕ nuid[3]`

After the BCC has been calculated, it is stored directly after the NUID. In our case, this means that the BCC is stored in block 0 at offset 0x4.

##### CRC
Another type of checksum that is often used inside Skylanders is the Cyclic Redundancy Check (CRC). This checksum type is used inside Skylanders to validate larger blocks of data. There are a total of 5 known checksums used inside Skylanders. These are always referred to as “type X” where X can be either 0, 1, 2, 3, or 6. There are no known type 4 or 5 checksums. From now on, whenever any of these checksums are mentioned, they will be referred to by their type and not by CRC.

For all these checksums, the same algorithm is used. This algorithm is CRC-16/CCITT-FALSE. A sample implementation of this algorithm can be found in Appendix B.

### Common data
There are several types of Skylanders figures, ranging from normal Skylanders to trophies, traps, and even vehicles. These figure types have wildly different data structures. There are, however, some parts of the data that are consistent between every figure type.

#### Manufacturer data
The first block of every tag is used for data that is set by the manufacturer and can be changed by neither the developers nor the people who played the games. This data is mostly data to identify the tag and data about the place and time where the tag was manufactured.
An example of the data in a manufacturer block:
`0x2F 0x33 0xEC 0xEE 0x1E 0x81 0x01 0x0F 0xC4 0x07 0x00 0x00 0x00 0x00 0x00 0x14`

##### NUID
The first four bytes that you encounter on a tag form the NUID (Non-Unique IDentifier), a number used to distinguish between different tags of the same type. The MIFARE Classic EV1 1K supports 2 types of ID. The 4-byte NUID and the 7-byte UID (Unique IDentifier). The tags inside Skylanders are of the 4-byte NUID variant. As previously mentioned, this is directly followed by the BCC.

In the case of our example block, the NUID is *0x2F 0x33 0xEC 0xEE* and the BCC is *0x1E*.

##### SAK
The first byte after the BCC is the SAK and is always set to 0x81. This byte needs to be set to allow for the tag to be read correctly.

##### ATQA
The next two bytes after the SAK together form the ATQA which is always set to *0x01 0x0F*. Just like the SAK, the ATQA is required for the tag to be read correctly.

##### Year of production
Most of the data after the ATQA is hard to figure out. This data is set when the cards are manufactured and has no direct influence on anything in the game or in how the cards behave. Although I gave it my best shot, most of it still remains a mystery.

One thing I did notice was that the last byte seemed to be bigger with newer figures and lower with older figures. For example: my Jawbreaker, released alongside Skylanders: Trap Team, had its final byte set to 0x14 while a Dragonfire Cannon, which was released alongside Skylanders: Giants had it set to 0x12, and a trophy released alongside Skylanders: Superchargers had it set to 0x15. Since I knew that Skylanders games were released almost yearly and that the final number seemed to increase by one with every new generation of figures, I assumed that this byte was an indication of which game the tag was released for. However, when going through my collection of figures, a few instances had a byte set to the one I had begun associating with a previous game.

This is when I decided to check the years that the games were released. Sure enough, the hexadecimal representation of most bytes was the final 2 digits of the year that the games were released. But what about the numbers being one lower than expected? The most likely explanation for that is that those tags were left over from the previous game. Every Skylander uses the same tag type, so every tag that is left unused can easily be reused for the figures released alongside the next game. This brings us to the conclusion that the last byte of block 0 is the last 2 digits of the year that the tag was manufactured as a [binary-coded decimal](https://en.wikipedia.org/wiki/Binary-coded_decimal).

##### Figure ID
The games need a way to identify what figure a tag represents. I knew that this data would be in sector 0 as it’s not something that should ever change. I also knew that block 0 contains no information that is Skylander specific and that block 3 was a sector trailer. Block 2 is always empty, so it had to be stored in block 1. After having dumped two different variants of the same figure, I noticed that one 16-bit integer remained constant in block 1. This integer is stored at offset 0x00.

##### Variant ID
To find where the figure ID is stored, I used two variants of the same figure. This meant that there was a second value that tells the game what variant is currently in use.

Using the process of editing every byte until the game recognized a figure as a different variant, I found that the variant ID is a 16-bit integer stored at offset 0x0C in block 1.

After finding the location I once again went through all my figures to see if I could find any patterns. What I noticed was that figures that were released for Skylanders: Spyro’s Adventures had a variant ID of 0x0000 as stored on the tag - meaning that this is big-endian - while figures that were newly released in later games had a variant ID in the format 0xY000. As it turns out, the variant ID encoded the game which a specific variant of the figure was released for. This gives us the following enum for Y:
```c
enum VariantIDGeneration = {
  SPYROS_ADVENTURE = 0,
  GIANTS = 1,
  SWAP_FORCE = 2,
  TRAP_TEAM = 3
  SUPERCHARGERS = 4
}
```

After this, I was unable to find any more information about the variant ID. Luckily, someone I have often spoken to regarding Skylanders reverse engineering, NefariousTechsupport, was able to find more information.

When reading the integer as a big-endian value, the next character (4 bits) is a bitfield. A table can be found below:
| Bit 3                             | Bit 2                                  | Bit 1                              | Bit 0                                 |
| --------------------------------- | -------------------------------------- | ---------------------------------- | ------------------------------------- |
| Whether the variant has a wow pow | Whether the variant is a full alt deco | Whether the variant is a lightcore | Whether the variant is a supercharger |

Any number of these bits can be set at the same time.

According to NefariousTechsupport’s research, the last byte is an enum that gives the game more information about what type of variant it is exactly. This enum can be found in [this Github repository](https://github.com/NefariousTechSupport/Runes/blob/master/include/kTfbSpyroTag_DecoID.hpp).

##### Type 0 checksum
As previously mentioned, there are 5 different types of CRC checksums. Only one of these is present in every figure, the type 0 checksum. This checksum serves to verify that the data in sector 0 has not been corrupted. To calculate the type 0 checksum, take the first 0x1E bytes of the tag, so the whole of block 0 and 0xE blocks from block 1, and put them through the CRC-16 algorithm. Write the output to the last 2 bytes of block 1.

### Regular figures
#### Web codes
When opening the stats menu while using a figure in the game, you get an option to show a web code, a 10-character code with a dash in the middle which you could enter into some mobile games to get the figure there. On the figures, this code is stored as a 64-bit integer in block 1 at offset 0x04.

I found an implementation for this on Github by hegyak, but it’s a very long implementation, hard to read, and not the most efficient. So, with that, I present the first public cleanroom description of the web code algorithm:
Take as input the unsigned 64-bit integer code.
> Convert the code into an array of 10 bytes by repeatedly dividing it by 29 and storing the remainder.
>
> Create a lookup table consisting of every character in the string “23456789BCDFGHJKLMNPQRSTVWXYZ”.
>
> For every entry in the previous array, treat the value as the index in the lookup table and use this to form a new array of 10 characters
>
> Reverse the array and add a hyphen in the middle
>
> This results in an array of 11 characters which can be read as a string

A sample implementation can be found in Appendix C.

A way to turn a web code back into a u64 has not yet been found.

#### Owner ID
As mentioned in the Skylanders FAQ, Skylanders store their owner. This is so that you can choose whether or not to display possibly inappropriate nicknames when a figure’s owner is not you. By looking at the data being changed when the owner is changed, we can conclude that the owner ID is stored in block 0x6 at offset 0x00. The owner ID is 9 bytes long. It is currently unknown how the owner ID is calculated.

#### Duplicate data
Regular figures store most of their data twice. This is to make sure that if some parts become corrupted, the user will only lose a little bit of data instead of all of it. There are four data areas within a figure:
| Area | Start | End   |
| ---- | ----- | ----- |
| 0    | 0x80  | 0x10F |
| 1    | 0x240 | 0x2CF |
| 2    | 0x110 | 0x15F |
| 3    | 0x2D0 | 0x31F |

I have ordered the areas by pair instead of by order within a tag. This is because areas 2 and 3 were only introduced in Giants and therefore were not present in Spyro’s Adventure. Both areas 0 and 1 and areas 2 and 3 serve as backups for each other.

For all data stored within these data areas, the areas where it resides and the offset within that area will be given instead of within the full tag.

##### Area counters
To determine which area within an area pair is currently the primary area, every area has an area counter. When writing to a figure, the area that is currently secondary is promoted to primary. This is done by setting the area counter to the other area counter plus one. This way, the primary area switches every time any data stored in that area pair is changed.

The area counter for areas 0 and 1 is stored at offset 0x09 and the area counter for areas 2 and 3 is stored at offset 0x02. The area counter is a single byte. Just like the status counter, the game accounts for overflows by counting 0x00 as a higher value than 0xFF.

##### Checksums
As mentioned when discussing cryptography, figures contain a number of CRC-16 checksums. The type 0 checksum is used in block 0x01 and the rest is used to validate data contained within the areas. If the primary area of a pair does not match its checksum, the game will instead use the data from the secondary area, assuming that the checksums of that area do match.

Areas 0 and 1 contain multiple checksums. These are calculated in descending order, going from type 3 to type 2 to type 1. Checksums are calculated after the area counter has been increased.

###### Type 1
Stored at the offset 0x0E within areas 0 and 1, this checksum is responsible for the first block of data within those areas. This would also include the previous checksum in the new checksum. Therefore, the input for the checksum is a 0x10 byte-long array containing the first block of areas 0 or 1, where bytes 0x0E and 0x0F are replaced by the bytes 0x05 and 0x00 to serve as placeholders for the checksum.

###### Type 2
The type 2 checksum is stored at offset 0x0C within areas 0 and 1 and handles the next 4 blocks, excluding the sector trailer. The input is a 0x30 byte array consisting of the bytes with an offset within the range 0x10 - 0x4F with the exclusion of bytes 0x30 - 0x3F.

###### Type 3
The type 3 checksum is the last known checksum stored in areas 0 and 1 and is stored at offset 0xA. As input, this checksum takes a 0x110 byte long array. The first 0x30 bytes are the four blocks starting at offset 0x50, once again excluding the sector trailer.

###### Type 6
Type 6 is the last known checksum stored on a Skylanders tag. This single checksum is responsible for validating a full area. This checksum is used within areas 2 and 3 and is stored in the first block of these areas at offset 0x00.

As input, this checksum provides a byte array with a length of 0x40. This is all of the blocks contained within this area, excluding any sector trailers.

##### Experience
Experience plays a crucial role in Skylanders as it determines the level and power of a Skylander.

The level cap in Skylanders: Spyro’s Adventure is 10. In Skylanders: Giants this was increased to 15 and Skylanders: Swap Force increased it even further to 20.

Since Skylanders: Spyro’s Adventure clamped the experience value between 0 and 33000 (the experience needed for level 10), every increase in the maximum level also came with a separate experience value location. Your total experience is the sum of these 3 values.

The value introduced in SSA is a 16-bit unsigned integer stored in the first block of data areas 0 and 1 at offset 0x0. This value has a limit of 33000. If this value is higher than that and the figure is being loaded by any game after SSA, the excess will be added to the next experience value.

The value introduced in SG is a 16-bit unsigned integer, but this one is stored in the first block of data areas 2 and 3 at offset 0x5. This value has a limit of 63500. If this value is higher than that and the figure is being loaded by any game after SG, the excess will be added to the next experience value.

The value introduced in SSF is a 16-bit unsigned integer stored in the first block of data areas 2 and 3 at offset 0x8. This value has a limit of 101000. Anything above this will be removed.

A table of every level and their total required experience can be found below.
| Level | Experience |
| ----- | ---------- |
| 1     | 0          |
| 2     | 1000       |
| 3     | 2200       |
| 4     | 3800       |
| 5     | 6000       |
| 6     | 9000       |
| 7     | 13000      |
| 8     | 18200      |
| 9     | 24800      |
| 10    | 33000      |
| 11    | 42700      |
| 12    | 53900      |
| 13    | 66600      |
| 14    | 80800      |
| 15    | 96500      |
| 16    | 113700     |
| 17    | 132400     |
| 18    | 152600     |
| 19    | 174300     |
| 20    | 197500     |

##### Gold
Throughout your journey in the world of Skylanders, you’ll often collect gold. This currency can be used for upgrades or items. Since we can directly see the amount of gold we have in the game, finding where the gold value is stored was quite trivial. In the game, the value of gold has a cap of 65000. This meant that it was most likely an unsigned 16-bit integer, which has a maximum value of 65535. When I looked for the value of gold directly I got several results. But when getting a bit of extra gold and looking again, there was a single location that had matched both values. Gold is stored in the first block of data areas 0 and 1 at offset 0x3 as an unsigned 16-bit integer.

When editing a figure, it is possible to set the gold to 65535 and this will show up in the game. When purchasing an item or upgrade, the correct amount will be removed. However, when the value is above 65000 and any gold is collected, instead of going up, the gold will go down to 65000.

##### Playtime
Playtime is one of those values that you would expect to either be really hard or really easy, but it ended up just being extremely confusing. Very early on, I noticed a value that was constantly increasing between dumps of the same figure.

Stored in the first block of data areas 0 and 1 at offset 0x5, the playtime is what seems to be a signed 32-bit integer where the sign is just ignored. The playtime increases every second.

What makes this hard to figure out is the way that different games display the playtime.
* Skylanders: Spyro’s Adventure does not display playtime
* Both Skylanders: Giants and Skylanders: Trap Team displays the playtime as HOURS:MINUTES where both roll over at 60
* Skylanders: Swap Force displays the playtime as HOURS:MINUTES:SECONDS where minutes and seconds roll over at 60 and they all roll over at the same time when the playtime is halfway through its maximum value.

Since Skylanders: Swap Force displays the most values, it is the most accurate display of playtime in any game. The playtime in Skylanders: Swap Force rolls over at 2147483647 seconds. This means that the highest playtime that Skylanders: Swap Force can display is 596523:14:07, or about 68 years.

##### Hero level
The hero level can only be seen in Skylanders: Spyro’s Adventure and does not have any gameplay effects. Hero levels were obtained by playing the web game Skylanders: Universe.

The hero level is a 16-bit integer stored in data area 0 or 1 at block offset 0x5 with a local offset of 0xA.

Although you can set the value over 100, the game will never display anything higher than 100.

##### Nicknames
Every figure can have a nickname attached of at most 15 characters long. Most hexadecimal editors have a sidebar where you can see what characters the bytes translate to when assuming they are text. This made figuring out where the nickname was stored relatively easy. I assigned the nickname “AAAAAAAAAAAAAAA” to a figure, decrypted it, and finally opened that up in a hexadecimal editor.

![The hexadecimal representation of 3 blocks of data alongside the ascii representation](@assets/images/blog/skylanders-mega-post/hex-name.png)

As can be seen in the image, it was extremely obvious where the nickname was being stored.

One thing I immediately noticed was that every character had a 0x00 byte after it. Looking at the in-game keyboard, I remembered that the Skylanders games allow you to use symbols like á, é, etc. This meant that a basic 8-bit encoding like ASCII would not suffice. After testing out different text encoding options, I came to the conclusion that the encoding being used is UTF-16, stored in little-endian as always, with a null-termination character (0x0000) at the end.

The nickname is stored in areas 0 and 1, where the local offset for the first half is 0x20 and the local offset for the second half is 0x40.

##### Last placed time
These values store the last moment that the figure got placed on a portal.

When looking at the data of a figure, especially the ones where I generated the data instead of dumping them, I noticed that two lines of data were very similar. I noticed that the last 2 bytes formed a 16-bit integer which was the value 2023 and looking at the rest of the data, it turned out to be the current day.

Sure enough, when placed on a portal, this value is updated to the current date and time.

The last placed time is stored in data areas 0 and 1 at block offset 0x5 at local offset 0x0. This value is 6 bytes long where the first byte is the minute, the second byte is the hour, the third byte is the day, the fourth byte is the month and the last 2 bytes are a 16-bit integer that forms the year.

##### Last reset time
The last reset time is stored in data areas 0 and 1 at block offset 0x6 and local offset 0x0. The data is stored in the same way as the last placed time.

The last reset time is the last time that the figure was reset. If the figure has never been reset this will display the first time that the figure has been placed on a portal.

### Trophies
At some point, I got a little burnt out with the regular figures, so I decided to look into the data that is stored on trophies. These trophies were one of the new gimmicks in Skylanders: Superchargers and had two functions: unlocking new levels, and a similar function to traps. These trophies were used to capture some villains from the levels that the trophy unlocks, after which you could use them and their accompanying vehicles in races that match their types.

When I started looking at trophies, the first thing that I noticed was that both encryption and checksum types 1, 2, 3, and 6 are present on trophies and are calculated in the same way as on a normal figure.

Now that I knew this, it didn’t take long for me to discover that there is only one extra byte stored in each sector at the relative offset 0x04. This byte is a bitmap of which villains have been captured. This bitmap is slightly different between trophy variants. A table of the different bitmaps can be found here:
| Bits  | Sky trophy       | Legendary sky trophy | Land trophy     | Sea trophy          | Kaos trophy |
| ----- | ---------------- | -------------------- | --------------- | ------------------- | ----------- |
| Bit 0 | Chef Pepper Jack | Chef Pepper Jack     | Glumshanks      | Mesmeralda          | \-          |
| Bit 1 | \-               | \-                   | \-              | Captain Frightbeard | \-          |
| Bit 2 | Cluck            | Cluck                | Count Moneybone | Golden Queen        | \-          |
| Bit 3 | Wolfgang         | Wolfgang             | Compy Mage      | \-                  | \-          |
| Bit 4 | Pain-Yatta       | Pain-Yatta           | Dr. Krankcase   | Gulper              | \-          |

As you may notice, every trophy has at least one bit that is in use on one trophy but not on another. My current assumption is that this is because of differences between the racing-only variant that I own which was published for the Wii and the full game that was brought out on other consoles.

You might also have noticed that the legendary sky trophy has exactly the same villains as the regular sky trophy. When using a villain from the legendary sky trophy the game gives them the “legendary” title, but there don’t seem to be any differences in appearances or gameplay. Another trophy that behaves slightly differently from the others is the Kaos trophy. The only villain this trophy grants access to is Kaos which is always unlocked. The Kaos trophy acts more like a magic item than any of the other trophies.

### Magic items
Magic items are by far the easiest in terms of the data that they store. Magic items are figures that can be placed on the portal for a temporary boost, like a cannon that helps you defeat enemies, an elixir that heals your Skylanders, or a gate that unlocks a new level. Magic items don’t have any experience or money and can’t be given nicknames. When looking at the data of a magic item, we can see that the only data being set is the common data in the first sector and the sector trailer in every subsequent sector. Every other block is blank. This means that magic items don’t save any data that will be modified by the games.

# Validating
While all this information is useful and mostly tested, the goal of reverse engineering Skylanders was to be able to not only interface with but also emulate a Skylanders portal and the associated figures. To do this, I created or worked on several programs that allow the user to interact with or emulate a Skylanders portal. This not only helped me iron out any issues that I had incorrectly documented, but has also already allowed people to enjoy a game that is otherwise very hard to replay if you do not own a portal (anymore).

## Wireshark plugin
As previously mentioned, I used Wireshark to look at the communication between the games and the portal. By default, however, this data is quite hard to read. Luckily, Wireshark has a system for writing plugins - small pieces of code that allow you to more easily analyze the data being sent over USB. This dissector can be found on Github at [https://github.com/pop-emu/portal-dissector](https://github.com/pop-emu/portal-dissector).

## Hardware emulator
Although I felt like I had a solid understanding of how the protocol worked, I decided to put my knowledge to the ultimate test, emulating a portal. For this, I used a raspberry pi pico. This is a microcontroller that is easily programmable and already has an API that can be used to act as a USB device. Using this, I implemented the full protocol step by step. First the basic commands like Ready and Activate and then worked my way up to commands like Status, Query, and Write. In the end, I ended up with a device that, from the game's perspective, is nearly identical to a real portal. This can be found on Github at [https://github.com/pop-emu/PicoWPortal](https://github.com/pop-emu/PicoWPortal).

## Dolphin
As one of my goals was to allow for game preservation, I knew that I had to try and get a portal emulator built into the Dolphin emulator. This emulator has played a crucial role in my research, allowing me to capture data sent between the games and portals without needing to buy an extremely expensive logic analyzer. Sadly, the Dolphin USB interface layer is quite complicated and I was unable to get any type of USB emulation working. To my big surprise, only a few weeks later someone else going by the alias deReeperJosh started working on the exact same thing, using their own research and the research I had published on my website as references for [the implementation](https://github.com/dolphin-emu/dolphin/pull/11331). After about two months of discussions, improvements, and a lot of work, this got merged into Dolphin on January 24, 2023.

But this was only the start of my journey of Skylanders and Dolphin. Over the months, both me and deReeperJosh have both contributed gradual improvements to the Dolphin emulator, which can be found at [https://github.com/dolphin-emu/dolphin/pulls?q=is%3Apr+skylander+is%3Aclosed+sort%3Acreated-desc](https://github.com/dolphin-emu/dolphin/pulls?q=is%3Apr+skylander+is%3Aclosed+sort%3Acreated-desc), from [adding support for the speakers on the Trap Team portal](https://github.com/dolphin-emu/dolphin/pull/11644) to [fixing a longstanding issue with the USB emulation layer in Dolphin which occasionally caused Dolphin to crash](https://github.com/dolphin-emu/dolphin/pull/12203) when unplugging USB devices.

Since Dolphin now had the best Skylanders portal emulation, I figured I should just make Dolphin the best Skylanders emulator that there is. Previously, all you could do to play with specific figures was either use the dumped data of your own figure or generating what is essentially a brand-new figure. There was no system in place to edit the data on figures. So, I set out to add this. After a few months of work, it is now possible to [edit some of the data on Skylanders figures from within Dolphin](https://github.com/dolphin-emu/dolphin/pull/12133).

## Skylanders toolkit
Since I had to directly communicate with the portal, I created a library in C# and an accompanying console program which allowed me to send commands directly to the portal and test out new commands with an easy interface. This is also what allowed me to play audio on the portal. At some point, I got annoyed with the program that I used to interface with my NFC reader, Mifare Windows Tools, as it was unstable and hard to get working. So, I created a new console application in the same solution to allow me to interface with my NFC reader with way more ease. This bundle of libraries and console applications is what I call the Skylanders toolkit and this is what has formed the basis for all my research. The whole toolkit can be found on Github at [https://github.com/mandar1jn/SkylandersToolkit](https://github.com/mandar1jn/SkylandersToolkit).

## Web tools
While researching and working on my portal interface, I noticed that I repeatedly did a lot of actions like decrypting figures and generating access keys manually. Because of this, I decided to write some tools for my website to make my life a lot easier. This is also where the first figure generator lives. This one has been superseded by the generator in the Dolphin emulator. All the code for the web tools can be found in the Github repository for my portfolio at [https://github.com/mandar1jn/portfolio/tree/master/src/pages/skylanders](https://github.com/mandar1jn/portfolio/tree/master/src/pages/skylanders).

# Conclusion
So, to answer my initial question “How do Skylanders’ toys-to-life mechanics work?”.
For its toys-to-life mechanics, Skylanders utilizes a mixture of both well-known and novel techniques. From the HID protocol to NFC, Skylanders did it all. With the knowledge gathered here, I have laid a basis on which it has been proven that accurate, or at least accurate enough, emulation can be built to preserve the Skylanders games for the years to come, alongside tools to access in-game content that might have otherwise stayed inaccessible for a plethora of people.

It all started with the search query “skylanders portal protocol”. And now when you look that up, you don’t get half sources with wrong information, but a website dedicated to providing accurate and complete information on the Skylanders portal protocol. If you are reading this far enough in the future, this whole document might even be on there.

![The results when entering "Skylanders portal protocol" into google - my website is the first result](@assets/images/blog/skylanders-mega-post/final-query.png)

Did I achieve the goal that I mentioned in the motivation?
The short answer is yes, I did. I set out to create a basic emulation layer and I ended up creating the most accurate portal emulator known to date in the form of Dolphin alongside a built-in figure editor. Not only this, but I also published several tools and webpages that allow for easier use of the real portals and figures. Overall, the future of Skylanders preservation is looking brighter than it has ever been.

# Postface
When I started researching Skylanders, it started out as something fun to do. Just to satisfy my curiosity. Never had I imagined that I would contribute actual knowledge to the community. Over the last year and a half, I have learned so much not only about Skylanders but also the tools I used for the research itself. I have grown not only in knowledge and skills but also as a person thanks to all the amazing people I met along the way.

So, where does this leave me? My journey into the guts of Skylanders is far from over. If this research has taught me anything it’s that I have so much more to learn not only about the figures but also about computer science in general. For now, I’m taking a break from Skylanders for a while. But there is definitely more of this for me in the future.

# Acknowledgments
My thanks go out to to Winner Nombre, Jasleen (aka NefariousTechSupport), deReeperJosh, norto_, and the Skylanders community as a whole. You guys have been invaluable in helping me research, bouncing ideas back and forth and just being awesome companions in this obsession.

# Glossary
| Acronym | Description                      |
| ------- | -------------------------------- |
| NFC     | Near Field Communication         |
| NUID    | Non-Unique IDentifier            |
| Hertz   | Times per second                 |
| SAK     | Select AcKnowledge               |
| BCC     | Block Check Character            |
| ATQA    | Answer To reQuest, Type A        |
| SSA     | Skylanders: Spyro’s Adventure    |
| SG      | Skylanders: Giants               |
| SSF     | Skylanders: Swap Force           |
| STT     | Skylanders: Trap Team            |
| SSC     | Skylanders: Superchargers        |
| SSCR    | Skylanders: Superchargers Racing |

# Bibliography
* “84154790 Portal of Power for Nintendo 3DS Teardown Internal Photos Activision Publishing.” FCC, 11 Sept. 2011, [https://fccid.io/XLU84154790/Internal-Photos/84154790-Internal-photo-REV1-1548307](https://fccid.io/XLU84154790/Internal-Photos/84154790-Internal-photo-REV1-1548307).
* Owning NFC Toys I Own: A Case Study. [https://nfc.toys](https://nfc.toys).
* “Skylanders RFID Protocol - Pastebin.com.” Pastebin, [https://pastebin.com/EqtTRzeF](https://pastebin.com/EqtTRzeF).
* Skylanders Toy FAQ. [https://web.archive.org/web/20220525044625/https://support.activision.com/articles/skylanders-toy-faq](https://web.archive.org/web/20220525044625/https://support.activision.com/articles/skylanders-toy-faq).
* Tresni. “USB Protocols.” GitHub, [https://github.com/tresni/PoweredPortals/wiki/USB-Protocols](https://github.com/tresni/PoweredPortals/wiki/USB-Protocols).
* Wiki, Contributors to Skylanders. “Magic Items.” Skylanders Wiki, [https://skylanders.fandom.com/wiki/Magic_Items](https://skylanders.fandom.com/wiki/Magic_Items).
* ---. “Skylanders: Spyro’s Adventure.” Skylanders Wiki, [https://skylanders.fandom.com/wiki/Skylanders:_Spyro%27s_Adventure](https://skylanders.fandom.com/wiki/Skylanders:_Spyro%27s_Adventure).
* Wikipedia contributors. “Endianness.” Wikipedia, 11 Jan. 2024, [https://en.wikipedia.org/wiki/Endianness](https://en.wikipedia.org/wiki/Endianness).
* ---. “Skylanders.” Wikipedia, 12 Jan. 2024, [https://en.wikipedia.org/wiki/Skylanders](https://en.wikipedia.org/wiki/Skylanders).
* ---. “Toys-to-life.” Wikipedia, 4 Jan. 2024, [https://en.wikipedia.org/wiki/Toys-to-life](https://en.wikipedia.org/wiki/Toys-to-life).
* Willson, Brandon and BSides Knoxville. Hacking RFID Video Games the Crazy Way. [https://www.youtube.com/live/hhniUz5xG24?si=pou_Zuffn2q36CNX&t=19550](https://www.youtube.com/live/hhniUz5xG24?si=pou_Zuffn2q36CNX&t=19550).

## Github repositories
* Capull. “GitHub - Capull0/PortalPlugins: Python Plugins to Intercept RFID Portals, Like Skylanders, Disney Infinity ...” GitHub, [https://github.com/capull0/PortalPlugins](https://github.com/capull0/PortalPlugins).
* ---. “GitHub - Capull0/SkyDumper: Dump / Reset / Write Skylanders Images.” GitHub, [https://github.com/capull0/SkyDumper](https://github.com/capull0/SkyDumper).
* Iskuri. “GitHub - Iskuri/Portal-of-Power-Hacks: C++ Application for Messing With the Skylander’s Portal of Power, Inspired by  Silicontrip/SkyReader.” GitHub, [https://github.com/Iskuri/Portal-of-Power-Hacks](https://github.com/Iskuri/Portal-of-Power-Hacks).
* Joshuabenuck. “GitHub - Joshuabenuck/Skyflyers: A Project to Create a Wireless Connection to a Skylanders Portal of Power.” GitHub, [https://github.com/joshuabenuck/Skyflyers](https://github.com/joshuabenuck/Skyflyers).
* NefariousTechSupport. “GitHub - NefariousTechSupport/Runes.” GitHub, [https://github.com/NefariousTechSupport/Runes](https://github.com/NefariousTechSupport/Runes).
* Silicontrip. “GitHub - Silicontrip/SkyReader: A Skylander Portal Reader/Editor/Writer for OSX.” GitHub, [https://github.com/silicontrip/SkyReader](https://github.com/silicontrip/SkyReader).

## Datasheets and standards
* ACR122U Manual. [https://www.acs.com.hk/download-manual/419/API-ACR122U-2.04.pdf](https://www.acs.com.hk/download-manual/419/API-ACR122U-2.04.pdf).
* alldatasheet.com. “MFRC53001T Datasheet(PDF).” NXP Semiconductors, [https://www.alldatasheet.com/datasheet-pdf/pdf/557656/PHILIPS/MFRC53001T.html](https://www.alldatasheet.com/datasheet-pdf/pdf/557656/PHILIPS/MFRC53001T.html).
* “ISO/IEC 14443-3:2018.” ISO, [https://www.iso.org/standard/73598.html](https://www.iso.org/standard/73598.html).
* “ISO/IEC 14443-4:2018.” ISO, [https://www.iso.org/standard/73599.html](https://www.iso.org/standard/73599.html).
* “MIFARE Classic EV1 1K - Mainstream Contactless Smart Card IC for Fast and Easy Solution Development.” NXP, 23 May 2018, [https://www.nxp.com/docs/en/data-sheet/MF1S50YYX_V1.pdf](https://www.nxp.com/docs/en/data-sheet/MF1S50YYX_V1.pdf).
* NXP. MIFARE Type Identification Procedure. 10 Jan. 2023, [https://www.nxp.com/docs/en/application-note/AN10833.pdf](https://www.nxp.com/docs/en/application-note/AN10833.pdf).

# Appendix A - Sample Key A algorithm implementation
```c
u64 ComputeCRC48(std::span<const u8> data)
{
  const u64 polynomial = 0x42F0E1EBA9EA3693;
  const u64 initialRegisterValue = 2ULL * 2ULL * 3ULL * 1103ULL * 12868356821ULL;

  u64 crc = initialRegisterValue;
  for (u32 i = 0; i < data.size(); i++)
  {
    crc ^= (static_cast<u64>(data[i]) << 40);
    for (char j = 0; j < 8; j++)
    {
      if ((crc & 0x800000000000))
      {
        crc = (crc << 1) ^ polynomial;
      }
      else
      {
        crc <<= 1;
      }
    }
  }
  return crc & 0x0000FFFFFFFFFFFF;
}
u64 CalculateKeyA(u8 sector, std::span<const u8, 0x4> nuid)
{
  if (sector == 0)
  {
    return 73ULL * 2017ULL * 560381651ULL;
  }

  std::array<u8, 5> data = {nuid[0], nuid[1], nuid[2], nuid[3], sector};

  u64 bigEndianCRC = ComputeCRC48(data);
  u64 littleEndianCRC = 0;

  for (u8 i = 0; i < 6; i++)
  {
    u64 byte = (bigEndianCRC >> (i * 8)) & 0xFF;
    littleEndianCRC += byte << ((5 - i) * 8);
  }

  return littleEndianCRC;
}
```

# Appendix B - Sample CRC-16/CCITT-FALSE implementation
```c
u16 ComputeCRC16(std::span<const u8> data)
{
  const u16 polynomial = 0x1021;

  u16 crc = 0xFFFF;

  for (size_t i = 0; i < data.size(); ++i)
  {
    crc ^= data[i] << 8;

    for (size_t j = 0; j < 8; j++)
    {
      if ((src >> 15) && 0b1)
      {
        crc = (crc << 1) ^ polynomial;
      }
      else
      {
        crc <<= 1;
      }
    }
  }

  return crc;
}
```

# Appendix C - Toy code calculation
```c
std::array<u8, 11> ComputeToyCode(u64 code)
{
  std::array<u8, 10> code_bytes;
  for (size_t i = 0; i < code_bytes.size(); ++i)
  {
    code_bytes[i] = static_cast<u8>(code % 29);
    code /= 29;
  }

  static constexpr char lookup_table[] = "23456789BCDFGHJKLMNPQRSTVWXYZ";
  std::array<u8, 10> code_chars;
  for (size_t i = 0; i < code_bytes.size(); ++i)
  {
    code_chars[i] = static_cast<u8>(lookup_table[code_bytes[9 - i]]);
  }

  std::array<u8, 11> result;
  std::memcpy(&result[0], &code_chars[0], 5);
  result[5] = static_cast<u8>('-');
  std::memcpy(&result[6], &code_chars[5], 5);

  return result;
}
```

# Appendix D - Encryption and decryption
This implementation utilizes mbedtls for the implementations of the MD5 hash and AES-128 algorithm.
```c
void GenerateIncompleteHashIn(u8* dest) const
{
  std::array<u8, 0x56> hash_in = {};

  // copy first 2 blocks into hash
  GetBlock(0, hash_in.data());
  GetBlock(1, hash_in.data() + 0x10);

  // Skip 1 byte. Is a block index that needs to be set per block.

  // Byte array of ascii string " Copyright (C) 2010 Activision. All Rights Reserved.". The space at
  // the start of the string is intentional
  static constexpr std::array<u8, 0x35> HASH_CONST = {
      0x20, 0x43, 0x6F, 0x70, 0x79, 0x72, 0x69, 0x67, 0x68, 0x74, 0x20, 0x28, 0x43,   0x29,
      0x20, 0x32, 0x30, 0x31, 0x30, 0x20, 0x41, 0x63, 0x74, 0x69, 0x76, 0x69, 0x73, 0x69,
      0x6F, 0x6E, 0x2E, 0x20, 0x41, 0x6C, 0x6C, 0x20, 0x52, 0x69, 0x67, 0x68, 0x74, 0x73,
      0x20, 0x52, 0x65, 0x73, 0x65, 0x72, 0x76, 0x65, 0x64, 0x2E, 0x20};

  memcpy(hash_in.data() + 0x21, HASH_CONST.data(), HASH_CONST.size());

  memcpy(dest, hash_in.data(), 0x56);
}

void Encrypt(std::span<const u8, FIGURE_SIZE> input)
{
  std::array<u8, 0x56> hash_in = {};

  GenerateIncompleteHashIn(hash_in.data());

  std::array<u8, FIGURE_SIZE> encrypted = {};

  std::array<u8, BLOCK_SIZE> current_block = {};

  // Run for every block
  for (u8 i = 0; i < 64; ++i)
  {
    memcpy(current_block.data(), input.data() + (i * BLOCK_SIZE), BLOCK_SIZE);

    // Skip sector trailer and the first 8 blocks
    if (((i + 1) % 4 == 0) || i < 8)
    {
      memcpy(encrypted.data() + (i * BLOCK_SIZE), current_block.data(), BLOCK_SIZE);
      continue;
    }

    // Block index
    hash_in[0x20] = i;

    std::array<u8, BLOCK_SIZE> hash_out = {};

    mbedtls_md5_ret(hash_in.data(), 0x56, hash_out.data());

    mbedtls_aes_context aes_context = {};

    mbedtls_aes_setkey_enc(&aes_context, hash_out.data(), 128);

    mbedtls_aes_crypt_ecb(&aes_context, MBEDTLS_AES_ENCRYPT, current_block.data(),
                          encrypted.data() + (i * BLOCK_SIZE));
  }

  memcpy(m_data.data(), encrypted.data(), FIGURE_SIZE);
}

void SkylanderFigure::DecryptFigure(std::array<u8, FIGURE_SIZE>* dest) const
{
  std::array<u8, 0x56> hash_in = {};

  GenerateIncompleteHashIn(hash_in.data());

  std::array<u8, FIGURE_SIZE> decrypted = {};

  std::array<u8, BLOCK_SIZE> current_block = {};

  // Run for every block
  for (u8 i = 0; i < BLOCK_COUNT; ++i)
  {
    GetBlock(i, current_block.data());

    // Skip sector trailer and the first 8 blocks
    if (((i + 1) % 4 == 0) || i < 8)
    {
      memcpy(decrypted.data() + (i * BLOCK_SIZE), current_block.data(), BLOCK_SIZE);
      continue;
    }

    // Check if block is all 0
    u16 total = 0;
    for (size_t j = 0; j < BLOCK_SIZE; j++)
    {
      total += current_block[j];
    }
    if (total == 0)
    {
      continue;
    }

    // Block index
    hash_in[0x20] = i;

    std::array<u8, BLOCK_SIZE> hash_out = {};

    mbedtls_md5_ret(hash_in.data(), 0x56, hash_out.data());

    mbedtls_aes_context aes_context = {};

    mbedtls_aes_setkey_dec(&aes_context, hash_out.data(), 128);

    mbedtls_aes_crypt_ecb(&aes_context, MBEDTLS_AES_DECRYPT, current_block.data(),
                          decrypted.data() + (i * BLOCK_SIZE));
  }

  memcpy(dest->data(), decrypted.data(), FIGURE_SIZE);
}
```