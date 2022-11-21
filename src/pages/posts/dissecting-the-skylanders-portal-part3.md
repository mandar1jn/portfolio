---
layout: "../../layouts/BlogLayout.astro"
title: "Dissecting the Skylanders portal - part 3"
description: "Dissecting how the portal of power works, and how you can play with it too."
pubDate: 2022-07-02T15:07:51+0200
imgSrc: "/images/blog/skylanders-editor/runic-portal.png"
imgAlt: "A picture of the runic portal from Skylanders: Spyro's adventure"
---
In the first 2 stories, we’ve looked at the structure of a few commands. However, these commands were already documented elsewhere, and although I verified the data, nothing new was discovered. In this story, however, I will document a command that, as far as I can find, has not been documented anywhere before.

## The command

### Discovery
I actually discovered this command by accident. I had not touched Skylanders: Trap Team in a while. Me, and my little brother, decided to play it once again. And, while doing so, I noticed that the Traptanium portal had unique colors on both sides. So, I decided to boot up my tools and find out how it works.

### Finding the command
To find the command, I used dolphin to emulate the game, and USB Monitor Pro to read the data being sent to the command. Using dolphin, I started the game and booted up USB Monitor Pro.

After that, I loaded a save and placed a character on the portal. At this point, the portal starts to have different colors on both sides. Looking at USB Monitor Pro, I found the command character. That being, the character ‘J’.

### Dissecting the command
So, after I found the command character, I looked at the data recorded by USB Monitor Pro. With this, I created a command called SetColorAlternative and I ran all the commands I found to find out what they did. This resulted in the following results:

```csharp
SetColorAlternative(0x00, 0x14, 0x28, 0x14, 0xF4, 0x01) //right grey
SetColorAlternative(0x00, 0x00, 0xFF, 0x00, 0xD0, 0x07) //right green
SetColorAlternative(0x00, 0x00, 0x00, 0x00, 0x00, 0x00) //disable right side
SetColorAlternative(0x02, 0x00, 0xFF, 0x00, 0xD0, 0x07) //left green
SetColorAlternative(0x00, 0x00, 0x00, 0xFF, 0xD0, 0x07) //right blue
SetColorAlternative(0x02, 0xFF, 0x00, 0x00, 0xD0, 0x07) //left red
SetColorAlternative(0x00, 0xFF, 0x00, 0x00, 0xD0, 0x07) //right red
SetColorAlternative(0x00, 0x64, 0x3C, 0x64, 0xF4, 0x01) //right pink
```

The first thing I looked at was the side. What I discovered, is that the first byte after the command character is the side where the right is 0x00 and the left is 0x02. Then, I started looking at the colors. Specifically, the primary colors. With this, I found that the second, third, and fourth bytes after the command character represents the colors as an RGB value. The last two bytes are the duration to fade from the original color to the target color. Sadly, I don’t know the correct way to calculate the duration. Just know that a bigger number Is a longer duration.

This all leads to a final command structure:

```js
['J', (0x00 | 0x02), (0x00 - 0xFF), (0x00 - 0xFF), (0x00 - 0xFF), (0x00 - 0xFF), (0x00 - 0xFF)]
```

## The editor
Although dissecting this command took some time, it was not the main reason why this story took so long. As my goal is to make editing Skylanders as accessible as possible, I decided to start working on a visual editor so I don’t have to refactor all my code to work with this later on. This also required some changes to the way my project was set up. For the rendering of the application, I used [Raylib](https://github.com/raysan5/raylib) and [Raygui](https://github.com/raysan5/raygui)

![A screenshot of the editor in its current state](/images/blog/skylanders-editor/editor-raylib.png)

As you can see, this is still very much a work in progress. Currently, you can connect to the portal and you can set the color. My next goal is to add the ability to set the color of either side and to add some debug features to the editor.

As always, the source for this project can be found [on github](https://github.com/mandar1jn/SkylandersEditor).