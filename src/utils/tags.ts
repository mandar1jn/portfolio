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
const CSharpTag = {name: "C#", backgroundColor: {red: 0, green: 148, blue: 4}, textColor: {red: 255, green: 255, blue: 255}}
const TypescriptTag = {name: "typescript", backgroundColor: {red: 0, green: 122, blue: 204}, textColor: {red: 255, green: 255, blue: 255}}

export const tags: {[key: string]: ProjectTag;} = {
	"c": CTag,
	"raylib": RaylibTag,
	"webassembly": WebAssemblyTag,
	"c#": CSharpTag,
	"typescript": TypescriptTag
}