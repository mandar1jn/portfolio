type Color = {
	red: number;
	green: number;
	blue: number;
}

export interface Tag{
	name: string;
	backgroundColor: Color;
	textColor: Color;
}

export const UnityTag = {name: "Unity", backgroundColor: {red: 149, green: 149, blue: 149}, textColor: {red: 0, green: 0, blue: 0}};