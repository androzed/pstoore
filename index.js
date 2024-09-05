const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const app = express();
const port = process.env.PORT || 3000;

async function scrapeWebsite(appId) {
  const url = `https://play.google.com/store/apps/details?id=${appId}`;
  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('Creating new page...');
    const page = await browser.newPage();
    
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    
    console.log('Waiting for button...');
    await page.waitForSelector('.VfPpkd-Bz112c-LgbsSe.yHy1rc.eT1oJ.QDwDD.mN1ivc.VxpoF', { timeout: 10000 });
    
    console.log('Clicking button...');
    await page.click('.VfPpkd-Bz112c-LgbsSe.yHy1rc.eT1oJ.QDwDD.mN1ivc.VxpoF');
    
    console.log('Waiting for content to load...');
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 5000)));
    
    console.log('Getting page content...');
    const data = await page.content();
    
    return data;
  } catch (error) {
    console.error('An error occurred during scraping:', error.message);
    console.error('Error stack:', error.stack);
    if (error.name === 'TimeoutError') {
      console.error('The operation timed out. The page might be loading slowly or the element might not be present.');
    }
    return null;
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
    }
  }
}

function cleanHTML(html) {
  const $ = cheerio.load(html);

  $('style').remove();
  $('script').remove();
  $('link').remove();
  $('meta').remove();
  $('*').removeAttr('style');

  return $.html();
}

app.get('/', async (req, res) => {
  const appId = req.query.id;

  if (!appId) {
    return res.status(400).send('Please provide an app ID using the "id" query parameter.');
  }

  try {
    console.log(`Starting scrape for app ID: ${appId}`);
    const data = await scrapeWebsite(appId);
    if (data) {
      console.log('Cleaning HTML...');
      const cleanedData = cleanHTML(data);
      console.log('Scraping and cleaning completed successfully.');
      res.send(cleanedData);
    } else {
      console.log('Scraping failed to return data.');
      res.status(500).send('Failed to scrape data');
    }
  } catch (error) {
    console.error('Error in route handler:', error);
    res.status(500).send('An error occurred while processing your request.');
  }
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});