/**
 * A library for Chrome(puppeteer) Utility Functions
 *
 */
import puppeteer from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, Page } from "puppeteer";

import { saveJson, saveFile } from "jnj-lib-base";

// ** Puppeteer
puppeteer.use(stealthPlugin());

export class Chrome {
  url: string;
  options: any;
  headless: any;
  browser: any;
  page: any;
  // client; // OAuth2Client

  // & CONSTRUCTOR
  constructor(url: string) {
    this.url = url;
  }

  // * Lauch Browser(필수)
  async launch(options: any) {
    const headless = options?.headless ?? "new"; // 'new' | true
    const waitSelector = options?.waitSelector ?? "body";
    const slowMo = options?.slowMo ?? 30;

    let opts = {
      headless: headless,
      // executablePath: executablePath(),  // ? Chromium 사용(동영상 강의가 있는 경우 오류 발생)
      executablePath:
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // ? Chrome Browser 사용
      slowMo: slowMo,
    };
    const browser = await puppeteer.launch(opts);
    const [page] = await browser.pages();
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US" }); // ^ page language
    await page.waitForTimeout(1000);

    await page.goto(this.url, { waitUntil: "domcontentloaded" });
    if (waitSelector) {
      await page.waitForSelector(waitSelector);
    }

    this.page = page;
    this.browser = browser;

    return { page, browser };
  }

  // * Login
  async login(
    id: string,
    pw: string,
    idSelector: string,
    pwSelector: string,
    submitSelector?: string,
    isSubmitByKey?: boolean,
    waitSelector?: string
  ) {
    await this.page.type(idSelector, id);
    await this.page.type(pwSelector, pw);
    await this.page.waitForTimeout(1000);

    if (submitSelector) {
      await this.page.evaluate(() => {
        let el = document.querySelector(submitSelector);
        if (!el) {
          console.log("Button not exist!!");
        } else if (el instanceof HTMLElement) {
          console.log("### Button exist!!");
          el.click();
        } else {
          console.log("Button is not HTMLElement!!");
        }
      });
    } else if (isSubmitByKey) {
      await this.page.keyboard.press("Enter");
    } else {
      console.log("Login Submit Error");
    }

    if (waitSelector) {
      await this.page.waitForSelector(waitSelector);
    }

    return { page: this.page, browser: this.browser };
  }

  // * Browser Close
  accessibility(waitSec: number) {
    let snapshot = this.page.accessibility.snapshot();
    console.log(snapshot);
    // saveJson('accessibility.json', snapshot)
  }

  // * Browser Close
  async close(waitSec: number) {
    await this.page.waitForTimeout(waitSec * 1000);
    await this.browser.close();
  }

  // & Sub Utils
  async savePage(path: string) {
    saveFile(path, await this.page.content());
  }
}

// // & TEST
// // * puppeteer
// const url = 'https://www.udemy.com/course/selenium-training/';
// const chrome = new Chrome(url);

// const { browser, page } = await chrome.launch(); // { headless: true }
// await page.goto(url, { waitUntil: 'domcontentloaded' });

// await page.waitForSelector('button[data-purpose="show-more"]');
// await page.$eval('button[data-purpose="show-more"]', (element) => {
//   element.click();
// });

// page.waitForTimeout(100);
// await chrome.savePage('selenium-training.html');
// await browser.close();
