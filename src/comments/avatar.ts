export type CommentAvatar = {
  emoji: string;
  bg: string;
};

const animals = [
  "🐻",
  "🐰",
  "🐱",
  "🐶",
  "🐼",
  "🦊",
  "🐸",
  "🐯",
  "🐹",
  "🐭",
  "🐮",
  "🐷",
  "🐵",
  "🐧",
  "🐥",
  "🦁",
  "🦄",
  "🦝",
  "🦔",
  "🦦",
];

const backgrounds = [
  "#ffd5c2",
  "#c9f2df",
  "#fff1a8",
  "#ded7ff",
  "#cfefff",
  "#ffc8dd",
];

const animalNames: Record<string, string> = {
  "🐻": "곰돌이",
  "🐰": "토깽이",
  "🐱": "냥냥이",
  "🐶": "가나디",
  "🐼": "판다",
  "🦊": "여우",
  "🐸": "개굴이",
  "🐯": "호랭이",
  "🐹": "햄스터",
  "🐭": "찍찍이",
  "🐮": "소",
  "🐷": "꿀꿀이",
  "🐵": "원숭이",
  "🐧": "펭귄",
  "🐥": "삐약이",
  "🦁": "어흥이",
  "🦄": "유니콘",
  "🦝": "너굴이",
  "🦔": "고순이",
  "🦦": "수달",
};

const backgroundNames: Record<string, string> = {
  "#ffd5c2": "달콤한",
  "#c9f2df": "청량한",
  "#fff1a8": "노란빛",
  "#ded7ff": "보라빛",
  "#cfefff": "하늘하늘한",
  "#ffc8dd": "분홍빛",
};

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function randomCommentAvatar(): CommentAvatar {
  return {
    emoji: pick(animals),
    bg: pick(backgrounds),
  };
}

export function commentAvatarName(avatar: CommentAvatar): string {
  return `${backgroundNames[avatar.bg] || "파스텔색"} ${animalNames[avatar.emoji] || "동물"}`;
}
