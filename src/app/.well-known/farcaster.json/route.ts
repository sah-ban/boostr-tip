export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjI2ODQzOCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDIxODA4RUUzMjBlREY2NGMwMTlBNmJiMEY3RTRiRkIzZDYyRjA2RWMifQ",
      payload: "eyJkb21haW4iOiJwLml0c2Nhc2hsZXNzLmNvbSJ9",
      signature:
        "zbq4XS/yMz+cxl1BK/e4JzK8PTJjZGVQkfQiBTr2IQVNt9tDWHPrLrTpamej1X1XfybjJTFbO8XbFAGsaEip2xw=",
    },
    frame: {
      version: "1",
      name: "BOOSTR Tip Tracker",
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/ogImage.png`,
      buttonTitle: "Open Tracker",
      splashImageUrl: `${appUrl}/splash-new.png`,
      splashBackgroundColor: "#0f172a",
      webhookUrl: `${appUrl}/webhook`,
      subtitle: "Track BOOSTR tips and stats",
      description: "Farcaster Mini App for BOOSTR tipping leaderboards and allowances",
      primaryCategory: "utility",
      ogImageUrl: `${appUrl}/ogImage.png`,
      tags: ["boostr", "tips", "leaderboard", "allowance"],
      heroImageUrl: `${appUrl}/ogImage.png`,
      tagline: "Reward casts with BOOSTR",
      ogTitle: "BOOSTR Tip Tracker",
      ogDescription: "Farcaster Mini App for BOOSTR tipping leaderboards and allowances",
    },
  };

  return Response.json(config);
}
