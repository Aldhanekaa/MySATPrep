export type Contributor = {
  username: string;
  role: string;
};

export type GitHubUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
};

export const members: Contributor[] = [
  {
    username: "aldhanekaa",
    role: "Creator",
  },
  {
    username: "cjspd-oly",
    role: "Community Helper & Bug Reporter",
  },
];
