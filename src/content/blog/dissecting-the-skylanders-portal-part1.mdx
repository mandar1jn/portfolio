---
title: "Dissecting the Skylanders portal - part 1"
description: "Dissecting how the portal of power works, and how you can play with it too."
pubDate: 2022-06-24T13:08:45+0200
imgSrc: "/images/blog/skylanders-editor/runic-portal.png"
imgAlt: "A picture of the runic portal from Skylanders: Spyro's adventure"
---
If you’ve paid any attention to gaming over the last decade, you have probably heard of them. Skylanders. The plastic figurines that accompany the game with the same name. But how does the game recognize them? And how can we communicate with them? In this series of articles, I’m planning to find out.

The game reads the figures through a portal of power. A USB-powered device that reads the data from the figures.

## Research
Before I go and do my own research, I decided to google around to see if I could find some earlier research. And sure enough, I found some. A quick google search for “Skylanders portal protocol” gives us the following result:
- [https://github.com/tresni/PoweredPortals/wiki/USB-Protocols](https://github.com/tresni/PoweredPortals/wiki/USB-Protocols)
- [https://pastebin.com/EqtTRzeF](https://pastebin.com/EqtTRzeF)

Sadly, there are several problems with these documents. The first problem is that they document features for, at the latest, the Skylanders swap force portal. My goal is to create a sandbox that can interact with any portal and all features of these portals. This means I will need to do my own research on how to control the speakers of the trap team portal. Another issue is that these documents only describe the data layout for the Skylanders. So, I will need to figure out the layout for the vehicles, traps, magic items, and imagination crystals. I will also need to find the layout for the sensei Skylanders since they seem to be extra encrypted. And the final problem is: that these documents don’t describe how to communicate with the portal itself. They describe the possible commands, but not what type of communication to use. So, that will be next on my list.

## Communicating with the portal
The first document I linked, references a Github repository called [SkyReader](https://github.com/silicontrip/SkyReader). From what I can gather from there, the portal is an HID (Human Interface Device). So, with this knowledge, I started writing some code. For this project, I will be using [HIDAPI](https://github.com/libusb/hidapi). For this to work, I needed two things: a vendor ID and a product ID. These are universal for all portals and are 0x1430 and 0x0150 respectively. With this knowledge, I was able to connect to the device and read the data being sent. The portal continuously sends status packets that we can read and act on. Sadly, I struggled a bit more with actually sending data to the device, but I will come back to that in part 2.

For now, I hope you found this interesting. If you have any feedback, please contact me. The source code for this whole project can also be found on [Github](https://github.com/mandar1jn/SkylandersEditor).