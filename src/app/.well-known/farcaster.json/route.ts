export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjI2ODQzOCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDIxODA4RUUzMjBlREY2NGMwMTlBNmJiMEY3RTRiRkIzZDYyRjA2RWMifQ",
      payload: "eyJkb21haW4iOiJib29zdHIuaXRzY2FzaGxlc3MuY29tIn0",
      signature:
        "t4mNptnJUefWqrXY7ZRn6kwnOZrFMa2mjla6KNi6TEhiBaMGDKDF3HKgwXFo4wexoy89Zgn5i7APzjd73yrd4Rw=",
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
