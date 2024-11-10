import { Builder, By, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';
import path from 'path';


// 폴더 찾기
const findFolders = (basePath: string, folderName: string) => {
   const folders = fs.readdirSync(basePath, { withFileTypes: true })
       .filter(dirent => dirent.isDirectory() && dirent.name.startsWith(folderName))
       .map(dirent => dirent.name);
   return folders;
};


// JSON 파일 로드
const loadJson = (filePath: string) => {
   const json = fs.readFileSync(filePath, 'utf8');
   return JSON.parse(json);
};


// 프로필 찾기
const getProfileByEmail = (email = 'bigwhitekmc@gmail.com', userDataDir = undefined) => {
    if (!userDataDir) {
        return null;
    }
   const folders = findFolders(userDataDir, 'Profile');
    for (const folder of folders) {
     const json = loadJson(`${userDataDir}/${folder}/Preferences`);
      if (json.account_info && json.account_info.length > 0) {
       if (json.account_info[0].email === email) {
         return folder.replace(/\\/g, '/').split('/').pop() || null;
       }
     }
   }
    return null;
};


class Chrome {
   private driver: WebDriver;

   constructor(options = {headless: true, profileName: undefined, email: undefined, userDataDir: undefined, arguments: []}) {
       const chromeOptions = new chrome.Options();
      
       // 기본 옵션 설정
       if (options.headless) {
           chromeOptions.addArguments('--headless');
       }
       const profileName = options.profileName ?? getProfileByEmail(options.email, options.userDataDir) ?? null;

       // 프로필 설정
       if (profileName) {
           chromeOptions.addArguments(`--user-data-dir=${options.userDataDir}`);
           chromeOptions.addArguments(`--profile-directory=${profileName}`);
       }

       // 기본 인자
       const defaultArguments = [
           '--disable-gpu',
           '--no-sandbox',
           '--disable-dev-shm-usage',
           '--remote-debugging-port=9222'
       ];

       // 기본 인자와 사용자 지정 인자를 합치기
       const finalArguments = [...defaultArguments, ...(options.arguments || [])];
       
       // 최종 인자 설정
       finalArguments.forEach(arg => chromeOptions.addArguments(arg));

       // 드라이버 초기화
       this.driver = new Builder()
           .forBrowser('chrome')
           .setChromeOptions(chromeOptions)
           .build();
   }


   async getFullSize() {
       let fullHeight = 0;
      
       // 전체 너비 가져오기
       const fullWidth = await this.driver.executeScript(
           'return document.body.parentNode.scrollWidth'
       ) as number;


       // 전체 높이 계산을 위한 스크롤
       while (true) {
           await this.driver.executeScript(
               'window.scrollTo(0, document.body.scrollHeight)'
           );
           await this.driver.sleep(1000);


           const currentHeight = await this.driver.executeScript(
               'return document.body.scrollHeight'
           ) as number;


           if (currentHeight === fullHeight) {
               break;
           }
           fullHeight = currentHeight;
       }


       return { width: fullWidth, height: fullHeight };
   }


   async _getFullScreenshot() {
       try {
           // 페이지 전체 크기 가져오기
           const { width, height } = await this.getFullSize();
          
           // 창 크기 설정
           await this.driver.manage().window().setRect({
               width: width,
               height: height
           });


           // 스크린샷 데이터 반환
           return await this.driver.takeScreenshot();
       } catch (error) {
           console.error('스크린샷 촬영 중 오류 발생:', error);
           throw error;
       }
   }

   async getFullScreenshot() {
       try {
           return await this._getFullScreenshot();
       } finally {
           this.close();
       }
   }


   async saveScreenshot(path: string) {
        try {
            const image = await this._getFullScreenshot();
            fs.writeFileSync(path, image, 'base64');
        } finally {
            this.close();
        }
    }


   async goto(url: string) {
       await this.driver.get(url);
   }


   async close() {
       await this.driver.quit();
  
       // 현재 스크립트의 디렉토리에서 'undefined' 폴더 찾기
       const currentDir = process.cwd();
       const undefinedDir = path.join(currentDir, 'undefined');
      
       // 'undefined' 폴더가 존재하면 삭제
       if (fs.existsSync(undefinedDir)) {
           try {
               fs.rmSync(undefinedDir, { recursive: true, force: true });
               console.log('임시 폴더가 성공적으로 삭제되었습니다.');
           } catch (error) {
               console.error('임시 폴더 삭제 중 오류 발생:', error);
           }
       }
   }

    // 요소 찾기
    async _findElements(by: string, value: string) {
        switch(by.toLowerCase()) {
            case 'id':
                return await this.driver.findElements(By.id(value));
            case 'name':
                return await this.driver.findElements(By.name(value));
            case 'css':
                return await this.driver.findElements(By.css(value));
            case 'xpath':
                return await this.driver.findElements(By.xpath(value));
            default:
                throw new Error(`지원하지 않는 선택자 타입: ${by}`);
        }
    }

    // 요소 찾기(css)
    async findElements(value: string) {
        return await this.driver.findElements(By.css(value));
    }

   // 요소 찾기
   async _findElement(by: string, value: string) {
       switch(by.toLowerCase()) {
           case 'id':
               return await this.driver.findElement(By.id(value));
           case 'name':
               return await this.driver.findElement(By.name(value));
           case 'css':
               return await this.driver.findElement(By.css(value));
           case 'xpath':
               return await this.driver.findElement(By.xpath(value));
           default:
               throw new Error(`지원하지 않는 선택자 타입: ${by}`);
       }
   }

    // 요소 찾기(css)
    async findElement(value: string) {
        return await this.driver.findElement(By.css(value));
    }


   // 페이지 소스 가져오기
   async getPageSource() {
       return await this.driver.getPageSource();
   }

   // 요소의 HTML 가져오기
   async _getElementHtml(by: string, value: string) {
       const element = await this._findElement(by, value);
       return await element.getAttribute('outerHTML');
   }

   // 요소의 HTML 가져오기
    async getElementHtml(value: string) {
        return await (await this.findElement(value)).getAttribute('outerHTML');
    }

   // 요소 클릭
   async _click(by: string, value: string) {
       const element = await this._findElement(by, value);
       await element.click();
   }

    // 요소 클릭
    async click(value: string) {
        const element = await this.findElement(value);
        await element.click();
    }

   // 요소의 텍스트 가져오기
   async _getText(by: string, value: string) {
       const element = await this._findElement(by, value);
       return await element.getText();
   }

   // 요소의 텍스트 가져오기
   async getText(value: string) {
    const element = await this.findElement(value);
    return await element.getText();
}

   // 요소의 속성 가져오기
   async _getAttribute(by: string, value: string, attribute: string) {
       const element = await this._findElement(by, value);
       return await element.getAttribute(attribute);
   }

   // 요소의 속성 가져오기
   async getAttribute(value: string, attribute: string) {
       const element = await this.findElement(value);
       return await element.getAttribute(attribute);
   }

   // 요소에 텍스트 입력하기
   async _sendKeys(by: string, value: string, text: string) {
       const element = await this._findElement(by, value);
       await element.sendKeys(text);
   }

   // 요소에 텍스트 입력하기
   async sendKeys(value: string, text: string) {
       const element = await this.findElement(value);
       await element.sendKeys(text);
   }

   // 특정 요소의 스크린샷 저장
   async _saveElementScreenshot(by: string, value: string, path: string) {
       const element = await this._findElement(by, value);
       const image = await element.takeScreenshot();
       fs.writeFileSync(path, image, 'base64');
   }

   // 특정 요소의 스크린샷 저장
   async saveElementScreenshot(value: string, path: string) {
       const element = await this.findElement(value);
       const image = await element.takeScreenshot();
       fs.writeFileSync(path, image, 'base64');
   }
}

export { Chrome };
// export default Chrome;
// module.exports = Chrome;


// const profile = await getProfileByEmail('bigwhitekmc@gmail.com');
// console.log(profile);


// const ch = new Chrome({
//     headless: true,
//     email: 'bigwhitekmc@gmail.com'
// });


// await ch.goto('https://www.scrapingcourse.com/infinite-scrolling');
// const image = await ch.getFullScreenshot();
// fs.writeFileSync('./screenshot.png', image, 'base64');

// * selenium get source, find element

// driver.page_source

// element_Source = driver.find_element("id","entry_213259").get_attribute("outerHTML")
// print(element_Source)

// selenium click, get text, get attribute, get screenshot, save screenshot
// await submitButton.click();

// let inputField = await driver.findElement(By.name('no_type'));
// let value = await inputField.getAttribute('value');
// console.log(value);