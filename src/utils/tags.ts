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

export const UnityTag = {name: "Unity", backgroundColor: {red: 5, green: 5, blue: 5}, textColor: {red: 50, green: 50, blue: 50}};