---
layout: "../../layouts/BlogLayout.astro"
title: "Dissecting the Skylanders portal - part 2"
description: "Dissecting how the portal of power works, and how you can play with it too."
pubDate: 2022-06-25T16:20:12+0200
imgSrc: "/images/blog/skylanders-editor/runic-portal.png"
imgAlt: "A picture of the runic portal from Skylanders: Spyro's adventure"
---
In part 2 of this series, I will be looking at writing to the portal and also give some more information on how it works.

Before we begin, I’d quickly like to note that this article will be a bit more technical than part one. I’ve tried to write everything as simple as I could, but it might still be a bit challenging to understand if you do not have a background in Computer Science.

When I started trying to write to the portal, I thought it would be a piece of cake. HIDAPI has a built-in function called hid_write. Sadly, this function does not work with the portal. For some reason, it always returns an error related to overlapping I/O (Input/Output) operations. So, although I mostly want to rely on my own code, I looked at some other projects. Looking at [SkyDumper](https://github.com/capull0/SkyDumper), I noticed the hid_write function had been modified. And, sure enough, when I modified it myself, it worked flawlessly. This, however, required me to think about how I wanted to structure my project. Until this point, I had used HIDAPI as a submodule so that I could easily update it. Submodules, however, don’t synchronize changes made to them locally. I didn’t want to have to maintain my own fork of HIDAPI, so I decided to make 2 separate functions to write to the portal. In my portal class, I have a function called Write. When compiled for windows, it runs the code that normally would be in the modified hid_write function. The code for the modified Write function can be found [here](https://github.com/mandar1jn/SkylandersEditor/blob/9da6a7430a46781e6af4616599b4ef4651b3a7b0/SkylandersEditor/src/Portal.cpp#L13-L54)\. If it’s on any other platform, it just runs the default hid_write function. For now, my main focus on this project will be on windows, but I might try and get it to work on Linux and macOS at a later date.

So, let’s now take a look at how to write to the portal. The portal has 2 endpoints. An endpoint for portal-to-host (IN) and an endpoint for host-to-portal (OUT). The host here is the device the portal is connected to. Both the IN- and the OUT-endpoint take an unsigned (non-negative) byte array with a maximum of 0x20 (32) bytes. For the IN-endpoint, a full array is sent. For the OUT-endpoint, however, it is allowed to only fill the array until the final non-zero byte. It is also allowed to apply zero padding to the array.

When using HIDAPI, the array should be one byte longer. This is because the 0th byte of the array is the report number. The portal does not support multiple reports so this should always be zero.

The portal has 2 internal states. Activated and deactivated. From what I can gather until now, all commands will be handled and responded to properly in both states. There are only 2 differences. The first difference is that the light inside the portal will turn off. This can, however, be turned on again using the color command without actually activating the portal. The other difference is one that the average user won’t notice. While in an activated state, the portal constantly sends out status data. When deactivated, it will stop sending these packets until the portal is enabled again.

Now for the array structure. Note that all the following array layouts will not contain the report number for simplicity. When using HIDAPI, append a 0 to the beginning of the array. Commands being sent from the portal will also not be zero-padded in this story.

The structure of the commands is very simple. It’s the command followed by the required data. For example, a activate command would look as follows:

    [{A | 0x41}, (0x00 | 0x01)]

Let’s break down this annotation. The square brackets at the beginning and end indicate that this is an array. After that, we have the curly brackets. These stand for an alternate annotation. The commands themselves are single characters, but I decided to also note the hexadecimal annotation. The different notations are split by a vertical line. After that, we have a comma. This is just to indicate that we increase our position within the array by one. After that, we have two regular brackets. This means the data at that point in the array can be one of the options given. Just like with the curly brackets, these options are also split by a vertical line.

When writing your code for the portal, it is important to note that it might not immediately respond to your commands. When in an activated state, reading data from the IN-endpoint might result in status data first. Because of this, I recommend continuously reading from the device until it responds with the same command code.

## The first commands
The portal has a plethora of commands, but in this story, I will document the first three.

### Ready
This command might not seem much, but it does have a use. This command is used to poll whether the portal is ready to receive data. When no response is given, assume the portal is either not connected or your code does something wrong. The response to the command also contains the device ID. The command layout goes as follows:

    [{R | 0x52}]

Yes. As I said, this command does not seem much. The only data being sent is the command. No data is appended. The response, as said before, contains the device type. I don’t own multiple portals, but [RPCS3](https://rpcs3.net) has a portal emulation feature that emulates a traptanium portal, and, looking [here](https://github.com/Desterly/rpcs3/blob/master/rpcs3/Emu/Io/Skylander.cpp#L294), they use the same ID as my traptanium portal. So, without any further ado, here is the response to the ready command:

    [{R | 0x52}, (0x01 | 0x02), (0x3D | 0x18 | 0x0A)}

As you can see, the 2 bytes after the command character can be several different options. Sadly, I only own 3 portals so I can’t document the others. If you do happen to own a portal outside of the runic portal from Skylanders giants, the traptanium portal, or the engine portal (that works on consoles), please let me know. If you have a wireless version of any of these portals (that works on consoles), please feel free to contact me. The portal types I found until now are:

<table>
	<thead>
		<tr>
			<th>Type</th>
			<th>ID</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>runic (wired)</td>
			<td>0x01, 0x3D</td>
		</tr>
		<tr>
			<td>traptanium</td>
			<td>0x02, 0x18</td>
		</tr>
		<tr>
			<td>rift engine</td>
			<td>0x02, 0x0A</td>
		</tr>
	</tbody>
</table>

### Activate
The activate command is another relatively simple command, with only one option.

    [{A | 0x41}, (0x00, 0x01)]

This command is quite self-explanatory. The first byte is the command character and the second byte is what I will refer to as the activation byte. The activation byte can either be 0x00 (deactivate), or 0x01 (activate).

So, now for the response:

    [{A | 0x41}, (0x00 | 0x01), 0xFF, 0x77]

As you can see, the first and second bytes mirror the command character and activation byte. The third and fourth characters, however, are a mystery to me. For all my portals, they returned the same result. More research into portal variants might be needed.

### Color
Outside of the activate command, this is the only command that has a visible effect on the portal. This command can also control the portal color when the portal is deactivated. On portals that don’t have any lights, like the rift engine portal, this command is silently ignored. Because of this, and the fact that the command has no effect on the data being sent, you should not await a response for this command.

    [{C | 0x43}, (0x00 - 0xFF), (0x00 - 0xFF),(0x00 - 0xFF)]

First of all, I’d like to point out a new way of annotating possible bytes. Here, you will see two bytes split by a hyphen (-). This is used to annotate a range. In this case, a range of 0x00 up until and including 0xFF.

So, now, what do these bytes stand for? Well, the first byte is of course the command byte. In this case, that is ‘C’. The 2nd, 3rd, and 4th bytes are an RGB color. Where the 2nd byte is the red color, the 3rd byte is the green color, and the 4th byte is the blue color. Together, these can be used to form a color.

As I said before, you should not await a response for this command. The portal does, however, send a response when lights are available. Because of this, I did decide to document it. To response is as follows:

    [{C | 0x43}, (0x00 - 0xFF), (0x00 - 0xFF),(0x00 - 0xFF)]

That’s right. The response is the exact same as the original command. No interesting or required data is being sent.

## Conclusion
Well, that was that for this story. I hope you find this stuff just as interesting as I do. You can, once again, find the source code for this project [here](https://github.com/mandar1jn/SkylandersEditor).