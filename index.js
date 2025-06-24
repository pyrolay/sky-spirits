const PORT = 8000;

const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const urls = [
  "https://sky-children-of-the-light.fandom.com/wiki/Seasonal_Spirits/Friendship_Trees",
  "https://sky-children-of-the-light.fandom.com/wiki/Seasonal_Spirits/Friendship_Trees_2",
  "https://sky-children-of-the-light.fandom.com/wiki/Seasonal_Spirits/Friendship_Trees_3",
];

app.get("/", (req, res) => {
  res.json(
    "This is my web scraper for Sky: Children of the Light Travelling Spirits"
  );
});

function scrapeFromUrl(url) {
  return axios(url)
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      const travellingSpirits = [];
      const seasonSpirits = [];

      $(".wds-tab__content").each((index, element) => {
        const hasTable = $(element).find("table").length > 0;

        if (!hasTable) {
          const name = $(element).find("a").first().text().trim();
          const href = $(element).find("a").first().attr("href");

          if (name && href) {
            seasonSpirits.push({ name, href });
          }
        } else {
          $(element)
            .find(".spirits-table")
            .each((i, spiritEl) => {
              const name = $(spiritEl).find("a").first().text().trim();
              const href = $(spiritEl).find("a").first().attr("href");

              const totalValue = {};

              $(spiritEl)
                .find("tr")
                .filter((_, el) => $(el).text().toLowerCase().includes("total"))
                .find("span.no_wrap")
                .each((_, el) => {
                  const value = $(el).attr("data-sort-value");
                  const type = $(el).find("a").attr("title");

                  if (value && type) {
                    totalValue[type.toLowerCase()] = parseInt(value, 10);
                  }
                });

              if (name && href) {
                travellingSpirits.push({ name, href, totalValue });
              }
            });
        }
      });

      return { travellingSpirits, seasonSpirits };
    })
    .catch((err) => {
      console.error(`Error scraping ${url}:`, err.message);
      return { travellingSpirits: [], seasonSpirits: [] };
    });
}

app.get("/results", async (req, res) => {
  try {
    const results = await Promise.all(urls.map((url) => scrapeFromUrl(url)));

    const allTravellingSpirits = results.flatMap((r) => r.travellingSpirits);
    const allSeasonSpirits = results.flatMap((r) => r.seasonSpirits);

    res.json({
      travellingSpirits: allTravellingSpirits,
      seasonSpirits: allSeasonSpirits,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
