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


       // 추가 옵션 설정
       if (options.arguments) {
           options.arguments.forEach(arg => chromeOptions.addArguments(arg));
       }
      
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


   async getFullScreenshot() {
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


   async saveScreenshot(path: string) {
       const image = await this.getFullScreenshot();
       fs.writeFileSync(path, image, 'base64');
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

