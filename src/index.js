const Nick = require("nickjs");

exports.scrapeWD = (req, res) => {
  const mapRequests = function(asins) {
    const batchRequests = asins.map(asin => scrape(asin));

    Promise.all(batchRequests)
      .then(response => {
        res.status(200).send(response);
      })
      .catch(error => {
        res.status(400).send(error);
      });
  };

  const scraper = function(arg, callback) {
    const title =
      $("#productTitle")
        .text()
        .trim() || "";

    const price = $("#priceblock_ourprice").text() || "";

    const images =
      $("#altImages ul li img")
        .map(function() {
          return $(this).attr("src") || "";
        })
        .get() || [];

    const productDescription =
      $("#feature-bullets ul li span")
        .map(function() {
          return (
            $(this)
              .text()
              .trim() || ""
          );
        })
        .get() || [];

    const productInformation =
      $("#prodDetails table tr")
        .map(function() {
          return {
            title:
              $(this)
                .find("th")
                .text()
                .trim() || "",
            value:
              $(this)
                .find("td")
                .text()
                .trim() || ""
          };
        })
        .slice(0, 5)
        .get() || [];

    callback(null, {
      title,
      price,
      images,
      productDescription,
      productInformation
    });
  };

  async function scrape(asin) {
    const nick = new Nick({
      loadImages: false,
      timeout: 100000,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36"
    });
    const tab = await nick.newTab();
    await tab.open(`https://www.amazon.com/dp/${asin}`);

    try {
      await tab.untilVisible(".navFooterBackToTop", 10000);
    } catch (err) {
      console.log("Cant find navFooterBackToTop - ", err);
    }

    await tab.inject("https://code.jquery.com/jquery-3.2.1.min.js");

    return tab
      .evaluate(scraper)
      .then(res => {
        // console.log('Data: ', res);
        // console.log('Job done!');
        tab.close();
        return res;
      })
      .catch(err => {
        console.log("Something went wrong:", err);
        tab.close();
        return { ERROR: "FAILED" };
      });
  }

  const asins = req.body.asins || [];
  if (asins.length === 0) {
    res.status(400).send("No message defined!");
  } else {
    mapRequests(asins);
  }
};
