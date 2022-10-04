type Color = {
	red: number;
	green: number;
	blue: number;
}

export interface ProjectTag{
	name: string;
	backgroundColor: Color;
	textColor: Color;
}

const CTag = {name: "C", backgroundColor: {red: 40, green: 53, blue: 174}, textColor: {red: 255, green: 255, blue: 255}};
const RaylibTag = {name: "Raylib", backgroundColor: {red: 245, green: 245, blue: 245}, textColor: {red: 0, green: 0, blue: 0}};
const WebAssemblyTag = {name: "WebAssembly", backgroundColor: {red: 101, green: 79, blue: 240}, textColor: {red: 255, green: 255, blue: 255}};

export const tags: Record<string, ProjectTag> = {
	"c": CTag,
	"raylib": RaylibTag,
	"webassembly": WebAssemblyTag
}