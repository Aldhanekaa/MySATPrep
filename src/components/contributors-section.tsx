import { Contributor, GitHubUser, members } from "@/lib/contributors";

async function fetchGitHubUser(username: string): Promise<GitHubUser | null> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "MySATPrep",
      },
      cache: "force-cache",
      next: { revalidate: 86400 },

      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

export default async function ContributorsSection() {
  const contributors = await Promise.all(
    members.map(async (member) => {
      const githubUser = await fetchGitHubUser(member.username);

      return {
        ...member,
        avatar:
          githubUser?.avatar_url ??
          `https://github.com/${member.username}.png?size=460`,
        displayName: githubUser?.name ?? githubUser?.login ?? member.username,
        profileUrl:
          githubUser?.html_url ?? `https://github.com/${member.username}`,
      };
    }),
  );

  return (
    <section className="py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-8  md:mb-16 pr-32">
          <h2 className=" text-4xl font-bold lg:text-5xl mb-4 ">
            Contributors
          </h2>
          <p>
            Want to be featured? Visit our{" "}
            <a
              href="https://github.com/aldhanekaa/MySATPrep/"
              className="text-blue-500 hover:underline"
            >
              open source GitHub repository
            </a>{" "}
            and make contributinos by reporting issues on the GitHub or making
            pull requests. <br />
            <br />
            We welcome all contributions, big or small, and are grateful for the
            support of our community!
          </p>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-4 border-t py-6 md:grid-cols-3">
            {contributors.map((member) => (
              <div key={member.username}>
                <a
                  href={member.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <div className="bg-background size-20 rounded-full border p-0.5 shadow shadow-zinc-950/5">
                    <img
                      className="aspect-square rounded-full object-cover"
                      src={member.avatar}
                      alt={member.displayName}
                      height="700"
                      width="700"
                      loading="lazy"
                    />
                  </div>
                </a>
                <span className="mt-2 block text-sm">{member.displayName}</span>
                <span className="text-muted-foreground block text-xs">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
