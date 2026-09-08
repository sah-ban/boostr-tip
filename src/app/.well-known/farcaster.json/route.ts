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
      name: "Boostr",
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/ogImage.png`,
      buttonTitle: "Open Boostr",
      splashImageUrl: `${appUrl}/splash-new.png`,
      splashBackgroundColor: "#E2E8F0",
      webhookUrl: `${appUrl}/api/webhook`,
      subtitle: "Buy attention. Sell influence.",
      description: "A marketplace for buying and selling likes and recasts on Farcaster",
      primaryCategory: "utility",
      ogImageUrl: `${appUrl}/ogImage.png`,
      tags: ["boostr", "likes", "recasts", "like", "recast"],
      heroImageUrl: `${appUrl}/ogImage.png`,
      tagline: "Turn engagement into currency",
      ogTitle: "Boostr",
      ogDescription: "A marketplace for buying and selling likes and recasts on Farcaster",
    },
  };

  return Response.json(config);
}
