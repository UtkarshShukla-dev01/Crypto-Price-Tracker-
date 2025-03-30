    import express from "express";
    import axios from "axios";
    import bodyParser from "body-parser";

    const app = express();
    const port = 3000;

    app.use(express.static("public"));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.set("view engine", "ejs");

// Function to fetch trending cryptocurrencies with price change
    const getTrendingCryptos = async () => {
    try {
        const response = await axios.get(
        "https://api.coingecko.com/api/v3/search/trending"
        );
        const coins = response.data.coins.slice(0, 5);

        // Extract coin IDs for the next API call
        const coinIds = coins.map((coin) => coin.item.id).join(",");

        // ✅ Fetch detailed price data to get price change info
        const priceResponse = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=btc&include_24hr_change=true`
        );

        // Map through the coins and include price change data
        return coins.map((coin) => ({
        name: coin.item.name,
        symbol: coin.item.symbol,
        price: coin.item.price_btc, // Price in BTC
        image: coin.item.large,
        change:
            priceResponse.data[coin.item.id]?.btc_24h_change?.toFixed(2) || "N/A", // ✅ Correct price change
        }));
    } catch (error) {
        console.error("Error fetching trending data:", error.message);
        return []; // Return empty array if error occurs
    }
    };

    // Home route - Display trending cryptos
    app.get("/", async (req, res) => {
    const trending = await getTrendingCryptos();
    res.render("index", { crypto: null, price: null, trending });
    });

    // Handle form submission - Get specific crypto price
// Handle form submission - Get specific crypto price and change
    app.post("/", async (req, res) => {
        const cryptoName = req.body.crypto.toLowerCase();
        const trending = await getTrendingCryptos(); // Fetch trending again

        try {
            const result = await axios.get(
                `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoName}&vs_currencies=usd&include_24hr_change=true`
            );

            // ✅ Extract price and change
            const price = result.data[cryptoName]?.usd || "Not Available";
            const change = result.data[cryptoName]?.usd_24h_change?.toFixed(2) || "N/A";

            // ✅ Render the updated result
            res.render("index", {
                crypto: cryptoName,
                price: price,
                change: change, // Include change
                trending,
            });
        } catch (error) {
            console.error("Error fetching price data:", error.message);
            res.render("index", { crypto: null, price: null, change: null, trending });
        }
    });


    app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
    });

    